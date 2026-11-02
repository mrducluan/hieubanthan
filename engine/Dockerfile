# Engine tầng CALC — Python + Node (chỉ để chạy iztro an sao tử vi, SPEC-005).
# Đường 2 (quyết định 2026-08-15): engine trên host container riêng, nên thêm Node
# không phải dời nhà. iztro ghim 2.6.0 trong ziwei/package-lock.json.

# ---- Tầng 1: cài iztro bằng npm ci (khoá theo lockfile) ---------------------
FROM node:22-trixie-slim AS ziwei
WORKDIR /ziwei
COPY ziwei/package.json ziwei/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
# Mọi tệp Node mà Python gọi (tuvi_an_sao.SCRIPT, MAY_CHU) + tệp chúng import. Thiếu một tệp = MỌI lượt an sao lỗi 503
# "Máy an sao Tử vi đang bận" (sự cố 2026-11-02: EN-4 tách an_sao_lib.mjs, may_chu.mjs mà ảnh chỉ chép an_sao.mjs).
# Thêm tệp .mjs mới → thêm vào đây; tests/test_dockerfile.py và bước thử an sao dưới đây bắt chỗ quên.
COPY ziwei/an_sao.mjs ziwei/an_sao_lib.mjs ziwei/may_chu.mjs ./

# ---- Tầng 2: runtime Python, mang theo đúng binary node --------------------
FROM python:3.12-slim

# Cùng nền Debian trixie với python:3.12-slim (đã có libstdc++/libgcc_s) → chép thẳng
# binary node, không cần apt. Đổi tag một bên thì đổi cả bên kia.
COPY --from=ziwei /usr/local/bin/node /usr/local/bin/node

WORKDIR /app

# Cài phụ thuộc trước (tận dụng cache Docker khi code đổi mà deps không đổi).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --from=ziwei /ziwei ./ziwei
COPY app ./app

# Kiểm tra lúc build: iztro chạy được và đúng bản ghim.
RUN node -e "console.log('iztro', require('/app/ziwei/node_modules/iztro/package.json').version)"
# Kiểm tra lúc build: an sao THẬT qua cả hai đường Python dùng (mỗi lượt một tiến trình + tiến trình chạy sẵn). Hỏng →
# build hỏng → Render giữ bản đang chạy thay vì đưa lên bản mà mọi trang Tử vi đều lỗi.
RUN python -c "from app.calc import tuvi_an_sao; tuvi_an_sao.tu_kiem()"

# Host cấp cổng qua biến $PORT (Render/Railway). Mặc định 8000 cho chạy tay.
ENV PORT=8000
EXPOSE 8000

# 1 worker là đủ cho staging; tăng khi có tải thật. Không --reload ở production.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
