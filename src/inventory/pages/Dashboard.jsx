import { useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line } from 'recharts';
import api from '../services/api';
import Card from '../components/ui/Card';
import { useDomain } from '../context/DomainContext';
import { ExclamationTriangleIcon, BanknotesIcon, PresentationChartLineIcon, CubeIcon, ChatBubbleLeftEllipsisIcon, CheckCircleIcon, XCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { domain } = useDomain();
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [pvuData, setPvuData] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [cogs, setCogs] = useState(null);
  const [wastageData, setWastageData] = useState([]);
  const [availableItemsData, setAvailableItemsData] = useState([]);
  const [currentStockData, setCurrentStockData] = useState([]);
  const [supplierCategoryData, setSupplierCategoryData] = useState([]);
  const [smsAnalytics, setSmsAnalytics] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [period, setPeriod] = useState('day');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const loadData = useCallback(async () => {
    try {
      const params = { period, ...dateRange };
      const [
        reorderRes,
        pvuRes,
        valueRes,
        cogsRes,
        wastageRes,
        availableItemsRes,
        currentStockRes,
        supplierCategoryRes,
        smsAnalyticsRes
      ] = await Promise.all([
        api.get('/analytics/reorder'),
        api.get('/analytics/pvu', { params }),
        api.get('/analytics/inventory/value'),
        api.get('/analytics/cogs', { params: dateRange }),
        api.get('/analytics/wastage', { params: dateRange }),
        api.get('/analytics/available-items-by-category'),
        api.get('/analytics/current-stock-by-category'),
        api.get('/analytics/supplier-category-analytics'),
        api.get('/campaigns/analytics').catch(() => ({ data: null }))
      ]);

      setReorderAlerts(reorderRes.data);
      setPvuData(pvuRes.data);
      setInventoryValue(valueRes.data);
      setCogs(cogsRes.data);
      setWastageData(wastageRes.data);
      setAvailableItemsData(availableItemsRes.data);
      setCurrentStockData(currentStockRes.data);
      setSupplierCategoryData(supplierCategoryRes.data);
      
      
      // Handle SMS analytics
      if (smsAnalyticsRes.data) {
        setSmsAnalytics(smsAnalyticsRes.data);
        setRecentCampaigns(smsAnalyticsRes.data.recentCampaigns || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [period, dateRange]);

  useEffect(() => {
    loadData();
  }, [domain, loadData]);

  const formatPvuData = (data) => {
    return data.map(item => ({
      period: period === 'day' ? `${item._id.d}/${item._id.m}` : 
              period === 'week' ? `W${item._id.w}/${item._id.y}` :
              `${item._id.m}/${item._id.y}`,
      purchase: item.purchase || 0,
      usage: item.usage || 0,
      wastage: item.wastage || 0
    }));
  };

  const expenseBreakdown = [
    { name: 'COGS', value: cogs?.total || 0 },
    { name: 'Wastage', value: wastageData.reduce((sum, w) => sum + (Number(w.qty) || 0), 0) * 100 },
    { name: 'Inventory Value', value: inventoryValue?.totalValue || 0 }
  ].filter(item => item.value > 0 && !isNaN(item.value));
  

  // SMS Chart Data - use actual data from API
  const getSMSChartData = () => {
    if (!smsAnalytics || !smsAnalytics.dailyTrends) {
      return [];
    }
    return smsAnalytics.dailyTrends;
  };

  const smsChartData = getSMSChartData();

  const colors = ['#00bfb3', '#f59e0b', '#ef4444', '#60a5fa'];

  return (
    <div className="space-y-6">
      {/* Date Range and Period Controls */}
      <Card title="Analytics Controls">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="w-full sm:w-56">
            <label className="block text-sm text-slate-400 mb-1">Period</label>
            <select 
              className="form-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <div className="w-full sm:w-56">
            <label className="block text-sm text-slate-400 mb-1">From</label>
            <input 
              type="date" 
              className="form-input"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            />
          </div>
          <div className="w-full sm:w-56">
            <label className="block text-sm text-slate-400 mb-1">To</label>
            <input 
              type="date" 
              className="form-input"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            />
          </div>
          <div className="pt-0 lg:pt-6">
            <button 
              className="btn-primary w-full lg:w-auto"
              onClick={loadData}
            >
              Refresh
            </button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-slate-400 text-sm">Reorder Alerts</div>
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-semibold text-red-400">{reorderAlerts.length}</div>
        </div>
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-slate-400 text-sm">Inventory Value</div>
            <BanknotesIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-semibold text-primary">LKR {(Number(inventoryValue?.totalValue) || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-slate-400 text-sm">COGS</div>
            <PresentationChartLineIcon className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-semibold text-yellow-400">LKR {(Number(cogs?.total) || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-slate-400 text-sm">Total Items</div>
            <CubeIcon className="w-5 h-5 text-slate-300" />
          </div>
          <div className="text-3xl font-semibold">{(Number(inventoryValue?.totalItems) || 0).toLocaleString()}</div>
        </div>
      </div>

          {/* SMS Analytics Section */}
      {smsAnalytics && (
        <>
          <Card title="📱 SMS Campaign Analytics">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Campaign Performance Overview</h3>
                <p className="text-sm text-slate-400">Monitor your SMS marketing effectiveness</p>
              </div>
              <button 
                onClick={() => window.location.href = '/inventory/sms-campaigns'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Manage Campaigns
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-b from-blue-900/20 to-blue-900/10 rounded-lg p-4 border border-blue-800/30">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">Total Campaigns</div>
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-semibold text-blue-400">{smsAnalytics.totalCampaigns || 0}</div>
              </div>
              <div className="bg-gradient-to-b from-green-900/20 to-green-900/10 rounded-lg p-4 border border-green-800/30">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">Messages Sent</div>
                  <PaperAirplaneIcon className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-semibold text-green-400">{smsAnalytics.totalMessagesSent || 0}</div>
              </div>
              <div className="bg-gradient-to-b from-green-900/20 to-green-900/10 rounded-lg p-4 border border-green-800/30">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">Success Rate</div>
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-semibold text-green-400">{smsAnalytics.successRate || 0}%</div>
              </div>
              <div className="bg-gradient-to-b from-purple-900/20 to-purple-900/10 rounded-lg p-4 border border-purple-800/30">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">Completed</div>
                  <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-semibold text-purple-400">{smsAnalytics.completedCampaigns || 0}</div>
              </div>
            </div>

            {/* Recent Campaigns */}
            {recentCampaigns.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Recent Campaigns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign._id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-medium text-slate-200 truncate">{campaign.name}</div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          campaign.status === 'completed' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                          campaign.status === 'failed' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                          'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                        }`}>
                          {campaign.status}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Success:</span>
                          <span className="text-green-400">{campaign.successCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Failed:</span>
                          <span className="text-red-400">{campaign.failureCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Date:</span>
                          <span className="text-slate-300">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SMS Trends Chart */}
        {smsAnalytics && smsChartData.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">📊 SMS Trends (Last 7 Days)</h3>
              <div className="text-sm text-slate-400">Track your SMS campaign performance over time</div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={smsChartData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0f172a', 
                      border: '1px solid #1e293b',
                      borderRadius: '6px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'totalSent') return [value, 'Total Sent'];
                      if (name === 'delivered') return [value, 'Delivered'];
                      if (name === 'failed') return [value, 'Failed'];
                      if (name === 'cost') return [`LKR ${value}`, 'Cost'];
                      return [value, name];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalSent" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="totalSent"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="delivered" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    name="delivered"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    name="failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-slate-400">Today's Sent</div>
                <div className="text-lg font-semibold text-blue-400">
                  {smsChartData[smsChartData.length - 1]?.totalSent || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">Delivered</div>
                <div className="text-lg font-semibold text-green-400">
                  {smsChartData[smsChartData.length - 1]?.delivered || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">Failed</div>
                <div className="text-lg font-semibold text-red-400">
                  {smsChartData[smsChartData.length - 1]?.failed || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">Cost</div>
                <div className="text-lg font-semibold text-yellow-400">
                  LKR {smsChartData[smsChartData.length - 1]?.cost || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase vs Usage Chart */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 lg:col-span-2">
          <div className="mb-2 font-medium">Purchase vs Usage ({period}ly)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatPvuData(pvuData)}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00bfb3" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#00bfb3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                <Area type="monotone" dataKey="purchase" stroke="#00bfb3" fillOpacity={1} fill="url(#colorPv)" />
                <Area type="monotone" dataKey="usage" stroke="#f59e0b" fillOpacity={1} fill="url(#colorUv)" />
                <Area type="monotone" dataKey="wastage" stroke="#ef4444" fillOpacity={1} fill="url(#colorWv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="mb-2 font-medium">Cost Breakdown</div>
          <div className="h-64">
            {expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                    formatter={(value) => `LKR ${(Number(value) || 0).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* New Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Items by Category */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="mb-2 font-medium">Available Items by Category</div>
          <div className="h-64">
            {availableItemsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={availableItemsData}>
                  <XAxis 
                    dataKey="category" 
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                    formatter={(value, name) => [value, name === 'availableItems' ? 'Items' : 'Total Quantity']}
                  />
                  <Bar dataKey="availableItems" fill="#00bfb3" name="Items" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Current Stock by Category */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="mb-2 font-medium">Current Stock by Category</div>
          <div className="h-64">
            {currentStockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentStockData}>
                  <XAxis 
                    dataKey="category" 
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                    formatter={(value, name) => [value, name === 'currentStock' ? 'Stock Quantity' : 'Items Count']}
                  />
                  <Bar dataKey="currentStock" fill="#f59e0b" name="Stock Quantity" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Category Analytics */}
      {supplierCategoryData.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="mb-2 font-medium">Supplier Category Analytics</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis 
                  dataKey="supplier" 
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                  formatter={(value, name) => {
                    if (name === 'quantity') return [value, 'Quantity Supplied'];
                    if (name === 'amount') return [`LKR ${(Number(value) || 0).toLocaleString()}`, 'Total Amount'];
                    if (name === 'transactions') return [value, 'Transactions'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${label} - ${payload[0].payload.category}`;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="quantity" fill="#60a5fa" name="quantity" />
                <Bar dataKey="amount" fill="#10b981" name="amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reorder Alerts */}
      {reorderAlerts.length > 0 && (
        <Card title="Reorder Alerts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reorderAlerts.map((item) => (
              <div key={item._id} className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                <div className="font-medium text-red-400">{item.name}</div>
                <div className="text-sm text-slate-300">
                  Stock: {item.quantity} {item.unit} • Reorder at: {item.reorderLevel}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
