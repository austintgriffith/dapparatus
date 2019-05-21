const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

exports.debug = false;

function getPrivateKeyFromMnemonic(mnemonic) {
	const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
	const wallet_hdpath = "m/44'/60'/0'/0/";

	const wallet = hdwallet.derivePath(wallet_hdpath + '0').getWallet();
	const privateKey = wallet._privKey.toString('hex');
	const account = '0x' + wallet.getAddress().toString('hex').toUpperCase();

	if (exports.debug)
		console.log({
			mnemonic: mnemonic,
			privateKey: privateKey,
			account: account
		});

	return privateKey;
}

exports.getPrivateKeyFromMnemonic = getPrivateKeyFromMnemonic;