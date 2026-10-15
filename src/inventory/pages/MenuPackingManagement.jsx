import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useDomain } from '../context/DomainContext';
import { Package, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { formatQuantity, formatPrice } from '../utils/numberUtils';

export default function MenuPackingManagement() {
  const { domain } = useDomain();
  const [menuItems, setMenuItems] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [currentPackingItems, setCurrentPackingItems] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [packingUsageReport, setPackingUsageReport] = useState([]);
  
  const [assignFormData, setAssignFormData] = useState({
    packingItemId: '',
    quantity: 1,
    notes: ''
  });

  const loadData = async () => {
    try {
      const [menuRes, packingRes, usageReportRes] = await Promise.all([
        api.get('/menu-packing/menu-items-with-packing'),
        api.get('/items?itemType=packing'),
        api.get('/menu-packing/packing-usage-report')
      ]);
      
      setMenuItems(menuRes.data);
      setPackingItems(packingRes.data);
      setPackingUsageReport(usageReportRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [domain]);

  const handleSelectMenuItem = async (menuItem) => {
    setSelectedMenuItem(menuItem);
    try {
      const response = await api.get(`/menu-packing/menu/${menuItem._id}/packing`);
      setCurrentPackingItems(response.data);
    } catch (error) {
      console.error('Error loading packing items:', error);
      setCurrentPackingItems([]);
    }
  };

  const handleAssignPacking = async (e) => {
    e.preventDefault();
    try {
      await api.post('/menu-packing/menu-packing', {
        menuItemId: selectedMenuItem._id,
        ...assignFormData
      });
      
      setShowAssignModal(false);
      setAssignFormData({
        packingItemId: '',
        quantity: 1,
        notes: ''
      });
      
      // Reload current packing items
      const response = await api.get(`/menu-packing/menu/${selectedMenuItem._id}/packing`);
      setCurrentPackingItems(response.data);
      
      // Reload all data to update totals
      loadData();
      
      alert('Packing item assigned successfully!');
    } catch (error) {
      console.error('Error assigning packing item:', error);
      alert('Error assigning packing item. Please try again.');
    }
  };

  const handleRemovePacking = async (packingAssignmentId) => {
    if (confirm('Are you sure you want to remove this packing item assignment?')) {
      try {
        await api.delete(`/menu-packing/menu-packing/${packingAssignmentId}`);
        
        // Reload current packing items
        const response = await api.get(`/menu-packing/menu/${selectedMenuItem._id}/packing`);
        setCurrentPackingItems(response.data);
        
        // Reload all data to update totals
        loadData();
        
        alert('Packing item removed successfully!');
      } catch (error) {
        console.error('Error removing packing item:', error);
        alert('Error removing packing item. Please try again.');
      }
    }
  };

  const handleUpdatePackingQuantity = async (packingAssignmentId, newQuantity) => {
    try {
      await api.put(`/menu-packing/menu-packing/${packingAssignmentId}`, {
        quantity: newQuantity
      });
      
      // Reload current packing items
      const response = await api.get(`/menu-packing/menu/${selectedMenuItem._id}/packing`);
      setCurrentPackingItems(response.data);
      
      // Reload all data to update totals
      loadData();
    } catch (error) {
      console.error('Error updating packing quantity:', error);
      alert('Error updating quantity. Please try again.');
    }
  };

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const menuColumns = [
    { key: 'name', label: 'Menu Item' },
    { 
      key: 'category', 
      label: 'Category',
      render: (_, item) => item.category || 'Other'
    },
    { 
      key: 'sellPrice', 
      label: 'Price',
      render: (_, item) => `LKR ${formatPrice(item.sellPrice || 0)}`
    },
    { 
      key: 'packingItems', 
      label: 'Packing Items',
      render: (_, item) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm">{item.packingItems?.length || 0} assigned</span>
          <button
            onClick={() => handleSelectMenuItem(item)}
            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
            title="Manage Packing"
          >
            <Package className="w-3 h-3" />
          </button>
        </div>
      )
    }
  ];

  const packingColumns = [
    { 
      key: 'packingItemId', 
      label: 'Packing Item',
      render: (_, item) => item.packingItemId?.name || 'Unknown'
    },
    { 
      key: 'quantity', 
      label: 'Quantity per Serving',
      render: (_, item) => (
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={item.quantity}
          onChange={(e) => handleUpdatePackingQuantity(item._id, parseFloat(e.target.value))}
          className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
        />
      )
    },
    { 
      key: 'unit', 
      label: 'Unit',
      render: (_, item) => item.packingItemId?.unit || 'units'
    },
    { 
      key: 'stockLevel', 
      label: 'Stock Level',
      render: (_, item) => (
        <span className={`${
          (item.packingItemId?.quantity || 0) <= (item.packingItemId?.reorderLevel || 0) 
            ? 'text-red-400' 
            : 'text-green-400'
        }`}>
          {formatQuantity(item.packingItemId?.quantity || 0)} {item.packingItemId?.unit || 'units'}
        </span>
      )
    },
    { 
      key: 'notes', 
      label: 'Notes',
      render: (_, item) => item.notes || '-'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => (
        <button
          onClick={() => handleRemovePacking(item._id)}
          className="p-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
          title="Remove"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )
    }
  ];

  const usageReportColumns = [
    { 
      key: 'packingItem', 
      label: 'Packing Item',
      render: (_, item) => item.packingItem?.name || 'Unknown'
    },
    { 
      key: 'currentStock', 
      label: 'Current Stock',
      render: (_, item) => (
        <span className={`${
          item.isLowStock ? 'text-red-400' : 'text-green-400'
        }`}>
          {formatQuantity(item.packingItem?.quantity || 0)} {item.packingItem?.unit || 'units'}
        </span>
      )
    },
    { 
      key: 'usedByMenus', 
      label: 'Used by Menu Items',
      render: (_, item) => item.usages?.length || 0
    },
    { 
      key: 'totalUsagePerOrder', 
      label: 'Usage per Order',
      render: (_, item) => `${formatQuantity(item.totalUsagePerOrder || 0)} ${item.packingItem?.unit || 'units'}`
    },
    { 
      key: 'daysOfStock', 
      label: 'Days of Stock',
      render: (_, item) => {
        if (item.daysOfStock === Infinity) return '∞';
        return `${Math.floor(item.daysOfStock || 0)} days`;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Menu Packing Management</h1>
        <button 
          onClick={loadData}
          className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-slate-400 text-sm">Total Menu Items</div>
          <div className="text-2xl font-bold">{menuItems.length}</div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Items with Packing</div>
          <div className="text-2xl font-bold text-blue-400">
            {menuItems.filter(item => item.packingItems?.length > 0).length}
          </div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Packing Items</div>
          <div className="text-2xl font-bold text-purple-400">{packingItems.length}</div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Low Stock Packing</div>
          <div className="text-2xl font-bold text-red-400">
            {packingUsageReport.filter(item => item.isLowStock).length}
          </div>
        </Card>
      </div>

      {/* Menu Items Section */}
      <Card title="Menu Items">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search menu items..."
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DataTable 
          data={filteredMenuItems} 
          columns={menuColumns}
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          searchPlaceholder="Search menu items..."
        />
      </Card>

      {/* Selected Menu Item Packing Details */}
      {selectedMenuItem && (
        <Card title={`Packing Items for: ${selectedMenuItem.name}`}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-400">
              Manage packing items required for this menu item in delivery orders
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Packing Item</span>
              </button>
              <button
                onClick={() => setSelectedMenuItem(null)}
                className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
          
          {currentPackingItems.length > 0 ? (
            <DataTable 
              data={currentPackingItems} 
              columns={packingColumns}
              defaultPageSize={10}
              pageSizeOptions={[10, 25]}
            />
          ) : (
            <div className="text-center py-8 text-slate-400">
              No packing items assigned to this menu item yet.
              <br />
              <button
                onClick={() => setShowAssignModal(true)}
                className="mt-2 text-blue-400 hover:text-blue-300 underline"
              >
                Assign the first packing item
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Packing Usage Report */}
      <Card title="Packing Items Usage Report">
        <p className="text-slate-400 mb-4">
          Overview of all packing items and their usage across menu items
        </p>
        <DataTable 
          data={packingUsageReport} 
          columns={usageReportColumns}
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          searchPlaceholder="Search packing items..."
        />
      </Card>

      {/* Assign Packing Item Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssignFormData({
            packingItemId: '',
            quantity: 1,
            notes: ''
          });
        }}
        title={`Assign Packing Item to: ${selectedMenuItem?.name}`}
      >
        <form onSubmit={handleAssignPacking} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Packing Item
            </label>
            <select
              required
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={assignFormData.packingItemId}
              onChange={(e) => setAssignFormData({
                ...assignFormData,
                packingItemId: e.target.value
              })}
            >
              <option value="">Select a packing item</option>
              {packingItems.map(item => (
                <option key={item._id} value={item._id}>
                  {item.name} ({formatQuantity(item.quantity)} {item.unit} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Quantity per Serving
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={assignFormData.quantity}
              onChange={(e) => setAssignFormData({
                ...assignFormData,
                quantity: parseFloat(e.target.value)
              })}
            />
            <div className="text-xs text-slate-400 mt-1">
              How many units of this packing item are needed per serving of the menu item
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              rows="2"
              placeholder="Any special notes about this packing requirement..."
              value={assignFormData.notes}
              onChange={(e) => setAssignFormData({
                ...assignFormData,
                notes: e.target.value
              })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowAssignModal(false);
                setAssignFormData({
                  packingItemId: '',
                  quantity: 1,
                  notes: ''
                });
              }}
              className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Assign Packing Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}