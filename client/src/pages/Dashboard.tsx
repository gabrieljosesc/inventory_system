import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import { getItems } from '../api/items.js';
import { getMovements } from '../api/movements.js';
import { Card } from '../components/Card.js';

export function Dashboard() {
  const { token } = useAuth();

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => getItems(token!),
    enabled: !!token,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', { limit: 10 }],
    queryFn: () => getMovements(token!, { limit: 10 }),
    enabled: !!token,
  });

  const lowStockCount = items.filter(
    (i) => i.quantity <= (i.minQuantity ?? 0)
  ).length;

  const now = Date.now();
  const in7Days = now + 7 * 24 * 60 * 60 * 1000;
  const expiringSoon = items.filter((i) => {
    if (!i.expiryDate) return false;
    const t = new Date(i.expiryDate).getTime();
    return t >= now && t <= in7Days;
  });

  return (
    <>
      <h1>Dashboard</h1>
      <p className="page-description">
        Overview of inventory and recent activity.
      </p>
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-value">{items.length}</p>
          <p className="stat-label">Total items</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">
            <Link to="/reorder">{lowStockCount}</Link>
          </p>
          <p className="stat-label">Low stock</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{expiringSoon.length}</p>
          <p className="stat-label">Expiring in 7 days</p>
          {expiringSoon.length > 0 && (
            <ul className="section-list">
              {expiringSoon.slice(0, 5).map((i) => (
                <li key={i._id}>
                  <Link to={`/items/${i._id}`}>{i.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Card title="Recent movements">
        {movements.length === 0 ? (
          <p style={{ margin: 0 }}>No movements yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {movements.slice(0, 5).map((m) => {
              const item =
                typeof m.itemId === 'object' ? m.itemId?.name : m.itemId;
              return (
                <li key={m._id}>
                  {m.type === 'in' ? '+' : '-'}
                  {m.quantity} {item} {m.reason ? `(${m.reason})` : ''}
                </li>
              );
            })}
          </ul>
        )}
        <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          <Link to="/movements">View all movements</Link>
        </p>
      </Card>
    </>
  );
}
