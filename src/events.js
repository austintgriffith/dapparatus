import React, { Component } from 'react';
import deepmerge from 'deepmerge';
import Web3 from 'web3';
let interval
const LOOKBACK = 8//number of blocks that could pass without the interval firing
const BLOCKSPERREAD = 250000//size of chunks to scan at a time
const CHECKEVENTS = 377

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
        thisEvent.blockNumber = newEvents[e].blockNumber
        if(!events[thisEvent[id]]){
          events[thisEvent[id]]=thisEvent
          onUpdate(thisEvent,events);
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
          thisEvent.blockNumber = newEvents[e].blockNumber
          if(!events[thisEvent[id]]){
            events[thisEvent[id]]=thisEvent
            onUpdate(thisEvent,events);
          }
        }
      }catch(e){console.log(e)}
    }
    this.setState({events:events})
  }
  render() {
    if(this.state.config.hide){
      return false
    } else {
      let events = []
      this.state.events.map((eventData)=>{
        events.push(
          <div key={"event"+eventData[this.props.id]}>
            event {eventData[this.props.id]}
          </div>
        )
      })
      return (
        <div style={{padding:10}}>
          <b>Events</b>
          {events}
        </div>
      );
    }
  }
}

export default Events;
