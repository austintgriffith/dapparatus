import React, { Component } from 'react';
import Web3 from 'web3';

const GASLIMITMULTIPLIER = 1.1

class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      transactions:[]
    }
  }
  componentDidMount(){
    this.props.onReady({
      tx: async (tx)=>{
        console.log("YOU WANT TO SEND TX ",tx,this.props.gwei)
        let gasLimit = Math.round((await tx.estimateGas()) * GASLIMITMULTIPLIER)
        tx.send({
          from: this.props.account,
          gas:gasLimit,
          gasPrice:Math.round(this.props.gwei * 1000000000)
        },(error, transactionHash)=>{
          console.log("TX CALLBACK",error,transactionHash)
          let currentTransactions = this.state.transactions
          let found = false
          for(let t in currentTransactions){
            if(currentTransactions[t].hash == transactionHash){
              found = true
            }
          }
          if(!found){
            console.log("Adding tx to list...")
            let currentTransactions = this.state.transactions
            currentTransactions.push({hash:transactionHash,time:Date.now(),addedFromCallback:1})
            this.setState({transactions:currentTransactions})
          }
        }).on('error',(a,b,c)=>{
          console.log("TX ERROR",a,b,c)

        })
        .on('transactionHash',(transactionHash)=>{
          console.log("TX HASH",transactionHash)
          let currentTransactions = this.state.transactions
          let found = false
          for(let t in currentTransactions){
            if(currentTransactions[t].hash == transactionHash){
              found = true
            }
          }
          if(!found){
            console.log("Adding tx to list...")
            let currentTransactions = this.state.transactions
            currentTransactions.push({hash:transactionHash,time:Date.now(),addedFromTxHash:1})
            this.setState({transactions:currentTransactions})
          }
        })
        .on('receipt',(receipt)=>{
          console.log("TX RECEIPT",receipt)
          let currentTransactions = this.state.transactions
          for(let t in currentTransactions){
            if(currentTransactions[t].hash == receipt.transactionHash){
              currentTransactions[t].receipt = 1
            }
          }
          this.setState({transactions:currentTransactions})
        }).
        on('confirmation', (confirmations,receipt)=>{
          console.log("TX CONFIRM",confirmations,receipt)
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
          console.log("TX THEN",receipt)
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
  render() {
    let transactions = []
    this.state.transactions.map((transaction)=>{
      let shortHash = transaction.hash.substring(0,6)
      let timePassed = Date.now()-transaction.time
      //let loadedPercent = Math.round(timePassed*100/this.props.avgBlockTime)/100
      transactions.push(
        <div key={"tx"+transaction.hash}>
          TX {shortHash} ({transaction.callback}) ({transaction.receipt}) ({transaction.then}) [{transaction.confirmations}] [{transaction.addedFromCallback},{transaction.addedFromTxHash}]
        </div>
      )
    })
    return (
      <div style={{padding:10}}>
        <b>Transactions</b>
        {transactions}
      </div>
    );
  }
}

export default Transactions;
