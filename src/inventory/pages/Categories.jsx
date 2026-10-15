import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: '' });

  const load = async () => {
    const res = await api.get('/categories');
    setRows(res.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.unit) return;
    await api.post('/categories', form);
    setOpen(false);
    setForm({ name: '', unit: '' });
    load();
  };

  return (
    <Card title="Categories" actions={<button className="px-3 py-2 rounded bg-primary-600" onClick={() => setOpen(true)}>Add</button>}>
      <Table
        columns={[{ key: 'name', title: 'Name' }, { key: 'unit', title: 'Unit' }]}
        data={rows}
      />
      <Modal open={open} title="Add Category" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Unit</label>
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded bg-slate-700" onClick={() => setOpen(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-primary-600" onClick={save}>Save</button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
