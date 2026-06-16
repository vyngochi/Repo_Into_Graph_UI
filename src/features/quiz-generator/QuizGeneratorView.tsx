import React, { useState, useEffect } from 'react';
import { useAppStore, BusinessFlow } from '../../store/useAppStore';

const QuizGeneratorView = () => {
  const { serverUrl, businessFlows, setBusinessFlows, showToast } = useAppStore();
  const [selectedFlow, setSelectedFlow] = useState<BusinessFlow | null>(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [additionalContext, setAdditionalContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<unknown[]>([]);

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

  useEffect(() => {
    if (businessFlows.length === 0) loadFlows();
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
      });
      if (res?.success) {
        const questions = Array.isArray(res.data) ? res.data : (res.data as Record<string, unknown>)?.questions as unknown[];
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

  const difficultyLabel = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

  return (
    <div className="page active" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, height: '100%' }}>

        {/* Left: Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <div className="card-icon purple">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="card-title">Tạo câu hỏi tự động</div>
          </div>
          <p className="card-desc">Dùng AI để tạo câu hỏi kiểm tra từ Business Flow.</p>

          {/* Business Flow selection */}
          <div className="form-group">
            <label className="form-label">Business Flow</label>
            {isLoadingFlows ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <span className="btn-spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--purple)' }} />
                Đang tải...
              </div>
            ) : (
              <select
                className="form-input"
                value={selectedFlow?.id || ''}
                onChange={e => {
                  const flow = businessFlows.find(f => f.id === e.target.value) || null;
                  setSelectedFlow(flow);
                }}
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
            <label className="form-label">Độ khó</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${difficulty === d ? 'var(--purple)' : 'var(--border-light)'}`,
                    background: difficulty === d ? 'var(--purple-dim)' : 'var(--bg-elevated)',
                    color: difficulty === d ? 'var(--purple-light)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'var(--font-main)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  {difficultyLabel[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Number of questions */}
          <div className="form-group">
            <label className="form-label">Số câu hỏi</label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={20}
              value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
            />
          </div>

          {/* Additional context */}
          <div className="form-group">
            <label className="form-label">
              Ngữ cảnh bổ sung <span className="optional">(tùy chọn)</span>
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Thêm hướng dẫn hoặc ngữ cảnh cho AI..."
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button className="btn-primary btn-lg" onClick={handleGenerate} disabled={isLoading || !selectedFlow}>
            {isLoading ? <span className="btn-spinner" /> : (
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            )}
            {isLoading ? 'Đang tạo câu hỏi...' : 'Tạo câu hỏi'}
          </button>
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {!isLoading && generatedQuestions.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-art">
                  <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
                    <rect x="8" y="8" width="48" height="48" rx="8" stroke="var(--border-light)" strokeWidth="2" />
                    <path d="M24 22h16M24 30h16M24 38h10" stroke="var(--border-light)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="18" cy="22" r="2" fill="var(--purple)" opacity="0.4" />
                    <circle cx="18" cy="30" r="2" fill="var(--purple)" opacity="0.4" />
                    <circle cx="18" cy="38" r="2" fill="var(--purple)" opacity="0.4" />
                  </svg>
                </div>
                <div className="empty-title">Chưa có câu hỏi nào</div>
                <div className="empty-desc">Chọn Business Flow và nhấn <strong>Tạo câu hỏi</strong> để bắt đầu.</div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="card">
              <div className="loading-state">
                <div className="spinner-large" />
                <span>AI đang tạo câu hỏi...</span>
              </div>
            </div>
          )}

          {generatedQuestions.map((q, i) => (
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
        return 'purple';
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
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'transform 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-purple" style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}>Câu {index + 1}</span>
          <span className={`badge ${getDifficultyColor(diffText)}`} style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600 }}>
            {getDifficultyLabel(diffText)}
          </span>
        </div>
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 600,
            background: showAnswer ? 'var(--purple-dim)' : 'none',
            border: '1px solid var(--purple)',
            color: 'var(--purple-light)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {showAnswer ? 'Ẩn đáp án gợi ý' : 'Hiện đáp án gợi ý'}
        </button>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {questionText || (typeof q === 'string' ? q : 'Không có nội dung câu hỏi')}
      </div>

      {showAnswer && answerText && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.02)',
          borderLeft: '3px solid var(--purple)',
          padding: '12px 16px',
          borderRadius: '0 8px 8px 0',
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
