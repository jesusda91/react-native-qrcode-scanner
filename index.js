'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  StyleSheet,
  Dimensions,
  Vibration,
  View,
  Text,
  Platform,
  PermissionsAndroid
} from 'react-native';

import Permissions from 'react-native-permissions'
import { RNCamera as Camera } from 'react-native-camera'

const PERMISSION_AUTHORIZED = 'authorized';
const CAMERA_PERMISSION = 'camera';

export default class QRCodeScanner extends Component {
  static propTypes = {
    onRead: PropTypes.func.isRequired,
    reactivate: PropTypes.bool,
    reactivateTimeout: PropTypes.number,
    cameraType: PropTypes.oneOf(['front','back']),
    containerStyle: PropTypes.any,
    cameraStyle: PropTypes.any,
    cameraViewStyle: PropTypes.any,
    notAuthorizedView: PropTypes.element,
    permissionDialogTitle: PropTypes.string,
    permissionDialogMessage: PropTypes.string,
    checkAndroid6Permissions: PropTypes.bool,
  }

  static defaultProps = {
    onRead: () => (console.log('QR code scanned!')),
    reactivate: false,
    reactivateTimeout: 0,
    cameraType: 'back',
    notAuthorizedView: (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          textAlign: 'center',
          fontSize: 16,
        }}>
          Camera not authorized
        </Text>
      </View>
    ),
    pendingAuthorizationView: (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          textAlign: 'center',
          fontSize: 16,
        }}>
          ...
        </Text>
      </View>
    ),
    permissionDialogTitle: "Info",
    permissionDialogMessage: "Need camera permission",
    checkAndroid6Permissions: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      scanning: false,
      isAuthorized: false,
      isAuthorizationChecked: false,
    }

    this._handleBarCodeRead = this._handleBarCodeRead.bind(this);
  }

  componentWillMount() {
    if (Platform.OS === 'ios') {
      Permissions.request(CAMERA_PERMISSION).then(response => {
        this.setState({
          isAuthorized: response === PERMISSION_AUTHORIZED,
          isAuthorizationChecked: true
        });
      });
    } else if (Platform.OS === 'android' && this.props.checkAndroid6Permissions) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          'title': this.props.permissionDialogTitle,
          'message':  this.props.permissionDialogMessage,
      })
        .then((granted) => {
          const isAuthorized = Platform.Version >= 23 ?
            granted === PermissionsAndroid.RESULTS.GRANTED :
            granted === true;

          this.setState({ isAuthorized, isAuthorizationChecked: true })
        })
    } else {
      this.setState({ isAuthorized: true, isAuthorizationChecked: true })
    }
  }

  _setScanning(value) {
    this.setState({ scanning: value });
  }

  _handleBarCodeRead(e) {
    if (!this.state.scanning) {
      Vibration.vibrate();
      this._setScanning(true);
      this.props.onRead(e)
      if (this.props.reactivate) {
        setTimeout(() => (this._setScanning(false)), this.props.reactivateTimeout);
      }
    }
  }

  _renderTopContent() {
    if (this.props.topContent) {
      return this.props.topContent;
    }
    return null;
  }

  _renderBottomContent() {
    if (this.props.bottomContent) {
      return this.props.bottomContent;
    }
    return null;
  }

  _renderCameraMarker() {
    return (
        <View style={styles.rectangleContainer}>
        <View style={styles.rectangle} />
        </View>
    );
  }

  _renderCamera() {
    const { notAuthorizedView, pendingAuthorizationView, cameraType } = this.props
    const { isAuthorized, isAuthorizationChecked } = this.state
    if (isAuthorized) {
      return (
        <Camera
          type={cameraType}
          style={[styles.camera, this.props.cameraStyle]}
          onBarCodeRead={this._handleBarCodeRead.bind(this)}
        >
          {this._renderCameraMarker()}
        </Camera>
      )
    } else if (!isAuthorizationChecked) {
      return pendingAuthorizationView
    } else {
      return notAuthorizedView
    }
  }

  reactivate() {
    this._setScanning(false);
  }

  render() {
    return (
      <View style={[styles.mainContainer, this.props.containerStyle]}>
        {this._renderCamera()}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },

  camera: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: Dimensions.get('window').width,
    width: Dimensions.get('window').width,
  },

  rectangleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  rectangle: {
    height: 250,
    width: 250,
    borderWidth: 2,
    borderColor: '#8CD867',
    backgroundColor: 'transparent',
  },
})
