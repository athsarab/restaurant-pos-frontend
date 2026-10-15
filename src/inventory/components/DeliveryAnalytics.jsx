import { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, Clock, Truck, Car } from 'lucide-react';
import api from '../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const DeliveryAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    pickmeStats: {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      completedOrders: 0
    },
    uberStats: {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      completedOrders: 0
    },
    monthlyData: [],
    comparisonData: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/delivery/delivery-analytics?range=${timeRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching delivery analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#FBBF24', '#1F2937']; // Yellow for PickMe, Dark for Uber

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Delivery Analytics</h2>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PickMe Stats */}
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">PickMe Orders</p>
              <p className="text-2xl font-bold text-white">{analytics.pickmeStats.totalOrders}</p>
            </div>
            <Truck className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="mt-2 text-xs text-yellow-300">
            Revenue: LKR {analytics.pickmeStats.totalRevenue.toLocaleString()}
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">PickMe Avg Value</p>
              <p className="text-2xl font-bold text-white">LKR {analytics.pickmeStats.avgOrderValue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        {/* Uber Stats */}
        <div className="bg-gray-900/40 border border-gray-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Uber Eats Orders</p>
              <p className="text-2xl font-bold text-white">{analytics.uberStats.totalOrders}</p>
            </div>
            <Car className="w-8 h-8 text-gray-300" />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Revenue: LKR {analytics.uberStats.totalRevenue.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-900/40 border border-gray-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Uber Avg Value</p>
              <p className="text-2xl font-bold text-white">LKR {analytics.uberStats.avgOrderValue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Comparison Chart */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Legend />
              <Bar dataKey="pickme" fill="#FBBF24" name="PickMe" />
              <Bar dataKey="uber" fill="#6B7280" name="Uber Eats" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Market Share Pie Chart */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Market Share</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'PickMe', value: analytics.pickmeStats.totalOrders, color: '#FBBF24' },
                  { name: 'Uber Eats', value: analytics.uberStats.totalOrders, color: '#6B7280' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'PickMe', value: analytics.pickmeStats.totalOrders, color: '#FBBF24' },
                  { name: 'Uber Eats', value: analytics.uberStats.totalOrders, color: '#6B7280' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Delivery Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analytics.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="pickmeOrders" 
              stroke="#FBBF24" 
              strokeWidth={2}
              name="PickMe Orders"
            />
            <Line 
              type="monotone" 
              dataKey="uberOrders" 
              stroke="#6B7280" 
              strokeWidth={2}
              name="Uber Orders"
            />
            <Line 
              type="monotone" 
              dataKey="pickmeRevenue" 
              stroke="#FCD34D" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="PickMe Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="uberRevenue" 
              stroke="#9CA3AF" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Uber Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Avg Preparation Time</p>
              <p className="text-xl font-bold text-white">18 min</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-slate-400">Growth Rate</p>
              <p className="text-xl font-bold text-white">+23.5%</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-slate-400">Completion Rate</p>
              <p className="text-xl font-bold text-white">97.8%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAnalytics;