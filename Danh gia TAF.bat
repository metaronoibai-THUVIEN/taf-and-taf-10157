@echo off
chcp 65001 >nul
title Mo Ung Dung TAF

:: 1. Gọi file chay_taf.bat nằm ngay cùng thư mục với nó để bật server ngầm
start "" "%~dp0chay_taf.bat"

:: 2. Đợi 3 giây để server kịp khởi động ổn định
timeout /t 3 /nobreak >nul

echo Dang mo ung dung tren trinh duyet...

:: 3. Tự động mở bằng trình duyệt mặc định của hệ thống (Edge, Chrome, Firefox...)
:: Lệnh "start" dưới đây sẽ tự động dùng trình duyệt mặc định mà người dùng đang cài trên Windows
start "" "http://localhost:3001"

:: --- (TÙY CHỌN NẾU BẠN MUỐN CHỈ ĐỊNH CỤ THỂ TRÌNH DUYỆT KHÁC) ---
:: Nếu muốn dùng Microsoft Edge, hãy thay dòng trên bằng: start msedge "http://localhost:3001"
:: Nếu muốn dùng Cốc Cốc, hãy thay dòng trên bằng: start cococ "http://localhost:3001"
:: Nếu muốn dùng Brave, hãy thay dòng trên bằng: start brave "http://localhost:3001"

exit