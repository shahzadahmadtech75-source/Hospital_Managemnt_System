import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const AppShell = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header toggleMobileSidebar={toggleMobileSidebar} />
      <Sidebar isMobileOpen={isMobileOpen} toggleMobileSidebar={toggleMobileSidebar} />
      
      <main className="lg:pl-72 pt-16">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;