import React, { Component } from 'react';
import './App.css';
import { Dapparatus, Gas, ContractLoader, Transactions, Events, Scaler, Blockie, Address, Button } from "dapparatus"
import Web3 from 'web3';

//requires some stuff to be installed:
//  bouncer-proxy -> clevis test full
//  mkdir ~/dapparatus/demoapp/src/contracts
//  cp ~/bouncer-proxy/src/contracts/* ~/dapparatus/demoapp/src/contracts/
//  mkdir ~/dapparatus/demoapp/Example
//  cp ~/bouncer-proxy/Example/* ~/dapparatus/demoapp/Example/
//  in demoapp: clevis test publish

const METATX = {
  endpoint:"http://0.0.0.0:10001/",
  contract:"0xf5bf6541843D2ba2865e9aeC153F28aaD96F6fbc",
  //accountGenerator: "//account.metatx.io",
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 4,
      doingTransaction: false,
    }
  }
  componentDidMount(){
    this.poll()
    setInterval(this.poll.bind(this),999)
  }
  handleInput(e){
    let update = {}
    update[e.target.name] = e.target.value
    this.setState(update)
  }
  async poll(){
    if(this.state){
      let {contracts} = this.state
      if(contracts){
        this.setState({count:await contracts.Example.count().call()})
      }
    }
  }
  render() {
    let {web3,account,contracts,tx,gwei,block,avgBlockTime,etherscan} = this.state
    let connectedDisplay = []
    let contractsDisplay = []
    if(web3){
      connectedDisplay.push(
       <Gas
         key="Gas"
         onUpdate={(state)=>{
           console.log("Gas price update:",state)
           this.setState(state,()=>{
             console.log("GWEI set:",this.state)
           })
         }}
       />
      )

      connectedDisplay.push(
        <ContractLoader
         key="ContractLoader"
         config={{DEBUG:true}}
         web3={web3}
         require={path => {return require(`${__dirname}/${path}`)}}
         onReady={(contracts,customLoader)=>{
           console.log("contracts loaded",contracts)
           this.setState({contracts:contracts},async ()=>{
             console.log("Contracts Are Ready:",this.state.contracts)
           })
         }}
         onReady={(contracts,customLoader)=>{
            console.log("contracts loaded",contracts)
            this.setState({contracts:contracts},async ()=>{

                console.log("====!! Loading dyamic contract "+METATX.contract)
                let metaContract = customLoader("BouncerProxy",METATX.contract)//new this.state.web3.eth.Contract(require("./contracts/BouncerProxy.abi.js"),this.state.address)
                console.log("====!! metaContract:",metaContract)
                this.setState({metaContract:metaContract})

            })
          }}
        />
      )
      connectedDisplay.push(
        <Transactions
          key="Transactions"
          config={{DEBUG:false}}
          metaAccount={this.state.metaAccount}
          metaContract={this.state.metaContract}
          metatx={METATX}
          account={account}
          gwei={gwei}
          web3={web3}
          block={block}
          avgBlockTime={avgBlockTime}
          etherscan={etherscan}
          onReady={(state)=>{
            console.log("Transactions component is ready:",state)
            this.setState(state)
          }}
          onReceipt={(transaction,receipt)=>{
            // this is one way to get the deployed contract address, but instead I'll switch
            //  to a more straight forward callback system above
            console.log("Transaction Receipt",transaction,receipt)
          }}
        />
      )

      if(contracts){
        contractsDisplay.push(
          <div key="UI" style={{padding:30}}>
            <div style={{fontSize:40}}>
              {this.state.count}
            </div>
            <Button size="2" onClick={()=>{
                tx(contracts.Example.addAmount(3),50000,(receipt)=>{
                  console.log("addAmount RESULT:",receipt)
                })
              }}>
              addAmount(3)
            </Button>
          </div>
        )
      }

    }
    return (
      <div className="App">
        <Dapparatus
          config={{
            DEBUG:false,
            requiredNetwork:['Unknown','Rinkeby'],
          }}
          metatx={METATX}
          fallbackWeb3Provider={new Web3.providers.HttpProvider('http://0.0.0.0:8545')}
          onUpdate={(state)=>{
           console.log("metamask state update:",state)
           if(state.web3Provider) {
             state.web3 = new Web3(state.web3Provider)
             this.setState(state)
           }
          }}
        />
        {connectedDisplay}
        {contractsDisplay}

      </div>
    );
  }
}

export default App;
