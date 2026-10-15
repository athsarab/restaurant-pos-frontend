# Enhanced Purchase Unit Conversion System

## Problem Solved

Previously, when purchasing inventory items in different units (packets, bottles, bags, etc.), users had to manually calculate the per-kilogram or per-liter price, which was:
- Time-consuming and error-prone
- Not user-friendly
- Led to inconsistent pricing data
- Made it difficult to compare costs across different package sizes

## Solution Overview

The new system allows users to:
1. **Select the actual purchase unit** (e.g., "Packet (5kg)", "Bottle (1L)", "Dozen")
2. **Enter the total price** for that quantity
3. **Automatically calculate** the per-base-unit price (per kg, per liter, etc.)
4. **Store both original purchase data and converted inventory data**

## How It Works

### 1. Unit Conversion Utility (`purchaseUnitConverter.js`)

**Common Purchase Units Supported:**
- **Weight**: kg, g, packets (500g, 1kg, 2kg, 5kg, 10kg, 25kg), bags (20kg, 50kg)
- **Volume**: L, ml, bottles (330ml, 500ml, 1L, 1.5L, 2L), cans, gallons
- **Count**: pieces, dozen, packs (6, 12, 24), boxes (100)

**Key Functions:**
- `getPurchaseUnitsForBaseUnit(baseUnit)` - Gets available purchase units for an item
- `convertPurchaseToBaseUnit(quantity, price, unit, baseUnit)` - Converts purchase to inventory units
- `getSuggestedPurchaseUnits(itemName, baseUnit)` - Suggests common units based on item type

### 2. Enhanced Purchase Modal

**New Fields:**
- **Purchase Unit Selection**: Dropdown with relevant units for the item
- **Total Price**: Instead of unit price, enter the total cost
- **Live Conversion Display**: Shows conversion from purchase unit to base unit
- **Price Breakdown**: Shows price per purchase unit and per base unit

**Example Workflow:**
1. Select "Basmati Rice" (base unit: kg)
2. Choose "Packet (5kg)" as purchase unit
3. Enter quantity: 2 (meaning 2 packets)
4. Enter total price: 2400 LKR
5. System calculates:
   - Total quantity: 10 kg (2 × 5kg)
   - Price per kg: 240 LKR (2400 ÷ 10)
   - Price per packet: 1200 LKR (2400 ÷ 2)

### 3. Data Storage

**Transaction Record:**
```javascript
{
  quantity: 10,           // Base unit quantity (kg)
  unitPrice: 240,         // Price per base unit (LKR/kg)
  purchaseMetadata: {
    purchaseQuantity: 2,    // Original quantity purchased
    purchaseUnit: "packet_5kg", // Original unit
    totalPrice: 2400,       // Total cost
    conversionFactor: 5,    // 1 packet = 5 kg
    purchaseUnitLabel: "Packet (5kg)"
  }
}
```

**Benefits:**
- Inventory tracking remains consistent in base units
- Purchase history preserves original purchase details
- Easy to audit and compare different purchase options

## Real-World Examples

### Example 1: Rice Purchase
- **Item**: Basmati Rice (base unit: kg)
- **Purchase**: 1 bag of 25kg for 6000 LKR
- **Result**: 25kg added to inventory at 240 LKR/kg

### Example 2: Oil Purchase
- **Item**: Coconut Oil (base unit: L)
- **Purchase**: 6 bottles of 1L each for 3600 LKR
- **Result**: 6L added to inventory at 600 LKR/L

### Example 3: Eggs Purchase
- **Item**: Chicken Eggs (base unit: pcs)
- **Purchase**: 3 dozen for 900 LKR
- **Result**: 36 pieces added to inventory at 25 LKR/piece

## Implementation Files

### Frontend
- `src/inventory/utils/purchaseUnitConverter.js` - Core conversion logic
- `src/inventory/pages/Inventory.jsx` - Enhanced purchase modal
- `src/inventory/components/PurchaseUnitDemo.jsx` - Demo component

### Backend
- `src/models/Transaction.js` - Added purchaseMetadata field
- `src/models/Batch.js` - Added purchaseMetadata field

## Usage Instructions

### For End Users
1. Click "Buy Now" on any inventory item
2. Select the appropriate purchase unit from the dropdown
3. Enter the quantity you're buying in that unit
4. Enter the total price you're paying
5. The system automatically shows:
   - How much inventory you'll get in base units
   - The calculated price per base unit
   - Conversion details
6. Complete the purchase with supplier and batch details

### For Developers
```javascript
import { convertPurchaseToBaseUnit } from '../utils/purchaseUnitConverter';

// Convert 2 packets of 5kg at 2400 LKR total to base unit pricing
const result = convertPurchaseToBaseUnit(2, 2400, 'packet_5kg', 'kg');
// Returns: { baseQuantity: 10, baseUnitPrice: 240, conversionFactor: 5 }
```

## Benefits

### For Users
- **No manual calculations** required
- **Clear conversion display** shows exactly what you're getting
- **Flexible purchasing** in any common package size
- **Error reduction** through automated calculations

### For Business
- **Consistent inventory tracking** in standardized units
- **Accurate cost analysis** with proper unit pricing
- **Better supplier comparison** across different package sizes
- **Audit trail** preserving original purchase details
- **Improved reporting** with both purchase and inventory data

## Future Enhancements

1. **Custom Unit Creation**: Allow users to define custom package sizes
2. **Price Comparison**: Show price per base unit across different suppliers
3. **Bulk Discounts**: Handle tiered pricing for quantity discounts
4. **Currency Support**: Multi-currency purchase handling
5. **Barcode Integration**: Scan product barcodes to auto-fill unit information

## Testing

The system includes comprehensive test scenarios for:
- Weight-based items (rice, flour, spices)
- Volume-based items (oils, sauces, beverages)
- Count-based items (eggs, fruits, individual products)
- Edge cases and error handling
- Custom unit conversions

Use the `PurchaseUnitDemo` component to test various scenarios and see real-time conversion calculations.