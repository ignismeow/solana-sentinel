import { Book, Code, Settings, Zap, Terminal, FileText, GitBranch, AlertCircle } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="docs-page">
      <div className="docs-sidebar">
        <nav className="docs-nav">
          <a href="#overview" className="docs-nav-link">Overview</a>
          <a href="#quickstart" className="docs-nav-link">Quick Start</a>
          <a href="#architecture" className="docs-nav-link">Architecture</a>
          <a href="#configuration" className="docs-nav-link">Configuration</a>
          <a href="#deployment" className="docs-nav-link">Deployment</a>
          <a href="#api" className="docs-nav-link">API Reference</a>
          <a href="#operations" className="docs-nav-link">Operations</a>
          <a href="#troubleshooting" className="docs-nav-link">Troubleshooting</a>
        </nav>
      </div>

      <div className="docs-content">
        <section id="overview" className="docs-section">
          <div className="section-icon">
            <Book size={32} />
          </div>
          <h1>Documentation</h1>
          <p className="lead">
            Sentinel is a 24/7 Solana-native agent that watches an on-chain treasury, 
            flags risky inflows, and auto-quarantines suspect funds into a holding wallet.
          </p>

          <div className="info-box">
            <AlertCircle size={20} />
            <div>
              <strong>Built for Compliance:</strong> Combines Colosseum compliance rules 
              with deterministic logging, Telegram alerts, and optional Jito bundle execution 
              for front-running protection.
            </div>
          </div>
        </section>

        <section id="quickstart" className="docs-section">
          <div className="section-icon">
            <Zap size={28} />
          </div>
          <h2>Quick Start</h2>
          
          <h3>1. Installation</h3>
          <pre className="code-block">
            <code>{`git clone https://github.com/ignismeow/solana-sentinel.git
cd solana-sentinel
npm install`}</code>
          </pre>

          <h3>2. Configuration</h3>
          <p>Set up your configuration files:</p>
          <ul>
            <li><code>.agentwallet/config.json</code> - AgentWallet API credentials</li>
            <li><code>compliance/quarantine.json</code> - Quarantine wallet details</li>
            <li><code>compliance/verified_senders.json</code> - Whitelisted addresses</li>
          </ul>

          <h3>3. Environment Variables</h3>
          <pre className="code-block">
            <code>{`cp .env.example .env
# Edit .env with your values
export $(grep -v '^#' .env | xargs)`}</code>
          </pre>

          <h3>4. Run the Service</h3>
          <pre className="code-block">
            <code>{`# Local development
node server.js

# Or with Docker
docker compose up --build -d`}</code>
          </pre>
        </section>

        <section id="architecture" className="docs-section">
          <div className="section-icon">
            <GitBranch size={28} />
          </div>
          <h2>Architecture</h2>
          
          <div className="architecture-diagram">
            <div className="arch-component">
              <strong>Helius Webhook</strong>
              <p>Streams transaction data</p>
            </div>
            <div className="arch-arrow">→</div>
            <div className="arch-component">
              <strong>Watcher</strong>
              <p>Logs & extracts transfers</p>
            </div>
            <div className="arch-arrow">→</div>
            <div className="arch-component">
              <strong>Risk Engine</strong>
              <p>Assesses threat level</p>
            </div>
            <div className="arch-arrow">→</div>
            <div className="arch-component">
              <strong>Escrow</strong>
              <p>Executes quarantine</p>
            </div>
            <div className="arch-arrow">→</div>
            <div className="arch-component">
              <strong>Audit & Alerts</strong>
              <p>Notifications & proofs</p>
            </div>
          </div>

          <h3>Core Components</h3>
          <div className="component-grid">
            <div className="component-card">
              <Terminal size={24} />
              <h4>Watcher (watcher.js)</h4>
              <p>Persists raw webhook payloads and extracts native SOL transfers</p>
            </div>
            <div className="component-card">
              <AlertCircle size={24} />
              <h4>Risk Engine (riskEngine.js)</h4>
              <p>Scores transfers against threshold and whitelist rules</p>
            </div>
            <div className="component-card">
              <FileText size={24} />
              <h4>Escrow (escrow.js)</h4>
              <p>Queues and executes fund quarantine operations</p>
            </div>
            <div className="component-card">
              <Zap size={24} />
              <h4>Execution (execution.js)</h4>
              <p>Smart routing via Jito bundles or standard RPC</p>
            </div>
          </div>
        </section>

        <section id="configuration" className="docs-section">
          <div className="section-icon">
            <Settings size={28} />
          </div>
          <h2>Configuration</h2>

          <h3>Essential Environment Variables</h3>
          <table className="config-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Purpose</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>CLUSTER</code></td>
                <td>Network to use</td>
                <td>devnet, mainnet-beta</td>
              </tr>
              <tr>
                <td><code>TELEGRAM_BOT_TOKEN</code></td>
                <td>Bot authentication</td>
                <td>1234567890:ABC...</td>
              </tr>
              <tr>
                <td><code>TELEGRAM_CHAT_ID</code></td>
                <td>Alert destination</td>
                <td>-1001234567890</td>
              </tr>
              <tr>
                <td><code>USE_JITO_BUNDLES</code></td>
                <td>Enable Jito execution</td>
                <td>true, false</td>
              </tr>
              <tr>
                <td><code>JITO_TIP_LAMPORTS</code></td>
                <td>Bundle tip amount</td>
                <td>1000000 (0.001 SOL)</td>
              </tr>
            </tbody>
          </table>

          <h3>Risk Configuration</h3>
          <p>Define your risk threshold in the backend configuration:</p>
          <pre className="code-block">
            <code>{`const RISK_CONFIG = {
  thresholdSol: 0.1  // Flag transfers above this amount
};`}</code>
          </pre>

          <h3>Verified Senders</h3>
          <p>Whitelist trusted addresses in <code>compliance/verified_senders.json</code>:</p>
          <pre className="code-block">
            <code>{`{
  "senders": [
    "YourTrustedWallet1...",
    "YourTrustedWallet2..."
  ]
}`}</code>
          </pre>
        </section>

        <section id="deployment" className="docs-section">
          <div className="section-icon">
            <Code size={28} />
          </div>
          <h2>Deployment Options</h2>

          <h3>Docker (Recommended)</h3>
          <pre className="code-block">
            <code>{`docker compose up -d --build

# View logs
docker logs -f sentinel-compliance

# View dashboard
docker logs -f sentinel-dashboard`}</code>
          </pre>

          <h3>PM2 / Systemd</h3>
          <pre className="code-block">
            <code>{`pm2 start server.js --name sentinel
pm2 logs sentinel
pm2 save`}</code>
          </pre>

          <h3>Bare Node.js</h3>
          <pre className="code-block">
            <code>{`NODE_ENV=production node server.js`}</code>
          </pre>
        </section>

        <section id="api" className="docs-section">
          <div className="section-icon">
            <Terminal size={28} />
          </div>
          <h2>API Reference</h2>

          <h3>GET /api/events</h3>
          <p>Retrieve recent compliance events</p>
          <pre className="code-block">
            <code>{`GET /api/events?limit=20

Response:
{
  "events": [
    {
      "signature": "...",
      "timestamp": "2026-02-11T00:00:00.000Z",
      "status": "QUARANTINED",
      "amountSol": 0.5,
      "from": "...",
      "to": "...",
      "reasons": ["threshold_exceeded"]
    }
  ]
}`}</code>
          </pre>

          <h3>GET /api/balances</h3>
          <p>Get current treasury and quarantine balances</p>
          <pre className="code-block">
            <code>{`GET /api/balances

Response:
{
  "watched": {
    "sol": 10.5234,
    "lamports": 10523400000,
    "address": "..."
  },
  "quarantine": {
    "sol": 2.1000,
    "lamports": 2100000000,
    "address": "..."
  },
  "cluster": "devnet",
  "lastUpdated": "2026-02-11T00:00:00.000Z"
}`}</code>
          </pre>

          <h3>GET /api/bundle</h3>
          <p>Check Jito bundle execution status</p>
          <pre className="code-block">
            <code>{`GET /api/bundle

Response:
{
  "lastMethod": "jito-bundle",
  "lastStatus": "confirmed",
  "lastBundleId": "...",
  "lastUpdated": "2026-02-11T00:00:00.000Z"
}`}</code>
          </pre>
        </section>

        <section id="operations" className="docs-section">
          <div className="section-icon">
            <FileText size={28} />
          </div>
          <h2>Operations Guide</h2>

          <h3>Health Checks</h3>
          <pre className="code-block">
            <code>{`# Check service status
docker ps | grep sentinel

# View recent logs
tail -f compliance/logs/$(date +%Y-%m-%d).md

# Check balances
curl http://localhost:3000/api/balances`}</code>
          </pre>

          <h3>Whitelist Management</h3>
          <p>Add trusted senders to avoid false positives:</p>
          <ol>
            <li>Edit <code>compliance/verified_senders.json</code></li>
            <li>Add the wallet address to the <code>senders</code> array</li>
            <li>Restart the service (changes are loaded on startup)</li>
          </ol>

          <h3>Audit Trail</h3>
          <p>All compliance actions are logged in:</p>
          <ul>
            <li><code>compliance/logs/*.md</code> - Raw webhook transcripts</li>
            <li><code>compliance/audit/*.md</code> - Signed audit proofs</li>
          </ul>

          <h3>Incident Response</h3>
          <p>If a legitimate transaction is quarantined:</p>
          <ol>
            <li>Review the audit log to understand why it was flagged</li>
            <li>Add the sender to verified_senders.json if appropriate</li>
            <li>Manually release funds from the quarantine wallet</li>
            <li>Document the incident in the audit trail</li>
          </ol>
        </section>

        <section id="troubleshooting" className="docs-section">
          <div className="section-icon">
            <AlertCircle size={28} />
          </div>
          <h2>Troubleshooting</h2>

          <h3>Service Won't Start</h3>
          <ul>
            <li>Check environment variables are set correctly</li>
            <li>Verify configuration files exist and have valid JSON</li>
            <li>Ensure RPC endpoint is accessible</li>
            <li>Check Docker/Node.js logs for specific errors</li>
          </ul>

          <h3>No Webhooks Received</h3>
          <ul>
            <li>Verify Helius webhook is configured and pointing to your endpoint</li>
            <li>Check firewall rules allow incoming connections</li>
            <li>Test with a manual transfer to the watched address</li>
            <li>Review server logs for incoming requests</li>
          </ul>

          <h3>Quarantine Not Executing</h3>
          <ul>
            <li>Verify AgentWallet credentials are valid</li>
            <li>Check quarantine wallet has sufficient SOL for rent</li>
            <li>Review execution logs for specific error messages</li>
            <li>Test with a small manual transfer first</li>
          </ul>

          <h3>Dashboard Not Loading</h3>
          <ul>
            <li>Ensure backend service is running on port 3000</li>
            <li>Check CORS configuration allows frontend origin</li>
            <li>Verify API_BASE URL is correct in Vite config</li>
            <li>Clear browser cache and reload</li>
          </ul>

          <div className="info-box">
            <AlertCircle size={20} />
            <div>
              <strong>Need Help?</strong> Check the GitHub issues or open a new one at{' '}
              <a href="https://github.com/ignismeow/solana-sentinel/issues" target="_blank" rel="noopener noreferrer">
                github.com/ignismeow/solana-sentinel
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
