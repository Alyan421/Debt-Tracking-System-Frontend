// How App.tsx should work with this approach (conceptual code)

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CustomersPage from './pages/CustomersPage';
import TransactionsPage from './pages/TransactionsPage';
import authService from './lib/authService';
import config from './config';

const App: React.FC = () => {
  const [isAppAuthenticated, setIsAppAuthenticated] = useState<boolean>(
    authService.isFrontendAuthenticated()
  );
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Frontend app access control - separate from API authentication
  const handleAppLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === config.appPassword) {
      authService.setFrontendAuthenticated(true);
      setIsAppAuthenticated(true);
    } else {
      setLoginError('Invalid password');
    }
  };
  
  const handleLogout = () => {
    authService.frontendLogout();
    setIsAppAuthenticated(false);
  };
  
  // If not authenticated to the frontend app, show login form
  if (!isAppAuthenticated) {
    return (
      <div className="login-container">
        <h1>Debt Tracking System</h1>
        <form onSubmit={handleAppLogin}>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {loginError && <div className="error">{loginError}</div>}
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }
  
  // Once authenticated to the frontend, all API requests will automatically
  // include the Basic Auth header through the service functions
  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/" element={<Navigate to="/customers" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;