import { Link } from 'react-router-dom';
import { Activity, FileText, Shield } from 'lucide-react';

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
            Solana Treasury Protection
            <span className="gradient-text"> 24/7</span>
          </h1>
          <p className="hero-description">
            Monitors your treasury, flags risky transactions, and auto-quarantines suspect funds.
          </p>
          <div className="hero-buttons">
            <Link to="/app" className="btn btn-primary">
              <Activity size={20} />
              Dashboard
            </Link>
            <Link to="/docs" className="btn btn-secondary">
              <FileText size={20} />
              Documentation
            </Link>
            <a 
              href="https://github.com/ignismeow/solana-sentinel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-compact">
          <div className="feature-item">
            <strong>Real-time monitoring</strong> via Helius webhooks
          </div>
          <div className="feature-item">
            <strong>Automatic quarantine</strong> of high-risk deposits
          </div>
          <div className="feature-item">
            <strong>Jito bundles</strong> for MEV protection
          </div>
          <div className="feature-item">
            <strong>Signed audit trail</strong> for compliance
          </div>
          <div className="feature-item">
            <strong>Telegram alerts</strong> for instant notifications
          </div>
        </div>
      </section>
    </div>
  );
}
