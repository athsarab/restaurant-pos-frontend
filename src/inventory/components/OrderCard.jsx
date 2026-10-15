import { Badge } from '../../components/ui/badge';

// Utility function to safely format currency
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const OrderCard = ({ order, onDone, onBill, showActions = true, variant = 'default' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'done': return 'bg-green-600';
      case 'billed': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getTableDisplay = (order) => {
    // Handle new order types
    switch (order.orderType) {
      case 'dine-in':
        return `🪑 Table ${order.table}`;
      case 'takeaway':
        return '📦 Takeaway';
      case 'pickme':
        return '🚚 PickMe Delivery';
      case 'uber':
        return '🚗 Uber Eats';
      default:
        // Legacy support for old order types
        if (order.orderType === 'takeaway' || order.table === 'takeaway' || order.table === null) {
          return '📦 Takeaway';
        }
        return `🪑 Table ${order.table}`;
    }
  };

  // Function to determine if an item is pre-made (ready category)
  const isPreMadeCategory = (category) => {
    const preMadeCategories = ['Bakery', 'Pancakes - Savory', 'Pancakes - Sweets','Ice Cream'];
    return preMadeCategories.includes(category);
  };

  // Function to determine item highlight style
  const getItemHighlightStyle = (item) => {
    // Pre-made items are always ready
    if (isPreMadeCategory(item.category)) {
      return 'bg-green-900/40 border-l-4 border-green-500';
    }
    
    // Highlight beverages differently
    if (item.category === 'Beverage' || item.category === 'Beverages') {
      return 'bg-blue-900/40 border-l-4 border-blue-500';
    }
    
    // Highlight items with special requests or modifications
    if (item.specialRequest || item.modifications) {
      return 'bg-orange-900/40 border-l-4 border-orange-500';
    }
    
    // Default highlight for regular food items
    return 'bg-slate-700/40 border-l-4 border-yellow-500';
  };

  // Function to get category display name and emoji
  const getCategoryDisplay = (category) => {
    const categoryMap = {
      'Bakery': { emoji: '', name: 'Bakery' },
      'Pancakes - Savory': { emoji: '', name: 'Pancake-Savory' },
      'Pancakes - Sweets': { emoji: '', name: 'Pancake-Sweet' },
      'Beverage': { emoji: '', name: 'Beverage' },
      'Beverages': { emoji: '', name: 'Beverage' },
      'Main Dish': { emoji: '', name: 'Main Dish' },
      'Mains': { emoji: '', name: 'Main Dish' },
      'Soups': { emoji: '', name: 'Soup' },
      'Salads': { emoji: '', name: 'Salad' },
      'Desserts': { emoji: '', name: 'Dessert' },
      'Dessert': { emoji: '', name: 'Dessert' },
      'Sides': { emoji: '', name: 'Side' },
      'Side Dish': { emoji: '', name: 'Side' }
    };
    
    return categoryMap[category] || { emoji: '🍽️', name: category || 'Other' };
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border-2 ${
      order.status === 'pending' ? 'border-yellow-500/50' : 'border-slate-700'
    } ${variant === 'compact' ? 'min-h-[200px]' : 'min-h-[250px]'} shadow-lg hover:shadow-xl transition-all`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg text-white mt-1 font-bold">{getTableDisplay(order)}</h3>
          <p className="text-sm text-white bg-slate-900/50 px-2 py-1 rounded inline-block">
            {order.orderId}
          </p>
          
          {/* Delivery Order Number for PickMe/Uber orders */}
          {(order.orderType === 'pickme' || order.orderType === 'uber') && order.deliveryOrderNumber && (
            <p className="text-sm text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded inline-block mt-1 font-bold">
              {order.orderType === 'pickme' ? 'PickMe #' : 'Uber #'}{order.deliveryOrderNumber}
            </p>
          )}
          
 
       
          <p className="text-xs text-slate-400 mt-1">
            {order.placedById ? 
              `by ${order.placedById.name} (${order.placedBy})` : 
              order.placedBy === 'customer' ? 'Customer Order' : `by ${order.placedBy}`
            }
          </p>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <Badge className={`${getStatusColor(order.status)} text-white font-bold px-3 py-1`}>
            {order.status.toUpperCase()}
          </Badge>
          
          {/* Order Type Badge */}
          {(order.orderType === 'pickme' || order.orderType === 'uber') && (
            <Badge className={`${
              order.orderType === 'pickme' 
                ? 'bg-yellow-600' 
                : 'bg-black border border-white'
            } text-white font-bold px-2 py-1 text-xs`}>
              {order.orderType === 'pickme' ? 'PICKME' : 'UBER'}
            </Badge>
          )}
        </div>
      </div>

      {/* Items - Enhanced with better highlighting and individual status */}
      <div className="space-y-2 mb-4" style={{ maxHeight: 'none' }}>
        {order.items.map((item, index) => {
          const isPreMade = isPreMadeCategory(item.category);
          const categoryInfo = getCategoryDisplay(item.category);
          const effectiveStatus = isPreMade ? 'done' : item.status;
          
          return (
            <div 
              key={index} 
              className={`p-3 rounded-lg transition-colors ${
                effectiveStatus === 'done' || isPreMade
                  ? 'bg-green-900/40 border-l-4 border-green-500' 
                  : getItemHighlightStyle(item)
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-semibold ${
                      effectiveStatus === 'done' || isPreMade
                        ? 'text-green-300' + (isPreMade ? '' : ' line-through')
                        : item.category === 'Beverage' || item.category === 'Beverages' ? 'text-blue-300' : 'text-white'
                    }`}>
                      {item.dishName} - {categoryInfo.emoji} {categoryInfo.name}
                    </span>
                    
                    {/* Status badges */}
                    {(effectiveStatus === 'done' || isPreMade) && (
                      <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                        ✅ Ready
                      </Badge>
                    )}
                    {effectiveStatus === 'pending' && !isPreMade && (
                      <Badge variant="secondary" className="bg-yellow-600 text-white text-xs">
                        🔥 Cooking
                      </Badge>
                    )}
                    {(item.category === 'Beverage' || item.category === 'Beverages') && (
                      <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                        🥤 Beverage
                      </Badge>
                    )}
                    {isPreMade && (
                      <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                        ⚡ Pre-made
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
                    <span className="text-slate-300 font-medium">
                      {Number(item.qty) || 0}x 
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-bold">
                        LKR {formatCurrency(item.price)}
                      </span>
                      {/* Individual item action button */}
                      {effectiveStatus === 'pending' && !isPreMade && onDone && (
                        <button
                          onClick={() => onDone(order._id, item._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                          title={`Mark ${item.dishName} as done`}
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Item timing info */}
                  {item.addedAt && (
                    <div className="text-xs text-slate-400 mt-1">
                      Added: {new Date(item.addedAt).toLocaleTimeString()}
                      {(item.completedAt || isPreMade) && (
                        <span className="text-green-400 ml-2">
                          • Ready: {isPreMade ? 'Pre-made' : new Date(item.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Special Requests for this item */}
                  {item.specialRequest && (
                    <div className="mt-2 p-2 bg-orange-800/30 rounded border border-orange-500/50">
                      <p className="text-orange-200 text-xs font-medium">
                        <span className="font-bold">Note:</span> {item.specialRequest}
                      </p>
                    </div>
                  )}

                  {/* Modifications */}
                  {item.modifications && item.modifications.length > 0 && (
                    <div className="mt-1">
                      <p className="text-orange-200 text-xs font-semibold">Modifications:</p>
                      <ul className="text-orange-200 text-xs list-disc list-inside">
                        {item.modifications.map((mod, modIndex) => (
                          <li key={modIndex}>{mod}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Notes - Enhanced visibility */}
      {order.customerNotes && order.customerNotes.trim() && (
        <div className="bg-gradient-to-r from-yellow-600/40 to-orange-600/40 border-2 border-yellow-400/50 rounded-lg p-3 mb-3 shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              🍽️ <span>Customer Request</span>
            </div>
          </div>
          <p className="text-yellow-50 text-sm font-semibold bg-black/30 p-3 rounded border border-yellow-400/30">
            "{order.customerNotes}"
          </p>
        </div>
      )}

      {/* Time */}
      <div className="text-xs text-slate-400 mb-3 bg-slate-900/50 p-2 rounded text-center">
        🕒 {new Date(order.createdAt).toLocaleString()}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2">
          {/* Actions for takeaway, pickme, and uber orders */}
          {(order.orderType === 'takeaway' || order.orderType === 'pickme' || order.orderType === 'uber') && order.status === 'pending' && onDone && (
            <button
              onClick={() => onDone(order._id)}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold text-sm shadow-lg hover:shadow-green-500/25"
            >
              ✅ Mark Done
            </button>
          )}
          
          {/* Actions for dine-in orders - show item summary and overall status */}
          {order.orderType === 'dine-in' && (
            <>
              {(() => {
                const pendingItems = order.items?.filter(item => {
                  const isPreMade = isPreMadeCategory(item.category);
                  return !isPreMade && item.status === 'pending';
                }) || [];
                
                const readyItems = order.items?.filter(item => {
                  const isPreMade = isPreMadeCategory(item.category);
                  return isPreMade || item.status === 'done';
                }) || [];
                
                if (pendingItems.length > 0) {
                  return (
                    <div className="flex-1 bg-yellow-600/20 border border-yellow-500 text-yellow-200 py-2 px-4 rounded-lg text-sm text-center">
                      🔥 {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''} cooking
                    </div>
                  );
                } else if (readyItems.length > 0) {
                  return (
                    <div className="flex-1 bg-green-600/20 border border-green-500 text-green-200 py-2 px-4 rounded-lg text-sm text-center">
                      ✅ All items ready for Table {order.table}
                    </div>
                  );
                }
                
                return (
                  <div className="flex-1 bg-slate-600/20 border border-slate-500 text-slate-300 py-2 px-4 rounded-lg text-sm text-center">
                    No active items
                  </div>
                );
              })()}
            </>
          )}
          
          {/* Legacy support for old table orders */}
          {order.orderType === 'table' && (
            <>
              {(() => {
                const pendingItems = order.items?.filter(item => {
                  const isPreMade = isPreMadeCategory(item.category);
                  return !isPreMade && item.status === 'pending';
                }) || [];
                
                const readyItems = order.items?.filter(item => {
                  const isPreMade = isPreMadeCategory(item.category);
                  return isPreMade || item.status === 'done';
                }) || [];
                
                if (pendingItems.length > 0) {
                  return (
                    <div className="flex-1 bg-yellow-600/20 border border-yellow-500 text-yellow-200 py-2 px-4 rounded-lg text-sm text-center">
                      🔥 {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''} cooking
                    </div>
                  );
                } else if (readyItems.length > 0) {
                  return (
                    <div className="flex-1 bg-green-600/20 border border-green-500 text-green-200 py-2 px-4 rounded-lg text-sm text-center">
                      ✅ All items ready for Table {order.table}
                    </div>
                  );
                }
                
                return (
                  <div className="flex-1 bg-slate-600/20 border border-slate-500 text-slate-300 py-2 px-4 rounded-lg text-sm text-center">
                    No active items
                  </div>
                );
              })()}
            </>
          )}
          
          {/* Billing action for ready orders */}
          {(order.status === 'done' || 
            ((order.orderType === 'dine-in' || order.orderType === 'table') && order.items?.every(item => {
              const isPreMade = isPreMadeCategory(item.category);
              return isPreMade || item.status === 'done';
            }))) && onBill && (
            <button
              onClick={() => onBill(order._id)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-sm shadow-lg hover:shadow-blue-500/25"
            >
              🧾 Bill & Print
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;