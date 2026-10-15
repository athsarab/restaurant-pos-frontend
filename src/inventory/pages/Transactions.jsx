import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import { useDomain } from '../context/DomainContext';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, WrenchScrewdriverIcon, TrashIcon, ArrowsRightLeftIcon, BanknotesIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function Transactions() {
  const { domain } = useDomain();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = { domain };
      if (from) params.from = from;
      if (to) params.to = to;
      if (typeFilter) params.type = typeFilter;
      
      const res = await api.get('/transactions', { params });
      setTransactions(res.data);
      setFilteredTransactions([...res.data]); // Create new array
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [domain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply filters when search query changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    let filtered = [...transactions]; // Create a new array to trigger re-render
    
    if (from) {
      filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(from));
    }
    
    if (to) {
      filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(to + 'T23:59:59'));
    }
    
    if (typeFilter) {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const itemName = t.itemId?.name?.toLowerCase() || '';
        const supplierName = t.supplierId?.name?.toLowerCase() || t.supplier?.toLowerCase() || '';
        const userName = t.userId?.name?.toLowerCase() || '';
        const notes = (t.notes || t.note || '').toLowerCase();
        const reason = (t.reason || '').toLowerCase();
        const type = t.type.toLowerCase();
        
        return itemName.includes(searchLower) ||
               supplierName.includes(searchLower) ||
               userName.includes(searchLower) ||
               notes.includes(searchLower) ||
               reason.includes(searchLower) ||
               type.includes(searchLower);
      });
    }
    
    setFilteredTransactions(filtered);
  };

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setTypeFilter('');
    setSearchQuery('');
    setFilteredTransactions([...transactions]); // Create new array to trigger re-render
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'input': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'output': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'usage': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'wastage': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'transfer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'kot_order': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'meal_preparation': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'input': return <ArrowDownTrayIcon className="w-4 h-4" />; // Purchase/Stock In
      case 'output': return <ArrowUpTrayIcon className="w-4 h-4" />; // Goods Out
      case 'usage': return <WrenchScrewdriverIcon className="w-4 h-4" />; // Kitchen Usage
      case 'wastage': return <TrashIcon className="w-4 h-4" />; // Wastage
      case 'transfer': return <ArrowsRightLeftIcon className="w-4 h-4" />; // Transfer
      case 'kot_order': return <ClipboardDocumentListIcon className="w-4 h-4" />; // KOT Order
      case 'meal_preparation': return <WrenchScrewdriverIcon className="w-4 h-4" />; // Meal Preparation
      default: return <BanknotesIcon className="w-4 h-4" />;
    }
  };

  const columns = [
    { 
      key: 'timestamp', 
      label: 'Date & Time',
      render: (_, transaction) => (
        <div>
          <div className="font-medium">
            {new Date(transaction.timestamp).toLocaleDateString()}
          </div>
          <div className="text-sm text-slate-400">
            {new Date(transaction.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    { 
      key: 'type', 
      label: 'Type',
      render: (_, transaction) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded border font-medium ${getTypeColor(transaction.type)}`}>
          {getTypeIcon(transaction.type)}
          <span>{transaction.type.toUpperCase()}</span>
        </span>
      )
    },
    { 
      key: 'item', 
      label: 'Item',
      render: (_, transaction) => (
        <div>
          <div className="font-medium">{transaction.itemId?.name || 'Unknown Item'}</div>
          <div className="text-sm text-slate-400">
            {transaction.itemId?.categoryId?.name || 'No Category'}
          </div>
        </div>
      )
    },
    { 
      key: 'quantity', 
      label: 'Quantity',
      render: (_, transaction) => (
        <div className="font-medium">
          <span className={transaction.type === 'input' ? 'text-green-400' : 'text-orange-400'}>
            {transaction.type === 'input' ? '+' : '-'}{transaction.quantity}
          </span>
          <span className="text-slate-400 ml-1">{transaction.itemId?.unit}</span>
        </div>
      )
    },
    { 
      key: 'cost', 
      label: 'Cost',
      render: (_, transaction) => (
        <div>
          {transaction.unitPrice && transaction.quantity && (
            <>
              <div className="font-medium text-green-400">
                LKR {(transaction.quantity * transaction.unitPrice).toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">
                @ LKR {transaction.unitPrice.toLocaleString()}/{transaction.itemId?.unit || 'unit'}
              </div>
            </>
          )}
          {transaction.totalAmount && !transaction.unitPrice && (
            <div className="font-medium text-green-400">
              LKR {transaction.totalAmount.toLocaleString()}
            </div>
          )}
          {!transaction.unitPrice && !transaction.totalAmount && (
            <span className="text-slate-500">-</span>
          )}
        </div>
      )
    },
    { 
      key: 'details', 
      label: 'Details',
      render: (_, transaction) => (
        <div className="space-y-1">
          {/* Supplier Information */}
          {(transaction.supplierId?.name || transaction.supplier) && (
            <div className="text-sm text-slate-300">
              <span className="text-slate-400">Supplier:</span> {transaction.supplierId?.name || transaction.supplier}
              {transaction.supplierId?.contactPerson && (
                <span className="text-slate-500 ml-1">({transaction.supplierId.contactPerson})</span>
              )}
            </div>
          )}
          
          {/* User Information */}
          {transaction.userId && (
            <div className="text-sm text-slate-400">
              <span className="text-slate-500">By:</span> {transaction.userId.name} 
              <span className="text-slate-500 ml-1">({transaction.userId.role})</span>
            </div>
          )}
          
          {/* Reason for output/wastage */}
          {transaction.reason && (
            <div className="text-sm text-orange-300">
              <span className="text-slate-400">Reason:</span> {transaction.reason}
            </div>
          )}
          
          {/* Notes */}
          {transaction.notes && (
            <div className="text-sm text-slate-400">
              <span className="text-slate-500">Notes:</span> {transaction.notes}
            </div>
          )}
          {transaction.note && !transaction.notes && (
            <div className="text-sm text-slate-400">
              <span className="text-slate-500">Note:</span> {transaction.note}
            </div>
          )}
        </div>
      )
    }
  ];

  // Calculate totals based on filtered transactions
  const totals = filteredTransactions.reduce((acc, t) => {
    // For purchases/inputs with cost information
    if (t.type === 'input') {
      let cost = 0;
      if (t.unitPrice && t.quantity) {
        cost = t.quantity * t.unitPrice;
      } else if (t.totalAmount) {
        cost = t.totalAmount;
      }
      acc.purchases += cost;
      acc.totalCost += cost;
    }
    return acc;
  }, { purchases: 0, totalCost: 0 });

  const transactionCounts = filteredTransactions.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Transaction History</h1>
        <div className="text-sm text-slate-400">
          Total: {filteredTransactions.length} transactions
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="min-h-[100px]">
          <div className="text-slate-400 text-sm font-medium">Purchases</div>
          <div className="text-2xl font-bold text-green-400 mt-2">{transactionCounts.input || 0}</div>
        </Card>
        <Card className="min-h-[100px]">
          <div className="text-slate-400 text-sm font-medium">Goods Out</div>
          <div className="text-2xl font-bold text-orange-400 mt-2">{transactionCounts.output || 0}</div>
        </Card>
        <Card className="min-h-[100px]">
          <div className="text-slate-400 text-sm font-medium">Usage</div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{transactionCounts.usage || 0}</div>
        </Card>
        <Card className="min-h-[100px]">
          <div className="text-slate-400 text-sm font-medium">Wastage</div>
          <div className="text-2xl font-bold text-red-400 mt-2">{transactionCounts.wastage || 0}</div>
        </Card>
        <Card className="min-h-[100px] sm:col-span-2 lg:col-span-1">
          <div className="text-slate-400 text-sm font-medium">Total Cost</div>
          <div className="text-2xl font-bold text-red-400 mt-2">LKR {totals.totalCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Purchase transactions only</div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card title="Search Transactions">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by item name, supplier, user, notes, or transaction type..."
                className="form-input pl-10"
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
          <div className="text-sm text-slate-400 whitespace-nowrap">
            {searchQuery && (
              <span className="text-red-400">{filteredTransactions.length} results found</span>
            )}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card title="Advanced Filters">
        <div className="form-grid">
          <div>
            <label className="form-label">From Date</label>
            <input 
              type="date" 
              className="form-input"
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input 
              type="date" 
              className="form-input"
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
            />
          </div>
          <div>
            <label className="form-label">Transaction Type</label>
            <select 
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="input">Purchase (Input)</option>
              <option value="output">Goods Out</option>
              <option value="usage">Usage</option>
              <option value="wastage">Wastage</option>
              <option value="kot_order">KOT Order</option>
              <option value="meal_preparation">Meal Preparation</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn-primary"
              onClick={applyFilters}
              disabled={loading}
            >
              Apply Filters
            </button>
            <button 
              className="btn-secondary"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card title="All Transactions">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading transactions...</div>
        ) : (
          <DataTable 
            data={filteredTransactions} 
            columns={columns}
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            searchPlaceholder="Search transactions..."
            footer={(displayedData) => {
              const totalQuantity = displayedData.reduce((sum, t) => sum + (t.quantity || 0), 0);
              return (
                <tr className="bg-slate-800/50">
                  <td colSpan="3" className="px-6 py-4 text-right font-semibold text-slate-300">
                    Total Quantity:
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    {totalQuantity.toFixed(3)}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              );
            }}
          />
        )}
        
        {!loading && filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No transactions found matching your criteria.
          </div>
        )}
      </Card>
    </div>
  );
}
