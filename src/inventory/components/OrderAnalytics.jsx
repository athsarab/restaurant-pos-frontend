import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  Calendar,
  Download,
  Eye,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Percent,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { 
  getDisplayAmount, 
  getRevenueAmount,
  hasDiscount, 
  getDiscountInfo, 
  formatDisplayAmount, 
  calculateTotalRevenue,
  isCancelled,
  canCancelOrder
} from '../../utils/orderUtils';
import { useAuth } from '../hooks/useAuth';

const OrderAnalytics = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    status: 'all',
    placedBy: 'all',
    table: 'all',
    minAmount: '',
    maxAmount: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topItems: [],
    dailyStats: [],
    statusBreakdown: {},
    tableStats: {},
    hourlyStats: []
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchOrdersData();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, filters]);

  useEffect(() => {
    calculateAnalytics();
  }, [filteredOrders]);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders', {
        params: {
          limit: 1000,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.dishName?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = filters.status === 'all' || order.status === filters.status;
      const matchesPlacedBy = filters.placedBy === 'all' || order.placedBy === filters.placedBy;
      const matchesTable = filters.table === 'all' || (order.table && order.table.toString() === filters.table);
      
      const matchesAmount = 
        (!filters.minAmount || (getDisplayAmount(order) >= parseFloat(filters.minAmount))) &&
        (!filters.maxAmount || (getDisplayAmount(order) <= parseFloat(filters.maxAmount)));

      return matchesSearch && matchesStatus && matchesPlacedBy && matchesTable && matchesAmount;
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const calculateAnalytics = () => {
    if (filteredOrders.length === 0) {
      setAnalytics({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        topItems: [],
        dailyStats: [],
        statusBreakdown: {},
        tableStats: {},
        hourlyStats: []
      });
      return;
    }

    // Basic stats - exclude cancelled orders from revenue
    const totalRevenue = calculateTotalRevenue(filteredOrders);
    const totalOrders = filteredOrders.length;
    const revenueOrders = filteredOrders.filter(order => !isCancelled(order) && order.status === 'billed').length;
    const avgOrderValue = revenueOrders > 0 ? totalRevenue / revenueOrders : 0;

    // Status breakdown
    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      if (order.status) {
        acc[order.status] = (acc[order.status] || 0) + 1;
      }
      return acc;
    }, {});

    // Table statistics - exclude cancelled orders from revenue
    const tableStats = filteredOrders.reduce((acc, order) => {
      const table = order.table ? order.table.toString() : 'unknown';
      if (!acc[table]) {
        acc[table] = { orders: 0, revenue: 0 };
      }
      acc[table].orders += 1;
      acc[table].revenue += getRevenueAmount(order); // This excludes cancelled orders
      return acc;
    }, {});

    // Top items - exclude cancelled orders
    const itemStats = {};
    filteredOrders
      .filter(order => !isCancelled(order)) // Exclude cancelled orders from item stats
      .forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item.dishName) {
              if (!itemStats[item.dishName]) {
                itemStats[item.dishName] = { qty: 0, revenue: 0, orders: 0 };
              }
              itemStats[item.dishName].qty += (item.qty || 0);
              itemStats[item.dishName].revenue += (item.totalPrice || 0);
              itemStats[item.dishName].orders += 1;
            }
          });
        }
      });

    const topItems = Object.entries(itemStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily stats - exclude cancelled orders from revenue
    const dailyStats = {};
    filteredOrders.forEach(order => {
      if (order.createdAt) {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { orders: 0, revenue: 0 };
        }
        dailyStats[date].orders += 1;
        dailyStats[date].revenue += getRevenueAmount(order); // This excludes cancelled orders
      }
    });

    const dailyStatsArray = Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Hourly stats
    const hourlyStats = {};
    filteredOrders.forEach(order => {
      if (order.createdAt) {
        const hour = new Date(order.createdAt).getHours();
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
      }
    });

    setAnalytics({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topItems,
      dailyStats: dailyStatsArray,
      statusBreakdown,
      tableStats,
      hourlyStats
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Table',
      'Placed By',
      'Status',
      'Items',
      'Total Amount'
    ];

    const csvData = filteredOrders.map(order => [
      order.orderId || '',
      order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
      order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '',
      order.table || '',
      order.placedBy || '',
      order.status || '',
      order.items ? order.items.map(item => `${item.dishName || 'Unknown'} x${item.qty || 0}`).join('; ') : '',
      (getDisplayAmount(order)).toFixed(2)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-analytics-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setCancellationReason('');
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel || !cancellationReason.trim()) {
      toast.error('Cancellation reason is required');
      return;
    }

    if (cancellationReason.trim().length < 10) {
      toast.error('Cancellation reason must be at least 10 characters long');
      return;
    }

    setCancelLoading(true);
    try {
      await api.patch(`/orders/${orderToCancel._id}/cancel`, {
        cancellationReason: cancellationReason.trim()
      });

      toast.success('Order cancelled successfully');
      
      // Refresh data
      fetchOrdersData();
      
      // Close modal
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'done': return 'bg-green-600';
      case 'billed': return 'bg-blue-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getPlacedByColor = (placedBy) => {
    switch (placedBy) {
      case 'customer': return 'bg-purple-600';
      case 'cashier': return 'bg-blue-600';
      case 'waiter': return 'bg-green-600';
      case 'admin': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="text-blue-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Order Analytics Dashboard</h1>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              <DollarSign className="text-green-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  LKR {analytics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="text-blue-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{analytics.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-orange-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">
                  LKR {analytics.avgOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              <Users className="text-purple-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Customer Orders</p>
                <p className="text-2xl font-bold text-white">
                  {filteredOrders.filter(o => o.placedBy === 'customer').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 p-6 rounded-lg mb-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Filters & Search</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
              <option value="billed">Billed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Placed By Filter */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Placed By</label>
            <select
              value={filters.placedBy}
              onChange={(e) => setFilters(prev => ({ ...prev, placedBy: e.target.value }))}
              className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
            >
              <option value="all">All Users</option>
              <option value="customer">Customer</option>
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by KOT ID or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 text-white pl-10 p-2 rounded border border-slate-600"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Min Amount (LKR)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Max Amount (LKR)</label>
            <input
              type="number"
              placeholder="No limit"
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-slate-400">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Order History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-left p-4 text-slate-300 font-medium">KOT ID</th>
                <th className="text-left p-4 text-slate-300 font-medium">Date & Time</th>
                <th className="text-left p-4 text-slate-300 font-medium">Table</th>
                <th className="text-left p-4 text-slate-300 font-medium">Placed By</th>
                <th className="text-left p-4 text-slate-300 font-medium">Items</th>
                <th className="text-right p-4 text-slate-300 font-medium">Amount</th>
                <th className="text-center p-4 text-slate-300 font-medium">Status</th>
                <th className="text-center p-4 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order._id} className="border-b border-slate-700 hover:bg-slate-750">
                  <td className="p-4">
                    <span className="font-mono text-blue-400">{order.orderId || 'N/A'}</span>
                  </td>
                  <td className="p-4 text-slate-300">
                    <div className="text-sm">
                      <div>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-slate-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white">
                      {order.table === 'takeaway' ? '🥡 Takeaway' : order.table ? `🪑 Table ${order.table}` : 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge className={`${getPlacedByColor(order.placedBy)} text-white`}>
                      {order.placedBy || 'Unknown'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="text-white">{order.items ? order.items.length : 0} items</div>
                      <div className="text-slate-400 max-w-xs truncate">
                        {order.items ? order.items.map(item => `${item.dishName || 'Unknown'} x${item.qty || 0}`).join(', ') : 'No items'}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-right">
                      {isCancelled(order) ? (
                        <div>
                          <span className="text-red-400 font-semibold line-through">
                            LKR {formatDisplayAmount(order.totalAmount || 0)}
                          </span>
                          <div className="text-xs text-red-400 mt-1">CANCELLED</div>
                        </div>
                      ) : (
                        <>
                          <span className="text-green-400 font-semibold">
                            LKR {formatDisplayAmount(getDisplayAmount(order))}
                          </span>
                          {hasDiscount(order) && (
                            <div className="text-xs text-orange-400 flex items-center justify-end gap-1 mt-1">
                              <Percent size={12} />
                              <span>
                                {(() => {
                                  const discountInfo = getDiscountInfo(order);
                                  return discountInfo.discountType === 'percentage' 
                                    ? `${order.discount}% off` 
                                    : `LKR ${formatDisplayAmount(discountInfo.discountAmount)} off`;
                                })()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status || 'Unknown'}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-slate-700"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {user && canCancelOrder(order, user) && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-slate-700"
                          title="Cancel Order"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <div className="text-slate-400 text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-2 text-white">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {analytics.topItems.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-slate-500">#{index + 1}</span>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-slate-400 text-sm">{item.qty} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">LKR {item.revenue.toFixed(2)}</p>
                  <p className="text-slate-400 text-sm">{item.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Table Performance</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(analytics.tableStats)
              .sort(([,a], [,b]) => b.revenue - a.revenue)
              .slice(0, 10)
              .map(([table, stats]) => (
                <div key={table} className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">
                      {table === 'takeaway' ? '🥡 Takeaway' : `🪑 Table ${table}`}
                    </p>
                    <p className="text-slate-400 text-sm">{stats.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">LKR {stats.revenue.toFixed(2)}</p>
                    <p className="text-slate-400 text-sm">
                      Avg: LKR {(stats.revenue / stats.orders).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Order Details - {selectedOrder.orderId}</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-slate-400 text-sm">Order Date</p>
                  <p className="text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Table</p>
                  <p className="text-white">
                    {selectedOrder.table === 'takeaway' ? 'Takeaway' : `Table ${selectedOrder.table}`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Placed By</p>
                  <Badge className={`${getPlacedByColor(selectedOrder.placedBy)} text-white`}>
                    {selectedOrder.placedBy}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(selectedOrder.status)} text-white`}>
                      {selectedOrder.status}
                    </Badge>
                    {isCancelled(selectedOrder) && (
                      <span className="text-red-400 text-xs">CANCELLED</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                      <div>
                        <p className="text-white font-medium">{item.dishName}</p>
                        <p className="text-slate-400 text-sm">Category: {item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">Qty: {item.qty}</p>
                        <p className="text-green-400">LKR {item.price} × {item.qty} = LKR {item.totalPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isCancelled(selectedOrder) && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded">
                  <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <XCircle size={18} />
                    Order Cancelled
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="text-slate-400">
                      Cancelled: {selectedOrder.cancelledAt ? new Date(selectedOrder.cancelledAt).toLocaleString() : 'N/A'}
                    </div>
                    {selectedOrder.cancellationReason && (
                      <div>
                        <span className="text-slate-400">Reason: </span>
                        <span className="text-white">{selectedOrder.cancellationReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-700 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white">
                      LKR {formatDisplayAmount(selectedOrder.totalAmount)}
                    </span>
                  </div>
                  
                  {hasDiscount(selectedOrder) && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Percent size={14} />
                          Discount:
                        </span>
                        <span className="text-orange-400">
                          {(() => {
                            const discountInfo = getDiscountInfo(selectedOrder);
                            return selectedOrder.discountType === 'percentage' 
                              ? `${selectedOrder.discount}% (LKR ${formatDisplayAmount(discountInfo.discountAmount)})`
                              : `LKR ${formatDisplayAmount(discountInfo.discountAmount)}`;
                          })()}
                        </span>
                      </div>
                      
                      {selectedOrder.discountReason && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Reason:</span>
                          <span className="text-slate-300 text-sm italic">
                            {selectedOrder.discountReason}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-semibold border-t border-slate-600 pt-2">
                    <span className="text-white">
                      {hasDiscount(selectedOrder) ? 'Final Amount:' : 'Total Amount:'}
                    </span>
                    <span className="text-green-400">
                      LKR {formatDisplayAmount(getDisplayAmount(selectedOrder))}
                    </span>
                  </div>
                  
                  {selectedOrder.status === 'billed' && selectedOrder.amountPaid && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Amount Paid:</span>
                        <span className="text-blue-400">
                          LKR {formatDisplayAmount(selectedOrder.amountPaid)}
                        </span>
                      </div>
                      
                      {selectedOrder.balance > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Change:</span>
                          <span className="text-yellow-400">
                            LKR {formatDisplayAmount(selectedOrder.balance)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Payment Method:</span>
                        <span className="text-white capitalize">
                          {selectedOrder.paymentMethod}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="text-red-400" size={24} />
                <h2 className="text-xl font-bold text-white">Cancel Order</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-slate-300 mb-2">
                  Are you sure you want to cancel order <span className="font-mono text-blue-400">{orderToCancel.orderId}</span>?
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  This will restore all inventory items back to stock and exclude this order from revenue calculations.
                </p>
                
                <div className="bg-slate-700 p-3 rounded mb-4">
                  <div className="text-sm text-slate-400">Order Details:</div>
                  <div className="text-white">
                    Table: {orderToCancel.table === 'takeaway' ? 'Takeaway' : `Table ${orderToCancel.table}`}
                  </div>
                  <div className="text-white">
                    Amount: LKR {formatDisplayAmount(getDisplayAmount(orderToCancel))}
                  </div>
                  <div className="text-white">
                    Items: {orderToCancel.items?.length || 0} items
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">
                  Cancellation Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a detailed reason for cancelling this order (minimum 10 characters)..."
                  className="w-full bg-slate-700 text-white p-3 rounded border border-slate-600 min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-slate-500 mt-1">
                  {cancellationReason.length}/500 characters (minimum 10 required)
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setCancellationReason('');
                  }}
                  className="flex-1 bg-slate-600 text-white py-2 px-4 rounded hover:bg-slate-700 transition-colors"
                  disabled={cancelLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={cancelLoading || cancellationReason.trim().length < 10}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAnalytics;