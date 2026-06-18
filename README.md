# TechWorld – CMS & Tech Blog Platform

Hệ thống Blog công nghệ hiện đại và Trình quản trị nội dung (CMS) động tích hợp đầy đủ tính năng, kết nối trực tiếp với backend đám mây **Supabase**. Dự án được thiết kế với giao diện Glassmorphism sang trọng, tối ưu hóa trải nghiệm người dùng (UX) và khả năng quản trị thời gian thực (Realtime).

---

## 🚀 Các Tính Năng Hiện Có (Current Features)

### 1. Giao Diện Người Dùng (Client Site)
- **Giao diện Glassmorphism độc đáo**: Thiết kế sang trọng dựa trên nền tối (Dark mode) với các đường viền mờ, hiệu ứng lấp lánh (micro-animations) và màu sắc hài hòa.
- **Trang chủ & Các trang chuyên mục động**: Tự động tải bài viết từ cơ sở dữ liệu Supabase, lọc theo danh mục (`AI`, `Programming`, `Cybersecurity`, `Tech Reviews`, `Insights`).
- **Chi tiết bài viết (`single-post.html`)**: Hiển thị đầy đủ nội dung bài viết định dạng phong phú (Rich Text), tích hợp hệ thống bình luận.
- **Hệ thống Bình luận (Comments)**: Khách truy cập có thể gửi bình luận trực tiếp bên dưới mỗi bài viết, hiển thị lập tức không cần tải lại trang.
- **Cơ chế dự phòng dữ liệu (Fallback)**: Đảm bảo giao diện luôn hiển thị các bài viết và nội dung mẫu thiết kế sẵn nếu cơ sở dữ liệu chưa được thiết lập hoặc trống.

### 2. Trang Quản Trị CMS Toàn Diện (`admin.html`)
- **Dashboard Thống kê**: Theo dõi trực quan tổng số bài viết, bài viết đã xuất bản (Live), nháp (Draft), tổng bình luận và số thư liên hệ chưa đọc.
- **Quản lý Bài viết chuyên nghiệp**:
  - Viết bài mới với trình soạn thảo trực quan **Quill.js** (WYSIWYG).
  - Tự động sinh `slug` thân thiện SEO dựa trên tiêu đề bài viết.
  - Tải ảnh bìa bài viết lên **Supabase Storage**.
  - Tính năng **Chú thích hình ảnh (Caption & Credit Modal)** nâng cao: Dễ dàng chèn ảnh vào nội dung kèm theo chú thích và nguồn ảnh được định dạng chuyên nghiệp.
  - **Xem trước bài viết (Live Editorial Preview)**: Cho phép admin xem trước giao diện bài viết trước khi bấm lưu/xuất bản.
- **Quản lý nội dung tĩnh động**: Sửa đổi mọi văn bản và hình ảnh trên trang web bao gồm:
  - Hotline, Email, Địa chỉ liên hệ.
  - Nội dung banner trang chủ, lời giới thiệu, danh sách dịch vụ (Services), quy trình làm việc (Process) và các câu hỏi thường gặp (FAQ).
  - Danh sách thành viên trong nhóm (Team Members) kèm chức vụ và ảnh đại diện.
- **Hộp thư liên hệ (Inbox)**: Nhận tin nhắn liên hệ trực tiếp từ khách hàng (họ tên, email, dịch vụ yêu cầu, nội dung tin nhắn), hỗ trợ đánh dấu đã đọc/chưa đọc và xóa thư.
- **Hộp thư kiểm duyệt bình luận**: Theo dõi và xóa các bình luận không mong muốn hoặc spam.
- **Thông báo Realtime**: Nhận thông báo Toast & Alert kính mờ ngay lập tức khi có người dùng gửi liên hệ hoặc bình luận mới trên website nhờ tính năng Supabase Realtime.

---

## 🛠️ Hướng Dẫn Cài Đặt & Cấu Hình (Setup & Installation)

Để chạy dự án này trên máy tính của bạn hoặc triển khai lên hosting, hãy thực hiện theo các bước hướng dẫn chi tiết dưới đây:

### Bước 1: Khởi tạo Cơ sở dữ liệu Supabase
1. Đăng ký/Đăng nhập vào tài khoản [Supabase](https://supabase.com/).
2. Tạo một dự án (Project) mới.
3. Chờ quá trình khởi tạo dự án hoàn tất, đi tới mục **SQL Editor** ở thanh menu bên trái.
4. Tạo một **New Query**, mở file [supabase_setup.sql](file:///Users/doxuanquang/Documents/BioWraps/Blog/tech-blog/vaultedge-1.0.0/supabase_setup.sql) trong thư mục dự án này, copy toàn bộ nội dung trong đó và dán vào SQL Editor của Supabase.
5. Nhấn **Run** để khởi chạy script. Lệnh này sẽ:
   - Tạo các bảng: `posts`, `comments`, `site_content`, và `contact_messages`.
   - Vô hiệu hóa bảo mật Row Level Security (RLS) để cho phép frontend tương tác trực tiếp.
   - Tạo tự động Storage bucket tên là `blog-images` và thiết lập các chính sách bảo mật (Storage Policies).
   - Thêm dữ liệu tĩnh mặc định vào bảng `site_content`.
   - Kích hoạt cơ chế **Supabase Realtime** cho bảng `contact_messages` và `comments`.

### Bước 2: Tạo Bucket Lưu Trữ Ảnh (Storage)
*Lưu ý: Đoạn mã SQL ở Bước 1 đã tự động khởi tạo bucket `blog-images` cho bạn. Bạn không cần làm thủ công bước này nữa.*

Trong trường hợp bạn muốn kiểm tra hoặc cần cấu hình thủ công:
1. Đi tới mục **Storage** trên giao diện điều khiển Supabase Dashboard.
2. Nhấp vào **New bucket** để tạo một phân vùng lưu trữ mới với tên bắt buộc là: `blog-images`.
3. Bật tùy chọn **Public bucket** (Cho phép truy cập công khai mà không cần ký token) và lưu lại.


### Bước 3: Liên Kết Code Dự Án Với Supabase Của Bạn
Tìm và chỉnh sửa các file mã nguồn sau để thay cấu hình API Key:
1. Mở file [js/supabase.js](file:///Users/doxuanquang/Documents/BioWraps/Blog/tech-blog/vaultedge-1.0.0/js/supabase.js) và thay thế `supabaseUrl`, `supabaseKey` thành thông tin dự án của bạn:
   ```javascript
   const supabaseUrl = "URL_SUPABASE_CUA_BAN";
   const supabaseKey = "ANON_KEY_SUPABASE_CUA_BAN";
   ```
2. Mở file [js/content-sync.js](file:///Users/doxuanquang/Documents/BioWraps/Blog/tech-blog/vaultedge-1.0.0/js/content-sync.js) và thay thế ở các dòng đầu:
   ```javascript
   const SURL = "URL_SUPABASE_CUA_BAN";
   const SKEY = "ANON_KEY_SUPABASE_CUA_BAN";
   ```
3. Mở file [js/admin.js](file:///Users/doxuanquang/Documents/BioWraps/Blog/tech-blog/vaultedge-1.0.0/js/admin.js) và thay thế ở các dòng đầu:
   ```javascript
   const MY_URL = "URL_SUPABASE_CUA_BAN";
   const MY_KEY = "ANON_KEY_SUPABASE_CUA_BAN";
   ```
*(Bạn có thể lấy `URL` và `Anon Key` bằng cách truy cập vào **Project Settings** -> **API** trên dashboard Supabase của bạn).*

### Bước 4: Khởi Chạy Project Cục Bộ
Dự án sử dụng cấu trúc HTML/JS truyền thống nên bạn có thể khởi chạy cực kỳ dễ dàng:
- **Cách đơn giản nhất**: Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt web nào.
- **Cách khuyên dùng (Độ ổn định cao nhất)**: Sử dụng các công cụ Server cục bộ để tránh lỗi CORS hoặc bảo mật file:
  - Sử dụng extension **Live Server** trong VS Code.
  - Hoặc sử dụng Node.js:
    ```bash
    # Cài đặt các thư viện cần thiết
    npm install
    # Chạy Live Server cục bộ
    npx live-server
    ```
  - Hoặc sử dụng Python:
    ```bash
    python3 -m http.server 8080
    ```
    Truy cập địa chỉ `http://localhost:8080` trên trình duyệt để trải nghiệm dự án.

---

## 📁 Cấu Trúc Thư Mục Chính (Project Structure)

```text
├── css/                     # Các file phong cách CSS bổ sung & thư viện
├── js/
│   ├── supabase.js          # Khởi tạo kết nối Supabase Client chính
│   ├── content-sync.js      # Đồng bộ bài viết, phân trang & nội dung tĩnh
│   ├── admin.js             # Logic xử lý nghiệp vụ của trang CMS Admin
│   ├── notifications.js     # Giao diện thông báo Toast/Modal Glassmorphism
│   ├── active.js            # Các hiệu ứng tương tác UI/UX của template
│   └── load-post.js         # Đọc chi tiết bài viết & gửi bình luận
├── supabase_setup.sql       # Script SQL khởi tạo Database trên Supabase
├── index.html               # Trang chủ website TechWorld
├── admin.html               # Giao diện quản trị CMS Admin Dashboard
├── single-post.html         # Trang chi tiết bài viết
├── about.html               # Trang giới thiệu thông tin
├── services.html            # Trang dịch vụ
├── contact.html             # Trang liên hệ gửi tin nhắn
├── style.css                # Tệp CSS chính thiết lập giao diện website
├── package.json             # Cấu hình dependency Node.js
└── README.md                # Hướng dẫn sử dụng dự án này
```