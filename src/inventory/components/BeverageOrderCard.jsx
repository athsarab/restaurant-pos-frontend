import { Badge } from '../../components/ui/badge';

// Utility function to safely format currency
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const BeverageOrderCard = ({ order, onDone, variant = 'compact' }) => {
  const getTableDisplay = (order) => {
    if (order.orderType === 'takeaway' || order.table === 'takeaway' || order.table === null) {
      return '📦 Takeaway';
    }
    return `🪑 Table ${order.table}`;
  };

  // Filter only beverage items
  const beverageItems = order.items.filter(item => 
    item.category === 'Beverage' || item.category === 'Beverages'
  );

  // Don't render if no beverage items
  if (beverageItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border-2 border-blue-500/50 shadow-lg hover:shadow-xl transition-all">
      
      {/* Header with KOT and Table info */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-blue-300 bg-blue-900/50 px-3 py-1 rounded inline-block">
              KOT: {order.orderId}
            </h3>
            <Badge className="bg-blue-600 text-white font-bold px-2 py-1 text-xs">
              🥤 BEVERAGE
            </Badge>
          </div>
          <p className="text-sm text-blue-200 font-medium">{getTableDisplay(order)}</p>
          <p className="text-xs text-slate-400">
            {order.placedById ? 
              `by ${order.placedById.name}` : 
              order.placedBy === 'customer' ? 'Customer Order' : `by ${order.placedBy}`
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 mb-1">
            🕒 {new Date(order.createdAt).toLocaleTimeString()}
          </div>
          <Badge className="bg-yellow-600 text-white font-bold px-2 py-1 text-xs">
            {beverageItems?.length || 0} drinks
          </Badge>
        </div>
      </div>

      {/* Beverage Items Only */}
      <div className="space-y-2 mb-3">
        {beverageItems.map((item, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg transition-colors ${
              item.status === 'done' 
                ? 'bg-green-900/40 border-l-4 border-green-500' 
                : 'bg-blue-900/40 border-l-4 border-blue-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`font-semibold text-lg ${
                    item.status === 'done' 
                      ? 'text-green-300 line-through' 
                      : 'text-blue-300'
                  }`}>
                    🥤 {item.dishName}
                  </span>
                  
                  {/* Status badges */}
                  {item.status === 'done' && (
                    <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                      ✅ Ready
                    </Badge>
                  )}
                  {item.status === 'pending' && (
                    <Badge variant="secondary" className="bg-yellow-600 text-white text-xs animate-pulse">
                      🔥 Preparing
                    </Badge>
                  )}
                  {item.specialRequest && (
                    <Badge variant="secondary" className="bg-orange-600 text-white text-xs">
                      ✨ Special
                    </Badge>
                  )}
                </div>
                
                {/* Quantity and Price */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-200 font-bold text-lg">
                    Qty: {Number(item.qty) || 0}x 
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-200 font-bold">
                      LKR {formatCurrency(item.price)}
                    </span>
                    {/* Individual item action button */}
                    {item.status === 'pending' && onDone && (
                      <button
                        onClick={() => onDone(order._id, item._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-bold transition-colors shadow-lg"
                        title={`Mark ${item.dishName} as ready`}
                      >
                        ✓ Ready
                      </button>
                    )}
                  </div>
                </div>

                {/* Item timing info */}
                {item.addedAt && (
                  <div className="text-xs text-slate-400 mt-1">
                    Ordered: {new Date(item.addedAt).toLocaleTimeString()}
                    {item.completedAt && (
                      <span className="text-green-400 ml-2">
                        • Ready: {new Date(item.completedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Special Requests for this item */}
                {item.specialRequest && (
                  <div className="mt-2 p-2 bg-orange-800/30 rounded border border-orange-500/50">
                    <p className="text-orange-200 text-xs font-medium">
                      <span className="font-bold">Special Request:</span> {item.specialRequest}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Notes - Enhanced visibility */}
      {order.customerNotes && order.customerNotes.trim() && (
        <div className="bg-gradient-to-r from-yellow-600/40 to-orange-600/40 border-2 border-yellow-400/50 rounded-lg p-3 mb-3 shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              🥤 <span>Drink Notes</span>
            </div>
          </div>
          <p className="text-yellow-50 text-sm font-semibold bg-black/30 p-3 rounded border border-yellow-400/30">
            "{order.customerNotes}"
          </p>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-blue-900/30 p-2 rounded text-center border border-blue-500/50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-blue-200 font-semibold">
            {getTableDisplay(order)} - KOT: {order.orderId}
          </span>
          <span className="text-blue-200 font-semibold">
            Total: {beverageItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)} drinks
          </span>
        </div>
      </div>
    </div>
  );
};

export default BeverageOrderCard;