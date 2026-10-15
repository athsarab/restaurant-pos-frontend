import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

export default function Suppliers() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    address: '',
    supplyCategories: [{ category: '', categoryId: '', description: '', minimumOrder: 0, deliveryTime: '', percentage: 0 }],
    charges: {
      deliveryFee: 0,
      minimumOrderAmount: 0,
      paymentTerms: 'Cash on Delivery',
      discount: 0,
      notes: ''
    },
    rating: 3,
    isActive: true
  });

  const resetForm = () => {
    setForm({
      name: '', 
      phone: '', 
      email: '', 
      address: '',
      supplyCategories: [{ category: '', categoryId: '', description: '', minimumOrder: 0, deliveryTime: '', percentage: 0 }],
      charges: {
        deliveryFee: 0,
        minimumOrderAmount: 0,
        paymentTerms: 'Cash on Delivery',
        discount: 0,
        notes: ''
      },
      rating: 3,
      isActive: true
    });
    setEditingId(null);
  };

  const load = async () => {
    const res = await api.get('/suppliers');
    setRows(res.data);
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => { 
    load(); 
    loadCategories();
  }, []);

  const save = async () => {
    if (!form.name) return;
    
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form);
      } else {
        await api.post('/suppliers', form);
      }
      setOpen(false);
      resetForm();
      load();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier. Please try again.');
    }
  };

  const handleEdit = (supplier) => {
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      supplyCategories: supplier.supplyCategories?.length > 0 
        ? supplier.supplyCategories.map(cat => ({
            category: cat.category || '',
            categoryId: cat.categoryId || '',
            description: cat.description || '',
            minimumOrder: cat.minimumOrder || 0,
            deliveryTime: cat.deliveryTime || '',
            percentage: cat.percentage || 0
          }))
        : [{ category: '', categoryId: '', description: '', minimumOrder: 0, deliveryTime: '', percentage: 0 }],
      charges: supplier.charges || {
        deliveryFee: 0,
        minimumOrderAmount: 0,
        paymentTerms: 'Cash on Delivery',
        discount: 0,
        notes: ''
      },
      rating: supplier.rating || 3,
      isActive: supplier.isActive !== undefined ? supplier.isActive : true
    });
    setEditingId(supplier._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/suppliers/${id}`);
        load();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error deleting supplier. Please try again.');
      }
    }
  };

  const addSupplyCategory = () => {
    setForm({
      ...form,
      supplyCategories: [...form.supplyCategories, { category: '', categoryId: '', description: '', minimumOrder: 0, deliveryTime: '', percentage: 0 }]
    });
  };

  const removeSupplyCategory = (index) => {
    if (form.supplyCategories.length > 1) {
      const updated = form.supplyCategories.filter((_, i) => i !== index);
      setForm({ ...form, supplyCategories: updated });
    }
  };

  const updateSupplyCategory = (index, field, value) => {
    const updated = [...form.supplyCategories];
    updated[index] = { ...updated[index], [field]: value };
    
    // If category name is selected, also set the categoryId
    if (field === 'category') {
      const selectedCategory = categories.find(cat => cat.name === value);
      if (selectedCategory) {
        updated[index].categoryId = selectedCategory._id;
      }
    }
    
    setForm({ ...form, supplyCategories: updated });
  };

  const updateCharges = (field, value) => {
    setForm({
      ...form,
      charges: { ...form.charges, [field]: value }
    });
  };

  return (
    <Card title="Suppliers" actions={
      <button className="flex items-center gap-2 px-3 py-2 rounded bg-primary-600 hover:bg-primary-700 transition-colors" onClick={() => setOpen(true)}>
        <PlusIcon className="w-4 h-4" />
        Add Supplier
      </button>
    }>
      <DataTable
        defaultPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        searchPlaceholder="Search suppliers..."
        columns={[
          { key: 'name', title: 'Name' },
          { key: 'phone', title: 'Phone' },
          { key: 'email', title: 'Email' },
          { 
            key: 'supplyCategories', 
            title: 'Supply Categories',
            render: (value) => (
              <div className="space-y-1">
                {value?.slice(0, 2).map((cat, index) => (
                  <div key={index} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                    {cat.category}
                  </div>
                ))}
                {value?.length > 2 && (
                  <div className="text-xs text-slate-400">+{value.length - 2} more</div>
                )}
              </div>
            )
          },
          { 
            key: 'charges', 
            title: 'Delivery Fee',
            render: (value) => (
              <span className="text-green-400">
                LKR {value?.deliveryFee?.toLocaleString() || '0'}
              </span>
            )
          },
          { 
            key: 'rating', 
            title: 'Rating',
            render: (value) => (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span>{value || 3}/5</span>
              </div>
            )
          },
          {
            key: 'actions',
            title: 'Actions',
            render: (_, row) => (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(row)}
                  className="text-blue-400 hover:text-blue-300 p-1"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(row._id)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )
          }
        ]}
        data={rows}
      />
      <Modal open={open} title={editingId ? "Edit Supplier" : "Add Supplier"} onClose={() => { setOpen(false); resetForm(); }}>
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Basic Information</h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Supplier Name *</label>
              <input 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Enter supplier name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input 
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  placeholder="+94 XXX XXX XXX"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input 
                  type="email"
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="supplier@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Address</label>
              <textarea 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                rows="2"
                value={form.address} 
                onChange={(e) => setForm({ ...form, address: e.target.value })} 
                placeholder="Complete address including city"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Rating</label>
                <select 
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                  value={form.rating} 
                  onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
                >
                  <option value={1}>★ (1/5) - Poor</option>
                  <option value={2}>★★ (2/5) - Fair</option>
                  <option value={3}>★★★ (3/5) - Good</option>
                  <option value={4}>★★★★ (4/5) - Very Good</option>
                  <option value={5}>★★★★★ (5/5) - Excellent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select 
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                  value={form.isActive} 
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Supply Categories */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h3 className="text-lg font-medium text-white">Supply Categories</h3>
              <button
                type="button"
                onClick={addSupplyCategory}
                className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 px-2 py-1 rounded transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Category
              </button>
            </div>
            {form.supplyCategories.map((category, index) => (
              <div key={index} className="bg-slate-800 p-3 rounded border border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-slate-300">Category {index + 1}</h4>
                  {form.supplyCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSupplyCategory(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove category"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Category Name *</label>
                    <select
                      className="w-full px-2 py-1 text-sm rounded bg-slate-900 border border-slate-600"
                      value={category.category}
                      onChange={(e) => updateSupplyCategory(index, 'category', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Delivery Time</label>
                    <input
                      className="w-full px-2 py-1 text-sm rounded bg-slate-900 border border-slate-600"
                      value={category.deliveryTime}
                      onChange={(e) => updateSupplyCategory(index, 'deliveryTime', e.target.value)}
                      placeholder="e.g., 24 hours, Same day"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-slate-400 mb-1">Description</label>
                  <textarea
                    className="w-full px-2 py-1 text-sm rounded bg-slate-900 border border-slate-600"
                    rows="2"
                    value={category.description}
                    onChange={(e) => updateSupplyCategory(index, 'description', e.target.value)}
                    placeholder="Describe what specific items they supply in this category"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Minimum Order (LKR)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 text-sm rounded bg-slate-900 border border-slate-600"
                      value={category.minimumOrder}
                      onChange={(e) => updateSupplyCategory(index, 'minimumOrder', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Margin Percentage (%)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 text-sm rounded bg-slate-900 border border-slate-600"
                      value={category.percentage}
                      onChange={(e) => updateSupplyCategory(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charges & Terms */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Charges & Terms</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Delivery Fee (LKR)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
                  value={form.charges.deliveryFee}
                  onChange={(e) => updateCharges('deliveryFee', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Free Delivery Above (LKR)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
                  value={form.charges.minimumOrderAmount}
                  onChange={(e) => updateCharges('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Payment Terms</label>
                <select
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
                  value={form.charges.paymentTerms}
                  onChange={(e) => updateCharges('paymentTerms', e.target.value)}
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="Advance Payment">Advance Payment</option>
                  <option value="Credit - 7 days">Credit - 7 days</option>
                  <option value="Credit - 15 days">Credit - 15 days</option>
                  <option value="Credit - 30 days">Credit - 30 days</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Bulk Discount (%)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
                  value={form.charges.discount}
                  onChange={(e) => updateCharges('discount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Additional Notes</label>
              <textarea
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
                rows="2"
                value={form.charges.notes}
                onChange={(e) => updateCharges('notes', e.target.value)}
                placeholder="Any special terms, conditions, or notes about charges"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
            <button className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors" onClick={() => { setOpen(false); resetForm(); }}>
              Cancel
            </button>
            <button className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 transition-colors" onClick={save}>
              {editingId ? 'Update' : 'Save'} Supplier
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
