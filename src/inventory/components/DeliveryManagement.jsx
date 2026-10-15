import { useState, useEffect } from 'react';
import { Bell, Truck, Car, Clock, CheckCircle, Eye, Phone, User, Package, AlertCircle } from 'lucide-react';
import api from '../services/api';

const DeliveryManagement = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchActiveDeliveryOrders();
    // Set up polling for real-time updates
    const interval = setInterval(fetchActiveDeliveryOrders, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveDeliveryOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/delivery/active-delivery');
      setActiveOrders(response.data.active || []);
      setPendingOrders(response.data.pending || []);
      
      // Check for new notifications
      const newNotifications = response.data.notifications || [];
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching active delivery orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchActiveDeliveryOrders(); // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getPlatformIcon = (platform) => {
    return platform === 'pickme' ? 
      <Truck className="w-5 h-5 text-yellow-400" /> : 
      <Car className="w-5 h-5 text-gray-400" />;
  };

  const getPlatformColor = (platform) => {
    return platform === 'pickme' ? 
      'border-yellow-500 bg-yellow-900/20' : 
      'border-gray-500 bg-gray-900/20';
  };

  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    }
  };

  const getUrgencyColor = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes > 30) return 'text-red-400 border-red-500';
    if (diffMinutes > 15) return 'text-yellow-400 border-yellow-500';
    return 'text-green-400 border-green-500';
  };

  const OrderCard = ({ order, showActions = true }) => (
    <div className={`border rounded-lg p-4 ${getPlatformColor(order.deliveryPlatform)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getPlatformIcon(order.deliveryPlatform)}
          <div>
            <h3 className="font-semibold text-white">{order.orderId}</h3>
            {order.deliveryOrderNumber && (
              <p className="text-sm text-gray-400">#{order.deliveryOrderNumber}</p>
            )}
          </div>
        </div>
        <div className={`text-sm px-2 py-1 rounded border ${getUrgencyColor(order.createdAt)}`}>
          {getTimeElapsed(order.createdAt)}
        </div>
      </div>

      {/* Customer Info */}
      {(order.customerName || order.customerMobile) && (
        <div className="mb-3 space-y-1">
          {order.customerName && (
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <User className="w-4 h-4" />
              <span>{order.customerName}</span>
            </div>
          )}
          {order.customerMobile && (
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Phone className="w-4 h-4" />
              <span>{order.customerMobile}</span>
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Items: {order.items.length}</span>
          <span className="font-semibold text-white">LKR {order.totalAmount.toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-500">
          {order.items.slice(0, 2).map(item => `${item.name} (${item.quantity})`).join(', ')}
          {order.items.length > 2 && ` +${order.items.length - 2} more`}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedOrder(order);
              setShowOrderDetails(true);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
          >
            <Eye className="w-4 h-4 inline mr-1" />
            View
          </button>
          {order.status === 'pending' && (
            <button
              onClick={() => updateOrderStatus(order._id, 'preparing')}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Start Prep
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => updateOrderStatus(order._id, 'completed')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading delivery orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Notifications */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Delivery Management</h2>
        {notifications.length > 0 && (
          <div className="flex items-center space-x-2 bg-red-900/30 border border-red-500 rounded-lg px-3 py-2">
            <Bell className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm">{notifications.length} new alerts</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Pending Orders</p>
              <p className="text-2xl font-bold text-white">{pendingOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-slate-400">Preparing</p>
              <p className="text-2xl font-bold text-white">
                {activeOrders.filter(o => o.status === 'preparing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-slate-400">PickMe Orders</p>
              <p className="text-2xl font-bold text-white">
                {[...pendingOrders, ...activeOrders].filter(o => o.deliveryPlatform === 'pickme').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center space-x-3">
            <Car className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm text-slate-400">Uber Orders</p>
              <p className="text-2xl font-bold text-white">
                {[...pendingOrders, ...activeOrders].filter(o => o.deliveryPlatform === 'uber').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders - High Priority */}
      {pendingOrders.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Pending Orders (Needs Attention)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Active Orders - In Progress */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Orders in Progress</h3>
        {activeOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No active delivery orders at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Order Details</h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Order ID</p>
                  <p className="text-white font-medium">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Platform</p>
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(selectedOrder.deliveryPlatform)}
                    <span className="text-white capitalize">{selectedOrder.deliveryPlatform}</span>
                  </div>
                </div>
                {selectedOrder.deliveryOrderNumber && (
                  <div>
                    <p className="text-sm text-gray-400">Delivery Order #</p>
                    <p className="text-white font-medium">{selectedOrder.deliveryOrderNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-white capitalize">{selectedOrder.status}</p>
                </div>
              </div>

              {/* Customer Info */}
              {(selectedOrder.customerName || selectedOrder.customerMobile) && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Customer Information</h4>
                  <div className="space-y-2">
                    {selectedOrder.customerName && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{selectedOrder.customerName}</span>
                      </div>
                    )}
                    {selectedOrder.customerMobile && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{selectedOrder.customerMobile}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-white font-medium">LKR {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <p className="text-xl font-bold text-white">
                    Total: LKR {selectedOrder.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4 border-t border-slate-600">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder._id, 'preparing');
                      setShowOrderDetails(false);
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    Start Preparing
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder._id, 'completed');
                      setShowOrderDetails(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;