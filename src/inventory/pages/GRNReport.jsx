import { useState, useEffect } from 'react';
import { EyeIcon, CheckIcon, XMarkIcon, PencilIcon, ArrowPathIcon, FunnelIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useDomain } from '../context/DomainContext';
import api from '../services/api';

export default function GRNReport() {
  const { domain } = useDomain();
  const [grns, setGRNs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    approvalStatus: '',
    supplierId: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 10
  });

  const [suppliers, setSuppliers] = useState([]);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [domain]);

  useEffect(() => {
    fetchGRNs();
    fetchStats();
  }, [domain, filters]);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      const data = response.data;
      setSuppliers(Array.isArray(data) ? data : (data?.suppliers || []));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params[key] = filters[key];
      });

      const response = await api.get('/grn', { params });

      setGRNs(response.data.grns || []);
      setError('');
    } catch (error) {
      console.error('Error fetching GRNs:', error);
      setError('Failed to load GRN data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/grn/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewGRN = async (grnId) => {
    try {
      const response = await api.get(`/grn/${grnId}`);
      setSelectedGRN(response.data.grn);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching GRN details:', error);
      alert('Failed to load GRN details');
    }
  };

  const handleApproveGRN = async (grnId) => {
    if (!confirm('Are you sure you want to approve this GRN?')) return;

    try {
      await api.post(`/grn/${grnId}/approve`, {});
      alert('GRN approved successfully');
      fetchGRNs();
      fetchStats();
    } catch (error) {
      console.error('Error approving GRN:', error);
      alert(error.response?.data?.message || 'Failed to approve GRN');
    }
  };

  const handleUpdateInventory = async (grnId) => {
    if (!confirm('Are you sure you want to update inventory from this GRN? This action cannot be undone.')) return;

    try {
      await api.post(`/grn/${grnId}/update-inventory`, {});
      alert('Inventory updated successfully');
      fetchGRNs();
      fetchStats();
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert(error.response?.data?.message || 'Failed to update inventory');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-600',
      approved: 'bg-green-900/50 text-green-300 border-green-600',
      rejected: 'bg-red-900/50 text-red-300 border-red-600',
      completed: 'bg-blue-900/50 text-blue-300 border-blue-600',
      draft: 'bg-slate-700 text-slate-300 border-slate-600'
    };
    return badges[status] || badges.pending;
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: 'bg-green-900/50 text-green-300',
      unpaid: 'bg-red-900/50 text-red-300',
      partial: 'bg-yellow-900/50 text-yellow-300'
    };
    return badges[status] || badges.unpaid;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">GRN Report</h1>
            <p className="text-slate-400 mt-1">Goods Receipt Note management and tracking</p>
          </div>
          <button
            onClick={() => window.location.href = '/inventory/purchase-order'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            New GRN
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total GRNs</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalGRNs}</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pendingApproval}</p>
              </div>
              <FunnelIcon className="w-10 h-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-white mt-1">Rs. {stats.totalAmount?.toLocaleString()}</p>
              </div>
              <CheckIcon className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Balance Due</p>
                <p className="text-2xl font-bold text-red-400 mt-1">Rs. {stats.totalBalance?.toLocaleString()}</p>
              </div>
              <XMarkIcon className="w-10 h-10 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="form-input"
              placeholder="GRN#, Invoice, Supplier..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="form-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Approval Status</label>
            <select
              value={filters.approvalStatus}
              onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
              className="form-select"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Supplier</label>
            <select
              value={filters.supplierId}
              onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
              className="form-select"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                status: '',
                approvalStatus: '',
                supplierId: '',
                startDate: '',
                endDate: '',
                search: '',
                page: 1,
                limit: 10
              })}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : grns.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No GRNs found</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">NO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">GRN Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {grns.map((grn, index) => (
                  <tr key={grn._id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {index + 1 + (filters.page - 1) * filters.limit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{grn.grnNumber}</div>
                      {grn.poNumber && (
                        <div className="text-xs text-slate-400">PO: {grn.poNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {grn.supplierName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {grn.supplierInvoice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(grn.receivedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(grn.status)}`}>
                        {grn.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadge(grn.paymentStatus)}`}>
                        {grn.paymentStatus}
                      </span>
                      <div className="text-xs text-slate-400 mt-1">
                        Paid: Rs. {grn.paidAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">Rs. {grn.totalAmount?.toLocaleString()}</div>
                      {grn.balanceAmount > 0 && (
                        <div className="text-xs text-red-400">Due: Rs. {grn.balanceAmount?.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleViewGRN(grn._id)}
                          className="text-blue-400 hover:text-blue-300"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        
                        {grn.approvalStatus === 'pending' && (
                          <button
                            onClick={() => handleApproveGRN(grn._id)}
                            className="text-green-400 hover:text-green-300"
                            title="Approve"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                        )}

                        {grn.approvalStatus === 'approved' && !grn.inventoryUpdated && (
                          <button
                            onClick={() => handleUpdateInventory(grn._id)}
                            className="text-purple-400 hover:text-purple-300"
                            title="Update Inventory"
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-700">
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-white">
                    Rs. {grns.reduce((sum, grn) => sum + grn.totalAmount, 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* GRN Detail Modal */}
      {showModal && selectedGRN && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">GRN Details - {selectedGRN.grnNumber}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Supplier</p>
                  <p className="text-white font-medium">{selectedGRN.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Supplier Invoice</p>
                  <p className="text-white font-medium">{selectedGRN.supplierInvoice}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Order Date</p>
                  <p className="text-white">{new Date(selectedGRN.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Received Date</p>
                  <p className="text-white">{new Date(selectedGRN.receivedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(selectedGRN.status)}`}>
                    {selectedGRN.approvalStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Inventory Updated</p>
                  <p className={`font-medium ${selectedGRN.inventoryUpdated ? 'text-green-400' : 'text-yellow-400'}`}>
                    {selectedGRN.inventoryUpdated ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300">Ordered</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300">Received</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300">Unit</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300">Price per unit</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {selectedGRN.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-slate-300">{item.itemName}</td>
                          <td className="px-4 py-2 text-sm text-slate-300">{item.orderedQuantity}</td>
                          <td className="px-4 py-2 text-sm text-white font-medium">{item.receivedQuantity}</td>
                          <td className="px-4 py-2 text-sm text-slate-300">{item.unit}</td>
                          <td className="px-4 py-2 text-sm text-slate-300">Rs. {item.costPrice}</td>
                          <td className="px-4 py-2 text-sm text-white font-medium">Rs. {item.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Financial Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-medium">Rs. {selectedGRN.subtotal?.toLocaleString()}</span>
                  </div>
                  {selectedGRN.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount:</span>
                      <span className="font-medium">- Rs. {selectedGRN.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedGRN.deliveryCharges > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Delivery Charges:</span>
                      <span className="font-medium">Rs. {selectedGRN.deliveryCharges?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg border-t border-slate-600 pt-2">
                    <span>Total Amount:</span>
                    <span>Rs. {selectedGRN.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>Paid Amount:</span>
                    <span className="font-medium">Rs. {selectedGRN.paidAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-400 font-bold">
                    <span>Balance:</span>
                    <span>Rs. {selectedGRN.balanceAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedGRN.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                  <p className="text-slate-300 bg-slate-700 p-3 rounded">{selectedGRN.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
