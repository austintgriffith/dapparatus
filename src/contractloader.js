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
  contractLoader(contractName,customAddress){
    let {require} = this.props
    let {DEBUG} = this.state.config
    let resultingContract
    try{
      let contractObject = {
        address:require("contracts/"+contractName+".address.js"),
        abi:require("contracts/"+contractName+".abi.js"),
        blocknumber:require("contracts/"+contractName+".blocknumber.js"),
      }
      if(customAddress){
        contractObject.address = customAddress
      }
      if(DEBUG) console.log("ContractLoader - Loading ",contractName,contractObject)
      let contract = new this.props.web3.eth.Contract(contractObject.abi,contractObject.address)
      resultingContract = contract.methods
      resultingContract._blocknumber = contractObject.blocknumber
      resultingContract._address = contractObject.address
      resultingContract._abi = contractObject.abi
      resultingContract._contract = contract
    }catch(e){
      console.log("ERROR LOADING CONTRACT "+contractName,e)
    }
    return resultingContract
  }
  componentDidMount(){
    let {require} = this.props
    let {DEBUG} = this.state.config
    let contractList = require("contracts/contracts.js")
    if(DEBUG) console.log("ContractLoader - Loading Contracts",contractList)
    let contracts = {}
    for(let c in contractList){
      let contractName = contractList[c];
      contracts[contractName] = this.contractLoader(contractName)
    }
    this.setState({contracts:contracts},()=>{
      this.props.onReady(this.state.contracts,this.contractLoader.bind(this))
    })
  }
  render(){
    if(this.state.config.hide){
      return false
    } else {
      let contractDisplay = []
      if(this.state.contracts){
        for(let c in this.state.contracts){
          contractDisplay.push(
            <div key={"contract"+c} style={{margin:5,padding:5}}>
              {c} ({this.state.contracts[c]._address}) - #{this.state.contracts[c]._blocknumber}
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
    }
  }
}
export default ContractLoader;
