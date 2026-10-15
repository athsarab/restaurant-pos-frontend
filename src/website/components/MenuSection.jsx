import { useState, useEffect } from "react";
import { Plus, Star, Flame, Award, ChefHat, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "../../inventory/services/api";
import { getImageUrlWithFallback } from "../../utils/imageUtils";

// Static fallback data in case API fails
const fallbackMenuItems = [
  { 
    id: "1",
    name: "Sunflower Rye Sourdough Black Bread",
    description: "Sunflower Rye Sourdough, cherished in Germany and Scandinavia, blends rye flour with sunflower seeds, creating a nutty, dense, and moist loaf.",
    price: 18.99,
    image: "/pic_1.jpg",
    category: "Pastries and bakery",
    popular: true,
    traditional: true
  },
  {
    id: "2", 
    name: "Russian Black Bread",
    description: "Russian Black Bread, crafted with rye, molasses, caraway, and fennel, offers a dense, chewy texture and timeless, hearty flavor.",
    price: 16.99,
    image: "/pic_2.jpg",
    category: "Pastries and bakery",
    spicy: true,
    popular: true
  },
  {
    id: "3",
    name: "Rainbow Sugar Cookies",
    description: "The Rainbow cake is a colourful pretty cake that resembling a rainbow is multi layeredand usually flavoured with vanilla.",
    price: 22.99,
    image: "/Pic_3.jpg",
    category: "Pastries and bakery",
    premium: true
  },
  {
    id: "4",
    name: "Hungarian Kalacs",
    description: "Hungarian Kalacs is usually a braided dish consisting of a soft sweet brioche like bread made from enriched dough.",
    price: 8.99,
    image: "/Pic_4.jpg",
    category: "Pastries and bakery",
    traditional: true
  },
  {
    id: "5",
    name: "Langos Bread",
    description: "Golden fried flatbread, brushed with garlic butter and topped with cheese or sour cream, Hungarian Lángos is indulgent street food bliss.",
    price: 17.99,
    image: "/Pic_5.jpg",
    category: "Pastries and bakery",
    spicy: true,
    traditional: true
  },
  {
    id: "6",
    name: "Potato Bread",
    description: "Soft, hearty potato bread with a rustic crust—moist, fluffy inside and perfect for pairing with soups, stews, or spreads.",
    price: 12.99,
    image: "/Pic_6.jpg",
    category: "Pastries and bakery",
    popular: true
  },
  {
    id: "7",
    name: "Russian Pirozhki",
    description: "The Traditional Russian Pirozhki is a delicious comfort food that is made from leavened yest and filled with a variety of meat, fish, eggs, rice, cabbage or fruit.",
    price: 15.99,
    image: "/Pic_7.jpg",
    category: "Pastries and bakery",
    traditional: true
  },
  {
    id: "8",
    name: "Wheat Bread",
    description: "The German style alkaline water whole wheat bread is unique among bread as it combines whole wheat and low fat texture making it a low calories food.",
    price: 9.99,
    image: "/Pic_8.jpg",
    category: "Pastries and bakery",
    premium: true
  },
    {
    id: "9",
    name: "Best Gluten-Free Bread",
    description: "Best Gluten Free Bread is one of a kind that is a soft chewy open crumb bread that has a delicious caramelized crust.",
    price: 9.99,
    image: "/Pic_9.jpg",
    category: "Pastries and bakery",
    premium: true
  },
    {
    id: "10",
    name: "Hungarian Pogasca",
    description: "Hungarian Pogácsa, soft biscuits flavored with cheese or bacon, grace gatherings from bars to boardrooms—beloved, versatile, and endlessly comforting.",
    price: 9.99,
    image: "/Pic_10.jpg",
    category: "Pastries and bakery",
    premium: true
  },
 

];

const MenuSection = ({ onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingItems, setLoadingItems] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load menu items from API
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setLoading(true);
        const response = await api.get('/public/menu');
        const items = response.data.map(item => ({
          id: item._id,
          name: item.name,
          subname: item.subname || '', // Add subname support
          description: item.description || '',
          price: item.sellPrice || 0, // Use sellPrice as the display price
          costPrice: item.totalCost || 0, // Keep cost price for reference
          image: getImageUrlWithFallback(item.image),
          category: item.category || 'Other',
          portionSize: item.portionSize,
          servings: item.servings,
          isOutOfStock: item.isOutOfStock || false,
          stockMessage: item.stockMessage || '',
          // Map category to match the existing filter structure
          categoryDisplay: mapCategoryForDisplay(item.category)
        }));
        setMenuItems(items.filter(item => item.price > 0)); // Only show items with sell price
      } catch (error) {
        console.error('Error loading menu items:', error);
        // Use static fallback data if API fails
        setMenuItems(fallbackMenuItems);
        toast({
          title: "Using demo menu",
          description: "Connected to live menu database failed. Showing demo items.",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  // Map backend categories to display categories
  const mapCategoryForDisplay = (category) => {
    const categoryMap = {
      'Main Dish': 'Mains',
      'Beverage': 'Beverages',
      'Bakery': 'Bakery',
      'Side Dish': 'Sides',
      'Other': 'Other',
      'Pancakes - Savory': 'Pancakes - Savory',
      'Pancakes - Sweets': 'Pancakes - Sweets'
    };
    return categoryMap[category] || category;
  };

  const categories = ["All", "Salads", "Soups", "Mains", "Pancakes - Savory", "Pancakes - Sweets", "Bakery", "Beverages"];
  
  // Define the order for displaying items when "All" is selected
  const categoryOrder = ["Salads", "Soups", "Mains", "Pancakes - Savory", "Pancakes - Sweets", "Bakery", "Beverages"];
  
  const filteredItems = selectedCategory === "All" 
    ? menuItems.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.categoryDisplay);
        const indexB = categoryOrder.indexOf(b.categoryDisplay);
        // If category not found in order, put it at the end
        const orderA = indexA === -1 ? categoryOrder.length : indexA;
        const orderB = indexB === -1 ? categoryOrder.length : indexB;
        return orderA - orderB;
      })
    : menuItems.filter(item => item.categoryDisplay === selectedCategory);

  const handleAddToCart = async (item) => {
    // Prevent adding out of stock items
    if (item.isOutOfStock) {
      toast({
        title: "Item Unavailable",
        description: `${item.name} is currently out of stock (below reorder level).`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setLoadingItems(prev => ({ ...prev, [item.id]: true }));
    
    // Simulate loading for better UX
    setTimeout(() => {
      onAddToCart?.(item);
      toast({
        title: "Added to cart!",
        description: `LKR ${item.price.toFixed(2)} - ${item.name} has been added to your order.`,
        duration: 2000,
      });
      setLoadingItems(prev => ({ ...prev, [item.id]: false }));
    }, 500);
  };

  return (
    <section id="menu" className="py-16 md:py-20 bg-gradient-dark">
      <div className="container mx-auto px-4">
        {/* Professional Dark Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
<div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6 animate-float shadow-glow">
  <img 
    src="/Logo.png" 
    alt="Logo" 
    className="w-14 h-14 object-contain" 
  />
</div>
          
          <h2 className="text-section mb-4 text-white">
            Our <span className="text-gradient-primary">Hungarian</span> Menu
          </h2>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Authentic Hungarian cuisine crafted with traditional recipes and the finest ingredients, 
            bringing you the true taste of Budapest , Hungary.
          </p>
          
          <div className="flex items-center justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse-gentle"></div>
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse-gentle animate-delay-100"></div>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse-gentle animate-delay-200"></div>
          </div>
        </div>

        {/* Professional Dark Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12 animate-fade-in-up animate-delay-200">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 text-sm md:text-base font-medium transition-smooth hover-scale Rs. {
                selectedCategory === category
                  ? "btn-primary shadow-glow"
                  : ""
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="text-gray-400">Loading our delicious menu...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Professional Dark Menu Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No menu items found for this category.</p>
                <p className="text-gray-500 text-sm mt-2">Please check back later or select a different category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredItems.map((item, index) => (
            <div 
              key={item.id} 
              className={`group animate-fade-in-up animate-delay-${Math.min(index * 100 + 100, 400)} transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}
            >
              {/* Seamless Card Container */}
              <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl overflow-hidden shadow-xl border border-neutral-700/50 hover:border-red-500/30 transition-all duration-300">
              {/* Professional Dark Image Container */}
              <div className="relative overflow-hidden h-48 md:h-56 cursor-pointer group"
                   onClick={() => setSelectedImage(item)}>
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                
                {/* Fallback design if image fails */}
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 items-center justify-center transition-smooth group-hover:scale-110 hidden"
                >
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow group-hover:shadow-red-500/50 transition-shadow">
                      <span className="text-white text-2xl font-bold">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                      Culinary Excellence
                    </p>
                  </div>
                </div>

                {/* Image overlay with view icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                {/* Professional Dark Badges */}
                <div className="absolute top-3 left-3 flex flex-col space-y-2">
                  {item.isOutOfStock && (
                    <Badge className="bg-red-600 text-white border-0 shadow-md animate-pulse">
                      <X className="w-3 h-3 mr-1" />
                      {item.stockMessage}
                    </Badge>
                  )}
                  {!item.isOutOfStock && item.popular && (
                    <Badge className="badge-primary shadow-glow">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Popular
                    </Badge>
                  )}
                  {!item.isOutOfStock && item.traditional && (
                    <Badge className="badge-secondary">
                      <Award className="w-3 h-3 mr-1" />
                      Traditional
                    </Badge>
                  )}
                </div>
                
                <div className="absolute top-3 right-3 flex flex-col space-y-2">
                  {item.spicy && (
                    <Badge className="bg-red-500 text-white border-0 shadow-md">
                      <Flame className="w-3 h-3 mr-1" />
                      Spicy
                    </Badge>
                  )}
                  {item.premium && (
                    <Badge className="bg-yellow-600 text-white border-0 shadow-md">
                      Premium
                    </Badge>
                  )}
                </div>
              </div>

              {/* Professional Dark Content - Seamless Design */}
              <div className="p-6 bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-b-2xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-smooth">
                      {item.name}
                    </h3>
                    {item.subname && (
                      <p className="text-sm font-medium text-blue-400 mt-1 italic">
                        {item.subname}
                      </p>
                    )}
                  </div>
                  <p className="text-xl font-bold text-red-400 ml-4">
                    Rs. {item.price}
                  </p>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-6 line-clamp-3">
                  {item.description}
                </p>
{/*
                <Button
                  onClick={() => handleAddToCart(item)}
                  disabled={loadingItems[item.id] || item.isOutOfStock}
                  className={`w-full group transition-all duration-300 font-semibold ${
                    item.isOutOfStock 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50 hover:bg-gray-700' 
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/30 hover:scale-[1.02]'
                  }`}
                >
                  {item.isOutOfStock ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Out of Stock
                    </>
                  ) : loadingItems[item.id] ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                      Add to Order
                    </>
                  )}
                </Button>
                */}
              </div>
              </div>
            </div>
                ))}
              </div>
            )}
        </>
        )}        {/* Professional Dark Call to Action */}
        <div className="text-center mt-16 animate-fade-in-up animate-delay-400">
          <div className="glass-card-light rounded-2xl p-8 max-w-2xl mx-auto border border-gray-700 hover-glow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-full mb-4 shadow-glow">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Hungry for more Hungarian flavors?
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Our chefs are happy to prepare any dish according to your preferences or dietary requirements.
              Ask about our daily specials and seasonal Hungarian delicacies!
            </p>
            <Button className="btn-secondary hover-scale hover-glow">
              Speak to Our Chef
            </Button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <div className="relative">
              <img 
                src={selectedImage.image} 
                alt={selectedImage.name}
                className="w-full h-auto max-h-[70vh] object-cover"
              />
              
              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedImage.name}</h3>
                    {selectedImage.subname && (
                      <p className="text-lg font-medium text-blue-400 mb-2 italic">{selectedImage.subname}</p>
                    )}
                    <p className="text-gray-300 text-sm max-w-2xl">{selectedImage.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">Rs. {selectedImage.price}</p>
                    <Button
                      onClick={() => {
                        handleAddToCart(selectedImage);
                        setSelectedImage(null);
                      }}
                      className="btn-primary mt-2 hover-glow"
                      disabled={loadingItems[selectedImage.id]}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Order
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MenuSection;