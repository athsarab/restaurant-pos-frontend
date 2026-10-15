/**
 * Utility functions for order display and calculations
 */

/**
 * Get the correct amount to display for an order considering discounts and cancellation
 * @param {Object} order - The order object
 * @returns {number} - The amount to display
 */
export const getDisplayAmount = (order) => {
  if (!order) return 0;
  
  // Cancelled orders show 0 for display
  if (order.status === 'cancelled' || order.isCancelled) {
    return 0;
  }
  
  // For billed orders with discount, use finalAmount
  if (order.status === 'billed' && order.discount > 0 && order.finalAmount !== undefined) {
    return order.finalAmount;
  }
  
  // For virtual field from backend (if available)
  if (order.displayAmount !== undefined) {
    return order.displayAmount;
  }
  
  // For all other cases, use totalAmount
  return order.totalAmount || 0;
};

/**
 * Get the revenue amount for an order (only counts billed, non-cancelled orders)
 * @param {Object} order - The order object
 * @returns {number} - The revenue amount
 */
export const getRevenueAmount = (order) => {
  if (!order) return 0;
  
  // Cancelled orders contribute 0 to revenue
  if (order.status === 'cancelled' || order.isCancelled) {
    return 0;
  }
  
  // Only billed orders count towards revenue
  if (order.status !== 'billed') {
    return 0;
  }
  
  // For virtual field from backend (if available)
  if (order.revenueAmount !== undefined) {
    return order.revenueAmount;
  }
  
  // Use finalAmount if discount applied, otherwise totalAmount
  if (order.discount > 0 && order.finalAmount !== undefined) {
    return order.finalAmount;
  }
  
  return order.totalAmount || 0;
};

/**
 * Check if an order has a discount applied
 * @param {Object} order - The order object
 * @returns {boolean} - True if order has discount
 */
export const hasDiscount = (order) => {
  if (!order) return false;
  
  // Check virtual field from backend (if available)
  if (order.hasDiscount !== undefined) {
    return order.hasDiscount;
  }
  
  // Manual check
  return order.status === 'billed' && order.discount > 0;
};

/**
 * Check if an order is cancelled
 * @param {Object} order - The order object
 * @returns {boolean} - True if order is cancelled
 */
export const isCancelled = (order) => {
  if (!order) return false;
  
  // Check virtual field from backend (if available)
  if (order.isCancelled !== undefined) {
    return order.isCancelled;
  }
  
  // Manual check
  return order.status === 'cancelled';
};

/**
 * Check if an order can be cancelled
 * @param {Object} order - The order object
 * @param {Object} user - Current user
 * @returns {boolean} - True if order can be cancelled
 */
export const canCancelOrder = (order, user) => {
  if (!order || !user) return false;
  
  // Only admin can cancel orders
  if (user.role !== 'admin') return false;
  
  // Order must be billed
  if (order.status !== 'billed') return false;
  
  // Order must not already be cancelled
  if (isCancelled(order)) return false;
  
  // Check if order is too old (max 24 hours)
  if (order.billedAt) {
    const orderAge = Date.now() - new Date(order.billedAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (orderAge > maxAge) return false;
  }
  
  return true;
};

/**
 * Get discount information for display
 * @param {Object} order - The order object
 * @returns {Object} - Discount information object
 */
export const getDiscountInfo = (order) => {
  if (!order || !hasDiscount(order)) {
    return {
      hasDiscount: false,
      discountAmount: 0,
      discountType: null,
      discountReason: null
    };
  }
  
  const subtotal = order.subtotal || order.totalAmount || 0;
  const discountValue = order.discount || 0;
  
  let discountAmount = 0;
  if (order.discountType === 'percentage') {
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = discountValue;
  }
  
  return {
    hasDiscount: true,
    discountAmount,
    discountType: order.discountType,
    discountReason: order.discountReason,
    originalAmount: subtotal,
    finalAmount: order.finalAmount || (subtotal - discountAmount)
  };
};

/**
 * Format currency for display
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted amount
 */
export const formatDisplayAmount = (amount) => {
  return (amount || 0).toFixed(2);
};

/**
 * Calculate total revenue from orders considering discounts and excluding cancelled orders
 * @param {Array} orders - Array of order objects
 * @returns {number} - Total revenue after discounts, excluding cancelled
 */
export const calculateTotalRevenue = (orders) => {
  if (!Array.isArray(orders)) return 0;
  
  return orders.reduce((total, order) => total + getRevenueAmount(order), 0);
};

/**
 * Get order amount with discount details for analytics
 * @param {Object} order - The order object
 * @returns {Object} - Amount details for analytics
 */
export const getOrderAmountDetails = (order) => {
  const displayAmount = getDisplayAmount(order);
  const revenueAmount = getRevenueAmount(order);
  const discountInfo = getDiscountInfo(order);
  const cancelled = isCancelled(order);
  
  return {
    displayAmount,
    revenueAmount,
    originalAmount: order.totalAmount || 0,
    hasDiscount: discountInfo.hasDiscount,
    discountAmount: discountInfo.discountAmount,
    discountType: discountInfo.discountType,
    discountReason: discountInfo.discountReason,
    isCancelled: cancelled,
    cancellationReason: order.cancellationReason || null
  };
};