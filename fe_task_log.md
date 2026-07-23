# Frontend Tasks Log

Tài liệu này ghi chú lại các công việc đã thực hiện ở phía Frontend (UI) theo ngày để thuận tiện cho việc theo dõi tiến độ của dự án.

## 23/07/2026

- **Khai báo và định nghĩa API**:
  - Bổ sung các IPC methods trong `main.js` (`getAnalysisRunById`, `createAnalysisRun`, `updateAnalysisRun`, `getFeaturesByAnalysisRunId`, `getFewShotById`, `updateFewShot`, `deleteFewShot`, `generateQuestionsFull`).
  - Đóng gói các method này vào context bridge ở `preload.js`.
  - Cập nhật file `src/types/electron.d.ts` thêm type safety cho các hàm API mới.

- **Cập nhật UI**:
  - **Quản lý Few-Shot (`Dashboard.tsx`)**: Bổ sung tính năng Sửa và Xóa câu hỏi mẫu. Tái sử dụng form tạo mới thành form dùng chung cho cả Tạo mới & Cập nhật.
  - **Quản lý Analysis Run (`Dashboard.tsx`)**: Bổ sung chức năng "Sửa" (Metadata Edit Modal) cho các bản ghi Analysis Run trong danh sách lịch sử phân tích, sử dụng API `updateAnalysisRun`.
  - **Quản lý Features (`FeaturesView.tsx`)**: Bổ sung Dropdown lọc feature theo từng Analysis Run, sử dụng API `getFeaturesByAnalysisRunId`.
  - **Sinh câu hỏi (`QuestionGeneratorView.tsx`)**: 
    - Đã gỡ bỏ tính năng "Sinh câu hỏi đầy đủ (Full Context)" do API ở backend không còn được hỗ trợ.
    - Thêm tính năng **Đánh giá chất lượng (Assess Quality)**: Gọi 3 APIs để đánh giá Độ bao phủ, Tính chính xác và Độ khó của bộ câu hỏi.
    - Thêm tính năng **Xem luồng đi (Highlight Graph)** cho từng câu hỏi thông qua Modal, hiển thị và tô sáng các bước trên đồ thị nghiệp vụ sử dụng component `FeatureInteractiveGraph`.
