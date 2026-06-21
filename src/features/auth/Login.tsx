import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

const Login = () => {
  const navigate = useNavigate();
  const { serverUrl, setServerUrl, showToast } = useAppStore();
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [isTesting, setIsTesting] = useState(false);

  const handleLogin = () => {
    setServerUrl(inputUrl.trim() || serverUrl);
    navigate("/dashboard");
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch(`${inputUrl}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        showToast("Kết nối thành công!", "success");
      } else {
        // showToast(`Lỗi server: ${res.status}`, "error");
        showToast(`Chưa có API check health`, "error");
      }
    } catch {
      showToast("Không thể kết nối đến server.", "error");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          width: 400,
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-lg)",
          padding: "32px 28px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-sm)",
              background: "var(--blue-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <circle cx="6" cy="6" r="4" fill="var(--blue)" />
              <circle cx="22" cy="6" r="4" fill="var(--violet)" />
              <circle cx="14" cy="22" r="4" fill="var(--cyan)" />
              <line
                x1="6"
                y1="6"
                x2="22"
                y2="6"
                stroke="var(--blue)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1="6"
                y1="6"
                x2="14"
                y2="22"
                stroke="var(--violet)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1="22"
                y1="6"
                x2="14"
                y2="22"
                stroke="var(--cyan)"
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              RepoGraph
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Automated Grading Tool
            </div>
          </div>
        </div>

        {/* Server URL */}
        <div className="form-group">
          <label className="form-label">Địa chỉ Backend Server</label>
          <input
            type="text"
            className="form-input mono"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="http://localhost:55061"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <p className="field-hint">Địa chỉ API backend (ASP.NET Core)</p>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 4,
          }}
        >
          <button className="btn-primary btn-lg" onClick={handleLogin}>
            Đăng nhập với tư cách Giảng viên
          </button>
          <button
            className="btn-secondary"
            style={{ justifyContent: "center" }}
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <span
                className="btn-spinner"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--blue)",
                }}
              />
            ) : null}
            {isTesting ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
