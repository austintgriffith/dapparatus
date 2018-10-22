import React, { Component } from 'react';
import PropTypes from 'prop-types';
import qrImage from 'qr-image';
import './style.css';

class QRCodeDisplay extends Component {
  constructor() {
    super();
    img: ''
  }

  componentDidMount() {
    this.updateQRCodeImage();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.data !== this.props.data) {
      this.setState({ data: this.props.data });
      this.updateQRCodeImage();
    }
  }

  updateQRCodeImage() {
    this.setState({ img: '' });
    if (this.props.data) {
      const img = qrImage.imageSync(this.props.data, { type: 'svg' });
      this.setState({ img });
    }
  }
  render() {
    return this.state.img ? (
      <div
        className="qrcode-display-wrapper"
        dangerouslySetInnerHTML={{ __html: this.state.img }}
        {...this.props}
      />
    ) : null;
  }
}

QRCodeDisplay.propTypes = {
  data: PropTypes.string.isRequired
};

export default QRCodeDisplay;
