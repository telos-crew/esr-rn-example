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
import axios from 'axios';
import 'core-js';
import { SigningRequest } from 'eosio-signing-request';
// import { TextDecoder, TextEncoder } from 'text-encoding';
import zlib from 'react-zlib-js';
import { inspect } from 'util';
const { Api, JsonRpc, RpcError } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig'); // development only
import 'fastestsmallesttextencoderdecoder';
const Buffer = require('safe-buffer').Buffer;
const fetch = require('node-fetch'); // node only; not needed in browsers
const {
  TextEncoder,
  TextDecoder,
} = require('fastestsmallesttextencoderdecoder');
global.Buffer = Buffer;

const eosRpc = new JsonRpc('https://mainnet.telosusa.io', { fetch });

const eosjsProvider = new JsSignatureProvider([
  'yourPrivateKeyHere',
]);

const eosApi = new Api({
  rpc: eosRpc,
  signatureProvider: eosjsProvider,
  textDecoder: TextDecoder,
  textEncoder: TextEncoder,
});

const options = {
  // string encoder
  textEncoder: TextEncoder,
  // string decoder
  textDecoder: TextDecoder,
  // zlib string compression (optional, recommended)
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
      console.log('data: ', data);
      return data.abi;
    },
  },
};

const actions = [
  {
    account: 'eosio',
    name: 'voteproducer',
    authorization: [
      {
        actor: 'captaincrypt',
        permission: 'active',
      },
    ],
    data: {
      voter: 'captaincrypt',
      proxy: 'greymassvote',
      producers: [],
    },
  },
];

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
            to: 'unmutediodap',
            quantity: '1.0000 TLOS',
            memo: 'Thanks for the fish',
          },
        },
      },
      options,
    );
    console.log('req1 created: ', req1);
    const encoded = req1.encode();
    console.log('encoded: ', encoded);
    console.log(inspect(req1, false, null, true));

    // encode signing request as URI string
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
          <View
            style={[
              styles.body,
              {
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <TouchableOpacity
              style={{
                borderColor: 'green',
                borderWidth: 1,
                padding: 8,
                margin: 30,
              }}
              onPress={() =>
                Linking.openURL(
                  'esr://gmNgZGRkAIFXBqEFopc6760yugsVYWBggtKCMIEFRnclpF9eTWUACgAA',
                )
              }>
              <Text>Make transaction</Text>
            </TouchableOpacity>
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
