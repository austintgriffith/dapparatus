import React from 'react';
import Web3 from 'web3';
let base64url = require('base64url')

export default class PrivateKeyCatcher extends React.Component {
  componentDidMount(){
    if(window.location.pathname){
      console.log("PATH",window.location.pathname,window.location.pathname.length,window.location.hash)
      if(window.location.pathname.indexOf("/pk")>=0){
        let tempweb3 = new Web3();
        let base64encodedPK = window.location.hash.replace("#","")
        let rawPK = tempweb3.utils.bytesToHex(base64url.toBuffer(base64encodedPK))
        if(typeof this.props.newPrivateKey == "function"){
          this.props.newPrivateKey(rawPK)
        }else{
          this.setState({
            newPrivateKey:rawPK,
          })
        }

        window.history.pushState({},"", "/");
      }
    }
  }
  render() {
    return "";
  }
}
