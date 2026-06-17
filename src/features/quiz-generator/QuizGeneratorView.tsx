import React, { useState, useEffect } from 'react';
import { useAppStore, BusinessFlow } from '../../store/useAppStore';

const QuizGeneratorView = () => {
  const { serverUrl, businessFlows, setBusinessFlows, showToast } = useAppStore();
  const [selectedFlow, setSelectedFlow] = useState<BusinessFlow | null>(null);
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [additionalContext, setAdditionalContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Few-Shot state
  const [fewShots, setFewShots] = useState<any[]>([]);
  const [isLoadingFewShots, setIsLoadingFewShots] = useState(false);
  const [selectedFewShots, setSelectedFewShots] = useState<string[]>([]);
  const [fewShotSearch, setFewShotSearch] = useState('');

  const filteredFewShots = fewShots.filter(shot => {
    const qText = shot.question || shot.Question || '';
    const tagText = shot.tag || shot.Tag || '';
    const term = fewShotSearch.toLowerCase();
    return qText.toLowerCase().includes(term) || tagText.toLowerCase().includes(term);
  });

  const loadFlows = async () => {
    setIsLoadingFlows(true);
    try {
      const res = await window.api?.getBusinessFlows({ baseUrl: serverUrl });
      if (res?.success && Array.isArray(res.data)) {
        setBusinessFlows(res.data as BusinessFlow[]);
      }
    } catch {
      showToast('Không thể tải danh sách business flows.', 'error');
    } finally {
      setIsLoadingFlows(false);
    }
  };

  const loadFewShots = async () => {
    setIsLoadingFewShots(true);
    try {
      const res = await window.api?.getFewShots({ baseUrl: serverUrl });
      if (res?.success && Array.isArray(res.data)) {
        setFewShots(res.data);
      }
    } catch {
      showToast('Không thể tải danh sách câu hỏi mẫu.', 'error');
    } finally {
      setIsLoadingFewShots(false);
    }
  };

  useEffect(() => {
    if (businessFlows.length === 0) loadFlows();
    loadFewShots();
  }, []);

  const handleGenerate = async () => {
    if (!selectedFlow) {
      showToast('Vui lòng chọn một Business Flow.', 'error');
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
        fewShotExampleIds: selectedFewShots.length > 0 ? selectedFewShots : null,
      });
      if (res?.success) {
        const questions = Array.isArray(res.data)
          ? res.data
          : (res.data as Record<string, any>)?.questions as any[];
        setGeneratedQuestions(questions || []);
        showToast(`Đã tạo ${(questions || []).length} câu hỏi!`, 'success');
      } else {
        showToast(res?.error || 'Không thể tạo câu hỏi.', 'error');
      }
    } catch {
      showToast('Lỗi kết nối đến server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const difficultyLabel: Record<string, string> = {
    Easy: 'Dễ',
    Medium: 'Trung bình',
    Hard: 'Khó'
  };

  return (
    <div className="page active" style={{ padding: '24px 28px' }}>
      <div className="analyze-layout">

        {/* Left: Form */}
        <div className="card analyze-form-card">
          <div className="card-header">
            <div className="card-icon blue">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="card-title">Tạo câu hỏi tự động</div>
          </div>
          <p className="card-desc">
            Dùng AI sinh câu hỏi từ Business Flow
          </p>

          {/* Business Flow selection */}
          <div className="form-group">
            <label className="form-label">Business Flow</label>
            {isLoadingFlows ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, padding: '10px 0' }}>
                <span className="btn-spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)', width: 14, height: 14 }} />
                Đang tải danh sách...
              </div>
            ) : (
              <select
                className="form-input"
                value={selectedFlow?.id || ''}
                onChange={e => {
                  const flow = businessFlows.find(f => f.id === e.target.value) || null;
                  setSelectedFlow(flow);
                }}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Chọn Business Flow --</option>
                {businessFlows.map(flow => (
                  <option key={flow.id} value={flow.id}>{flow.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label className="form-label">Độ khó mong muốn</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${difficulty === d ? 'var(--blue)' : 'var(--border)'}`,
                    background: difficulty === d ? 'var(--blue-dim)' : 'var(--bg-elevated)',
                    color: difficulty === d ? 'var(--blue-light)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
              onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
            />
          </div>

          {/* Few-Shot template selection */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span>Câu hỏi mẫu (Few-Shot)</span>
              {selectedFewShots.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 700, textTransform: 'none' }}>
                  Đã chọn {selectedFewShots.length}
                </span>
              )}
            </label>

            <div className="search-box" style={{ marginBottom: '10px' }}>
              <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Tìm câu hỏi hoặc tag..."
                value={fewShotSearch}
                onChange={e => setFewShotSearch(e.target.value)}
                style={{ background: 'var(--bg-elevated)' }}
              />
            </div>

            {isLoadingFewShots ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, padding: '10px 0' }}>
                <span className="btn-spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)', width: 14, height: 14 }} />
                Đang tải danh sách...
              </div>
            ) : fewShots.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', textAlign: 'center' }}>
                Chưa có câu hỏi mẫu nào được lưu
              </div>
            ) : filteredFewShots.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', textAlign: 'center' }}>
                Không tìm thấy câu hỏi mẫu phù hợp
              </div>
            ) : (
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '4px'
                }}
              >
                {filteredFewShots.map(shot => {
                  const id = shot.id || shot.Id;
                  const isChecked = selectedFewShots.includes(id);
                  const qText = shot.question || shot.Question || '';
                  const tagText = shot.tag || shot.Tag;
                  return (
                    <div
                      key={id}
                      className="card-flat"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedFewShots(selectedFewShots.filter(x => x !== id));
                        } else {
                          setSelectedFewShots([...selectedFewShots, id]);
                        }
                      }}
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        border: isChecked ? '1px solid var(--blue)' : '1px solid var(--border)',
                        background: isChecked ? 'var(--blue-dim)' : 'var(--bg-elevated)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        style={{ marginTop: '2px', accentColor: 'var(--blue)', pointerEvents: 'none' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: isChecked ? 600 : 500, 
                          color: isChecked ? 'var(--blue-light)' : 'var(--text-primary)',
                          lineHeight: 1.4, 
                          wordBreak: 'break-word',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {qText}
                        </span>
                        {tagText && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
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
            <label className="form-label">Ngữ cảnh bổ sung <span className="optional">(tùy chọn)</span></label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Thêm hướng dẫn, văn phong hoặc yêu cầu đặc biệt..."
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            className="btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={isLoading || !selectedFlow}
            style={{ marginTop: 'auto' }}
          >
            {isLoading ? <span className="btn-spinner" /> : null}
            {isLoading ? 'Đang tạo câu hỏi...' : 'Tạo câu hỏi'}
          </button>
        </div>

        {/* Right: Results */}
        <div className="analyze-result-panel" style={{ overflowY: 'auto', paddingRight: 4 }}>
          {!isLoading && generatedQuestions.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-art">
                  <svg viewBox="0 0 80 80" width="64" height="64" fill="none">
                    <rect x="16" y="16" width="48" height="48" rx="8" stroke="var(--blue)" strokeWidth="2" opacity="0.4" />
                    <path d="M32 30h16M32 40h16M32 50h10" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                    <circle cx="26" cy="30" r="2" fill="var(--cyan)" />
                    <circle cx="26" cy="40" r="2" fill="var(--cyan)" />
                    <circle cx="26" cy="50" r="2" fill="var(--cyan)" />
                  </svg>
                </div>
                <div className="empty-title">Chưa có câu hỏi nào được sinh ra</div>
                <div className="empty-desc">
                  Chọn Business Flow và thiết lập tham số ở cột trái, sau đó nhấn <strong>Tạo câu hỏi</strong> để bắt đầu sinh.
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="card">
              <div className="loading-state" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <span className="btn-spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>AI đang phân tích luồng nghiệp vụ...</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Việc này có thể mất từ 10-30 giây tùy thuộc vào độ phức tạp.</span>
              </div>
            </div>
          )}

          {!isLoading && generatedQuestions.map((q, i) => (
            <QuestionCard key={i} q={q} index={i} defaultDifficulty={difficulty} />
          ))}
        </div>
      </div>
    </div>
  );
};

const QuestionCard = ({ q, index, defaultDifficulty }: { q: any; index: number; defaultDifficulty: string }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const questionText = q.question || q.Question || '';
  const answerText = q.suggestedAnswer || q.SuggestedAnswer || '';
  const diffText = q.difficulty || q.Difficulty || defaultDifficulty;

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
      case 'dễ':
        return 'green';
      case 'hard':
      case 'khó':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
      case 'dễ':
        return 'Dễ';
      case 'hard':
      case 'khó':
        return 'Khó';
      default:
        return 'Trung bình';
    }
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'transform 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700, background: 'var(--blue-dim)', color: 'var(--blue-light)', borderRadius: '4px' }}>Câu {index + 1}</span>
          <span style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, background: `var(--${getDifficultyColor(diffText)}-dim)`, color: `var(--${getDifficultyColor(diffText)})`, borderRadius: '4px' }}>
            {getDifficultyLabel(diffText)}
          </span>
        </div>
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          {showAnswer ? 'Ẩn đáp án gợi ý' : 'Hiện đáp án gợi ý'}
        </button>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {questionText || (typeof q === 'string' ? q : 'Không có nội dung câu hỏi')}
      </div>

      {showAnswer && answerText && (
        <div style={{
          background: 'rgba(86, 93, 141, 0.02)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          marginTop: '4px'
        }}>
          <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Đáp án gợi ý</div>
          {answerText}
        </div>
      )}
    </div>
  );
};

export default QuizGeneratorView;
