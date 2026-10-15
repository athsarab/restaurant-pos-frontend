import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart, Phone, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RestaurantNavbar = ({ cartItems = [], onCartClick, tableNumber, isTableLocked = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const cartItemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-smooth LKR{
      isScrolled 
        ? 'bg-neutral-900 backdrop-blur-md border-b border-gray-800' 
        : 'bg-black/30 backdrop-blur-md border-b border-gray-800/50'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Professional Dark Logo & Brand */}
          <div className="flex items-center space-x-3 animate-slide-in-left">
            <div className="relative">
              <img 
                src="/Logo W.png" 
                alt="WOW Restaurant Logo" 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-glow hover-scale transition-smooth"
              />
              <div className="absolute -inset-1 bg-red-600/30 rounded-full blur-md -z-10 animate-pulse-gentle"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg md:text-xl text-white">
                Restaurants By Ronan
              </h1>
              <p className="text-xs text-red-400">
                CRAVE INTERNATIONALLY ENJOY LOCALLY
                
              </p>
            </div>
          </div>

          {/* Mobile Table Selection - Always Visible */}
          <div className="md:hidden flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableDropdown(!showTableDropdown)}
              className="flex items-center space-x-1 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:border-red-500 transition-smooth"
            >
              <Users className="w-3 h-3" />
              <span className="text-xs">T{tableNumber}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>

          {/* Professional Dark Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => scrollToSection('menu')}
              className="font-medium text-gray-300 hover:text-red-400 transition-smooth hover-scale hover-glow"
            >
              Menu
            </button>
            <a 
              href="/inventory"
              className="font-medium text-gray-400 hover:text-blue-400 transition-smooth hover-scale hover-glow text-sm"
            >
              Staff Portal
            </a>

            {/* Professional Dark Table Selection Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTableDropdown(!showTableDropdown)}
                className={`flex items-center space-x-2 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:border-red-500 shadow-glow transition-smooth hover-scale hover-glow ${
                  isTableLocked ? 'border-orange-500' : ''
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Table {tableNumber}</span>
                {isTableLocked && <span className="text-orange-400">🔒</span>}
                <ChevronDown className="w-3 h-3" />
              </Button>

              {showTableDropdown && (
                <div className="absolute top-full mt-2 bg-gray-800/85 right-0 glass-card-dark rounded-2xl p-2 min-w-[200px] max-h-60 overflow-y-auto animate-scale-in shadow-glow border border-gray-700">
                  <div className="text-sm font-semibold text-gray-300 px-3 py-2 border-b border-gray-700">
                    {isTableLocked ? '🔒 Table Locked (QR)' : 'please Scan the QR code'}
                  </div>
                  {isTableLocked ? (
                    <div className="p-3 text-center text-sm text-orange-300">
                      This table is locked via QR code.
                      <br />You cannot change tables.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1 p-2">
  
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 text-sm text-gray-400 transition-smooth">
              <Phone className="w-4 h-4" />
              <span>+94 563 123 456</span>
            </div>
          </div>

          {/* Professional Dark Cart & Mobile Menu */}
          <div className="flex items-center space-x-2 md:space-x-4 animate-slide-in-right">
            {/* Professional Dark Cart Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCartClick}
              className="relative bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:border-red-500 shadow-glow transition-smooth hover-scale hover-glow"
            >
              <ShoppingCart className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Cart</span>
              {cartItemCount > 0 && (
                <Badge className="badge-primary absolute -top-2 -right-2 text-xs min-w-[1.25rem] h-5 flex items-center justify-center animate-pulse-gentle shadow-glow">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-300 hover:text-red-400 transition-smooth hover-scale"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Professional Dark Mobile Menu */}
        {isOpen && (
          <div className="md:hidden glass-card-dark rounded-2xl m-4 p-6 animate-slide-in-up border border-gray-700 shadow-glow">
            <div className="space-y-4">
              <button
                onClick={() => scrollToSection('menu')}
                className="block w-full text-left text-gray-300 hover:text-red-400 font-medium py-2 transition-smooth hover-glow"
              >
                Menu
              </button>

              {/* Professional Dark Mobile Table Selection */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 font-medium">Current Table:</span>
                  <Badge className="badge-secondary">Table {tableNumber}</Badge>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {tableNumbers.slice(0, 15).map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        handleTableSelect(num);
                        setIsOpen(false);
                      }}
                      className={`p-2 text-sm rounded-xl transition-smooth hover-scale LKR{
                        tableNumber === num
                          ? 'bg-red-600 text-white shadow-glow'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-red-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowTableDropdown(true);
                    setIsOpen(false);
                  }}
                  className="w-full mt-2 text-sm text-red-400 hover:text-red-300 transition-smooth"
                >
                  More tables (16-20)...
                </button>
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-3">
                <div className="flex items-center space-x-2 text-gray-400">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Budapest, Hungary</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span>+94 1 234 5678</span>
                </div>
              </div>
              
              <Button 
                className="w-full btn-primary mt-4 hover-glow"
                onClick={() => setIsOpen(false)}
              >
                Order Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Table Dropdown - Positioned for mobile */}
      {showTableDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50" 
            onClick={() => setShowTableDropdown(false)}
          />
          <div className="md:hidden fixed top-20 left-4 right-4 z-50 bg-neutral-900/85 glass-card-dark rounded-2xl p-4 animate-scale-in shadow-glow border border-gray-700">
            <div className="text-sm font-semibold text-gray-300 px-3 py-2 border-b border-gray-700 mb-4">
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
              {tableNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => handleTableSelect(num)}
                  className={`p-3 text-sm rounded-xl transition-smooth hover-scale LKR{
                    tableNumber === num
                      ? 'bg-red-600 text-white shadow-glow'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-red-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default RestaurantNavbar;