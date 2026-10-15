import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const getUrgencyBadge = (urgency) => {
  const badges = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    normal: 'bg-green-500/10 text-green-400 border-green-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20'
  };
  
  return badges[urgency] || badges.normal;
};

const getStatusBadge = (status) => {
  const badges = {
    pending: {
      icon: <ClockIcon className="w-4 h-4" />,
      class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    },
    approved: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      class: 'bg-green-500/10 text-green-400 border-green-500/20'
    },
    rejected: {
      icon: <XCircleIcon className="w-4 h-4" />,
      class: 'bg-red-500/10 text-red-400 border-red-500/20'
    },
    fulfilled: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      class: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  };
  
  return badges[status] || badges.pending;
};

export default function RequestCard({ request, onView, userRole }) {
  const statusBadge = getStatusBadge(request.status);
  const urgencyBadge = getUrgencyBadge(request.urgency);
  
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-white">{request.reason}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${statusBadge.class}`}>
              {statusBadge.icon}
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>Request #{request._id?.slice(-6) || 'N/A'}</span>
            <span className={`px-2 py-1 rounded border text-xs ${urgencyBadge}`}>
              {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)} Priority
            </span>
          </div>
        </div>
        
        <button
          onClick={() => onView(request)}
          className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors"
        >
          <EyeIcon className="w-4 h-4" />
          View
        </button>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="text-sm">
          <span className="text-slate-400">Items: </span>
          <span className="text-white">{request.items?.length || 0} item(s)</span>
        </div>
        
        <div className="text-sm">
          <span className="text-slate-400">Requested by: </span>
          <span className="text-white">{request.requestedBy?.name || 'Unknown'}</span>
        </div>
        
        <div className="text-sm">
          <span className="text-slate-400">Date: </span>
          <span className="text-white">
            {new Date(request.createdAt).toLocaleDateString('en-LK', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
      
      {request.notes && (
        <div className="text-sm text-slate-300 bg-slate-800 rounded p-2 mb-3">
          <span className="text-slate-400">Notes: </span>
          {request.notes}
        </div>
      )}
      
      {/* Show items preview */}
      {request.items && request.items.length > 0 && (
        <div className="border-t border-slate-700 pt-3">
          <div className="text-xs text-slate-400 mb-2">Requested Items:</div>
          <div className="space-y-1">
            {request.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {item.type === 'custom' ? '🔧' : '📦'}
                  </span>
                  <span className="text-slate-300">
                    {item.itemId?.name || item.itemName || 'Unknown Item'}
                  </span>
                  {item.type === 'custom' && item.estimatedCost > 0 && (
                    <span className="text-xs text-slate-500">
                      (~LKR {item.estimatedCost})
                    </span>
                  )}
                </div>
                <span className="text-slate-400">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
            {request.items.length > 3 && (
              <div className="text-xs text-slate-500">
                +{request.items.length - 3} more items...
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Approval actions for admin/accountant */}
      {userRole !== 'kitchen' && request.status === 'pending' && (
        <div className="border-t border-slate-700 pt-3 mt-3">
          <div className="flex gap-2">
            <button
              onClick={() => onView(request, 'approve')}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            >
              Approve & Process
            </button>
            <button
              onClick={() => onView(request, 'reject')}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}