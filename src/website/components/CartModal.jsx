import { X, Minus, Plus, Receipt, User, MapPin, ChefHat, MessageSquare, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { api } from "../../lib/api";

const CartModal = ({ isOpen, onClose, cartItems, tableNumber, onUpdateQuantity, onRemoveItem, onOrderPlaced }) => {
  const [isPlacing, setIsPlacing] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
 
  const total = subtotal;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    
    setIsPlacing(true);
    try {
      // Convert cart items to order format
      const orderItems = cartItems.map(item => ({
        menuItemId: item.id, // Use the item id which is mapped from _id in MenuSection
        dishName: item.name,
        category: item.category || 'Main Dish',
        price: item.price,
        qty: item.quantity
      }));

      const orderData = {
        orderType: 'dine-in',
        table: tableNumber,
        items: orderItems,
        placedBy: 'customer', // This is a customer order from website
        customerNotes: customerNotes.trim() // Include customer notes
      };

      const response = await api.post('/orders/customer', orderData);
      
      // Success - show confirmation and clear cart
      alert(`✅ Order placed successfully!\n\nOrder ID: ${response.data.orderId}\nTable: ${tableNumber}\nTotal: LKR ${total.toFixed(2)}\n\nYour order has been sent to the kitchen. Please wait for service.`);
      
      // Clear the cart and close modal
      if (onOrderPlaced) {
        onOrderPlaced(); // This should clear the cart in parent component
      }
      onClose();
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert(`❌ Failed to place order: ${error.response?.data?.message || 'Please try again or contact staff.'}`);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] shadow-2xl animate-scale-in flex flex-col overflow-hidden">
        
        {/* Clean Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-6 h-6" />
              <h2 className="text-xl font-bold">Your Order</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Table Info */}
          <div className="bg-white/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="font-semibold">Table {tableNumber}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4" />
              <span>Guest Order</span>
            </div>
          </div>
        </div>

        {/* Cart Items - More space allocated */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 min-h-0">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400">Add some delicious items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-red-600 font-medium">LKR {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold text-gray-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">
                        LKR {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary & Actions - Reduced space */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-4 space-y-3">
            {/* Special Requests - Compact */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <label className="flex items-center text-blue-800 font-medium mb-1 text-sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Special Requests
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Any special instructions?"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm"
                rows="2"
                maxLength="500"
              />
              <div className="text-right text-xs text-blue-600 mt-1">
                {customerNotes.length}/500
              </div>
            </div>

            {/* Price Breakdown - Compact */}
            <div className="space-y-1 bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-gray-700 text-sm">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>LKR {subtotal.toFixed(2)}</span>
              </div>
 
              <div className="border-t border-gray-300 pt-1">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-red-600">LKR {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Important Notice - Compact */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 text-xs font-medium">Please review carefully</p>
                  <p className="text-amber-700 text-xs">
                    Orders cannot be modified once placed.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex space-x-2 pt-1">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-300 text-white hover:bg-gray-500 text-sm py-2"
              >
                Add More
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 text-sm"
                onClick={handlePlaceOrder}
                disabled={isPlacing || cartItems.length === 0}
              >
                <ChefHat className="w-4 h-4 mr-2" />
                {isPlacing ? 'Placing...' : 'Place Order'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;