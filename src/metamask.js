import React, { Component } from 'react';
import deepmerge from 'deepmerge';
import logo from './assets/metamask.png';
import eth from './assets/ethereum.png';
import Scaler from './scaler.js';
import Blockies from 'react-blockies';
import ENS from 'ethereum-ens';

let interval;
let defaultConfig = {};
defaultConfig.DEBUG = false;
defaultConfig.POLLINTERVAL = 191;
defaultConfig.showBalance = true;
defaultConfig.hideNetworks = ['Mainnet'];
defaultConfig.accountCutoff = 16;
defaultConfig.outerBoxStyle = {
  float: 'right'
};
defaultConfig.ETHPRECISION = 10000;
defaultConfig.boxStyle = {
  paddingRight: 75,
  marginTop: 0,
  paddingTop: 0,
  zIndex: 10,
  textAlign: 'right',
  width: 300
};
defaultConfig.boxStyleBefore = {
  zIndex: 9999,
  marginTop: 3,
  paddingTop: 7,
  zIndex: 10,
  color: '#666666',
  textAlign: 'right',
  width: 450
};
defaultConfig.textStyle = {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#666666'
};
defaultConfig.warningStyle = {
  fontWeight: 'bold',
  fontSize: 24
};
defaultConfig.blockieStyle = {
  size: 6,
  top: 10,
  right: 15
};
defaultConfig.requiredNetwork = [
  'Mainnet',
  'Unknown' //allow local RPC for testing
];
class Metamask extends Component {
  constructor(props) {
    super(props);
    let config = defaultConfig;
    if (props.config) {
      config = deepmerge(config, props.config);
      if (props.config.requiredNetwork && props.config.requiredNetwork[0] != "") {
        config.requiredNetwork = props.config.requiredNetwork;
      }
    }
    this.state = {
      status: 'loading',
      network: 0,
      account: 0,
      etherscan: '',
      config: config,
      avgBlockTime: 15000,
      lastBlockTime: 0,
      hasRequestedAccess: false
    };
  }
  componentDidUpdate() {
    if (this.props.config) {
      const requiredNetwork = this.props.config.requiredNetwork;
      let config = this.state.config;
      if (requiredNetwork && requiredNetwork[0] != "" && config.requiredNetwork != requiredNetwork){
        config.requiredNetwork = requiredNetwork;
        this.setState({config: config});
      }
    }
  }
  componentDidMount() {
    interval = setInterval(
      this.checkMetamask.bind(this),
      this.state.config.POLLINTERVAL
    );
    this.checkMetamask();
  }
  componentWillUnmount() {
    clearInterval(interval);
  }
  checkMetamask() {
    if (this.state.config.DEBUG) console.log('METAMASK - checking state...');
    if (typeof window.web3 == 'undefined') {
      if (this.state.status == 'loading') {
        if (this.state.config.DEBUG) console.log('METAMASK - no web3');
        this.setState({ status: 'noweb3' }, () => {
          this.props.onUpdate(this.state);
        });
      } else if (this.state.status != 'noweb3') {
        if (this.state.config.DEBUG) console.log('METAMASK - lost web3');
        window.location.reload(true);
        this.setState({ status: 'error' }, () => {
          this.props.onUpdate(this.state);
        });
      }
    } else {
      if (this.state.config.DEBUG) console.log('METAMASK - yes web 3');
      if (!this.state.hasRequestedAccess) { // Prevent multiple prompts
        if (this.state.config.DEBUG) console.log('METAMASK - requesting access from user...');
        this.setState({ hasRequestedAccess: true},() => {
          this.props.onUpdate(this.state);
        });
        try{
          window.ethereum.enable();
        } catch (e) {
          console.log(e);
          this.setState({ status: 'private', network: network },() => {
            this.props.onUpdate(this.state);
          });
        }
      }
      else {
        window.web3.version.getNetwork((err, network) => {
          if (this.state.config.DEBUG) console.log('METAMASK - network', network);
          network = translateNetwork(network);
          if (this.state.config.DEBUG)
          console.log('METAMASK - translated network', network);
          let accounts;
          try {
            window.web3.eth.getAccounts((err, _accounts) => {
              if (this.state.config.DEBUG)
              console.log('METAMASK - accounts', _accounts);
              if (
                _accounts &&
                this.state.account &&
                this.state.account != _accounts[0]
              ) {
                window.location.reload(true);
              }
              if (err) {
                console.log('metamask error', err);
                if (this.state.status != 'error')
                this.setState({ status: 'error', network: network }, () => {
                  this.props.onUpdate(this.state);
                });
              } else {
                if (!_accounts) {
                  if (this.state.status != 'error')
                  this.setState({ status: 'error', network: network }, () => {
                    this.props.onUpdate(this.state);
                  });
                } else if (_accounts.length <= 0) {
                  if (this.state.status != 'locked')
                  this.setState({ status: 'locked', network: network }, () => {
                    this.props.onUpdate(this.state);
                  });
                } else {
                  window.web3.eth.getBlockNumber((err, block) => {
                    window.web3.eth.getBalance(
                      '' + _accounts[0],
                      (err, balance, e) => {
                        balance = balance.toNumber() / 1000000000000000000;
                        let etherscan = 'https://etherscan.io/';
                        if (network) {
                          if (network == 'Unknown' || network == 'private') {
                            etherscan = 'http://localhost:8000/#/';
                          } else if (network != 'Mainnet') {
                            etherscan =
                            'https://' +
                            network.toLowerCase() +
                            '.etherscan.io/';
                          }
                        }
                        if (this.state.config.DEBUG)
                        console.log('METAMASK - etherscan', etherscan);
                        if (
                          this.state.status != 'ready' ||
                          this.state.block != block ||
                          this.state.balance != balance
                        ) {
                          web3 = new Web3(window.web3.currentProvider);
                          let ens = {};
                          if (['Unknown', "Private"].indexOf(network) === -1) {
                            let ens = new ENS(window.web3.currentProvider);
                            if (this.state.config.DEBUG)
                            console.log('attempting to ens reverse account....');
                            try {
                              let rev = ens.reverse(_accounts[0]);
                              if (rev) {
                                var address = rev
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
                                    this.setState({ ens: data }, () => {
                                      this.props.onUpdate(this.state);
                                    });
                                  }
                                });
                              }
                            } catch (e) {}
                          }

                          let update = {
                            status: 'ready',
                            block: block,
                            balance: balance,
                            network: network,
                            web3Provider: window.web3.currentProvider,
                            etherscan: etherscan,
                            account: _accounts[0]
                          };
                          if (block != this.state.block) {
                            //block update
                            if (this.state.lastBlockTime) {
                              let timeItTook =
                              Date.now() - this.state.lastBlockTime;
                              update.avgBlockTime = Math.round(
                                (this.state.avgBlockTime * 4) / 5 + timeItTook / 5
                              );
                            }
                            update.lastBlockTime = Date.now();
                          }
                          this.setState(update, () => {
                            this.props.onUpdate(this.state);
                          });
                        }
                      }
                    );
                  });
                }
              }
            });
          } catch (e) {
            console.log(e);
            if (this.state.metamask != -1)
            this.setState({ metamask: -1, network: network, web3: web3 });
          }
        });
      }
    }
  }
  render() {
    let metamask = 'loading.';
    if (this.props.config.hide) {
      metamask = [];
    }
    else if (this.state.status == 'loading') {
      metamask = (
        <a target="_blank" href="https://metamask.io/">
          <span style={this.state.config.textStyle}>loading...</span>
          <img
            style={{ maxHeight: 45, padding: 5, verticalAlign: 'middle' }}
            src={logo}
          />
        </a>
      );
    } else if (this.state.status == 'noweb3') {
      let mmClick = () => {
        window.open('https://metamask.io', '_blank');
      };
      metamask = (
        <div style={this.state.config.boxStyleBefore} onClick={mmClick}>
          <a target="_blank" href="https://metamask.io/">
            <span style={this.props.warningStyle}>Please Install MetaMask</span>
            <img
              style={{ maxHeight: 45, padding: 5, verticalAlign: 'middle' }}
              src={logo}
            />
          </a>
        </div>
      );
    } else if (this.state.status == 'locked') {
      metamask = (
        <div style={this.state.config.boxStyleBefore}>
          <span style={this.state.config.warningStyle}>
            Please Unlock MetaMask
          </span>
          <img
            style={{ maxHeight: 45, padding: 5, verticalAlign: 'middle' }}
            src={logo}
          />
        </div>
      );
    } else if (this.state.status == 'error') {
      metamask = (
        <div>
          <span style={this.state.config.warningStyle}>Error Connecting</span>
          <img
            style={{ maxHeight: 45, padding: 5, verticalAlign: 'middle' }}
            src={logo}
          />
        </div>
      );
    } else if (this.state.status == 'ready') {
      let requiredNetworkText = '';
      for (let n in this.state.config.requiredNetwork) {
        if (this.state.config.requiredNetwork[n] != 'Unknown' && this.state.config.requiredNetwork[n] != '') {
          if (requiredNetworkText != '') requiredNetworkText += 'or ';
          requiredNetworkText += this.state.config.requiredNetwork[n] + ' ';
        }
      }
      if (
        this.state.config.requiredNetwork &&
        this.state.config.requiredNetwork.indexOf(this.state.network) < 0
      ) {
        metamask = (
          <div>
            <span style={this.state.config.warningStyle}>
              Please switch network to {requiredNetworkText}
            </span>
            <img
              style={{ maxHeight: 45, padding: 5, verticalAlign: 'middle' }}
              src={logo}
            />
          </div>
        );
      } else {
        let network = this.state.network;
        if (this.state.config.hideNetworks.indexOf(network) >= 0) network = '';
        let balance = '';
        if (this.state.config.showBalance) {
          balance =
            Math.round(this.state.balance * this.state.config.ETHPRECISION) /
            this.state.config.ETHPRECISION;
        }

        let displayName = this.state.account.substr(
          0,
          this.state.config.accountCutoff
        );
        if (this.state.ens) displayName = this.state.ens;

        metamask = (
          <div style={this.state.config.boxStyle}>
            <a
              target="_blank"
              href={this.state.etherscan + 'address/' + this.state.account}
            >
              <div>
                <span style={this.state.config.textStyle}>{displayName}</span>
              </div>
              <div>
                <span style={this.state.config.textStyle}>
                  {network}{' '}
                  <img
                    style={{
                      maxHeight: 24,
                      padding: 2,
                      verticalAlign: 'middle',
                      marginTop: -4
                    }}
                    src={eth}
                  />
                  {balance}
                </span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: this.state.config.blockieStyle.right,
                  top: this.state.config.blockieStyle.top
                }}
                onClick={this.clickBlockie}
              >
                <Blockies
                  seed={this.state.account}
                  scale={this.state.config.blockieStyle.size}
                />
              </div>
            </a>
          </div>
        );
      }
    } else {
      metamask = 'error unknown state: ' + this.state.status;
    }
    return (
      <div style={this.state.config.outerBoxStyle}>
        <Scaler config={{ origin: 'top right', adjustedZoom: 1.5 }}>
          {metamask}
        </Scaler>
      </div>
    );
  }
}
export default Metamask;
function translateNetwork(network) {
  if (network == 5777) {
    return 'Private';
  } else if (network == 1) {
    return 'Mainnet';
  } else if (network == 2) {
    return 'Morden';
  } else if (network == 3) {
    return 'Ropsten';
  } else if (network == 4) {
    return 'Rinkeby';
  } else if (network == 42) {
    return 'Kovan';
  } else {
    return 'Unknown';
  }
}
