import React, { Component } from 'react';
import deepmerge from 'deepmerge';
import {Motion, spring, presets} from 'react-motion'
import { Line, Circle } from 'rc-progress';
import Scaler from "./scaler.js"
import Web3 from 'web3';
import { soliditySha3 } from 'web3-utils';
import axios from 'axios';

let interval

let defaultConfig = {}
defaultConfig.DEBUG = false;
defaultConfig.hide = false;
defaultConfig.TIMETOKEEPTXSAROUND = 90000;
defaultConfig.CHECKONTXS = 731;
defaultConfig.GASLIMITMULTIPLIER = 1.2;
defaultConfig.EXPECTEDPROGRESSBARVSAVGBLOCKTIME = 2.1;
defaultConfig.DEFAULTGASLIMIT = 120000;


const METATXPOLL = 1777

class Transactions extends Component {
  constructor(props) {
    super(props);
    let config = defaultConfig
    if(props.config) {
      config = deepmerge(config, props.config)
    }
    this.state = {
      transactions:[],
      currentBlock:0,
      config: config,
      callbacks: {}
    }
    if(props.metatx){
      this.metaTxPoll()
      setInterval(this.metaTxPoll.bind(this),METATXPOLL)
    }
  }
  metaTxPoll(){
    let metatxUrl = this.props.metatx.endpoint+'txs/'+this.props.account
    axios.get(metatxUrl, {
      headers: {
          'Content-Type': 'application/json',
      }
    }).then((response)=>{
      if(response&&response.data){
        let currentTransactions = this.state.transactions
        let callbacks = this.state.callbacks
        let changed = false
        for(let d in response.data){
          let thisTransaction =  response.data[d]
          let found = false
          for(let t in currentTransactions){
            if(currentTransactions[t].hash == thisTransaction.hash){
              found = true
            }
          }
          if(!found){
            console.log("INCOMING META TX:",response.data[d])
            changed=true
            if(this.state.config.DEBUG) console.log("Adding tx to list...")
            currentTransactions.push(thisTransaction)
            callbacks[transactionHash] = ()=>{
              console.log("META TX FINISHED",transactionHash)
            }
          }
        }
        if(changed){
          this.setState({transactions:currentTransactions,callbacks:callbacks})
        }
      }
    })
    .catch((error)=>{
      console.log(error);
    });
  }
  componentDidMount(){
    interval = setInterval(this.checkTxs.bind(this),this.state.config.CHECKONTXS)
    this.checkTxs()
    this.props.onReady({
      metatx: async (tx,maxGasLimit,txData,cb)=>{
        if(this.state.config.DEBUG) console.log("YOU WANT TO SEND A META TX ",tx,this.props.gwei)
        let callback = cb
        let value = 0
        this.sendMetaTx(this.props.metatx.contract,this.props.metaAccount.address,tx._parent._address,value,tx.encodeABI())
      },
      tx: async (tx,maxGasLimit,txData,value,cb)=>{
        if(this.state.config.DEBUG) console.log("YOU WANT TO SEND TX ",tx,this.props.gwei)
        let callback = cb

        console.log("==MM meta:",this.props.metaAccount)

        if(this.props.metaAccount){
          console.log("================&&&& metaAccount, send as metatx to relayer "+this.props.metatx.endpoint+" to contract :",this.props.metatx.contract)
          let _value = 0
          this.sendMetaTx(this.props.metatx.contract,this.props.metaAccount.address,tx._parent._address,_value,tx.encodeABI())
        }else{
          let gasLimit
          if(typeof maxGasLimit != "function"){
            gasLimit = maxGasLimit
          }else{
            try{
              gasLimit = Math.round((await tx.estimateGas()) * this.state.config.GASLIMITMULTIPLIER)
            }catch(e){
              gasLimit = this.state.DEFAULTGASLIMIT
            }
          }
          if(typeof maxGasLimit == "function"){
            callback = maxGasLimit
          }

          if(!value) value=0
          let paramsObject = {
            from: this.props.account,
            value: value,
            gas: gasLimit,
            gasPrice: Math.round(this.props.gwei * 1000000000)
          }

          console.log("TX",paramsObject)

          if(typeof txData == "function"){
            callback = txData
          }else if(txData){
            paramsObject.data = txData
          }

          if(this.state.config.DEBUG) console.log("gasLimit",gasLimit)
          if(this.state.config.DEBUG) console.log("this.props.gwei",this.props.gwei)
          tx.send(paramsObject,(error, transactionHash)=>{
            if(this.state.config.DEBUG) console.log("TX CALLBACK",error,transactionHash)
            let currentTransactions = this.state.transactions
            let found = false
            for(let t in currentTransactions){
              if(currentTransactions[t].hash == transactionHash){
                found = true
              }
            }
            if(!found){
              if(this.state.config.DEBUG) console.log("Adding tx to list...")
              let currentTransactions = this.state.transactions
              currentTransactions.push({hash:transactionHash,time:Date.now(),addedFromCallback:1})
              let callbacks = this.state.callbacks
              callbacks[transactionHash] = callback
              this.setState({transactions:currentTransactions,callbacks:callbacks})
            }
          }).on('error',(err,receiptMaybe)=>{
            console.log("TX ERROR",err,receiptMaybe)
            let currentTransactions = this.state.transactions
            for(let t in currentTransactions){
              let errString = err.toString()
              if(currentTransactions[t].hash&&errString.indexOf(currentTransactions[t].hash)>0){
                //let outofgas = errString.indexOf("ran out of gas")
                //if(outofgas>0){
                //  currentTransactions[t].errorCode = 2
                //}else{
                  currentTransactions[t].errorCode = 1
                //}
              }
            }
            this.setState({transactions:currentTransactions})
          })
          .on('transactionHash',(transactionHash)=>{
            if(this.state.config.DEBUG) console.log("TX HASH",transactionHash)
            let currentTransactions = this.state.transactions
            let found = false
            for(let t in currentTransactions){
              if(currentTransactions[t].hash == transactionHash){
                found = true
              }
            }
            if(!found){
              if(this.state.config.DEBUG) console.log("Adding tx to list...")
              let currentTransactions = this.state.transactions
              currentTransactions.push({hash:transactionHash,time:Date.now(),addedFromTxHash:1})
              this.setState({transactions:currentTransactions})
            }
          })
          .on('receipt',(receipt)=>{
            if(this.state.config.DEBUG) console.log("TX RECEIPT",receipt)
            let currentTransactions = this.state.transactions
            for(let t in currentTransactions){
              if(currentTransactions[t].hash == receipt.transactionHash){
                currentTransactions[t].receipt = 1
              }
            }
            this.setState({transactions:currentTransactions})
          }).
          on('confirmation', (confirmations,receipt)=>{
            if(this.state.config.DEBUG) console.log("TX CONFIRM",confirmations,receipt)
            let currentTransactions = this.state.transactions
            for(let t in currentTransactions){
              if(currentTransactions[t].hash == receipt.transactionHash){
                if(!currentTransactions[t].confirmations) currentTransactions[t].confirmations=1
                else currentTransactions[t].confirmations = currentTransactions[t].confirmations+1
              }
            }
            this.setState({transactions:currentTransactions})
          })
          .then((receipt)=>{
            if(this.state.config.DEBUG) console.log("TX THEN",receipt)
            let currentTransactions = this.state.transactions
            for(let t in currentTransactions){
              if(currentTransactions[t].hash == receipt.transactionHash){
                currentTransactions[t].then = 1
              }
            }
            this.setState({transactions:currentTransactions})
          });
        }
      }
    })
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  async sendMetaTx(proxyAddress,fromAddress,toAddress,value,txData){
    let {metaContract,account,web3} = this.props
    const nonce = await metaContract.nonce(fromAddress).call()
    console.log("Current nonce for "+fromAddress+" is ",nonce)
    let rewardAddress = "0x0000000000000000000000000000000000000000"
    let rewardAmount = 0
    /*if(this.state.rewardTokenAddress){
      if(this.state.rewardTokenAddress=="0"||this.state.rewardTokenAddress=="0x0000000000000000000000000000000000000000"){
        rewardAddress = "0x0000000000000000000000000000000000000000"
        this.setState({rewardTokenAddress:rewardAddress})
        rewardAmount = web3.utils.toWei(this.state.rewardToken+"", 'ether')
        console.log("rewardAmount",rewardAmount)
      }else{
        rewardAddress = this.state.rewardTokenAddress
        rewardAmount = this.state.rewardToken
      }
    }*/

    console.log("Reward: "+rewardAmount+" tokens at address "+rewardAddress)


    const parts = [
      proxyAddress,
      fromAddress,
      toAddress,
      web3.utils.toTwosComplement(value),
      txData,
      rewardAddress,
      web3.utils.toTwosComplement(rewardAmount),
      web3.utils.toTwosComplement(nonce),
    ]
    console.log("PARTS",parts)
    const hashOfMessage = soliditySha3(...parts);
    const message = hashOfMessage
    console.log("sign",message)
    console.log(this.props.metaAccount.privateKey)
    let sig = this.props.web3.eth.accounts.sign(message, this.props.metaAccount.privateKey);
    //let sig = await this.props.web3.eth.personal.sign(""+message,account)
    console.log("SIG",sig)
    let postData = {
      gas: this.state.gasLimit,
      message: message,
      parts:parts,
      sig:sig.signature,
    }


    axios.post(this.props.metatx.endpoint+'tx', postData, {
      headers: {
          'Content-Type': 'application/json',
      }
    }).then((response)=>{
      console.log("TX RESULT",response)
    })
    .catch((error)=>{
      console.log(error);
    });
  }
  checkTxs() {
    let {web3,block} = this.props
    let {transactions,currentBlock,callbacks} = this.state
    if(this.state.config.DEBUG) console.log(" ~~ tx ~~ ")
    for(let t in transactions){
      if(!transactions[t].fullReceipt&&transactions[t].hash){
        if(this.state.config.DEBUG) console.log(" ~~ tx ~~ checking in on "+transactions[t].hash)
        web3.eth.getTransactionReceipt(transactions[t].hash,(err,receipt)=>{
          if(receipt){
            if(this.state.config.DEBUG) console.log(" ~~ tx ~~ GOT RECEPIT FOR ",transactions[t].hash)
            let currentTransactions = this.state.transactions
            for(let t in currentTransactions){
              if(currentTransactions[t].hash == receipt.transactionHash){
                if(!currentTransactions[t].fullReceipt){
                  if(this.state.config.DEBUG) console.log(" ~~ tx ~~ SETTING FULL RECEIPT ",transactions[t].hash)
                  currentTransactions[t].fullReceipt = receipt
                  if(typeof this.props.onReceipt =="function"){
                    this.props.onReceipt(currentTransactions[t],receipt)
                  }
                  if(callbacks[currentTransactions[t].hash] && typeof callbacks[currentTransactions[t].hash] == "function"){
                    callbacks[currentTransactions[t].hash](receipt)
                  }
                }

              }
            }
            this.setState({transactions:currentTransactions})
          }
        })
      }else if(!transactions[t].closed && (transactions[t].receipt || transactions[t].block || transactions[t].errorCode)){
        if(!transactions[t].block || currentBlock!=transactions[t].block){

          let timePassed = Date.now()-transactions[t].time
          if(timePassed > this.state.config.TIMETOKEEPTXSAROUND){
            transactions[t].closed = true
            if(this.state.config.DEBUG) console.log("CLOSING TX",transactions[t])
            this.setState({transactions:transactions})
          }
        }

      }
    }

    if(!currentBlock){
      currentBlock = block+1
      let currentTransactions = this.state.transactions
      currentTransactions.push({block:block+1,time:Date.now()})
      this.setState({transactions:currentTransactions,currentBlock:block+1})
    }else{
      if(currentBlock!=block+1){
        let currentTransactions = this.state.transactions
        currentTransactions.push({block:block+1,time:Date.now()})
        this.setState({transactions:currentTransactions,currentBlock:block+1})
      }else{
        this.setState({currentTime:Date.now()})//to force a rerender
      }
    }

  }
  render() {
    let transactions = []
    this.state.transactions.map((transaction)=>{
      if(transaction.hash){
        let shortHash = transaction.hash.substring(0,14)
        let timePassed = Date.now()-transaction.time
        //transactions expected to take 1.5 the time blocks are taking
        let percent = Math.min(100,Math.round(timePassed*100/(this.props.avgBlockTime*this.state.config.EXPECTEDPROGRESSBARVSAVGBLOCKTIME*1.5)))

        let outAmount = 10
        let complete = 0
        let stroke = "#2db7f5"
        if(transaction.fullReceipt){
          stroke="#4ee426"
          complete = 1
          percent = 100
        } else if(percent<15){
          stroke = "#c8e3f0"
        } else if(percent<30){
          stroke = "#9bd6f0"
        } else if(percent<60){
          stroke = "#7ccbef"
        }

        if(transaction.closed){
          outAmount = -250
        }
        if(percent>=100&&!complete){
          stroke="#e4d426"
        }

        if(transaction.errorCode==1){
          stroke="#e93636"
        } else if(transaction.errorCode==2){
          stroke="#e9a336"
        }

        transactions.push(
          <Motion key={"tx"+transaction.hash}
            defaultStyle={{
              outAmount:-250
            }}
            style={{
              outAmount:spring(outAmount,{ stiffness: 80, damping: 8 })
            }}
            >
            {currentStyles => {
              return (

                <div style={{position:"relative",width:200,height:31,marginTop:5,right:currentStyles.outAmount}}>
                  <a target="_blank" href={this.props.etherscan+"tx/"+transaction.hash}><Line percent={percent} width={50} strokeWidth="20" strokeColor={stroke} /> {shortHash}</a>
                </div>
              )
            }}
          </Motion>

        )
      }else if(transaction.block){
        let timePassed = Date.now()-transaction.time
        let percent = Math.min(100,Math.round(timePassed*100/(this.props.avgBlockTime*this.state.config.EXPECTEDPROGRESSBARVSAVGBLOCKTIME)))
        //let loadedPercent = Math.round(timePassed*100/this.props.avgBlockTime)/100
        let complete = 0
        let outAmount = 10
        let stroke = "#2db7f5"
        if(this.state.currentBlock!=transaction.block){
          complete = 1
          percent = 100
          stroke="#4ee426"
        }else if(percent<15){
          stroke = "#c8e3f0"
        } else if(percent<30){
          stroke = "#9bd6f0"
        } else if(percent<60){
          stroke = "#7ccbef"
        }
        if(transaction.closed){
          outAmount = -200
        }
        if(percent>=100&&!complete){
          stroke="#e4d426"
        }


        transactions.push(
          <Scaler config={{origin:"bottom right",adjustedZoom:1.2}} key={"block"+transaction.block}>
            <Motion
              defaultStyle={{
                outAmount:-200
              }}
              style={{
                outAmount:spring(outAmount,{ stiffness: 80, damping: 8 })
              }}
              >
              {currentStyles => {
                return (
                  <div style={{position:"relative",width:200,height:31,margin:10,right:currentStyles.outAmount}}>
                      <a target="_blank" href={this.props.etherscan+"block/"+transaction.block}><Line width={100} percent={percent} strokeWidth="10" strokeColor={stroke} /> #{transaction.block} </a>
                  </div>
                )
              }}
            </Motion>
          </Scaler>
        )
      }
    })

    let height = 40*transactions.length
    //<div style={{width:"100%",height:"100%",backgroundColor:"#FFFFFF",opacity:0.15,position:"absolute",left:0,top:0}}></div>
    return (
        <div style={{fontSize:16,zIndex:10,position:'fixed',paddingTop:30,marginBottom:0,textAlign:"right",bottom:100,right:0,opacity:1,height:height,width:220,paddingLeft:10}}>
          {transactions}
        </div>
    )
  }
}

export default Transactions;
