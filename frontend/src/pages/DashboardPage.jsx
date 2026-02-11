import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Shield, Activity } from 'lucide-react';

const EVENT_POLL_MS = 5000;
const BALANCE_POLL_MS = 7000;
const API_BASE = import.meta.env.VITE_RESOLVED_API_URL || '';

function useApi(path, intervalMs, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timer;
    let abort = false;

    const endpoint = `${API_BASE.replace(/\/$/, '')}${path}`;

    const fetchData = async () => {
      try {
        const res = await fetch(endpoint, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!abort) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!abort) {
          setError(err.message);
          setLoading(false);
        }
      } finally {
        if (!abort) {
          timer = setTimeout(fetchData, intervalMs);
        }
      }
    };

    fetchData();
    return () => {
      abort = true;
      if (timer) clearTimeout(timer);
    };
  }, [path, intervalMs]);

  return { data, loading, error };
}

function StatCard({ icon: Icon, label, value, sub, trend }) {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-icon">
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`card-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            <TrendingUp size={16} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: eventsPayload } = useApi('/api/events?limit=20', EVENT_POLL_MS, { events: [] });
  const { data: balancesPayload } = useApi('/api/balances', BALANCE_POLL_MS, {
    watched: null,
    quarantine: null,
    cluster: 'devnet',
  });
  const { data: bundlePayload } = useApi('/api/bundle', BALANCE_POLL_MS, {});

  const events = eventsPayload?.events ?? [];
  const balances = balancesPayload ?? {};
  const bundle = bundlePayload ?? {};

  const watchedStats = useMemo(() => {
    if (!balances.watched) return null;
    return {
      sol: balances.watched.sol.toFixed(4),
      lamports: balances.watched.lamports.toLocaleString(),
      address: balances.watched.address,
    };
  }, [balances.watched]);

  const quarantineStats = useMemo(() => {
    if (!balances.quarantine) return null;
    return {
      sol: balances.quarantine.sol.toFixed(4),
      lamports: balances.quarantine.lamports.toLocaleString(),
      address: balances.quarantine.address,
    };
  }, [balances.quarantine]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Treasury Dashboard</h1>
          <p className="dashboard-meta">
            <span className="cluster-badge">{balances.cluster ?? 'unknown'}</span>
            <span className="divider">•</span>
            <span>RPC: {balances.rpcUrl ?? 'n/a'}</span>
            <span className="divider">•</span>
            <span>Updated {balances.lastUpdated ? new Date(balances.lastUpdated).toLocaleTimeString() : '—'}</span>
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <StatCard
          icon={DollarSign}
          label="Treasury Balance"
          value={watchedStats ? `${watchedStats.sol} SOL` : '—'}
          sub={watchedStats ? watchedStats.address : 'Loading...'}
        />
        <StatCard
          icon={Shield}
          label="Quarantine Balance"
          value={quarantineStats ? `${quarantineStats.sol} SOL` : '—'}
          sub={quarantineStats ? quarantineStats.address : 'Loading...'}
        />
        <StatCard
          icon={Activity}
          label="Bundle Status"
          value={bundle.lastStatus ?? 'n/a'}
          sub={bundle.lastMethod ? `${bundle.lastMethod} · ${bundle.lastUpdated ?? ''}` : '—'}
        />
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>Recent Activity</h2>
          <span className="activity-count">{events.length} transactions</span>
        </div>
        
        <div className="activity-table">
          <div className="table-row table-header">
            <div>Time</div>
            <div>Signature</div>
            <div>Status</div>
            <div>Amount</div>
            <div>Direction</div>
            <div>Details</div>
          </div>
          {events.map((event) => (
            <div className="table-row" key={event.signature + event.status + event.recordedAt}>
              <div className="table-cell">
                {new Date(event.recordedAt || event.timestamp || Date.now()).toLocaleTimeString()}
              </div>
              <div className="table-cell mono" title={event.signature}>
                {event.signature?.slice(0, 12)}…
              </div>
              <div className="table-cell">
                <span className={`status-badge status-${event.status?.toLowerCase() || 'unknown'}`}>
                  {event.status || 'n/a'}
                </span>
              </div>
              <div className="table-cell">
                {(event.amountSol ?? 0).toFixed(6)} SOL
              </div>
              <div className="table-cell mono">
                <div className="address-flow">
                  <span title={event.from}>{event.from ? `${event.from.slice(0, 8)}…` : '—'}</span>
                  <span className="arrow">→</span>
                  <span title={event.to}>{event.to ? `${event.to.slice(0, 8)}…` : '—'}</span>
                </div>
              </div>
              <div className="table-cell details">
                {event.reasons?.join(', ') || event.action || '—'}
                {event.error && <div className="error-text">{event.error}</div>}
              </div>
            </div>
          ))}
          {!events.length && (
            <div className="table-row empty">
              <div>No activity recorded yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
