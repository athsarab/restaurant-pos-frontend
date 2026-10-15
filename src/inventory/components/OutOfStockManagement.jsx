import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import {
  ExclamationTriangleIcon,
  EyeSlashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const OutOfStockManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/menu-items');
      setMenuItems(response.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleOutOfStock = async (itemId, currentStatus) => {
    try {
      console.log('Toggling out of stock for item:', itemId, 'Current status:', currentStatus);
      
      const response = await api.patch(`/menu-items/${itemId}/out-of-stock`, {
        isOutOfStock: !currentStatus
      });
      
      console.log('API response:', response.data);
      
      toast.success(
        !currentStatus ? 'Item marked as out of stock' : 'Item marked as available',
        {
          icon: !currentStatus ? '🚫' : '✅',
        }
      );
      
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating item status:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to update item status: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const outOfStockItems = filteredItems.filter(item => item.isOutOfStock);
  const availableItems = filteredItems.filter(item => !item.isOutOfStock);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading menu items...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-400" />
            Out of Stock Management
          </h1>
          <p className="text-slate-400">Manually toggle menu items availability for customers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-white font-semibold">Available Items</h3>
                <p className="text-slate-300 text-2xl font-bold">{availableItems.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-red-500">
            <div className="flex items-center gap-3">
              <XCircleIcon className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-white font-semibold">Out of Stock</h3>
                <p className="text-slate-300 text-2xl font-bold">{outOfStockItems.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-blue-500">
            <div className="flex items-center gap-3">
              <EyeIcon className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-white font-semibold">Total Items</h3>
                <p className="text-slate-300 text-2xl font-bold">{menuItems.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Items
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                placeholder="Search by name or description..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Filter by Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Out of Stock Items */}
        {outOfStockItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <XCircleIcon className="w-6 h-6" />
              Currently Out of Stock ({outOfStockItems.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outOfStockItems.map((item) => (
                <ItemCard 
                  key={item._id} 
                  item={item} 
                  onToggle={toggleOutOfStock}
                  isOutOfStock={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Items */}
        <div>
          <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-6 h-6" />
            Available Items ({availableItems.length})
          </h2>
          {availableItems.length === 0 ? (
            <div className="bg-slate-800 p-8 rounded-lg text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No available items found</p>
              {searchTerm && (
                <p className="text-slate-500 text-sm">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableItems.map((item) => (
                <ItemCard 
                  key={item._id} 
                  item={item} 
                  onToggle={toggleOutOfStock}
                  isOutOfStock={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Item Card Component
const ItemCard = ({ item, onToggle, isOutOfStock }) => {
  return (
    <div className={`bg-slate-800 p-4 rounded-lg border transition-all ${
      isOutOfStock 
        ? 'border-red-500 bg-red-900/20' 
        : 'border-slate-700 hover:border-slate-600'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">{item.name}</h3>
          <p className="text-slate-400 text-sm mb-2 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">
              {item.category}
            </span>
            <span className="text-orange-400 font-medium">
              LKR {item.sellPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        
        {item.image && (
          <img 
            src={item.image} 
            alt={item.name}
            className="w-16 h-16 object-cover rounded-lg ml-3"
          />
        )}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          {isOutOfStock ? (
            <EyeSlashIcon className="w-5 h-5 text-red-400" />
          ) : (
            <EyeIcon className="w-5 h-5 text-green-400" />
          )}
          <span className={`text-sm font-medium ${
            isOutOfStock ? 'text-red-400' : 'text-green-400'
          }`}>
            {isOutOfStock ? 'Hidden from menu' : 'Visible to customers'}
          </span>
        </div>
        
        <button
          onClick={() => onToggle(item._id, isOutOfStock)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isOutOfStock 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isOutOfStock ? 'Mark Available' : 'Mark Out of Stock'}
        </button>
      </div>
    </div>
  );
};

export default OutOfStockManagement;