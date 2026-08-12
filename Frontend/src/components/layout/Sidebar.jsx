import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const roleMenus = {
  admin: [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Users', path: '/users', icon: UsersIcon },
    { name: 'Departments', path: '/departments', icon: UserGroupIcon },
    { name: 'Reports', path: '/reports', icon: DocumentTextIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ],
  doctor: [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Appointments', path: '/appointments', icon: CalendarIcon },
    { name: 'Patients', path: '/patients', icon: UsersIcon },
    { name: 'Prescriptions', path: '/prescriptions', icon: DocumentTextIcon },
    { name: 'Schedule', path: '/schedule', icon: CalendarIcon },
  ],
  nurse: [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Patients', path: '/patients', icon: UsersIcon },
    { name: 'Vitals', path: '/vitals', icon: ClipboardDocumentListIcon },
    { name: 'Tasks', path: '/tasks', icon: DocumentTextIcon },
  ],
  receptionist: [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Appointments', path: '/appointments', icon: CalendarIcon },
    { name: 'Patients', path: '/patients', icon: UsersIcon },
    { name: 'Registration', path: '/registration', icon: UserGroupIcon },
  ],
  accountant: [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Invoices', path: '/invoices', icon: CurrencyDollarIcon },
    { name: 'Payments', path: '/payments', icon: DocumentTextIcon },
    { name: 'Reports', path: '/reports', icon: ClipboardDocumentListIcon },
  ],
  patient: [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Appointments', path: '/appointments', icon: CalendarIcon },
    { name: 'Medical Records', path: '/medical-records', icon: DocumentTextIcon },
    { name: 'Prescriptions', path: '/prescriptions', icon: ClipboardDocumentListIcon },
  ],
};

const Sidebar = ({ isMobileOpen, toggleMobileSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024 && isMobileOpen) {
        toggleMobileSidebar();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen, toggleMobileSidebar]);

  const menus = user?.role ? roleMenus[user.role] || roleMenus.admin : roleMenus.admin;

  const sidebarContent = (
    <nav className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="text-lg font-semibold text-gray-800">HMS</span>
        </div>
        {!isDesktop && (
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Main Menu
          </p>
        </div>
        <div className="space-y-1 px-2">
          {menus.map((item) => {
            const isActive = location.pathname === item.path || 
                           location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: navActive }) => {
                  const active = navActive || isActive;
                  return `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`;
                }}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role || 'Role'}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );

  if (!isDesktop) {
    return (
      <>
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={toggleMobileSidebar}
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;