import { useState, useEffect } from 'react';
import { Users, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './animations.css';

const TableSelection = ({ onTableSelect, currentTable, isLocked = false }) => {
  const [selectedTable, setSelectedTable] = useState(currentTable || null);
  const [showSelection, setShowSelection] = useState(!currentTable && !isLocked);
  
  // Generate table numbers (1-20)
  const tableNumbers = Array.from({ length: 20 }, (_, i) => i + 1);

  useEffect(() => {
    if (currentTable) {
      setSelectedTable(currentTable);
    }
  }, [currentTable]);

  const handleTableSelect = (tableNumber) => {
    if (isLocked) {
      alert('🔒 Table is locked via QR code. Cannot change tables.');
      return;
    }
    
    setSelectedTable(tableNumber);
  };

  const confirmTableSelection = () => {
    if (selectedTable && onTableSelect) {
      onTableSelect(selectedTable);
      setShowSelection(false);
    }
  };

  if (!showSelection && selectedTable) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Table {selectedTable}
          </h3>
          {isLocked && (
            <div className="flex items-center justify-center space-x-2 text-orange-400 mb-4">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Locked via QR Code</span>
            </div>
          )}
          <p className="text-gray-400 mb-6">
            You are seated at table {selectedTable}. Enjoy your dining experience!
          </p>
          {!isLocked && (
            <Button
              onClick={() => setShowSelection(true)}
              variant="outline"
              className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-red-500 transition-all"
            >
              Change Table
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <img 
              src="/Logo W.png" 
              alt="Restaurant Logo" 
              className="w-20 h-20 mx-auto rounded-full object-cover shadow-2xl border-4 border-red-500/30"
            />
            <div className="absolute -inset-1 bg-red-600/30 rounded-full blur-lg -z-10 animate-pulse"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Select Your Table
          </h1>
          <p className="text-gray-400 text-lg">
            Please choose your table number to continue
          </p>
        </div>

        {/* Table Selection Grid */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mb-8">
            {tableNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handleTableSelect(number)}
                className={`
                  relative p-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105
                  ${selectedTable === number
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 border-2 border-red-400'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border-2 border-gray-600/50 hover:border-gray-500'
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Users className="w-6 h-6" />
                  <span>{number}</span>
                </div>
                {selectedTable === number && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Confirm Button */}
          {selectedTable && (
            <div className="text-center">
              <Button
                onClick={confirmTableSelection}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                Confirm Table {selectedTable}
              </Button>
              <p className="text-gray-400 text-sm mt-4">
                You can change your table selection later if needed
              </p>
            </div>
          )}

          {!selectedTable && (
            <div className="text-center">
              <p className="text-gray-400">
                Please select a table number above
              </p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>
            Having trouble? Scan the QR code on your table or ask our staff for assistance.
          </p>
          <p className="mt-2">
            Contact us: <span className="text-red-400">+94 777 66 9191</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TableSelection;