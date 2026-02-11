import { Terminal, Zap, Settings } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="docs-page-simple">
      <div className="docs-content">
        <h1>Documentation</h1>
        <p className="lead">
          Sentinel monitors your Solana treasury and auto-quarantines risky deposits.
        </p>

        <section className="docs-section">
          <div className="section-icon">
            <Zap size={24} />
          </div>
          <h2>Quick Start</h2>
          
          <pre className="code-block">
            <code>{`# Clone and install
git clone https://github.com/ignismeow/solana-sentinel.git
cd solana-sentinel
npm install

# Configure
cp .env.example .env
# Edit .env with your values

# Run
docker compose up -d
# or
node server.js`}</code>
          </pre>
        </section>

        <section className="docs-section">
          <div className="section-icon">
            <Settings size={24} />
          </div>
          <h2>Configuration</h2>
          
          <h3>Environment Variables</h3>
          <ul>
            <li><code>CLUSTER</code> - devnet or mainnet-beta</li>
            <li><code>TELEGRAM_BOT_TOKEN</code> - Bot authentication</li>
            <li><code>TELEGRAM_CHAT_ID</code> - Alert destination</li>
            <li><code>USE_JITO_BUNDLES</code> - Enable Jito (true/false)</li>
            <li><code>JITO_TIP_LAMPORTS</code> - Bundle tip amount</li>
          </ul>

          <h3>Files</h3>
          <ul>
            <li><code>.agentwallet/config.json</code> - API credentials</li>
            <li><code>compliance/quarantine.json</code> - Quarantine wallet</li>
            <li><code>compliance/verified_senders.json</code> - Whitelist</li>
          </ul>
        </section>

        <section className="docs-section">
          <div className="section-icon">
            <Terminal size={24} />
          </div>
          <h2>API</h2>
          
          <h3>Endpoints</h3>
          <ul>
            <li><code>GET /api/events</code> - Recent compliance events</li>
            <li><code>GET /api/balances</code> - Treasury and quarantine balances</li>
            <li><code>GET /api/bundle</code> - Jito bundle status</li>
          </ul>

          <h3>Logs & Audit</h3>
          <ul>
            <li><code>compliance/logs/*.md</code> - Webhook transcripts</li>
            <li><code>compliance/audit/*.md</code> - Signed proofs</li>
          </ul>
        </section>

        <div className="docs-footer">
          <p>
            Full details: <a href="https://github.com/ignismeow/solana-sentinel" target="_blank" rel="noopener noreferrer">GitHub README</a>
          </p>
        </div>
      </div>
    </div>
  );
}
