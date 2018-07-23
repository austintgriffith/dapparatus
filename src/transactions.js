import React, { Component } from 'react';
import deepmerge from 'deepmerge';
import {Motion, spring, presets} from 'react-motion'
import { Line, Circle } from 'rc-progress';
import Scaler from "./scaler.js"
import Web3 from 'web3';

let interval

let defaultConfig = {}
defaultConfig.DEBUG = false;
defaultConfig.hide = false;
defaultConfig.TIMETOKEEPTXSAROUND = 90000;
defaultConfig.CHECKONTXS = 731;
defaultConfig.GASLIMITMULTIPLIER = 1.1;
defaultConfig.EXPECTEDPROGRESSBARVSAVGBLOCKTIME = 1.8;

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
    }
  }
  componentDidMount(){
    interval = setInterval(this.checkTxs.bind(this),this.state.config.CHECKONTXS)
    this.checkTxs()
    this.props.onReady({
      tx: async (tx)=>{
        if(this.state.config.DEBUG) console.log("YOU WANT TO SEND TX ",tx,this.props.gwei)
        let gasLimit
        try{
          gasLimit = Math.round((await tx.estimateGas()) * this.state.config.GASLIMITMULTIPLIER)
        }catch(e){
          gasLimit = 400000
        }

        if(this.state.config.DEBUG) console.log("gasLimit",gasLimit)
        if(this.state.config.DEBUG) console.log("this.props.gwei",this.props.gwei)
        tx.send({
          from: this.props.account,
          gas:gasLimit,
          gasPrice:Math.round(this.props.gwei * 1000000000)
        },(error, transactionHash)=>{
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
            this.setState({transactions:currentTransactions})
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
    })
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  checkTxs() {

    let {web3,block} = this.props
    let {transactions,currentBlock} = this.state

    for(let t in transactions){
      if(!transactions[t].receipt&&transactions[t].hash){
        web3.eth.getTransactionReceipt(transactions[t].hash,(err,receipt)=>{
          if(receipt){
            let currentTransactions = this.state.transactions
            for(let t in currentTransactions){
              if(currentTransactions[t].hash == receipt.transactionHash){
                currentTransactions[t].fullReceipt = receipt
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
        let shortHash = transaction.hash.substring(0,16)
        let timePassed = Date.now()-transaction.time
        let percent = Math.min(100,Math.round(timePassed*100/this.props.avgBlockTime))

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
          outAmount = -200
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
              outAmount:-200
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
                  <div style={{position:"relative",width:200,height:31,marginTop:10,right:currentStyles.outAmount}}>
                      <a target="_blank" href={this.props.etherscan+"block/"+transaction.block}><Line width={100} percent={percent} strokeWidth="10" strokeColor={stroke} /> #{transaction.block} </a>
                  </div>
                )
              }}
            </Motion>
          </Scaler>
        )
      }
    })

    let height = 36*transactions.length
    return (
        <div style={{zIndex:10,position:'fixed',paddingTop:30,marginBottom:0,textAlign:"right",bottom:100,right:0,opacity:1,height:height,width:200}}>
          {transactions}
        </div>
    )
  }
}

export default Transactions;
