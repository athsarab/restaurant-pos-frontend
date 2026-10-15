import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import CustomerDetails from './CustomerDetails';

const OrderModal = ({ isOpen, onClose, onSubmit, menuItems = [], orderType = 'dine-in', tableNumber = null }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryCheck, setInventoryCheck] = useState(null);
  const [checkingInventory, setCheckingInventory] = useState(false);
  const [showInventoryDetails, setShowInventoryDetails] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedTable, setSelectedTable] = useState(tableNumber || 1);
  const [customerDetails, setCustomerDetails] = useState({
    customerName: '',
    customerMobile: '',
    orderType: orderType || 'dine-in'
  });

  const categories = ['all', 'Main Dish', 'Beverage', 'Dessert', 'Side Dish', 'Other'];
  const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Available tables
  
  // Update customer details when orderType prop changes
  useEffect(() => {
    setCustomerDetails(prev => ({
      ...prev,
      orderType: orderType || 'dine-in'
    }));
  }, [orderType]);
  
  // Update selected table when tableNumber prop changes
  useEffect(() => {
    if (tableNumber) {
      setSelectedTable(tableNumber);
    }
  }, [tableNumber]);

  const handleCustomerDetailsChange = (details) => {
    setCustomerDetails(details);
  };

  const handleOrderTypeChange = (newOrderType) => {
    setCustomerDetails(prev => ({
      ...prev,
      orderType: newOrderType
    }));
  };
  
  const filteredItems = (menuItems || []).filter(item => {
    if (!item || !item.name) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addItem = (menuItem) => {
    const existingItem = selectedItems.find(item => item.dishId === menuItem._id);
    
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.dishId === menuItem._id
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        dishId: menuItem._id,
        dishName: menuItem.name,
        category: menuItem.category,
        price: Number(menuItem.sellPrice) || 0,
        qty: 1
      }]);
    }
  };

  const updateQuantity = (dishId, newQty) => {
    if (newQty <= 0) {
      setSelectedItems(selectedItems.filter(item => item.dishId !== dishId));
    } else {
      setSelectedItems(selectedItems.map(item =>
        item.dishId === dishId
          ? { ...item, qty: newQty }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => total + ((item.price || 0) * (item.qty || 0)), 0);
  };

  // Check inventory availability for selected items
  const checkInventoryAvailability = async () => {
    if (selectedItems.length === 0) return;
    
    setCheckingInventory(true);
    try {
      const response = await api.post('/orders/check-inventory', {
        items: selectedItems.map(item => ({
          dishId: item.dishId,
          qty: item.qty
        }))
      });
      
      setInventoryCheck(response.data);
    } catch (error) {
      console.error('Error checking inventory:', error);
      toast.error('Failed to check inventory availability');
      setInventoryCheck(null);
    } finally {
      setCheckingInventory(false);
    }
  };

  // Check inventory whenever selected items change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedItems.length > 0) {
        checkInventoryAvailability();
      } else {
        setInventoryCheck(null);
      }
    }, 500); // Debounce API calls
    
    return () => clearTimeout(timeoutId);
  }, [selectedItems]);

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    // Check if inventory is available
    if (inventoryCheck && !inventoryCheck.canFulfillOrder) {
      toast.error('Some items are out of stock. Please check inventory details.');
      setShowInventoryDetails(true);
      return;
    }

    // Prepare order data with customer details
    const orderData = {
      items: selectedItems,
      customerNotes,
      customerDetails,
      tableNumber: customerDetails.orderType === 'dine-in' ? selectedTable : null
    };

    onSubmit(orderData);
    resetForm();
  };

  const resetForm = () => {
    setSelectedItems([]);
    setSearchTerm('');
    setSelectedCategory('all');
    setInventoryCheck(null);
    setShowInventoryDetails(false);
    setCustomerNotes('');
    setSelectedTable(1);
    setCustomerDetails({
      customerName: '',
      customerMobile: '',
      orderType: orderType || 'dine-in'
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-white">New Order</h2>
              <p className="text-slate-400 text-sm mt-1">
                {customerDetails.orderType === 'dine-in' ? (
                  <span className="text-blue-400">Dine-In Order</span>
                ) : customerDetails.orderType === 'takeaway' ? (
                  <span className="text-green-400">Takeaway Order</span>
                ) : customerDetails.orderType === 'pickme' ? (
                  <span className="text-yellow-400">PickMe Delivery</span>
                ) : customerDetails.orderType === 'uber' ? (
                  <span className="text-black bg-white px-2 py-1 rounded text-xs font-bold">Uber Eats</span>
                ) : (
                  <span className="text-orange-400">Order</span>
                )}
              </p>
            </div>
            {/* Table Selection Dropdown */}
            {customerDetails.orderType === 'dine-in' && (
              <div className="flex items-center space-x-2">
                <label className="text-slate-400 text-sm">Table:</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(parseInt(e.target.value))}
                  className="bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  disabled={!!tableNumber} // Disable if table is pre-selected
                >
                  {tableOptions.map(table => (
                    <option key={table} value={table}>
                      Table {table}
                    </option>
                  ))}
                </select>
                {tableNumber && (
                  <span className="text-xs text-slate-500">(pre-selected)</span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>



        <div className="flex h-[80vh]">
          {/* Menu Items Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Search and Filter */}
            <div className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {category === 'all' ? 'All' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="col-span-full text-xs text-slate-500 mb-2">
                  Debug: {menuItems?.length || 0} total items, {filteredItems.length} filtered items
                </div>
              )}
              
              {filteredItems.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400">
                  {menuItems?.length === 0 ? 'No menu items available' : 'No items match your search'}
                </div>
              ) : (
                filteredItems.map(item => (
                <div
                  key={item._id}
                  onClick={() => addItem(item)}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <span className="text-green-400 font-bold">LKR {Number(item.sellPrice) || 0}</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{item.category}</p>
                  {item.image && (
                    <div className="w-full h-20 bg-slate-700 rounded overflow-hidden">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Items Section */}
          <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-full">
            {/* Header - Fixed */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Selected Items</h3>
              {checkingInventory && (
                <div className="text-xs text-yellow-400 flex items-center">
                  <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full mr-1"></div>
                  Checking...
                </div>
              )}
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {/* Inventory Status Alert */}
              {inventoryCheck && selectedItems.length > 0 && (
                <div className={`mb-4 p-3 rounded text-xs ${
                  inventoryCheck.canFulfillOrder 
                    ? 'bg-green-900/50 border border-green-500 text-green-300'
                    : 'bg-red-900/50 border border-red-500 text-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {inventoryCheck.canFulfillOrder ? (
                        <CheckCircle size={14} className="mr-1" />
                      ) : (
                        <AlertTriangle size={14} className="mr-1" />
                      )}
                      <span>
                        {inventoryCheck.canFulfillOrder 
                          ? 'All items available' 
                          : `${inventoryCheck.unavailableItems} item(s) out of stock`}
                      </span>
                    </div>
                    {!inventoryCheck.canFulfillOrder && (
                      <button
                        onClick={() => setShowInventoryDetails(!showInventoryDetails)}
                        className="text-red-400 hover:text-red-300 underline text-xs"
                      >
                        {showInventoryDetails ? 'Hide' : 'Details'}
                      </button>
                    )}
                  </div>
                  
                  {/* Inventory Details */}
                  {showInventoryDetails && !inventoryCheck.canFulfillOrder && (
                    <div className="mt-2 space-y-1 text-xs">
                      {inventoryCheck.outOfStockItems?.map((item, idx) => (
                        <div key={idx} className="bg-red-800/30 p-2 rounded">
                          <div className="font-medium">{item.menuItemName}</div>
                          <div className="text-red-400">
                            Missing ingredients:
                          </div>
                          {item.unavailableIngredients?.map((ing, ingIdx) => (
                            <div key={ingIdx} className="ml-2 text-red-300">
                              • {ing.itemName}: Need {ing.needed}{ing.unit}, have {ing.available}{ing.unit}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {selectedItems.length === 0 ? (
                <p className="text-slate-500 text-center mt-8">No items selected</p>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map(item => {
                    // Check if this item is available
                    const itemStatus = inventoryCheck?.itemDetails?.find(
                      detail => detail.menuItemId === item.menuItemId
                    );
                    const isAvailable = itemStatus?.available !== false;
                    
                    return (
                      <div key={item.dishId} className={`p-3 rounded border ${
                        isAvailable 
                          ? 'bg-slate-700 border-slate-600' 
                          : 'bg-red-900/20 border-red-500/50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <h4 className="font-medium text-white text-sm mr-2">{item.dishName}</h4>
                            {!isAvailable && (
                              <AlertTriangle size={12} className="text-red-400" />
                            )}
                          </div>
                          <button
                            onClick={() => updateQuantity(item.dishId, 0)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.dishId, item.qty - 1)}
                              className="bg-slate-600 text-white w-6 h-6 rounded text-sm hover:bg-slate-500"
                            >
                              -
                            </button>
                            <span className="text-white w-8 text-center">{item.qty}</span>
                            <button
                              onClick={() => updateQuantity(item.dishId, item.qty + 1)}
                              className="bg-slate-600 text-white w-6 h-6 rounded text-sm hover:bg-slate-500"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-green-400 font-medium">
                            LKR {((item.price || 0) * (item.qty || 0)).toFixed(2)}
                          </span>
                        </div>
                        {!isAvailable && (
                          <div className="mt-1 text-xs text-red-400">
                            Insufficient inventory
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

{/* Scrollable Bottom Section - Total, Notes, and Place Order Button */}
{selectedItems.length > 0 && (
  <div className="border-t border-slate-700 bg-slate-800 px-4 py-3 max-h-[40vh] overflow-y-auto">
    {/* Total */}
    <div className="flex justify-between items-center text-base font-semibold text-white mb-3">
      <span>Total:</span>
      <span className="text-green-400">LKR {getTotalAmount().toFixed(2)}</span>
    </div>

    {/* Customer Notes */}
    <div className="mb-3">
      <label className="flex items-center text-xs font-medium text-blue-300 mb-1">
        <MessageSquare className="w-4 h-4 mr-1" />
        Special Requests (Optional)
      </label>
      <textarea
        value={customerNotes}
        onChange={(e) => setCustomerNotes(e.target.value)}
        placeholder="Any special requests? (e.g., no onions, extra spicy, etc.)"
        className="w-full px-2 py-1.5 rounded-md border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
        rows="2"
        maxLength="500"
      />
      <div className="text-[11px] text-slate-400 mt-0.5 text-right">
        {customerNotes.length}/500
      </div>
    </div>
    {/* Customer Details Section */}
<div className=" border-b border-slate-700">
  <CustomerDetails
    customerDetails={customerDetails}
    onDetailsChange={handleCustomerDetailsChange}
    orderType={customerDetails.orderType}
    onOrderTypeChange={handleOrderTypeChange}
  />
</div>
    {/* Submit Button */}
    <button
      onClick={handleSubmit}
      disabled={inventoryCheck && !inventoryCheck.canFulfillOrder}
      className={`w-full py-2.5 rounded-md font-medium transition-colors text-sm ${
        inventoryCheck && !inventoryCheck.canFulfillOrder
          ? 'bg-red-600/50 text-red-300 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {inventoryCheck && !inventoryCheck.canFulfillOrder
        ? 'Cannot Place Order - Out of Stock'
        : 'Place Order'}
    </button>

  </div>
)}


</div>
          
        </div>

      </div>
    </div>
  );
};

export default OrderModal;