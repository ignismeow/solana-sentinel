import { useEffect, useMemo, useState } from 'react';

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

function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}

export default function App() {
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
    <div className="layout">
      <header className="header">
        <div>
          <h1>Sentinel Dashboard</h1>
          <p>Cluster: {balances.cluster ?? 'unknown'} · RPC: {balances.rpcUrl ?? 'n/a'}</p>
        </div>
        <div className="header-meta">
          <span>Balances updated {balances.lastUpdated ? new Date(balances.lastUpdated).toLocaleTimeString() : '—'}</span>
        </div>
      </header>

      <section className="stats">
        <StatCard
          label="Treasury"
          value={watchedStats ? `${watchedStats.sol} SOL` : '—'}
          sub={watchedStats ? watchedStats.address : '…'}
        />
        <StatCard
          label="Quarantine"
          value={quarantineStats ? `${quarantineStats.sol} SOL` : '—'}
          sub={quarantineStats ? quarantineStats.address : '…'}
        />
        <StatCard
          label="Bundle status"
          value={bundle.lastStatus ?? 'n/a'}
          sub={bundle.lastMethod ? `${bundle.lastMethod} · ${bundle.lastUpdated ?? ''}` : '—'}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Recent Activity</h2>
          <span>{events.length} entries</span>
        </div>
        <div className="table">
          <div className="table-row table-header">
            <div>Time</div>
            <div>Signature</div>
            <div>Status</div>
            <div>Amount (SOL)</div>
            <div>From → To</div>
            <div>Notes</div>
          </div>
          {events.map((event) => (
            <div className="table-row" key={event.signature + event.status + event.recordedAt}>
              <div>{new Date(event.recordedAt || event.timestamp || Date.now()).toLocaleTimeString()}</div>
              <div className="mono" title={event.signature}>{event.signature?.slice(0, 12)}…</div>
              <div>
                <span className={`badge badge-${event.status?.toLowerCase() || 'unknown'}`}>
                  {event.status || 'n/a'}
                </span>
              </div>
              <div>{(event.amountSol ?? 0).toFixed(6)}</div>
              <div className="mono">
                <div>{event.from ? `${event.from.slice(0, 10)}…` : '—'}</div>
                <div className="arrow">→</div>
                <div>{event.to ? `${event.to.slice(0, 10)}…` : '—'}</div>
              </div>
              <div className="notes">
                {event.reasons?.join(', ') || event.action || ''}
                {event.error && <div className="error">{event.error}</div>}
              </div>
            </div>
          ))}
          {!events.length && <div className="table-row empty">No data yet</div>}
        </div>
      </section>
    </div>
  );
}
