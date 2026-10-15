import { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import OrderModal from './OrderModal';
import ErrorBoundary from './ErrorBoundary';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { User, Clock, CheckCircle, Package, Percent } from 'lucide-react';
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

const WaiterDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [tableOrders, setTableOrders] = useState({});
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('kitchen'); // kitchen, ready, all
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [stats, setStats] = useState({
    readyOrders: 0,
    servedToday: 0,
    totalTables: 0
  });

  useEffect(() => {
    fetchDashboardData();
    fetchMenuItems();
    // Refresh data every 20 seconds
    const interval = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/orders/dashboard');
      const { 
        orders: ordersData, 
        tables: tablesData, 
        allTakeawayOrders: takeawayData,
        ...statsData 
      } = response.data;
      
      setOrders(ordersData || []);
      setTableOrders(tablesData || {});
      setTakeawayOrders(takeawayData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu-items');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    }
  };

  const handleServeOrder = async (orderId) => {
    try {
      // For waiters, we can mark orders as done (meaning they've been served to customer)
      await api.patch(`/orders/${orderId}/done`);
      toast.success('Order marked as served!');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error serving order:', error);
      toast.error('Failed to mark order as served');
    }
  };

  const handleMarkDone = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/done`);
      toast.success('Order marked as done!', {
        icon: '✅',
        style: {
          borderRadius: '10px',
          background: '#1f2937',
          color: '#fff',
        },
      });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error marking order as done:', error);
      toast.error('Failed to mark order as done', {
        style: {
          borderRadius: '10px',
          background: '#1f2937',
          color: '#fff',
        },
      });
    }
  };

  const handleNewTakeawayOrder = () => {
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrder = async (orderData) => {
    try {
      // Extract order data from the new structure
      const { items, customerNotes, customerDetails, tableNumber } = orderData;
      
      const submissionData = {
        orderType: customerDetails.orderType || 'takeaway', // Legacy support
        items: items,
        placedBy: 'waiter',
        customerNotes: customerNotes || '',
        customerDetails: customerDetails,
        table: tableNumber
      };

      await api.post('/orders', submissionData);
      
      const orderTypeDisplay = customerDetails.orderType === 'dine-in' ? 'Dine-in' :
                              customerDetails.orderType === 'takeaway' ? 'Takeaway' :
                              customerDetails.orderType === 'pickme' ? 'PickMe' :
                              customerDetails.orderType === 'uber' ? 'Uber Eats' : 'Order';
      
      toast.success(`${orderTypeDisplay} order placed successfully!`, {
        icon: customerDetails.orderType === 'dine-in' ? '🪑' :
              customerDetails.orderType === 'takeaway' ? '📦' :
              customerDetails.orderType === 'pickme' ? '🚚' :
              customerDetails.orderType === 'uber' ? '🚗' : '📋',
        style: {
          borderRadius: '10px',
          background: '#1f2937',
          color: '#fff',
        },
      });
      setIsOrderModalOpen(false);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Handle inventory-specific errors
      if (error.response?.data?.error === 'Out of Stock') {
        toast.error(`Out of Stock: ${error.response.data.details}`, {
          duration: 6000,
          style: {
            borderRadius: '10px',
            background: '#7f1d1d',
            color: '#fff',
          },
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order', {
          style: {
            borderRadius: '10px',
            background: '#1f2937',
            color: '#fff',
          },
        });
      }
    }
  };

  const getOrderAge = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    return diffInMinutes;
  };

  const getReadyOrders = () => {
    return orders.filter(order => order.status === 'done');
  };

  const getActiveOrders = () => {
    return orders.filter(order => ['pending', 'done'].includes(order.status));
  };

  const getOrdersByTable = () => {
    const ordersByTable = { ...tableOrders };
    
    // Add takeaway orders as a special "table"
    if (takeawayOrders.length > 0) {
      ordersByTable['takeaway'] = takeawayOrders;
    }
    
    return ordersByTable;
  };

  const getFilteredOrders = () => {
    if (filter === 'ready') {
      return getReadyOrders().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (filter === 'kitchen') {
      return orders.filter(order => ['pending', 'done'].includes(order.status))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return getActiveOrders().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading waiter dashboard...</div>
      </div>
    );
  }

  const readyOrders = getReadyOrders();
  const ordersByTable = getOrdersByTable();
  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <User className="text-green-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Waiter Dashboard</h1>
        </div>
        
        <div className="flex space-x-6 text-sm mb-4">
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Ready to Serve: </span>
            <span className="text-green-400 font-semibold">{readyOrders.length}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Served Today: </span>
            <span className="text-blue-400 font-semibold">{stats.servedToday || 0}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Active Tables: </span>
            <span className="text-yellow-400 font-semibold">{Object.keys(ordersByTable).length}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Takeaway Orders: </span>
            <span className="text-orange-400 font-semibold">{takeawayOrders.length}</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="mb-4">
          <button
            onClick={handleNewTakeawayOrder}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Package size={16} />
            <span>New Takeaway Order</span>
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('kitchen')}
            className={`px-4 py-2 rounded text-sm flex items-center space-x-1 ${
              filter === 'kitchen'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span>🍳</span>
            <span>Kitchen View ({orders.filter(o => ['pending', 'done'].includes(o.status)).length})</span>
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-4 py-2 rounded text-sm flex items-center space-x-1 ${
              filter === 'ready'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <CheckCircle size={16} />
            <span>Ready to Serve ({readyOrders.length})</span>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded text-sm ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All Active Orders ({getActiveOrders().length})
          </button>
        </div>
      </div>

      {/* Kitchen Orders Section - Live Kitchen View */}
      {filter === 'kitchen' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-orange-400 mb-4 flex items-center space-x-2">
            <span>🍳</span>
            <span>Kitchen Orders - Live Preparation Status</span>
          </h2>
          {orders.filter(order => ['pending', 'done'].includes(order.status)).length === 0 ? (
            <div className="bg-slate-800 p-8 rounded-lg text-center">
              <span className="text-6xl mb-4 block">🍳</span>
              <p className="text-slate-400">Kitchen is clear - No active orders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders
                .filter(order => ['pending', 'done'].includes(order.status))
                .sort((a, b) => {
                  // Priority: pending first, then done
                  if (a.status === 'pending' && b.status === 'done') return -1;
                  if (a.status === 'done' && b.status === 'pending') return 1;
                  return new Date(a.createdAt) - new Date(b.createdAt);
                })
                .map(order => {
                  const orderAge = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60));
                  const isUrgent = orderAge > 15; // Orders older than 15 minutes
                  
                  return (
                    <div key={order._id} className={`bg-slate-800 p-4 rounded-lg border-2 transition-all relative ${
                      order.status === 'pending' 
                        ? (isUrgent ? 'border-red-500 bg-red-900/20 animate-pulse' : 'border-yellow-500 bg-yellow-900/20')
                        : 'border-green-500 bg-green-900/20'
                    }`}>
                      {/* Priority Badge */}
                      {isUrgent && order.status === 'pending' && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                          URGENT
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{order.orderId}</h3>
                          <p className="text-sm text-slate-400">
                            {order.orderType === 'takeaway' ? '📦 Takeaway' : `🪑 Table ${order.table}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            by {order.placedBy} • {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span 
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'pending' 
                                ? (isUrgent ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300')
                                : 'bg-green-900 text-green-300'
                            }`}
                          >
                            {order.status === 'pending' ? '🔥 COOKING' : '✅ READY'}
                          </span>
                          <div className="text-orange-400 font-bold mt-1">
                            <div>LKR {formatCurrency(getDisplayAmount(order))}</div>
                            {hasDiscount(order) && (
                              <div className="text-xs text-orange-300 flex items-center gap-1">
                                <Percent size={10} />
                                <span>
                                  {(() => {
                                    const discountInfo = getDiscountInfo(order);
                                    return order.discountType === 'percentage' 
                                      ? `${order.discount}% off` 
                                      : `LKR ${formatCurrency(discountInfo.discountAmount)} off`;
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="mb-3">
                        <div className="text-xs text-slate-400 mb-1">
                          📝 Order Details ({order.items?.length || 0} items):
                        </div>
                        <div className="max-h-20 overflow-y-auto">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-300">
                              <span>• {item.qty}x {item.dishName}</span>
                              <span className="text-green-400">LKR {((item.qty || 0) * (item.price || 0)).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Time and Actions */}
                      <div className="space-y-2">
                        <div className={`text-xs ${
                          isUrgent ? 'text-red-400 font-bold' : 'text-slate-500'
                        }`}>
                          ⏱️ {orderAge} min ago
                          {isUrgent && <span className="ml-1 animate-pulse">⚠️</span>}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleMarkDone(order._id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
                            >
                              ✓ Mark Done
                            </button>
                          )}
                          {order.status === 'done' && (
                            <button
                              onClick={() => handleServeOrder(order._id)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
                            >
                              🍽️ Mark Served
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      )}

      {/* Priority Section - Ready to Serve Orders */}
      {readyOrders.length > 0 && filter === 'ready' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center space-x-2">
            <CheckCircle size={20} />
            <span>Ready to Serve - Priority</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map(order => (
              <div key={order._id} className="relative">
                <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full z-10 animate-pulse">
                  READY
                </div>
                <div className="absolute top-2 right-2 flex items-center space-x-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                  <Clock size={12} />
                  <span>{getOrderAge(order.createdAt)} min</span>
                </div>
                <OrderCard
                  order={order}
                  onDone={handleServeOrder}
                  showActions={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Status Overview */}
      {Object.keys(ordersByTable).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Table Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(ordersByTable).map(([table, tableOrders]) => {
              const hasReadyOrders = tableOrders.some(order => order.status === 'done');
              const totalAmount = tableOrders.reduce((sum, order) => sum + getDisplayAmount(order), 0);
              
              return (
                <div
                  key={table}
                  className={`bg-slate-800 p-4 rounded-lg border-2 ${
                    hasReadyOrders ? 'border-green-500' : 'border-slate-700'
                  }`}
                >
                  <div className="text-center">
                    <h3 className={`font-bold text-lg ${
                      hasReadyOrders ? 'text-green-400' : 'text-white'
                    }`}>
                      {table === 'takeaway' ? 'Takeaway' : `Table ${table}`}
                    </h3>
                    <p className="text-slate-400 text-sm">{tableOrders.length} order(s)</p>
                    <p className="text-slate-300 font-medium">LKR {formatCurrency(totalAmount)}</p>
                    {hasReadyOrders && (
                      <div className="mt-2">
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded animate-pulse">
                          READY
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders List */}
      {filter === 'all' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">All Active Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div key={order._id} className="relative">
                <div className="absolute top-2 left-2 flex items-center space-x-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                  <Clock size={12} />
                  <span>{getOrderAge(order.createdAt)} min ago</span>
                </div>
                {order.status === 'done' && (
                  <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full z-10">
                    READY
                  </div>
                )}
                <OrderCard
                  order={order}
                  onDone={order.status === 'done' ? handleServeOrder : null}
                  showActions={order.status === 'done'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Orders State */}
      {filteredOrders.length === 0 && filter !== 'kitchen' && (
        <div className="text-center py-16">
          <User className="mx-auto mb-4 text-slate-600" size={64} />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">
            {filter === 'ready' ? 'No orders ready to serve!' : 'No active orders!'}
          </h3>
          <p className="text-slate-500">
            {filter === 'ready' 
              ? 'All orders have been served or are still being prepared.' 
              : 'All orders have been completed.'}
          </p>
        </div>
      )}

      {/* Order Modal for All Order Types */}
      <ErrorBoundary>
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmit={handlePlaceOrder}
          menuItems={menuItems}
          orderType="takeaway" // Default to takeaway but allow customer to choose
          tableNumber={null}
        />
      </ErrorBoundary>
    </div>
  );
};

export default WaiterDashboard;