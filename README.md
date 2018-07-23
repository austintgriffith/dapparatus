# Dapparat.us

After building out a handful of Dapps in React, I decided to carve out all the common components and provide them in an NPM package.

Should help get a Dapp up and running quickly so you can focus on your functionality, not wrestling with the blockchain and ethereum network.

## install

```
npm install --save dapparatus
```

## import

```
import { Metamask, Gas, ContractLoader, Transactions, Events, Scaler } from "dapparatus"
```

## usage

### Metamask

```
<Metamask
  /*config={{requiredNetwork:['Ropsten']}}*/
  onUpdate={(state)=>{
    console.log("metamask state update:",state)
    if(state.web3Provider) {
      state.web3 = new Web3(state.web3Provider)
      this.setState(state)
    }
  }}
/>
```

### Gas

```
<Gas
  onUpdate={(state)=>{
    console.log("Gas price update:",state)
    this.setState(state,()=>{
      console.log("GWEI set:",this.state)
    })
  }}
/>
```

### Transactions

```
<Transactions
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
/>
```

## ContractLoader

```
<ContractLoader
  web3={web3}
  require={path => {return require(`${__dirname}/${path}`)}}
  onReady={(contracts)=>{
    console.log("contracts loaded",contracts)
    this.setState({contracts:contracts})
  }}
/>
```

### Events

```
<Events
  contract={contracts.Nifties}
  eventName={"Create"}
  block={block}
  id={"_id"}
  filter={{_owner:account}}
  onUpdate={(eventData,allEvents)=>{
    console.log("EVENT DATA:",eventData)
    this.setState({events:allEvents})
  }}
/>
```

### Scaler
