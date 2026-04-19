import { Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import type { UserItem } from '../types';
import { getInitials } from '../utils';

export function DeleteUserDialog({
  user,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  user: UserItem | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>This action is permanent and cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #CB5229, #F0BC2C)' }}
              >
                {getInitials(user.name)}
              </div>
              <div>
                <p style={{ color: '#0F172A', fontSize: 13, fontWeight: 600, margin: 0 }}>{user.name}</p>
                <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>{user.email}</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onConfirm} disabled={loading} style={{ backgroundColor: '#CB5229', color: '#fff' }}>
              <Trash2 size={14} /> {loading ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
