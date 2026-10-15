import { useState } from "react";
import RestaurantNavbar from "@/components/RestaurantNavbar";
import HeroSection from "@/components/HeroSection";
import MenuSection from "@/components/MenuSection";
import RestaurantFooter from "@/components/RestaurantFooter";
import ScrollToTop from "@/components/ScrollToTop";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const handleAddToCart = (item: any) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const handleCartClick = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some delicious items to your cart first!",
        duration: 2000,
      });
    } else {
      toast({
        title: "Order Summary",
        description: `You have LKR{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items in your cart.`,
        duration: 3000,
      });
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <RestaurantNavbar cartCount={cartCount} onCartClick={handleCartClick} />
      <HeroSection />
      <MenuSection onAddToCart={handleAddToCart} />
      <RestaurantFooter />
      <ScrollToTop />
    </div>
  );
};

export default Index;