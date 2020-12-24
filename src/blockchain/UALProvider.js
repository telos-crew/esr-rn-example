import React, { Component } from 'react';
import { View, Text, AsyncStorage } from 'react-native';
import PropTypes from 'prop-types';
import { UAL, UALError, UALErrorType } from 'universal-authenticator-library';
import { KeycatAuthenticator } from '@telosnetwork/ual-telos-keycat';
import { Anchor } from 'ual-anchor';
import { UALContext } from './UALContext';
import UALModal from './UALModal';

/**
 * Defines a supported chain
 *
 * @typedef Chain
 * @type {object}
 * @property {string} chainId - The chainId for the chain.
 * @property {RpcEndpoint[]} rpcEndpoints - One or more rpcEndpoints associated with that chainId.
 */

/**
 * Defines an RpcEndpoint
 *
 * @typedef RpcEndpoint
 * @type {object}
 * @property {string} protocol
 * @property {string} host
 * @property {number} port
 * @property {string} path
 */

const DEFAULT_STATUS = {
  loading: false,
  activeUser: null,
  activeAuthenticator: null,
  users: [],
  error: null,
  message: '',
};

const TELOS_MAINNET = {
  chainId: '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
  rpcEndpoints: [
    {
      protocol: 'https',
      host: 'telos.caleos.io',
      port: 443,
    },
  ],
};

const keycat = new KeycatAuthenticator([TELOS_MAINNET], {
  appName: 'Unmuted.io',
});

const anchor = new Anchor([TELOS_MAINNET], {
  // Required: The app name, required by anchor-link. Short string identifying the app
  appName: 'Unmuted.io',
  // Optional: The callback service URL to use, defaults to https://cb.anchor.link
  service: 'https://cb.anchor.link',
  // Optional: A flag to disable the Greymass Fuel integration, defaults to false (enabled)
  disableGreymassFuel: false,
  // Optional: A flag to enable the Anchor Link UI request status, defaults to false (disabled)
  requestStatus: false,
});

/**
 * Wrapper component that provides a child app with access to UAL functionality
 */

// @eslint-ignore import/prefer-default-export
export class UALProvider extends Component {
  static displayName = 'UALProvider';

  constructor(props) {
    super(props);
    /**
     * @namespace UAL
     */
    this.state = {
      /**
       * @memberof UAL
       * @desc chain list from props
       * @type {Chain[]} chains
       */
      chains: props.chains,
      /**
       * @memberof UAL
       * @desc authenticator instances from props
       * @type {Authenticator[]} authenticators
       */
      authenticators: props.authenticators,
      /**
       * @memberof UAL
       * @desc available authenticator list
       * @type {Authenticator[]} availableAuthenticators
       */
      availableAuthenticators: [],
      /**
       * @memberof UAL
       * @desc name of app
       * @type {string} appName
       */
      appName: props.appName,
      /**
       * @memberof UAL
       * @desc whether or not show modal, initialized via props
       * @type {boolean} modal
       */
      modal: props.modal,
      /**
       * @memberof UAL
       * @desc loading state of UAL
       * @type {boolean} loading
       */
      loading: false,
      /**
       * @memberof UAL
       * @desc list of authenticated users
       * @type {User[]} users
       */
      users: [],
      /**
       * @memberof UAL
       * @desc authenticator currently used
       * @type {Authenticator} activeAuthenticator
       */
      activeAuthenticator: null,
      /**
       * @memberof UAL
       * @desc logged in user
       * @type {User} activeUser
       */
      activeUser: null,
      /**
       * @memberof UAL
       * @desc whether or not activeAuthenticator should auto login
       * @type {boolean} isAutoLogin
       */
      isAutoLogin: false,
      /**
       * @memberof UAL
       * @desc captured error if any
       * @type {UALError|null} error
       */
      error: null,
      /**
       * @memberof UAL
       * @desc message, if any, accompanying current UAL state
       * @type {string} message
       */
      message: '',
      /**
       * @memberof UAL
       * @function
       * @name hideModal
       * @desc hides the modal
       * @return {Void}
       */
      hideModal: () =>
        this.setState({
          modal: false,
          loading: true,
          message: 'Loading Authenticators',
        }),
      /**
       * @memberof UAL
       * @function
       * @name showModal
       * @desc shows the modal
       * @return {Void}
       */
      showModal: () => {
        this.setState({ modal: true });
      },
      /**
       * @memberof UAL
       * @function
       * @name logout
       * @desc logs user out of authenticator and resets UAL state
       * @return {Void}
       */
      logout: () => {
        const { activeAuthenticator } = this.state;
        this.setState(
          DEFAULT_STATUS,
          () => activeAuthenticator && this.fullLogout(activeAuthenticator),
        );
      },
      /**
       * @memberof UAL
       * @function
       * @name restart
       * @desc resets all available authenticators and resets UAL state
       * @return {Void}
       */
      restart: () => {
        this.setState({ DEFAULT_STATUS }, () => {
          const { availableAuthenticators } = this.state;
          availableAuthenticators.forEach(auth => auth.reset());
          this.setState(availableAuthenticators);
        });
      },
      /**
       * @memberof UAL
       * @function
       * @name broadcastStatus
       * @desc dispatches a provider state update
       * @return {Void}
       */
      broadcastStatus: (status = DEFAULT_STATUS) => this.setState(status),
      /**
       * @memberof UAL
       * @function
       * @name authenticateWithoutAccountInput
       * @desc attempts authentication with an authenticator not requiring account input
       * @return {Void}
       * @param {Authenticator} authenticator
       * @param {boolean} [false] isAutoLogin
       */
      authenticateWithoutAccountInput: async (
        authenticator,
        isAutoLogin = false,
      ) => {
        const { broadcastStatus } = this.state;
        broadcastStatus({
          loading: true,
          message: 'Continue with Authenticator',
          activeAuthenticator: authenticator,
        });
        try {
          const users = await authenticator.login();
          const accountName = await users[0].getAccountName();
          console.log('ualProvider accountName: ', accountName);
          if (!isAutoLogin) {
            await AsyncStorage.setItem(
              'UALLoggedInAuthType',
              authenticator.getName(),
            );
            this.setUALInvalidateAt(authenticator);
          }
          broadcastStatus({
            activeUser: users[users.length - 1],
            users,
            isAutoLogin,
            message: `Currently logged in as ${accountName}`,
          });
        } catch (err) {
          broadcastStatus({
            loading: false,
            error: err,
            message: err.message,
          });
        }
      },
      /**
       * @memberof UAL
       * @function
       * @name submitAccountForLogin
       * @desc attempts authentication
       * @return {Void}
       * @param {string} accountInput
       * @param {Authenticator} authenticator
       */
      submitAccountForLogin: async (accountInput, authenticator) => {
        const { broadcastStatus } = this.state;
        broadcastStatus({
          loading: true,
          message: authenticator.requiresGetKeyConfirmation()
            ? 'Please approve the request from your device.'
            : 'Please wait while we find your account.',
        });
        try {
          const users = await authenticator.login(accountInput);
          await AsyncStorage.setItem(
            'UALLoggedInAuthType',
            authenticator.getName(),
          );
          await AsyncStorage.setItem('UALAccountName', accountInput);
          broadcastStatus({
            activeUser: users[users.length - 1],
            activeAuthenticator: authenticator,
            users,
            message: `Currently, logged in as ${accountName}`,
          });
          this.setUALInvalidateAt(authenticator);
        } catch (err) {
          broadcastStatus({
            error: err,
            message: err.message,
            loading: false,
          });
        }
      },
    };
  }

  async componentDidMount() {
    const {
      chains,
      appName,
      authenticators,
      authenticateWithoutAccountInput,
      submitAccountForLogin,
    } = this.state;
    let type = await AsyncStorage.getItem('UALLoggedInAuthType');
    const invalidate = await AsyncStorage.getItem('UALInvalidateAt');
    const accountName = await AsyncStorage.getItem('UALAccountName');
    type = this.checkForInvalidatedSession(type, invalidate);
    const ual = new UAL(chains, appName, authenticators);
    const {
      availableAuthenticators,
      autoLoginAuthenticator,
    } = ual.getAuthenticators();
    try {
      if (type) {
        const authenticator = this.getAuthenticatorInstance(
          type,
          availableAuthenticators,
        );
        if (!authenticator) {
          throw new Error('authenticator instance not found');
        }
        const availableCheck = setInterval(() => {
          if (!authenticator.isLoading()) {
            clearInterval(availableCheck);
            // Only Ledger requires an account name
            if (accountName) {
              submitAccountForLogin(accountName, authenticator);
            } else {
              authenticateWithoutAccountInput(authenticator);
            }
          }
        }, 250);
      }
    } catch (e) {
      this.clearCache();
      const msg = 'User session has ended. Login required.';
      const source = type || 'Universal Authenticator Library';
      const errType = UALErrorType.Login;
      console.warn(new UALError(msg, errType, e, source));
    } finally {
      this.fetchAuthenticators(availableAuthenticators, autoLoginAuthenticator);
    }
  }

  componentDidUpdate() {
    const {
      loading,
      message,
      availableAuthenticators,
      broadcastStatus,
    } = this.state;
    if (
      loading &&
      message === 'Loading Authenticators...' &&
      availableAuthenticators.length
    ) {
      broadcastStatus({ message: 'Authenticators loaded.', loading: false });
    }
  }

  /**
   * Verifies a logged in user's authenticator is still app supported
   *
   * @method
   * @param {string} type - authenticator type of sessioned user
   * @param {Object[]} availableAuthenticators - list of available app supported authenticators
   * @return {number|boolean}
   */
  getAuthenticatorInstance = (type, availableAuthenticators) => {
    const loggedIn = availableAuthenticators.filter(
      auth => auth.getName() === type,
    );
    if (!loggedIn.length) {
      this.clearCache();
    }
    return loggedIn.length ? loggedIn[0] : false;
  };

  /**
   * Checks if the saved browser session has passed the UALInvalidateAt date and clear the cache if true
   *
   * @method
   * @param {string} type - UALLoggedInAuthType value
   * @param {string} invalidate - UALInvalidateAt value in string formatted date
   * @return {string|undefined} - UALLoggedInAuthType value or undefined if no longer valid
   */
  checkForInvalidatedSession = (type, invalidate) => {
    if (type && invalidate && new Date(invalidate) <= new Date()) {
      this.clearCache();
      return undefined;
    }
    return type;
  };

  /**
   * Sets UALInvalidateAt value to local storage depending on amount of seconds set in authenticator
   *
   * @method
   * @param {Authenticator} authenticator - should-invalidate-after authenticator
   * @return {Void}
   */
  setUALInvalidateAt = async authenticator => {
    const invalidateSeconds = authenticator.shouldInvalidateAfter();
    const invalidateAt = new Date();
    invalidateAt.setSeconds(invalidateAt.getSeconds() + invalidateSeconds);
    await AsyncStorage.setItem('UALInvalidateAt', invalidateAt);
  };

  /**
   * Renders available authenticators or starts auto-login process if applicable
   *
   * @method
   * @param {Authenticator[]} availableAuthenticators - list of available app supported authenticators
   * @param {Authenticator} autoLoginAuthenticator - auto-login authenticator
   * @return {Void}
   */
  fetchAuthenticators = (availableAuthenticators, autoLoginAuthenticator) => {
    const { authenticateWithoutAccountInput } = this.state;
    if (autoLoginAuthenticator) {
      this.setState(
        { availableAuthenticators: [autoLoginAuthenticator] },
        () => {
          const availableCheck = setInterval(() => {
            if (!autoLoginAuthenticator.isLoading()) {
              clearInterval(availableCheck);
              authenticateWithoutAccountInput(autoLoginAuthenticator, true);
            }
          }, 250);
        },
      );
    } else {
      this.setState({ availableAuthenticators }, () => {
        this.setState({ message: 'authenticatorsLoaded' });
      });
    }
  };

  /**
   * Clears locally stored user session
   *
   * @method
   * @return {Void}
   */
  clearCache = () => {
    AsyncStorage.removeItem('UALLoggedInAuthType');
    AsyncStorage.removeItem('UALAccountName');
    AsyncStorage.removeItem('UALInvalidateAt');
  };

  /**
   * Clears localStorage and logs out user
   *
   * @method
   * @param {Authenticator} authenticator - used authenticator
   * @return {Void}
   */
  fullLogout = authenticator => {
    this.clearCache();
    authenticator.logout().catch(e => console.warn(e));
  };

  render() {
    const { modal } = this.state;
    const { children } = this.props;
    return (
      <UALContext.Provider
        value={this.state}
        chains={[TELOS_MAINNET]}
        authenticators={[keycat, anchor]}
        appName={'Decide Voter'}
      >
        <UALModal isVisible={true} />
        {children}
      </UALContext.Provider>
    );
  }
}

/**
 * @memberof UALProvider
 * @name props
 * @prop {Chain[]} chains - list of chains the app supports
 * @prop {Authenticator[]} authenticators - list of authenticators the app supports
 * @prop {Node[]|Node} children - child app(s)
 * @prop {string} appName - name of app
 * @prop {boolean} modal - whether or not to show modal
 */
UALProvider.propTypes = {
  chains: PropTypes.arrayOf(PropTypes.object).isRequired,
  authenticators: PropTypes.arrayOf(PropTypes.object).isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  appName: PropTypes.string.isRequired,
  modal: PropTypes.bool,
};

UALProvider.defaultProps = {};
