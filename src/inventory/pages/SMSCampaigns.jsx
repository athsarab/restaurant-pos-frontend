import { useEffect, useState } from 'react';
import { PlusIcon, PaperAirplaneIcon, EyeIcon, TrashIcon, ChatBubbleLeftEllipsisIcon, UsersIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import CustomerManagement from '../components/CustomerManagement';

export default function SMSCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customerMgmtOpen, setCustomerMgmtOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    message: '',
    recipientType: 'all',
    selectedCustomerIds: []
  });
  const [messageInfo, setMessageInfo] = useState({
    length: 0,
    parts: 1,
    remainingChars: 160
  });

  const resetForm = () => {
    setForm({
      name: '',
      message: '',
      recipientType: 'all',
      selectedCustomerIds: []
    });
    setMessageInfo({ length: 0, parts: 1, remainingChars: 160 });
  };

  const load = async () => {
    try {
      setLoading(true);
      const [campaignsRes, customersRes, analyticsRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/campaigns/customers'),
        api.get('/campaigns/analytics')
      ]);
      setCampaigns(campaignsRes.data);
      setCustomers(customersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load campaigns data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (form.message) {
      checkMessageInfo();
    }
  }, [form.message]);

  const checkMessageInfo = async () => {
    try {
      const response = await api.post('/campaigns/preview', {
        message: form.message
      });
      setMessageInfo(response.data);
    } catch (error) {
      console.error('Error checking message:', error);
    }
  };

  const save = async () => {
    if (!form.name || !form.message) {
      alert('Campaign name and message are required');
      return;
    }

    try {
      setLoading(true);
      await api.post('/campaigns', form);
      setOpen(false);
      resetForm();
      load();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const sendCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/campaigns/${campaignId}/send`);
      alert(`Campaign sent successfully! ${response.data.results.success} messages sent.`);
      load();
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert(error.response?.data?.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/campaigns/${campaignId}`);
      load();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert(error.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelection = (customerId) => {
    setForm(prev => ({
      ...prev,
      selectedCustomerIds: prev.selectedCustomerIds.includes(customerId)
        ? prev.selectedCustomerIds.filter(id => id !== customerId)
        : [...prev.selectedCustomerIds, customerId]
    }));
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-slate-600',
      sending: 'bg-yellow-600',
      completed: 'bg-green-600',
      failed: 'bg-red-600'
    };
    return (
      <span className={`px-2 py-1 rounded text-white text-xs font-medium ${colors[status] || 'bg-slate-600'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getRecipientCount = () => {
    return form.recipientType === 'all' ? customers.length : form.selectedCustomerIds.length;
  };

  const campaignColumns = [
    { key: 'name', title: 'Campaign Name' },
    { 
      key: 'message', 
      title: 'Message',
      render: (message) => (
        <div className="max-w-xs truncate" title={message}>
          {message}
        </div>
      )
    },
    { 
      key: 'status', 
      title: 'Status',
      render: (status) => getStatusBadge(status)
    },
    { 
      key: 'totalRecipients', 
      title: 'Recipients',
      render: (total, row) => (
        <div className="text-center">
          <div>{total}</div>
          {row.status !== 'draft' && (
            <div className="text-xs text-slate-400">
              ✓{row.successCount} / ✗{row.failureCount}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'createdAt', 
      title: 'Created',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'draft' && (
            <button
              onClick={() => sendCampaign(row._id)}
              className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-slate-800"
              disabled={loading}
              title="Send Campaign"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => { setSelectedCampaign(row); setDetailsOpen(true); }}
            className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {row.status === 'draft' && (
            <button
              onClick={() => deleteCampaign(row._id)}
              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800"
              disabled={loading}
              title="Delete Campaign"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Campaigns" className="text-center">
          <div className="text-3xl font-bold text-white">{analytics.totalCampaigns || 0}</div>
        </Card>
        <Card title="Completed" className="text-center">
          <div className="text-3xl font-bold text-green-400">{analytics.completedCampaigns || 0}</div>
        </Card>
        <Card title="Messages Sent" className="text-center">
          <div className="text-3xl font-bold text-blue-400">{analytics.totalMessagesSent || 0}</div>
        </Card>
        <Card title="Success Rate" className="text-center">
          <div className="text-3xl font-bold text-purple-400">{analytics.successRate || 0}%</div>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card 
        title="SMS Campaigns" 
        actions={
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              onClick={() => setCustomerMgmtOpen(true)}
              disabled={loading}
            >
              <UsersIcon className="w-4 h-4" />
              Manage Customers
            </button>
            <button 
              className="px-3 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2"
              onClick={() => setOpen(true)}
              disabled={loading}
            >
              <PlusIcon className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
        }
      >
        <DataTable
          data={campaigns}
          columns={campaignColumns}
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          searchPlaceholder="Search campaigns..."
        />
      </Card>

      {/* Create Campaign Modal */}
      <Modal open={open} title="Create New SMS Campaign" onClose={() => { setOpen(false); resetForm(); }} size="lg">
        <div className="space-y-4">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Campaign Name</label>
            <input
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter campaign name"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Message</label>
            <textarea
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
              rows="4"
              maxLength="160"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Enter your SMS message (max 160 characters)"
            />
            <div className="mt-1 text-xs text-slate-400 flex justify-between">
              <span>{messageInfo.length}/160 characters • {messageInfo.parts} SMS part(s)</span>
              <span>{messageInfo.remainingChars} remaining</span>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Recipients</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="recipientType"
                  value="all"
                  checked={form.recipientType === 'all'}
                  onChange={(e) => setForm({ ...form, recipientType: e.target.value })}
                  className="text-primary-600"
                />
                <span className="text-white">All Customers ({customers.length})</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="recipientType"
                  value="selected"
                  checked={form.recipientType === 'selected'}
                  onChange={(e) => setForm({ ...form, recipientType: e.target.value })}
                  className="text-primary-600"
                />
                <span className="text-white">Selected Customers</span>
              </label>
            </div>
          </div>

          {/* Customer Selection */}
          {form.recipientType === 'selected' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Select Customers ({form.selectedCustomerIds.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto bg-slate-800 border border-slate-700 rounded p-3 space-y-2">
                {customers.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    <ChatBubbleLeftEllipsisIcon className="w-8 h-8 mx-auto mb-2" />
                    <div>No customers found</div>
                    <div className="text-xs mt-1">Customers are created automatically when orders include mobile numbers</div>
                  </div>
                ) : (
                  customers.map((customer) => (
                    <label key={customer._id} className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded">
                      <input
                        type="checkbox"
                        checked={form.selectedCustomerIds.includes(customer._id)}
                        onChange={() => handleCustomerSelection(customer._id)}
                        className="text-primary-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{customer.name}</div>
                        <div className="text-sm text-slate-400">{customer.phone}</div>
                        <div className="text-xs text-slate-500">
                          {customer.totalOrders} orders • Rs. {customer.totalSpent?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-slate-800 rounded border border-slate-700 p-4">
            <div className="text-sm text-slate-400 mb-2">Preview:</div>
            <div className="bg-slate-900 rounded p-3 min-h-[60px] text-white text-sm">
              {form.message || 'Your message will appear here...'}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Recipients: {getRecipientCount()} customers
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white"
              onClick={() => { setOpen(false); resetForm(); }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={save}
              disabled={loading || !form.name || !form.message}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Campaign Details Modal */}
      <Modal open={detailsOpen} title="Campaign Details" onClose={() => setDetailsOpen(false)} size="lg">
        {selectedCampaign && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Campaign Name</label>
                <div className="text-white">{selectedCampaign.name}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                {getStatusBadge(selectedCampaign.status)}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Message</label>
              <div className="bg-slate-800 rounded p-3 text-white">{selectedCampaign.message}</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <label className="block text-sm text-slate-400 mb-1">Total Recipients</label>
                <div className="text-2xl font-bold text-white">{selectedCampaign.totalRecipients}</div>
              </div>
              <div className="text-center">
                <label className="block text-sm text-slate-400 mb-1">Successful</label>
                <div className="text-2xl font-bold text-green-400">{selectedCampaign.successCount}</div>
              </div>
              <div className="text-center">
                <label className="block text-sm text-slate-400 mb-1">Failed</label>
                <div className="text-2xl font-bold text-red-400">{selectedCampaign.failureCount}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Created</label>
                <div className="text-white">{new Date(selectedCampaign.createdAt).toLocaleString()}</div>
              </div>
              {selectedCampaign.sentAt && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Sent</label>
                  <div className="text-white">{new Date(selectedCampaign.sentAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Management Modal */}
      <CustomerManagement
        isOpen={customerMgmtOpen}
        onClose={() => setCustomerMgmtOpen(false)}
        onCustomersUpdated={load}
      />
    </div>
  );
}
