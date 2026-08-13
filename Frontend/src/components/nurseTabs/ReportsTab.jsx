import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  BeakerIcon,
  RectangleStackIcon,
  HeartIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const ReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    type: '',
    description: '',
    reportDate: '',
  });

  useEffect(() => {
    fetchReports();
    fetchOptions();
  }, []);

  useEffect(() => {
    let filtered = reports;
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.patient?.fullName?.toLowerCase().includes(term) ||
        r.type?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }
    
    setFilteredReports(filtered);
  }, [searchTerm, filterType, reports]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/nurse/reports');
      if (response.data.success) {
        setReports(response.data.data || []);
        setFilteredReports(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch reports';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      // Fetch patients
      const patientsRes = await axiosInstance.get('/nurse/patients');
      if (patientsRes.data.success) {
        setPatients(patientsRes.data.data || []);
      }

      // Fetch doctors
      try {
        const doctorsRes = await axiosInstance.get('/public/doctors');
        if (doctorsRes.data.success) {
          setDoctors(doctorsRes.data.data || []);
        }
      } catch (error) {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      type: '',
      description: '',
      reportDate: new Date().toISOString().split('T')[0],
    });
    setSelectedFile(null);
    setShowCreateModal(true);
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setFormData({
      patientId: report.patient?._id || '',
      doctorId: report.doctor?._id || '',
      type: report.type || '',
      description: report.description || '',
      reportDate: report.reportDate ? report.reportDate.split('T')[0] : '',
    });
    setSelectedFile(null);
    setShowEditModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('patientId', formData.patientId);
      formDataToSend.append('doctorId', formData.doctorId);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('reportDate', formData.reportDate);
      if (selectedFile) {
        formDataToSend.append('pdf', selectedFile);
      }

      const response = await axiosInstance.post('/nurse/reports', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success('Report created successfully');
        setShowCreateModal(false);
        fetchReports();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create report';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('patientId', formData.patientId);
      formDataToSend.append('doctorId', formData.doctorId);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('reportDate', formData.reportDate);
      if (selectedFile) {
        formDataToSend.append('pdf', selectedFile);
      }

      const response = await axiosInstance.patch(`/nurse/reports/${selectedReport._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success('Report updated successfully');
        setShowEditModal(false);
        setSelectedReport(null);
        fetchReports();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update report';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      const response = await axiosInstance.delete(`/nurse/reports/${reportId}`);
      if (response.data.success) {
        toast.success('Report deleted successfully');
        setShowDetailModal(false);
        fetchReports();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete report';
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

  const formatDateWithTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTypeIcon = (type) => {
    const types = {
      operation: BeakerIcon,
      birth: RectangleStackIcon,
      death: HeartIcon,
    };
    const Icon = types[type] || DocumentTextIcon;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      operation: 'bg-blue-100 text-blue-600 border-blue-200',
      birth: 'bg-green-100 text-green-600 border-green-200',
      death: 'bg-red-100 text-red-600 border-red-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getTypeLabel = (type) => {
    const labels = {
      operation: 'Operation',
      birth: 'Birth',
      death: 'Death',
    };
    return labels[type] || type || 'Unknown';
  };

  const filters = ['all', 'operation', 'birth', 'death'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-600 mt-1">Manage patient reports</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Report
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports by patient, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No reports found</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm || filterType !== 'all' ? 'Try adjusting your filters' : 'Create your first report'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${getTypeColor(report.type)} flex items-center justify-center flex-shrink-0 border`}>
                      {getTypeIcon(report.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-800">
                          {getTypeLabel(report.type)} Report
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(report.type)}`}>
                          {getTypeLabel(report.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Patient: {report.patient?.fullName || 'Unknown'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(report.reportDate)}
                        </span>
                        {report.pdfUrl && (
                          <span className="flex items-center text-blue-600">
                            <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                            PDF Attached
                          </span>
                        )}
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-2 truncate max-w-md">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewReport(report)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(report)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report._id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">Report Details</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(selectedReport.type)}`}>
                      {getTypeLabel(selectedReport.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedReport.reportDate)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedReport(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Patient Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-medium text-gray-800">{selectedReport.patient?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedReport.patient?.phone || 'No phone'}</p>
                </div>

                {/* Doctor Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Doctor</p>
                  <p className="font-medium text-gray-800">{selectedReport.doctor?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedReport.doctor?.specialization || 'General'}</p>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                {/* PDF Download */}
                {selectedReport.pdfUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Attached PDF</p>
                    <a
                      href={selectedReport.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-md border border-blue-200 transition-colors"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                      Download PDF
                    </a>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
                  <p>Created: {formatDateWithTime(selectedReport.createdAt)}</p>
                  {selectedReport.updatedAt && (
                    <p>Last Updated: {formatDateWithTime(selectedReport.updatedAt)}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => handleDeleteReport(selectedReport._id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-colors"
                >
                  Delete Report
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedReport(null);
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
                <h3 className="text-lg font-semibold text-gray-800">Create Report</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ patientId: '', doctorId: '', type: '', description: '', reportDate: '' });
                    setSelectedFile(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>Dr. {d.fullName} - {d.specialization}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="operation">Operation Report</option>
                    <option value="birth">Birth Report</option>
                    <option value="death">Death Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Date *</label>
                  <input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="Detailed description of the report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF Attachment</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max file size: 5MB, PDF only</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingOptions}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Report'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Report</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedReport(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>Dr. {d.fullName} - {d.specialization}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="operation">Operation Report</option>
                    <option value="birth">Birth Report</option>
                    <option value="death">Death Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                  <input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description of the report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace PDF (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max file size: 5MB, PDF only</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingOptions}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Report'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;