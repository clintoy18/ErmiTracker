export default function DataTable({ columns, rows, emptyMessage = "No records found." }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-brand-100">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-brand-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-brand-700"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-brand-50">
                  {columns.map((column) => (
                    <td
                      key={`${row.id}-${column.key}`}
                      className="px-4 py-3 text-sm text-slate-700"
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
