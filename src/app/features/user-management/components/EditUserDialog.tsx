import { ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import type { UserItem } from '../types';

export function EditUserDialog({
  user,
  name,
  role,
  loading,
  success,
  error,
  onClose,
  onNameChange,
  onRoleChange,
  onSave,
}: {
  user: UserItem | null;
  name: string;
  role: string;
  loading: boolean;
  success: string;
  error: string;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update name or role for {user?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => onNameChange(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <div className="relative">
              <select
                value={role}
                onChange={(event) => onRoleChange(event.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 appearance-none"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onSave} disabled={loading} style={{ backgroundColor: '#1AABBA', color: '#fff' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
