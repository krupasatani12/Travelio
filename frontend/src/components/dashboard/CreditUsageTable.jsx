import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

const CreditUsageTable = ({ data }) => {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'service',
        header: 'Service',
        cell: (info) => {
          const val = info.getValue();
          // format nicely if needed
          return <span style={{ textTransform: 'capitalize' }}>{val.replace('_', ' ')}</span>;
        }
      },
      {
        accessorKey: 'creditsUsed',
        header: 'Credits Used',
        cell: (info) => <span style={{ fontWeight: 'bold' }}>-{info.getValue()}</span>
      },
      {
        accessorKey: 'date',
        header: 'Date & Time',
        cell: (info) => new Date(info.getValue()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      }
    ],
    []
  );

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
      sorting: [{ id: 'date', desc: true }],
    },
  });

  if (!data || data.length === 0) {
    return <p className="text-muted">No credit usage history.</p>;
  }

  return (
    <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {headerGroup.headers.map(header => (
                <th key={header.id} style={{ padding: '0.75rem', cursor: header.column.getCanSort() ? 'pointer' : 'default' }} onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() ? (header.column.getIsSorted() === 'desc' ? ' 🔽' : ' 🔼') : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.getPageCount() > 1 && (
        <div className="pagination-controls d-flex justify-content-between align-items-center mt-3">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="btn btn-sm btn-outline"
          >
            Previous
          </button>
          <span style={{ fontSize: '0.9rem' }}>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="btn btn-sm btn-outline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CreditUsageTable;
