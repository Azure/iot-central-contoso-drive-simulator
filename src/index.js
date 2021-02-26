import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/authContext';
import { DeviceProvider } from './context/deviceContext';

import Layout from './shell/layout';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <DeviceProvider>
          <Layout />
        </DeviceProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);