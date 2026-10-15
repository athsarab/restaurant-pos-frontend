import { useState, useEffect } from 'react';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Card from '../components/ui/Card';
import RequestForm from '../components/RequestForm';
import RequestCard from '../components/RequestCard';
import RequestDetailsModal from '../components/RequestDetailsModal';

export default function StockRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsAction, setDetailsAction] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
      // For now, use empty array if endpoint doesn't exist
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (requestData) => {
    try {
      await api.post('/stock-requests', requestData);
      loadRequests();
      alert('Request submitted successfully!');
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await api.patch(`/stock-requests/${requestId}/approve`);
      loadRequests();
      alert('Request approved successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  };

  const handleRejectRequest = async (requestId, reason) => {
    try {
      await api.patch(`/stock-requests/${requestId}/reject`, { reason });
      loadRequests();
      alert('Request rejected.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  };

  const handleViewRequest = (request, action = null) => {
    setSelectedRequest(request);
    setDetailsAction(action);
  };

  const closeDetailsModal = (event, action) => {
    if (action) {
      setDetailsAction(action);
      return;
    }
    setSelectedRequest(null);
    setDetailsAction(null);
  };

  // Filter requests based on selected criteria
  const filteredRequests = requests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    const urgencyMatch = filterUrgency === 'all' || request.urgency === filterUrgency;
    
    // Kitchen staff can only see their own requests
    const userMatch = user?.role === 'kitchen' 
      ? request.requestedBy?._id === user.id 
      : true;
    
    return statusMatch && urgencyMatch && userMatch;
  });

  // Get request statistics
  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === 'pending').length,
    approved: filteredRequests.filter(r => r.status === 'approved').length,
    rejected: filteredRequests.filter(r => r.status === 'rejected').length,
    critical: filteredRequests.filter(r => r.urgency === 'critical' && r.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Stock Requests</h1>
          <p className="text-slate-400 mt-1">
            {user?.role === 'kitchen' 
              ? 'Request items for kitchen inventory' 
              : 'Manage and approve stock requests'}
          </p>
        </div>
        
        {user?.role === 'kitchen' && (
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            <PlusIcon className="w-5 h-5" />
            New Request
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-slate-400 text-sm">Total Requests</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Approved</div>
          <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Rejected</div>
          <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Critical</div>
          <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Status:</span>
            <select
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Urgency:</span>
            <select
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm"
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
            >
              <option value="all">All Urgency</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              {requests.length === 0 
                ? 'No requests found' 
                : 'No requests match your current filters'}
            </div>
            {user?.role === 'kitchen' && requests.length === 0 && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                Create Your First Request
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Request ID</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Requested By</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Items</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Urgency</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-slate-400">
                        #{request._id?.slice(-6) || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{request.reason}</div>
                      {request.notes && (
                        <div className="text-xs text-slate-400 mt-1">
                          {request.notes.length > 50 
                            ? `${request.notes.substring(0, 50)}...` 
                            : request.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">{request.requestedBy?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{request.requestedBy?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">{request.items?.length || 0} items</div>
                      <div className="text-xs text-slate-400 space-y-1 mt-1">
                        {request.items?.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <span>{item.type === 'custom' ? '🔧' : '📦'}</span>
                            <span>{item.itemName} ({item.quantity} {item.unit})</span>
                          </div>
                        ))}
                        {request.items?.length > 2 && (
                          <div className="text-slate-500">+{request.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        request.urgency === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        request.urgency === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        request.urgency === 'normal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        request.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        request.status === 'fulfilled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(request.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          View
                        </button>
                        {user?.role !== 'kitchen' && request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleViewRequest(request, 'approve')}
                              className="text-green-400 hover:text-green-300 text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleViewRequest(request, 'reject')}
                              className="text-red-400 hover:text-red-300 text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Request Form Modal */}
      <RequestForm
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSubmit={handleCreateRequest}
      />

      {/* Request Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={closeDetailsModal}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        userRole={user?.role}
        action={detailsAction}
      />
    </div>
  );
}
