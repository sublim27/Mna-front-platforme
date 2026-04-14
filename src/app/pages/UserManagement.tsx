import { useState, useEffect } from 'react';
import {
  Users, Search, Trash2, Edit2, Shield, ShieldCheck,
  CheckCircle2, X, AlertTriangle, ChevronDown, UserPlus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog';

const API = 'http://localhost:3000';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#F0F4FF', color: '#2563EB' },
  user:  { bg: '#E6F7F9', color: '#1AABBA' },
};

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function UserManagement() {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [error, setError]           = useState('');

  // Edit modal
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [editName, setEditName]     = useState('');
  const [editRole, setEditRole]     = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError]   = useState('');

  // Delete modal
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/users`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 403) setError('Access denied — Admin only');
        else setError('Failed to load users');
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Open edit modal
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditSuccess('');
    setEditError('');
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editUser) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const res = await fetch(`${API}/api/users/${editUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, role: editRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        setEditError(err.message ?? 'Failed to update');
      } else {
        setEditSuccess('User updated successfully!');
        fetchUsers();
        setTimeout(() => setEditUser(null), 1500);
      }
    } catch {
      setEditError('Network error');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`${API}/api/users/${deleteUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        setDeleteError(err.message ?? 'Failed to delete');
      } else {
        setDeleteUser(null);
        fetchUsers();
      }
    } catch {
      setDeleteError('Network error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalUsers  = users.filter(u => u.role === 'user').length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ color: '#0F172A', margin: 0 }}>User Management</h1>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
            Manage platform users, roles and access
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users',  value: users.length,  color: '#1AABBA', icon: Users },
          { label: 'Admins',       value: totalAdmins,   color: '#2563EB', icon: ShieldCheck },
          { label: 'Regular Users',value: totalUsers,    color: '#10B981', icon: Shield },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-xl w-12 h-12 shrink-0"
                    style={{ backgroundColor: `${stat.color}18`, border: `1px solid ${stat.color}35` }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p style={{ color: stat.color, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                      {stat.value}
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Click edit to update name or role, delete to remove.</CardDescription>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <AlertTriangle size={16} style={{ color: '#CB5229' }} />
              <p style={{ color: '#CB5229', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: '#F1F5F9' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
              <p style={{ color: '#94A3B8' }}>No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(u => {
                const roleStyle = ROLE_STYLES[u.role] ?? ROLE_STYLES.user;
                return (
                  <div key={u.id}
                    className="flex items-center gap-4 p-3 rounded-xl transition-colors"
                    style={{ border: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}
                  >
                    {/* Avatar */}
                    {u.image ? (
                      <img src={u.image} alt={u.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #1AABBA, #F0BC2C)' }}>
                        {getInitials(u.name)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#0F172A', fontSize: 13, fontWeight: 600, margin: 0 }}>{u.name}</p>
                      <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{u.email}</p>
                    </div>

                    {/* Role badge */}
                    <span className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
                      style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}>
                      {u.role}
                    </span>

                    {/* Verified badge */}
                    <span className="hidden md:flex items-center gap-1 text-xs shrink-0"
                      style={{ color: u.emailVerified ? '#10B981' : '#94A3B8' }}>
                      {u.emailVerified
                        ? <><CheckCircle2 size={12} /> Verified</>
                        : <><X size={12} /> Unverified</>}
                    </span>

                    {/* Joined date */}
                    <p className="hidden lg:block text-xs shrink-0" style={{ color: '#94A3B8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(u)}
                        style={{ height: 32, fontSize: 12 }}
                      >
                        <Edit2 size={12} /> Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => { setDeleteUser(u); setDeleteError(''); }}
                        style={{ height: 32, fontSize: 12, backgroundColor: '#FEF2F2', color: '#CB5229', border: '1px solid #FECACA' }}
                      >
                        <Trash2 size={12} /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Modal ── */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update name or role for {editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <div className="relative">
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 appearance-none"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {editError   && <p className="text-sm text-red-500">{editError}</p>}
            {editSuccess && <p className="text-sm text-green-500">{editSuccess}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editLoading}
                style={{ backgroundColor: '#1AABBA', color: '#fff' }}
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      <Dialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {deleteUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #CB5229, #F0BC2C)' }}>
                  {getInitials(deleteUser.name)}
                </div>
                <div>
                  <p style={{ color: '#0F172A', fontSize: 13, fontWeight: 600, margin: 0 }}>{deleteUser.name}</p>
                  <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{deleteUser.email}</p>
                </div>
              </div>
            )}

            {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ backgroundColor: '#CB5229', color: '#fff' }}
              >
                <Trash2 size={14} /> {deleteLoading ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}