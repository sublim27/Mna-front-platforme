import { useCallback, useMemo, useState } from 'react';
import { deleteUser, fetchUsers, updateUser } from './api';
import type { UserItem } from './types';

export function useUserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const [deleteUserState, setDeleteUserState] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message.includes('403') ? 'Access denied - Admin only' : message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openEdit = useCallback((user: UserItem) => {
    setEditUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditError('');
    setEditSuccess('');
  }, []);

  const closeEdit = useCallback(() => {
    setEditUser(null);
    setEditError('');
    setEditSuccess('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editUser) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      await updateUser(editUser.id, { name: editName, role: editRole });
      setEditSuccess('User updated successfully');
      await loadUsers();
      setTimeout(() => {
        setEditUser(null);
        setEditSuccess('');
      }, 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  }, [editName, editRole, editUser, loadUsers]);

  const openDelete = useCallback((user: UserItem) => {
    setDeleteUserState(user);
    setDeleteError('');
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteUserState(null);
    setDeleteError('');
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteUserState) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteUser(deleteUserState.id);
      setDeleteUserState(null);
      await loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteUserState, loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  }, [search, users]);

  const totalAdmins = useMemo(
    () => users.filter((user) => user.role === 'admin').length,
    [users],
  );

  const totalRegularUsers = useMemo(
    () => users.filter((user) => user.role === 'user').length,
    [users],
  );

  return {
    users,
    loading,
    error,
    search,
    setSearch,
    filteredUsers,
    totalAdmins,
    totalRegularUsers,
    editUser,
    editName,
    setEditName,
    editRole,
    setEditRole,
    editLoading,
    editSuccess,
    editError,
    openEdit,
    closeEdit,
    saveEdit,
    deleteUser: deleteUserState,
    deleteLoading,
    deleteError,
    openDelete,
    closeDelete,
    confirmDelete,
    loadUsers,
  };
}
