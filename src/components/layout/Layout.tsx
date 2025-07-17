import React from "react";
import { Sidebar } from "../custom/Sidebar";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};