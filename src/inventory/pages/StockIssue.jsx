import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/ui/Card';
import { useDomain } from '../context/DomainContext';

export default function StockIssue() {
  const { domain } = useDomain();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [balances, setBalances] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const [form, setForm] = useState({
    lines: [{ itemId: '', qty: 1 }],
    destinationSection: 'hot_kitchen',
    notes: ''
  });

  const selectedItemIds = useMemo(
    () => Array.from(new Set((form.lines || []).map((l) => l.itemId).filter(Boolean))),
    [form.lines]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/items?itemType=inventory');
        setItems(res.data || []);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [domain]);

  useEffect(() => {
    const loadBalances = async () => {
      if (selectedItemIds.length === 0) {
        setBalances([]);
        return;
      }

      try {
        setLoadingBalances(true);
        const res = await api.get(`/inventory/balances?itemIds=${selectedItemIds.join(',')}`);
        setBalances(res.data?.items || []);
      } catch (e) {
        setBalances([]);
      } finally {
        setLoadingBalances(false);
      }
    };

    loadBalances();
  }, [domain, selectedItemIds.join(',')]);

  const onLineChange = (index, patch) => {
    setForm((prev) => {
      const nextLines = [...(prev.lines || [])];
      nextLines[index] = { ...nextLines[index], ...patch };
      return { ...prev, lines: nextLines };
    });
  };

  const addLine = () => {
    setForm((prev) => ({ ...prev, lines: [...(prev.lines || []), { itemId: '', qty: 1 }] }));
  };

  const removeLine = (index) => {
    setForm((prev) => {
      const nextLines = (prev.lines || []).filter((_, i) => i !== index);
      return { ...prev, lines: nextLines.length ? nextLines : [{ itemId: '', qty: 1 }] };
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    const lines = (form.lines || [])
      .map((l) => ({ itemId: l.itemId, qty: Number(l.qty) }))
      .filter((l) => l.itemId);

    if (lines.length === 0) return toast.error('Select at least one item');
    for (const l of lines) {
      if (!Number.isFinite(l.qty) || l.qty <= 0) return toast.error('All qty values must be > 0');
    }

    try {
      setSubmitting(true);
      const payload = {
        destinationSection: form.destinationSection,
        notes: form.notes
      };

      // Backward-compatible with older backend (single-item API)
      if (lines.length === 1) {
        payload.itemId = lines[0].itemId;
        payload.qty = lines[0].qty;
      }

      // New backend supports bulk issuing
      payload.items = lines;

      const res = await api.post('/inventory/issue', payload);

      toast.success('Stock issued successfully');
      setForm((prev) => ({ ...prev, lines: [{ itemId: '', qty: 1 }], notes: '' }));

      // Reload items so the legacy Inventory UI reflects updated quantities
      try {
        const itemsRes = await api.get('/items?itemType=inventory');
        setItems(itemsRes.data || []);
      } catch {
        // ignore
      }

      // Refresh balances
      if (selectedItemIds.length > 0) {
        try {
          const balRes = await api.get(`/inventory/balances?itemIds=${selectedItemIds.join(',')}`);
          setBalances(balRes.data?.items || []);
        } catch {
          // ignore
        }
      }

      const txnId = res.data?.transaction?._id;
      if (txnId) {
        toast.success(`Txn: ${txnId}`, { duration: 5000 });
      }
    } catch (e2) {
      const msg = e2.response?.data?.message || 'Failed to issue stock';
      if (msg === 'itemId and destinationSection are required') {
        toast.error('Backend is still on old Stock Issue API. Restart backend to enable bulk issue.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white">Stock Issue (Main → Kitchen)</h1>
        <p className="text-slate-400 mt-1">Deducts from Main Inventory and adds to Bakery or Hot Kitchen.</p>
      </div>

      <Card title="Issue Stock">
        {loading ? (
          <div className="text-slate-300">Loading items…</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Destination</label>
                <select
                  className="form-select"
                  value={form.destinationSection}
                  onChange={(e) => setForm((p) => ({ ...p, destinationSection: e.target.value }))}
                >
                  <option value="bakery">Bakery</option>
                  <option value="hot_kitchen">Hot Kitchen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g., Morning transfer"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-300">Items to Issue</div>
                <button
                  type="button"
                  onClick={addLine}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white"
                >
                  + Add Item
                </button>
              </div>

              {(form.lines || []).map((line, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Item</label>
                    <select
                      className="form-select"
                      value={line.itemId}
                      onChange={(e) => onLineChange(idx, { itemId: e.target.value })}
                    >
                      <option value="">Select an item…</option>
                      {items.map((it) => (
                        <option key={it._id} value={it._id}>
                          {it.name} ({it.quantity} {it.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Qty</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      className="form-input"
                      value={line.qty}
                      onChange={(e) => onLineChange(idx, { qty: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-1 flex md:items-end">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="w-full md:w-auto px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/40 border border-slate-700 rounded p-4">
              <div className="text-sm font-medium text-slate-200 mb-2">Balances (Main / Bakery / Hot Kitchen)</div>
              {loadingBalances ? (
                <div className="text-slate-400 text-sm">Loading balances…</div>
              ) : balances.length === 0 ? (
                <div className="text-slate-500 text-sm">Select items to view balances.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-2 pr-3">Item</th>
                        <th className="text-right py-2 px-3">Main</th>
                        <th className="text-right py-2 px-3">Bakery</th>
                        <th className="text-right py-2 pl-3">Hot Kitchen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balances.map((b) => (
                        <tr key={b.itemId} className="border-t border-slate-800">
                          <td className="py-2 pr-3 text-slate-200">
                            {b.name} <span className="text-slate-500">({b.unit})</span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-200">{b.balances?.main ?? 0}</td>
                          <td className="py-2 px-3 text-right text-slate-200">{b.balances?.kitchen_bakery ?? 0}</td>
                          <td className="py-2 pl-3 text-right text-slate-200">{b.balances?.kitchen_hot ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {submitting ? 'Issuing…' : 'Issue Stock'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
