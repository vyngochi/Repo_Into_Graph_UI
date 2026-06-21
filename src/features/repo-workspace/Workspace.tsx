import React, { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AnalysisView from "../analysis/AnalysisView";
import FeaturesView from "../features-list/FeaturesView";
import BusinessFlowView from "../business-flow/BusinessFlowView";
import GraphScreen from "../graph/GraphScreen";
import QuizGeneratorView from "../question-generator/QuestionGeneratorView";
import { useAppStore } from "../../store/useAppStore";

const TABS = [
  { id: "analyze", label: "Phân tích", pageTitle: "Phân tích Repository" },
  { id: "features", label: "Features", pageTitle: "Danh sách Features" },
  { id: "bizflow", label: "Business Flow", pageTitle: "Business Flow" },
  { id: "graph", label: "Graph", pageTitle: "Dependency Graph" },
  { id: "quizgen", label: "Quiz Generator", pageTitle: "Tạo câu hỏi tự động" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const Workspace = () => {
  const { repoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedRepoPath, selectedRepoPath } = useAppStore();

  const searchParams = new URLSearchParams(location.search);
  const activeTab = (searchParams.get("tab") as TabId) || "analyze";
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  // Sync repo path from URL into store
  useEffect(() => {
    if (repoId) {
      const decoded = decodeURIComponent(repoId);
      if (decoded !== selectedRepoPath) {
        setSelectedRepoPath(decoded);
      }
    }
  }, [repoId]);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="page-title">{currentTab.pageTitle}</h1>
          <p
            className="page-subtitle"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
          >
            {repoId ? decodeURIComponent(repoId) : "Chưa chọn repository"}
          </p>
        </div>
        <div className="top-bar-right">
          <button
            className="server-url-badge"
            onClick={() => navigate("/dashboard")}
            title="Quay lại Dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Dashboard
          </button>
        </div>
      </header>

      {/* Workspace uses the sidebar nav for tab switching — rendered by Sidebar.tsx */}
      <div className="page-container">
        <div className="page active" style={{ padding: 0 }}>
          {activeTab === "analyze" && <AnalysisView />}
          {activeTab === "features" && <FeaturesView />}
          {activeTab === "bizflow" && <BusinessFlowView />}
          {activeTab === "graph" && <GraphScreen />}
          {activeTab === "quizgen" && <QuizGeneratorView />}
        </div>
      </div>
    </>
  );
};

export default Workspace;
