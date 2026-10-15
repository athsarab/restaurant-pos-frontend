import { useState, useEffect } from 'react';
import { PlusIcon, UsersIcon, TrashIcon, PencilIcon, PhoneIcon, UserPlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function CustomerManagement({ isOpen, onClose, onCustomersUpdated }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add-single');
  
  // Single customer form
  const [singleForm, setSingleForm] = useState({ name: '', phone: '' });
  const [phoneValidation, setPhoneValidation] = useState({});
  
  // Bulk add form
  const [bulkText, setBulkText] = useState('');
  const [bulkResults, setBulkResults] = useState(null);
  
  // Edit customer
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/campaigns/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = async (phone) => {
    if (!phone || phone.length < 9) {
      setPhoneValidation({});
      return;
    }

    try {
      const response = await api.post('/campaigns/customers/validate-phone', { phone });
      setPhoneValidation(response.data);
    } catch (error) {
      console.error('Error validating phone:', error);
      setPhoneValidation({ valid: false, message: 'Error validating phone number' });
    }
  };

  const addSingleCustomer = async () => {
    if (!singleForm.name || !singleForm.phone) {
      alert('Name and phone number are required');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/campaigns/customers', singleForm);
      alert(response.data.message);
      setSingleForm({ name: '', phone: '' });
      setPhoneValidation({});
      await loadCustomers();
      onCustomersUpdated?.();
    } catch (error) {
      console.error('Error adding customer:', error);
      alert(error.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const processBulkText = () => {
    if (!bulkText.trim()) {
      alert('Please enter customer data');
      return;
    }

    const lines = bulkText.trim().split('\n');
    const customers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try different formats
      // Format 1: "John Doe, 0771234567"
      let match = line.match(/^(.+?)\s*,\s*([\d+\s-]+)$/);
      if (match) {
        customers.push({ name: match[1].trim(), phone: match[2].trim() });
        continue;
      }

      // Format 2: "John Doe - 0771234567"
      match = line.match(/^(.+?)\s*-\s*([\d+\s-]+)$/);
      if (match) {
        customers.push({ name: match[1].trim(), phone: match[2].trim() });
        continue;
      }

      // Format 3: "John Doe 0771234567" (space separated)
      match = line.match(/^(.+?)\s+([\d+\s-]+)$/);
      if (match) {
        customers.push({ name: match[1].trim(), phone: match[2].trim() });
        continue;
      }

      // If no pattern matches, skip this line
      console.warn(`Skipping invalid line ${i + 1}: ${line}`);
    }

    if (customers.length === 0) {
      alert('No valid customer data found. Please check the format.');
      return;
    }

    return customers;
  };

  const bulkAddCustomers = async () => {
    const customers = processBulkText();
    if (!customers) return;

    try {
      setLoading(true);
      const response = await api.post('/campaigns/customers/bulk', { customers });
      setBulkResults(response.data);
      setBulkText('');
      await loadCustomers();
      onCustomersUpdated?.();
    } catch (error) {
      console.error('Error bulk adding customers:', error);
      alert(error.response?.data?.message || 'Failed to add customers');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setEditForm({ name: customer.name, phone: customer.phone });
  };

  const saveEdit = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/campaigns/customers/${editingCustomer._id}`, editForm);
      alert(response.data.message);
      setEditingCustomer(null);
      setEditForm({ name: '', phone: '' });
      await loadCustomers();
      onCustomersUpdated?.();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert(error.response?.data?.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/campaigns/customers/${customer._id}`);
      alert(response.data.message);
      await loadCustomers();
      onCustomersUpdated?.();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <UsersIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Customer Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'add-single'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('add-single')}
          >
            Add Single Customer
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'bulk-add'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('bulk-add')}
          >
            Bulk Add
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'manage'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Customers ({customers.length})
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Add Single Customer Tab */}
          {activeTab === 'add-single' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <UserPlusIcon className="w-5 h-5 text-green-400" />
                  Add New Customer
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Customer Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none"
                      placeholder="Enter customer name"
                      value={singleForm.name}
                      onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Phone Number</label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded text-white placeholder-slate-400 focus:outline-none ${
                        phoneValidation.valid === false
                          ? 'bg-red-900 border-red-500 focus:border-red-400'
                          : phoneValidation.valid
                          ? 'bg-green-900 border-green-500 focus:border-green-400'
                          : 'bg-slate-700 border-slate-600 focus:border-blue-400'
                      }`}
                      placeholder="e.g., 0771234567, +94771234567"
                      value={singleForm.phone}
                      onChange={(e) => {
                        setSingleForm({ ...singleForm, phone: e.target.value });
                        validatePhoneNumber(e.target.value);
                      }}
                    />
                    
                    {phoneValidation.message && (
                      <p className={`text-xs mt-1 ${
                        phoneValidation.valid ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {phoneValidation.message}
                      </p>
                    )}
                    
                    {phoneValidation.exists && (
                      <p className="text-xs mt-1 text-orange-400">
                        Warning: Customer already exists - {phoneValidation.existingCustomer?.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={addSingleCustomer}
                    disabled={loading || !singleForm.name || !singleForm.phone || phoneValidation.valid === false}
                  >
                    {loading ? 'Adding...' : 'Add Customer'}
                  </button>
                </div>
              </div>
              
              {/* Format Examples */}
              <div className="bg-slate-800 rounded p-4">
                <h4 className="text-md font-medium text-white mb-3">Supported Phone Formats:</h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>• <span className="text-green-400">0771234567</span> - Local format</div>
                  <div>• <span className="text-green-400">+94771234567</span> - International format</div>
                  <div>• <span className="text-green-400">94771234567</span> - E.164 format</div>
                  <div>• <span className="text-green-400">771234567</span> - Without country code</div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Add Tab */}
          {activeTab === 'bulk-add' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                  Bulk Add Customers
                </h3>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Customer Data (One per line)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none"
                    rows="10"
                    placeholder={`John Doe, 0771234567\nJane Smith - 0779876543\nBob Johnson 0766555444\n\nSupported formats:\nName, Phone\nName - Phone\nName Phone`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
                
                <div className="mt-4">
                  <button
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={bulkAddCustomers}
                    disabled={loading || !bulkText.trim()}
                  >
                    {loading ? 'Processing...' : 'Add Customers'}
                  </button>
                </div>
              </div>
              
              {/* Bulk Results */}
              {bulkResults && (
                <div className="bg-slate-800 rounded p-4">
                  <h4 className="text-md font-medium text-white mb-3">Import Results</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{bulkResults.summary?.successful || 0}</div>
                      <div className="text-sm text-slate-400">Successfully Added</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{bulkResults.summary?.duplicates || 0}</div>
                      <div className="text-sm text-slate-400">Duplicates Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{bulkResults.summary?.failed || 0}</div>
                      <div className="text-sm text-slate-400">Failed</div>
                    </div>
                  </div>
                  
                  {bulkResults.results?.failed?.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-red-400 mb-2">Failed Entries:</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkResults.results.failed.map((item, index) => (
                          <div key={index} className="text-xs text-red-300 bg-red-900/20 p-2 rounded">
                            {item.data.name} - {item.data.phone}: {item.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
                    onClick={() => setBulkResults(null)}
                  >
                    Clear Results
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manage Customers Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">All Customers ({customers.length})</h3>
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                  onClick={loadCustomers}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              <div className="bg-slate-800 rounded overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {customers.length === 0 ? (
                    <div className="text-center py-8">
                      <UsersIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No customers found</p>
                      <p className="text-slate-500 text-sm mt-1">Add customers using the tabs above</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-slate-700 sticky top-0">
                        <tr className="text-left">
                          <th className="px-4 py-3 text-slate-300 font-medium">Name</th>
                          <th className="px-4 py-3 text-slate-300 font-medium">Phone</th>
                          <th className="px-4 py-3 text-slate-300 font-medium text-center">Orders</th>
                          <th className="px-4 py-3 text-slate-300 font-medium text-right">Total Spent</th>
                          <th className="px-4 py-3 text-slate-300 font-medium text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer._id} className="border-t border-slate-700 hover:bg-slate-750">
                            <td className="px-4 py-3">
                              {editingCustomer?._id === customer._id ? (
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                              ) : (
                                <div className="text-white font-medium">{customer.name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingCustomer?._id === customer._id ? (
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                              ) : (
                                <div className="text-slate-300 flex items-center gap-2">
                                  <PhoneIcon className="w-4 h-4" />
                                  {customer.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-blue-400 font-medium">{customer.totalOrders}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-green-400 font-medium">
                                LKR {customer.totalSpent?.toLocaleString() || '0'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {editingCustomer?._id === customer._id ? (
                                  <>
                                    <button
                                      className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-slate-700"
                                      onClick={saveEdit}
                                      disabled={loading}
                                      title="Save"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
                                      onClick={() => setEditingCustomer(null)}
                                      title="Cancel"
                                    >
                                      ✗
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-700"
                                      onClick={() => startEdit(customer)}
                                      title="Edit"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    {customer.totalOrders === 0 && (
                                      <button
                                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-700"
                                        onClick={() => deleteCustomer(customer)}
                                        title="Delete"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}