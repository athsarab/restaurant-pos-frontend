import { useState, useEffect } from 'react';
import HeroSection from './components/HeroSection';
import MenuSection from './components/MenuSection';
import RestaurantNavbar from './components/RestaurantNavbar';
import RestaurantFooter from './components/RestaurantFooter';
import ScrollToTop from './components/ScrollToTop';
import CartModal from './components/CartModal';

function App() {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(7); // Default table number

  useEffect(() => {
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

  const handleTableChange = (newTableNumber) => {
    setTableNumber(newTableNumber);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-white to-green-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg font-medium">Loading Restaurants By Ronan...</p>
          <p className="text-gray-600 text-sm mt-2">CRAVE INTERNATIONALLY ENJOY LOCALLY</p>
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
      />
    </div>
  );
}

export default App;