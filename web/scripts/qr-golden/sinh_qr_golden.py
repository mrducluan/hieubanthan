"""Sinh golden QR (TCS-1) bằng HAI bộ mã hoá độc lập, chỉ cài tạm trong một venv riêng (KHÔNG thuộc dependency dự án):
- qrcodegen (Project Nayuki, Python): ma trận + phiên bản + MẶT NẠ tự chọn → so từng ô (cả phần chọn mặt nạ).
- qrcode (lincolnloop): ma trận với đúng mặt nạ thư viện đó chọn → so từng ô (không so phần chọn mặt nạ).
- segno 1.6.6 KHÔNG dùng làm golden: nó chèn thêm byte 0x00 trước byte đệm khi chuỗi bit tròn byte (lệch chuẩn).
Mọi ca đều giải mã lại bằng OpenCV để chắc ra đúng chuỗi.
Chạy (từ thư mục gốc repo):
  python3 -m venv /tmp/qrvenv && /tmp/qrvenv/bin/pip install qrcodegen qrcode opencv-python-headless
  /tmp/qrvenv/bin/python -I web/scripts/qr-golden/sinh_qr_golden.py web/e2e/fixtures/qr-golden.json
"""
import json
import sys

import qrcode
import qrcode.constants
import qrcode.util
from importlib.metadata import version as _ver
qrcode_ver = _ver('qrcode')
import qrcodegen

import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import giai  # noqa: E402

CHUOI = [
    "https://hieuban.com",
    "hieuban.com",
    "https://hieuban.com/",
    "https://hieuban.com/hom-nay",
    "https://hieuban.com/tu-vi?tu=ta.0123456789",
    "https://hieuban.com/bat-tu?tu=ta.a1b2c3d4e5",
    "https://hieuban.com/hom-nay?tu=hn.ffffffffff",
    "https://hieuban.com/?tu=th.9f8e7d6c5b",
    "https://hieuban.com/hop-doi?tu=hd.00aa11bb22",
    "https://hieuban.com/the/hai/WzEsIkxhbiIsIk1pbmgiLDAsNzUsMCxbNCw1NSwwLDEwMCwyLDYwXSwyMDc0N10.Ab3_x-9QzYk1LmNo?tu=hp.0123abcdef",
    "https://hieuban.com/the/hai/WzEsIiIsIiIsMyw0MCwyLFsxLDEwMCwzLDMzXSwyMDc0OF0.zzzzzzzzzzzzzzzz?tu=hp.abcdefabcd",
    "https://hieuban.com/kien-thuc",
    "https://hieuban.com/tu-vi/sao-o-cung/tu-vi-cung-menh",
    "https://hieuban.com/than-so/y-nghia-so/so-7",
    "https://hieuban.com/phong-thuy/huong-hop-tuoi/tuoi-1990-nam",
    "https://hieuban.com/xem-ngay-tot/2026-10-21",
    "Hiểu Bản Thân",
    "https://hieuban.com/?ten=Nguyễn Thị Hoà",
    "Đêm sao phương Đông · hieuban.com",
    "Người ấy & Bạn — 75/100 · Dễ hoà hợp",
    "a",
    "",
    "0123456789",
    "HTTPS://HIEUBAN.COM/T/ABC",
    "https://hieuban.com/the/" + "x" * 80,
    "https://hieuban.com/the/" + "Ab0-_" * 30,
    "https://hieuban.com/hop-doi/" + "eyJ2IjoxLCJ0IjoiTGFuIiwic28iOls3LDMsNSw4XX0" * 3 + ".sig",
    "https://hieuban.com/" + "q" * 190,
    "😀 sao băng ✨ 星",
    "https://hieuban.com/tuoi-xong-dat/2027/tuoi-1985",
    "https://hieuban.com/blog/chuyen-muc/tu-vi",
    "https://hieuban.com/kinh-dich/que/thuan-can",
    "https://hieuban.com/tu-vi/sao-o-cung/thien-co-cung-phu-the?tu=ta.0123456789",
    "https://hieuban.com/the/hai/WzEsIk1pbmggS2jDtGkiLCJUaOG6o28gVnkiLDAsNzAsMSxbMCwxMDAsMSwxMDAsMyw3M10sMjkzXQ.PAftuSIeo2QiIEbN?tu=hp.898b13ab6e",
    "https://hieuban.com/the/hai/" + "B" * 120 + ".sigsigsigsigsigs?tu=hp.0123456789",
]

CC = lambda v: 8 if v <= 9 else 16  # noqa: E731


def hang_qrcode(q):
    return ["".join("1" if c else "0" for c in h) for h in q.get_matrix()]


def main(ra):
    ca, ca_qrcode, loi_giai = [], [], []
    for s in CHUOI:
        b = s.encode("utf-8")
        n = qrcodegen.QrCode.encode_segments([qrcodegen.QrSegment.make_bytes(b)], qrcodegen.QrCode.Ecc.MEDIUM, 1, 10, -1, False)
        v = n.get_version()
        hang = ["".join("1" if n.get_module(x, y) else "0" for x in range(n.get_size())) for y in range(n.get_size())]
        if giai.giai(hang) != s:
            loi_giai.append(s)
        ca.append({"chuoi": s, "so_byte": len(b), "phien_ban": v, "mask": n.get_mask(), "hang": hang})
        q = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
        q.add_data(qrcode.util.QRData(b, mode=qrcode.util.MODE_8BIT_BYTE))
        q.make(fit=True)
        assert q.version == v, (s, q.version, v)
        m = q.mask_pattern if q.mask_pattern is not None else q.best_mask_pattern()
        q2 = qrcode.QRCode(version=v, error_correction=qrcode.constants.ERROR_CORRECT_M, border=0, mask_pattern=m)
        q2.add_data(qrcode.util.QRData(b, mode=qrcode.util.MODE_8BIT_BYTE))
        q2.make(fit=False)
        ca_qrcode.append({"chuoi": s, "phien_ban": v, "mask": m, "hang": hang_qrcode(q2)})
    json.dump({
        "_ghi_chu": (
            "Golden QR (TCS-1), mức M, chế độ byte UTF-8, phiên bản 1–10. 'ca' sinh bằng qrcodegen (Project Nayuki, Python) — "
            "so ma trận + phiên bản + mặt nạ tự chọn. 'ca_qrcode' sinh bằng thư viện Python qrcode %s với mặt nạ thư viện đó "
            "chọn — so ma trận khi ép đúng mặt nạ đó (hai thư viện chấm điểm mặt nạ hơi khác nhau). segno 1.6.6 không dùng: "
            "nó chèn thêm byte 0x00 trước byte đệm (lệch chuẩn), mã vẫn quét được nhưng không so từng ô được. "
            "Ca 'ca' giải mã lại bằng OpenCV %s: %d/%d đúng chuỗi. Sinh lại bằng web/scripts/qr-golden/sinh_qr_golden.py — thư viện chỉ "
            "cài tạm trong venv riêng, KHÔNG thuộc dependency dự án."
        ) % (qrcode_ver, __import__("cv2").__version__, len(CHUOI) - len(loi_giai), len(CHUOI)),
        "ca": ca,
        "ca_qrcode": ca_qrcode,
    }, open(ra, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print("ca", len(ca), "ca_qrcode", len(ca_qrcode), "giải mã lỗi", loi_giai)


if __name__ == "__main__":
    main(sys.argv[1])
