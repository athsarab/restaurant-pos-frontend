import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import { useDomain } from '../context/DomainContext';

const SECTION_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'kitchen_bakery', label: 'Bakery' },
  { key: 'kitchen_hot', label: 'Hot Kitchen' }
];

const formatDateTime = (value) => {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return '';
  }
};

const summarizeIssueLines = (lines) => {
  const positives = (lines || []).filter((l) => Number(l.qtyChange) > 0);
  if (positives.length === 0) return '';
  return positives
    .map((l) => {
      const name = l.itemId?.name || 'Item';
      const qty = Math.abs(Number(l.qtyChange) || 0);
      const unit = l.unit || l.itemId?.unit || '';
      return `${name}: ${qty} ${unit}`.trim();
    })
    .join(' | ');
};

export default function StockIssueHistory() {
  const { domain } = useDomain();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [section, setSection] = useState('');

  const load = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('type', 'ISSUE');
      params.set('limit', '200');
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (section) params.set('location', section);

      const res = await api.get(`/stock-transactions?${params.toString()}`);
      setItems(res.data?.items || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load issue history');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [domain]);

  const rows = useMemo(() => {
    return (items || []).map((t) => {
      const positives = (t.lines || []).filter((l) => Number(l.qtyChange) > 0);
      const dest = positives?.[0]?.location || '';
      const destLabel = dest === 'kitchen_bakery' ? 'Bakery' : dest === 'kitchen_hot' ? 'Hot Kitchen' : dest;

      return {
        _id: t._id,
        createdAt: t.createdAt,
        destination: destLabel,
        issuedItems: summarizeIssueLines(t.lines),
        notes: t.notes || '',
        createdBy: t.createdBy?.name || t.createdBy?.username || ''
      };
    });
  }, [items]);

  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        label: 'Date',
        render: (v) => <span className="text-slate-200">{formatDateTime(v)}</span>
      },
      { key: 'destination', label: 'Section' },
      { key: 'issuedItems', label: 'Items', sortable: false },
      { key: 'createdBy', label: 'By' },
      { key: 'notes', label: 'Notes', sortable: false }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white">Stock Issue History</h1>
        <p className="text-slate-400 mt-1">Track all Main → Kitchen stock transfers with filters and search.</p>
      </div>

      <Card title="Filters">
        <div className="form-grid">
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Kitchen Section</label>
            <select className="form-select" value={section} onChange={(e) => setSection(e.target.value)}>
              {SECTION_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <button className="btn-primary" onClick={load} disabled={loading}>
              Apply
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setFrom('');
                setTo('');
                setSection('');
                setTimeout(load, 0);
              }}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      <Card title="Issues">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading…</div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            searchPlaceholder="Search destination, items, notes, user..."
            emptyMessage="No stock issues found"
          />
        )}
      </Card>
    </div>
  );
}
