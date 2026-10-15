import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { 
  CurrencyDollarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function KitchenDashboard() {
  const [preparations, setPreparations] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [preparationsRes, summaryRes] = await Promise.all([
        api.get(`/menu-preparations?date=${today}&limit=20`),
        api.get(`/menu-preparations/daily-summary?date=${today}`)
      ]);
      
      setPreparations(preparationsRes.data);
      setDailySummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);





  const preparationColumns = [
    { 
      key: 'menuItemName', 
      label: 'Dish Name' 
    },
    { 
      key: 'quantityPrepared', 
      label: 'Quantity',
      render: (_, prep) => `${prep.quantityPrepared} serving${prep.quantityPrepared > 1 ? 's' : ''}`
    },
    { 
      key: 'totalCost', 
      label: 'Total Cost',
      render: (_, prep) => `LKR ${(Number(prep.totalCost) || 0).toFixed(2)}`
    },
    { 
      key: 'shift', 
      label: 'Shift',
      render: (_, prep) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          prep.shift === 'morning' ? 'bg-yellow-500/20 text-yellow-300' :
          prep.shift === 'afternoon' ? 'bg-orange-500/20 text-orange-300' :
          prep.shift === 'evening' ? 'bg-blue-500/20 text-blue-300' :
          'bg-purple-500/20 text-purple-300'
        }`}>
          {prep.shift.charAt(0).toUpperCase() + prep.shift.slice(1)}
        </span>
      )
    },
    { 
      key: 'preparationDate', 
      label: 'Time',
      render: (_, prep) => new Date(prep.preparationDate).toLocaleTimeString('en-LK', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Kitchen Dashboard</h1>
          <p className="text-slate-400 mt-1">View preparation history - inventory is now automatically managed through KOT orders</p>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-slate-400 text-sm">Today's Preparations</div>
          <div className="text-2xl font-bold text-white">
            {dailySummary?.totalPreparations || 0}
          </div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Total Servings</div>
          <div className="text-2xl font-bold text-primary">
            {dailySummary?.totalServings || 0}
          </div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Today's Cost</div>
          <div className="text-2xl font-bold text-green-400">
            LKR {dailySummary?.totalCost?.toFixed(2) || '0.00'}
          </div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Avg Cost/Serving</div>
          <div className="text-2xl font-bold text-blue-400">
            LKR {dailySummary?.totalServings > 0 ? 
              (dailySummary.totalCost / dailySummary.totalServings).toFixed(2) : '0.00'}
          </div>
        </Card>
      </div>

      {/* Information Card */}
      <Card title="🚀 Automatic Inventory Management" className="overflow-hidden">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">New System Active!</h3>
          <div className="text-slate-300 space-y-2">
            <p>✅ <strong>Inventory is now automatically managed</strong> when KOT orders are placed</p>
            <p>✅ <strong>Stock validation</strong> happens before orders are accepted</p>
            <p>✅ <strong>Real-time deduction</strong> from inventory when customers/staff place orders</p>
            <p>✅ <strong>Out-of-stock prevention</strong> - orders are rejected if ingredients are insufficient</p>
          </div>
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
            <p className="text-green-400 font-medium">📋 Your Role:</p>
            <p className="text-slate-300 text-sm mt-1">
              Focus on preparing the orders that come in. The system ensures you have all the ingredients needed for each order.
            </p>
          </div>
        </div>
      </Card>

      {/* Today's Preparations */}
      <Card title="Today's Preparations" className="overflow-hidden">
        {preparations.length > 0 ? (
          <Table data={preparations} columns={preparationColumns} />
        ) : (
          <div className="text-center py-8 text-slate-400">
            No preparations recorded today yet.
          </div>
        )}
      </Card>


    </div>
  );
}