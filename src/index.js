import 'idempotent-babel-polyfill';

import Dapparatus from './dapparatus';
import Gas from './gas';
import Metamask from './metamask';
import Web3 from './metamask';
import Transactions from './transactions';
import ContractLoader from './contractloader';
import Events from './events';
import Scaler from './scaler';
import Blockie from './blockie';
import Address from './address';
import Button from './button';
import QRCodeScanner from './qrcodescanner';
import QRCodeDisplay from './qrcodedisplay';
import ERC20Icon from './erc20icon';
import PrivateKeyCatcher from './privatekeycatcher';
/*
export default {
  Dapparatus,
  Gas,
  Metamask,
  Web3,
  Transactions,
  ContractLoader,
  Events,
  Scaler,
  Blockie,
  Address,
  Button,
  QRCodeScanner,
  QRCodeDisplay,
  ERC20Icon
};*/

module.exports['Gas'] = Gas;
module.exports['Metamask'] = Metamask;
module.exports['Transactions'] = Transactions;
module.exports['ContractLoader'] = ContractLoader;
module.exports['Events'] = Events;
module.exports['Scaler'] = Scaler;
module.exports['Blockie'] = Blockie;
module.exports['Address'] = Address;
module.exports['Button'] = Button;
module.exports['Dapparatus'] = Dapparatus;
module.exports['QRCodeScanner'] = QRCodeScanner;
module.exports['QRCodeDisplay'] = QRCodeDisplay;
module.exports['ERC20Icon'] = ERC20Icon;
module.exports['PrivateKeyCatcher'] = PrivateKeyCatcher;
