import { Config } from '../config'
import axios from 'axios';
import * as msal from '@azure/msal-browser';

import * as React from 'react';

function getAccessTokenForScope(silentFail: boolean, msalInstance: any, scope: string, options: any) {
  const tokenRequest: any = Object.assign({}, options, {
    scopes: Array.isArray(scope) ? scope : [scope],
    forceRefresh: false,
    redirectUri: msalConfig.auth.redirectUri
  });

  return new Promise((resolve, reject) => {
    msalInstance.acquireTokenSilent(tokenRequest)
      .then((res) => {
        resolve(res)
      })
      .catch((err) => {
        if (silentFail) {
          reject(err);
          return;
        }
        msalInstance.acquireTokenPopup(tokenRequest)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            if (err.name === 'BrowserAuthError') {
              msalInstance.acquireTokenPopup(tokenRequest)
                .then((res) => {
                  resolve(res)
                })
                .catch((err) => {
                  reject(err);
                })

            } else {
              reject(err);
            }
          });
      });
  });
}

function getDeviceDreds(applicationHost, deviceId, accessToken) {
  return new Promise(async (resolve, reject) => {
    axios.get(`https://${applicationHost}/api/preview/devices/${deviceId}/credentials`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })
      .then((res: any) => { resolve(res.data); })
      .catch((err) => { reject(err); });
  })
}

export const msalConfig = {
  auth: {
    clientId: Config.AADClientID,
    authority: 'https://login.microsoftonline.com/' + Config.AADDirectoryID,
    redirectUri: Config.AADRedirectURI
  },
  cache: {
    cacheLocation: 'localStorage'
  }
}

export const Scopes = {
  Graph: 'User.Read',
  Central: 'https://apps.azureiotcentral.com/user_impersonation',
}

export const APP_HOSTKEY = 'application-host';
export const DEVICEID_HOSTKEY = 'device-id';

export const AuthContext = React.createContext({});

export class AuthProvider extends React.PureComponent {

  private msalInstance: any = null;

  constructor(props: any) {
    super(props);
    this.msalInstance = new msal.PublicClientApplication(msalConfig);
    this.state.applicationHost = localStorage.getItem(APP_HOSTKEY);
    this.state.deviceId = localStorage.getItem(DEVICEID_HOSTKEY);
  }

  signIn = (silent: boolean) => {
    if (this.state.authenticated) { return; }

    let loginAccount: any = {};

    this.msalInstance.handleRedirectPromise()
      .then((res: any) => {
        loginAccount = res ? res.data.value[0] : this.msalInstance.getAllAccounts()[0];
        return getAccessTokenForScope(silent, this.msalInstance, Scopes.Graph, loginAccount ? { account: loginAccount } : null);
      })
      .then((res: any) => {
        loginAccount = res.account;
        return getAccessTokenForScope(silent, this.msalInstance, Scopes.Central, loginAccount ? { account: loginAccount } : null);
      })
      .then(() => {
        this.setState({
          loginAccount,
          authenticated: true,
          initialized: false
        })
      })
      .catch((err) => {
        console.log(err);
        console.log('Silent auth failed. User must sign in');
      });
  }

  initializeApplication = () => {
    if (this.state.authenticated && this.state.initialized) { return; }

    getAccessTokenForScope(true, this.msalInstance, Scopes.Central, { account: this.state.loginAccount })
      .then((res: any) => {
        return getDeviceDreds(this.state.applicationHost, this.state.deviceId, res.accessToken)
      })
      .then((res) => {
        this.setState({
          initialized: true,
          deviceCredentials: res
        })
      })
      .catch((err) => {
        console.log(err);
        console.log('Failed to get Central device information. User must sign in');
      })
  }

  getAccessToken = async () => {
    const res: any = await getAccessTokenForScope(true, this.msalInstance, Scopes.Central, { account: this.state.loginAccount });
    return res.accessToken;
  }

  signOut = () => {
    this.msalInstance.logout();
  }

  setUpApplication = (applicationHost: string, deviceId: string) => {
    localStorage.setItem(APP_HOSTKEY, applicationHost);
    localStorage.setItem(DEVICEID_HOSTKEY, deviceId);
    this.setState({
      applicationHost,
      deviceId
    });
  }

  state: any = {
    authenticated: false,
    initialized: false,
    loginAccount: {},
    deviceCredentials: {},
    applicationHost: '',
    deviceId: '',
    signIn: this.signIn,
    initializeApplication: this.initializeApplication,
    signOut: this.signOut,
    setUpApplication: this.setUpApplication,
    getAccessToken: this.getAccessToken
  }

  render() {
    return (
      <AuthContext.Provider value={this.state}>
        {this.props.children}
      </AuthContext.Provider>
    )
  }
}