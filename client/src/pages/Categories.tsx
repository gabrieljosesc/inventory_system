import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '../api/categories.js';
import { Card } from '../components/Card.js';
import { Table } from '../components/Table.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { useToast } from '../context/ToastContext.js';

export function Categories() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(token!),
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      createCategory(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setAdding(false);
      setName('');
      setDescription('');
      toast.success('Category created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => updateCategory(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditing(null);
      setName('');
      setDescription('');
      toast.success('Category updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description ?? '');
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ name, description: description || undefined });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMut.mutate({
      id: editing._id,
      data: { name, description: description || undefined },
    });
  };

  const handleDelete = (c: Category) => {
    if (window.confirm(`Delete category "${c.name}"?`)) deleteMut.mutate(c._id);
  };

  return (
    <>
      <div className="page-head">
        <h1>Categories</h1>
        <Button
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setName('');
            setDescription('');
          }}
        >
          Add category
        </Button>
      </div>
      <p className="page-description">
        Group items by type (e.g. Dairy, Beverages). Delete only when no items
        use the category.
      </p>
      {adding && (
        <Card title="New category">
          <form onSubmit={handleSubmitAdd}>
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
        <Card title="Edit category">
          <form onSubmit={handleSubmitEdit}>
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit" disabled={updateMut.isPending}>
              Update
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setName('');
                setDescription('');
              }}
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
          <Table<Category>
            keyField="_id"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'description', header: 'Description' },
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
            data={categories}
          />
        )}
      </Card>
    </>
  );
}
