import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/ui/Card';
import { useDomain } from '../context/DomainContext';

export default function ProductionPlanning() {
  const { domain } = useDomain();

  const [menuItems, setMenuItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    menuItemId: '',
    plannedQty: 1,
    producedItemId: '',
    notes: ''
  });

  const selectedMenuItem = useMemo(
    () => menuItems.find((m) => m._id === form.menuItemId),
    [menuItems, form.menuItemId]
  );

  const finishedItems = useMemo(() => {
    const inv = items || [];
    const onlyFinished = inv.filter((i) => i.stockType === 'finished_item');
    return onlyFinished.length ? onlyFinished : inv;
  }, [items]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [menuRes, itemsRes] = await Promise.all([
          api.get('/menu-items'),
          api.get('/items?itemType=inventory')
        ]);
        setMenuItems(menuRes.data || []);
        setItems(itemsRes.data || []);
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
    if (!form.menuItemId) return toast.error('Select a menu item');

    const plannedQty = Number(form.plannedQty);
    if (!Number.isFinite(plannedQty) || plannedQty <= 0) return toast.error('plannedQty must be > 0');

    if (!form.producedItemId) {
      return toast.error('Select produced item (finished stock)');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/inventory/issue-by-recipe', {
        menuItemId: form.menuItemId,
        plannedQty,
        producedItemId: form.producedItemId,
        notes: form.notes
      });

      toast.success('Production planned and stock updated');

      const productionId = res.data?.production?._id;
      const txnId = res.data?.transaction?._id;
      if (productionId) toast.success(`Production: ${productionId}`, { duration: 5000 });
      if (txnId) toast.success(`Txn: ${txnId}`, { duration: 5000 });

      setForm((p) => ({ ...p, plannedQty: 1, notes: '' }));
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to run production planning');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white">Issue by Recipe (Production Planning)</h1>
        <p className="text-slate-400 mt-1">
          Deducts ingredients from Main Inventory and adds finished stock to Bakery.
        </p>
      </div>

      <Card title="Production Planning">
        {loading ? (
          <div className="text-slate-300">Loading…</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Menu Item</label>
                <select
                  className="form-select"
                  value={form.menuItemId}
                  onChange={(e) => setForm((p) => ({ ...p, menuItemId: e.target.value }))}
                >
                  <option value="">Select menu item…</option>
                  {menuItems.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
                {selectedMenuItem && (
                  <div className="mt-1 text-xs text-slate-500">
                    Recipe ingredients: {selectedMenuItem.ingredients?.length || 0}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Produced Item (Bakery finished stock)</label>
                <select
                  className="form-select"
                  value={form.producedItemId}
                  onChange={(e) => setForm((p) => ({ ...p, producedItemId: e.target.value }))}
                >
                  <option value="">Select produced item…</option>
                  {finishedItems.map((it) => (
                    <option key={it._id} value={it._id}>
                      {it.name} {it.stockType === 'finished_item' ? '(finished)' : ''}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-slate-500">
                  Tip: set the item’s Stock Type to “Finished Item” in Inventory.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Planned Qty</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  value={form.plannedQty}
                  onChange={(e) => setForm((p) => ({ ...p, plannedQty: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g., Tomorrow morning bake"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {submitting ? 'Processing…' : 'Run Production Planning'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
