import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/common/Toaster';

// Tab Components
import AppointmentsTab from '../../components/patientTabs/AppointmentsTab';
import DoctorsTab from '../../components/patientTabs/DoctorsTab';
import PrescriptionsTab from '../../components/patientTabs/PrescriptionsTab';
import AdmissionsTab from '../../components/patientTabs/AdmissionsTab';
import OperationsTab from '../../components/patientTabs/OperationsTab';
import InvoicesTab from '../../components/patientTabs/InvoicesTab';
import UpdateProfileTab from '../../components/patientTabs/UpdateProfileTab';

// Icons (using Heroicons - replace with Lucide if preferred)
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('appointments');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tab configuration
  const tabs = [
    { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
    { id: 'doctors', label: 'Doctors', icon: UserGroupIcon },
    { id: 'prescriptions', label: 'Prescriptions', icon: DocumentTextIcon },
    { id: 'admissions', label: 'Admissions', icon: BuildingOfficeIcon },
    { id: 'operations', label: 'Operations', icon: BeakerIcon },
    { id: 'invoices', label: 'Invoices', icon: CurrencyDollarIcon },
    { id: 'update-profile', label: 'Update Profile', icon: UserCircleIcon },
  ];

  // Check profile completeness on mount
  useEffect(() => {
    const checkProfileCompleteness = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call to check profile completeness
        // For now, simulate check
        const storedUser = localStorage.getItem('hms_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Check if required fields exist
          const hasRequiredFields = userData.fullName && userData.email;
          setIsProfileComplete(hasRequiredFields);
          
          // If profile incomplete, force to update-profile tab
          if (!hasRequiredFields) {
            setActiveTab('update-profile');
          }
        }
      } catch (error) {
        console.error('Error checking profile completeness:', error);
        setIsProfileComplete(false);
        setActiveTab('update-profile');
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileCompleteness();
  }, []);

  // Handle tab switching with profile guard
  const handleTabChange = (tabId) => {
    // If profile is incomplete, only allow update-profile tab
    if (!isProfileComplete && tabId !== 'update-profile') {
      toast.error('Please complete your profile first');
      return;
    }
    setActiveTab(tabId);
    // Close mobile sidebar on tab change
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Render active tab component
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentsTab />;
      case 'doctors':
        return <DoctorsTab />;
      case 'prescriptions':
        return <PrescriptionsTab />;
      case 'admissions':
        return <AdmissionsTab />;
      case 'operations':
        return <OperationsTab />;
      case 'invoices':
        return <InvoicesTab />;
      case 'update-profile':
        return <UpdateProfileTab setIsProfileComplete={setIsProfileComplete} />;
      default:
        return <AppointmentsTab />;
    }
  };

  // Get current tab label
  const getCurrentTabLabel = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab ? tab.label : 'Dashboard';
  };

  // Toggle sidebar for desktop
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle sidebar for mobile
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-72' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Sidebar Header with Toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">Patient Portal</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">H</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Section */}
        <div className={`
          flex items-center p-4 border-b border-gray-200 flex-shrink-0
          ${isSidebarOpen ? 'space-x-3' : 'justify-center'}
        `}>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.fullName || user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-blue-600">
                {getUserInitials()}
              </span>
            )}
          </div>
          {isSidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.fullName || user?.username || 'Patient'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'No email'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isDisabled = !isProfileComplete && tab.id !== 'update-profile';
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${!isSidebarOpen ? 'justify-center' : ''}
                  `}
                  title={isDisabled ? 'Complete your profile first' : tab.label}
                >
                  <tab.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  {isSidebarOpen && <span className="ml-3">{tab.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section - Logout */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
              text-red-600 hover:bg-red-50 transition-colors
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center space-x-4 w-full">
            {/* Mobile Hamburger */}
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <h1 className="text-lg font-semibold text-gray-800">
              {getCurrentTabLabel()}
            </h1>

            {/* Profile Guard Warning */}
            {!isProfileComplete && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700 font-medium hidden sm:inline">
                  Profile incomplete
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Profile Guard Modal/Banner */}
          {!isProfileComplete && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Action Required: Please complete your profile details
                </p>
                <p className="text-sm text-amber-700">
                  Complete your profile before accessing all medical records and booking features.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-gray-200 min-h-[400px]">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;