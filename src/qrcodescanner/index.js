import React, { Component } from 'react';
import PropTypes from 'prop-types';
import QrReader from 'react-qr-reader';
import './style.css';

const CloseButton = () => (
  <div className="qrcode-scanner-close-button">
    <div className="qrcode-scanner-close-button-first-line" />
    <div className="qrcode-scanner-close-button-second-line" />
  </div>
);

class QRCodeScanner extends Component {
  constructor() {
    super();
    this.state = {
      delay: 500
    };
    this.stopRecording.bind(this);
    this.handleScan.bind(this);
    this.handleError.bind(this);
    this.onClose.bind(this);
  }
  stopRecording() {
    this.setState({ delay: false });
  }
  handleScan(data) {
    if (data) {
      const validate = this.props.onValidate(data);
      if (validate.result) {
        this.stopRecording();
        this.props.onScan(validate.data);
      } else {
        validate.onError();
      }
    }
  }
  handleError(error) {
    console.error(error);
    this.props.onError(error);
  }
  onClose() {
    this.stopRecording();
    this.props.onClose();
  }
  componentWillUnmount() {
    this.stopRecording();
  }
  render() {
    return (
      <div className="qrcode-scanner-wrapper">
        <CloseButton onClick={this.onClose} />
        <div className="qrcode-scanner-column">
          <QrReader
            delay={this.state.delay}
            onError={this.handleError}
            onScan={this.handleScan}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }
}

QRCodeScanner.propTypes = {
  onScan: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired
};

export default QRCodeScanner;
