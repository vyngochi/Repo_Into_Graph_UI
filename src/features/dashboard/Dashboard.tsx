import {
  Folder,
  CheckCircle,
  List,
  Check,
  Database,
} from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serverUrl, showToast, setAnalysisResult } = useAppStore();
  const [repoPath, setRepoPath] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [editingRun, setEditingRun] = useState<any>(null);
  const [isUpdatingRun, setIsUpdatingRun] = useState(false);
  const [runForm, setRunForm] = useState({
    repoName: "",
    repoOwner: "",
    repoDescription: "",
    repoUrl: "",
    repoLanguage: "",
  });

  // Few-Shot state
  const [fewShots, setFewShots] = useState<any[]>([]);
  const [isLoadingFewShots, setIsLoadingFewShots] = useState(false);
  const [showFewShotForm, setShowFewShotForm] = useState(false);
  const [isCreatingFewShot, setIsCreatingFewShot] = useState(false);
  const [newFewShot, setNewFewShot] = useState({
    question: "",
    suggestedAnswer: "",
    difficulty: "Medium",
    tag: "",
    description: "",
  });
  const [editingFewShotId, setEditingFewShotId] = useState<string | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "repos";

  const fetchRuns = async () => {
    setIsLoadingRuns(true);
    try {
      const result = await window.api?.getAnalysisRuns({ baseUrl: serverUrl });
      if (result?.success) {
        const responseData = result.data;
        if (responseData && Array.isArray(responseData)) {
          setRuns(responseData);
        } else if (responseData && Array.isArray((responseData as any).items)) {
          setRuns((responseData as any).items);
        } else {
          setRuns([]);
        }
      } else {
        console.warn("Cannot fetch analysis runs:", result?.error);
      }
    } catch (err) {
      console.error("Error fetching analysis runs:", err);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  const fetchFewShots = async () => {
    setIsLoadingFewShots(true);
    try {
      const result = await window.api?.getFewShots({ baseUrl: serverUrl });
      if (result?.success) {
        const data = result.data;
        if (Array.isArray(data)) setFewShots(data);
        else if (data && Array.isArray((data as any).items))
          setFewShots((data as any).items);
        else if (data && Array.isArray((data as any).Items))
          setFewShots((data as any).Items);
        else setFewShots([]);
      } else {
        console.warn("Cannot fetch few shots:", result?.error);
      }
    } catch (err) {
      console.error("Error fetching few shots:", err);
    } finally {
      setIsLoadingFewShots(false);
    }
  };

  useEffect(() => {
    if (currentTab === "repos") {
      fetchRuns();
    } else if (currentTab === "questions") {
      fetchFewShots();
    }
  }, [serverUrl, currentTab]);

  const handleCreateFewShot = async () => {
    if (!newFewShot.question.trim() || !newFewShot.suggestedAnswer.trim()) {
      showToast("Câu hỏi và Câu trả lời không được để trống", "error");
      return;
    }

    setIsCreatingFewShot(true);
    try {
      const payload = {
        question: newFewShot.question.trim(),
        suggestedAnswer: newFewShot.suggestedAnswer.trim(),
        difficulty: newFewShot.difficulty.trim(),
        tag: newFewShot.tag.trim() || null,
        description: newFewShot.description.trim() || null,
      };

      let result;
      if (editingFewShotId) {
        result = await window.api?.updateFewShot({
          baseUrl: serverUrl,
          id: editingFewShotId,
          payload,
        });
      } else {
        result = await window.api?.createFewShot({
          baseUrl: serverUrl,
          payload,
        });
      }

      if (result?.success) {
        showToast(
          editingFewShotId
            ? "Cập nhật thành công!"
            : "Tạo câu hỏi mẫu thành công!",
          "success",
        );
        setShowFewShotForm(false);
        setEditingFewShotId(null);
        setNewFewShot({
          question: "",
          suggestedAnswer: "",
          difficulty: "Medium",
          tag: "",
          description: "",
        });
        fetchFewShots();
      } else {
        showToast(result?.error || "Lỗi khi lưu câu hỏi mẫu", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsCreatingFewShot(false);
    }
  };

  const handleEditFewShot = (shot: any) => {
    const id = shot.id || shot.Id;
    setEditingFewShotId(id);
    setNewFewShot({
      question: shot.question || shot.Question || "",
      suggestedAnswer: shot.suggestedAnswer || shot.SuggestedAnswer || "",
      difficulty: shot.difficulty || shot.Difficulty || "Medium",
      tag: shot.tag || shot.Tag || "",
      description: shot.description || shot.Description || "",
    });
    setShowFewShotForm(true);
  };

  const handleDeleteFewShot = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi mẫu này?")) return;

    try {
      const result = await window.api?.deleteFewShot({
        baseUrl: serverUrl,
        id,
      });
      if (result?.success) {
        showToast("Xóa thành công!", "success");
        fetchFewShots();
      } else {
        showToast(result?.error || "Lỗi khi xóa câu hỏi mẫu", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối đến server.", "error");
    }
  };

  const handleSelectFolder = async () => {
    const folder = await window.dialog?.selectFolder();
    if (folder) setRepoPath(folder);
  };

  const handleSelectOutputDir = async () => {
    const folder = await window.dialog?.selectFolder();
    if (folder) setOutputDir(folder);
  };

  const handleAnalyze = async () => {
    if (!repoPath.trim()) {
      showToast("Vui lòng nhập đường dẫn repository.", "error");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await window.api?.analyze({
        baseUrl: serverUrl,
        repositoryPath: repoPath.trim(),
        outputDir: outputDir.trim() || null,
      });
      if (result?.success) {
        const data = result.data as any;
        setAnalysisResult({
          callEdges: (data.edgesCount ??
            data.EdgesCount ??
            data.callEdges ??
            0) as number,
          methods: (data.methodsCount ??
            data.MethodsCount ??
            data.methods ??
            0) as number,
          repositoryPath: repoPath.trim(),
          status: "Completed",
          message: (data.message ?? data.Message) as string,
        });
        setShowAnalyzeModal(false);
        showToast(
          "Phân tích thành công! Đang chuyển đến Workspace...",
          "success",
        );
        const repoId = encodeURIComponent(repoPath.trim());
        navigate(`/workspace/${repoId}?tab=analyze`);
      } else {
        showToast(result?.error || "Phân tích thất bại.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openWorkspace = (path: string) => {
    const repoId = encodeURIComponent(path);
    navigate(`/workspace/${repoId}?tab=analyze`);
  };

  const handleUpdateRun = async () => {
    if (!editingRun) return;
    setIsUpdatingRun(true);
    try {
      const result = await window.api?.updateAnalysisRun({
        baseUrl: serverUrl,
        id: editingRun.id || editingRun.Id,
        payload: {
          repoName: runForm.repoName.trim() || null,
          repoOwner: runForm.repoOwner.trim() || null,
          repoDescription: runForm.repoDescription.trim() || null,
          repoUrl: runForm.repoUrl.trim() || null,
          repoLanguage: runForm.repoLanguage.trim() || null,
        },
      });
      if (result?.success) {
        showToast("Cập nhật thông tin thành công!", "success");
        setEditingRun(null);
        fetchRuns();
      } else {
        showToast(result?.error || "Lỗi khi cập nhật thông tin", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsUpdatingRun(false);
    }
  };

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="page-title">
            {currentTab === "repos"
              ? "Quản lý Repository"
              : "Ngân hàng câu hỏi mẫu (Few-Shot)"}
          </h1>
          <p className="page-subtitle">
            {currentTab === "repos"
              ? "Phân tích static code và theo dõi lịch sử chạy"
              : "Quản lý danh sách câu hỏi và câu trả lời mẫu cho AI"}
          </p>
        </div>
        <div className="top-bar-right">
          <div className="server-url-badge">
            <CheckCircle size={10} weight="fill" color="var(--green)" />
            {serverUrl}
          </div>
        </div>
      </header>

      <div className="page-container">
        {currentTab === "repos" ? (
          <div className="page active" style={{ overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* History List taking full width */}
              <div
                className="analyze-result-panel"
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div className="card" style={{ flex: 1, minHeight: 400 }}>
                  <div
                    className="card-header"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h2 className="card-title" style={{ fontSize: 15 }}>
                      Lịch sử các lượt phân tích
                    </h2>
                    <button
                      className="btn-primary"
                      onClick={() => setShowAnalyzeModal(true)}
                    >
                      + Phân tích repository mới
                    </button>
                  </div>

                  {isLoadingRuns ? (
                    <div className="loading-state">
                      <div className="spinner-large" />
                      <span>Đang tải danh sách lịch sử...</span>
                    </div>
                  ) : runs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-art">
                        <Database
                          size={48}
                          weight="duotone"
                          color="var(--border-light)"
                        />
                      </div>
                      <div className="empty-title">Chưa có dữ liệu lịch sử</div>
                      <div className="empty-desc">
                        Các lượt phân tích thành công trước đó sẽ được lưu lại
                        tại đây.
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginTop: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          padding: "0 16px",
                          gap: "16px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <div style={{ flex: 1 }}>Repository</div>
                        <div style={{ width: "100px" }}>Ngôn ngữ</div>
                        <div style={{ width: "140px" }}>Thời gian chạy</div>
                        <div style={{ width: "120px" }}>Trạng thái</div>
                        <div style={{ width: "140px", textAlign: "right" }}>
                          Hành động
                        </div>
                      </div>

                      {runs.map((run, index) => {
                        const pathStr =
                          run.repositoryPath || run.RepositoryPath || "";
                        const timeStr =
                          run.createdAt || run.CreatedAt
                            ? new Date(
                                run.createdAt || run.CreatedAt,
                              ).toLocaleString("vi-VN")
                            : "—";
                        const statusStr = run.status || run.Status || "Success";
                        const isFailed = statusStr.toLowerCase() === "failed";

                        return (
                          <div
                            key={run.id || index}
                            className="card-flat"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "12px 16px",
                              gap: "16px",
                              transition: "all 0.2s",
                              cursor: "default",
                              border: "1px solid var(--border)",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow = "var(--shadow)";
                              e.currentTarget.style.borderColor = "var(--blue)";
                              e.currentTarget.style.background =
                                "var(--bg-elevated)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.borderColor =
                                "var(--border)";
                              e.currentTarget.style.background =
                                "var(--bg-elevated)";
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                overflow: "hidden",
                              }}
                              title={pathStr}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {run.repoName || run.RepoName || pathStr.split(/[\\/]/).pop()}
                                </span>
                                {(run.isPublic !== undefined || run.IsPublic !== undefined) && (
                                  <span style={{ fontSize: 10, padding: "2px 6px", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-secondary)", fontWeight: 600, background: "var(--bg-surface)" }}>
                                    {(run.isPublic ?? run.IsPublic) ? "Public" : "Private"}
                                  </span>
                                )}
                                {(run.repoStars !== undefined || run.RepoStars !== undefined) && (
                                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
                                    ★ {run.repoStars || run.RepoStars}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                {(run.repoOwner || run.RepoOwner) && (
                                  <><span>{run.repoOwner || run.RepoOwner}</span><span>•</span></>
                                )}
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pathStr}</span>
                              </div>
                            </div>
                            
                            <div style={{ width: "100px", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center" }}>
                              {run.repoLanguage || run.RepoLanguage || "—"}
                            </div>

                            <div
                              style={{
                                width: "140px",
                                color: "var(--text-secondary)",
                                fontSize: 12,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center"
                              }}
                            >
                              {timeStr}
                            </div>
                            
                            <div style={{ width: "120px", display: "flex", alignItems: "center" }}>
                              <span
                                className={`badge badge-${isFailed ? "red" : "green"}`}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: isFailed
                                    ? "var(--red)"
                                    : "var(--green)",
                                  background: isFailed
                                    ? "var(--red-dim)"
                                    : "var(--green-dim)",
                                  border: `1px solid ${isFailed ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                                }}
                              >
                                {statusStr}
                              </span>
                            </div>
                            <div
                              style={{
                                width: "140px",
                                textAlign: "right",
                                display: "flex",
                                gap: "8px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                className="btn-secondary"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                                onClick={() => {
                                  setEditingRun(run);
                                  setRunForm({
                                    repoName:
                                      run.repoName || run.RepoName || "",
                                    repoOwner:
                                      run.repoOwner || run.RepoOwner || "",
                                    repoDescription:
                                      run.repoDescription ||
                                      run.RepoDescription ||
                                      "",
                                    repoUrl: run.repoUrl || run.RepoUrl || "",
                                    repoLanguage:
                                      run.repoLanguage ||
                                      run.RepoLanguage ||
                                      "",
                                  });
                                }}
                                title="Sửa thông tin Metadata"
                              >
                                Sửa
                              </button>
                              <button
                                className="btn-secondary"
                                style={{
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "var(--blue)",
                                }}
                                onClick={() => openWorkspace(pathStr)}
                              >
                                Workspace
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="page active" style={{ overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Header card with add button */}
              <div
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h2 className="card-title" style={{ fontSize: 15 }}>
                    Quản lý ngân hàng câu hỏi mẫu
                  </h2>
                  <p
                    className="card-desc"
                    style={{ marginBottom: 0, marginTop: 4 }}
                  >
                    Định nghĩa các câu hỏi và câu trả lời chất lượng cao để
                    hướng dẫn AI sinh câu hỏi chính xác hơn.
                  </p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (showFewShotForm) {
                      setShowFewShotForm(false);
                      setEditingFewShotId(null);
                      setNewFewShot({
                        question: "",
                        suggestedAnswer: "",
                        difficulty: "Medium",
                        tag: "",
                        description: "",
                      });
                    } else {
                      setShowFewShotForm(true);
                    }
                  }}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="16"
                    height="16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {showFewShotForm ? "Đóng biểu mẫu" : "Thêm câu hỏi mẫu"}
                </button>
              </div>

              {/* Form to add few shot */}
              {showFewShotForm && (
                <div className="card">
                  <h3
                    className="card-title"
                    style={{ marginBottom: 16, fontSize: 14 }}
                  >
                    {editingFewShotId
                      ? "Chỉnh sửa câu hỏi mẫu"
                      : "Tạo câu hỏi mẫu mới"}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <div
                      className="form-group"
                      style={{ gridColumn: "span 2" }}
                    >
                      <label className="form-label">Nội dung câu hỏi mẫu</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Nhập câu hỏi mẫu giảng viên biên soạn..."
                        value={newFewShot.question}
                        onChange={(e) =>
                          setNewFewShot({
                            ...newFewShot,
                            question: e.target.value,
                          })
                        }
                        style={{ resize: "vertical" }}
                      />
                    </div>
                    <div
                      className="form-group"
                      style={{ gridColumn: "span 2" }}
                    >
                      <label className="form-label">
                        Đáp án gợi ý tương ứng
                      </label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Nhập đáp án gợi ý chi tiết làm tiêu chuẩn..."
                        value={newFewShot.suggestedAnswer}
                        onChange={(e) =>
                          setNewFewShot({
                            ...newFewShot,
                            suggestedAnswer: e.target.value,
                          })
                        }
                        style={{ resize: "vertical" }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mức độ khó</label>
                      <select
                        className="form-input"
                        value={newFewShot.difficulty}
                        onChange={(e) =>
                          setNewFewShot({
                            ...newFewShot,
                            difficulty: e.target.value,
                          })
                        }
                      >
                        <option value="Easy">Dễ (Easy)</option>
                        <option value="Medium">Trung bình (Medium)</option>
                        <option value="Hard">Khó (Hard)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Nhãn (Tag) - Tùy chọn
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ví dụ: validation, business-rule..."
                        value={newFewShot.tag}
                        onChange={(e) =>
                          setNewFewShot({ ...newFewShot, tag: e.target.value })
                        }
                      />
                    </div>
                    <div
                      className="form-group"
                      style={{ gridColumn: "span 2" }}
                    >
                      <label className="form-label">
                        Ghi chú thêm - Tùy chọn
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Mục đích câu hỏi hoặc lưu ý đặc biệt..."
                        value={newFewShot.description}
                        onChange={(e) =>
                          setNewFewShot({
                            ...newFewShot,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setShowFewShotForm(false);
                        setEditingFewShotId(null);
                        setNewFewShot({
                          question: "",
                          suggestedAnswer: "",
                          difficulty: "Medium",
                          tag: "",
                          description: "",
                        });
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleCreateFewShot}
                      disabled={isCreatingFewShot}
                    >
                      {isCreatingFewShot && (
                        <span
                          className="btn-spinner"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      {editingFewShotId ? "Cập nhật" : "Lưu lại"}
                    </button>
                  </div>
                </div>
              )}

              {/* Few Shot List */}
              <div className="card">
                <h2 className="card-title" style={{ marginBottom: 12 }}>
                  Danh sách câu hỏi hiện tại
                </h2>

                {isLoadingFewShots ? (
                  <div className="loading-state">
                    <div className="spinner-large" />
                    <span>Đang tải danh sách câu hỏi mẫu...</span>
                  </div>
                ) : fewShots.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-art">
                      <Database
                        size={48}
                        weight="duotone"
                        color="var(--border-light)"
                      />
                    </div>
                    <div className="empty-title">Chưa có câu hỏi mẫu nào</div>
                    <div className="empty-desc">
                      Nhấn nút "Thêm câu hỏi mẫu" ở góc trên bên phải để tạo câu
                      hỏi mẫu đầu tiên.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    {fewShots.map((shot, index) => {
                      const id = shot.id || shot.Id;
                      const qText = shot.question || shot.Question || "";
                      const aText =
                        shot.suggestedAnswer || shot.SuggestedAnswer || "";
                      const diff =
                        shot.difficulty || shot.Difficulty || "Medium";
                      const tag = shot.tag || shot.Tag;
                      const desc = shot.description || shot.Description;

                      return (
                        <div
                          key={id || index}
                          className="card-flat"
                          style={{
                            borderLeft: "3px solid var(--purple)",
                            background: "var(--bg-hover)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                              }}
                            >
                              <span className="badge badge-gray">
                                #{index + 1}
                              </span>
                              <span
                                className={`badge ${diff.toLowerCase() === "easy" ? "green" : diff.toLowerCase() === "hard" ? "red" : "purple"}`}
                              >
                                {diff}
                              </span>
                              {tag && (
                                <span className="badge badge-blue">{tag}</span>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                }}
                              >
                                {shot.createdAt || shot.CreatedAt
                                  ? new Date(
                                      shot.createdAt || shot.CreatedAt,
                                    ).toLocaleDateString("vi-VN")
                                  : ""}
                              </span>
                              <button
                                className="btn-secondary"
                                style={{ padding: "4px 8px", fontSize: 11 }}
                                onClick={() => handleEditFewShot(shot)}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn-secondary"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  color: "var(--red)",
                                  borderColor: "rgba(244, 63, 94, 0.3)",
                                }}
                                onClick={() => handleDeleteFewShot(id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginTop: 10,
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {qText}
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              padding: "10px 12px",
                              background: "rgba(0,0,0,0.02)",
                              borderLeft: "2px solid rgba(0,0,0,0.1)",
                              borderRadius:
                                "0 var(--radius-sm) var(--radius-sm) 0",
                              fontSize: 12.5,
                              color: "var(--text-secondary)",
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                textTransform: "uppercase",
                                color: "var(--text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Đáp án gợi ý
                            </div>
                            {aText}
                          </div>

                          {desc && (
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 11,
                                color: "var(--text-muted)",
                                display: "flex",
                                gap: 4,
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>Ghi chú:</span>{" "}
                              {desc}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Run Modal */}
      {editingRun && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 500, margin: "20px" }}
          >
            <h3 className="card-title" style={{ marginBottom: 16 }}>
              Chỉnh sửa thông tin Repository
            </h3>
            <div className="form-group">
              <label className="form-label">Tên Repository</label>
              <input
                type="text"
                className="form-input"
                value={runForm.repoName}
                onChange={(e) =>
                  setRunForm({ ...runForm, repoName: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Owner</label>
              <input
                type="text"
                className="form-input"
                value={runForm.repoOwner}
                onChange={(e) =>
                  setRunForm({ ...runForm, repoOwner: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-input"
                value={runForm.repoDescription}
                onChange={(e) =>
                  setRunForm({ ...runForm, repoDescription: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">URL / Liên kết</label>
              <input
                type="text"
                className="form-input"
                value={runForm.repoUrl}
                onChange={(e) =>
                  setRunForm({ ...runForm, repoUrl: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngôn ngữ</label>
              <input
                type="text"
                className="form-input"
                value={runForm.repoLanguage}
                onChange={(e) =>
                  setRunForm({ ...runForm, repoLanguage: e.target.value })
                }
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setEditingRun(null)}
              >
                Hủy
              </button>
              <button
                className="btn-primary"
                onClick={handleUpdateRun}
                disabled={isUpdatingRun}
              >
                {isUpdatingRun && (
                  <span className="btn-spinner" style={{ marginRight: 6 }} />
                )}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {showAnalyzeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 500, margin: "20px" }}
          >
            <div
              className="card-header"
              style={{
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div className="card-icon cyan">
                <List size={16} weight="bold" />
              </div>
              <h3 className="card-title" style={{ margin: 0 }}>
                Phân tích Repo mới
              </h3>
            </div>
            <p className="card-desc" style={{ marginBottom: 20 }}>
              Nhập thư mục code local của bạn để quét đồ thị lời gọi hàm.
            </p>

            <div className="form-group">
              <label className="form-label">
                Thư mục nguồn (Repository Path)
              </label>
              <div className="input-with-btn">
                <input
                  type="text"
                  className="form-input"
                  placeholder="C:\path\to\your\project"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  disabled={isAnalyzing}
                />
                <button
                  className="btn-icon"
                  onClick={handleSelectFolder}
                  title="Browse"
                  disabled={isAnalyzing}
                >
                  <Folder size={16} weight="fill" />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Thư mục đầu ra (Output Path) - Tùy chọn
              </label>
              <div className="input-with-btn">
                <input
                  type="text"
                  className="form-input"
                  placeholder="./output (Mặc định)"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  disabled={isAnalyzing}
                />
                <button
                  className="btn-icon"
                  onClick={handleSelectOutputDir}
                  title="Browse"
                  disabled={isAnalyzing}
                >
                  <Folder size={16} weight="fill" />
                </button>
              </div>
            </div>

            {isAnalyzing && (
              <div style={{ marginTop: 24, marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>Đang tiến hành phân tích...</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    background: "var(--border-light)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--blue)",
                      width: "30%",
                      animation: "progress-indeterminate 1.5s infinite linear",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowAnalyzeModal(false)}
                disabled={isAnalyzing}
              >
                Hủy
              </button>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing && (
                  <span className="btn-spinner" style={{ marginRight: 6 }} />
                )}
                Bắt đầu phân tích
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
