import { Badge } from '../../components/ui/badge';
import { Percent } from 'lucide-react';
import { 
  getDisplayAmount, 
  getRevenueAmount,
  hasDiscount, 
  getDiscountInfo, 
  formatDisplayAmount,
  isCancelled
} from '../../utils/orderUtils';

// Utility function to safely format currency
const formatCurrency = (amount) => {
  return formatDisplayAmount(amount);
};

const TableCard = ({ tableNumber, orders = [], onNewOrder, onViewDetails, onFinishSession }) => {
  const activeOrders = orders.filter(order => order.status !== 'billed');
  const inProgressSession = orders.find(order => order.status === 'in_progress');
  const totalAmount = activeOrders.reduce((sum, order) => sum + getDisplayAmount(order), 0);
  const hasActiveOrders = activeOrders.length > 0;
  const hasInProgressSession = !!inProgressSession;

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border-2 transition-all duration-200 ${
      hasInProgressSession 
        ? 'border-orange-500 bg-orange-900/20' 
        : hasActiveOrders 
          ? 'border-yellow-500 bg-slate-800/80' 
          : 'border-slate-700 hover:border-slate-600'
    } min-h-[200px]`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {tableNumber === 'takeaway' ? 'Takeaway' : `Table ${tableNumber}`}
          </h3>
          {hasInProgressSession && (
            <Badge className="bg-orange-600 text-white mt-1">
              🔥 Active Session
            </Badge>
          )}
          {hasActiveOrders && !hasInProgressSession && (
            <Badge className="bg-yellow-600 text-white mt-1">
              {activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="text-right">
          {hasActiveOrders && (
            <div className="text-lg font-semibold text-green-400">
              LKR {formatCurrency(totalAmount)}
            </div>
          )}
        </div>
      </div>

      {/* Session Status */}
      {hasInProgressSession && (
        <div className="bg-orange-900/30 rounded p-3 mb-4 border border-orange-600/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-orange-300 font-medium text-sm">Active Session</span>
            <span className="text-orange-400 font-bold">{inProgressSession.orderId}</span>
          </div>
          <div className="text-orange-200 text-xs mb-2">
            {inProgressSession.items.length} item{inProgressSession.items.length > 1 ? 's' : ''} • 
            LKR {formatCurrency(getDisplayAmount(inProgressSession))}
          </div>
          
          {/* Item status summary */}
          {(() => {
            const pendingItems = inProgressSession.items?.filter(item => item.status === 'pending') || [];
            const readyItems = inProgressSession.items?.filter(item => item.status === 'done') || [];
            
            return (
              <div className="space-y-1">
                {pendingItems.length > 0 && (
                  <div className="text-yellow-300 text-xs">
                    🔥 {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''} cooking
                  </div>
                )}
                {readyItems.length > 0 && (
                  <div className="text-green-300 text-xs">
                    ✅ {readyItems.length} item{readyItems.length > 1 ? 's' : ''} ready
                  </div>
                )}
              </div>
            );
          })()}
          
          <div className="text-orange-300 text-xs mt-1 opacity-75">
            Started {new Date(inProgressSession.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Active Orders Summary */}
      {hasActiveOrders && !hasInProgressSession ? (
        <div className="space-y-2 mb-4 max-h-24 overflow-y-auto">
          {activeOrders.map((order, index) => (
            <div key={order._id} className="text-sm bg-slate-700/50 rounded p-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{order.orderId}</span>
                <Badge className={`text-xs ${
                  order.status === 'pending' ? 'bg-yellow-600' : 'bg-green-600'
                } text-white`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="text-slate-300 text-xs mt-1">
                {order.items.length} item{order.items.length > 1 ? 's' : ''} • 
                <span>LKR {formatCurrency(getDisplayAmount(order))}</span>
                {hasDiscount(order) && (
                  <span className="text-orange-400 ml-2 flex items-center gap-1">
                    <Percent size={10} />
                    <span>
                      {(() => {
                        const discountInfo = getDiscountInfo(order);
                        return order.discountType === 'percentage' 
                          ? `${order.discount}% off` 
                          : `LKR ${formatCurrency(discountInfo.discountAmount)} off`;
                      })()}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !hasActiveOrders && (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm mb-4">
          No active orders
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onNewOrder(tableNumber)}
          className={`flex-1 py-2 px-4 rounded transition-colors text-sm font-medium ${
            hasInProgressSession 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {hasInProgressSession ? '+ Add Items' : '+ New Order'}
        </button>
        {hasActiveOrders && (
          <button
            onClick={() => onViewDetails(tableNumber, activeOrders)}
            className="bg-slate-600 text-white py-2 px-4 rounded hover:bg-slate-500 transition-colors text-sm"
          >
            View
          </button>
        )}
      </div>

      {/* Finish Session Button */}
      {hasInProgressSession && (
        <>
          {(() => {
            const pendingItems = inProgressSession.items?.filter(item => item.status === 'pending') || [];
            const allItemsReady = inProgressSession.items?.every(item => item.status === 'done');
            
            if (allItemsReady) {
              return (
                <button
                  onClick={() => onFinishSession(tableNumber)}
                  className="w-full mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  ✓ Finish Session & Ready for Billing
                </button>
              );
            } else {
              return (
                <div className="w-full mt-2 bg-yellow-600/30 border border-yellow-500 text-yellow-200 py-2 px-4 rounded text-sm text-center">
                  ⏳ Waiting for {pendingItems.length} item{pendingItems.length > 1 ? 's' : ''} from kitchen
                </div>
              );
            }
          })()}
        </>
      )}
    </div>
  );
};

export default TableCard;