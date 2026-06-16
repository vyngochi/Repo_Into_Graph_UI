# Repo Into Graph — Desktop App (ElectronJS)

Ứng dụng desktop để tương tác với API của **Repo Into Graph** — công cụ phân tích static code và trích xuất đồ thị lời gọi (Call Graph).

---

## Yêu cầu

- **Node.js** v18+ 
- **Backend server** đang chạy (ASP.NET Core API)

---

## Cài đặt & Chạy

```bash
# Cài dependencies (chỉ cần lần đầu)
npm install

# Chạy app
npm start
```

---

## Cấu trúc

```
Electron App/
├── main.js          # Main process (Electron, IPC handlers, HTTP requests)
├── preload.js       # Secure bridge giữa main và renderer
├── package.json
└── renderer/
    ├── index.html   # Giao diện chính
    ├── style.css    # Thiết kế modern dark
    └── app.js       # Logic UI + gọi API
```

---

## Tính năng

### 1. Phân tích Repository (`POST /api/analysis/analyze`)
- Nhập đường dẫn local (`C:\MyProject`) hoặc Git URL
- Chọn thư mục output qua dialog
- Xem kết quả: số Edges, số Methods, AnalysisRunId

### 2. Danh sách Features (`GET /api/features`)
- Xem toàn bộ features đã được ánh xạ
- Tìm kiếm feature theo tên
- Xem chi tiết từng feature theo ID (`GET /api/features/{id}`)

### 3. Code Flow (`GET /api/features/{id}/codeflow`)
- Nhập Feature ID để xem luồng thực thi
- Hiển thị danh sách methods với source code
- Nhấn vào từng method để mở rộng xem code

---

## Cài đặt Server URL

Nhấn nút **bánh răng** ở góc dưới sidebar để cấu hình URL của API server.

Mặc định: `http://localhost:5000`

---

## Backend API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/analysis/analyze` | Phân tích repository |
| `GET`  | `/api/features` | Lấy danh sách features |
| `GET`  | `/api/features/{id}` | Lấy feature theo ID |
| `GET`  | `/api/features/{id}/codeflow` | Lấy code flow của feature |
