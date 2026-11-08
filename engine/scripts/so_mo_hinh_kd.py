# -*- coding: utf-8 -*-
"""KD-V3 hướng C — so các mô hình (qua OpenRouter) cho phần "AI diễn đạt câu trả lời quẻ".

Cần `OPENROUTER_API_KEY` thật (việc của chủ dự án). Mỗi mô hình chạy cùng một bộ gói trả lời (N câu × quẻ cố định, tất
định) → đếm: qua bộ kiểm `kiem_tra_chuong` (không số lạ / thuật ngữ lạ / cụm cấm / ý mới / quá dài), giữ đúng chiều nghiêng
(câu đầu còn chữ "nên" / "chưa nên" / "có" / "chưa"), độ dài so với nguồn, thời gian, chi phí ước tính (token). KHÔNG đưa
câu người dùng gõ vào lời nhắc (nguồn = lớp A). Không nhớ kết quả (nho=False) để đo thật.

Chạy: OPENROUTER_API_KEY=… PYTHONPATH=. .venv/bin/python scripts/so_mo_hinh_kd.py [--mo-hinh a,b,c] [--n 12]
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.hoidap import kinhdich as k  # noqa: E402
from app.luangiai import kinhdich_tra_loi as ktl  # noqa: E402
from app.narrative import ai_goi, luan_giai_van as lgv  # noqa: E402

# Ứng viên (tên theo OpenRouter, 2026): rẻ – mạnh tiếng Việt – bám ràng buộc. Chủ dự án sửa danh sách theo bảng giá hiện hành.
UNG_VIEN = ["anthropic/claude-sonnet-4.5", "anthropic/claude-haiku-4.5", "google/gemini-2.5-flash", "google/gemini-2.5-pro",
            "openai/gpt-4.1-mini", "deepseek/deepseek-chat-v3.1", "qwen/qwen3-235b-a22b"]
CAU = ["Tôi có nên nhận lời làm quản lý không?", "Vợ chồng tôi hay cãi nhau, có nên ly thân một thời gian không?",
       "Con tôi năm nay thi đại học có đậu không?", "Bạn thân nợ tôi 50 triệu, có đòi được không?",
       "Khi nào tôi tìm được việc mới?", "Có nên mua căn hộ đang xem không?", "Hợp tác với đối tác này có lợi không?",
       "Tôi nên làm gì để được sếp cất nhắc?", "Anh ấy có thật lòng với tôi không?", "Hồ sơ visa của tôi có được duyệt không?",
       "Có nên đổi xe mới trong năm nay?", "Chiếc nhẫn tôi đánh rơi có tìm lại được không?"]
QUE = [[7, 8, 9, 8, 7, 8], [7, 7, 8, 7, 7, 9], [8, 6, 8, 8, 8, 8]]
THOI = dt.datetime(2026, 11, 8, 10, 30)
CHIEU = {"co": ("nghiêng về có", "nên làm", "nghiêng về nên"), "dieu_kien": ("điều kiện", "làm được", "có, nhưng"),
         "chua_voi": ("chưa nên vội", "chưa thấy rõ", "chưa phải lúc", "cần thêm"), "chua": ("chưa nên", "khó trong lúc này", "chưa thấy")}


def goi_mo_hinh(dq: dict, mo_hinh: str) -> tuple[str | None, list[str], float]:
    nguon = ktl.nguon_dien_dat(dq)
    nguon_van = "\n".join(nguon)
    t0 = time.time()
    try:
        van = ai_goi.goi_chat(
            [{"role": "system", "content": ktl._SYSTEM_DIEN_DAT.format(cum_cam="; ".join(f'"{c}"' for c in lgv._cum_cam()))},
             {"role": "user", "content": "\n".join(f"- {s}" for s in nguon)}],
            nhiet_do=0.3, max_tokens=max(250, min(900, len(nguon_van) * 3 // 4)), mo_hinh=mo_hinh, het_gio=60, nho=False, tru_luot=False).strip()
    except Exception as e:  # noqa: BLE001
        return None, [f"lỗi: {e}"], time.time() - t0
    return van, lgv.kiem_tra_chuong(van, nguon_van), time.time() - t0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mo-hinh", default=",".join(UNG_VIEN))
    ap.add_argument("--n", type=int, default=12)
    ap.add_argument("--in-van", action="store_true", help="in cả bản AI của từng câu")
    a = ap.parse_args()
    if not os.environ.get("OPENROUTER_API_KEY"):
        sys.exit("Cần OPENROUTER_API_KEY.")
    goi = []
    for i, c in enumerate(CAU[:a.n]):
        kq = k.tra_loi(c, gia_tri_hao=QUE[i % len(QUE)], thoi_diem=THOI, cach_ra_que="gieo_tay")
        if kq.get("doc_que") and kq["doc_que"].get("tra_loi"):
            goi.append((c, kq["doc_que"]))
    print(f"| Mô hình | Qua kiểm | Đúng chiều | Dài/nguồn | Giây/câu | Lỗi hay gặp |\n|---|---|---|---|---|---|")
    for mh in [x.strip() for x in a.mo_hinh.split(",") if x.strip()]:
        qua = chieu = 0
        ti_le, giay, loi_dem = [], [], {}
        for c, dq in goi:
            van, loi, s = goi_mo_hinh(dq, mh)
            giay.append(s)
            if van is None:
                loi_dem[loi[0][:40]] = loi_dem.get(loi[0][:40], 0) + 1
                continue
            ti_le.append(len(van) / max(1, len("\n".join(ktl.nguon_dien_dat(dq)))))
            if not loi:
                qua += 1
            for l in loi:
                loi_dem[l.split(":")[0]] = loi_dem.get(l.split(":")[0], 0) + 1
            if any(x in van[:160].lower() for x in CHIEU.get(dq["tra_loi"]["nghieng"], ())):
                chieu += 1
            if a.in_van:
                print(f"\n[{mh}] {c}\n  nghiêng={dq['tra_loi']['nghieng']} | lỗi={loi}\n  {van}")
        n = len(goi)
        top = ", ".join(f"{k_} ×{v}" for k_, v in sorted(loi_dem.items(), key=lambda x: -x[1])[:3])
        print(f"| {mh} | {qua}/{n} | {chieu}/{n} | {sum(ti_le)/len(ti_le):.2f} | {sum(giay)/len(giay):.1f} | {top} |" if ti_le
              else f"| {mh} | 0/{n} | – | – | {sum(giay)/len(giay):.1f} | {top} |")


if __name__ == "__main__":
    main()
