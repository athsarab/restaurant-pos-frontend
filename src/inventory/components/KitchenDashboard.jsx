import { useState, useEffect, useRef } from 'react';
import OrderCard from './OrderCard';
import BeverageOrderCard from './BeverageOrderCard';
import { Badge } from '../../components/ui/badge';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Clock, ChefHat, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import kitchenSoundManager from '../utils/kitchenSound';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, urgent
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    completedToday: 0,
    averageTime: 0
  });
  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Enable audio on first user interaction
    const enableAudio = () => {
      kitchenSoundManager.enableAudioOnUserInteraction();
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    
    // Refresh data every 15 seconds for kitchen
    const interval = setInterval(fetchDashboardData, 15000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, []);

  // Handle sound settings
  useEffect(() => {
    kitchenSoundManager.toggleSound(soundEnabled);
  }, [soundEnabled]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/orders/dashboard');
      const { orders: ordersData, ...statsData } = response.data;
      const newOrders = ordersData || [];
      
      // Check for new orders and play sound notifications (skip on initial load)
      if (!isInitialLoad.current && soundEnabled) {
        kitchenSoundManager.checkForNewOrders(newOrders);
      }
      
      setOrders(newOrders);
      setStats(statsData);
      
      // Mark that initial load is complete
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (orderId, itemId = null) => {
    try {
      if (itemId) {
        // Mark individual item as done
        await api.patch(`/orders/${orderId}/items/${itemId}/done`);
        toast.success('Item marked as done!');
      } else {
        // Mark entire order as done (legacy for takeaway)
        await api.patch(`/orders/${orderId}/done`);
        toast.success('Order marked as done!');
      }
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error marking as done:', error);
      toast.error('Failed to mark as done');
    }
  };

  const getOrderAge = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    return isNaN(diffInMinutes) ? 0 : Math.max(0, diffInMinutes);
  };

  const isOrderUrgent = (createdAt) => {
    return getOrderAge(createdAt) >= 20; // 20 minutes or more
  };

  // Function to check if an item is pre-made (ready category)
  const isPreMadeCategory = (category) => {
    const preMadeCategories = ['Bakery', 'Pancakes - Savory', 'Pancakes - Sweets', 'Ice Cream'];
    return preMadeCategories.includes(category);
  };

  const getFilteredOrders = () => {
    // For kitchen dashboard, show orders that have at least one pending item (excluding pre-made items)
    let filtered = orders.filter(order => {
      // For dine-in orders, check if any items are still pending (excluding pre-made)
      if (order.orderType === 'dine-in') {
        return order.items.some(item => {
          const isPreMade = isPreMadeCategory(item.category);
          return !isPreMade && item.status === 'pending';
        });
      }
      // For takeaway orders, use overall order status
      return order.status === 'pending';
    });
    
    if (filter === 'urgent') {
      filtered = filtered.filter(order => isOrderUrgent(order.createdAt));
    }
    
    // Sort by creation time (oldest first)
    return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  const getBeverageOrders = () => {
    return orders.filter(order => {
      // Check if order has beverage items that are still pending
      const hasPendingBeverages = order.items.some(item => 
        (item.category === 'Beverage' || item.category === 'Beverages') && 
        (order.orderType && ['takeaway', 'pickme', 'uber'].includes(order.orderType) ? order.status === 'pending' : item.status === 'pending')
      );
      return hasPendingBeverages;
    });
  };

  const getFoodOrders = () => {
    return orders.filter(order => {
      // Check if order has food items that are still pending (excluding pre-made and beverages)
      const hasPendingFood = order.items.some(item => {
        const isPreMade = isPreMadeCategory(item.category);
        const isBeverage = item.category === 'Beverage' || item.category === 'Beverages';
        return !isPreMade && !isBeverage && 
        (order.orderType && ['takeaway', 'pickme', 'uber'].includes(order.orderType) ? order.status === 'pending' : item.status === 'pending');
      });
      return hasPendingFood;
    });
  };

  const getUrgentOrders = () => {
    return getFilteredOrders().filter(order => isOrderUrgent(order.createdAt));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading kitchen dashboard...</div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();
  const beverageOrders = getBeverageOrders();
  const foodOrders = getFoodOrders();
  const urgentOrders = getUrgentOrders();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <ChefHat className="text-orange-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Kitchen Dashboard</h1>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={soundEnabled ? 'Sound notifications ON' : 'Sound notifications OFF'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="text-sm font-medium">
              {soundEnabled ? 'Sound ON' : 'Sound OFF'}
            </span>
          </button>
        </div>
        
        <div className="flex space-x-6 text-sm mb-4">
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Pending Orders: </span>
            <span className="text-orange-400 font-semibold">{Number(stats.pendingOrders) || 0}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Completed Today: </span>
            <span className="text-green-400 font-semibold">{Number(stats.completedToday) || 0}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded">
            <span className="text-slate-400">Avg. Time: </span>
            <span className="text-blue-400 font-semibold">{Number(stats.averageTime) || 0} min</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded text-sm ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All Orders ({filteredOrders?.length || 0})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded text-sm flex items-center space-x-1 ${
              filter === 'urgent'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <AlertTriangle size={16} />
            <span>Urgent ({urgentOrders?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Priority Section - Urgent Orders */}
      {(urgentOrders?.length || 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center space-x-3 bg-red-900/20 border-2 border-red-500/50 rounded-lg p-4">
            <AlertTriangle size={24} className="animate-pulse" />
            <span>🚨 Urgent Orders (20+ minutes)</span>
            <Badge className="bg-red-600 text-white font-bold px-3 py-1 text-sm">
              {urgentOrders?.length || 0} orders
            </Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {urgentOrders.map(order => (
              <div key={order._id} className="relative">
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full z-10 font-bold border-2 border-white shadow-lg animate-pulse">
                  {getOrderAge(order.createdAt)} min
                </div>
                <div className="border-2 border-red-500/50 rounded-lg overflow-hidden shadow-lg hover:shadow-red-500/25 transition-all">
                  <OrderCard
                    order={order}
                    onDone={handleMarkDone}
                    variant="compact"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Orders Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Food Orders */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2 bg-slate-800 p-3 rounded-lg">
            <span>🍽️</span>
            <span>Food Orders ({foodOrders?.length || 0})</span>
            <Badge className="bg-orange-600 text-white font-bold px-2 py-1 text-xs">
              Cooking Required
            </Badge>
          </h2>
          <div className="space-y-4">
            {(foodOrders?.length || 0) === 0 ? (
              <div className="bg-slate-800 p-8 rounded-lg text-center">
                <p className="text-slate-500">No food orders pending</p>
              </div>
            ) : (
              foodOrders.map(order => (
                <div key={order._id} className="relative">
                  <div className="absolute top-2 right-2 flex items-center space-x-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded z-10">
                    <Clock size={12} />
                    <span>{getOrderAge(order.createdAt)} min ago</span>
                  </div>
                  <OrderCard
                    order={order}
                    onDone={handleMarkDone}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Beverage Orders */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2 bg-slate-800 p-3 rounded-lg">
            <span>🥤</span>
            <span>Beverage Orders ({beverageOrders?.length || 0})</span>
            <Badge className="bg-blue-600 text-white font-bold px-2 py-1 text-xs">
              Quick Serve
            </Badge>
          </h2>
          <div className="space-y-4">
            {(beverageOrders?.length || 0) === 0 ? (
              <div className="bg-slate-800 p-8 rounded-lg text-center">
                <p className="text-slate-500">No beverage orders pending</p>
              </div>
            ) : (
              beverageOrders.map(order => (
                <div key={order._id} className="relative">
                  <div className="absolute top-2 right-2 flex items-center space-x-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded z-10">
                    <Clock size={12} />
                    <span>{getOrderAge(order.createdAt)} min ago</span>
                  </div>
                  <BeverageOrderCard
                    order={order}
                    onDone={handleMarkDone}
                    variant="compact"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* No Orders State */}
      {(filteredOrders?.length || 0) === 0 && (
        <div className="text-center py-16">
          <ChefHat className="mx-auto mb-4 text-slate-600" size={64} />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">All caught up!</h3>
          <p className="text-slate-500">No pending orders in the kitchen.</p>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;