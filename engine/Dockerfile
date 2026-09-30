# Engine tầng CALC — Python + Node (chỉ để chạy iztro, SPEC-005). Chạy trên
# host container (Render/Railway/Fly).
#
# Node chỉ là runtime cho app/calc/ziwei_node/an_sao.mjs (iztro ghim trong
# package-lock.json). Quyết định 2026-08-15: Python gọi iztro qua subprocess.

# ---- Tầng 1: cài iztro ĐÚNG lockfile (npm ci, không nâng bản) --------------
FROM node:22-bookworm-slim AS ziwei
WORKDIR /ziwei
COPY app/calc/ziwei_node/package.json app/calc/ziwei_node/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- Tầng 2: image chạy ----------------------------------------------------
FROM python:3.12-slim

# Chỉ lấy binary node (không npm/npx) từ image Node chính thức ở tầng 1.
COPY --from=ziwei /usr/local/bin/node /usr/local/bin/node
RUN node --version

WORKDIR /app

# Cài phụ thuộc trước (tận dụng cache Docker khi code đổi mà deps không đổi).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY --from=ziwei /ziwei/node_modules ./app/calc/ziwei_node/node_modules

# Kiểm tra khói lúc build: iztro chạy được và đúng bản ghim.
RUN python -c "from app.calc import ziwei; ok, why = ziwei.san_sang(); assert ok, why; \
from datetime import date; assert len(ziwei.an_sao(date(1990, 5, 15), 1, 'nam')['cung']) == 12"

# Host cấp cổng qua biến $PORT (Render/Railway). Mặc định 8000 cho chạy tay.
ENV PORT=8000
EXPOSE 8000

# 1 worker là đủ cho staging; tăng khi có tải thật. Không --reload ở production.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
