import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function MenuAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('week');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      let url = `/menu-preparations/analytics?period=${period}`;
      
      if (customDateRange.startDate && customDateRange.endDate) {
        url += `&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
      }
      
      const response = await api.get(url);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (customDateRange.startDate && customDateRange.endDate) {
      loadAnalytics();
    }
  };

  const exportToCSV = () => {
    if (!analytics || !analytics.dailyBreakdown) return;

    const csvData = [
      ['Date', 'Total Cost', 'Total Servings', 'Preparations', 'Avg Cost per Serving'],
      ...analytics.dailyBreakdown.map(day => [
        day.date,
        day.totalCost.toFixed(2),
        day.totalServings,
        day.preparations,
        day.totalServings > 0 ? (day.totalCost / day.totalServings).toFixed(2) : '0.00'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-analytics-${analytics.startDate}-${analytics.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const topMenuItemsColumns = [
    { key: 'name', label: 'Menu Item' },
    { 
      key: 'totalQuantity', 
      label: 'Total Servings',
      render: (_, item) => `${item.totalQuantity} servings`
    },
    { 
      key: 'totalCost', 
      label: 'Total Cost',
      render: (_, item) => `LKR ${item.totalCost.toFixed(2)}`
    },
    { 
      key: 'frequency', 
      label: 'Preparations',
      render: (_, item) => `${item.frequency} times`
    },
    { 
      key: 'avgCost', 
      label: 'Avg Cost/Serving',
      render: (_, item) => `LKR ${item.totalQuantity > 0 ? ((Number(item.totalCost) || 0) / (Number(item.totalQuantity) || 1)).toFixed(2) : '0.00'}`
    }
  ];

  const dailyBreakdownColumns = [
    { 
      key: 'date', 
      label: 'Date',
      render: (_, day) => new Date(day.date).toLocaleDateString('en-LK')
    },
    { 
      key: 'totalServings', 
      label: 'Servings' 
    },
    { 
      key: 'preparations', 
      label: 'Preparations' 
    },
    { 
      key: 'totalCost', 
      label: 'Total Cost',
      render: (_, day) => `LKR ${(Number(day.totalCost) || 0).toFixed(2)}`
    },
    { 
      key: 'avgCost', 
      label: 'Avg/Serving',
      render: (_, day) => `LKR ${day.totalServings > 0 ? ((Number(day.totalCost) || 0) / (Number(day.totalServings) || 1)).toFixed(2) : '0.00'}`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Menu Analytics & Reports</h1>
          <p className="text-slate-400 mt-1">Analyze meal preparation costs and consumption patterns</p>
        </div>
        {analytics && (
          <button 
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        )}
      </div>

      {/* Period Selection */}
      <Card title="Report Period">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Quick Period</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          
          {period === 'custom' && (
            <form onSubmit={handleCustomDateSubmit} className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Custom Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                />
                <input
                  type="date"
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Apply
                </button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <div className="text-slate-400 text-sm">Period</div>
              <div className="text-lg font-bold text-white">
                {new Date(analytics.startDate).toLocaleDateString('en-LK')} - {new Date(analytics.endDate).toLocaleDateString('en-LK')}
              </div>
            </Card>
            <Card>
              <div className="text-slate-400 text-sm">Total Cost</div>
              <div className="text-2xl font-bold text-primary">
                LKR {(Number(analytics.totalCost) || 0).toFixed(2)}
              </div>
            </Card>
            <Card>
              <div className="text-slate-400 text-sm">Total Servings</div>
              <div className="text-2xl font-bold text-green-400">
                {Number(analytics.totalServings) || 0}
              </div>
            </Card>
            <Card>
              <div className="text-slate-400 text-sm">Total Preparations</div>
              <div className="text-2xl font-bold text-blue-400">
                {Number(analytics.totalPreparations) || 0}
              </div>
            </Card>
            <Card>
              <div className="text-slate-400 text-sm">Avg Cost/Serving</div>
              <div className="text-2xl font-bold text-yellow-400">
                LKR {(Number(analytics.averageCostPerServing) || 0).toFixed(2)}
              </div>
            </Card>
          </div>

          {/* Top Menu Items */}
          <Card title="Top Menu Items by Cost" className="overflow-hidden">
            {analytics.topMenuItems && analytics.topMenuItems.length > 0 ? (
              <Table data={analytics.topMenuItems} columns={topMenuItemsColumns} />
            ) : (
              <div className="text-center py-8 text-slate-400">
                No menu items data available for this period.
              </div>
            )}
          </Card>

          {/* Daily Breakdown */}
          <Card title="Daily Breakdown" className="overflow-hidden">
            {analytics.dailyBreakdown && analytics.dailyBreakdown.length > 0 ? (
              <Table data={analytics.dailyBreakdown} columns={dailyBreakdownColumns} />
            ) : (
              <div className="text-center py-8 text-slate-400">
                No daily breakdown data available for this period.
              </div>
            )}
          </Card>

          {/* Cost Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Cost Distribution">
              <div className="space-y-3">
                {analytics.topMenuItems.slice(0, 5).map((item, index) => {
                  const percentage = analytics.totalCost > 0 ? ((Number(item.totalCost) || 0) / (Number(analytics.totalCost) || 1) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{item.name}</div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary-500 h-2 rounded-full" 
                            style={{width: `${percentage}%`}}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-bold text-primary">{(Number(percentage) || 0).toFixed(1)}%</div>
                        <div className="text-xs text-slate-400">LKR {(Number(item.totalCost) || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Performance Metrics">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-300">Daily Average Cost</span>
                  <span className="font-bold text-white">
                    LKR {analytics.dailyBreakdown.length > 0 ? 
                      ((Number(analytics.totalCost) || 0) / analytics.dailyBreakdown.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-300">Daily Average Servings</span>
                  <span className="font-bold text-white">
                    {analytics.dailyBreakdown.length > 0 ? 
                      Math.round((Number(analytics.totalServings) || 0) / analytics.dailyBreakdown.length) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-300">Most Expensive Item</span>
                  <span className="font-bold text-red-400">
                    {analytics.topMenuItems.length > 0 ? 
                      `LKR ${analytics.topMenuItems[0].totalQuantity > 0 ? ((Number(analytics.topMenuItems[0].totalCost) || 0) / (Number(analytics.topMenuItems[0].totalQuantity) || 1)).toFixed(2) : '0.00'}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300">Most Popular Item</span>
                  <span className="font-bold text-green-400">
                    {analytics.topMenuItems.length > 0 ? 
                      analytics.topMenuItems.reduce((prev, current) => 
                        prev.totalQuantity > current.totalQuantity ? prev : current
                      ).name : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-slate-400">
            No analytics data available. Select a period to view reports.
          </div>
        </Card>
      )}
    </div>
  );
}