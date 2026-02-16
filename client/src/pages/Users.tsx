import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import { getUsers, createUser, type ApiUser } from '../api/users.js';
import { useToast } from '../context/ToastContext.js';
import { Card } from '../components/Card.js';
import { Table } from '../components/Table.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';

export function Users() {
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff' as 'admin' | 'staff',
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(token!),
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      role?: 'admin' | 'staff';
    }) => createUser(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAdding(false);
      setForm({ email: '', password: '', name: '', role: 'staff' });
      toast.success('User created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="card">
        <p>You need admin access to view this page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Users</h1>
        <Button
          onClick={() => {
            setAdding(true);
            setForm({ email: '', password: '', name: '', role: 'staff' });
          }}
        >
          Add user
        </Button>
      </div>
      {adding && (
        <Card title="New user">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.password.length < 6) {
                toast.error('Password must be at least 6 characters');
                return;
              }
              createMut.mutate(form);
            }}
          >
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
              minLength={6}
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="input-wrap">
              <label>Role</label>
              <select
                className="select"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as 'admin' | 'staff',
                  }))
                }
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" disabled={createMut.isPending}>
              Create
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
      <Card>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <Table<ApiUser>
            keyField="_id"
            columns={[
              { key: 'email', header: 'Email' },
              { key: 'name', header: 'Name' },
              { key: 'role', header: 'Role' },
            ]}
            data={users}
          />
        )}
      </Card>
    </>
  );
}
