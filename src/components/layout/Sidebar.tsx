import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import {
  Folder,
  Question,
  MagnifyingGlass,
  ListBullets,
  TreeStructure,
  Graph,
  Exam,
  CaretLeft,
  CaretRight,
  ArrowLeft,
} from "@phosphor-icons/react";

const Sidebar = () => {
  const { serverUrl, isSidebarCollapsed, setIsSidebarCollapsed } =
    useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { repoId } = useParams();

  const isWorkspace = location.pathname.includes("/workspace");

  return (
    <aside
      className="sidebar"
      style={{
        width: isSidebarCollapsed ? "70px" : "220px",
        transition: "width 0.3s ease",
      }}
    >
      <div
        className="sidebar-brand"
        style={{
          justifyContent: isSidebarCollapsed ? "center" : "flex-start",
          padding: isSidebarCollapsed ? "20px 0 16px" : "20px 16px 16px",
        }}
      >
        <div
          className="brand-logo"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{ cursor: "pointer" }}
        >
          <Graph weight="duotone" size={28} color="#6366f1" />
        </div>
        {!isSidebarCollapsed && (
          <div className="brand-text">
            <span className="brand-name">Repo Into Graph</span>
            <span className="brand-version">
              {isWorkspace ? "Workspace" : "2026"}
            </span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!isWorkspace ? (
          <>
            <button
              className={`nav-item ${location.search.includes("tab=questions") ? "" : "active"}`}
              onClick={() => navigate("/dashboard?tab=repos")}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Danh sách Repo"
            >
              <Folder className="nav-icon" weight="fill" />
              {!isSidebarCollapsed && <span>Danh sách Repo</span>}
            </button>
            <button
              className={`nav-item ${location.search.includes("tab=questions") ? "active" : ""}`}
              onClick={() => navigate("/dashboard?tab=questions")}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Bộ câu hỏi AI"
            >
              <Question className="nav-icon" weight="fill" />
              {!isSidebarCollapsed && <span>Bộ câu hỏi AI</span>}
            </button>
          </>
        ) : (
          <>
            <button
              className="nav-item"
              onClick={() => navigate("/dashboard")}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Back to Dashboard"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--text-secondary)",
                }}
              >
                <ArrowLeft size={15} weight="bold" />
                {!isSidebarCollapsed && <span>Back to Dashboard</span>}
              </div>
            </button>
            <button
              className={`nav-item ${location.search.includes("tab=analyze") || !location.search ? "active" : ""}`}
              onClick={() => navigate(`/workspace/${repoId}?tab=analyze`)}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Phân tích"
            >
              <MagnifyingGlass className="nav-icon" weight="bold" />
              {!isSidebarCollapsed && <span>Phân tích</span>}
            </button>
            <button
              className={`nav-item ${location.search.includes("tab=features") ? "active" : ""}`}
              onClick={() => navigate(`/workspace/${repoId}?tab=features`)}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Features"
            >
              <ListBullets className="nav-icon" weight="bold" />
              {!isSidebarCollapsed && <span>Features</span>}
            </button>
            <button
              className={`nav-item ${location.search.includes("tab=bizflow") ? "active" : ""}`}
              onClick={() => navigate(`/workspace/${repoId}?tab=bizflow`)}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Business Flow"
            >
              <TreeStructure className="nav-icon" weight="bold" />
              {!isSidebarCollapsed && <span>Business Flow</span>}
            </button>
            <button
              className={`nav-item ${location.search.includes("tab=graph") ? "active" : ""}`}
              onClick={() => navigate(`/workspace/${repoId}?tab=graph`)}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Graph"
            >
              <Graph className="nav-icon" weight="bold" />
              {!isSidebarCollapsed && <span>Graph</span>}
            </button>
            <button
              className={`nav-item ${location.search.includes("tab=quizgen") ? "active" : ""}`}
              onClick={() => navigate(`/workspace/${repoId}?tab=quizgen`)}
              style={{
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                padding: isSidebarCollapsed ? "9px 0" : "9px 12px",
              }}
              title="Quiz Generator"
            >
              <Exam className="nav-icon" weight="bold" />
              {!isSidebarCollapsed && <span>Quiz Generator</span>}
            </button>
          </>
        )}
      </nav>

      <div
        className="sidebar-footer"
        style={{
          padding: isSidebarCollapsed ? "12px 0" : "12px 16px",
          justifyContent: isSidebarCollapsed ? "center" : "flex-start",
          flexDirection: isSidebarCollapsed ? "column" : "row",
        }}
      >
        <div
          className="server-status"
          style={{
            justifyContent: isSidebarCollapsed ? "center" : "flex-start",
            flex: isSidebarCollapsed ? "none" : 1,
            marginBottom: isSidebarCollapsed ? "8px" : 0,
          }}
        >
          <div
            className="status-dot connected"
            style={{ width: 8, height: 8, borderRadius: "50%" }}
            title={serverUrl}
          ></div>
          {!isSidebarCollapsed && (
            <span className="status-label">{serverUrl}</span>
          )}
        </div>
        <button
          className="btn-settings"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isSidebarCollapsed ? (
            <CaretRight size={16} weight="bold" />
          ) : (
            <CaretLeft size={16} weight="bold" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
