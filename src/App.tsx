import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CustomersPage from './pages/CustomersPage';
import TransactionsPage from './pages/TransactionsPage';
import authService from './lib/authService';
import config from './config';
import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  
  useEffect(() => {
    // Check authentication when component mounts
    const checkAuth = async () => {
      if (isAuthenticated) {
        const verified = await authService.verifyAuth();
        if (!verified) {
          authService.setAuthenticated(false);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [isAuthenticated]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Override config with provided credentials
    config.auth.username = username;
    config.auth.password = password;
    
    const verified = await authService.verifyAuth();
    if (verified) {
      authService.setAuthenticated(true);
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid credentials');
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h1>Debt Tracking System</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
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
  
  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/" element={<Navigate to="/customers" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;