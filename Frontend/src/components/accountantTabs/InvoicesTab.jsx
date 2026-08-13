import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  EyeIcon,
  XMarkIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    invoiceNumber: '',
    patient: '',
    doctor: '',
    appointment: '',
    admission: '',
    issueDate: '',
    dueDate: '',
    items: [],
    discount: 0,
    tax: 0,
    paidAmount: 0,
    paymentMethod: '',
    notes: '',
  });

  const [itemInput, setItemInput] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  useEffect(() => {
    fetchInvoices();
    fetchOptions();
  }, []);

  useEffect(() => {
    let filtered = invoices;
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(i =>
        i.invoiceNumber?.toLowerCase().includes(term) ||
        i.patient?.fullName?.toLowerCase().includes(term) ||
        i.title?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.paymentStatus === filterStatus);
    }
    
    setFilteredInvoices(filtered);
  }, [searchTerm, filterStatus, invoices]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/accountant/invoices');
      if (response.data.success) {
        setInvoices(response.data.data || []);
        setFilteredInvoices(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch invoices';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      // Fetch patients
      const patientsRes = await axiosInstance.get('/accountant/patients');
      if (patientsRes.data.success) {
        setPatients(patientsRes.data.data || []);
      }

      // Fetch doctors
      const doctorsRes = await axiosInstance.get('/accountant/doctors');
      if (doctorsRes.data.success) {
        setDoctors(doctorsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const response = await axiosInstance.get(`/accountant/invoices/${invoiceId}`);
      if (response.data.success) {
        setSelectedInvoice(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch invoice details';
      toast.error(message);
    }
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      invoiceNumber: '',
      patient: '',
      doctor: '',
      appointment: '',
      admission: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [],
      discount: 0,
      tax: 0,
      paidAmount: 0,
      paymentMethod: '',
      notes: '',
    });
    setItemInput({ description: '', quantity: 1, unitPrice: 0 });
    setShowCreateModal(true);
  };

  const openEditModal = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      title: invoice.title || '',
      invoiceNumber: invoice.invoiceNumber || '',
      patient: invoice.patient?._id || '',
      doctor: invoice.doctor?._id || '',
      appointment: invoice.appointment?._id || '',
      admission: invoice.admission?._id || '',
      issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : '',
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
      items: invoice.items || [],
      discount: invoice.discount || 0,
      tax: invoice.tax || 0,
      paidAmount: invoice.paidAmount || 0,
      paymentMethod: invoice.paymentMethod || '',
      notes: invoice.notes || '',
    });
    setShowEditModal(true);
  };

  const addItem = () => {
    if (!itemInput.description.trim()) {
      toast.error('Please enter item description');
      return;
    }
    if (itemInput.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    if (itemInput.unitPrice < 0) {
      toast.error('Unit price cannot be negative');
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: itemInput.description.trim(),
        quantity: itemInput.quantity,
        unitPrice: itemInput.unitPrice,
        amount: itemInput.quantity * itemInput.unitPrice,
      }]
    }));
    setItemInput({ description: '', quantity: 1, unitPrice: 0 });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = (items, discount, tax) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, total };
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/accountant/invoices', formData);
      if (response.data.success) {
        toast.success('Invoice created successfully');
        setShowCreateModal(false);
        fetchInvoices();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create invoice';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/accountant/invoices/${selectedInvoice._id}`, formData);
      if (response.data.success) {
        toast.success('Invoice updated successfully');
        setShowEditModal(false);
        setSelectedInvoice(null);
        fetchInvoices();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update invoice';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mark as Paid
const handleMarkAsPaid = async (invoiceId) => {
  await axiosInstance.patch(`/accountant/invoices/${invoiceId}/payment-status`, {
    paymentStatus: 'paid',
    paidAmount: invoice.totalAmount
  });
};

// Mark as Unpaid
const handleMarkAsUnpaid = async (invoiceId) => {
  await axiosInstance.patch(`/accountant/invoices/${invoiceId}/payment-status`, {
    paymentStatus: 'unpaid',
    paidAmount: 0
  });
};

// Partial Payment
const handlePartialPayment = async (invoiceId, amount) => {
  await axiosInstance.patch(`/accountant/invoices/${invoiceId}/payment-status`, {
    paymentStatus: 'partially_paid',
    paidAmount: amount
  });
};

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const response = await axiosInstance.delete(`/accountant/invoices/${invoiceId}`);
      if (response.data.success) {
        toast.success('Invoice deleted successfully');
        setShowDetailModal(false);
        fetchInvoices();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete invoice';
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

  const formatCurrency = (amount) => {
    return `$${amount?.toFixed(2) || '0.00'}`;
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        label: 'Paid',
      },
      unpaid: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircleIcon,
        label: 'Unpaid',
      },
      partially_paid: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: ClockIcon,
        label: 'Partially Paid',
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircleIcon,
        label: 'Cancelled',
      },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const statusOptions = ['all', 'paid', 'unpaid', 'partially_paid', 'cancelled'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading invoices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">Manage all invoices and payments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices by number, patient, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No invoices found</p>
          <p className="text-gray-500 text-sm mt-1">Create your first invoice</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-800">
                          {invoice.invoiceNumber || 'INV-' + invoice._id.slice(-6)}
                        </h3>
                        {getPaymentStatusBadge(invoice.paymentStatus)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Patient: {invoice.patient?.fullName || 'Unknown'} • {invoice.title || 'No title'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          Issued: {formatDate(invoice.issueDate)}
                        </span>
                        {invoice.dueDate && (
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Due: {formatDate(invoice.dueDate)}
                          </span>
                        )}
                        <span className="flex items-center font-semibold text-gray-800">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewInvoice(invoice._id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(invoice)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoice._id)}
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
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedInvoice.invoiceNumber || 'Invoice Details'}
                    </h3>
                    {getPaymentStatusBadge(selectedInvoice.paymentStatus)}
                  </div>
                  <p className="text-sm text-gray-500">
                    Issued: {formatDate(selectedInvoice.issueDate)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedInvoice(null);
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
                  <p className="font-medium text-gray-800">{selectedInvoice.patient?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedInvoice.patient?.phone || 'No phone'}</p>
                </div>

                {/* Doctor Info */}
                {selectedInvoice.doctor && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Doctor</p>
                    <p className="font-medium text-gray-800">Dr. {selectedInvoice.doctor?.fullName || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{selectedInvoice.doctor?.specialization || 'General'}</p>
                  </div>
                )}

                {/* Items */}
                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-800">{item.description}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-800">{formatCurrency(item.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800">{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-green-600">-{formatCurrency(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    {selectedInvoice.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-800">{formatCurrency(selectedInvoice.tax)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                      <span className="text-gray-800">Total</span>
                      <span className="text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid Amount</span>
                      <span className="text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-700">Due Amount</span>
                      <span className={selectedInvoice.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(selectedInvoice.dueAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}
              </div>
              

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => handleDeleteInvoice(selectedInvoice._id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-colors"
                >
                  Delete Invoice
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedInvoice(null);
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Create Invoice</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', invoiceNumber: '', patient: '', doctor: '', appointment: '', admission: '', issueDate: '', dueDate: '', items: [], discount: 0, tax: 0, paidAmount: 0, paymentMethod: '', notes: '' });
                    setItemInput({ description: '', quantity: 1, unitPrice: 0 });
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Consultation Fee"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="INV-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                    <select
                      value={formData.patient}
                      onChange={(e) => setFormData(prev => ({ ...prev, patient: e.target.value }))}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                    <select
                      value={formData.doctor}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>Dr. {d.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      placeholder="Description *"
                      value={itemInput.description}
                      onChange={(e) => setItemInput(prev => ({ ...prev, description: e.target.value }))}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={itemInput.quantity}
                      onChange={(e) => setItemInput(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={itemInput.unitPrice}
                      onChange={(e) => setItemInput(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Add Item
                  </button>
                  {formData.items.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                          <span className="text-sm">{item.description} - {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.amount.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ($)</label>
                    <input
                      type="number"
                      value={formData.tax}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                    <input
                      type="number"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingOptions}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Invoice</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateInvoice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Consultation Fee"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="INV-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                    <select
                      value={formData.patient}
                      onChange={(e) => setFormData(prev => ({ ...prev, patient: e.target.value }))}
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
                      value={formData.doctor}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>Dr. {d.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      placeholder="Description *"
                      value={itemInput.description}
                      onChange={(e) => setItemInput(prev => ({ ...prev, description: e.target.value }))}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={itemInput.quantity}
                      onChange={(e) => setItemInput(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={itemInput.unitPrice}
                      onChange={(e) => setItemInput(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Add Item
                  </button>
                  {formData.items.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                          <span className="text-sm">{item.description} - {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.amount.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ($)</label>
                    <input
                      type="number"
                      value={formData.tax}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                    <input
                      type="number"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                  />
                </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
  <select
    value={formData.paymentStatus}
    onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="unpaid">Unpaid</option>
    <option value="partially_paid">Partially Paid</option>
    <option value="paid">Paid</option>
    <option value="cancelled">Cancelled</option>
  </select>
</div>
                <button
                  type="submit"
                  disabled={submitting || loadingOptions}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Invoice'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;