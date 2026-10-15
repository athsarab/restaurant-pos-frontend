import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Modal from './ui/Modal';

const getStatusIcon = (status) => {
  const icons = {
    pending: <ClockIcon className="w-5 h-5 text-yellow-400" />,
    approved: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
    rejected: <XCircleIcon className="w-5 h-5 text-red-400" />,
    fulfilled: <CheckCircleIcon className="w-5 h-5 text-blue-400" />
  };
  
  return icons[status] || icons.pending;
};

const getUrgencyColor = (urgency) => {
  const colors = {
    low: 'text-blue-400',
    normal: 'text-green-400',
    high: 'text-orange-400',
    critical: 'text-red-400'
  };
  
  return colors[urgency] || colors.normal;
};

export default function RequestDetailsModal({ 
  request, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  userRole,
  action = null 
}) {
  const [processingAction, setProcessingAction] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentAction, setCurrentAction] = useState(action);
  
  // Update currentAction when action prop changes
  useEffect(() => {
    setCurrentAction(action);
  }, [action]);
  
  if (!request) return null;
  
  const handleApprove = async () => {
    setProcessingAction(true);
    try {
      await onApprove(request._id);
      setCurrentAction(null);
      onClose();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setProcessingAction(true);
    try {
      await onReject(request._id, rejectionReason);
      setRejectionReason('');
      setCurrentAction(null);
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    setCurrentAction(null);
    onClose();
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={`Request Details - #${request._id?.slice(-6) || 'N/A'}`}
    >
      <div className="space-y-6">
        {/* Status and Basic Info */}
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(request.status)}
              <div>
                <div className="font-medium text-white">
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </div>
                <div className="text-sm text-slate-400">Current Status</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-medium ${getUrgencyColor(request.urgency)}`}>
                {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)} Priority
              </div>
              <div className="text-sm text-slate-400">Urgency Level</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Requested by:</span>
              <div className="text-white font-medium">{request.requestedBy?.name || 'Unknown'}</div>
            </div>
            
            <div>
              <span className="text-slate-400">Date Requested:</span>
              <div className="text-white">
                {new Date(request.createdAt).toLocaleDateString('en-LK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Request Reason */}
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Reason for Request</h3>
          <div className="bg-slate-800 rounded p-3 text-slate-300">
            {request.reason}
          </div>
        </div>
        
        {/* Additional Notes */}
        {request.notes && (
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Additional Notes</h3>
            <div className="bg-slate-800 rounded p-3 text-slate-300">
              {request.notes}
            </div>
          </div>
        )}
        
        {/* Requested Items */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Requested Items</h3>
          <div className="space-y-2">
            {request.items?.map((item, index) => (
              <div key={index} className={`rounded p-3 ${
                item.type === 'custom' 
                  ? 'bg-green-500/5 border border-green-500/20' 
                  : 'bg-slate-800'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {item.type === 'custom' ? '🔧' : '📦'}
                      </span>
                      <div className="font-medium text-white">
                        {item.itemId?.name || item.itemName || 'Unknown Item'}
                      </div>
                      {item.type === 'custom' && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Custom Item
                        </span>
                      )}
                    </div>
                    
                    {item.type === 'custom' && item.description && (
                      <div className="text-sm text-slate-300 mb-1">
                        {item.description}
                      </div>
                    )}
                    
                    <div className="text-sm text-slate-400">
                      Quantity: {item.quantity} {item.unit}
                    </div>
                    
                    {item.type === 'custom' && item.estimatedCost > 0 && (
                      <div className="text-sm text-green-400 mt-1">
                        Estimated Cost: LKR {item.estimatedCost.toLocaleString()}
                      </div>
                    )}
                    
                    {item.notes && (
                      <div className="text-sm text-slate-300 mt-1">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                  
                  {item.itemId && item.type !== 'custom' && (
                    <div className="text-right text-sm">
                      <div className="text-slate-400">Current Stock:</div>
                      <div className="text-white">
                        {item.itemId.quantity || 0} {item.itemId.unit}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Approval History */}
        {(request.approvedBy || request.rejectedBy) && (
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Action History</h3>
            <div className="bg-slate-800 rounded p-3">
              {request.approvedBy && (
                <div className="text-sm">
                  <span className="text-green-400">Approved by:</span>
                  <span className="text-white ml-2">{request.approvedBy.name}</span>
                  {request.approvedAt && (
                    <div className="text-slate-400 mt-1">
                      {new Date(request.approvedAt).toLocaleDateString('en-LK', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {request.rejectedBy && (
                <div className="text-sm">
                  <span className="text-red-400">Rejected by:</span>
                  <span className="text-white ml-2">{request.rejectedBy.name}</span>
                  {request.rejectionReason && (
                    <div className="text-slate-300 mt-1">
                      Reason: {request.rejectionReason}
                    </div>
                  )}
                  {request.rejectedAt && (
                    <div className="text-slate-400 mt-1">
                      {new Date(request.rejectedAt).toLocaleDateString('en-LK', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action Section for Approval/Rejection */}
        {userRole !== 'kitchen' && request.status === 'pending' && (
          <div className="border-t border-slate-700 pt-4">
            {currentAction === 'reject' ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-red-400">Reject Request</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Reason for Rejection *
                  </label>
                  <textarea
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                    rows="3"
                    placeholder="Please provide a clear reason for rejecting this request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={processingAction || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded transition-colors"
                  >
                    {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => setCurrentAction(null)}
                    className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : currentAction === 'approve' ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-green-400">Approve Request</h3>
                <p className="text-sm text-slate-300">
                  This will approve the request and allow processing the inventory updates.
                  Make sure all requested items are available or can be procured.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={processingAction}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded transition-colors"
                  >
                    {processingAction ? 'Approving...' : 'Confirm Approval'}
                  </button>
                  <button
                    onClick={() => setCurrentAction(null)}
                    className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={processingAction}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded transition-colors"
                >
                  {processingAction ? 'Approving...' : 'Approve Request'}
                </button>
                <button
                  onClick={() => setCurrentAction('reject')}
                  disabled={processingAction}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded transition-colors"
                >
                  Reject Request
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Close button for kitchen users or read-only view */}
        {(userRole === 'kitchen' || request.status !== 'pending') && (
          <div className="flex justify-end border-t border-slate-700 pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}