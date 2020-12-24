/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { SigningRequest } from 'eosio-signing-request';
import { TextDecoder, TextEncoder } from 'util';
import Buffer from 'buffer';
import zlib from 'react-zlib-js';
import axios from 'axios';

const options = {
  // string encoder
  textEncoder: TextEncoder,
  // string decoder
  textDecoder: TextDecoder,
  // zlib string compression (optional, recommended)
  zlib: {
    deflateRaw: (data) => new Uint8Array(zlib.InflateRaw(Buffer.from(data))),
    inflateRaw: (data) => new Uint8Array(zlib.DeflateRaw(Buffer.from(data))),
  },
  // Customizable ABI Provider used to retrieve contract data
  abiProvider: {
    getAbi: async (account) => {
      console.log('account: ', account);
      const { data } = await axios(
        'https://testnet.telosusa.io/v1/chain/get_abi',
        {
          method: 'POST',
          data: {
            account_name: account,
          },
        },
      );
      return data;
    },
  },
};

const App: () => React$Node = () => {
  const testSign = async () => {
    const req1 = await SigningRequest.create(
      {
        callback: {
          url: '',
          background: true,
        },
        action: {
          account: 'eosio.token',
          name: 'transfer',
          authorization: [{ actor: 'captaincrypt', permission: 'active' }],
          data: {
            from: 'captaincrypt',
            to: 'captaincrypu',
            quantity: '1.0000 TLOS',
            memo: 'Thanks for the Telos',
          },
        },
      },
      options,
    );
    const encoded = req1.encode();
    console.log('encoded: ', encoded);
    const req2 = SigningRequest.from(encoded, options);
    console.log('req2: ', req2);
  };

  useEffect(() => {
    testSign();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Step One</Text>
              <Text style={styles.sectionDescription}>
                Edit <Text style={styles.highlight}>App.js</Text> to change this
                screen and then come back to see your edits.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  'esr://gmNgZGRkAIFXBqEFopc6760yugsVYWBggtKCMIEFRnclpF9eTWUACgAA',
                )
              }>
              <Text>Make transaction</Text>
            </TouchableOpacity>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>See Your Changes</Text>
              <Text style={styles.sectionDescription}>
                <ReloadInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Debug</Text>
              <Text style={styles.sectionDescription}>
                <DebugInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Learn More</Text>
              <Text style={styles.sectionDescription}>
                Read the docs to discover what to do next:
              </Text>
            </View>
            <LearnMoreLinks />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;