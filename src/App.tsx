import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import TransactionsPage from "./pages/TransactionsPage";
import CustomersPage from "./pages/CustomersPage";
import config from "./config";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // The password comes from environment variables via the config
  const correctPassword = config.appPassword;
  
  useEffect(() => {
    // Check if user was previously authenticated in this session
    const authenticated = sessionStorage.getItem("authenticated") === "true";
    setIsAuthenticated(authenticated);
  }, []);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem("authenticated", "true");
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };
  
  // Simple login screen
  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>Debt Tracker</h1>
          <p>Enter password to access the application</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="password-input"
                autoFocus
              />
            </div>
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main app once authenticated
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TransactionsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;