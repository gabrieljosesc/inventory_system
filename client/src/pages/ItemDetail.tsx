import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import { getItem } from '../api/items.js';
import { getMovements, createMovement } from '../api/movements.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { useToast } from '../context/ToastContext.js';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', { itemId: id }],
    queryFn: () => getMovements(token!, { itemId: id! }),
    enabled: !!token && !!id,
  });

  const movementMut = useMutation({
    mutationFn: (data: { itemId: string; type: 'in' | 'out'; quantity: number; reason?: string }) =>
      createMovement(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      setQuantity('');
      setReason('');
      toast.success('Movement recorded');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(quantity);
    if (!id || !Number.isFinite(q) || q <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    movementMut.mutate({
      itemId: id,
      type,
      quantity: q,
      reason: reason || undefined,
    });
  };

  if (!id) {
    navigate('/items');
    return null;
  }
  if (isLoading || !item) {
    return <p>Loading...</p>;
  }

  const categoryName = typeof item.categoryId === 'object' ? item.categoryId?.name : '-';

  return (
    <>
      <div className="page-head">
        <h1>{item.name}</h1>
        <Button onClick={() => navigate('/items')}>Back to items</Button>
      </div>
      <Card>
        <p><strong>Category:</strong> {categoryName}</p>
        <p><strong>Unit:</strong> {item.unit}</p>
        <p><strong>Quantity:</strong> {item.quantity}</p>
        <p><strong>Min quantity:</strong> {item.minQuantity}</p>
        {item.supplier && <p><strong>Supplier:</strong> {item.supplier}</p>}
        {item.expiryDate && (
          <p><strong>Expiry:</strong> {new Date(item.expiryDate).toLocaleDateString()}</p>
        )}
      </Card>
      <Card title="Record movement">
        <form onSubmit={handleSubmit}>
          <div className="input-wrap">
            <label>Type</label>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value as 'in' | 'out')}
            >
              <option value="in">Stock in</option>
              <option value="out">Stock out</option>
            </select>
          </div>
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" disabled={movementMut.isPending}>
            Record
          </Button>
        </form>
      </Card>
      <Card title="Movement history">
        {movements.length === 0 ? (
          <p style={{ margin: 0 }}>No movements yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m._id}>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                    <td>{m.type}</td>
                    <td>{m.type === 'in' ? '+' : '-'}{m.quantity}</td>
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
