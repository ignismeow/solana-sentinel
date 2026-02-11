import { Link } from 'react-router-dom';
import { Shield, Bell, Lock, GitBranch, Activity, FileText, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={16} />
            <span>Autonomous Compliance Guard</span>
          </div>
          <h1 className="hero-title">
            Protect Your Solana Treasury
            <span className="gradient-text"> 24/7</span>
          </h1>
          <p className="hero-description">
            Sentinel is an intelligent agent that monitors your on-chain treasury, 
            flags risky transactions, and automatically quarantines suspect funds. 
            Always vigilant, always compliant.
          </p>
          <div className="hero-buttons">
            <Link to="/app" className="btn btn-primary">
              <Activity size={20} />
              View Dashboard
            </Link>
            <Link to="/docs" className="btn btn-secondary">
              <FileText size={20} />
              Read Docs
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <AlertTriangle size={20} className="icon-warning" />
            <span>High-risk detected</span>
          </div>
          <div className="floating-card card-2">
            <CheckCircle size={20} className="icon-success" />
            <span>Funds quarantined</span>
          </div>
          <div className="floating-card card-3">
            <Bell size={20} className="icon-info" />
            <span>Alert sent</span>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2>Key Features</h2>
          <p>Built for security, compliance, and peace of mind</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Activity />
            </div>
            <h3>Real-Time Monitoring</h3>
            <p>
              Helius webhooks stream every treasury transaction directly to the risk engine. 
              No delays, no blind spots.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Lock />
            </div>
            <h3>Automatic Quarantine</h3>
            <p>
              High-risk deposits are instantly swept to a secure escrow wallet, 
              preventing unauthorized fund movement.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <GitBranch />
            </div>
            <h3>Deterministic Risk Model</h3>
            <p>
              Configurable SOL thresholds and verified sender whitelists ensure 
              predictable, auditable compliance decisions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Zap />
            </div>
            <h3>Jito Bundle Protection</h3>
            <p>
              On mainnet, quarantine transfers use Jito bundles with tips to 
              prevent MEV front-running attacks.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FileText />
            </div>
            <h3>Audit Trail</h3>
            <p>
              Every action generates signed audit proofs, providing immutable 
              compliance records for reviewers.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Bell />
            </div>
            <h3>Instant Alerts</h3>
            <p>
              Telegram notifications keep you informed of every high-risk event 
              and quarantine action in real-time.
            </p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Always Monitoring</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">&lt;1s</div>
            <div className="stat-label">Response Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">100%</div>
            <div className="stat-label">Audit Coverage</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">Zero</div>
            <div className="stat-label">Manual Oversight</div>
          </div>
        </div>
      </section>

      <section className="architecture-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Simple, deterministic, and battle-tested</p>
        </div>
        
        <div className="architecture-flow">
          <div className="flow-step">
            <div className="step-number">1</div>
            <h4>Webhook Ingestion</h4>
            <p>Helius delivers transaction data to the watcher endpoint</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <h4>Risk Assessment</h4>
            <p>Engine scores transactions against compliance rules</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <h4>Smart Execution</h4>
            <p>High-risk funds are quarantined via secure execution</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">4</div>
            <h4>Audit & Alert</h4>
            <p>Signed proofs and notifications complete the loop</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Secure Your Treasury?</h2>
          <p>Deploy Sentinel in minutes and gain 24/7 compliance protection</p>
          <div className="cta-buttons">
            <Link to="/docs" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <a 
              href="https://github.com/ignismeow/solana-sentinel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-large"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
