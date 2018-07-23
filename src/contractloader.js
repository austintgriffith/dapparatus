import React, { Component } from 'react';
import Blockies from 'react-blockies';
import deepmerge from 'deepmerge';
let defaultConfig = {}
defaultConfig.DEBUG = true;
defaultConfig.hide = true;
class ContractLoader extends Component {
  constructor(props) {
    super(props);
    let config = defaultConfig
    if(props.config) {
      config = deepmerge(config, props.config)
    }
    this.state = {
      config: config,
      contracts: {}
    }
  }
  componentDidMount(){
    let {require} = this.props
    let {DEBUG} = this.state.config
    let contractList = require("contracts/contracts.js")
    if(DEBUG) console.log("ContractLoader - Loading Contracts",contractList)
    let contracts = {}
    for(let c in contractList){
      let contractName = contractList[c];
      let contractObject = {
        address:require("contracts/"+contractName+".address.js"),
        abi:require("contracts/"+contractName+".abi.js"),
        blocknumber:require("contracts/"+contractName+".blocknumber.js"),
      }
      try{
        if(DEBUG) console.log("ContractLoader - Loading ",contractList[c],contractObject.address)
        let contract = new this.props.web3.eth.Contract(contractObject.abi,contractObject.address)
        contracts[contractName] = contract.methods
        contracts[contractName]._blocknumber = contractObject.blocknumber
        contracts[contractName]._address = contractObject.address
        contracts[contractName]._abi = contractObject.abi
        contracts[contractName]._contract = contract
      }catch(e){
        console.log("ERROR LOADING CONTRACT "+contractName,e)
      }
    }
    this.setState({contracts:contracts},()=>{
      this.props.onReady(this.state.contracts)
    })
  }
  render(){
    if(!this.state.config.hide){
      let contractDisplay = []
      if(this.state.contracts){
        for(let c in this.state.contracts){
          contractDisplay.push(
            <div key={"contract"+c} style={{margin:5,padding:5}}>
              {c} ({this.state.contracts[c]._address}) - #{this.state.contracts[c].blocknumber}
            </div>
          )
        }
      }else{
        contractDisplay = "Loading..."
      }
      return (
        <div style={{padding:10}}>
          <b>Contracts</b>
          {contractDisplay}
        </div>
      )
    }else{
      return false
    }
  }
}
export default ContractLoader;
