import { useEffect } from 'react';
import { useUserManagement } from './useUserManagement';
import { UserStats } from './components/UserStats';
import { UserListCard } from './components/UserListCard';
import { EditUserDialog } from './components/EditUserDialog';
import { DeleteUserDialog } from './components/DeleteUserDialog';
import { PageHero, PageShell } from '../../components/layout/page-shell';

export default function UserManagementFeature() {
  const {
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
    deleteUser,
    deleteLoading,
    deleteError,
    openDelete,
    closeDelete,
    confirmDelete,
    loadUsers,
  } = useUserManagement();

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <PageShell className="max-w-6xl">
      <PageHero
        title="User Management"
        subtitle="Manage platform users, roles, and access from a single workspace."
      />

      <UserStats
        totalUsers={users.length}
        totalAdmins={totalAdmins}
        totalRegularUsers={totalRegularUsers}
      />

      <UserListCard
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        users={filteredUsers}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <EditUserDialog
        user={editUser}
        name={editName}
        role={editRole}
        loading={editLoading}
        success={editSuccess}
        error={editError}
        onClose={closeEdit}
        onNameChange={setEditName}
        onRoleChange={setEditRole}
        onSave={saveEdit}
      />

      <DeleteUserDialog
        user={deleteUser}
        loading={deleteLoading}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
}
