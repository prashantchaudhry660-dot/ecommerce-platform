import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Shield,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  X,
  Filter,
} from 'lucide-react';
import { api } from '../../api/client';
import { User, UserRole, UserStatus, PageResponse } from '../../types';
import { toast } from 'sonner';

export const AdminUsersPage: React.FC = () => {
  const [usersPage, setUsersPage] = useState<PageResponse<User> | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('BUYER');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
        page,
        size: 15,
      });
      setUsersPage(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search, page]);

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.admin.updateUserStatus(user.id, nextStatus);
      toast.success(`User ${user.email} status changed to ${nextStatus}`, {
        description: `Account access has been updated immediately.`,
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.fullName);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      await api.admin.updateUser(editingUser.id, {
        fullName: editName,
        email: editEmail,
        role: editRole,
      });
      toast.success(`Updated profile for ${editEmail}`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}? This action is irreversible.`)) return;
    try {
      await api.admin.deleteUser(user.id);
      toast.success(`Deleted user account: ${user.email}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">User Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administer accounts, elevate permissions, and suspend non-compliant sellers or buyers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setPage(0);
            }}
            className="bg-surface-100 dark:bg-surface-200 text-foreground px-3 py-2 rounded-2xl border border-border text-xs font-bold"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SELLER">SELLER</option>
            <option value="BUYER">BUYER</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search user or email..."
              className="pl-9 pr-3 py-2 rounded-2xl bg-surface-100 dark:bg-surface-200 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-100 dark:bg-surface-200/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : usersPage && usersPage.content.length > 0 ? (
                usersPage.content.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-100/40">
                    <td className="py-3.5 px-4 font-bold text-foreground">{u.fullName}</td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-accent/20 text-accent-foreground'
                            : u.role === 'SELLER'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-surface-200 text-muted-foreground'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200"
                          title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                        >
                          {u.status === 'ACTIVE' ? (
                            <UserX className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No users matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingUser(null)}>
          <div
            className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl glass-panel space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-base font-bold font-display text-foreground">Edit User Profile</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Platform Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground font-bold"
                >
                  <option value="BUYER">BUYER</option>
                  <option value="SELLER">SELLER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-200 text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
