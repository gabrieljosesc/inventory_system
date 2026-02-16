import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import { getCategories } from '../api/categories.js';
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  type Item,
} from '../api/items.js';
import { Card } from '../components/Card.js';
import { Table } from '../components/Table.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { useToast } from '../context/ToastContext.js';
import { exportItemsCsv } from '../api/items.js';

const UNITS = ['kg', 'L', 'piece', 'box', 'bottle', 'pack'];

export function Items() {
  const { token } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('categoryId') ?? '';
  const lowStockOnly = searchParams.get('lowStock') === 'true';
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Item | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    unit: 'piece',
    quantity: 0,
    minQuantity: 0,
    maxQuantity: '' as number | '',
    supplier: '',
    expiryDate: '',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(token!),
    enabled: !!token,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: [
      'items',
      {
        categoryId: categoryFilter || undefined,
        lowStock: lowStockOnly,
        search: search.trim() || undefined,
      },
    ],
    queryFn: () =>
      getItems(token!, {
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(lowStockOnly ? { lowStock: true } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof createItem>[1]) =>
      createItem(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setAdding(false);
      setForm({
        name: '',
        categoryId: '',
        unit: 'piece',
        quantity: 0,
        minQuantity: 0,
        maxQuantity: '',
        supplier: '',
        expiryDate: '',
      });
      toast.success('Item created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        categoryId: string;
        unit: string;
        quantity: number;
        minQuantity: number;
        maxQuantity?: number;
        supplier?: string;
        expiryDate?: string;
      };
    }) => updateItem(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setEditing(null);
      toast.success('Item updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteItem(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({
      name: item.name,
      categoryId:
        typeof item.categoryId === 'object'
          ? item.categoryId._id
          : item.categoryId,
      unit: item.unit,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity ?? '',
      supplier: item.supplier ?? '',
      expiryDate: item.expiryDate
        ? new Date(item.expiryDate).toISOString().slice(0, 10)
        : '',
    });
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      name: form.name,
      categoryId: form.categoryId,
      unit: form.unit,
      quantity: form.quantity,
      minQuantity: form.minQuantity,
      maxQuantity:
        form.maxQuantity === '' ? undefined : Number(form.maxQuantity),
      supplier: form.supplier || undefined,
      expiryDate: form.expiryDate || undefined,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMut.mutate({
      id: editing._id,
      data: {
        name: form.name,
        categoryId: form.categoryId,
        unit: form.unit,
        quantity: form.quantity,
        minQuantity: form.minQuantity,
        maxQuantity:
          form.maxQuantity === '' ? undefined : Number(form.maxQuantity),
        supplier: form.supplier || undefined,
        expiryDate: form.expiryDate || undefined,
      },
    });
  };

  const handleExport = async () => {
    try {
      await exportItemsCsv(token!, {
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(lowStockOnly ? { lowStock: true } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      toast.success('Export started');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleDelete = (item: Item) => {
    if (window.confirm(`Delete item "${item.name}"?`))
      deleteMut.mutate(item._id);
  };

  const categoryName = (item: Item) =>
    typeof item.categoryId === 'object' ? item.categoryId?.name : '-';

  return (
    <>
      <div className="page-head">
        <h1>Items</h1>
        <Button
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setForm({
              name: '',
              categoryId: categories[0]?._id ?? '',
              unit: 'piece',
              quantity: 0,
              minQuantity: 0,
              maxQuantity: '',
              supplier: '',
              expiryDate: '',
            });
          }}
        >
          Add item
        </Button>
      </div>
      <Card>
        <div className="filters-bar">
          <label>Search</label>
          <input
            className="input"
            type="search"
            placeholder="Item name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '180px' }}
          />
          <label>Category</label>
          <select
            className="select"
            value={categoryFilter}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams);
              if (e.target.value) p.set('categoryId', e.target.value);
              else p.delete('categoryId');
              setSearchParams(p);
            }}
            style={{ width: 'auto' }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn"
            onClick={() =>
              lowStockOnly
                ? setSearchParams({})
                : setSearchParams({ lowStock: 'true' })
            }
          >
            {lowStockOnly ? 'Show all' : 'Low stock only'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleExport}
            style={{ marginLeft: 'auto' }}
          >
            Export CSV
          </button>
        </div>
      </Card>
      {adding && (
        <Card title="New item">
          <form onSubmit={handleSubmitAdd}>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="input-wrap">
              <label>Category</label>
              <select
                className="select"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                required
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-wrap">
              <label>Unit</label>
              <select
                className="select"
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Quantity"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
              }
            />
            <Input
              label="Min quantity"
              type="number"
              min={0}
              value={form.minQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, minQuantity: Number(e.target.value) }))
              }
            />
            <Input
              label="Max quantity (optional)"
              type="number"
              min={0}
              value={form.maxQuantity}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxQuantity:
                    e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
            <Input
              label="Supplier (optional)"
              value={form.supplier}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier: e.target.value }))
              }
            />
            <Input
              label="Expiry date (optional)"
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
              }
            />
            <Button type="submit" disabled={createMut.isPending}>
              Save
            </Button>
            <Button
              type="button"
              onClick={() => setAdding(false)}
              style={{ marginLeft: '0.5rem' }}
            >
              Cancel
            </Button>
          </form>
        </Card>
      )}
      {editing && (
        <Card title="Edit item">
          <form onSubmit={handleSubmitEdit}>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="input-wrap">
              <label>Category</label>
              <select
                className="select"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                required
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-wrap">
              <label>Unit</label>
              <select
                className="select"
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Quantity"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
              }
            />
            <Input
              label="Min quantity"
              type="number"
              min={0}
              value={form.minQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, minQuantity: Number(e.target.value) }))
              }
            />
            <Input
              label="Max quantity (optional)"
              type="number"
              min={0}
              value={form.maxQuantity}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxQuantity:
                    e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
            <Input
              label="Supplier (optional)"
              value={form.supplier}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier: e.target.value }))
              }
            />
            <Input
              label="Expiry date (optional)"
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
              }
            />
            <Button type="submit" disabled={updateMut.isPending}>
              Update
            </Button>
            <Button
              type="button"
              onClick={() => setEditing(null)}
              style={{ marginLeft: '0.5rem' }}
            >
              Cancel
            </Button>
          </form>
        </Card>
      )}
      <Card>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <Table<Item>
            keyField="_id"
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (row) => (
                  <Link to={`/items/${row._id}`}>{row.name}</Link>
                ),
              },
              { key: 'unit', header: 'Unit' },
              { key: 'quantity', header: 'Quantity' },
              { key: 'minQuantity', header: 'Min' },
              {
                key: 'category',
                header: 'Category',
                render: (row) => categoryName(row),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <>
                    <Button onClick={() => openEdit(row)}>Edit</Button>
                    <Button
                      onClick={() => handleDelete(row)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Delete
                    </Button>
                  </>
                ),
              },
            ]}
            data={items}
          />
        )}
      </Card>
    </>
  );
}
