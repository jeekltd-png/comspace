'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface ManagedUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accountType: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ROLES = ['customer', 'merchant', 'admin2', 'admin1', 'admin', 'superadmin'];
const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  admin1: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  admin2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  merchant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  customer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: string; label: string } | null>(null);

  const isAdmin = currentUser && ['superadmin', 'admin', 'admin1', 'admin2'].includes(currentUser.role);
  const canManage = currentUser && ['superadmin', 'admin', 'admin1'].includes(currentUser.role);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const resp = await apiClient.get('/admin/users/manage', { params });
      setUsers(resp.data.data.users);
      setPagination(resp.data.data.pagination);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      await apiClient.patch(`/admin/users/manage/${userId}/status`, { isActive: !isActive });
      showNotification('success', `User ${!isActive ? 'enabled' : 'disabled'} successfully`);
      fetchUsers(pagination.page);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    setActionLoading(selectedUser._id);
    try {
      await apiClient.patch(`/admin/users/manage/${selectedUser._id}/role`, { role: newRole });
      showNotification('success', `Role changed to ${newRole}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Failed to change role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setActionLoading(userId);
    try {
      await apiClient.post(`/admin/users/manage/${userId}/reset-password`);
      showNotification('success', 'Password reset email sent');
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Failed to send reset email');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleForceVerify = async (userId: string) => {
    setActionLoading(userId);
    try {
      await apiClient.patch(`/admin/users/manage/${userId}/verify`);
      showNotification('success', 'User email verified');
      fetchUsers(pagination.page);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Failed to verify user');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Access denied. Admin privileges required.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm Action</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{confirmAction.label}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-surface-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.action === 'toggle') {
                    const u = users.find(u => u._id === confirmAction.userId);
                    if (u) handleToggleStatus(u._id, u.isActive);
                  } else if (confirmAction.action === 'reset') {
                    handleResetPassword(confirmAction.userId);
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Change Role</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Change role for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4 dark:bg-surface-700 dark:border-surface-600 dark:text-white"
            >
              <option value="">Select role...</option>
              {ROLES.filter(r => currentUser?.role === 'superadmin' || ROLES.indexOf(r) < ROLES.indexOf(currentUser?.role || '')).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-surface-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700">
                Cancel
              </button>
              <button onClick={handleChangeRole} disabled={!newRole || actionLoading === selectedUser._id} className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50">
                {actionLoading === selectedUser._id ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">👤 User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage user accounts, roles, and access — {pagination.total} total users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
          className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm dark:bg-surface-800 dark:border-surface-700 dark:text-white"
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); }} className="border rounded-lg px-3 py-2 text-sm dark:bg-surface-800 dark:border-surface-700 dark:text-white">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }} className="border rounded-lg px-3 py-2 text-sm dark:bg-surface-800 dark:border-surface-700 dark:text-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="unverified">Unverified</option>
        </select>
        <button onClick={() => fetchUsers(1)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
          Search
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-surface-800 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Verified</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Last Login</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Joined</th>
                  {canManage && <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{u.email}</div>
                        {u.phone && <div className="text-gray-400 text-xs">{u.phone}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.customer}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isVerified ? (
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      ) : (
                        <button
                          onClick={() => handleForceVerify(u._id)}
                          disabled={!canManage || actionLoading === u._id}
                          className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Toggle Status */}
                          <button
                            onClick={() => setConfirmAction({
                              userId: u._id,
                              action: 'toggle',
                              label: `Are you sure you want to ${u.isActive ? 'disable' : 'enable'} ${u.firstName} ${u.lastName}'s account?`,
                            })}
                            disabled={u._id === currentUser?.id || actionLoading === u._id}
                            className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-30 ${u.isActive ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                            title={u.isActive ? 'Disable account' : 'Enable account'}
                          >
                            {u.isActive ? '🚫' : '✅'}
                          </button>

                          {/* Change Role */}
                          {['superadmin', 'admin'].includes(currentUser?.role || '') && (
                            <button
                              onClick={() => { setSelectedUser(u); setNewRole(u.role); setShowRoleModal(true); }}
                              disabled={u._id === currentUser?.id}
                              className="px-2 py-1 rounded text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-30"
                              title="Change role"
                            >
                              🔑
                            </button>
                          )}

                          {/* Reset Password */}
                          <button
                            onClick={() => setConfirmAction({
                              userId: u._id,
                              action: 'reset',
                              label: `Send a password reset email to ${u.email}?`,
                            })}
                            disabled={actionLoading === u._id}
                            className="px-2 py-1 rounded text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-30"
                            title="Send password reset"
                          >
                            🔄
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-surface-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} users)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-surface-600 dark:text-gray-300"
              >
                Prev
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-surface-600 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
