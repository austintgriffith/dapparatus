import React, { Component } from 'react'
import cookie from 'react-cookies'
import deepmerge from 'deepmerge'
import logo from './metamask.png'
import eth from './ethereum.png'
import Scaler from "./scaler.js"
import Blockies from 'react-blockies'
import ENS from 'ethereum-ens'
import Web3 from 'web3';
import Button from "./button.js"

let interval
let defaultConfig = {}
defaultConfig.DEBUG = false;
defaultConfig.POLLINTERVAL = 777
defaultConfig.showBalance = true
defaultConfig.hideNetworks = [
  "Mainnet"
]
defaultConfig.accountCutoff = 16
defaultConfig.outerBoxStyle = {
  float:'right'
}
defaultConfig.ETHPRECISION = 10000
defaultConfig.boxStyle = {
  paddingRight:75,
  marginTop:0,
  paddingTop:0,
  zIndex:10,
  textAlign:"right",
  width:300,
}
defaultConfig.boxStyleBefore = {
  zIndex:9999,
  marginTop:3,
  paddingTop:7,
  zIndex:10,
  color:"#666666",
  textAlign:"right",
  width:450,
}
defaultConfig.textStyle = {
  fontSize: 20,
  fontWeight:'bold',
  color:"#666666",
}
defaultConfig.warningStyle = {
  fontWeight:'bold',
  fontSize:24,
}
defaultConfig.blockieStyle = {
  size: 6,
  top: 10,
  right: 15
}
defaultConfig.requiredNetwork = [
  "Mainnet",
  "Unknown"//allow local RPC for testing
]
class Dapparatus extends Component {
  constructor(props) {
    super(props);
    let config = defaultConfig
    if(props.config) {
      config = deepmerge(config, props.config)
      if(props.config.requiredNetwork){ config.requiredNetwork = props.config.requiredNetwork}
    }
    const { cookies } = props;
    let metaAccountCookie = cookie.load('metaAccount')
    let metaAccount
    let account = 0
    if(metaAccountCookie){
      let tempweb3 = new Web3()
      metaAccount = tempweb3.eth.accounts.privateKeyToAccount(metaAccountCookie.privateKey);
      account = metaAccount.address
    }

    this.state = {
      status:"loading",
      network:0,
      account:account,
      etherscan:"",
      config: config,
      avgBlockTime: 15000,
      lastBlockTime: 0,
      metaAccount: metaAccount,
      metatx: this.props.metatx
    }
  }
  componentDidMount(){
    interval = setInterval(this.checkMetamask.bind(this),this.state.config.POLLINTERVAL)
    this.checkMetamask()
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  checkMetamask() {
    if(this.state.config.DEBUG) console.log("DAPPARATUS - checking state...")
    if (typeof window.web3 == 'undefined') {
      console.log("Connecting to infura...")
      window.web3 = new Web3(this.props.fallbackWeb3Provider) //CORS ISSUES!//
      //window.web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws'))
    }

    if (typeof window.web3 == 'undefined') {
      if(this.state.config.DEBUG) console.log("DAPPARATUS - no web3")
      if(this.state.status=="loading"){
        this.setState({status:"noweb3"},()=>{this.props.onUpdate(this.state)})
      }else if(this.state.status!="noweb3"){
        if(this.state.config.DEBUG) console.log("DAPPARATUS - lost web3")
        window.location.reload(true);
        this.setState({status:"error"},()=>{this.props.onUpdate(this.state)})
      }
    } else {
      if(this.state.config.DEBUG) console.log("DAPPARATUS - yes web 3",window.web3)

      if(typeof window.web3.version.getNetwork != "function"){
        window.window.web3.eth.net.getId((err,network)=>{
          console.log("NETWORK GETID",err,network)
          this.inspectNetwork(network)
        })
      }else{
        window.web3.version.getNetwork((err,network)=>{
          this.inspectNetwork(network)
        })
      }


    }
  }
  inspectNetwork(network){
    if(this.state.config.DEBUG) console.log("DAPPARATUS - network",network)
    network = translateNetwork(network);
    if(this.state.config.DEBUG) console.log("DAPPARATUS - translated network",network)
    let accounts
    try{
      window.web3.eth.getAccounts((err,_accounts)=>{

        if(!_accounts||_accounts.length<=0||network=="Unknown"||network=="Private"){
          if(this.state.config.DEBUG) console.log("DAPPARATUS - no inject accounts - generate? ")
          if(!this.state.metaAccount||!this.state.metaAccount.address){
            this.setState({status:"noaccount"},()=>{this.props.onUpdate(this.state)})
          }else{
            let currentAccounts = []
            console.log("generated account",this.state.metaAccount)
            currentAccounts.push(this.state.metaAccount.address)
            console.log("currentAccounts",currentAccounts)
            this.inspectAccounts(currentAccounts,network)
          }
        }else{
          if(this.state.config.DEBUG) console.log("DAPPARATUS - injected account: ",_accounts)
          this.inspectAccounts(_accounts,network)
        }
      })
    }catch(e){
      console.log(e)
      if(this.state.metamask!=-1) this.setState({metamask:-1,network:network,web3:web3})
    }
  }
  inspectAccounts(currentAccounts,network){
    if(this.state.config.DEBUG) console.log("DAPPARATUS - accounts:",currentAccounts,this.state.account)
    if(currentAccounts&&this.state.account){
      if(currentAccounts.length<=0){
        //window.location.reload(true);
        console.log("RELOAD BECAUSE LOST ACCOUNTS?")
      }else if(this.state.account!=currentAccounts[0].toLowerCase()){
        //window.location.reload(true);
        console.log("RELOAD BECAUSE DIFFERENT ACCOUNTS?")
      }
    }
    if(!currentAccounts){
      if(this.state.status!="error") this.setState({status:"error",network:network},()=>{this.props.onUpdate(this.state)})
    } else if(currentAccounts.length<=0){
      if(this.state.status!="locked") this.setState({status:"locked",network:network},()=>{this.props.onUpdate(this.state)})
    } else{
      this.loadBlockBalanceAndName(currentAccounts[0].toLowerCase(),network)
    }
  }
  loadBlockBalanceAndName(account,network){
    window.web3.eth.getBlockNumber((err,block)=>{
      window.web3.eth.getBalance(""+account,(err,balance,e)=>{
        if(typeof balance == "string"){
          balance = parseFloat(balance)/1000000000000000000
        }else{
          balance=balance.toNumber()/1000000000000000000
        }

        let etherscan="https://etherscan.io/"
        if(network){
          if(network=="Unknown"||network=="private"){
            etherscan = "http://localhost:8000/#/"
          }else if(network!="Mainnet"){
            etherscan = "https://"+network.toLowerCase()+".etherscan.io/"
          }
        }
        if(this.state.config.DEBUG) console.log("DAPPARATUS - etherscan",etherscan)
        if(this.state.status!="ready"||this.state.block!=block||this.state.balance!=balance) {
          web3 = new Web3(window.web3.currentProvider)
          let ens = new ENS(window.web3.currentProvider);
          if(this.state.config.DEBUG)console.log("attempting to ens reverse account....")
          try {
            var address = ens.reverse(account).name().catch((err)=>{
              if(this.state.config.DEBUG) console.log("catch ens error (probably just didn't find it, ignore silently)")
            }).then((data) => {
               console.log("ENS data",data)
               if(data){
                 this.setState({ens:data},()=>{this.props.onUpdate(this.state)})
               }

            });
          }catch(e){}


          console.log("Saving web3, generated account:",this.state.metaAccount,web3)
          let update = {
            status:"ready",
            block:block,
            balance:balance,
            network:network,
            web3Provider:window.web3.currentProvider,
            etherscan:etherscan,
            account:account,
            metaAccount:this.state.metaAccount
          }
          if(block!=this.state.block){
            //block update
            if(this.state.lastBlockTime){
                let timeItTook = Date.now() - this.state.lastBlockTime
                update.avgBlockTime = Math.round(this.state.avgBlockTime*4/5 + timeItTook/5)
            }
            update.lastBlockTime = Date.now()
          }
          this.setState(update,()=>{this.props.onUpdate(this.state)})
        }
      })
    })
  }
  render(){
    let dapparatus = "loading."
    if(this.state.status=="loading"){
      dapparatus = (
        <a target="_blank"  href="https://metamask.io/">
        <span style={this.state.config.textStyle}>
          loading...
        </span>
        <img style={{maxHeight:45,padding:5,verticalAlign:"middle"}}
        src={logo}
        />
        </a>
      )
    }else if(this.state.status=="noweb3"){
      dapparatus = (
        <a target="_blank"  href="https://metamask.io/">
        <span style={this.state.config.textStyle}>
          No Web3 Connection
        </span>
        <img style={{maxHeight:45,padding:5,verticalAlign:"middle"}}
        src={logo}
        />
        </a>
      )
    }else if(this.state.status=="noaccount"){
      let mmClick = ()=>{
        window.open('https://metamask.io', '_blank');
      }
      dapparatus = (
        <div style={this.state.config.boxStyleBefore}>
          <Button color={"blue"} onClick={()=>{
              let result = window.web3.eth.accounts.create();
              console.log("GENERATE",result)
              const expires = new Date()
              expires.setDate(expires.getDate() + 365)
              cookie.save('metaAccount', result, { path: '/',expires})
              this.setState({metaAccount:result,account:result.address})
            }}>
            Generate Account
          </Button>
          <Button color={"orange"} onClick={()=>{
              alert("go to wallet offerings and educate")
            }}>
            Install Wallet
          </Button>
        </div>
      )
    } else if(this.state.status=="locked"){
      dapparatus = (
        <div style={this.state.config.boxStyleBefore}>
          <span style={this.state.config.warningStyle}>
              Please Unlock MetaMask
          </span>
          <img style={{maxHeight:45,padding:5,verticalAlign:"middle"}}
            src={logo}
          />
        </div>
      )
    } else if(this.state.status=="error"){
      dapparatus = (
        <div>
        <span style={this.state.config.warningStyle}>
          Error Connecting
        </span>
        <img style={{maxHeight:45,padding:5,verticalAlign:"middle"}}
         src="metamaskhah.png"
        />
        </div>
      )
    } else if(this.state.status=="ready"){

        let requiredNetworkText = ""
        for(let n in this.state.config.requiredNetwork){
          if(this.state.config.requiredNetwork[n]!="Unknown"){
            if(requiredNetworkText!="") requiredNetworkText+="or "
            requiredNetworkText+=this.state.config.requiredNetwork[n]+" "
          }
        }
        if(this.state.config.requiredNetwork&&this.state.config.requiredNetwork.indexOf(this.state.network)<0){
             dapparatus = (
               <div>
                 <span style={this.state.config.warningStyle}>
                    Please switch network to {requiredNetworkText}
                 </span>
                 <img style={{maxHeight:45,padding:5,verticalAlign:"middle"}}
                   src={logo}
                 />
               </div>
             )
         }else{
           let network = this.state.network
           if(this.state.config.hideNetworks.indexOf(network)>=0) network=""
           let balance = ""
           if(this.state.config.showBalance){
             balance = Math.round(this.state.balance*this.state.config.ETHPRECISION)/this.state.config.ETHPRECISION
           }

           let displayName = this.state.account.substr(0,this.state.config.accountCutoff)
           if(this.state.ens) displayName = this.state.ens

           dapparatus = (
             <div style={this.state.config.boxStyle}>
               <a target="_blank" href={this.state.etherscan+"address/"+this.state.account}>
                 <div>
                   <span style={this.state.config.textStyle}>
                     {displayName}
                   </span>
                 </div>
                 <div>
                   <span style={this.state.config.textStyle}>
                     {network}   <img style={{maxHeight:24,padding:2,verticalAlign:"middle",marginTop:-4}} src={eth}/>{balance}
                   </span>
                 </div>
                 <div style={{position:"absolute",right:this.state.config.blockieStyle.right,top:this.state.config.blockieStyle.top}} onClick={this.clickBlockie}>
                   <Blockies
                   seed={this.state.account}
                   scale={this.state.config.blockieStyle.size}
                   />
                 </div>
               </a>
             </div>
           )
         }
    }else{
      dapparatus = "error unknown state: "+this.state.status
    }
    return (
      <div style={this.state.config.outerBoxStyle}>
        <Scaler config={{origin:"top right",adjustedZoom:1.5}}>
          {dapparatus}
        </Scaler>
      </div>
    )
  }
}
export default Dapparatus;


function translateNetwork(network){
  if(network==5777){
    return "Private";
  }else if(network==1){
    return "Mainnet";
  }else if(network==2){
    return "Morden";
  }else if(network==3){
    return "Ropsten";
  }else if(network==4){
    return "Rinkeby";
  }else if(network==42){
    return "Kovan";
  }else{
    return "Unknown";
  }
}
