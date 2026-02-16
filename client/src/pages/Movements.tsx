import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import {
  getMovements,
  exportMovementsCsv,
  type StockMovement,
} from '../api/movements.js';
import { useToast } from '../context/ToastContext.js';
import { Card } from '../components/Card.js';

export function Movements() {
  const { token } = useAuth();
  const toast = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: movements = [], isLoading } = useQuery({
    queryKey: [
      'movements',
      { limit: 100, from: from || undefined, to: to || undefined },
    ],
    queryFn: () =>
      getMovements(token!, {
        limit: 100,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
    enabled: !!token,
  });

  const itemName = (m: StockMovement) =>
    typeof m.itemId === 'object' ? m.itemId?.name : m.itemId;

  const handleExport = async () => {
    try {
      await exportMovementsCsv(token!, {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      });
      toast.success('Export started');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <>
      <h1>Movements</h1>
      <p className="page-description">
        Stock in and out history. Filter by date and export to CSV.
      </p>
      <Card>
        <div className="filters-bar">
          <label>From date</label>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ width: 'auto' }}
          />
          <label>To date</label>
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ width: 'auto' }}
          />
          <button type="button" className="btn" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </Card>
      <Card>
        {isLoading ? (
          <p>Loading...</p>
        ) : movements.length === 0 ? (
          <p style={{ margin: 0 }}>No movements recorded.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m._id}>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                    <td>{itemName(m)}</td>
                    <td>{m.type}</td>
                    <td>
                      {m.type === 'in' ? '+' : '-'}
                      {m.quantity}
                    </td>
                    <td>{m.reason ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
