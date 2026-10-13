# Hướng Dẫn Cài Đặt & Chuyển Đổi Phiên Bản Node.js (Tour Booking Project)

Tài liệu này hướng dẫn cách cài đặt, chuyển đổi phiên bản Node.js phù hợp để tránh lỗi thư viện (như `bcrypt`, `prisma`, `@nestjs`, `next`) khi chạy dự án.

---

## 1. Phiên bản Node.js khuyến nghị

* **Khuyến nghị tốt nhất:** `Node.js 22 LTS` (cụ thể: `v22.20.0` hoặc mới hơn trong nhánh 22.x).
* **Tối thiểu:** `Node.js 20 LTS`.
* **Tránh dùng:** `Node.js 24+` (Hiện tại dễ gây lỗi biên dịch mã nguồn C++ của `bcrypt` và không tương thích hoàn toàn với Prisma/Next.js 15).

---

## 2. Link tải trực tiếp

* **Trang chủ Node.js:** [https://nodejs.org/en/download](https://nodejs.org/en/download)
* **Bản cài trực tiếp cho Windows (.msi 64-bit):** [node-v22.20.0-x64.msi](https://nodejs.org/dist/v22.20.0/node-v22.20.0-x64.msi)

---

## 3. Quản lý và chuyển đổi giữa các phiên bản Node (Khuyên dùng)

### Cách 1: Sử dụng `nvm-windows` (Khuyên dùng trên Windows)

#### Bước 1: Cài đặt NVM
* Tải file `nvm-setup.exe` tại trang GitHub chính thức: [Releases · coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
* Chạy file `.exe` cài đặt theo hướng dẫn mặc định.

#### Bước 2: Các lệnh chuyển đổi (Mở PowerShell / CMD bằng quyền Administrator)

```powershell
# 1. Cài đặt phiên bản Node 22 LTS
nvm install 22.20.0

# 2. Xem danh sách phiên bản Node đang có trên máy
nvm list

# 3. Kích hoạt chuyển sang phiên bản 22.20.0
nvm use 22.20.0

# 4. Kiểm tra lại phiên bản hiện tại
node -v
npm -v
```

> **Ghi chú:** Khi cần chuyển qua lại với Node 24 cho các dự án khác, chỉ cần chạy:
> ```powershell
> nvm use 24
> ```

---

### Cách 2: Sử dụng `fnm` (Fast Node Manager - Rất nhanh)

Nếu máy đã có `winget` (mặc định trên Windows 10/11):

```powershell
# 1. Cài đặt fnm
winget install Schniz.fnm

# 2. Tắt và mở lại Terminal/PowerShell mới, sau đó cài & dùng Node 22
fnm install 22
fnm use 22

# 3. Đặt Node 22 làm mặc định khi mở máy
fnm default 22
```

---

## 4. Xử lý lỗi thư viện sau khi chuyển phiên bản Node

Khi chuyển từ Node 24 về Node 22 (hoặc ngược lại), các gói phụ thuộc nhị phân (`bcrypt`, `@prisma/client`) đã biên dịch theo bản Node cũ sẽ báo lỗi. Bạn cần dọn dẹp và cài lại:

### Thư mục gốc (Root):
```powershell
# Xóa node_modules cũ và package-lock.json
Remove-Item -Recurse -Force node_modules, package-lock.json

# Cài đặt lại thư viện
npm install

# Tạo lại Prisma client
npx prisma generate --config src/api/prisma.config.ts
```

### Thư mục Frontend (`src/admin` và `src/user`):
Nếu admin hoặc user bị lỗi module, thực hiện tương tự:
```powershell
# Tại src/admin
cd src/admin
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
cd ../..

# Tại src/user
cd src/user
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
cd ../..
```

---

## 5. Các lệnh khởi chạy dự án

* **Chạy Backend API:**
  ```powershell
  npm run dev:api
  ```
* **Chạy Admin Dashboard:**
  ```powershell
  npm run dev:admin
  ```
* **Chạy User Web:**
  ```powershell
  npm run dev:user
  ```
