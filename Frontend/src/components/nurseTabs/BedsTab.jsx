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
  HomeIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const BedsTab = () => {
  const [beds, setBeds] = useState([]);
  const [filteredBeds, setFilteredBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBed, setSelectedBed] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    bedNumber: '',
    bedType: '',
    description: '',
  });

  useEffect(() => {
    fetchBeds();
  }, []);

  useEffect(() => {
    let filtered = beds;
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(b =>
        b.bedNumber?.toLowerCase().includes(term) ||
        b.bedType?.toLowerCase().includes(term) ||
        b.description?.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }
    
    setFilteredBeds(filtered);
  }, [searchTerm, filterStatus, beds]);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/nurse/beds');
      if (response.data.success) {
        setBeds(response.data.data || []);
        setFilteredBeds(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch beds';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBed = (bed) => {
    setSelectedBed(bed);
    setShowDetailModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      bedNumber: '',
      bedType: '',
      description: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (bed) => {
    setSelectedBed(bed);
    setFormData({
      bedNumber: bed.bedNumber || '',
      bedType: bed.bedType || '',
      description: bed.description || '',
    });
    setShowEditModal(true);
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/nurse/beds', formData);
      if (response.data.success) {
        toast.success('Bed created successfully');
        setShowCreateModal(false);
        fetchBeds();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create bed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/nurse/beds/${selectedBed._id}`, formData);
      if (response.data.success) {
        toast.success('Bed updated successfully');
        setShowEditModal(false);
        setSelectedBed(null);
        fetchBeds();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update bed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (!confirm('Are you sure you want to delete this bed?')) return;
    try {
      const response = await axiosInstance.delete(`/nurse/beds/${bedId}`);
      if (response.data.success) {
        toast.success('Bed deleted successfully');
        setShowDetailModal(false);
        fetchBeds();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete bed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        label: 'Available',
      },
      occupied: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircleIcon,
        label: 'Occupied',
      },
      maintenance: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: XCircleIcon,
        label: 'Maintenance',
      },
    };
    const config = statusConfig[status] || statusConfig.available;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getBedTypeLabel = (bedType) => {
    const types = {
      general: 'General Ward',
      'semi-private': 'Semi-Private',
      private: 'Private Room',
      ICU: 'ICU',
    };
    return types[bedType] || bedType || 'Unknown';
  };

  const getBedTypeColor = (bedType) => {
    const colors = {
      general: 'bg-blue-50 text-blue-700 border-blue-200',
      'semi-private': 'bg-purple-50 text-purple-700 border-purple-200',
      private: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      ICU: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[bedType] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading beds...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Beds</h2>
          <p className="text-sm text-gray-600 mt-1">Manage all beds in the hospital</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Bed
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search beds by number, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'available', 'occupied', 'maintenance'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Beds Grid */}
      {filteredBeds.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No beds found</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Add your first bed to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => (
            <div
              key={bed._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-800 text-base">
                      Bed {bed.bedNumber}
                    </h3>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getBedTypeColor(bed.bedType)}`}>
                    {getBedTypeLabel(bed.bedType)}
                  </span>
                  <div className="mt-2">
                    {getStatusBadge(bed.status)}
                  </div>
                  {bed.description && (
                    <p className="text-sm text-gray-500 mt-2 truncate">
                      {bed.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewBed(bed)}
                  className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors border border-blue-200 flex items-center justify-center gap-1"
                >
                  <EyeIcon className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => openEditModal(bed)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-md transition-colors border border-gray-200"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                {bed.status !== 'occupied' && (
                  <button
                    onClick={() => handleDeleteBed(bed._id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-md transition-colors border border-red-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-800">
                      Bed {selectedBed.bedNumber}
                    </h3>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getBedTypeColor(selectedBed.bedType)}`}>
                    {getBedTypeLabel(selectedBed.bedType)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBed(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(selectedBed.status)}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Bed Type</p>
                  <p className="font-medium text-gray-800">{getBedTypeLabel(selectedBed.bedType)}</p>
                </div>

                {selectedBed.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedBed.description}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
                  <p>Bed ID: {selectedBed._id}</p>
                  <p>Created: {new Date(selectedBed.createdAt).toLocaleDateString()}</p>
                  {selectedBed.updatedAt && (
                    <p>Last Updated: {new Date(selectedBed.updatedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                {selectedBed.status !== 'occupied' && (
                  <button
                    onClick={() => handleDeleteBed(selectedBed._id)}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-colors"
                  >
                    Delete Bed
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBed(null);
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
                <h3 className="text-lg font-semibold text-gray-800">Add New Bed</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ bedNumber: '', bedType: '', description: '' });
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateBed} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number *</label>
                  <input
                    type="text"
                    value={formData.bedNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedNumber: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="B-101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type *</label>
                  <select
                    value={formData.bedType}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedType: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select bed type</option>
                    <option value="general">General Ward</option>
                    <option value="semi-private">Semi-Private</option>
                    <option value="private">Private Room</option>
                    <option value="ICU">ICU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional details about the bed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Bed'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Bed</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBed(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateBed} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
                  <input
                    type="text"
                    value={formData.bedNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedNumber: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="B-101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                  <select
                    value={formData.bedType}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedType: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select bed type</option>
                    <option value="general">General Ward</option>
                    <option value="semi-private">Semi-Private</option>
                    <option value="private">Private Room</option>
                    <option value="ICU">ICU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional details about the bed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Bed'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedsTab;