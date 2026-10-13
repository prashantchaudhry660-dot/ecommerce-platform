import React, { useEffect, useState } from 'react';
import { Radio, RefreshCw, Filter, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../../api/client';
import { ActivityLog, PageResponse } from '../../types';
import { useAdminActivityStream } from '../../hooks/useSse';
import { toast } from 'sonner';

export const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getActivity({ page, size: 50 });
      setLogs(data.content);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  // Prepend live events pushed through Server-Sent Events!
  useAdminActivityStream((event) => {
    if (event.type === 'ACTIVITY_LOG') {
      setLogs((prev) => [event.data, ...prev]);
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>Live System Activity Stream</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Streaming registrations, logins, product listings, orders placed, and status changes via SSE.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Connected</span>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-surface-100 dark:bg-surface-200 border border-border text-foreground hover:bg-surface-200"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-100 dark:bg-surface-200/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading activity stream...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-100/40">
                    <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-muted-foreground">{log.entityType}</td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{log.userEmail || 'System'}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No system activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
