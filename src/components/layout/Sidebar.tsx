import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { ArrowLeftFromLine } from 'lucide-react';

const Sidebar = () => {
  const serverUrl = useAppStore(state => state.serverUrl);
  const location = useLocation();
  const navigate = useNavigate();
  const { repoId } = useParams();

  const isWorkspace = location.pathname.includes('/workspace');

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="6" cy="6" r="4" fill="#6366f1" />
            <circle cx="22" cy="6" r="4" fill="#8b5cf6" />
            <circle cx="14" cy="22" r="4" fill="#06b6d4" />
            <line x1="6" y1="6" x2="22" y2="6" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
            <line x1="6" y1="6" x2="14" y2="22" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" />
            <line x1="22" y1="6" x2="14" y2="22" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">RepoGraph</span>
          <span className="brand-version">{isWorkspace ? 'Workspace' : 'v1.0'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {!isWorkspace ? (
          <>
            <button
              className={`nav-item ${location.search.includes('tab=questions') ? '' : 'active'}`}
              onClick={() => navigate('/dashboard?tab=repos')}
            >
              <span>Danh sách Repo</span>
            </button>
            <button
              className={`nav-item ${location.search.includes('tab=questions') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard?tab=questions')}
            >
              <span>Bộ câu hỏi mẫu AI</span>
            </button>
          </>
        ) : (
          <>
            <button className="nav-item" onClick={() => navigate('/dashboard')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><ArrowLeftFromLine size={15} /> Back to Dashboard</div>
            </button>
            <button className={`nav-item ${location.search.includes('tab=analyze') || !location.search ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=analyze`)}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>Phân tích</span>
            </button>
            <button className={`nav-item ${location.search.includes('tab=features') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=features`)}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Features</span>
            </button>
            <button className={`nav-item ${location.search.includes('tab=bizflow') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=bizflow`)}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              <span>Business Flow</span>
            </button>
            <button className={`nav-item ${location.search.includes('tab=graph') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=graph`)}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 100 4 2 2 0 000-4zM5 15a2 2 0 100 4 2 2 0 000-4zM15 3a2 2 0 100 4 2 2 0 000-4zm0 12a2 2 0 100 4 2 2 0 000-4zm-5-8a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span>Graph</span>
            </button>
            <button className={`nav-item ${location.search.includes('tab=quizgen') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=quizgen`)}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Quiz Generator</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="server-status">
          <div className="status-dot" style={{ background: '#10b981', width: 8, height: 8, borderRadius: '50%' }}></div>
          <span className="status-label">{serverUrl}</span>
        </div>
        <button className="btn-settings" title="Cài đặt Server">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;