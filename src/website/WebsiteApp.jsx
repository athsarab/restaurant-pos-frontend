import { useState, useEffect } from 'react';
import HeroSection from './components/HeroSection';
import MenuSection from './components/MenuSection';
import RestaurantNavbar from './components/RestaurantNavbar';
import RestaurantFooter from './components/RestaurantFooter';
import ScrollToTop from './components/ScrollToTop';
import CartModal from './components/CartModal';
import TableSelection from './components/TableSelection';
import './index.css';

function WebsiteApp() {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const [isTableLocked, setIsTableLocked] = useState(false);

  useEffect(() => {
    // Check URL for table parameter (QR code support)
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    
    if (tableParam) {
      const tableNum = parseInt(tableParam, 10);
      if (tableNum >= 1 && tableNum <= 20) {
        setTableNumber(tableNum);
        setIsTableLocked(true); // Lock table when coming from QR
        
        // Store in sessionStorage to prevent URL manipulation
        sessionStorage.setItem('qrTable', tableNum.toString());
        sessionStorage.setItem('tableLocked', 'true');
      }
    } else {
      // Check if there's a locked table in session
      const savedTable = sessionStorage.getItem('qrTable');
      const tableLocked = sessionStorage.getItem('tableLocked') === 'true';
      
      if (savedTable && tableLocked) {
        setTableNumber(parseInt(savedTable, 10));
        setIsTableLocked(true);
      } else {
        // Check if user has a saved table preference
        const userTablePreference = localStorage.getItem('website_table_preference');
        if (userTablePreference) {
          setTableNumber(parseInt(userTablePreference, 10));
          setIsTableLocked(false);
        }
        // If no table preference, user can select table via navbar
      }
    }

    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const handleOrderPlaced = () => {
    // Clear the cart after successful order
    setCart([]);
  };

  const handleTableChange = (newTableNumber) => {
    // Only allow table changes if not locked by QR code
    if (!isTableLocked) {
      setTableNumber(newTableNumber);
      // Save user's table preference
      localStorage.setItem('website_table_preference', newTableNumber.toString());
    }
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-white to-green-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg font-medium">Welcome to Restaurants By Ronan...</p>
          <p className="text-gray-600 text-sm mt-2">Setting up your dining experience</p>
          {tableNumber && (
            <p className="text-red-600 text-sm mt-1">Table {tableNumber}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RestaurantNavbar 
        cartItems={cart} 
        onCartClick={() => setIsCartOpen(true)}
        tableNumber={tableNumber}
        onTableChange={handleTableChange}
        isTableLocked={isTableLocked}
      />
      <br />
      <br />
      <main>
        <HeroSection tableNumber={tableNumber} />
        <MenuSection onAddToCart={handleAddToCart} />
      </main>
      
      <RestaurantFooter />
      <ScrollToTop />

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        tableNumber={tableNumber}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  );
}

export default WebsiteApp;