import React, { useState, useEffect } from 'react';
import { toast } from '../common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/patient/invoices');

      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch invoices';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedInvoice(null);
  };

  const handleDownloadPDF = async (invoiceId) => {
    setDownloading(true);
    try {
      const response = await axiosInstance.get(`/patient/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to download invoice';
      toast.error(message);
    } finally {
      setDownloading(false);
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
        icon: PendingIcon,
        label: 'Partially Paid',
      },
      refunded: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: CurrencyDollarIcon,
        label: 'Refunded',
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

  // Loading State
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading invoices...</div>
        </div>
      </div>
    );
  }

  // Empty State
  if (invoices.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <CurrencyDollarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Invoices Found</p>
          <p className="text-gray-500 text-sm mt-1">
            You don't have any invoices yet. Invoices will appear here after your appointments or admissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
        <p className="text-sm text-gray-600 mt-1">
          View your billing history and payment records
        </p>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div
            key={invoice._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Left - Invoice Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CurrencyDollarIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-800">
                        {invoice.invoiceNumber || `INV-${invoice._id.slice(-6).toUpperCase()}`}
                      </h3>
                      {getPaymentStatusBadge(invoice.paymentStatus)}
                    </div>
                    
                    {/* Doctor Info */}
                    {invoice.doctor && (
                      <p className="text-sm text-gray-600">
                        Doctor: Dr. {invoice.doctor.fullName || 'Unknown'} • {invoice.doctor.specialization || 'General'}
                      </p>
                    )}

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
                        Total: {formatCurrency(invoice.totalAmount)}
                      </span>
                      {invoice.paymentStatus !== 'paid' && invoice.dueAmount > 0 && (
                        <span className="flex items-center text-red-600 font-medium">
                          Due: {formatCurrency(invoice.dueAmount)}
                        </span>
                      )}
                    </div>

                    {invoice.items && invoice.items.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {invoice.items.length} item(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleViewDetails(invoice)}
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-md transition-colors border border-emerald-200"
                >
                  <EyeIcon className="w-4 h-4 mr-1.5" />
                  View
                </button>
                <button
                  onClick={() => handleDownloadPDF(invoice._id)}
                  disabled={downloading}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                  PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      Invoice Details
                    </h3>
                    {getPaymentStatusBadge(selectedInvoice.paymentStatus)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedInvoice.invoiceNumber || `INV-${selectedInvoice._id.slice(-8).toUpperCase()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedInvoice._id)}
                    disabled={downloading}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                    Download PDF
                  </button>
                  <button
                    onClick={closeModal}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Issue Date</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(selectedInvoice.issueDate)}
                    </p>
                  </div>
                  {selectedInvoice.dueDate && (
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(selectedInvoice.dueDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reference Info */}
                {(selectedInvoice.doctor || selectedInvoice.appointment || selectedInvoice.admission) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Reference Information</p>
                    <div className="space-y-1 text-sm">
                      {selectedInvoice.doctor && (
                        <p className="text-gray-700">
                          <span className="text-gray-500">Doctor:</span> Dr. {selectedInvoice.doctor.fullName} ({selectedInvoice.doctor.department})
                        </p>
                      )}
                      {selectedInvoice.appointment && (
                        <p className="text-gray-700">
                          <span className="text-gray-500">Appointment:</span> {formatDate(selectedInvoice.appointment.appointmentDate)} at {selectedInvoice.appointment.appointmentTime}
                        </p>
                      )}
                      {selectedInvoice.admission && (
                        <p className="text-gray-700">
                          <span className="text-gray-500">Admission:</span> Bed {selectedInvoice.admission.bedNumber} ({selectedInvoice.admission.bedType})
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Items */}
                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Items</p>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.description}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(item.amount)}
                          </p>
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
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-gray-700">Due Amount</span>
                      <span className={selectedInvoice.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(selectedInvoice.dueAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method & Notes */}
                {selectedInvoice.paymentMethod && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-medium text-gray-800 capitalize">{selectedInvoice.paymentMethod}</p>
                  </div>
                )}

                {selectedInvoice.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
                  <p>Created: {formatDate(selectedInvoice.createdAt)}</p>
                  {selectedInvoice.updatedAt && (
                    <p>Last Updated: {formatDate(selectedInvoice.updatedAt)}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;