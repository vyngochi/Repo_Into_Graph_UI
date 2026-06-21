import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { ArrowLeftFromLine, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const { serverUrl, isSidebarCollapsed, setIsSidebarCollapsed } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { repoId } = useParams();

  const isWorkspace = location.pathname.includes('/workspace');

  return (
    <aside className="sidebar" style={{ width: isSidebarCollapsed ? '70px' : '220px', transition: 'width 0.3s ease' }}>
      <div className="sidebar-brand" style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '20px 0 16px' : '20px 16px 16px' }}>
        <div className="brand-logo" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} style={{ cursor: 'pointer' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="6" cy="6" r="4" fill="#6366f1" />
            <circle cx="22" cy="6" r="4" fill="#8b5cf6" />
            <circle cx="14" cy="22" r="4" fill="#06b6d4" />
            <line x1="6" y1="6" x2="22" y2="6" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
            <line x1="6" y1="6" x2="14" y2="22" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" />
            <line x1="22" y1="6" x2="14" y2="22" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
          </svg>
        </div>
        {!isSidebarCollapsed && (
          <div className="brand-text">
            <span className="brand-name">RepoGraph</span>
            <span className="brand-version">{isWorkspace ? 'Workspace' : 'v1.0'}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!isWorkspace ? (
          <>
            <button
              className={`nav-item ${location.search.includes('tab=questions') ? '' : 'active'}`}
              onClick={() => navigate('/dashboard?tab=repos')}
              style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }}
              title="Danh sách Repo"
            >
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" />
              </svg>
              {!isSidebarCollapsed && <span>Danh sách Repo</span>}
            </button>
            <button
              className={`nav-item ${location.search.includes('tab=questions') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard?tab=questions')}
              style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }}
              title="Bộ câu hỏi AI"
            >
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {!isSidebarCollapsed && <span>Bộ câu hỏi AI</span>}
            </button>
          </>
        ) : (
          <>
            <button className="nav-item" onClick={() => navigate('/dashboard')} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }} title="Back to Dashboard">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <ArrowLeftFromLine size={15} /> 
                {!isSidebarCollapsed && <span>Back to Dashboard</span>}
              </div>
            </button>
            <button className={`nav-item ${location.search.includes('tab=analyze') || !location.search ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=analyze`)} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }} title="Phân tích">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              {!isSidebarCollapsed && <span>Phân tích</span>}
            </button>
            <button className={`nav-item ${location.search.includes('tab=features') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=features`)} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }} title="Features">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              {!isSidebarCollapsed && <span>Features</span>}
            </button>
            <button className={`nav-item ${location.search.includes('tab=bizflow') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=bizflow`)} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }} title="Business Flow">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              {!isSidebarCollapsed && <span>Business Flow</span>}
            </button>
            <button className={`nav-item ${location.search.includes('tab=graph') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=graph`)} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }} title="Graph">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 100 4 2 2 0 000-4zM5 15a2 2 0 100 4 2 2 0 000-4zM15 3a2 2 0 100 4 2 2 0 000-4zm0 12a2 2 0 100 4 2 2 0 000-4zm-5-8a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {!isSidebarCollapsed && <span>Graph</span>}
            </button>
            <button className={`nav-item ${location.search.includes('tab=quizgen') ? 'active' : ''}`} onClick={() => navigate(`/workspace/${repoId}?tab=quizgen`)} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '9px 0' : '9px 12px' }} title="Quiz Generator">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {!isSidebarCollapsed && <span>Quiz Generator</span>}
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer" style={{ padding: isSidebarCollapsed ? '12px 0' : '12px 16px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', flexDirection: isSidebarCollapsed ? 'column' : 'row' }}>
        <div className="server-status" style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', flex: isSidebarCollapsed ? 'none' : 1, marginBottom: isSidebarCollapsed ? '8px' : 0 }}>
          <div className="status-dot connected" style={{ width: 8, height: 8, borderRadius: '50%' }} title={serverUrl}></div>
          {!isSidebarCollapsed && <span className="status-label">{serverUrl}</span>}
        </div>
        <button 
          className="btn-settings" 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
