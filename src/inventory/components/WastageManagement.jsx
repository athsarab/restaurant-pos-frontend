import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { convertUnit, getCompatibleUnits, formatUnit } from '../utils/unitConversion';
import { formatQuantity, formatPrice } from '../utils/numberUtils';
import { useAuth } from '../hooks/useAuth';
import {
  TrashIcon,
  CalendarIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const WastageManagement = () => {
  const { user } = useAuth();
  const [wastageEntries, setWastageEntries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'add', 'details', 'analytics'
  const [wastageType, setWastageType] = useState('inventory'); // 'inventory' or 'menu'
  const [newWastage, setNewWastage] = useState({
    type: 'inventory', // 'inventory' or 'menu'
    itemId: '',
    itemName: '',
    quantity: '',
    unit: 'kg',
    pricePerKg: '',
    notes: '',
    reason: 'expired'
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchWastageData();
      fetchInventoryItems();
      fetchMenuItems();
    }
  }, [user]);

  const fetchWastageData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wastage');
      setWastageEntries(response.data.wastage || []);
      setTodayTotal(response.data.todayTotal || 0);
    } catch (error) {
      console.error('Error fetching wastage data:', error);
      toast.error('Failed to load wastage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await api.get('/items');
      setInventoryItems(response.data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu-items');
      setMenuItems(response.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  // Handle item selection
  const handleItemSelection = (itemId, type) => {
    let item = null;
    
    if (type === 'inventory') {
      item = inventoryItems.find(i => i._id === itemId);
      if (item) {
        // Get compatible units for the selected inventory item
        const compatibleUnits = getCompatibleUnits(item.unit);
        setAvailableUnits([item.unit, ...compatibleUnits.filter(u => u !== item.unit)]);
        
        setNewWastage({
          ...newWastage,
          type: 'inventory',
          itemId: item._id,
          itemName: item.name,
          unit: item.unit
        });
        setSelectedItem(item);
      }
    } else if (type === 'menu') {
      item = menuItems.find(i => i._id === itemId);
      if (item) {
        // For menu items, use pieces as default unit
        setAvailableUnits(['pieces', 'pcs', 'each', 'unit']);
        
        setNewWastage({
          ...newWastage,
          type: 'menu',
          itemId: item._id,
          itemName: item.name,
          unit: 'pieces'
        });
        setSelectedItem(item);
      }
    }
  };

  // Handle wastage type change
  const handleWastageTypeChange = (type) => {
    setWastageType(type);
    setNewWastage({
      ...newWastage,
      type,
      itemId: '',
      itemName: '',
      unit: type === 'inventory' ? 'kg' : 'pieces'
    });
    setSelectedItem(null);
    setAvailableUnits([]);
  };

  const handleAddWastage = async (e) => {
    e.preventDefault();
    
    if (!newWastage.itemId || !newWastage.quantity) {
      toast.error('Please select an item and enter quantity');
      return;
    }

    // Validate quantity for inventory items with unit conversion
    if (newWastage.type === 'inventory' && selectedItem) {
      try {
        const wastageQty = parseFloat(newWastage.quantity);
        const stockQty = selectedItem.quantity;
        const wastageUnit = newWastage.unit;
        const stockUnit = selectedItem.unit;

        // Convert wastage quantity to stock unit for comparison
        const wastageInStockUnit = convertUnit(wastageQty, wastageUnit, stockUnit);
        
        if (wastageInStockUnit > stockQty) {
          toast.error(`Wastage quantity (${formatQuantity(wastageInStockUnit)} ${stockUnit}) exceeds available stock (${formatQuantity(stockQty)} ${stockUnit})`);
          return;
        }
      } catch (conversionError) {
        toast.error(`Unit conversion error: ${conversionError.message}`);
        return;
      }
    }

    try {
      const wastageData = {
        type: newWastage.type,
        itemId: newWastage.itemId,
        itemName: newWastage.itemName,
        quantity: parseFloat(newWastage.quantity),
        unit: newWastage.unit,
        pricePerKg: parseFloat(newWastage.pricePerKg) || 0,
        notes: newWastage.notes,
        reason: newWastage.reason
      };

      await api.post('/wastage', wastageData);
      
      toast.success(`${newWastage.type === 'inventory' ? 'Inventory' : 'Menu'} item wastage recorded successfully`);
      
      // Reset form
      setNewWastage({
        type: 'inventory',
        itemId: '',
        itemName: '',
        quantity: '',
        unit: 'kg',
        pricePerKg: '',
        notes: '',
        reason: 'expired'
      });
      setSelectedItem(null);
      setAvailableUnits([]);
      setShowAddForm(false);
      
      // Refresh data
      fetchWastageData();
      fetchInventoryItems();
      fetchMenuItems();
    } catch (error) {
      console.error('Error adding wastage:', error);
      const errorMessage = error.response?.data?.message || 'Failed to record wastage';
      toast.error(errorMessage);
    }
  };

  const handleDeleteWastage = async (wastageId) => {
    if (!confirm('Are you sure you want to delete this wastage entry?')) {
      return;
    }

    try {
      await api.delete(`/wastage/${wastageId}`);
      toast.success('Wastage entry deleted');
      fetchWastageData();
    } catch (error) {
      console.error('Error deleting wastage:', error);
      toast.error('Failed to delete wastage entry');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading wastage data...</div>
      </div>
    );
  }

  // Check if user is admin (after all hooks have been called)
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">Only administrators can access wastage management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header with Tabs */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <TrashIcon className="w-8 h-8 text-red-400" />
                Wastage Management
              </h1>
              <p className="text-slate-400 mt-1">Track daily wastage and manage garbage sales</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <ScaleIcon className="w-5 h-5 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Add Wastage
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <DocumentTextIcon className="w-5 h-5 inline mr-2" />
                Wastage Details
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <ChartBarIcon className="w-5 h-5 inline mr-2" />
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Today's Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800 p-4 rounded-lg border border-red-500">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-8 h-8 text-red-400" />
                  <div>
                    <h3 className="text-white font-semibold">Today's Date</h3>
                    <p className="text-slate-300">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-lg border border-yellow-500">
                <div className="flex items-center gap-3">
                  <ScaleIcon className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="text-white font-semibold">Today's Wastage</h3>
                    <p className="text-slate-300">{formatQuantity(todayTotal)} kg</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-lg border border-red-600">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="w-8 h-8 text-red-400" />
                  <div>
                    <h3 className="text-white font-semibold">Value Lost Today</h3>
                    <p className="text-slate-300">
                      LKR {formatPrice(wastageEntries
                        .filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString())
                        .reduce((sum, entry) => sum + (entry.valueLost || (entry.quantity * entry.pricePerKg) || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg border border-green-500">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
                  <div>
                    <h3 className="text-white font-semibold">Potential Revenue</h3>
                    <p className="text-slate-300">
                      LKR {formatPrice(wastageEntries
                        .filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString())
                        .reduce((sum, entry) => sum + (entry.quantity * entry.pricePerKg), 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Wastage Entries */}
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">Recent Wastage Entries</h2>
              </div>
              
              {wastageEntries.slice(0, 5).length === 0 ? (
                <div className="p-8 text-center">
                  <TrashIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No wastage entries found</p>
                  <p className="text-slate-500 text-sm">Add your first wastage entry to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Value Lost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {wastageEntries.slice(0, 5).map((entry) => (
                        <tr key={entry._id} className="hover:bg-slate-700">
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {new Date(entry.createdAt).toLocaleDateString()}<br />
                            <span className="text-xs text-slate-400">
                              {new Date(entry.createdAt).toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.type === 'inventory' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {entry.type === 'inventory' ? 'Inventory' : 'Menu Item'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white font-medium">
                            {entry.itemName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {formatQuantity(entry.quantity)} {formatUnit(entry.unit)}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-400 font-medium">
                            {entry.valueLost ? (
                              `LKR ${formatPrice(entry.valueLost)}`
                            ) : (
                              `LKR ${formatPrice((entry.quantity || 0) * (entry.pricePerKg || 0))}`
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'add' && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Wastage Entry</h2>
            
            {/* Wastage Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Wastage Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleWastageTypeChange('inventory')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    newWastage.type === 'inventory'
                      ? 'border-red-500 bg-red-500/20 text-white'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <ArchiveBoxIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-semibold">Inventory Items</div>
                    <div className="text-sm text-slate-400">Raw materials, ingredients</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleWastageTypeChange('menu')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    newWastage.type === 'menu'
                      ? 'border-red-500 bg-red-500/20 text-white'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <BeakerIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-center">
                    <div className="font-semibold">Menu Items</div>
                    <div className="text-sm text-slate-400">Prepared food items</div>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddWastage} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select {newWastage.type === 'inventory' ? 'Inventory' : 'Menu'} Item *
                </label>
                <select
                  value={newWastage.itemId}
                  onChange={(e) => handleItemSelection(e.target.value, newWastage.type)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  required
                >
                  <option value="">Choose an item...</option>
                  {(newWastage.type === 'inventory' ? inventoryItems : menuItems).map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} {newWastage.type === 'inventory' && `(Available: ${formatQuantity(item.quantity)} ${item.unit})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Item Info */}
              {selectedItem && (
                <div className="md:col-span-2 p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <h4 className="text-white font-medium mb-2">Selected Item Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <div className="text-white font-medium">{selectedItem.name}</div>
                    </div>
                    {newWastage.type === 'inventory' && (
                      <>
                        <div>
                          <span className="text-slate-400">Available:</span>
                          <div className="text-white font-medium">{formatQuantity(selectedItem.quantity)} {selectedItem.unit}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Unit Price:</span>
                          <div className="text-white font-medium">LKR {selectedItem.price}</div>
                        </div>
                      </>
                    )}
                    {newWastage.type === 'menu' && (
                      <>
                        <div>
                          <span className="text-slate-400">Category:</span>
                          <div className="text-white font-medium">{selectedItem.category}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Sell Price:</span>
                          <div className="text-white font-medium">LKR {selectedItem.sellPrice}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wastage Quantity * ({formatUnit(newWastage.unit)})
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={newWastage.quantity}
                  onChange={(e) => setNewWastage({...newWastage, quantity: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  placeholder="Enter quantity"
                  required
                />
                {newWastage.type === 'inventory' && selectedItem && (
                  <p className="text-xs text-slate-400 mt-1">
                    Maximum available: {formatQuantity(selectedItem.quantity)} {selectedItem.unit}
                  </p>
                )}
              </div>
              
              {/* Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Unit
                </label>
                <select
                  value={newWastage.unit}
                  onChange={(e) => setNewWastage({...newWastage, unit: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  disabled={!selectedItem}
                >
                  {availableUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {formatUnit(unit)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wastage Reason *
                </label>
                <select
                  value={newWastage.reason}
                  onChange={(e) => setNewWastage({...newWastage, reason: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  required
                >
                  <option value="expired">Expired</option>
                  <option value="spoiled">Spoiled</option>
                  <option value="damaged">Damaged</option>
                  <option value="overcooked">Overcooked</option>
                  <option value="customer_return">Customer Return</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {/* Price per kg (optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Price per Kg (LKR) - Optional
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newWastage.pricePerKg}
                  onChange={(e) => setNewWastage({...newWastage, pricePerKg: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  placeholder="Price garbage collectors pay"
                />
              </div>
              
              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={newWastage.notes}
                  onChange={(e) => setNewWastage({...newWastage, notes: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  rows="3"
                  placeholder="Additional notes (optional)"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={!selectedItem || !newWastage.quantity}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  Record Wastage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedItem(null);
                    setNewWastage({
                      type: 'inventory',
                      itemId: '',
                      itemName: '',
                      quantity: '',
                      unit: 'kg',
                      pricePerKg: '',
                      notes: '',
                      reason: 'expired'
                    });
                  }}
                  className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">All Wastage Entries</h2>
              <p className="text-slate-400 text-sm mt-1">Complete history of all wastage records</p>
            </div>
            
            {wastageEntries.length === 0 ? (
              <div className="p-8 text-center">
                <TrashIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No wastage entries found</p>
                <p className="text-slate-500 text-sm">Add your first wastage entry to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Value Lost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {wastageEntries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-slate-700">
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {new Date(entry.createdAt).toLocaleDateString()}<br />
                          <span className="text-xs text-slate-400">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === 'inventory' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {entry.type === 'inventory' ? 'Inventory' : 'Menu Item'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {entry.itemName}
                          {entry.type === 'menu' && entry.inventoryDeduction && (
                            <div className="text-xs text-slate-400 mt-1">
                              Affected {entry.inventoryDeduction.length} inventory items
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {formatQuantity(entry.quantity)} {formatUnit(entry.unit)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.reason === 'expired' ? 'bg-red-500/20 text-red-400' :
                            entry.reason === 'spoiled' ? 'bg-orange-500/20 text-orange-400' :
                            entry.reason === 'damaged' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {entry.reason?.charAt(0).toUpperCase() + entry.reason?.slice(1).replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-red-400 font-medium">
                          {entry.valueLost ? (
                            `LKR ${formatPrice(entry.valueLost)}`
                          ) : (
                            `LKR ${formatPrice((entry.quantity || 0) * (entry.pricePerKg || 0))}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {entry.notes || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDeleteWastage(entry._id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete entry"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2">Total Entries</h3>
                <p className="text-3xl font-bold text-blue-400">{wastageEntries.length}</p>
                <p className="text-slate-400 text-sm mt-1">All time wastage records</p>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2">Total Value Lost</h3>
                <p className="text-3xl font-bold text-red-400">
                  LKR {wastageEntries.reduce((sum, entry) => 
                    sum + (entry.valueLost || (entry.quantity * entry.pricePerKg) || 0), 0
                  ).toFixed(2)}
                </p>
                <p className="text-slate-400 text-sm mt-1">Total cost of wastage</p>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2">This Month</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {wastageEntries.filter(entry => {
                    const entryDate = new Date(entry.createdAt);
                    const now = new Date();
                    return entryDate.getMonth() === now.getMonth() && 
                           entryDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-slate-400 text-sm mt-1">Entries this month</p>
              </div>
            </div>

            {/* Wastage by Type */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Wastage by Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Inventory Items</h4>
                  <p className="text-2xl font-bold text-white">
                    {wastageEntries.filter(entry => entry.type === 'inventory').length}
                  </p>
                  <p className="text-slate-400 text-sm">Raw materials & ingredients</p>
                </div>
                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-purple-400 font-medium mb-2">Menu Items</h4>
                  <p className="text-2xl font-bold text-white">
                    {wastageEntries.filter(entry => entry.type === 'menu').length}
                  </p>
                  <p className="text-slate-400 text-sm">Prepared food items</p>
                </div>
              </div>
            </div>

            {/* Top Wasted Items */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Most Wasted Items</h3>
              <div className="space-y-3">
                {Object.values(
                  wastageEntries.reduce((acc, entry) => {
                    const key = entry.itemName;
                    if (!acc[key]) {
                      acc[key] = {
                        name: entry.itemName,
                        type: entry.type,
                        count: 0,
                        totalValue: 0
                      };
                    }
                    acc[key].count += 1;
                    acc[key].totalValue += entry.valueLost || (entry.quantity * entry.pricePerKg) || 0;
                    return acc;
                  }, {})
                )
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, 5)
                .map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono text-sm">#{index + 1}</span>
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-slate-400 text-sm">
                          {item.count} entries • {item.type === 'inventory' ? 'Inventory' : 'Menu Item'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold">LKR {item.totalValue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WastageManagement;