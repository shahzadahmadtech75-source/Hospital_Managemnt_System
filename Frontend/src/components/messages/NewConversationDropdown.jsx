import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';

import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const NewConversationDropdown = ({ onConversationCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const dropdownRef = useRef(null);
  const { socket } = useSocket();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch users based on role
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let response;
      const role = user?.role;

      switch (role) {
        case 'admin':
          response = await axiosInstance.get('/admin/staff');
          break;
        case 'doctor':
          response = await axiosInstance.get('/doctor/patients');
          break;
        case 'nurse':
          response = await axiosInstance.get('/nurse/patients');
          break;
        case 'patient':
          response = await axiosInstance.get('/patient/doctors');
          break;
        case 'receptionist':
          response = await axiosInstance.get('/receptionist/patients/search', {
            params: { query: '' }
          });
          break;
        case 'accountant':
          response = await axiosInstance.get('/accountant/patients');
          break;
        default:
          setUsers([]);
          setLoading(false);
          return;
      }

      if (response.data.success) {
        let data = response.data.data || [];

        // Format data based on role response structure
        let formattedUsers = [];
        switch (role) {
          case 'admin':
            formattedUsers = data.map(u => ({
              _id: u._id,
              name: u.username || u.fullName || 'Unknown',
              email: u.email,
              role: u.role,
              profileImage: u.profileImage,
            }));
            break;
          case 'doctor':
  formattedUsers = data.map(u => ({
    _id: u.userId,
    profileId: u.profileId,
    name: u.fullName || u.name || 'Unknown',
    email: u.email,
    role: 'patient',
    profileImage: u.profileImage,
  }))
            break;
          case 'nurse':
            formattedUsers = data.map(u => ({
              _id: u._id || u.user?._id,
              name: u.fullName || u.user?.username || 'Unknown',
              email: u.user?.email,
              role: 'patient',
              profileImage: u.profileImage || u.user?.profileImage,
            }));
            break;
          case 'patient':
            formattedUsers = data.map(u => ({
              _id: u._id,
              name: u.fullName || 'Unknown',
              email: u.email,
              role: 'doctor',
              profileImage: u.profileImage,
            }));
            break;
          case 'receptionist':
  formattedUsers = data.map(u => ({
    _id: u.userId,
    profileId: u._id,
    name: u.fullName || 'Unknown',
    email: u.email,
    role: 'patient',
    profileImage: u.profileImage,
  }));
            break;
          case 'accountant':
            formattedUsers = data.map(u => ({
              _id: u._id,
              name: u.fullName || 'Unknown',
              email: u.email,
              role: 'patient',
              profileImage: u.profileImage,
            }));
            break;
          default:
            formattedUsers = [];
        }

        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Open dropdown and fetch users
  const handleOpen = () => {
    setIsOpen(true);
    if (users.length === 0) {
      fetchUsers();
    }
    setSearchTerm('');
  };

  // Create conversation with selected user
  const handleSelectUser = async (selectedUser) => {
    try {
       console.log('🔍 Selected user:', selectedUser);  // ✅ Add this
  console.log('🔍 otherUserId:', selectedUser._id); // ✅ Add this
      const response = await axiosInstance.post('/messages/conversations', {
        otherUserId: selectedUser._id,
      });

      if (response.data.success) {
        toast.success(`Conversation started with ${selectedUser.name}`);
        setIsOpen(false);
        setSelectedUser(null);
        setSearchTerm('');
        if (onConversationCreated) {
          onConversationCreated(response.data.data);
          
          if (socket) {
            socket.emit('joinConversation', { conversationId: conversation._id });
          }
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start conversation';
      toast.error(message);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get role color
  const getRoleColor = (role) => {
    const colors = {
      doctor: 'bg-blue-100 text-blue-700',
      nurse: 'bg-green-100 text-green-700',
      receptionist: 'bg-orange-100 text-orange-700',
      accountant: 'bg-purple-100 text-purple-700',
      patient: 'bg-gray-100 text-gray-700',
      admin: 'bg-red-100 text-red-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  // Get role label
  const getRoleLabel = (role) => {
    const labels = {
      doctor: 'Doctor',
      nurse: 'Nurse',
      receptionist: 'Receptionist',
      accountant: 'Accountant',
      patient: 'Patient',
      admin: 'Admin',
    };
    return labels[role] || role || 'User';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* New Conversation Button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <PlusIcon className="w-4 h-4 mr-1.5" />
        New Conversation
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                {user?.role === 'admin' ? 'Select Staff Member' :
                 user?.role === 'patient' ? 'Select Doctor' :
                 'Select Patient'}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchTerm ? 'No users found' : 'No users available'}
              </div>
            ) : (
              filteredUsers.map((u) => (
                <button
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  {console.log(u)}
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {u.profileImage ? (
                      <img
                        src={u.profileImage}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-blue-600">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {u.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 truncate">
                        {u.email || 'No email'}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getRoleColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </div>
                  </div>

                  {/* Online indicator */}
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewConversationDropdown;