import React from "react";
import { Sidebar } from "../custom/Sidebar";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <header>
          <h1>Debt Tracking System</h1>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;