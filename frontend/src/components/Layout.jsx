import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="logo-link">
            <Shield className="logo-icon" size={32} />
            <span className="logo-text">Sentinel</span>
          </Link>

          <button 
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/app" 
              className={`nav-link ${isActive('/app') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/docs" 
              className={`nav-link ${isActive('/docs') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </Link>
            <a 
              href="https://github.com/ignismeow/solana-sentinel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <Shield size={20} />
            <span>Sentinel © 2026</span>
          </div>
          <div className="footer-right">
            <span>Built for Colosseum Solana Agent Hackathon</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
