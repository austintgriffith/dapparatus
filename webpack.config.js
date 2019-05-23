var path = require('path');
var fs = require('fs');

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.js',
    dapparatus: './src/dapparatus.js',
    gas: './src/gas.js',
    metamask: './src/metamask.js',
    transactions: './src/transactions.js',
    contractloader: './src/contractloader.js',
    events: './src/events.js',
    scaler: './src/scaler.js',
    blockie: './src/blockie.js',
    address: './src/address.js',
    button: './src/button.js',
    qrcodescanner: './src/qrcodescanner/index.js',
    qrcodedisplay: './src/qrcodedisplay/index.js',
    erc20icon: './src/erc20icon.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|build)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 81920
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  externals: fs.readdirSync('node_modules').reduce((externals, module) => {
    externals[module] = module;
    return externals;
  }, {}),
};
