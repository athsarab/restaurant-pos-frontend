import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import Modal from './ui/Modal';

export default function RequestForm({ isOpen, onClose, onSubmit }) {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    reason: '',
    urgency: 'normal',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  const loadItems = async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };





  const addCustomItem = () => {
    setSelectedItems([...selectedItems, { 
      type: 'custom',
      itemName: '',
      description: '',
      quantity: 1, 
      unit: '', 
      notes: '',
      estimatedCost: 0
    }]);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill unit when inventory item is selected
    if (field === 'itemId' && updated[index].type === 'inventory') {
      const selectedItem = items.find(item => item._id === value);
      if (selectedItem) {
        updated[index].unit = selectedItem.unit;
        updated[index].itemName = selectedItem.name;
      }
    }
    
    setSelectedItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      alert('Please add at least one item to request');
      return;
    }

    // Validate all items
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      if (item.type === 'inventory' && (!item.itemId || !item.quantity || item.quantity <= 0)) {
        alert(`Item ${i + 1}: Please select an inventory item and enter a valid quantity`);
        return;
      }
      if (item.type === 'custom' && (!item.itemName || !item.quantity || item.quantity <= 0)) {
        alert(`Item ${i + 1}: Please enter item name and valid quantity`);
        return;
      }
    }

    const requestData = {
      ...formData,
      items: selectedItems.filter(item => {
        if (item.type === 'inventory') {
          return item.itemId && item.quantity > 0;
        } else {
          return item.itemName && item.quantity > 0;
        }
      })
    };

    try {
      await onSubmit(requestData);
      // Reset form
      setFormData({ reason: '', urgency: 'normal', notes: '' });
      setSelectedItems([]);
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Stock Request">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Reason for Request *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Low stock, new menu item, equipment repair, cleaning supplies"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Urgency Level
            </label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              value={formData.urgency}
              onChange={(e) => setFormData({...formData, urgency: e.target.value})}
            >
              <option value="low">Low - Can wait a few days</option>
              <option value="normal">Normal - Needed this week</option>
              <option value="high">High - Needed today/tomorrow</option>
              <option value="critical">Critical - Urgent, operations affected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Additional Notes
            </label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
              rows="2"
              placeholder="Any additional information..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="border-t border-slate-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Requested Items</h3>
            <div className="flex gap-2">

              <button
                type="button"
                onClick={addCustomItem}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                Other Item
              </button>
            </div>
          </div>

          {selectedItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-sm">No items added yet</div>
              <div className="text-xs mt-1">
                Add inventory items or other items (equipment, cleaning supplies, etc.)
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((item, index) => (
                <div key={index} className={`p-4 rounded border ${
                  item.type === 'inventory' 
                    ? 'bg-blue-500/5 border-blue-500/20' 
                    : 'bg-green-500/5 border-green-500/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`text-sm font-medium ${
                      item.type === 'inventory' ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {item.type === 'inventory' ? '📦 Inventory Item' : '🔧 Other Item'}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {item.type === 'inventory' ? (
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-5">
                        <select
                          required
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                          value={item.itemId}
                          onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                        >
                          <option value="">Select Inventory Item</option>
                          {items.map(inventoryItem => (
                            <option key={inventoryItem._id} value={inventoryItem._id}>
                              {inventoryItem.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="0.1"
                          placeholder="Qty"
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Unit"
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                          value={item.unit}
                          readOnly
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                          value={item.notes}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Item Name *"
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                            value={item.itemName}
                            onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Description"
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <input
                            type="number"
                            required
                            min="0.1"
                            step="0.1"
                            placeholder="Quantity *"
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Unit"
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Est. Cost (LKR)"
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                            value={item.estimatedCost}
                            onChange={(e) => updateItem(index, 'estimatedCost', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Notes"
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                            value={item.notes}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Submit Request ({selectedItems.length} items)
          </button>
        </div>
      </form>
    </Modal>
  );
}