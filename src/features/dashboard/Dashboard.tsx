import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serverUrl, showToast } = useAppStore();
  const [repoPath, setRepoPath] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  // Few-Shot state
  const [fewShots, setFewShots] = useState<any[]>([]);
  const [isLoadingFewShots, setIsLoadingFewShots] = useState(false);
  const [showFewShotForm, setShowFewShotForm] = useState(false);
  const [isCreatingFewShot, setIsCreatingFewShot] = useState(false);
  const [newFewShot, setNewFewShot] = useState({
    question: '',
    suggestedAnswer: '',
    difficulty: 'Medium',
    tag: '',
    description: ''
  });

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'repos';

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
        console.warn('Cannot fetch analysis runs:', result?.error);
      }
    } catch (err) {
      console.error('Error fetching analysis runs:', err);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  const fetchFewShots = async () => {
    setIsLoadingFewShots(true);
    try {
      const result = await window.api?.getFewShots({ baseUrl: serverUrl });
      if (result?.success) {
        setFewShots(Array.isArray(result.data) ? result.data : []);
      } else {
        console.warn('Cannot fetch few shots:', result?.error);
      }
    } catch (err) {
      console.error('Error fetching few shots:', err);
    } finally {
      setIsLoadingFewShots(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'repos') {
      fetchRuns();
    } else if (currentTab === 'questions') {
      fetchFewShots();
    }
  }, [serverUrl, currentTab]);

  const handleCreateFewShot = async () => {
    if (!newFewShot.question.trim() || !newFewShot.suggestedAnswer.trim()) {
      showToast('Câu hỏi và Câu trả lời không được để trống', 'error');
      return;
    }

    setIsCreatingFewShot(true);
    try {
      const result = await window.api?.createFewShot({
        baseUrl: serverUrl,
        payload: {
          question: newFewShot.question.trim(),
          suggestedAnswer: newFewShot.suggestedAnswer.trim(),
          difficulty: newFewShot.difficulty.trim(),
          tag: newFewShot.tag.trim() || null,
          description: newFewShot.description.trim() || null
        }
      });

      if (result?.success) {
        showToast('Tạo câu hỏi mẫu thành công!', 'success');
        setShowFewShotForm(false);
        setNewFewShot({ question: '', suggestedAnswer: '', difficulty: 'Medium', tag: '', description: '' });
        fetchFewShots();
      } else {
        showToast(result?.error || 'Lỗi khi tạo câu hỏi mẫu', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối đến server.', 'error');
    } finally {
      setIsCreatingFewShot(false);
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
      showToast('Vui lòng nhập đường dẫn repository.', 'error');
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await window.api?.analyze({
        baseUrl: serverUrl,
        repositoryPath: repoPath.trim(),
        outputDir: outputDir.trim() || null
      });
      if (result?.success) {
        showToast('Phân tích thành công! Đang chuyển đến Workspace...', 'success');
        const repoId = encodeURIComponent(repoPath.trim());
        navigate(`/workspace/${repoId}?tab=analyze`);
      } else {
        showToast(result?.error || 'Phân tích thất bại.', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối đến server.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openWorkspace = (path: string) => {
    const repoId = encodeURIComponent(path);
    navigate(`/workspace/${repoId}?tab=analyze`);
  };

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="page-title">
            {currentTab === 'repos' ? 'Quản lý Repository' : 'Ngân hàng câu hỏi mẫu (Few-Shot)'}
          </h1>
          <p className="page-subtitle">
            {currentTab === 'repos'
              ? 'Phân tích static code và theo dõi lịch sử chạy'
              : 'Quản lý danh sách câu hỏi và câu trả lời mẫu cho AI'}
          </p>
        </div>
        <div className="top-bar-right">
          <div className="server-url-badge">
            <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10">
              <circle cx="8" cy="8" r="3" fill="var(--green)"/>
            </svg>
            {serverUrl}
          </div>
        </div>
      </header>

      <div className="page-container">
        {currentTab === 'repos' ? (
          <div className="page active" style={{ overflowY: 'auto' }}>
            <div className="analyze-layout">
              {/* Left: Analyze Form */}
              <div className="analyze-form-card card">
                <div className="card-header">
                  <div className="card-icon cyan">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="card-title">Phân tích mới</h2>
                </div>
                <p className="card-desc">Nhập thư mục code local của bạn để quét đồ thị lời gọi hàm.</p>

                <div className="form-group">
                  <label className="form-label">Thư mục nguồn (Repository Path)</label>
                  <div className="input-with-btn">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="C:\path\to\your\project"
                      value={repoPath}
                      onChange={e => setRepoPath(e.target.value)}
                    />
                    <button className="btn-icon" onClick={handleSelectFolder} title="Browse">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Thư mục đầu ra (Output Path) - Tùy chọn</label>
                  <div className="input-with-btn">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="./output (Mặc định)"
                      value={outputDir}
                      onChange={e => setOutputDir(e.target.value)}
                    />
                    <button className="btn-icon" onClick={handleSelectOutputDir} title="Browse">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button className="btn-primary btn-lg" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing && <span className="btn-spinner" style={{ marginRight: 8 }} />}
                  {isAnalyzing ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
                </button>
              </div>

              {/* Right: History List */}
              <div className="analyze-result-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ flex: 1, minHeight: 400 }}>
                  <div className="card-header">
                    <h2 className="card-title" style={{ fontSize: 15 }}>Lịch sử các lượt phân tích</h2>
                  </div>

                  {isLoadingRuns ? (
                    <div className="loading-state">
                      <div className="spinner-large" />
                      <span>Đang tải danh sách lịch sử...</span>
                    </div>
                  ) : runs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-art">
                        <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
                          <rect x="8" y="8" width="48" height="48" rx="8" stroke="var(--border-light)" strokeWidth="2" />
                          <circle cx="24" cy="24" r="4" fill="var(--blue-light)" opacity="0.3" />
                          <circle cx="40" cy="40" r="4" fill="var(--cyan)" opacity="0.3" />
                          <path d="M24 24l16 16" stroke="var(--border-light)" strokeWidth="1.5" strokeDasharray="3 3" />
                        </svg>
                      </div>
                      <div className="empty-title">Chưa có dữ liệu lịch sử</div>
                      <div className="empty-desc">Các lượt phân tích thành công trước đó sẽ được lưu lại tại đây.</div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', marginTop: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>Thư mục</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', width: 180 }}>Thời gian chạy</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', width: 120 }}>Trạng thái</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-muted)', width: 140, textAlign: 'right' }}>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runs.map((run, index) => {
                            const pathStr = run.repositoryPath || run.RepositoryPath || '';
                            const timeStr = run.createdAt || run.CreatedAt ? new Date(run.createdAt || run.CreatedAt).toLocaleString('vi-VN') : '—';
                            const statusStr = run.status || run.Status || 'Success';
                            
                            return (
                              <tr key={run.id || index} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all' }} title={pathStr}>
                                  {pathStr}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{timeStr}</td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`badge ${statusStr.toLowerCase() === 'failed' ? 'red' : 'green'}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                                    {statusStr}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                  <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openWorkspace(pathStr)}>
                                    Mở Workspace
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="page active" style={{ overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header card with add button */}
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 className="card-title" style={{ fontSize: 15 }}>Quản lý ngân hàng câu hỏi mẫu</h2>
                  <p className="card-desc" style={{ marginBottom: 0, marginTop: 4 }}>
                    Định nghĩa các câu hỏi và câu trả lời chất lượng cao để hướng dẫn AI sinh câu hỏi chính xác hơn.
                  </p>
                </div>
                <button className="btn-primary" onClick={() => setShowFewShotForm(!showFewShotForm)}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {showFewShotForm ? 'Đóng biểu mẫu' : 'Thêm câu hỏi mẫu'}
                </button>
              </div>

              {/* Form to add few shot */}
              {showFewShotForm && (
                <div className="card" style={{ borderLeft: '4px solid var(--blue)' }}>
                  <h3 className="card-title" style={{ marginBottom: 16, fontSize: 14 }}>Tạo câu hỏi mẫu mới</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Nội dung câu hỏi mẫu</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Nhập câu hỏi mẫu giảng viên biên soạn..."
                        value={newFewShot.question}
                        onChange={e => setNewFewShot({ ...newFewShot, question: e.target.value })}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Đáp án gợi ý tương ứng</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Nhập đáp án gợi ý chi tiết làm tiêu chuẩn..."
                        value={newFewShot.suggestedAnswer}
                        onChange={e => setNewFewShot({ ...newFewShot, suggestedAnswer: e.target.value })}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mức độ khó</label>
                      <select
                        className="form-input"
                        value={newFewShot.difficulty}
                        onChange={e => setNewFewShot({ ...newFewShot, difficulty: e.target.value })}
                      >
                        <option value="Easy">Dễ (Easy)</option>
                        <option value="Medium">Trung bình (Medium)</option>
                        <option value="Hard">Khó (Hard)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nhãn (Tag) - Tùy chọn</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ví dụ: validation, business-rule..."
                        value={newFewShot.tag}
                        onChange={e => setNewFewShot({ ...newFewShot, tag: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Ghi chú thêm - Tùy chọn</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Mục đích câu hỏi hoặc lưu ý đặc biệt..."
                        value={newFewShot.description}
                        onChange={e => setNewFewShot({ ...newFewShot, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <button className="btn-secondary" onClick={() => setShowFewShotForm(false)}>Hủy</button>
                    <button className="btn-primary" onClick={handleCreateFewShot} disabled={isCreatingFewShot}>
                      {isCreatingFewShot && <span className="btn-spinner" style={{ marginRight: 6 }} />}
                      Lưu lại
                    </button>
                  </div>
                </div>
              )}

              {/* Few Shot List */}
              <div className="card">
                <h2 className="card-title" style={{ marginBottom: 12 }}>Danh sách câu hỏi hiện tại</h2>
                
                {isLoadingFewShots ? (
                  <div className="loading-state">
                    <div className="spinner-large" />
                    <span>Đang tải danh sách câu hỏi mẫu...</span>
                  </div>
                ) : fewShots.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-art">
                      <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
                        <rect x="8" y="8" width="48" height="48" rx="8" stroke="var(--border-light)" strokeWidth="2" />
                        <path d="M20 24h24M20 32h24M20 40h12" stroke="var(--border-light)" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="empty-title">Chưa có câu hỏi mẫu nào</div>
                    <div className="empty-desc">Nhấn nút "Thêm câu hỏi mẫu" ở góc trên bên phải để tạo câu hỏi mẫu đầu tiên.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    {fewShots.map((shot, index) => {
                      const id = shot.id || shot.Id;
                      const qText = shot.question || shot.Question || '';
                      const aText = shot.suggestedAnswer || shot.SuggestedAnswer || '';
                      const diff = shot.difficulty || shot.Difficulty || 'Medium';
                      const tag = shot.tag || shot.Tag;
                      const desc = shot.description || shot.Description;

                      return (
                        <div key={id || index} className="card-flat" style={{ borderLeft: '3px solid var(--purple)', background: 'var(--bg-hover)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span className="badge badge-gray">#{index + 1}</span>
                              <span className={`badge ${diff.toLowerCase() === 'easy' ? 'green' : diff.toLowerCase() === 'hard' ? 'red' : 'purple'}`}>
                                {diff}
                              </span>
                              {tag && <span className="badge badge-blue">{tag}</span>}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {shot.createdAt || shot.CreatedAt ? new Date(shot.createdAt || shot.CreatedAt).toLocaleDateString('vi-VN') : ''}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginTop: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {qText}
                          </div>

                          <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(0,0,0,0.02)', borderLeft: '2px solid rgba(0,0,0,0.1)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            <div style={{ fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Đáp án gợi ý</div>
                            {aText}
                          </div>

                          {desc && (
                            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                              <span style={{ fontWeight: 500 }}>Ghi chú:</span> {desc}
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
    </>
  );
};

export default Dashboard;