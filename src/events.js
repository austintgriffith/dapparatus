import React, { Component } from 'react'
import deepmerge from 'deepmerge'
import Web3 from 'web3'
import md5  from 'md5'
let interval
const LOOKBACK = 6//number of blocks that could pass without the interval firing
const BLOCKSPERREAD = 250000//size of chunks to scan at a time
const CHECKEVENTS = 799

let defaultConfig = {}
defaultConfig.DEBUG = false;
defaultConfig.hide = true;

class Events extends Component {
  constructor(props) {
    super(props);
    let config = defaultConfig
    if(props.config) {
      config = deepmerge(config, props.config)
    }
    this.state = {
      events:[],
      config: config,
    }
  }
  componentDidMount(){
    interval = setInterval(this.checkEvents.bind(this),CHECKEVENTS)
    this.checkEvents()
    this.doFullEventScan()
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  async checkEvents(){
    let {contract,eventName,filter,onUpdate,block,id} = this.props
    let {events} = this.state
    let from = block-LOOKBACK
    from=Math.max(0,from)
    let newEvents
    try{
      if(filter){
        newEvents = await contract._contract.getPastEvents(eventName, {
          filter: filter,
          fromBlock: from,
          toBlock: block
        });
      }else{
        newEvents = await contract._contract.getPastEvents(eventName, {
          fromBlock: from,
          toBlock: block
        });
      }
      for(let e in newEvents){
        let thisEvent = newEvents[e].returnValues
        let keyArray = Object.keys(thisEvent)
        let keyCount = keyArray.length
        let eventObject = {}
        for(let k=keyCount/2;k<keyCount;k++){
          eventObject[keyArray[k]] = thisEvent[keyArray[k]]
        }
        eventObject.blockNumber = newEvents[e].blockNumber
        eventObject.hash = newEvents[e].transactionHash
        let idSafe = id
        if(!idSafe){
          idSafe = md5(JSON.stringify(eventObject))
        }
        if(this.state.config.DEBUG) console.log("CHECKED EVENT:",idSafe,eventObject)
        if(!events[idSafe]){
          events[idSafe]=eventObject
          onUpdate(eventObject,events);
          this.setState({events:events})
        }
      }
    }catch(e){console.log(e)}
  }
  async doFullEventScan(){
    let {contract,eventName,filter,onUpdate,block,id} = this.props
    let contractDeployBlock = contract._blocknumber
    let {events} = this.state
    let to
    let from
    let lastRead=false
    while(!lastRead){
      if(!to){
        to = block
        from = block-BLOCKSPERREAD
      }else{
        to = from
        from = to-BLOCKSPERREAD
      }
      if(from<=contractDeployBlock) lastRead=true
      from = Math.max(contractDeployBlock,from)
      if(this.state.config.DEBUG) console.log("SCAN FOR EVENT:",eventName,"FROM",from,"to",to,contract)
      let {events} = this.state
      let newEvents
      try{
        if(filter){
          newEvents = await contract._contract.getPastEvents(eventName, {
            filter: filter,
            fromBlock: from,
            toBlock: block
          });
        }else{
          newEvents = await contract._contract.getPastEvents(eventName, {
            fromBlock: from,
            toBlock: block
          });
        }
        for(let e in newEvents){
          let thisEvent = newEvents[e].returnValues
          let keyArray = Object.keys(thisEvent)
          let keyCount = keyArray.length
          let eventObject = {}
          for(let k=keyCount/2;k<keyCount;k++){
            eventObject[keyArray[k]] = thisEvent[keyArray[k]]
          }
          eventObject.blockNumber = newEvents[e].blockNumber
          eventObject.hash = newEvents[e].transactionHash
          let idSafe = id
          if(!idSafe){
            idSafe = md5(JSON.stringify(eventObject))
          }
          if(this.state.config.DEBUG) console.log("SCANNED EVENT:",idSafe,eventObject)
          if(!events[idSafe]){
            events[idSafe]=eventObject
            onUpdate(eventObject,events)
          }
        }
      }catch(e){console.log(e)}
    }
    this.setState({events:events})
  }
  render() {
    let {eventName,filter,onUpdate,block,id} = this.props
    if(this.state.config.hide){
      return false
    } else {
      let events = []
      for(let e in this.state.events){
        events.push(
          <div key={"event"+eventName+e} style={{fontSize:12}}>
            {JSON.stringify(this.state.events[e])}
          </div>
        )
      }
      if(!events){
        events = (
          <div>(no events)</div>
        )
      }
      return (
        <div style={{padding:10}}>
          <b>---  {eventName}  -------</b>
          {events}
        </div>
      );
    }
  }
}

export default Events;
