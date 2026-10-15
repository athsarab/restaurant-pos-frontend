import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/ui/Card';
import { useDomain } from '../context/DomainContext';

export default function BakeryProductionEntry() {
  const { domain } = useDomain();

  const [items, setItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    producedItemId: '',
    menuItemId: '',
    preparedQty: 1,
    notes: ''
  });

  const producedOptions = useMemo(() => {
    const inv = items || [];
    const finished = inv.filter((i) => i.stockType === 'finished_item');
    return finished.length ? finished : inv;
  }, [items]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [itemsRes, menuRes] = await Promise.all([
          api.get('/items?itemType=inventory'),
          api.get('/menu-items')
        ]);
        setItems(itemsRes.data || []);
        setMenuItems(menuRes.data || []);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [domain]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.producedItemId) return toast.error('Select produced item');

    const preparedQty = Number(form.preparedQty);
    if (!Number.isFinite(preparedQty) || preparedQty <= 0) return toast.error('preparedQty must be > 0');

    try {
      setSubmitting(true);
      const res = await api.post('/production/entry', {
        producedItemId: form.producedItemId,
        menuItemId: form.menuItemId || undefined,
        preparedQty,
        notes: form.notes
      });

      toast.success('Production entry saved');
      const prodId = res.data?.production?._id;
      const txnId = res.data?.transaction?._id;
      if (prodId) toast.success(`Production: ${prodId}`, { duration: 5000 });
      if (txnId) toast.success(`Txn: ${txnId}`, { duration: 5000 });

      setForm((p) => ({ ...p, preparedQty: 1, notes: '' }));
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to save production entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white">Bakery Production Entry</h1>
        <p className="text-slate-400 mt-1">Manually increase finished item stock in Bakery inventory.</p>
      </div>

      <Card title="Prepared Qty Entry">
        {loading ? (
          <div className="text-slate-300">Loading…</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Produced Item</label>
                <select
                  className="form-select"
                  value={form.producedItemId}
                  onChange={(e) => setForm((p) => ({ ...p, producedItemId: e.target.value }))}
                >
                  <option value="">Select item…</option>
                  {producedOptions.map((it) => (
                    <option key={it._id} value={it._id}>
                      {it.name} {it.stockType === 'finished_item' ? '(finished)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Linked Menu Item (optional)</label>
                <select
                  className="form-select"
                  value={form.menuItemId}
                  onChange={(e) => setForm((p) => ({ ...p, menuItemId: e.target.value }))}
                >
                  <option value="">None</option>
                  {menuItems.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Prepared Qty</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className="form-input"
                  value={form.preparedQty}
                  onChange={(e) => setForm((p) => ({ ...p, preparedQty: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
