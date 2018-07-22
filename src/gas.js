import React, { Component } from 'react'
import axios from "axios"
const GASBOOSTPRICE = 0.11 //gwei

let pollInterval
let pollTime = 39007

class Gas extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gwei: 21
    }
  }
  componentDidMount(){
    pollInterval = setInterval(this.checkOnGasPrices.bind(this),pollTime)
    this.checkOnGasPrices()
  }
  componentWillUnmount(){
    clearInterval(pollInterval)
  }
  checkOnGasPrices(){
    axios.get("https://ethgasstation.info/json/ethgasAPI.json")
    .then((response)=>{
      if(response.data.average>0&&response.data.average<200){
        response.data.average=response.data.average+(GASBOOSTPRICE*10)
        let setMainGasTo = Math.round(response.data.average*100)/1000
        if(this.state.gwei!=setMainGasTo){
          let update = {gwei:setMainGasTo}
          this.setState(update)
          this.props.onUpdate(update)
        }
      }
    })
  }
  render() {

    return (
      <div style={{padding:10}}>
        <b>Gas</b>
        <div><i>{this.state.gwei} wei</i></div>
      </div>
    );
  }
}

export default Gas;
