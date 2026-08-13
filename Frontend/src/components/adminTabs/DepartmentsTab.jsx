import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const DepartmentsTab = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDepartments(departments);
    } else {
      const term = searchTerm.toLowerCase().trim();
      setFilteredDepartments(
        departments.filter(d =>
          d.name?.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, departments]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/departments');
      if (response.data.success) {
        setDepartments(response.data.data || []);
        setFilteredDepartments(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch departments';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDetailModal(true);
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', image: null });
    setPreviewUrl(null);
    setShowCreateModal(true);
  };

  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name || '',
      description: department.description || '',
      image: null,
    });
    setPreviewUrl(department.image || null);
    setShowEditModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (formData.image) {
  formDataToSend.append('profileImage', formData.image);
}

      const response = await axiosInstance.post('/admin/departments', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success('Department created successfully');
        setShowCreateModal(false);
        fetchDepartments();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create department';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      
        if (formData.image) {
  formDataToSend.append('profileImage', formData.image);
}
      

      const response = await axiosInstance.patch(`/admin/departments/${selectedDepartment._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success('Department updated successfully');
        setShowEditModal(false);
        setSelectedDepartment(null);
        fetchDepartments();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update department';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const response = await axiosInstance.delete(`/admin/departments/${departmentId}`);
      if (response.data.success) {
        toast.success('Department deleted successfully');
        setShowDetailModal(false);
        fetchDepartments();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete department';
      toast.error(message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading departments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Departments</h2>
          <p className="text-sm text-gray-600 mt-1">Manage hospital departments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search departments by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No departments found</p>
          <p className="text-gray-500 text-sm mt-1">Add a new department to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((department) => (
            <div
              key={department._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {department.image ? (
                    <img
                      src={department.image}
                      alt={department.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-base truncate">
                    {department.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {department.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {formatDate(department.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewDepartment(department)}
                  className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors border border-blue-200 flex items-center justify-center gap-1"
                >
                  <EyeIcon className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => openEditModal(department)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-md transition-colors border border-gray-200"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDepartment(department._id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-md transition-colors border border-red-200"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center overflow-hidden">
                    {selectedDepartment.image ? (
                      <img
                        src={selectedDepartment.image}
                        alt={selectedDepartment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedDepartment.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Department Name</p>
                  <p className="font-medium text-gray-800">{selectedDepartment.name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-gray-700">{selectedDepartment.description || 'No description'}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="text-gray-700">{formatDate(selectedDepartment.createdAt)}</p>
                </div>

                {selectedDepartment.updatedAt && selectedDepartment.updatedAt !== selectedDepartment.createdAt && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-gray-700">{formatDate(selectedDepartment.updatedAt)}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Department ID</p>
                  <p className="text-sm text-gray-600 font-mono">{selectedDepartment._id}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => handleDeleteDepartment(selectedDepartment._id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-colors"
                >
                  Delete Department
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Create Department</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', image: null });
                    setPreviewUrl(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Image</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-gray-200 overflow-hidden">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BuildingOfficeIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cardiology"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the department"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Department</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Image</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-gray-200 overflow-hidden">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BuildingOfficeIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <span className="text-xs text-gray-500">(Leave empty to keep current)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cardiology"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the department"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Department'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsTab;