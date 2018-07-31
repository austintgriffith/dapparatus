import React, { Component } from 'react';
import deepmerge from 'deepmerge';
let defaultConfig = {}
defaultConfig.DEBUG = false;
defaultConfig.size = 2

import Blockies from 'react-blockies';

class Blockie extends Component {
  constructor(props) {
    super(props);
    let config = defaultConfig
    if(props.config) {
      config = deepmerge(config, props.config)
    }
    this.state = {
      config:config
    }
  }
  render() {
    return (
      <Blockies
        seed={this.props.address.toLowerCase()}
        scale={this.state.config.size}
      />
    )
  }
}

export default Blockie;
