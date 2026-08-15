# Engine tầng CALC — Python thuần. Chạy trên host container (Render/Railway/Fly).
# Khi SPEC-005 thêm iztro (Node), thêm bước cài Node vào đây — đã chọn Đường 2
# chính vì để lần thêm đó không phải dời nhà.
FROM python:3.12-slim

WORKDIR /app

# Cài phụ thuộc trước (tận dụng cache Docker khi code đổi mà deps không đổi).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Host cấp cổng qua biến $PORT (Render/Railway). Mặc định 8000 cho chạy tay.
ENV PORT=8000
EXPOSE 8000

# 1 worker là đủ cho staging; tăng khi có tải thật. Không --reload ở production.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
