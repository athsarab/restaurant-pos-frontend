import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const BillingModal = ({ isOpen, onClose, order, onBillComplete }) => {
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountReason, setDiscountReason] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  // Calculate amounts
  const subtotal = order?.totalAmount || 0;
  const discountValue = parseFloat(discount) || 0;
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100 
    : discountValue;
  const finalAmount = Math.max(0, subtotal - discountAmount);
  const balance = Math.max(0, (parseFloat(amountPaid) || 0) - finalAmount);

  // Reset form when modal opens (only when modal opens or order changes, not when finalAmount changes)
  useEffect(() => {
    if (isOpen && order) {
      setDiscount('');
      setDiscountType('fixed');
      setDiscountReason('');
      setAmountPaid((order.totalAmount || 0).toString()); // Use original amount instead of finalAmount
      setPaymentMethod('cash');
    }
  }, [isOpen, order]); // Removed finalAmount dependency

  // Update amount paid when payment method changes to card/mobile
  useEffect(() => {
    if (paymentMethod === 'card' || paymentMethod === 'mobile') {
      setAmountPaid(finalAmount.toString());
    }
  }, [paymentMethod]); // Only trigger when payment method changes, not finalAmount

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!order) return;

    if ((parseFloat(amountPaid) || 0) < finalAmount && paymentMethod === 'cash') {
      toast.error('Amount paid cannot be less than final amount for cash payments');
      return;
    }

    setLoading(true);
    try {
      const billData = {
        discount: parseFloat(discount) || 0,
        discountType,
        discountReason: discountReason.trim(),
        amountPaid: parseFloat(amountPaid) || 0,
        paymentMethod
      };

      await api.patch(`/orders/${order._id}/bill`, billData);
      
      toast.success('Order billed successfully!');

      await printBillToFile({
        ...order,
        discount: parseFloat(discount) || 0,
        discountType,
        discountReason: discountReason.trim(),
        subtotal,
        finalAmount,
        amountPaid: parseFloat(amountPaid) || 0,
        balance,
        paymentMethod
      });

      onBillComplete();
      onClose();
    } catch (error) {
      console.error('Error billing order:', error);
      toast.error('Failed to bill order');
    } finally {
      setLoading(false);
    }
  };

  const printBillToFile = async (orderData) => {
    try {
      const response = await api.post('/print/bill', {
        orderData,
        options: {
          method: 'powershell',
          lineWidth: 40,
          autoDelete: true
        }
      });

      if (response.data.success) {
        toast.success('Bill printed successfully!');
      } else {
        throw new Error(response.data.message || 'Print failed');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Backend printing failed, opening browser print dialog...');
      printBillBrowser(orderData);
    }
  };

  const printBillBrowser = (orderData) => {
    const currentDate = new Date();
    const billDate = currentDate.toLocaleDateString('en-GB');
    const billTime = currentDate.toLocaleTimeString('en-GB', { hour12: false });
/*
const billHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Restaurant Bill - ${orderData.orderId}</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 0;
        padding: 0;
      }

      @media print {
        body {
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print { display: none; }
      }

      body {
        font-family: 'Arial', sans-serif;
        font-size: 12pt;
        line-height: 1.3;
        margin: 0 auto;
      }

      .header {
        text-align: center;
        margin-bottom: 8px;
        border-bottom: 2px solid #000;
        padding-bottom: 6px;
      }

      .restaurant-name {
        font-size: 18pt;
        font-weight: normal;
        margin-bottom: 4px;
        text-transform: uppercase;
      }

      .restaurant-info {
        font-size: 12pt;
        margin-bottom: 2px;
        font-weight: normal;
      }

      .bill-info {
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid #000;
      }

      .bill-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 10pt;
      }

      .items-section {
        margin-bottom: 10px;
      }

      .items-header {
        display: grid;
        grid-template-columns: 50% 15% 15% 20%;
        font-weight: bold;
        border-bottom: 2px solid #000;
        padding-bottom: 4px;
        margin-bottom: 4px;
        font-size: 13pt;
      }

      .items-header span {
        text-align: right;
      }
      .items-header span:first-child {
        text-align: left;
      }

      .item-row {
        margin-bottom: 4px;
      }

      .item-name {
        font-size: 12pt;
        margin-bottom: 2px;
        word-break: break-word;
      }

      .item-details {
        display: grid;
        grid-template-columns: 50% 15% 15% 20%;
        font-size: 11pt;
      }

      .item-details span {
        text-align: right;
      }
      .item-details span:first-child {
        text-align: left;
      }

      .totals {
        border-top: 2px solid #000;
        padding-top: 10px;
        margin-top: 10px;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 13pt;
      }

      .final-total {
        font-weight: bold;
        border-top: 1px solid #000;
        padding-top: 6px;
        margin-top: 6px;
        font-size: 14pt;
      }

      .payment-info {
        margin-top: 12px;
        padding: 8px 0;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
      }

      .payment-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
        font-size: 13pt;
      }

      .footer {
        text-align: center;
        margin-top: 15px;
        padding-top: 8px;
        border-top: 1px dashed #000;
        font-size: 13pt;
      }

      .separator {
        text-align: center;
        margin: 8px 0;
        font-size: 10pt;
      }

      .print-button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        margin: 8px;
        font-size: 12px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="no-print" style="text-align: center; margin-bottom: 20px;">
      <button class="print-button" onclick="window.print()">Print Bill</button>
      <button class="print-button" onclick="window.close()" style="background: #64748b;">Close</button>
    </div>

    <div class="header">
      <div style="text-align: center; margin-bottom: 8px;">
        <img src="/Logo W.png" alt="Restaurant Logo" style="max-width: 120px; height: auto; margin-bottom: 6px;" />
      </div>
      <div class="restaurant-name">RESTAURANTS BY RONAN</div>
      <div class="restaurant-info">288/12L, Royal Gardens, Rajagiriya.</div>
      <div class="restaurant-info">Tel: +94 777 66 9191</div>
    </div>

    <div class="bill-info">
      <div class="bill-line">
        <span>Bill: ${orderData.orderId}</span>
        <span>Date: ${billDate}</span>
      </div>
      <div class="bill-line">
        <span>Table: ${orderData.table === 'takeaway' || !orderData.table ? 'Takeaway' : ` ${orderData.table}`}</span>
        <span>Time: ${billTime}</span>
      </div>
    </div>

    <div class="items-section">
      <div class="items-header">
        <span>Item</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Total</span>
      </div>

      ${orderData.items.map(item => `
        <div class="item-row">
          <div class="item-name">${item.dishName}</div>
          <div class="item-details">
            <span></span>
            <span>${item.qty}</span>
            <span>${item.price.toFixed(2)}</span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="totals">
      <div class="total-line">
        <span>Subtotal:</span>
        <span>LKR ${orderData.subtotal.toFixed(2)}</span>
      </div>
      ${orderData.discount > 0 ? `
        <div class="total-line">
          <span>Discount ${orderData.discountType === 'percentage' ? `(${orderData.discount}%)` : '(Fixed)'}:</span>
          <span>- LKR ${(orderData.discountType === 'percentage' ? (orderData.subtotal * orderData.discount) / 100 : orderData.discount).toFixed(2)}</span>
        </div>
        ${orderData.discountReason ? `
          <div class="total-line" style="font-size: 11pt;">Reason: ${orderData.discountReason}</div>
        ` : ''}
      ` : ''}
      <div class="total-line final-total">
        <span>TOTAL:</span>
        <span>LKR ${orderData.finalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <div class="payment-line">
        <span>Payment:</span>
        <span>${orderData.paymentMethod.toUpperCase()}</span>
      </div>
      <div class="payment-line">
        <span>Paid:</span>
        <span>LKR ${orderData.amountPaid.toFixed(2)}</span>
      </div>
      ${orderData.balance > 0 ? `
        <div class="payment-line">
          <span>Change:</span>
          <span>LKR ${orderData.balance.toFixed(2)}</span>
        </div>
      ` : ''}
    </div>

    <div class="separator">
      --------------------------------
    </div>

    <div class="footer">
      <div>Thank you for dining with us!</div>
      <div>Please visit again!</div>
      <div style="margin-top: 6px;">*****</div>
    </div>

    <script>
      window.onload = function() { 
        setTimeout(() => window.print(), 500); 
      }
    </script>
  </body>
</html>
`;
*/

const billHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Restaurant Bill - ${orderData.orderId}</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 0;
        padding: 0;
      }

      @media print {
        body {
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print { display: none; }
      }

      body {
        font-family: '';
        font-size: 12pt;
        line-height: 1.3;
        margin: 0 auto;
      }

      .header {
        text-align: center;
        margin-bottom: 8px;
        border-bottom: 2px solid #000;
        padding-bottom: 6px;
      }

      .restaurant-name {
        font-size: 18pt;
        font-weight: normal;
        margin-bottom: 4px;
        text-transform: uppercase;
      }

      .restaurant-info {
        font-size: 12pt;
        margin-bottom: 2px;
        font-weight: normal;
      }

      .bill-info {
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid #000;
      }

      .bill-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 10pt;
      }

      .items-section {
        margin-bottom: 10px;
      }

      .items-header {
        font-weight: ;
        border-bottom: 2px solid #000;
        padding-bottom: 4px;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        font-size: 15pt;
      }

      .item-row {
        margin-bottom: 3px;
        font-size: 12pt;
      }

      .item-details {
        display: flex;
        justify-content: space-between;
        margin-left: 2px;
      }

      .totals {
        border-top: 2px solid #000;
        padding-top: 10px;
        margin-top: 10px;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 14pt;
      }

      .final-total {
        font-weight: ;
        border-top: 1px solid #000;
        padding-top: 6px;
        margin-top: 6px;
        font-size: 14pt;
      }

      .payment-info {
        margin-top: 12px;
        padding: 8px 0;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
      }

      .payment-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
        font-size: 15pt;
      }

      .footer {
        text-align: center;
        margin-top: 15px;
        padding-top: 8px;
        border-top: 1px dashed #000;
        font-size: 14pt;
      }

      .separator {
        text-align: center;
        margin: 8px 0;
        font-size: 10pt;
      }

      .print-button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        margin: 8px;
        font-size: 12px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="no-print" style="text-align: center; margin-bottom: 20px;">
      <button class="print-button" onclick="window.print()">Print Bill</button>
      <button class="print-button" onclick="window.close()" style="background: #64748b;">Close</button>
    </div>

    <div class="header">
      <div style="text-align: center; margin-bottom: 8px;">
        <img src="/Logo W.png" alt="Restaurant Logo" style="max-width: 120px; height: auto; margin-bottom: 6px;" />
      </div>
      <div class="restaurant-name">RESTAURANTS BY RONAN</div>
      <div class="restaurant-info">288/12L,Royal Gardens,Rajagiriya.</div>
      <div class="restaurant-info">Tel: +94 777 66 9191</div>
    </div>

    <div class="bill-info">
      <div class="bill-line">
        <span>Bill: ${orderData.orderId}</span>
        <span>Date: ${billDate}</span>
      </div>
      <div class="bill-line">
        <span>Table: ${orderData.table === 'takeaway' || !orderData.table ? 'Takeaway' : orderData.table}</span>
        <span>Time: ${billTime}</span>
      </div>
    </div>

    <div class="items-section">
      <div class="items-header">
        <span>Item</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Total</span>
      </div>

      ${orderData.items.map(item => `
        <div class="item-row">
          <div>${item.dishName}</div>
          <div class="item-details">
            <span>${item.qty}</span>
            <span>${item.price.toFixed(2)}</span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="totals">
      <div class="total-line">
        <span>Subtotal:</span>
        <span>LKR ${orderData.subtotal.toFixed(2)}</span>
      </div>

      ${orderData.discount > 0 ? `
        <div class="total-line">
          <span>Discount ${orderData.discountType === 'percentage' ? `(${orderData.discount}%)` : '(Fixed)'}:</span>
          <span>- LKR ${(orderData.discountType === 'percentage' ? (orderData.subtotal * orderData.discount) / 100 : orderData.discount).toFixed(2)}</span>
        </div>
        ${orderData.discountReason ? `
          <div class="total-line" style="font-size: 13pt;">Reason: ${orderData.discountReason}</div>
        ` : ''}
      ` : ''}

      <div class="total-line final-total">
        <span>TOTAL:</span>
        <span>LKR ${orderData.finalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <div class="payment-line">
        <span>Payment:</span>
        <span>${orderData.paymentMethod.toUpperCase()}</span>
      </div>
      <div class="payment-line">
        <span>Paid:</span>
        <span>LKR ${orderData.amountPaid.toFixed(2)}</span>
      </div>
      ${orderData.balance > 0 ? `
        <div class="payment-line">
          <span>Change:</span>
          <span>LKR ${orderData.balance.toFixed(2)}</span>
        </div>
      ` : ''}
    </div>

    <div class="separator">
      --------------------------------
    </div>

    <div class="footer">
      <div>Thank you for dining with us!</div>
      <div>Please visit again!</div>
      <div style="margin-top: 6px;">*****</div>
    </div>

    <script>
      window.onload = function() {
        setTimeout(() => window.print(), 500);
      }
    </script>
  </body>
</html>
`;








    const printWindow = window.open('', '_blank');
    printWindow.document.write(billHTML);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
    }, 500);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Bill Order - {order.orderId}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <h3 className="text-white font-bold text-lg mb-3">Order Summary</h3>
            <div className="text-sm text-slate-300 space-y-1">
              <p className="flex justify-between">
                <span>Table:</span>
                <span className="font-medium">{order.table === 'takeaway' || !order.table ? 'Takeaway' : `Table ${order.table}`}</span>
              </p>
              <p className="flex justify-between">
                <span>Items:</span>
                <span className="font-medium">{order.items?.length || 0}</span>
              </p>
              <p className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">LKR {subtotal.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Discount Section */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Discount</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  {discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? '100' : subtotal}
                  step={discountType === 'percentage' ? '0.1' : '0.01'}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={discountType === 'percentage' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 50.00)'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">Discount Reason</label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter discount reason..."
              />
            </div>
          </div>

          {/* Amount Calculation */}
          <div className="bg-slate-700 p-4 rounded-lg border border-slate-600 space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-medium">LKR {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount:</span>
                <span className="font-medium">- LKR {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-lg border-t border-slate-600 pt-3">
              <span>Total Amount:</span>
              <span>LKR {finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Payment Details</h3>
            
            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">Amount Paid</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter amount received from customer"
                disabled={paymentMethod !== 'cash'}
              />
              {paymentMethod !== 'cash' && (
                <p className="text-xs text-slate-400 mt-2">
                  Exact amount required for card and mobile payments
                </p>
              )}
            </div>

            {balance > 0 && (
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-800">
                <div className="flex justify-between text-green-300 font-bold">
                  <span>Balance (Change):</span>
                  <span>LKR {balance.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 text-white py-3 px-4 rounded-lg hover:bg-slate-500 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (amountPaid < finalAmount && paymentMethod === 'cash')}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing...' : 'Bill & Print'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingModal;