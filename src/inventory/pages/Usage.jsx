import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useDomain } from '../context/DomainContext';

export default function Usage() {
  const { domain } = useDomain();
  const [items, setItems] = useState([]);
  const [usageData, setUsageData] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoodsOutModal, setShowGoodsOutModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [goodsOutData, setGoodsOutData] = useState({
    quantity: 0,
    reason: '',
    notes: ''
  });

  const loadItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
      // Initialize usage data
      const initialUsage = {};
      res.data.forEach(item => {
        initialUsage[item._id] = 0;
      });
      setUsageData(initialUsage);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  useEffect(() => {
    loadItems();
  }, [domain]);

  const handleUsageChange = (itemId, value) => {
    setUsageData(prev => ({
      ...prev,
      [itemId]: parseFloat(value) || 0
    }));
  };

  const handleSubmitUsage = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit usage for each item with non-zero usage
      const usagePromises = items
        .filter(item => usageData[item._id] > 0)
        .map(item => 
          api.post('/transactions', {
            item: item.name, // Send item name instead of itemId
            type: 'usage',
            quantity: usageData[item._id],
            notes: `Daily usage submission - ${date}`
          })
        );

      await Promise.all(usagePromises);
      
      // Reset form
      const resetUsage = {};
      items.forEach(item => {
        resetUsage[item._id] = 0;
      });
      setUsageData(resetUsage);
      
      alert('Usage submitted successfully!');
      loadItems(); // Refresh inventory
    } catch (error) {
      console.error('Error submitting usage:', error);
      alert('Error submitting usage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoodsOut = (item) => {
    setSelectedItem(item);
    setGoodsOutData({
      quantity: 0,
      reason: 'kitchen-use',
      notes: ''
    });
    setShowGoodsOutModal(true);
  };

  const handleSubmitGoodsOut = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        item: selectedItem.name, // Send item name instead of itemId
        type: 'output',
        quantity: parseFloat(goodsOutData.quantity),
        reason: goodsOutData.reason,
        notes: goodsOutData.notes || `Goods out - ${goodsOutData.reason}`
      });
      
      setShowGoodsOutModal(false);
      setSelectedItem(null);
      setGoodsOutData({
        quantity: 0,
        reason: 'kitchen-use',
        notes: ''
      });
      loadItems(); // Refresh inventory
      alert('Goods out recorded successfully!');
    } catch (error) {
      console.error('Error recording goods out:', error);
      alert('Error recording goods out. Please try again.');
    }
  };

  const columns = [
    { key: 'name', label: 'Item' },
    { 
      key: 'category', 
      label: 'Category',
      render: (_, item) => item.categoryId?.name || 'Uncategorized'
    },
    { 
      key: 'quantity', 
      label: 'Current Stock',
      render: (_, item) => (
        <span className={`${item.quantity <= (item.reorderLevel || 0) ? 'text-red-400' : 'text-white'}`}>
          {item.quantity} {item.unit}
        </span>
      )
    },
    {
      key: 'usage',
      label: 'Usage Today',
      render: (_, item) => (
        <input
          type="number"
          min="0"
          step="0.1"
          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1"
          value={usageData[item._id] || ''}
          onChange={(e) => handleUsageChange(item._id, e.target.value)}
          placeholder="0"
        />
      )
    },
    { 
      key: 'unit', 
      label: 'Unit'
    },
    {
      key: 'actions',
      label: 'Quick Actions',
      render: (_, item) => (
        <button 
          onClick={() => handleGoodsOut(item)}
          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
        >
          Goods Out
        </button>
      )
    }
  ];

  const totalItemsWithUsage = Object.values(usageData).filter(usage => usage > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-2xl font-bold">Kitchen Usage & Goods Out</h1>
        <div className="text-sm text-slate-400">
          Items with usage: {totalItemsWithUsage}
        </div>
      </div>

      {/* Instructions */}
      <Card title="📋 Instructions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded">
            <h3 className="font-semibold text-blue-400 mb-2">Daily Usage Submission</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Enter quantities used during the day</li>
              <li>• Submit at end of shift</li>
              <li>• Used for cost calculation and analytics</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded">
            <h3 className="font-semibold text-orange-400 mb-2">Goods Out</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Record items leaving kitchen immediately</li>
              <li>• Track wastage, sales, transfers</li>
              <li>• Keeps inventory accurate in real-time</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Daily Usage Submission */}
      <Card title="Daily Usage Submission">
        <form onSubmit={handleSubmitUsage} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="pt-0 sm:pt-6 w-full sm:w-auto">
              <button 
                type="submit"
                disabled={isSubmitting || totalItemsWithUsage === 0}
                className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : `Submit Usage (${totalItemsWithUsage} items)`}
              </button>
            </div>
          </div>

          <DataTable 
            data={items} 
            columns={columns}
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            searchPlaceholder="Search items..."
          />
        </form>
      </Card>

      {/* Goods Out Modal */}
      <Modal 
        isOpen={showGoodsOutModal} 
        onClose={() => {
          setShowGoodsOutModal(false);
          setSelectedItem(null);
          setGoodsOutData({
            quantity: 0,
            reason: 'kitchen-use',
            notes: ''
          });
        }}
        title={`Goods Out: ${selectedItem?.name}`}
      >
        <form onSubmit={handleSubmitGoodsOut} className="space-y-4">
          <div className="p-3 bg-slate-800 rounded">
            <div className="text-sm text-slate-400">Available Stock</div>
            <div className="text-lg font-semibold">{selectedItem?.quantity} {selectedItem?.unit}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Quantity Out</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              max={selectedItem?.quantity}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={goodsOutData.quantity}
              onChange={(e) => setGoodsOutData({...goodsOutData, quantity: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reason</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={goodsOutData.reason}
              onChange={(e) => setGoodsOutData({...goodsOutData, reason: e.target.value})}
            >
              <option value="kitchen-use">Kitchen Use</option>
              <option value="customer-order">Customer Order</option>
              <option value="wastage">Wastage/Spoiled</option>
              <option value="transfer">Transfer to Another Location</option>
              <option value="sampling">Sampling/Testing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              rows="3"
              placeholder="Additional details about goods out..."
              value={goodsOutData.notes}
              onChange={(e) => setGoodsOutData({...goodsOutData, notes: e.target.value})}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button 
              type="button"
              onClick={() => {
                setShowGoodsOutModal(false);
                setSelectedItem(null);
                setGoodsOutData({
                  quantity: 0,
                  reason: 'kitchen-use',
                  notes: ''
                });
              }}
              className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Record Goods Out
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}