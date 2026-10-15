import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import { useDomain } from '../context/DomainContext';

const LOCATION_OPTIONS = [
  { key: 'kitchen_bakery', label: 'Bakery Kitchen Stock' },
  { key: 'kitchen_hot', label: 'Hot Kitchen Stock' }
];

export default function KitchenInventory() {
  const { domain } = useDomain();

  const [location, setLocation] = useState('kitchen_hot');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const locationLabel = useMemo(
    () => LOCATION_OPTIONS.find((o) => o.key === location)?.label || 'Kitchen Stock',
    [location]
  );

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/inventory/location/${location}`);
      setRows(res.data?.items || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load kitchen inventory');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [domain, location]);

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Item' },
      { key: 'qty', label: 'Available Qty' },
      { key: 'unit', label: 'Unit', sortable: false }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white">Kitchen Inventory</h1>
        <p className="text-slate-400 mt-1">
          Kitchen stock is tracked separately from Main Inventory. Use this screen to see what is currently available in each kitchen section.
        </p>
      </div>

      <Card title="Kitchen Section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Section</label>
            <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATION_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-end justify-end">
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white"
            >
              Refresh
            </button>
          </div>
        </div>
      </Card>

      <Card title={locationLabel}>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading…</div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            searchPlaceholder="Search items..."
            emptyMessage="No items available in this section"
          />
        )}
      </Card>
    </div>
  );
}
