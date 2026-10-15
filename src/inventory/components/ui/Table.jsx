export default function Table({ columns, data, renderCell, empty = 'No data', className = '' }) {
  return (
    <div className={`table-container ${className}`}>
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900">
          <tr>
            {columns.map((c) => (
              <th 
                key={c.key} 
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
              >
                {c.label || c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
          {data.map((row, index) => (
            <tr key={row._id || row.id || index} className="table-row">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-sm text-slate-100">
                  {c.render ? c.render(row[c.key], row) : (renderCell ? renderCell(row, c) : row[c.key])}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-slate-500">{empty}</div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
