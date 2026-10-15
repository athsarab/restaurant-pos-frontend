import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, CalendarIcon, TruckIcon } from '@heroicons/react/24/outline';
import { useDomain } from '../context/DomainContext';
import api from '../services/api';

export default function PurchaseOrder() {
  const { domain } = useDomain();
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    poNumber: '',
    supplierId: '',
    supplierInvoice: '',
    orderDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    discount: 0,
    discountPercentage: 0,
    deliveryCharges: 0,
    otherCharges: 0,
    paymentType: 'cash',
    paidAmount: 0,
    notes: '',
    vehicleNumber: '',
    driverName: '',
    receivedBy: '',
    items: []
  });

  const [orderItems, setOrderItems] = useState([{
    itemId: '',
    itemName: '',
    orderedQuantity: 0,
    receivedQuantity: 0,
    unit: '',
    totalPrice: 0,
    sellPrice: 0,
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    remarks: ''
  }]);


  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      const data = response.data;
      setSuppliers(Array.isArray(data) ? data : (data?.suppliers || []));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  const fetchItems = async () => {
    try {
      // Match existing Inventory page: only inventory items
      const response = await api.get('/items?itemType=inventory');
      const data = response.data;
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSuppliers();
    fetchItems();
  }, [domain]);

  const handleAddItem = () => {
    setOrderItems([...orderItems, {
      itemId: '',
      itemName: '',
      orderedQuantity: 0,
      receivedQuantity: 0,
      unit: '',
      totalPrice: 0,
      sellPrice: 0,
      batchNumber: '',
      manufactureDate: '',
      expiryDate: '',
      remarks: ''
    }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;

    // Auto-fill item details when item is selected
    if (field === 'itemId') {
      const selectedItem = items.find(item => item._id === value);
      if (selectedItem) {
        newItems[index].itemName = selectedItem.name;
        newItems[index].unit = selectedItem.unit;
        newItems[index].sellPrice = selectedItem.price;
      }
    }

    // Auto-fill received quantity to match ordered quantity
    if (field === 'orderedQuantity' && !newItems[index].receivedQuantity) {
      newItems[index].receivedQuantity = value;
    }

    setOrderItems(newItems);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      const totalPrice = parseFloat(item.totalPrice) || 0;
      return sum + totalPrice;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = formData.discountPercentage > 0 
      ? (subtotal * (parseFloat(formData.discountPercentage) || 0)) / 100 
      : parseFloat(formData.discount) || 0;
    const deliveryCharges = parseFloat(formData.deliveryCharges) || 0;
    const otherCharges = parseFloat(formData.otherCharges) || 0;
    return subtotal - discountAmount + deliveryCharges + otherCharges;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate items
      const validItems = orderItems.filter(item => item.itemId && (parseFloat(item.receivedQuantity) || 0) > 0 && (parseFloat(item.totalPrice) || 0) > 0);
      
      if (validItems.length === 0) {
        setError('Please add at least one item with quantity and total price');
        setLoading(false);
        return;
      }

      const mappedItems = validItems.map((item) => {
        const receivedQty = parseFloat(item.receivedQuantity) || 0;
        const totalPrice = parseFloat(item.totalPrice) || 0;
        const unitPrice = receivedQty > 0 ? totalPrice / receivedQty : 0;

        return {
          itemId: item.itemId,
          itemName: item.itemName,
          orderedQuantity: parseFloat(item.orderedQuantity) || 0,
          receivedQuantity: receivedQty,
          unit: item.unit,
          costPrice: unitPrice,
          sellPrice: parseFloat(item.sellPrice) || 0,
          batchNumber: item.batchNumber,
          manufactureDate: item.manufactureDate,
          expiryDate: item.expiryDate,
          remarks: item.remarks,
          purchaseMetadata: item.purchaseMetadata
        };
      });

      const grnData = {
        ...formData,
        items: mappedItems
      };

      const response = await api.post('/grn', grnData);

      setSuccess(`GRN ${response.data.grn.grnNumber} created successfully!`);
      
      // Reset form
      setFormData({
        poNumber: '',
        supplierId: '',
        supplierInvoice: '',
        orderDate: new Date().toISOString().split('T')[0],
        receivedDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        discount: 0,
        discountPercentage: 0,
        deliveryCharges: 0,
        otherCharges: 0,
        paymentType: 'cash',
        paidAmount: 0,
        notes: '',
        vehicleNumber: '',
        driverName: '',
        receivedBy: ''
      });
      setOrderItems([{
        itemId: '',
        itemName: '',
        orderedQuantity: 0,
        receivedQuantity: 0,
        unit: '',
        totalPrice: 0,
        sellPrice: 0,
        batchNumber: '',
        manufactureDate: '',
        expiryDate: '',
        remarks: ''
      }]);

      // Redirect to GRN report after 2 seconds
      setTimeout(() => {
        window.location.href = '/inventory/grn-report';
      }, 2000);
    } catch (error) {
      console.error('Error creating GRN:', error);
      setError(error.response?.data?.message || 'Failed to create GRN');
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s._id === formData.supplierId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white">Purchase Order / GRN Entry</h1>
        <p className="text-slate-400 mt-1">Create a new Goods Receipt Note for incoming stock</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Information */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Order Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                PO Number (Optional)
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                className="form-input"
                placeholder="PO-2026-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Supplier <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Supplier Invoice <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.supplierInvoice}
                onChange={(e) => setFormData({ ...formData, supplierInvoice: e.target.value })}
                className="form-input"
                required
                placeholder="INV-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Order Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Received Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vehicle Number
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="form-input"
                placeholder="ABC-1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="form-input"
                placeholder="Driver name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Received By
              </label>
              <input
                type="text"
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                className="form-input"
                placeholder="Your name"
              />
            </div>
          </div>

          {selectedSupplier && (
            <div className="mt-4 p-4 bg-slate-700 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-2">Supplier Details:</h3>
              <div className="text-sm text-slate-300 space-y-1">
                <p><span className="font-medium">Contact:</span> {selectedSupplier.contact || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {selectedSupplier.phone || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {selectedSupplier.email || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Order Items</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr className="bg-slate-700">
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Product <span className="text-red-400">*</span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Ordered Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Received Qty <span className="text-red-400">*</span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Total Price <span className="text-red-400">*</span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Sell Price
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Price per unit
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Batch/Expiry
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orderItems.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-700/50">
                    <td className="px-3 py-3">
                      <select
                        value={item.itemId}
                        onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                        className="form-select text-sm"
                        required
                      >
                        <option value="">Select Item</option>
                        {items.map(invItem => (
                          <option key={invItem._id} value={invItem._id}>
                            {invItem.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="form-input text-sm w-20"
                        placeholder="kg"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.orderedQuantity}
                        onChange={(e) => handleItemChange(index, 'orderedQuantity', parseFloat(e.target.value) || 0)}
                        className="form-input text-sm w-24"
                        step="0.001"
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.receivedQuantity}
                        onChange={(e) => handleItemChange(index, 'receivedQuantity', parseFloat(e.target.value) || 0)}
                        className="form-input text-sm w-24"
                        step="0.001"
                        min="0"
                        required
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.totalPrice}
                        onChange={(e) => handleItemChange(index, 'totalPrice', parseFloat(e.target.value) || 0)}
                        className="form-input text-sm w-28"
                        step="0.01"
                        min="0"
                        required
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.sellPrice}
                        onChange={(e) => handleItemChange(index, 'sellPrice', parseFloat(e.target.value) || 0)}
                        className="form-input text-sm w-28"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-3 text-white font-medium">
                      Rs. {((parseFloat(item.receivedQuantity) || 0) > 0
                        ? ((parseFloat(item.totalPrice) || 0) / (parseFloat(item.receivedQuantity) || 1))
                        : 0
                      ).toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                          className="form-input text-xs w-24"
                          placeholder="Batch #"
                        />
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                          className="form-input text-xs w-24"
                          placeholder="Expiry"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-300"
                        disabled={orderItems.length === 1}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Financial Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discount (Rs.)
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0, discountPercentage: 0 })}
                className="form-input"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discount (%)
              </label>
              <input
                type="number"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0, discount: 0 })}
                className="form-input"
                step="0.01"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Delivery Charges
              </label>
              <input
                type="number"
                value={formData.deliveryCharges}
                onChange={(e) => setFormData({ ...formData, deliveryCharges: parseFloat(e.target.value) || 0 })}
                className="form-input"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Other Charges
              </label>
              <input
                type="number"
                value={formData.otherCharges}
                onChange={(e) => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })}
                className="form-input"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Type
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                className="form-select"
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Paid Amount
              </label>
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                className="form-input"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Totals Display */}
          <div className="mt-6 space-y-2 text-right">
            <div className="flex justify-end items-center text-slate-300">
              <span className="mr-4">Subtotal:</span>
              <span className="font-semibold text-white w-32">Rs. {(calculateSubtotal() || 0).toFixed(2)}</span>
            </div>
            {((parseFloat(formData.discount) || 0) > 0 || (parseFloat(formData.discountPercentage) || 0) > 0) && (
              <div className="flex justify-end items-center text-green-400">
                <span className="mr-4">
                  Discount {(parseFloat(formData.discountPercentage) || 0) > 0 ? `(${parseFloat(formData.discountPercentage) || 0}%)` : ''}:
                </span>
                <span className="font-semibold w-32">
                  - Rs. {((parseFloat(formData.discountPercentage) || 0) > 0 
                    ? (calculateSubtotal() * (parseFloat(formData.discountPercentage) || 0)) / 100 
                    : (parseFloat(formData.discount) || 0)).toFixed(2)}
                </span>
              </div>
            )}
            {(parseFloat(formData.deliveryCharges) || 0) > 0 && (
              <div className="flex justify-end items-center text-slate-300">
                <span className="mr-4">Delivery Charges:</span>
                <span className="font-semibold w-32">+ Rs. {(parseFloat(formData.deliveryCharges) || 0).toFixed(2)}</span>
              </div>
            )}
            {(parseFloat(formData.otherCharges) || 0) > 0 && (
              <div className="flex justify-end items-center text-slate-300">
                <span className="mr-4">Other Charges:</span>
                <span className="font-semibold w-32">+ Rs. {(parseFloat(formData.otherCharges) || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-end items-center text-xl font-bold text-white border-t border-slate-600 pt-2">
              <span className="mr-4">Total Amount:</span>
              <span className="w-32">Rs. {(calculateTotal() || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-end items-center text-blue-400">
              <span className="mr-4">Paid:</span>
              <span className="font-semibold w-32">Rs. {(parseFloat(formData.paidAmount) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-end items-center text-red-400">
              <span className="mr-4">Balance:</span>
              <span className="font-semibold w-32">Rs. {((calculateTotal() || 0) - (parseFloat(formData.paidAmount) || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="form-textarea"
            rows="3"
            placeholder="Any additional notes or remarks..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.supplierId || orderItems.filter(i => i.itemId).length === 0}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors inline-flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating GRN...
              </>
            ) : (
              <>
                <TruckIcon className="w-5 h-5 mr-2" />
                Save GRN
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
