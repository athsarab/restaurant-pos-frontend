import { useEffect, useState, useCallback } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon, FunnelIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

export default function SupplierPayments() {
  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [form, setForm] = useState({
    supplierId: '',
    categoryId: '',
    itemId: '',
    quantity: 1,
    unitPrice: 0,
    percentage: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Unpaid',
    notes: '',
    invoiceNumber: '',
    paymentMethod: 'Cash'
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    supplierId: '',
    categoryId: '',
    fromDate: '',
    toDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState({});

  const resetForm = () => {
    setForm({
      supplierId: '',
      categoryId: '',
      itemId: '',
      quantity: 1,
      unitPrice: 0,
      percentage: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Unpaid',
      notes: '',
      invoiceNumber: '',
      paymentMethod: 'Cash'
    });
    setEditingId(null);
    setFilteredItems([]);
  };

  const loadPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const res = await api.get(`/supplier-payments?${params.toString()}`);
      setPayments(res.data.payments || res.data);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  }, [filters]);

  const loadSummary = async () => {
    try {
      const res = await api.get('/supplier-payments/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadPayments(),
        loadSummary(),
        loadSuppliers(),
        loadCategories(),
        loadItems()
      ]);
    };
    loadData();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [filters]);

  // Filter items based on selected category
  useEffect(() => {
    if (form.categoryId && items.length > 0) {
      const categoryName = categories.find(cat => cat._id === form.categoryId)?.name;
      if (categoryName) {
        const filtered = items.filter(item => item.category === categoryName);
        setFilteredItems(filtered);
      }
    } else {
      setFilteredItems([]);
    }
  }, [form.categoryId, items, categories]);

  // Auto-fill percentage when supplier is selected
  useEffect(() => {
    if (form.supplierId && form.categoryId) {
      const supplier = suppliers.find(s => s._id === form.supplierId);
      if (supplier) {
        const supplyCategory = supplier.supplyCategories?.find(sc => sc.categoryId === form.categoryId);
        if (supplyCategory && supplyCategory.percentage) {
          setForm(prev => ({ ...prev, percentage: supplyCategory.percentage }));
        }
      }
    }
  }, [form.supplierId, form.categoryId, suppliers]);

  // Auto-fill unit price when item is selected
  useEffect(() => {
    if (form.itemId && items.length > 0) {
      const item = items.find(i => i._id === form.itemId);
      if (item) {
        setForm(prev => ({ ...prev, unitPrice: item.price }));
      }
    }
  }, [form.itemId, items]);

  const save = async () => {
    if (!form.supplierId || !form.categoryId || !form.itemId || !form.quantity || !form.unitPrice) {
      alert('Please fill all required fields');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/supplier-payments/${editingId}`, form);
      } else {
        await api.post('/supplier-payments', form);
      }
      setOpen(false);
      resetForm();
      loadPayments();
      loadSummary();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error saving payment. Please try again.');
    }
  };

  const handleEdit = (payment) => {
    setForm({
      supplierId: payment.supplierId || '',
      categoryId: payment.categoryId || '',
      itemId: payment.itemId || '',
      quantity: payment.quantity || 1,
      unitPrice: payment.unitPrice || 0,
      percentage: payment.percentage || 0,
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: payment.status || 'Unpaid',
      notes: payment.notes || '',
      invoiceNumber: payment.invoiceNumber || '',
      paymentMethod: payment.paymentMethod || 'Cash'
    });
    setEditingId(payment._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      try {
        await api.delete(`/supplier-payments/${id}`);
        loadPayments();
        loadSummary();
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment. Please try again.');
      }
    }
  };

  const viewDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };

  const calculateTotals = () => {
    const baseTotal = form.unitPrice * form.quantity;
    const marginAmount = (baseTotal * form.percentage) / 100;
    const totalSupplierPrice = baseTotal + marginAmount;
    
    return { baseTotal, marginAmount, totalSupplierPrice };
  };

  const { baseTotal, marginAmount, totalSupplierPrice } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="text-slate-400 text-sm">Total Payments</div>
          <div className="text-3xl font-semibold text-primary">{summary.totalPayments || 0}</div>
        </div>
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="text-slate-400 text-sm">Total Amount</div>
          <div className="text-3xl font-semibold text-blue-400">LKR {(summary.totalAmount || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="text-slate-400 text-sm">Paid Amount</div>
          <div className="text-3xl font-semibold text-green-400">LKR {(summary.paidAmount || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="text-slate-400 text-sm">Unpaid Amount</div>
          <div className="text-3xl font-semibold text-red-400">LKR {(summary.unpaidAmount || 0).toLocaleString()}</div>
        </div>
      </div>

      <Card 
        title="Supplier Payments" 
        actions={
          <div className="flex gap-2">
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded bg-primary-600 hover:bg-primary-700 transition-colors" 
              onClick={() => setOpen(true)}
            >
              <PlusIcon className="w-4 h-4" />
              Add Payment
            </button>
          </div>
        }
      >
        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Search</label>
                <input 
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" 
                  value={filters.search} 
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search supplier, category, item..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select 
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" 
                  value={filters.status} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Supplier</label>
                <select 
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" 
                  value={filters.supplierId} 
                  onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category</label>
                <select 
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" 
                  value={filters.categoryId} 
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">From Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" 
                  value={filters.fromDate} 
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">To Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" 
                  value={filters.toDate} 
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <DataTable
          data={payments}
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          searchPlaceholder="Search payments..."
          columns={[
            { key: 'supplierName', title: 'Supplier' },
            { key: 'categoryName', title: 'Category' },
            { key: 'itemName', title: 'Item' },
            { 
              key: 'quantity', 
              title: 'Quantity',
              render: (value, row) => `${value} ${row.unit}`
            },
            { 
              key: 'unitPrice', 
              title: 'Unit Price',
              render: (value) => `LKR ${(Number(value) || 0).toLocaleString()}`
            },
            { 
              key: 'percentage', 
              title: 'Margin %',
              render: (value) => `${value}%`
            },
            { 
              key: 'totalSupplierPrice', 
              title: 'Total Price',
              render: (value) => (
                <span className="font-semibold text-green-400">
                  LKR {value.toLocaleString()}
                </span>
              )
            },
            { 
              key: 'paymentDate', 
              title: 'Payment Date',
              render: (value) => new Date(value).toLocaleDateString()
            },
            { 
              key: 'status', 
              title: 'Status',
              render: (value) => (
                <span className={`px-2 py-1 rounded text-xs ${
                  value === 'Paid' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {value}
                </span>
              )
            },
            {
              key: 'actions',
              title: 'Actions',
              render: (_, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => viewDetails(row)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title="View Details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(row)}
                    className="text-yellow-400 hover:text-yellow-300 p-1"
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
          footer={(displayedData) => {
            const totalAmount = displayedData.reduce((sum, p) => sum + (p.totalSupplierPrice || 0), 0);
            const totalPaid = displayedData.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.totalSupplierPrice || 0), 0);
            const totalUnpaid = displayedData.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + (p.totalSupplierPrice || 0), 0);
            return (
              <tr className="bg-slate-800/50">
                <td colSpan="6" className="px-6 py-4 text-right font-semibold text-slate-300">
                  Total:
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200">LKR {totalAmount.toLocaleString()}</div>
                    <div className="text-xs text-green-400">Paid: LKR {totalPaid.toLocaleString()}</div>
                    <div className="text-xs text-red-400">Unpaid: LKR {totalUnpaid.toLocaleString()}</div>
                  </div>
                </td>
                <td colSpan="2"></td>
              </tr>
            );
          }}
        />
      </Card>

      {/* Add/Edit Payment Modal */}
      <Modal 
        open={open} 
        title={editingId ? "Edit Payment" : "Add Payment"} 
        onClose={() => { setOpen(false); resetForm(); }}
      >
        <div className="space-y-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Supplier *</label>
              <select 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.supplierId} 
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category *</label>
              <select 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.categoryId} 
                onChange={(e) => setForm({ ...form, categoryId: e.target.value, itemId: '' })}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Item *</label>
            <select 
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
              value={form.itemId} 
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              disabled={!form.categoryId}
            >
              <option value="">Select Item</option>
              {filteredItems.map(item => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantity *</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.quantity} 
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 1 })}
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unit Price (LKR) *</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.unitPrice} 
                onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Margin % *</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.percentage} 
                onChange={(e) => setForm({ ...form, percentage: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Payment Calculation</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Base Total:</span>
                <span>LKR {baseTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Margin ({form.percentage}%):</span>
                <span>LKR {marginAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-600 pt-1">
                <span>Total Supplier Price:</span>
                <span className="text-green-400">LKR {totalSupplierPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Payment Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.paymentDate} 
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status</label>
              <select 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.status} 
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Invoice Number</label>
              <input 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.invoiceNumber} 
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                placeholder="INV-001"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Payment Method</label>
              <select 
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
                value={form.paymentMethod} 
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea 
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" 
              rows="3"
              value={form.notes} 
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes about this payment..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
            <button 
              className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors" 
              onClick={() => { setOpen(false); resetForm(); }}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 transition-colors" 
              onClick={save}
            >
              {editingId ? 'Update' : 'Save'} Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Details Modal */}
      <Modal 
        open={detailsOpen} 
        title="Payment Details" 
        onClose={() => { setDetailsOpen(false); setSelectedPayment(null); }}
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Supplier</label>
                <div className="text-white">{selectedPayment.supplierName}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category</label>
                <div className="text-white">{selectedPayment.categoryName}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Item</label>
                <div className="text-white">{selectedPayment.itemName}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Quantity</label>
                <div className="text-white">{selectedPayment.quantity} {selectedPayment.unit}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Unit Price</label>
                <div className="text-white">LKR {selectedPayment.unitPrice.toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Margin %</label>
                <div className="text-white">{selectedPayment.percentage}%</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Total Price</label>
                <div className="text-green-400 font-semibold">LKR {selectedPayment.totalSupplierPrice.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Payment Date</label>
                <div className="text-white">{new Date(selectedPayment.paymentDate).toLocaleDateString()}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedPayment.status === 'Paid' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {selectedPayment.status}
                </span>
              </div>
            </div>
            {selectedPayment.invoiceNumber && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Invoice Number</label>
                <div className="text-white">{selectedPayment.invoiceNumber}</div>
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Payment Method</label>
              <div className="text-white">{selectedPayment.paymentMethod}</div>
            </div>
            {selectedPayment.notes && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <div className="text-white bg-slate-800 p-3 rounded">{selectedPayment.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}