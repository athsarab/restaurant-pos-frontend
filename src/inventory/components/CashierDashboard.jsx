import { useState, useEffect } from 'react';
import TableCard from './TableCard';
import OrderModal from './OrderModal';
import BillingModal from './BillingModal';
import ErrorBoundary from './ErrorBoundary';
import api from '../services/api';
import { toast } from 'react-hot-toast';
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

const CashierDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [tableOrders, setTableOrders] = useState({});
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrderForBilling, setSelectedOrderForBilling] = useState(null);
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' or 'takeaway' (legacy support)
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayOrders: 0,
    activeOrders: 0
  });

  // Generate table numbers 1-10
  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    fetchDashboardData();
    fetchMenuItems();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch main dashboard data
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

      // Fetch delivery orders separately
      try {
        const deliveryResponse = await api.get('/delivery/active-delivery');
        const { pending = [], active = [] } = deliveryResponse.data;
        setDeliveryOrders([...pending, ...active]);
      } catch (deliveryError) {
        console.error('Error fetching delivery orders:', deliveryError);
        // Don't show error for delivery orders, just set empty array
        setDeliveryOrders([]);
      }
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
      toast.error('Failed to load menu items: ' + (error.response?.data?.message || error.message));
    }
  };

  const getTableOrders = (tableNumber) => {
    const orders = tableOrders[`table${tableNumber}`] || [];
    return orders;
  };

  const getTakeawayOrders = () => {
    return takeawayOrders;
  };

  const handleNewTableOrder = (tableNumber) => {
    setSelectedTable(tableNumber);
    setOrderType(tableNumber === 'takeaway' ? 'takeaway' : 'dine-in');
    setIsOrderModalOpen(true);
  };

  const handleNewOrder = (tableNumber) => {
    setSelectedTable(tableNumber);
    setOrderType('dine-in');
    setIsOrderModalOpen(true);
  };

  const handleNewTakeawayOrder = () => {
    setSelectedTable(null);
    setOrderType('takeaway');
    setIsOrderModalOpen(true);
  };

  const handleNewPickMeOrder = () => {
    setSelectedTable(null);
    setOrderType('pickme');
    setIsOrderModalOpen(true);
  };

  const handleNewUberOrder = () => {
    setSelectedTable(null);
    setOrderType('uber');
    setIsOrderModalOpen(true);
  };

  const handleViewDetails = (tableNumber, orders) => {
    // You can implement a detailed view modal here
    toast.success(`Viewing ${orders.length} order(s) for Table ${tableNumber}`);
  };

  const handleViewTakeawayDetails = (orders) => {
    // You can implement a detailed view modal here
    toast.success(`Viewing ${orders.length} takeaway order(s)`);
  };

  const handlePlaceOrder = async (orderData) => {
    try {
      // Extract order data from the new structure
      const { items, customerNotes, customerDetails, tableNumber } = orderData;
      
      const submissionData = {
        orderType: customerDetails.orderType || orderType, // Use customer selected type or fallback to current orderType
        items: items,
        placedBy: 'cashier',
        customerNotes: customerNotes || '',
        customerDetails: customerDetails
      };

      // Use table number from customer details or selected table for dine-in orders
      if (customerDetails.orderType === 'dine-in' || orderType === 'table') {
        submissionData.table = tableNumber || selectedTable;
      }

      const response = await api.post('/orders', submissionData);

      // Non-blocking warnings (e.g., insufficient packing items)
      if (Array.isArray(response.data?.warnings) && response.data.warnings.length > 0) {
        const packingWarning = response.data.warnings.find(w => w.code === 'PACKING_ITEMS_INSUFFICIENT');
        if (packingWarning) {
          toast(packingWarning.message || 'Warning: Insufficient packing items', {
            icon: '⚠️',
            duration: 6000,
            style: {
              borderRadius: '10px',
              background: '#92400e',
              color: '#fff',
            },
          });
        }
      }
      
      const orderTypeDisplay = customerDetails.orderType === 'dine-in' ? 'Dine-in' :
                              customerDetails.orderType === 'takeaway' ? 'Takeaway' :
                              customerDetails.orderType === 'pickme' ? 'PickMe' :
                              customerDetails.orderType === 'uber' ? 'Uber Eats' : 'Order';
      
      // Show appropriate success message based on merge status
      if (response.data.merged) {
        toast.success(response.data.message || `Items added to existing Table ${submissionData.table} session!`, {
          icon: '🔥',
          style: {
            borderRadius: '10px',
            background: '#1f2937',
            color: '#fff',
          },
        });
      } else {
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
      }
      
      setIsOrderModalOpen(false);
      setSelectedTable(null);
      setOrderType('dine-in'); // Update to new default
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

  const handleBillOrder = async (order) => {
    setSelectedOrderForBilling(order);
    setIsBillingModalOpen(true);
  };

  const handleBillComplete = () => {
    fetchDashboardData(); // Refresh data after billing
    setSelectedOrderForBilling(null);
  };

  const handleFinishSession = async (tableNumber) => {
    try {
      await api.patch(`/orders/finish/${tableNumber}`);
      toast.success(`Table ${tableNumber} session finished and ready for billing!`, {
        icon: '🧾',
        style: {
          borderRadius: '10px',
          background: '#1f2937',
          color: '#fff',
        },
      });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error finishing table session:', error);
      const errorMessage = error.response?.data?.message || 'Failed to finish table session';
      
      if (error.response?.data?.pendingItems) {
        const pendingItems = error.response.data.pendingItems;
        toast.error(`Cannot finish session - ${pendingItems.length} items still in kitchen: ${pendingItems.map(item => item.dishName).join(', ')}`, {
          duration: 8000,
          style: {
            borderRadius: '10px',
            background: '#7f1d1d',
            color: '#fff',
          },
        });
      } else {
        toast.error(errorMessage, {
          style: {
            borderRadius: '10px',
            background: '#1f2937',
            color: '#fff',
          },
        });
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Cashier Dashboard</h1>
        <div className="flex space-x-6 text-sm flex-wrap">
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Today's Revenue: </span>
            <span className="text-green-400 font-semibold">LKR {formatCurrency(stats.totalRevenue)}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Today's Orders: </span>
            <span className="text-blue-400 font-semibold">{stats.todayOrders || 0}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Active Orders: </span>
            <span className="text-yellow-400 font-semibold">{stats.activeOrders || 0}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Delivery Orders: </span>
            <span className="text-purple-400 font-semibold">{deliveryOrders.length || 0}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">🚚 PickMe: </span>
            <span className="text-yellow-400 font-semibold">
              {deliveryOrders.filter(o => o.deliveryPlatform === 'pickme' || o.orderType === 'pickme').length || 0}
            </span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">🚗 Uber: </span>
            <span className="text-gray-300 font-semibold">
              {deliveryOrders.filter(o => o.deliveryPlatform === 'uber' || o.orderType === 'uber').length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Restaurant Tables (1-10)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {tables.map(table => (
            <TableCard
              key={table}
              tableNumber={table}
              orders={getTableOrders(table)}
              onNewOrder={handleNewOrder}
              onViewDetails={handleViewDetails}
              onFinishSession={handleFinishSession}
            />
          ))}
        </div>
      </div>

      {/* Delivery Orders Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-white">🚚 Delivery Orders (PickMe & Uber)</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setOrderType('pickme');
                setSelectedTable(null);
                setIsOrderModalOpen(true);
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <span>🚚</span>
              <span>+ PickMe Order</span>
            </button>
            <button
              onClick={() => {
                setOrderType('uber');
                setSelectedTable(null);
                setIsOrderModalOpen(true);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>🚗</span>
              <span>+ Uber Order</span>
            </button>
          </div>
        </div>
        
        {deliveryOrders.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-lg text-center">
            <p className="text-slate-400">No active delivery orders</p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => {
                  setOrderType('pickme');
                  setSelectedTable(null);
                  setIsOrderModalOpen(true);
                }}
                className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 transition-colors"
              >
                🚚 Create PickMe Order
              </button>
              <button
                onClick={() => {
                  setOrderType('uber');
                  setSelectedTable(null);
                  setIsOrderModalOpen(true);
                }}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                🚗 Create Uber Order
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveryOrders.map(order => {
              const isPickMe = order.deliveryPlatform === 'pickme' || order.orderType === 'pickme';
              const isUber = order.deliveryPlatform === 'uber' || order.orderType === 'uber';
              const platformIcon = isPickMe ? '🚚' : '🚗';
              const platformName = isPickMe ? 'PickMe' : 'Uber Eats';
              const platformColor = isPickMe ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-500 bg-gray-900/20';
              
              return (
                <div key={order._id} className={`bg-slate-800 p-4 rounded-lg border ${platformColor}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{order.orderId}</h3>
                      <p className="text-sm text-slate-400">
                        {platformIcon} {platformName}
                        {order.deliveryOrderNumber && ` • #${order.deliveryOrderNumber}`}
                      </p>
                      {(order.customerName || order.customerMobile) && (
                        <div className="text-xs text-slate-500 mt-1">
                          {order.customerName && <div>👤 {order.customerName}</div>}
                          {order.customerMobile && <div>📱 {order.customerMobile}</div>}
                        </div>
                      )}
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span 
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                          order.status === 'preparing' ? 'bg-blue-900 text-blue-300' :
                          order.status === 'completed' ? 'bg-green-900 text-green-300' :
                          order.status === 'done' ? 'bg-green-900 text-green-300' :
                          'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {order.status === 'preparing' ? 'PREPARING' : 
                         order.status === 'completed' ? 'READY' :
                         order.status === 'done' ? 'DONE' :
                         order.status.toUpperCase()}
                      </span>
                      <div className={`font-bold mt-1 ${isPickMe ? 'text-yellow-400' : 'text-gray-300'}`}>
                        <div>LKR {formatCurrency(getDisplayAmount(order))}</div>
                        {hasDiscount(order) && (
                          <div className="text-xs text-orange-400 flex items-center gap-1">
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
                  
                  <div className="text-xs text-slate-400 mb-3">
                    {order.items?.length || 0} items • {order.items?.map(item => `${item.quantity || item.qty}x ${item.dishId?.name || item.dishName || item.name}`).join(', ')}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-slate-700 text-slate-300 py-1 px-3 rounded text-sm hover:bg-slate-600 transition-colors"
                    >
                      View Details
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleMarkDone(order._id)}
                        className="flex-1 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Start Prep
                      </button>
                    )}
                    {(order.status === 'done' || order.status === 'completed') && (
                      <button
                        onClick={() => handleBillOrder(order)}
                        className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Bill & Print
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Orders Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-white">All Orders</h2>
          <button
            onClick={handleNewTakeawayOrder}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            + New Order
          </button>
        </div>
        
        {takeawayOrders.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-lg text-center">
            <p className="text-slate-400">No orders at the moment</p>
            <button
              onClick={handleNewTakeawayOrder}
              className="mt-4 bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition-colors"
            >
              Create First Order
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {takeawayOrders.map(order => (
              <div key={order._id} className="bg-slate-800 p-4 rounded-lg border border-orange-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{order.orderId}</h3>
                    <p className="text-sm text-slate-400">
                      📦 Takeaway • {order.placedBy === 'customer' ? 'Customer Order' : `${order.placedBy} Order`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span 
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                        order.status === 'done' ? 'bg-green-900 text-green-300' :
                        'bg-blue-900 text-blue-300'
                      }`}
                    >
                      {order.status.toUpperCase()}
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
                
                <div className="text-xs text-slate-400 mb-3">
                  {order.items?.length || 0} items • {order.items?.map(item => `${item.qty}x ${item.dishName}`).join(', ')}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewTakeawayDetails([order])}
                    className="flex-1 bg-slate-700 text-slate-300 py-1 px-3 rounded text-sm hover:bg-slate-600 transition-colors"
                  >
                    View Details
                  </button>
                  {order.status === 'done' && (
                    <button
                      onClick={() => handleBillOrder(order)}
                      className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Bill & Print
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kitchen Orders Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">🍳 Kitchen Orders - Live View</h2>
        {orders.filter(order => ['pending', 'done'].includes(order.status)).length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-lg text-center">
            <p className="text-slate-400">No active orders in kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders
              .filter(order => ['pending', 'done'].includes(order.status))
              .sort((a, b) => {
                // Priority: pending first, then done
                if (a.status === 'pending' && b.status === 'done') return -1;
                if (a.status === 'done' && b.status === 'pending') return 1;
                return new Date(a.createdAt) - new Date(b.createdAt);
              })
              .map(order => (
                <div key={order._id} className={`bg-slate-800 p-4 rounded-lg border-2 transition-all ${
                  order.status === 'pending' 
                    ? 'border-yellow-500 bg-yellow-900/20' 
                    : 'border-green-500 bg-green-900/20'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>

                                  <h3 className="font-semibold text-white ">
                        {order.orderType === 'takeaway' ? '📦 Takeaway' : ` Table ${order.table}`}
                      </h3>
                      <p className="font-semibold text-slate-400">{order.orderId}</p>

                      <p className="text-xs text-slate-500">
                        {order.placedBy} • {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span 
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'pending' 
                            ? 'bg-yellow-900 text-yellow-300' 
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
                  
                  <div className="text-xs text-slate-400 mb-2">
                    📝 {order.items?.length || 0} items:
                  </div>
                  <div className="text-xs text-slate-300 mb-3 max-h-16 overflow-y-auto">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.qty}x {item.dishName}</span>
                        <span>LKR {((item.qty || 0) * (item.price || 0)).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                    <span>⏱️ {Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60))} min ago</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-3">
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
                        onClick={() => handleBillOrder(order)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
                      >
                        💰 Bill & Print
                      </button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* In-Progress Sessions Section */}
      {orders.filter(order => order.status === 'in_progress').length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">🔥 Active Table Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders
              .filter(order => order.status === 'in_progress')
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map(order => (
                <div key={order._id} className="bg-slate-800 p-4 rounded-lg border-2 border-orange-500 bg-orange-900/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{order.orderId}</h3>
                      <p className="text-sm text-orange-400">
                        🪑 Table {order.table} • Active Session
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.placedBy} • {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-orange-900 text-orange-300">
                        🔥 IN PROGRESS
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
                  
                  <div className="text-xs text-slate-400 mb-2">
                    📝 {order.items?.length || 0} items:
                  </div>
                  <div className="text-xs text-slate-300 mb-3 max-h-16 overflow-y-auto">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.qty}x {item.dishName}</span>
                        <span>LKR {((item.qty || 0) * (item.price || 0)).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                    <span>⏱️ {Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60))} min ago</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleNewOrder(order.table)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
                    >
                      + Add Items
                    </button>
                    <button
                      onClick={() => handleFinishSession(order.table)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
                    >
                      ✓ Finish
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Quick Actions for Active Orders */}
      {stats.activeOrders > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Ready to Bill</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              .filter(order => order.status === 'done')
              .slice(0, 6) // Show max 6 for quick access
              .map(order => (
                <div key={order._id} className="bg-slate-800 p-4 rounded-lg border border-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>                
                         <h3 className="font-semibold text-white ">
                        {order.table === 'takeaway' ? 'Takeaway' : `Table ${order.table}`}
                      </h3>
                      <p className="font-semibold text-slate-400">{order.orderId}</p>
   
                    </div>
                    <div className="text-right">
                      <span className="text-green-400 font-bold">LKR {formatCurrency(getDisplayAmount(order))}</span>
                      {hasDiscount(order) && (
                        <div className="text-xs text-orange-400 flex items-center justify-end gap-1 mt-1">
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
                  <button
                    onClick={() => handleBillOrder(order)}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    Bill & Print
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Order Modal */}
      <ErrorBoundary>
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedTable(null);
            setOrderType('dine-in');
          }}
          onSubmit={handlePlaceOrder}
          menuItems={menuItems}
          orderType={orderType}
          tableNumber={selectedTable}
        />
      </ErrorBoundary>

      {/* Billing Modal */}
      <ErrorBoundary>
        <BillingModal
          isOpen={isBillingModalOpen}
          onClose={() => {
            setIsBillingModalOpen(false);
            setSelectedOrderForBilling(null);
          }}
          order={selectedOrderForBilling}
          onBillComplete={handleBillComplete}
        />
      </ErrorBoundary>
    </div>
  );
};

export default CashierDashboard;