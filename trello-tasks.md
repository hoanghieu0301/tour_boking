# 📋 Danh sách công việc (Tasks) Trello cho Dự án Tour Booking

Dưới đây là danh sách các tính năng được chia theo từng **Epic (Danh sách/Cột trên Trello)**. Bạn có thể copy từng mục này để tạo thẻ (Card) trên Trello để "fake" tiến độ hoặc làm template quản lý dự án.

## 🧑‍💻 1. Quản lý Người dùng & Xác thực (Auth)
- [ ] Thiết kế UI/UX trang Đăng ký / Đăng nhập
- [ ] API & Chức năng Đăng ký tài khoản (Local)
- [ ] API & Chức năng Đăng nhập (Local & JWT)
- [ ] Tích hợp Đăng nhập bằng mạng xã hội (Google / Facebook)
- [ ] Giao diện & Chức năng Quản lý thông tin cá nhân (Profile)
- [ ] Tính năng Đổi mật khẩu
- [ ] Tính năng Quên mật khẩu (Gửi OTP/Link qua Email)

## 🌍 2. Khám phá & Tìm kiếm Tour
- [ ] Giao diện Trang chủ (Banner, Tour nổi bật, Tour khuyến mãi)
- [ ] Chức năng Tìm kiếm Tour (Theo từ khóa, địa điểm đến)
- [ ] Chức năng Lọc Tour (Theo mức giá, độ dài ngày, loại hình tour)
- [ ] Chức năng Sắp xếp Tour (Giá tăng/giảm, Đánh giá cao)
- [ ] Giao diện Chi tiết Tour (Thư viện ảnh, Giá, Lịch khởi hành)
- [ ] Hiển thị Lịch trình chi tiết (Itinerary) theo từng ngày
- [ ] Hiển thị Chính sách, Điều khoản & Dịch vụ đi kèm

## 🛒 3. Đặt Tour & Thanh toán (Booking & Checkout)
- [ ] Form Đặt Tour (Chọn ngày khởi hành, nhập số lượng người lớn/trẻ em)
- [ ] Logic tính tổng tiền tự động dựa trên phân loại khách
- [ ] Áp dụng mã giảm giá (Voucher/Coupon) vào giỏ hàng
- [ ] Tích hợp cổng thanh toán trực tuyến (VNPay / MoMo / Stripe)
- [ ] Xử lý lưu đơn đặt (Booking) vào Database sau khi thanh toán
- [ ] Hệ thống tự động gửi Email xác nhận Đặt Tour thành công
- [ ] Trang Quản lý Lịch sử Đặt Tour của khách hàng
- [ ] Tính năng Yêu cầu hủy Tour & xử lý hoàn tiền

## ⭐ 4. Tương tác Khách hàng (Reviews & Ratings)
- [ ] Tính năng Đánh giá Tour (Rating 1-5 sao) sau chuyến đi
- [ ] Tính năng Viết bình luận / Cảm nhận
- [ ] Hiển thị danh sách Đánh giá tại trang Chi tiết Tour
- [ ] Tính năng Like / Báo cáo bình luận vi phạm

## 🤖 5. AI Chatbot (Tư vấn viên ảo)
- [ ] Thiết kế & Tích hợp Widget Chatbot vào giao diện web
- [ ] Kết nối API với OpenAI/Gemini để xử lý ngôn ngữ tự nhiên
- [ ] Huấn luyện / Cấu hình Prompt cho Chatbot tư vấn Tour theo data của hệ thống
- [ ] Lưu trữ và hiển thị Lịch sử trò chuyện của người dùng

## ⚙️ 6. Quản trị hệ thống (Admin Dashboard)
- [ ] Giao diện Tổng quan (Thống kê Doanh thu, Số lượng Đơn đặt, Khách hàng)
- [ ] Quản lý Danh mục & Địa điểm Tour (Thêm, Sửa, Xóa)
- [ ] Quản lý Tour (CRUD thông tin chung, giá, lịch trình, hình ảnh)
- [ ] Quản lý Đơn đặt Tour (Duyệt đơn, Đổi trạng thái, Hủy đơn)
- [ ] Quản lý Người dùng (Khóa/Mở khóa tài khoản, Phân quyền Admin/User)
- [ ] Quản lý Mã giảm giá (Tạo mã, Đặt điều kiện, Giới hạn sử dụng)
- [ ] Quản lý Bình luận & Đánh giá (Duyệt, Ẩn bình luận nhạy cảm)
- [ ] Xuất báo cáo (Export Excel/PDF) doanh thu theo tháng/quý
