/**
 * Test component to demonstrate the new purchase unit conversion functionality
 * This shows various scenarios of purchasing items in different units
 */

import React, { useState } from 'react';
import { 
  getPurchaseUnitsForBaseUnit, 
  convertPurchaseToBaseUnit, 
  getConversionDisplay,
  getSuggestedPurchaseUnits 
} from '../utils/purchaseUnitConverter';
import { formatQuantity, formatPrice } from '../utils/numberUtils';

const PurchaseUnitDemo = () => {
  const [testScenarios] = useState([
    {
      id: 1,
      itemName: "Basmati Rice",
      baseUnit: "kg",
      scenarios: [
        { purchaseUnit: "packet_5kg", quantity: 2, totalPrice: 2400, description: "2 packets of 5kg each" },
        { purchaseUnit: "bag_25kg", quantity: 1, totalPrice: 5500, description: "1 bag of 25kg" },
        { purchaseUnit: "kg", quantity: 3, totalPrice: 1440, description: "3kg loose" }
      ]
    },
    {
      id: 2,
      itemName: "Coconut Oil",
      baseUnit: "l",
      scenarios: [
        { purchaseUnit: "bottle_1l", quantity: 6, totalPrice: 3600, description: "6 bottles of 1L each" },
        { purchaseUnit: "bottle_500ml", quantity: 12, totalPrice: 3000, description: "12 bottles of 500ml each" },
        { purchaseUnit: "l", quantity: 5, totalPrice: 2750, description: "5L bulk" }
      ]
    },
    {
      id: 3,
      itemName: "Chicken Eggs",
      baseUnit: "pcs",
      scenarios: [
        { purchaseUnit: "dozen", quantity: 3, totalPrice: 900, description: "3 dozens" },
        { purchaseUnit: "pack_24", quantity: 2, totalPrice: 1200, description: "2 packs of 24 pieces" },
        { purchaseUnit: "pcs", quantity: 50, totalPrice: 1250, description: "50 individual pieces" }
      ]
    }
  ]);

  const [selectedItem, setSelectedItem] = useState(testScenarios[0]);
  const [customTest, setCustomTest] = useState({
    purchaseUnit: '',
    quantity: 0,
    totalPrice: 0
  });

  const calculateConversion = (scenario) => {
    try {
      return convertPurchaseToBaseUnit(
        scenario.quantity,
        scenario.totalPrice,
        scenario.purchaseUnit,
        selectedItem.baseUnit
      );
    } catch (error) {
      return { error: error.message };
    }
  };

  const getDisplayInfo = (scenario) => {
    try {
      return getConversionDisplay(
        scenario.purchaseUnit,
        selectedItem.baseUnit,
        scenario.quantity
      );
    } catch (error) {
      return null;
    }
  };

  const availableUnits = getPurchaseUnitsForBaseUnit(selectedItem.baseUnit);
  const suggestedUnits = getSuggestedPurchaseUnits(selectedItem.itemName, selectedItem.baseUnit);

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Purchase Unit Conversion Demo</h1>
          <p className="text-slate-400">
            This demonstrates how the new purchase system handles different units and automatically calculates per-unit prices
          </p>
        </div>

        {/* Item Selection */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Select Test Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {testScenarios.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3 rounded border text-left ${
                  selectedItem.id === item.id 
                    ? 'bg-blue-600 border-blue-500' 
                    : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <div className="font-medium">{item.itemName}</div>
                <div className="text-sm text-slate-400">Base Unit: {item.baseUnit}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Item Info */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Item: {selectedItem.itemName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-slate-300 mb-2">Available Purchase Units</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(availableUnits).map(([key, unit]) => (
                  <div key={key} className="flex justify-between">
                    <span>{unit.label}</span>
                    <span className="text-slate-400">= {unit.factor} {selectedItem.baseUnit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-300 mb-2">Suggested Units for {selectedItem.itemName}</h3>
              <div className="space-y-1 text-sm">
                {suggestedUnits.map(unitKey => (
                  <div key={unitKey} className="flex justify-between">
                    <span className="text-green-400">{availableUnits[unitKey]?.label}</span>
                    <span className="text-slate-400">= {availableUnits[unitKey]?.factor} {selectedItem.baseUnit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Purchase Scenarios</h2>
          <div className="space-y-4">
            {selectedItem.scenarios.map((scenario, index) => {
              const conversion = calculateConversion(scenario);
              const displayInfo = getDisplayInfo(scenario);
              
              return (
                <div key={index} className="bg-slate-700 p-4 rounded border border-slate-600">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Input */}
                    <div>
                      <h4 className="font-medium text-blue-400 mb-2">Purchase Details</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Description:</strong> {scenario.description}</div>
                        <div><strong>Quantity:</strong> {scenario.quantity} {availableUnits[scenario.purchaseUnit]?.label}</div>
                        <div><strong>Total Price:</strong> LKR {formatPrice(scenario.totalPrice)}</div>
                        <div><strong>Price per unit:</strong> LKR {formatPrice(scenario.totalPrice / scenario.quantity)}</div>
                      </div>
                    </div>

                    {/* Conversion */}
                    <div>
                      <h4 className="font-medium text-green-400 mb-2">Conversion</h4>
                      {displayInfo && (
                        <div className="space-y-1 text-sm">
                          <div className="text-yellow-300">{displayInfo.conversionText}</div>
                          <div><strong>Conversion Factor:</strong> {displayInfo.factor}</div>
                        </div>
                      )}
                    </div>

                    {/* Result */}
                    <div>
                      <h4 className="font-medium text-purple-400 mb-2">Inventory Result</h4>
                      {conversion.error ? (
                        <div className="text-red-400 text-sm">{conversion.error}</div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div><strong>Base Quantity:</strong> {formatQuantity(conversion.baseQuantity)} {selectedItem.baseUnit}</div>
                          <div><strong>Unit Price:</strong> LKR {formatPrice(conversion.baseUnitPrice)} per {selectedItem.baseUnit}</div>
                          <div className="text-green-400"><strong>Total Cost:</strong> LKR {formatPrice(scenario.totalPrice)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Test */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Custom Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Purchase Unit</label>
              <select
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                value={customTest.purchaseUnit}
                onChange={(e) => setCustomTest({...customTest, purchaseUnit: e.target.value})}
              >
                <option value="">Select Unit</option>
                {Object.entries(availableUnits).map(([key, unit]) => (
                  <option key={key} value={key}>{unit.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                value={customTest.quantity}
                onChange={(e) => setCustomTest({...customTest, quantity: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Total Price (LKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                value={customTest.totalPrice}
                onChange={(e) => setCustomTest({...customTest, totalPrice: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setCustomTest({purchaseUnit: '', quantity: 0, totalPrice: 0})}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear
              </button>
            </div>
          </div>

          {customTest.purchaseUnit && customTest.quantity > 0 && customTest.totalPrice > 0 && (
            <div className="bg-slate-700 p-4 rounded border border-slate-600">
              <h4 className="font-medium mb-3">Custom Test Result</h4>
              {(() => {
                try {
                  const conversion = convertPurchaseToBaseUnit(
                    customTest.quantity,
                    customTest.totalPrice,
                    customTest.purchaseUnit,
                    selectedItem.baseUnit
                  );
                  const displayInfo = getConversionDisplay(
                    customTest.purchaseUnit,
                    selectedItem.baseUnit,
                    customTest.quantity
                  );

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm space-y-1">
                          <div><strong>Purchase:</strong> {customTest.quantity} {availableUnits[customTest.purchaseUnit]?.label}</div>
                          <div><strong>Total Cost:</strong> LKR {formatPrice(customTest.totalPrice)}</div>
                          <div className="text-yellow-300">{displayInfo?.conversionText}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm space-y-1">
                          <div><strong>Inventory Quantity:</strong> {formatQuantity(conversion.baseQuantity)} {selectedItem.baseUnit}</div>
                          <div><strong>Unit Price:</strong> LKR {formatPrice(conversion.baseUnitPrice)} per {selectedItem.baseUnit}</div>
                          <div><strong>Price per Purchase Unit:</strong> LKR {formatPrice(customTest.totalPrice / customTest.quantity)}</div>
                        </div>
                      </div>
                    </div>
                  );
                } catch (error) {
                  return <div className="text-red-400">{error.message}</div>;
                }
              })()}
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Benefits of the New System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-green-400 mb-2">For Users</h3>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• No manual calculation of unit prices</li>
                <li>• Buy in any common packaging (packets, bottles, bags)</li>
                <li>• Clear conversion display shows exactly what you're getting</li>
                <li>• Automatic suggestions based on item type</li>
                <li>• Supports custom units with conversion factors</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-2">For Business</h3>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Accurate inventory tracking in base units</li>
                <li>• Purchase history shows original purchase details</li>
                <li>• Easy price comparison across different package sizes</li>
                <li>• Consistent pricing calculations</li>
                <li>• Better cost analysis and reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseUnitDemo;