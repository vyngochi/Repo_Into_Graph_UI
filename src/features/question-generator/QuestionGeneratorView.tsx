import { MagnifyingGlass, Question, Database } from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import { useAppStore, BusinessFlow } from "../../store/useAppStore";
import { FeatureInteractiveGraph } from "../features-list/FeatureInteractiveGraph";

const QuizGeneratorView = () => {
  const { serverUrl, businessFlows, setBusinessFlows, showToast } =
    useAppStore();
  const [selectedFlow, setSelectedFlow] = useState<BusinessFlow | null>(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [additionalContext, setAdditionalContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [analysisRuns, setAnalysisRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);

  // Highlight Modal State
  const [highlightModal, setHighlightModal] = useState<{
    isOpen: boolean;
    question: string;
    activeNodeIds: string[];
    parsedGraph: { nodes: any[]; edges: any[] } | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    question: "",
    activeNodeIds: [],
    parsedGraph: null,
    isLoading: false,
  });

  // Few-Shot state
  const [fewShots, setFewShots] = useState<any[]>([]);
  const [isLoadingFewShots, setIsLoadingFewShots] = useState(false);
  const [selectedFewShots, setSelectedFewShots] = useState<string[]>([]);
  const [fewShotSearch, setFewShotSearch] = useState("");

  const filteredFewShots = fewShots.filter((shot) => {
    const qText = shot.question || shot.Question || "";
    const tagText = shot.tag || shot.Tag || "";
    const term = fewShotSearch.toLowerCase();
    return (
      qText.toLowerCase().includes(term) || tagText.toLowerCase().includes(term)
    );
  });

  const fetchAnalysisRuns = async () => {
    try {
      const res = await window.api?.getAnalysisRuns({ baseUrl: serverUrl });
      if (res?.success && res.data) {
        const data = res.data;
        let items: any[] = [];
        if (Array.isArray(data)) items = data;
        else if (data && Array.isArray((data as any).items))
          items = (data as any).items;

        setAnalysisRuns(items);
        if (items.length > 0) {
          setSelectedRunId(items[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFlows = async () => {
    if (!selectedRunId) return;
    setIsLoadingFlows(true);
    try {
      const res = await window.api?.getBusinessFlows({
        baseUrl: serverUrl,
        analysisRunId: selectedRunId,
      });
      if (res?.success && res.status === 200) {
        const data = res.data;
        if (Array.isArray(data)) setBusinessFlows(data as BusinessFlow[]);
        else if (data && Array.isArray((data as any).items))
          setBusinessFlows((data as any).items as BusinessFlow[]);
        else if (data && Array.isArray((data as any).Items))
          setBusinessFlows((data as any).Items as BusinessFlow[]);
        else setBusinessFlows([]);
      } else {
        showToast(
          `Lỗi load flows (${res?.status}): ${JSON.stringify(res?.data)}`,
          "error",
        );
      }
    } catch {
      showToast("Không thể tải danh sách business flows.", "error");
    } finally {
      setIsLoadingFlows(false);
    }
  };

  const loadFewShots = async () => {
    setIsLoadingFewShots(true);
    try {
      const res = await window.api?.getFewShots({ baseUrl: serverUrl });
      if (res?.success) {
        const data = res.data;
        if (Array.isArray(data)) setFewShots(data);
        else if (data && Array.isArray((data as any).items))
          setFewShots((data as any).items);
        else if (data && Array.isArray((data as any).Items))
          setFewShots((data as any).Items);
        else setFewShots([]);
      }
    } catch {
      showToast("Không thể tải danh sách câu hỏi mẫu.", "error");
    } finally {
      setIsLoadingFewShots(false);
    }
  };

  useEffect(() => {
    fetchAnalysisRuns();
  }, [serverUrl]);

  useEffect(() => {
    loadFlows();
  }, [serverUrl, selectedRunId]);

  useEffect(() => {
    loadFewShots();
  }, []);

  const handleGenerate = async () => {
    if (!selectedFlow) {
      showToast("Vui lòng chọn một Business Flow.", "error");
      return;
    }
    setIsLoading(true);
    setGeneratedQuestions([]);
    try {
      const res = await window.api?.generateQuestions({
        baseUrl: serverUrl,
        businessFlowId: selectedFlow.id,
        numberOfQuestions: numQuestions,
        difficulty,
        additionalContext: additionalContext || null,
        fewShotExampleIds:
          selectedFewShots.length > 0 ? selectedFewShots : null,
      });

      if (res?.success) {
        const questions = Array.isArray(res.data)
          ? res.data
          : (res.data as Record<string, any>)?.generatedQuestionDtos ||
            (res.data as Record<string, any>)?.GeneratedQuestionDtos ||
            ((res.data as Record<string, any>)?.questions as any[]);

        setGeneratedQuestions(questions || []);
        setAssessmentResults(null); // Reset on new generate
        showToast(`Đã tạo ${(questions || []).length} câu hỏi!`, "success");
      } else {
        showToast(res?.error || "Không thể tạo câu hỏi.", "error");
      }
    } catch {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssessQuality = async () => {
    if (!selectedFlow || generatedQuestions.length === 0) return;
    setIsAssessing(true);
    setAssessmentResults(null);
    try {
      const payload = {
        businessId: selectedFlow.id,
        businessName: selectedFlow.businessName,
        generatedQuestionDtos: generatedQuestions.map((q) => ({
          question: q.question || q.Question || "",
          suggestedAnswer: q.suggestedAnswer || q.SuggestedAnswer || "",
          difficulty: q.difficulty || q.Difficulty || "",
        })),
      };

      const coverageRes = await window.api?.assessFromResponse({
        baseUrl: serverUrl,
        payload,
      });
      if (coverageRes?.status !== 200) {
        console.error("Coverage API Error:", coverageRes);
        showToast(
          "Lỗi API Coverage: " + JSON.stringify(coverageRes?.data),
          "error",
        );
        setIsAssessing(false);
        return;
      }

      const accuracyRes = await window.api?.assessAccuracy({
        baseUrl: serverUrl,
        payload,
      });
      const difficultyRes = await window.api?.assessDifficulty({
        baseUrl: serverUrl,
        payload,
      });

      setAssessmentResults({
        coverage:
          coverageRes?.success && coverageRes?.status === 200
            ? coverageRes.data
            : null,
        accuracy:
          accuracyRes?.success && accuracyRes?.status === 200
            ? accuracyRes.data
            : null,
        difficulty:
          difficultyRes?.success && difficultyRes?.status === 200
            ? difficultyRes.data
            : null,
      });
      showToast("Đã hoàn thành đánh giá chất lượng!", "success");
    } catch (err) {
      showToast("Lỗi khi đánh giá chất lượng.", "error");
    } finally {
      setIsAssessing(false);
    }
  };

  const handleShowGraph = async (qText: string, activeNodeIds: string[]) => {
    if (!selectedFlow) return;
    setHighlightModal({
      isOpen: true,
      question: qText,
      activeNodeIds,
      parsedGraph: null,
      isLoading: true,
    });

    try {
      const res = await window.api?.getBusinessGraph({
        baseUrl: serverUrl,
        id: selectedFlow.id,
      });
      if (res?.success && res.data) {
        const graphData = res.data as any;
        const parsed = {
          nodes:
            graphData.nodes?.map((n: any) => ({ id: n.id, label: n.name })) ||
            [],
          edges:
            graphData.edges?.map((e: any) => ({
              source: e.fromNodeId,
              target: e.toNodeId,
              label: e.condition || undefined,
            })) || [],
        };
        setHighlightModal((prev) => ({ ...prev, parsedGraph: parsed }));
      } else {
        showToast("Không thể tải đồ thị nghiệp vụ.", "error");
        setHighlightModal((prev) => ({ ...prev, isOpen: false }));
      }
    } catch (err) {
      showToast("Lỗi khi tải đồ thị.", "error");
      setHighlightModal((prev) => ({ ...prev, isOpen: false }));
    } finally {
      setHighlightModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const difficultyLabel: Record<string, string> = {
    Easy: "Dễ",
    Medium: "Trung bình",
    Hard: "Khó",
  };

  return (
    <div className="page active" style={{ padding: "24px 28px" }}>
      <div className="analyze-layout">
        {/* Left: Form */}
        <div className="card analyze-form-card">
          <div className="card-header">
            <div className="card-icon blue">
              <Question size={16} weight="fill" />
            </div>
            <div className="card-title">Tạo câu hỏi tự động</div>
          </div>
          <p className="card-desc">Dùng AI sinh câu hỏi từ Business Flow</p>

          {/* Analysis Run selection */}
          <div className="form-group">
            <label
              className="form-label"
              style={{
                fontWeight: 600,
                fontSize: "11px",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              Lần phân tích (Analysis Run)
            </label>
            <select
              className="form-input"
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              {analysisRuns.map((run) => (
                <option key={run.id} value={run.id}>
                  {new Date(run.createdAt).toLocaleString("vi-VN")} -{" "}
                  {run.repositoryPath?.split(/[/\\]/).pop()}
                </option>
              ))}
            </select>
          </div>

          {/* Business Flow selection */}
          <div className="form-group">
            <label className="form-label">Business Flow</label>
            {isLoadingFlows ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-muted)",
                  fontSize: 13,
                  padding: "10px 0",
                }}
              >
                <span
                  className="btn-spinner"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "var(--blue)",
                    width: 14,
                    height: 14,
                  }}
                />
                Đang tải danh sách...
              </div>
            ) : (
              <select
                className="form-input"
                value={selectedFlow?.id || ""}
                onChange={(e) => {
                  const flow =
                    businessFlows.find((f) => f.id === e.target.value) || null;
                  setSelectedFlow(flow);
                }}
                style={{ cursor: "pointer" }}
              >
                <option value="">-- Chọn Business Flow --</option>
                {businessFlows.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.businessName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label className="form-label">Độ khó mong muốn</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Easy", "Medium", "Hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${difficulty === d ? "var(--blue)" : "var(--border)"}`,
                    background:
                      difficulty === d
                        ? "var(--blue-dim)"
                        : "var(--bg-elevated)",
                    color:
                      difficulty === d
                        ? "var(--blue-light)"
                        : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-main)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {difficultyLabel[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Number of questions */}
          <div className="form-group">
            <label className="form-label">Số lượng câu hỏi</label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={20}
              value={numQuestions}
              onChange={(e) =>
                setNumQuestions(
                  Math.max(1, Math.min(20, parseInt(e.target.value) || 5)),
                )
              }
            />
          </div>

          {/* Few-Shot template selection */}
          <div className="form-group">
            <label
              className="form-label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span>Câu hỏi mẫu (Few-Shot)</span>
              {selectedFewShots.length > 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--blue)",
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  Đã chọn {selectedFewShots.length}
                </span>
              )}
            </label>

            <div className="search-box" style={{ marginBottom: "10px" }}>
              <MagnifyingGlass
                className="search-icon"
                size={16}
                weight="bold"
              />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm câu hỏi hoặc tag..."
                value={fewShotSearch}
                onChange={(e) => setFewShotSearch(e.target.value)}
                style={{ background: "var(--bg-elevated)" }}
              />
            </div>

            {isLoadingFewShots ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-muted)",
                  fontSize: 13,
                  padding: "10px 0",
                }}
              >
                <span
                  className="btn-spinner"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "var(--blue)",
                    width: 14,
                    height: 14,
                  }}
                />
                Đang tải danh sách...
              </div>
            ) : fewShots.length === 0 ? (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  padding: "12px",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed var(--border)",
                  textAlign: "center",
                }}
              >
                Chưa có câu hỏi mẫu nào được lưu
              </div>
            ) : filteredFewShots.length === 0 ? (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  padding: "12px",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed var(--border)",
                  textAlign: "center",
                }}
              >
                Không tìm thấy câu hỏi mẫu phù hợp
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  paddingRight: "4px",
                }}
              >
                {filteredFewShots.map((shot) => {
                  const id = shot.id || shot.Id;
                  const isChecked = selectedFewShots.includes(id);
                  const qText = shot.question || shot.Question || "";
                  const tagText = shot.tag || shot.Tag;
                  return (
                    <div
                      key={id}
                      className="card-flat"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedFewShots(
                            selectedFewShots.filter((x) => x !== id),
                          );
                        } else {
                          setSelectedFewShots([...selectedFewShots, id]);
                        }
                      }}
                      style={{
                        padding: "12px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        border: isChecked
                          ? "1px solid var(--blue)"
                          : "1px solid var(--border)",
                        background: isChecked
                          ? "var(--blue-dim)"
                          : "var(--bg-elevated)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        style={{
                          marginTop: "2px",
                          accentColor: "var(--blue)",
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: isChecked ? 600 : 500,
                            color: isChecked
                              ? "var(--blue-light)"
                              : "var(--text-primary)",
                            lineHeight: 1.4,

                            wordBreak: "break-word",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {qText}
                        </span>
                        {tagText && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                            }}
                          >
                            #{tagText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional context */}
          <div className="form-group">
            <label className="form-label">
              Ngữ cảnh bổ sung <span className="optional">(tùy chọn)</span>
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Thêm hướng dẫn, văn phong hoặc yêu cầu đặc biệt..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <button
            className="btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={isLoading || !selectedFlow}
            style={{ marginTop: "auto" }}
          >
            {isLoading ? <span className="btn-spinner" /> : null}
            {isLoading ? "Đang tạo câu hỏi..." : "Tạo câu hỏi"}
          </button>
        </div>

        {/* Right: Results */}
        <div
          className="analyze-result-panel"
          style={{ overflowY: "auto", paddingRight: 4 }}
        >
          {!isLoading && generatedQuestions.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-art">
                  <Database
                    size={64}
                    weight="duotone"
                    color="var(--border-light)"
                  />
                </div>
                <div className="empty-title">
                  Chưa có câu hỏi nào được sinh ra
                </div>
                <div className="empty-desc">
                  Chọn Business Flow và thiết lập tham số ở cột trái, sau đó
                  nhấn <strong>Tạo câu hỏi</strong> để bắt đầu sinh.
                </div>
              </div>
            </div>
          )}

          {!isLoading && generatedQuestions.length > 0 && (
            <div
              style={{
                padding: "0 0 16px 0",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    color: "var(--text-primary)",
                  }}
                >
                  Danh sách câu hỏi sinh ra ({generatedQuestions.length})
                </h3>
                <button
                  className="btn-secondary"
                  onClick={handleAssessQuality}
                  disabled={isAssessing}
                  style={{ display: "flex", gap: "6px", alignItems: "center" }}
                >
                  {isAssessing ? (
                    <span
                      className="btn-spinner"
                      style={{ width: 14, height: 14 }}
                    />
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                  Đánh giá chất lượng
                </button>
              </div>

              {assessmentResults && (
                <div
                  className="card"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  {assessmentResults.coverage && (
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        Độ bao phủ (Coverage)
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "var(--blue)",
                        }}
                      >
                        {(
                          assessmentResults.coverage.averageTotalCoverage * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Node Workflow:{" "}
                        {assessmentResults.coverage.workflowNodeCount} | Global:{" "}
                        {assessmentResults.coverage.globalNodeCount}
                      </div>
                    </div>
                  )}
                  {assessmentResults.accuracy && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: "200px",
                        borderLeft: "1px solid var(--border)",
                        paddingLeft: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        Độ chính xác (Accuracy)
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {
                          assessmentResults.accuracy.questionResults?.filter(
                            (r: any) => r.accuracyResult?.isAccurate,
                          ).length
                        }{" "}
                        / {assessmentResults.accuracy.questionResults?.length}{" "}
                        câu đúng
                      </div>
                    </div>
                  )}
                  {assessmentResults.difficulty && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: "200px",
                        borderLeft: "1px solid var(--border)",
                        paddingLeft: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        Độ khó (Difficulty)
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {(() => {
                          const results =
                            assessmentResults.difficulty.questionResults || [];
                          if (results.length === 0) return "Chưa có đánh giá";
                          const counts: Record<string, number> = {};
                          results.forEach((r: any) => {
                            const level =
                              r.difficultyResult?.level || "Không xác định";
                            counts[level] = (counts[level] || 0) + 1;
                          });
                          return Object.entries(counts)
                            .map(([level, count]) => `${count} ${level}`)
                            .join(" | ");
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="card">
              <div
                className="loading-state"
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span
                  className="btn-spinner"
                  style={{
                    width: 32,
                    height: 32,
                    borderColor: "var(--border)",
                    borderTopColor: "var(--blue)",
                  }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  AI đang phân tích luồng nghiệp vụ...
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Việc này có thể mất từ 10-30 giây tùy thuộc vào độ phức tạp.
                </span>
              </div>
            </div>
          )}

          {!isLoading &&
            generatedQuestions.map((q, i) => {
              const qText = q.question || q.Question || "";
              let activeNodeIds: string[] = [];
              let accuracyRes: any = null;

              if (assessmentResults?.accuracy?.questionResults) {
                const qRes = assessmentResults.accuracy.questionResults.find(
                  (r: any) => r.question === qText,
                );
                if (qRes?.accuracyResult) {
                  accuracyRes = qRes.accuracyResult;
                  activeNodeIds =
                    qRes.accuracyResult.extractedPath?.map(
                      (p: any) => p.nodeId,
                    ) || [];
                }
              }

              return (
                <QuestionCard
                  key={i}
                  q={q}
                  index={i}
                  defaultDifficulty={q.difficulty || q.Difficulty || ""}
                  assessmentData={{ accuracyRes, activeNodeIds }}
                  onShowGraph={() => handleShowGraph(qText, activeNodeIds)}
                />
              );
            })}
        </div>
      </div>

      {/* Highlight Graph Modal */}
      {highlightModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() =>
            setHighlightModal((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div
            className="modal-content"
            style={{
              width: "90%",
              height: "90%",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                Sơ đồ luồng: {selectedFlow?.businessName}
              </h2>
              <button
                className="btn-icon"
                onClick={() =>
                  setHighlightModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                flex: 1,
                padding: 0,
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  background: "var(--bg-elevated)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  Câu hỏi đang xem:
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {highlightModal.question}
                </div>
              </div>

              <div style={{ flex: 1, position: "relative" }}>
                {highlightModal.isLoading ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      className="btn-spinner"
                      style={{
                        width: 24,
                        height: 24,
                        borderColor: "var(--border)",
                        borderTopColor: "var(--blue)",
                      }}
                    />
                  </div>
                ) : highlightModal.parsedGraph ? (
                  <FeatureInteractiveGraph
                    parsedGraph={highlightModal.parsedGraph}
                    entryPoint={highlightModal.parsedGraph.nodes[0]?.id || ""}
                    highlightNodes={highlightModal.activeNodeIds}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    Không có dữ liệu đồ thị
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionCard = ({
  q,
  index,
  defaultDifficulty,
  assessmentData,
  onShowGraph,
}: {
  q: any;
  index: number;
  defaultDifficulty: string;
  assessmentData?: { accuracyRes: any; activeNodeIds: string[] };
  onShowGraph?: () => void;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const questionText = q.question || q.Question || "";
  const answerText = q.suggestedAnswer || q.SuggestedAnswer || "";
  const accuracyRes = assessmentData?.accuracyRes;

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "transform 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 700,
              background: "var(--blue-dim)",
              color: "var(--blue-light)",
              borderRadius: "4px",
            }}
          >
            Câu {index + 1}
          </span>
          <span
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 700,
              background: "var(--blue-dim)",
              color: "var(--blue-light)",
              borderRadius: "4px",
            }}
          >
            {defaultDifficulty}
          </span>
          {accuracyRes && (
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: accuracyRes.isAccurate
                  ? "var(--green-dim)"
                  : "var(--red-dim)",
                color: accuracyRes.isAccurate ? "var(--green)" : "var(--red)",
                border: `1px solid ${accuracyRes.isAccurate ? "var(--green)" : "var(--red)"}`,
              }}
            >
              {accuracyRes.isAccurate ? "Accurate" : "Inaccurate"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {assessmentData?.activeNodeIds &&
            assessmentData.activeNodeIds.length > 0 && (
              <button
                className="btn-secondary"
                onClick={onShowGraph}
                style={{ fontSize: "12px", padding: "4px 12px" }}
              >
                Xem luồng đi
              </button>
            )}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            {showAnswer ? "Ẩn đáp án gợi ý" : "Hiện đáp án gợi ý"}
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {questionText ||
          (typeof q === "string" ? q : "Không có nội dung câu hỏi")}
      </div>

      {showAnswer && answerText && (
        <div
          style={{
            background: "rgba(86, 93, 141, 0.02)",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            marginTop: "4px",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: "11px",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Đáp án gợi ý
          </div>
          {answerText}
        </div>
      )}
    </div>
  );
};

export default QuizGeneratorView;
