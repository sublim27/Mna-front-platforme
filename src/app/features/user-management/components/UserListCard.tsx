import { AlertTriangle, CheckCircle2, Edit2, Search, Trash2, Users, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import type { UserItem } from '../types';
import { ROLE_STYLES } from '../types';
import { getInitials } from '../utils';

export function UserListCard({
  loading,
  error,
  search,
  onSearchChange,
  users,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  error: string;
  search: string;
  onSearchChange: (value: string) => void;
  users: UserItem[];
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Click edit to update name or role, delete to remove.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg mb-4"
            style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <AlertTriangle size={16} style={{ color: '#CB5229' }} />
            <p style={{ color: '#CB5229', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((line) => (
              <div key={line} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: '#F1F5F9' }} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
            <p style={{ color: '#94A3B8' }}>No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const roleStyle = ROLE_STYLES[user.role] ?? ROLE_STYLES.user;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-3 rounded-xl transition-colors"
                  style={{ border: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1AABBA, #F0BC2C)' }}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p style={{ color: '#0F172A', fontSize: 13, fontWeight: 600, margin: 0 }}>{user.name}</p>
                    <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{user.email}</p>
                  </div>

                  <span
                    className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
                    style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                  >
                    {user.role}
                  </span>

                  <span
                    className="hidden md:flex items-center gap-1 text-xs shrink-0"
                    style={{ color: user.emailVerified ? '#10B981' : '#94A3B8' }}
                  >
                    {user.emailVerified ? (
                      <>
                        <CheckCircle2 size={12} /> Verified
                      </>
                    ) : (
                      <>
                        <X size={12} /> Unverified
                      </>
                    )}
                  </span>

                  <p className="hidden lg:block text-xs shrink-0" style={{ color: '#94A3B8' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => onEdit(user)} style={{ height: 32, fontSize: 12 }}>
                      <Edit2 size={12} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDelete(user)}
                      style={{
                        height: 32,
                        fontSize: 12,
                        backgroundColor: '#FEF2F2',
                        color: '#CB5229',
                        border: '1px solid #FECACA',
                      }}
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
  );
}
