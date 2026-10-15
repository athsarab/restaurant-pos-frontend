import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import api from '../services/api';
import Card from '../components/ui/Card';

export default function Reports() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const tx = await api.get('/transactions?limit=200');
        // simple aggregation demo: per day sums
        const perDay = {};
        tx.data.forEach((t) => {
          const d = new Date(t.timestamp).toLocaleDateString('en-CA');
          perDay[d] ||= { date: d, purchase: 0, usage: 0 };
          perDay[d][t.type === 'input' ? 'purchase' : 'usage'] += t.qty;
        });
        setData(Object.values(perDay).sort((a, b) => a.date.localeCompare(b.date)));
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="📊 Inventory Reports">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Analyze inventory trends and usage patterns</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              View Inventory Report
            </button>
          </div>
        </Card>
        
        <Card title=" Cost Analysis">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Track costs and spending patterns</p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
              View Cost Analysis
            </button>
          </div>
        </Card>
      </div>

      {/* Purchase vs Usage Chart */}
      <Card title="Purchase vs Usage Analysis">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
              <Legend />
              <Bar dataKey="purchase" fill="#00bfb3" name="Purchases" />
              <Bar dataKey="usage" fill="#f59e0b" name="Usage" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
