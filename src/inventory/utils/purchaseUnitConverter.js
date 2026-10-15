/**
 * Utility for handling different purchase units and converting them to base inventory units
 */

import { safeMultiply, safeDivide, roundToPrecision } from './numberUtils';

/**
 * Common unit conversions and purchase packages
 */
export const COMMON_PURCHASE_UNITS = {
  weight: {
    kg: {
      label: 'Kilogram (kg)',
      baseUnit: 'kg',
      factor: 1,
      type: 'weight'
    },
    g: {
      label: 'Gram (g)',
      baseUnit: 'kg',
      factor: 0.001,
      type: 'weight'
    },
    lb: {
      label: 'Pound (lb)',
      baseUnit: 'kg',
      factor: 0.453592,
      type: 'weight'
    },
    packet_500g: {
      label: 'Packet (500g)',
      baseUnit: 'kg',
      factor: 0.5,
      type: 'weight'
    },
    packet_1kg: {
      label: 'Packet (1kg)',
      baseUnit: 'kg',
      factor: 1,
      type: 'weight'
    },
    packet_2kg: {
      label: 'Packet (2kg)',
      baseUnit: 'kg',
      factor: 2,
      type: 'weight'
    },
    packet_5kg: {
      label: 'Packet (5kg)',
      baseUnit: 'kg',
      factor: 5,
      type: 'weight'
    },
    packet_10kg: {
      label: 'Packet (10kg)',
      baseUnit: 'kg',
      factor: 10,
      type: 'weight'
    },
    packet_25kg: {
      label: 'Packet (25kg)',
      baseUnit: 'kg',
      factor: 25,
      type: 'weight'
    },
    bag_20kg: {
      label: 'Bag (20kg)',
      baseUnit: 'kg',
      factor: 20,
      type: 'weight'
    },
    bag_50kg: {
      label: 'Bag (50kg)',
      baseUnit: 'kg',
      factor: 50,
      type: 'weight'
    }
  },
  volume: {
    l: {
      label: 'Liter (L)',
      baseUnit: 'l',
      factor: 1,
      type: 'volume'
    },
    ml: {
      label: 'Milliliter (ml)',
      baseUnit: 'l',
      factor: 0.001,
      type: 'volume'
    },
    bottle_330ml: {
      label: 'Bottle (330ml)',
      baseUnit: 'l',
      factor: 0.33,
      type: 'volume'
    },
    bottle_500ml: {
      label: 'Bottle (500ml)',
      baseUnit: 'l',
      factor: 0.5,
      type: 'volume'
    },
    bottle_1l: {
      label: 'Bottle (1L)',
      baseUnit: 'l',
      factor: 1,
      type: 'volume'
    },
    bottle_1_5l: {
      label: 'Bottle (1.5L)',
      baseUnit: 'l',
      factor: 1.5,
      type: 'volume'
    },
    bottle_2l: {
      label: 'Bottle (2L)',
      baseUnit: 'l',
      factor: 2,
      type: 'volume'
    },
    can_330ml: {
      label: 'Can (330ml)',
      baseUnit: 'l',
      factor: 0.33,
      type: 'volume'
    },
    can_500ml: {
      label: 'Can (500ml)',
      baseUnit: 'l',
      factor: 0.5,
      type: 'volume'
    },
    gallon: {
      label: 'Gallon (3.785L)',
      baseUnit: 'l',
      factor: 3.785,
      type: 'volume'
    }
  },
  count: {
    pcs: {
      label: 'Pieces',
      baseUnit: 'pcs',
      factor: 1,
      type: 'count'
    },
    dozen: {
      label: 'Dozen (12 pcs)',
      baseUnit: 'pcs',
      factor: 12,
      type: 'count'
    },
    pack_6: {
      label: 'Pack (6 pcs)',
      baseUnit: 'pcs',
      factor: 6,
      type: 'count'
    },
    pack_12: {
      label: 'Pack (12 pcs)',
      baseUnit: 'pcs',
      factor: 12,
      type: 'count'
    },
    pack_24: {
      label: 'Pack (24 pcs)',
      baseUnit: 'pcs',
      factor: 24,
      type: 'count'
    },
    box_100: {
      label: 'Box (100 pcs)',
      baseUnit: 'pcs',
      factor: 100,
      type: 'count'
    }
  }
};

/**
 * Get purchase units based on the item's base unit
 * @param {string} baseUnit - The item's base unit (kg, l, pcs, etc.)
 * @returns {object} - Available purchase units for this base unit
 */
export const getPurchaseUnitsForBaseUnit = (baseUnit) => {
  const normalizedBaseUnit = baseUnit.toLowerCase();
  
  if (normalizedBaseUnit === 'kg' || normalizedBaseUnit === 'g') {
    return COMMON_PURCHASE_UNITS.weight;
  } else if (normalizedBaseUnit === 'l' || normalizedBaseUnit === 'ml' || normalizedBaseUnit === 'liter' || normalizedBaseUnit === 'liters') {
    return COMMON_PURCHASE_UNITS.volume;
  } else if (normalizedBaseUnit === 'pcs' || normalizedBaseUnit === 'pieces' || normalizedBaseUnit === 'items') {
    return COMMON_PURCHASE_UNITS.count;
  } else {
    // For other units, create a custom conversion
    return {
      [normalizedBaseUnit]: {
        label: `${baseUnit} (Base Unit)`,
        baseUnit: normalizedBaseUnit,
        factor: 1,
        type: 'custom'
      }
    };
  }
};

/**
 * Convert purchase quantity and price to base unit values
 * @param {number} purchaseQuantity - Quantity in purchase unit
 * @param {number} purchasePrice - Total price for the purchase quantity
 * @param {string} purchaseUnit - The purchase unit key
 * @param {string} baseUnit - The item's base unit
 * @returns {object} - Converted values for base unit
 */
export const convertPurchaseToBaseUnit = (purchaseQuantity, purchasePrice, purchaseUnit, baseUnit) => {
  const availableUnits = getPurchaseUnitsForBaseUnit(baseUnit);
  const unitData = availableUnits[purchaseUnit];
  
  if (!unitData) {
    throw new Error(`Purchase unit ${purchaseUnit} not found for base unit ${baseUnit}`);
  }
  
  // Calculate quantity in base unit
  const baseQuantity = safeMultiply(purchaseQuantity, unitData.factor);
  
  // Calculate unit price in base unit (price per base unit)
  const baseUnitPrice = safeDivide(purchasePrice, baseQuantity, 4); // More precision for price
  
  return {
    baseQuantity: roundToPrecision(baseQuantity, 3),
    baseUnitPrice: roundToPrecision(baseUnitPrice, 4),
    conversionFactor: unitData.factor,
    purchaseUnitLabel: unitData.label
  };
};

/**
 * Calculate total cost for a purchase
 * @param {number} quantity - Quantity to purchase
 * @param {number} unitPrice - Price per unit
 * @returns {number} - Total cost
 */
export const calculateTotalCost = (quantity, unitPrice) => {
  return roundToPrecision(safeMultiply(quantity, unitPrice), 2);
};

/**
 * Get unit conversion display info
 * @param {string} purchaseUnit - Purchase unit key
 * @param {string} baseUnit - Base unit
 * @param {number} quantity - Quantity in purchase unit
 * @returns {object} - Display information
 */
export const getConversionDisplay = (purchaseUnit, baseUnit, quantity) => {
  const availableUnits = getPurchaseUnitsForBaseUnit(baseUnit);
  const unitData = availableUnits[purchaseUnit];
  
  if (!unitData) return null;
  
  const baseQuantity = safeMultiply(quantity, unitData.factor);
  
  return {
    purchaseDisplay: `${quantity} ${unitData.label}`,
    baseDisplay: `${formatQuantity(baseQuantity)} ${baseUnit}`,
    conversionText: `${quantity} ${unitData.label} = ${formatQuantity(baseQuantity)} ${baseUnit}`,
    factor: unitData.factor
  };
};

/**
 * Create a custom purchase unit
 * @param {string} unitName - Name of the custom unit
 * @param {string} baseUnit - Base unit for conversion
 * @param {number} conversionFactor - How many base units this custom unit contains
 * @returns {object} - Custom unit definition
 */
export const createCustomPurchaseUnit = (unitName, baseUnit, conversionFactor) => {
  return {
    label: unitName,
    baseUnit: baseUnit,
    factor: conversionFactor,
    type: 'custom'
  };
};

/**
 * Format quantity for display - keeps trailing zeros for user clarity
 */
const formatQuantity = (value, maxDecimals = 3) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.000';
  }
  
  const multiplier = Math.pow(10, maxDecimals);
  const rounded = Math.round(value * multiplier) / multiplier;
  
  // Keep trailing zeros for better user understanding (e.g., 0.200 instead of 0.2)
  return rounded.toFixed(maxDecimals);
};

/**
 * Validate purchase unit conversion
 * @param {string} purchaseUnit - Purchase unit key
 * @param {string} baseUnit - Base unit
 * @returns {boolean} - Whether the conversion is valid
 */
export const isValidPurchaseUnit = (purchaseUnit, baseUnit) => {
  const availableUnits = getPurchaseUnitsForBaseUnit(baseUnit);
  return purchaseUnit in availableUnits;
};

/**
 * Get suggestions for purchase units based on common packages
 * @param {string} itemName - Name of the item
 * @param {string} baseUnit - Base unit
 * @returns {array} - Suggested purchase unit keys
 */
export const getSuggestedPurchaseUnits = (itemName, baseUnit) => {
  const normalizedName = itemName.toLowerCase();
  const availableUnits = getPurchaseUnitsForBaseUnit(baseUnit);
  const unitKeys = Object.keys(availableUnits);
  
  // Suggest based on item name patterns
  const suggestions = [];
  
  if (normalizedName.includes('rice') || normalizedName.includes('flour') || normalizedName.includes('sugar')) {
    suggestions.push('packet_1kg', 'packet_5kg', 'bag_20kg', 'bag_50kg');
  } else if (normalizedName.includes('oil') || normalizedName.includes('sauce') || normalizedName.includes('vinegar')) {
    suggestions.push('bottle_500ml', 'bottle_1l', 'bottle_2l');
  } else if (normalizedName.includes('spice') || normalizedName.includes('powder')) {
    suggestions.push('packet_500g', 'packet_1kg');
  } else if (normalizedName.includes('water') || normalizedName.includes('juice')) {
    suggestions.push('bottle_500ml', 'bottle_1l', 'bottle_1_5l');
  }
  
  // Filter suggestions to only include available units and add base unit
  const validSuggestions = suggestions.filter(unit => unitKeys.includes(unit));
  
  // Always include the base unit first
  const baseUnitKey = unitKeys.find(key => availableUnits[key].factor === 1);
  if (baseUnitKey && !validSuggestions.includes(baseUnitKey)) {
    validSuggestions.unshift(baseUnitKey);
  }
  
  return validSuggestions.length > 0 ? validSuggestions : [baseUnitKey || unitKeys[0]];
};