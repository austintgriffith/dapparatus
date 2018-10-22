import React, { Component } from 'react';
import deepmerge from 'deepmerge';
import eth from './assets/ethereum.png';
import Blockie from './blockie.js';
import ENS from 'ethereum-ens';

let interval;
let defaultConfig = {};
defaultConfig.DEBUG = false;
defaultConfig.POLLINTERVAL = 1337;
defaultConfig.showBalance = true;
defaultConfig.showBlockie = true;
defaultConfig.blockieSize = 2;
defaultConfig.showAddress = true;
defaultConfig.ETHPRECISION = 10000;

class Address extends Component {
  constructor(props) {
    console.log('ADDRESS constructor', props);
    super(props);
    let config = defaultConfig;
    if (props.config) {
      config = deepmerge(config, props.config);
    }
    this.state = {
      etherscan: '',
      config: config,
      ensName: ''
    };
  }
  async componentDidMount() {
    interval = setInterval(
      this.load.bind(this),
      this.state.config.POLLINTERVAL
    );
    this.load();

    let ens = new ENS(
      this.props.web3.currentProvider,
      '0xe7410170f87102df0055eb195163a03b7f2bff4a'
    ); //,"0xe7410170f87102df0055eb195163a03b7f2bff4a"

    //let metatxrReverse = await ens.reverse("0xcfa240ec070e33611930b8fe3db74c8d7aad4592")
    //console.log("metatxrReverse name",await metatxrReverse.name())
    //console.log("metatxrReverse content",await metatxrReverse.content())
    //console.log("metatxrReverse name",await metatxrReverse.name())

    if (this.state.config.DEBUG)
      console.log('attempting to ens reverse account....');
    try {
      var address = ens
        .reverse(this.props.address)
        .name()
        .catch(err => {
          if (this.state.config.DEBUG)
            console.log(
              'catch ens error (probably just didn\'t find it, ignore silently)'
            );
        })
        .then(data => {
          console.log('ENS data', data);
          if (data) {
            this.setState({ ens: data });
          }
        });
    } catch (e) {}
  }
  componentWillUnmount() {
    clearInterval(interval);
  }
  load() {
    window.web3.eth.getBalance(this.props.address, (err, balance, e) => {
      if (balance) {
        if (typeof balance == 'string') {
          balance = parseFloat(balance) / 1000000000000000000;
        } else {
          balance = balance.toNumber() / 1000000000000000000;
        }
        this.setState({ balance: balance });
      }
    });
  }
  render() {
    let balance = '';
    if (this.state.config.showBalance) {
      balance = (
        <span>
          <img
            style={{
              maxHeight: 24,
              padding: 2,
              verticalAlign: 'middle',
              marginTop: -4
            }}
            src={eth}
          />
          {Math.round(this.state.balance * this.state.config.ETHPRECISION) /
            this.state.config.ETHPRECISION}
        </span>
      );
    }

    let displayName = this.props.address; //.substr(0,this.state.config.accountCutoff)
    if (this.state.ens) displayName = this.state.ens;

    let blockie = '';
    if (this.state.config.showBlockie) {
      blockie = (
        <Blockie
          config={{ size: this.state.config.blockieSize }}
          address={this.props.address.toLowerCase()}
        />
      );
    }

    let nameString = '';
    if (this.state.config.showAddress) {
      nameString = (
        <span style={{ paddingLeft: 7, paddingRight: 2 }}>{displayName}</span>
      );
    }

    return (
      <a
        target="_blank"
        href={this.props.etherscan + 'address/' + this.props.address}
      >
        {blockie}
        {nameString}
        {balance}
      </a>
    );
  }
}
export default Address;
/*
<span onClick={()=>{
  console.log("REVERSE REGISTER")
  let ens = new ENS(this.props.web3.currentProvider,"0xe7410170f87102df0055eb195163a03b7f2bff4a");
  ens.setOwner("0x72544a608fecf531d658fd6c7769462e7c4c6234cf07b41bee9ba80e1938a707",this.props.account.toLowerCase()).then((a,b)=>{
    console.log("callback",a,b)
  })
}}>
  R
</span>
 */
