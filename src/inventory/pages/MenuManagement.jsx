import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { PlusIcon, PencilSquareIcon, TrashIcon, CurrencyDollarIcon, ArrowPathIcon, PhotoIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { 
  calculateConvertedCost, 
  getCompatibleUnits, 
  formatUnit, 
  suggestUnitsForIngredient 
} from '../utils/unitConversion';
import { getImageUrl } from '../../utils/imageUtils';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [profitFilter, setProfitFilter] = useState('all'); // all, profitable, loss
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subname: '',
    description: '',
    portionSize: '',
    servings: 1,
    ingredients: [],
    image: '',
    category: 'Other',
    sellPrice: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [menuRes, itemsRes] = await Promise.all([
        api.get('/menu-items'),
        api.get('/items')
      ]);
      setMenuItems(menuRes.data);
      setFilteredMenuItems(menuRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter menu items based on search term, category, and profit
  useEffect(() => {
    let filtered = menuItems;

    // Search filter - search across name, subname, description, category, and ingredients
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const name = (item.name || '').toLowerCase();
        const subname = (item.subname || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        
        // Search in ingredients
        const ingredientNames = item.ingredients.map(ing => {
          const ingredientItem = items.find(itm => itm._id === (ing.itemId._id || ing.itemId));
          return ingredientItem ? ingredientItem.name.toLowerCase() : '';
        }).join(' ');
        
        return name.includes(searchLower) ||
               subname.includes(searchLower) ||
               description.includes(searchLower) ||
               category.includes(searchLower) ||
               ingredientNames.includes(searchLower);
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Profit filter
    if (profitFilter !== 'all') {
      filtered = filtered.filter(item => {
        const sellPrice = Number(item.sellPrice) || 0;
        const totalCost = Number(item.totalCost) || 0;
        const profit = sellPrice - totalCost;
        
        if (profitFilter === 'profitable') {
          return profit >= 0;
        } else if (profitFilter === 'loss') {
          return profit < 0;
        }
        return true;
      });
    }

    setFilteredMenuItems(filtered);
  }, [menuItems, items, searchTerm, categoryFilter, profitFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      let imageUrl = formData.image;
      
      // If a new file is selected, upload it
      if (selectedFile) {
        try {
          imageUrl = await uploadImage(selectedFile);
        } catch (error) {
          console.error('Error uploading image:', error);
          // Continue with form submission even if image upload fails
          imageUrl = previewUrl; // Use the preview URL as fallback
        }
      }
      
      const submitData = {
        ...formData,
        image: imageUrl
      };
      
      if (editingItem) {
        await api.put(`/menu-items/${editingItem._id}`, submitData);
      } else {
        await api.post('/menu-items', submitData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Error saving menu item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      subname: item.subname || '',
      description: item.description || '',
      portionSize: item.portionSize,
      servings: item.servings,
      ingredients: item.ingredients.map(ing => ({
        itemId: ing.itemId._id || ing.itemId,
        quantity: ing.quantity,
        recipeUnit: ing.unit || '' // Use stored unit or default to empty
      })),
      image: item.image || '',
      category: item.category || 'Other',
      sellPrice: item.sellPrice || 0
    });
    
    // Set preview for existing image
    if (item.image) {
      setPreviewUrl(item.image);
    } else {
      setPreviewUrl('');
    }
    setSelectedFile(null);
    
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/menu-items/${id}`);
        loadData();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Error deleting menu item. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subname: '',
      description: '',
      portionSize: '',
      servings: 1,
      ingredients: [],
      image: '',
      category: 'Other',
      sellPrice: 0
    });
    setEditingItem(null);
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { 
        itemId: '', 
        quantity: 0, 
        recipeUnit: '' // Unit used in the recipe (different from stock unit)
      }]
    });
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  // Handle file selection for image upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to server
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const updateAllPrices = async () => {
    try {
      setLoading(true);
      await api.put('/menu-items/update-prices');
      loadData();
      alert('All menu item prices updated successfully!');
    } catch (error) {
      console.error('Error updating prices:', error);
      alert('Error updating prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Menu Item',
      render: (_, item) => (
        <div className="flex items-center space-x-3">
          {item.image && (
            <img 
              src={getImageUrl(item.image)} 
              alt={item.name} 
              className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => {
                console.error('Failed to load image:', {
                  originalPath: item.image,
                  generatedUrl: getImageUrl(item.image),
                  itemName: item.name
                });
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', {
                  originalPath: item.image,
                  generatedUrl: getImageUrl(item.image),
                  itemName: item.name
                });
              }}
            />
          )}
          <div>
            <div className="font-medium text-white">{item.name}</div>
            {item.subname && (
              <div className="text-sm text-orange-400 font-medium">{item.subname}</div>
            )}
            <div className="text-sm text-slate-400">{item.category}</div>
          </div>
        </div>
      )
    },
    { key: 'portionSize', label: 'Portion Size' },
    { 
      key: 'servings', 
      label: 'Servings',
      render: (_, item) => `${item.servings} serving${item.servings > 1 ? 's' : ''}`
    },
    { 
      key: 'sellPrice', 
      label: 'Sell Price',
      render: (_, item) => `LKR ${(Number(item.sellPrice) || 0).toFixed(2)}`
    },
    { 
      key: 'totalCost', 
      label: 'Cost',
      render: (_, item) => `LKR ${(Number(item.totalCost) || 0).toFixed(2)}`
    },
    { 
      key: 'profit', 
      label: 'Profit',
      render: (_, item) => {
        const sellPrice = Number(item.sellPrice) || 0;
        const totalCost = Number(item.totalCost) || 0;
        const profit = sellPrice - totalCost;
        const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400';
        return <span className={profitColor}>LKR {(Number(profit) || 0).toFixed(2)}</span>;
      }
    },
    { 
      key: 'ingredients', 
      label: 'Ingredients',
      render: (_, item) => `${item.ingredients.length} ingredients`
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => (
        <div className="flex space-x-2">
          <button 
            onClick={() => handleEdit(item)}
            className="p-1 text-blue-400 hover:text-blue-300"
            title="Edit"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(item._id)}
            className="p-1 text-red-400 hover:text-red-300"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Menu & Recipe Management</h1>
          <p className="text-slate-400 mt-1">Create and manage menu items with ingredient costs</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={updateAllPrices}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Update Prices
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-slate-400 text-sm">Total Menu Items</div>
          <div className="text-2xl font-bold text-white">{menuItems.length}</div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Average Sell Price</div>
          <div className="text-2xl font-bold text-primary">
            LKR {menuItems.length > 0 ? (menuItems.reduce((sum, item) => sum + (Number(item.sellPrice) || 0), 0) / menuItems.length).toFixed(2) : '0.00'}
          </div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Average Profit</div>
          <div className="text-2xl font-bold text-green-400">
            LKR {menuItems.length > 0 ? (menuItems.reduce((sum, item) => sum + ((Number(item.sellPrice) || 0) - (Number(item.totalCost) || 0)), 0) / menuItems.length).toFixed(2) : '0.00'}
          </div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Items with Images</div>
          <div className="text-2xl font-bold text-blue-400">
            {menuItems.filter(item => item.image).length} / {menuItems.length}
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card title="Search & Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Search Recipes</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, description, category, ingredients..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-10 py-2 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Main Dish">Main Dish</option>
              <option value="Beverage">Beverage</option>
              <option value="Dessert">Dessert</option>
              <option value="Side Dish">Side Dish</option>
              <option value="Soups">Soups</option>
              <option value="Bakery">Bakery</option>
              <option value="Salads">Salads</option>
              <option value="Pancakes - Savory">Pancakes - Savory</option>
              <option value="Pancakes - Sweets">Pancakes - Sweets</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Profit Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Profitability</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={profitFilter}
              onChange={(e) => setProfitFilter(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="profitable">Profitable Items</option>
              <option value="loss">Loss Making Items</option>
            </select>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="text-sm text-slate-400">
            Showing <span className="font-medium text-white">{filteredMenuItems.length}</span> of <span className="font-medium text-white">{menuItems.length}</span> menu items
            {searchTerm && (
              <span className="text-primary-400"> matching "{searchTerm}"</span>
            )}
            {categoryFilter !== 'all' && (
              <span className="text-orange-400"> in {categoryFilter}</span>
            )}
            {profitFilter !== 'all' && (
              <span className="text-green-400"> ({profitFilter === 'profitable' ? 'profitable' : 'loss making'})</span>
            )}
          </div>
          
          {(searchTerm || categoryFilter !== 'all' || profitFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setProfitFilter('all');
              }}
              className="text-sm text-red-400 hover:text-red-300 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
        
        {filteredMenuItems.length === 0 && menuItems.length > 0 && (
          <div className="mt-4 text-center py-8">
            <div className="text-slate-400 text-lg mb-2">No recipes found</div>
            <div className="text-sm text-slate-500">Try adjusting your search terms or filters</div>
          </div>
        )}
      </Card>

      {/* Menu Items Table */}
      <Card title="Menu Items" className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <DataTable 
            data={filteredMenuItems} 
            columns={columns}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            searchPlaceholder="Search menu items..."
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Menu Item Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Hungarian Goulash"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sub Name (Optional)</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                value={formData.subname}
                onChange={(e) => setFormData({...formData, subname: e.target.value})}
                placeholder="e.g., Traditional Style, Spicy Version"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Portion Size</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                value={formData.portionSize}
                onChange={(e) => setFormData({...formData, portionSize: e.target.value})}
                placeholder="e.g., 1 person, 3 persons, family size"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Number of Servings</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                value={formData.servings}
                onChange={(e) => setFormData({...formData, servings: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
            <textarea
              rows="2"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the dish..."
            />
          </div>

          {/* New Enhanced Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="All">All</option>
                <option value="Main Dish">Main Dish</option>
                <option value="Beverage">Beverage</option>
                <option value="Dessert">Dessert</option>
                <option value="Side Dish">Side Dish</option>
                <option value="Other">Other</option>
                <option value="Soups">Soups</option>
                <option value="Bakery">Bakery</option>
                <option value="Salads">Salads</option>
                <optgroup label="Pancakes">
                  <option value="Pancakes - Savory">Pancakes - Savory</option>
                  <option value="Pancakes - Sweets">Pancakes - Sweets</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sell Price (LKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                value={formData.sellPrice}
                onChange={(e) => setFormData({...formData, sellPrice: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Dish Image</label>
            
            {/* Image Upload Area */}
            <div className="space-y-3">
              {/* File Input - Hidden */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {/* Upload Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  Choose Image
                </button>
                
                {/* URL Input Alternative */}
                <div className="flex-1">
                  <input
                    type="url"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({...formData, image: e.target.value});
                      if (e.target.value && !selectedFile) {
                        setPreviewUrl(e.target.value);
                      }
                    }}
                    placeholder="Or paste image URL here..."
                  />
                </div>
              </div>

              {/* Image Preview */}
              {(previewUrl || formData.image) && (
                <div className="relative">
                  <p className="text-sm text-slate-400 mb-2">Preview:</p>
                  <div className="relative inline-block">
                    <img 
                      src={previewUrl || getImageUrl(formData.image)} 
                      alt="Dish preview" 
                      className="w-32 h-32 rounded-lg object-cover border-2 border-slate-600"
                      onError={(e) => {
                        console.error('Failed to load preview image:', {
                          previewUrl,
                          originalPath: formData.image,
                          generatedUrl: getImageUrl(formData.image)
                        });
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Preview image loaded successfully:', {
                          previewUrl,
                          originalPath: formData.image,
                          generatedUrl: getImageUrl(formData.image)
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {selectedFile && (
                    <div className="mt-2 text-sm text-slate-400">
                      <p>Selected: {selectedFile.name}</p>
                      <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Upload Guidelines */}
              <div className="text-xs text-slate-500">
                <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
                <p>• Maximum size: 5MB</p>
                <p>• Recommended size: 400x400 pixels</p>
              </div>
            </div>
          </div>

          {/* Ingredients Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Ingredients</h3>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Ingredient
              </button>
            </div>

            {formData.ingredients.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No ingredients added yet. Click "Add Ingredient" to start.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {formData.ingredients.map((ingredient, index) => {
                  const selectedItem = items.find(item => item._id === ingredient.itemId);
                  
                  // Calculate cost with unit conversion
                  let costInfo = {
                    success: false,
                    totalCost: 0,
                    convertedQuantity: 0,
                    unitCost: 0,
                    error: null
                  };
                  
                  if (selectedItem && ingredient.quantity > 0 && ingredient.recipeUnit) {
                    costInfo = calculateConvertedCost(
                      ingredient.quantity,
                      ingredient.recipeUnit,
                      1, // Stock quantity is 1 unit
                      selectedItem.unit,
                      selectedItem.price
                    );
                  }
                  
                  // Get compatible units for the selected item
                  const compatibleUnits = selectedItem ? getCompatibleUnits(selectedItem.unit) : [];
                  
                  return (
                    <div key={index} className="p-3 bg-slate-800 rounded space-y-3">
                      {/* Ingredient Selection Row */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <select
                            required
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                            value={ingredient.itemId}
                            onChange={(e) => {
                              updateIngredient(index, 'itemId', e.target.value);
                              // Auto-suggest compatible unit when ingredient is selected
                              const newItem = items.find(item => item._id === e.target.value);
                              if (newItem && !ingredient.recipeUnit) {
                                const suggestions = suggestUnitsForIngredient(newItem.name);
                                const compatibleWithStock = getCompatibleUnits(newItem.unit);
                                const suggestedUnit = suggestions.find(unit => 
                                  compatibleWithStock.includes(unit.toLowerCase())
                                ) || newItem.unit;
                                updateIngredient(index, 'recipeUnit', suggestedUnit);
                              }
                            }}
                          >
                            <option value="">Select ingredient...</option>
                            {items.map(item => (
                              <option key={item._id} value={item._id}>
                                {item.name} ({formatUnit(item.unit)}) - LKR {item.price}/{formatUnit(item.unit)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Quantity and Unit Row */}
                      {selectedItem && (
                        <div className="flex items-center space-x-3">
                          <div className="w-32">
                            <input
                              type="number"
                              required
                              min="0.001"
                              step="0.001"
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                              placeholder="Quantity"
                              value={ingredient.quantity}
                              onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-24">
                            <select
                              required
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-2 text-white text-sm"
                              value={ingredient.recipeUnit}
                              onChange={(e) => updateIngredient(index, 'recipeUnit', e.target.value)}
                            >
                              <option value="">Unit</option>
                              {compatibleUnits.map(unit => (
                                <option key={unit} value={unit}>
                                  {formatUnit(unit)}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Cost Display */}
                          <div className="flex-1 text-sm">
                            {costInfo.success ? (
                              <div className="text-slate-300">
                                <div className="font-medium text-green-400">
                                  LKR {costInfo.totalCost.toFixed(2)}
                                </div>
                                {ingredient.recipeUnit !== selectedItem.unit && (
                                  <div className="text-xs text-slate-400">
                                    = {costInfo.convertedQuantity.toFixed(3)} {formatUnit(selectedItem.unit)}
                                  </div>
                                )}
                              </div>
                            ) : costInfo.error ? (
                              <div className="text-red-400 text-xs">
                                {costInfo.error}
                              </div>
                            ) : ingredient.quantity > 0 && ingredient.recipeUnit ? (
                              <div className="text-yellow-400 text-xs">
                                Calculating...
                              </div>
                            ) : (
                              <div className="text-slate-500 text-xs">
                                Enter quantity & unit
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Stock Info */}
                      {selectedItem && (
                        <div className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                          Stock: {selectedItem.quantity} {formatUnit(selectedItem.unit)} @ LKR {selectedItem.price}/{formatUnit(selectedItem.unit)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cost Summary */}
            {formData.ingredients.length > 0 && (
              <div className="mt-4 p-4 bg-primary-600/10 border border-primary-600/20 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Estimated Total Cost:</span>
                  <span className="text-xl font-bold text-primary">
                    LKR {formData.ingredients.reduce((sum, ing) => {
                      const item = items.find(item => item._id === ing.itemId);
                      if (!item || !ing.quantity || !ing.recipeUnit) return sum;
                      const costInfo = calculateConvertedCost(
                        ing.quantity,
                        ing.recipeUnit,
                        1,
                        item.unit,
                        item.price
                      );
                      return sum + (costInfo.success ? costInfo.totalCost : 0);
                    }, 0).toFixed(2)}
                  </span>
                </div>
                {formData.servings > 1 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-400 text-sm">Cost per serving:</span>
                    <span className="text-primary font-medium">
                      LKR {(formData.ingredients.reduce((sum, ing) => {
                        const item = items.find(item => item._id === ing.itemId);
                        if (!item || !ing.quantity || !ing.recipeUnit) return sum;
                        const costInfo = calculateConvertedCost(
                          ing.quantity,
                          ing.recipeUnit,
                          1,
                          item.unit,
                          item.price
                        );
                        return sum + (costInfo.success ? costInfo.totalCost : 0);
                      }, 0) / Math.max(1, Number(formData.servings) || 1)).toFixed(2)}
                    </span>
                  </div>
                )}
                {formData.sellPrice > 0 && (
                  <>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-slate-300">Sell Price:</span>
                      <span className="text-white font-medium">
                        LKR {formData.sellPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-600">
                      <span className="text-slate-300 font-medium">Estimated Profit:</span>
                      <span className={`text-lg font-bold ${
                        (formData.sellPrice - formData.ingredients.reduce((sum, ing) => {
                          const item = items.find(item => item._id === ing.itemId);
                          if (!item || !ing.quantity || !ing.recipeUnit) return sum;
                          const costInfo = calculateConvertedCost(
                            ing.quantity,
                            ing.recipeUnit,
                            1,
                            item.unit,
                            item.price
                          );
                          return sum + (costInfo.success ? costInfo.totalCost : 0);
                        }, 0)) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        LKR {(formData.sellPrice - formData.ingredients.reduce((sum, ing) => {
                          const item = items.find(item => item._id === ing.itemId);
                          if (!item || !ing.quantity || !ing.recipeUnit) return sum;
                          const costInfo = calculateConvertedCost(
                            ing.quantity,
                            ing.recipeUnit,
                            1,
                            item.unit,
                            item.price
                          );
                          return sum + (costInfo.success ? costInfo.totalCost : 0);
                        }, 0)).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button 
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || formData.ingredients.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')} Menu Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}