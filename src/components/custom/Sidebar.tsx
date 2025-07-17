import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

export const Sidebar = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname.startsWith(path);
  
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };
  
  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="mobile-toggle" 
        onClick={toggleMobileMenu}
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        {isMobileOpen ? "✕" : "☰"}
      </button>
      
      {/* Mobile overlay */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? "active" : ""}`} 
        onClick={closeMobileMenu}
      />
      
      {/* Sidebar */}
      <div className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Debt Tracker</h1>
          <p className="sidebar-subtitle">Manage your finances</p>
        </div>
        
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <p className="sidebar-section-title">Navigation</p>
            
            <Link 
              to="/transactions" 
              className={`sidebar-link ${isActive("/transactions") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <span className="sidebar-icon">💱</span>
              <span>Transactions</span>
            </Link>
            
            <Link 
              to="/customers" 
              className={`sidebar-link ${isActive("/customers") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <span className="sidebar-icon">👥</span>
              <span>Customers</span>
            </Link>
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <p className="sidebar-copyright">© 2025 Debt Tracker System</p>
        </div>
      </div>
    </>
  );
};