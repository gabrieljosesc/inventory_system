import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import { getItems } from '../api/items.js';
import { Card } from '../components/Card.js';
import { Table } from '../components/Table.js';
import type { Item } from '../api/items.js';

export function Reorder() {
  const { token } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', { lowStock: true }],
    queryFn: () => getItems(token!, { lowStock: true }),
    enabled: !!token,
  });

  const categoryName = (item: Item) =>
    typeof item.categoryId === 'object' ? item.categoryId?.name : '-';

  const reorderQty = (item: Item) => Math.max(0, (item.minQuantity ?? 0) - item.quantity + 1);

  return (
    <>
      <h1>Reorder list</h1>
      <p className="page-description">Items at or below minimum quantity. Order more to avoid stockouts.</p>
      <Card>
        {isLoading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p style={{ margin: 0 }}>No items need reordering.</p>
        ) : (
          <Table<Item>
            keyField="_id"
            columns={[
              {
                key: 'name',
                header: 'Item',
                render: (row) => <Link to={`/items/${row._id}`}>{row.name}</Link>,
              },
              { key: 'unit', header: 'Unit' },
              { key: 'quantity', header: 'Current' },
              { key: 'minQuantity', header: 'Min' },
              {
                key: 'suggested',
                header: 'Suggested order',
                render: (row) => `${reorderQty(row)} ${row.unit}`,
              },
              {
                key: 'category',
                header: 'Category',
                render: (row) => categoryName(row),
              },
              {
                key: 'supplier',
                header: 'Supplier',
                render: (row) => row.supplier ?? '-',
              },
            ]}
            data={items}
          />
        )}
      </Card>
    </>
  );
}
