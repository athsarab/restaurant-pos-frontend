import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Requests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get('/requests').then((r) => setRequests(r.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Requests</h1>
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr>
              {['Item', 'Qty', 'Status', 'Requested At'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {requests.map((rq) => (
              <tr key={rq._id}>
                <td className="px-4 py-2">{rq.itemId?.name || rq.itemId}</td>
                <td className="px-4 py-2">{rq.qty}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded ${rq.status === 'approved' ? 'bg-green-500/10 text-green-400' : rq.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{rq.status}</span>
                </td>
                <td className="px-4 py-2 text-slate-400">{new Date(rq.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
