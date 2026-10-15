import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Demo component showing how to use the new inventory checking API
 * This can be integrated into order forms to preview availability
 */
export default function InventoryChecker() {
  const [items, setItems] = useState([{ menuItemId: '', qty: 1 }]);
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  // Load menu items on component mount
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const response = await api.get('/menu-items');
        setMenuItems(response.data);
      } catch (error) {
        console.error('Error loading menu items:', error);
      }
    };
    loadMenuItems();
  }, []);

  const addItem = () => {
    setItems([...items, { menuItemId: '', qty: 1 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const checkInventory = async () => {
    try {
      setLoading(true);
      setCheckResult(null);

      // Filter out empty items
      const validItems = items.filter(item => item.menuItemId && item.qty > 0);
      
      if (validItems.length === 0) {
        alert('Please add at least one menu item');
        return;
      }

      // Call the new inventory check API
      const response = await api.post('/orders/check-inventory', {
        items: validItems
      });

      setCheckResult(response.data);
    } catch (error) {
      console.error('Error checking inventory:', error);
      alert('Error checking inventory: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    try {
      setLoading(true);

      // Filter out empty items
      const validItems = items.filter(item => item.menuItemId && item.qty > 0);
      
      if (validItems.length === 0) {
        alert('Please add at least one menu item');
        return;
      }

      // Try to place the order (this will automatically deduct inventory)
      const orderData = {
        table: 'demo', // Demo table
        items: validItems.map(item => ({
          dishId: item.menuItemId,
          qty: item.qty
        }))
      };

      const response = await api.post('/orders', orderData);
      
      alert(`Order placed successfully! Order ID: ${response.data.orderId}`);
      
      // Reset form
      setItems([{ menuItemId: '', qty: 1 }]);
      setCheckResult(null);

    } catch (error) {
      console.error('Error placing order:', error);
      
      if (error.response?.data?.outOfStock) {
        // Handle out of stock error
        const outOfStockMsg = error.response.data.outOfStock
          .map(item => `${item.itemName}: Need ${item.needed}${item.unit}, Available ${item.available}${item.unit}`)
          .join('\n');
        
        alert(`Cannot place order - Out of Stock:\n\n${outOfStockMsg}`);
      } else {
        alert('Error placing order: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-slate-900 rounded-lg">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">🧪 Inventory System Demo</h2>
        <p className="text-slate-400">
          Test the new automatic inventory checking and deduction system
        </p>
      </div>

      {/* Order Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Order Items</h3>
          <button
            onClick={addItem}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            + Add Item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex space-x-3 items-center">
            <select
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
              value={item.menuItemId}
              onChange={(e) => updateItem(index, 'menuItemId', e.target.value)}
            >
              <option value="">Select menu item...</option>
              {menuItems.map(menuItem => (
                <option key={menuItem._id} value={menuItem._id}>
                  {menuItem.name} - LKR {menuItem.sellPrice || 0}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              min="1"
              className="w-20 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
            />
            
            <button
              onClick={() => removeItem(index)}
              className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={checkInventory}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : '🔍 Check Inventory'}
        </button>
        
        <button
          onClick={placeOrder}
          disabled={loading || !checkResult?.canFulfillOrder}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Placing...' : '📋 Place Order'}
        </button>
      </div>

      {/* Results */}
      {checkResult && (
        <div className="p-4 border border-slate-700 rounded">
          <h4 className="font-semibold text-white mb-3">Inventory Check Results:</h4>
          
          <div className={`p-3 rounded mb-3 ${
            checkResult.canFulfillOrder 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className={`font-medium ${
              checkResult.canFulfillOrder ? 'text-green-400' : 'text-red-400'
            }`}>
              {checkResult.canFulfillOrder ? '✅ Order can be fulfilled' : '❌ Order cannot be fulfilled'}
            </div>
            <div className="text-slate-300 text-sm mt-1">
              {checkResult.availableItems}/{checkResult.totalItems} items available
            </div>
          </div>

          {!checkResult.canFulfillOrder && checkResult.outOfStockItems && (
            <div>
              <h5 className="text-red-400 font-medium mb-2">Out of Stock Items:</h5>
              {checkResult.outOfStockItems.map((item, index) => (
                <div key={index} className="mb-2 p-2 bg-red-500/5 rounded">
                  <div className="text-white font-medium">{item.menuItemName}</div>
                  <div className="text-sm text-slate-300">
                    Requested: {item.quantityRequested} servings
                  </div>
                  <div className="text-sm text-red-400">
                    Missing ingredients:
                  </div>
                  <ul className="text-xs text-slate-400 ml-4 mt-1">
                    {item.unavailableIngredients.map((ing, idx) => (
                      <li key={idx}>
                        • {ing.itemName}: Need {ing.needed}{ing.unit}, Have {ing.available}{ing.unit} 
                        (Short: {ing.shortage}{ing.unit})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded">
        <h4 className="text-blue-400 font-medium mb-2">📋 How to Test:</h4>
        <ol className="text-slate-300 text-sm space-y-1">
          <li>1. Select menu items and quantities</li>
          <li>2. Click "Check Inventory" to preview availability</li>
          <li>3. If available, click "Place Order" to create actual order with automatic inventory deduction</li>
          <li>4. Check inventory levels in Inventory page to see real-time deduction</li>
          <li>5. Try ordering more than available stock to test out-of-stock prevention</li>
        </ol>
      </div>
    </div>
  );
}