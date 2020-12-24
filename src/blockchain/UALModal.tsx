import React, { ReactElement, useState, useEffect } from 'react';
import { Modal, Text, View, Image, TouchableOpacity } from 'react-native';
import { UALModalStyles as styles } from '../styles/components';
import { withUAL } from '../blockchain/withUAL';
import logo from '../sign-logo.png';

interface UALModalProps {
  isVisible: boolean;
  ual: any;
}

export function UALModal({ ual }: UALModalProps): ReactElement {
  const { authenticators } = ual;
  const [isVisible, setIsVisible] = useState(true);
  console.log('ual: ', ual);

  const login = async wallet => {
    console.log('login executing, wallet is: ', wallet);
    try {
      await wallet.init();
      await wallet.login('captaincrypt');

      setIsVisible(false);
    } catch (error) {
      console.log('login error: ', error);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={styles.modalContent}>
        <View style={styles.modalTitleWrap}>
          <Text style={styles.modalTitle}>UAL Sign-In</Text>
        </View>
        <View style={styles.modalAuthenticatorsWrap}>
          {authenticators.map(wallet => {
            console.log('wallet.getStyle().icon: ', wallet.getStyle().icon);
            return (
              <TouchableOpacity
                onPress={() => login(wallet)}
                style={styles.authenticatorItem}
              >
                <View>
                  <Image source={logo} />
                  <Text>wallet.get</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

export default withUAL(UALModal);
