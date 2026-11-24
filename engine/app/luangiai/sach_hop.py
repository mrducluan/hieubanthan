# -*- coding: utf-8 -*-
"""SX-D (2026-11-24) — câu sách xưa đi cùng hộp luận của báo cáo đời sống.

Thay cách "nhúng `source_ref` cố định vào ô KB" (nhánh thử nghiệm, đã đánh giá và không dùng): ô KB KHÔNG chép câu sách.
Hộp luận về một sao ở một cung hỏi đúng bộ chọn của khối "Sách xưa ghi" (`sach_ghi_mon.chon_tuvi_sao`) với chính lá số —
nên câu sách chỉ hiện khi điều kiện của câu đúng với lá số (độ sáng, sao đi cùng, địa chi), qua khuôn SX-C (nhóm, tuổi).

Gắn:
  · câu nhóm A (sách khen / mô tả) → hộp "điểm mạnh" của sao đó; nhóm B / C → hộp "điều dễ vấp";
  · mỗi câu một lần trong cả bài, tối đa `TOI_DA_MOI_HOP` câu một hộp;
  · người chưa đủ 18 tuổi (hoặc chưa rõ tuổi) không nhận nhóm C;
  · câu sách có ghi `doi_chieu.khac` (sách nói khác lời của hộp — vd sách nói "được cơ nghiệp cha ông", lời nói "tự gây
    dựng") → trường `khac` nói rõ hai ý khác nhau ở đâu, không ngầm bảo sách đỡ cho lời.

Chỉ thêm trường `sach` của hộp; mức, tiêu đề, nội dung, mã kiểm chứng KHÔNG đổi. Chỉ bản Việt.
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import sach_ghi as sg
from app.luangiai import sach_ghi_mon as sm

TOI_DA_MOI_HOP = 2
_NHOM_HOP = {"A": "diem_manh", "B": "luu_y", "C": "luu_y"}


def muc_hop(m: dict, ve: str, o: str | None = None) -> dict:
    """Một câu sách hiển thị trong hộp: dạng của khối "Sách xưa ghi" + `khac` + câu kết của chính câu đó.
    `khac` chỉ hiện khi lời hộp lấy đúng ô (`o` = "sang" | "ham") mà người duyệt đã so (`doi_chieu.o`)."""
    ra = sm.muc(m, ve)
    dc = m.get("doi_chieu") or {}
    if dc.get("khac") and dc.get("o") == o:
        ra["khac"] = dc["khac"]
    ket = sg.cau_ket([m])
    if ket:
        ra["cau_ket"] = ket
    return ra


def gan_tuvi(chuong: list[dict], ls: dict, tuoi: int | None) -> int:
    """Gắn câu Toàn Thư vào hộp có `_sao` = (sao, cung, độ sáng, nhóm ô). → số câu đã gắn."""
    if not ngon_ngu.la_viet():
        return 0
    theo_cung = {c["ten"]: c for c in ls["cung"]}
    kb = sm._kb("tuvi_sach_ghi.json")["muc"]
    da: set[str] = set()
    n = 0
    for ch in chuong:
        for h in ch.get("hop") or []:
            khoa = h.get("_sao")
            if not khoa or h.get("loai") not in ("diem_manh", "luu_y"):
                continue
            sao, cung, do_sang, o = khoa
            c = theo_cung.get(cung)
            if not c:
                continue
            ten_sao = {s["ten"] for s in c["chinh_tinh"]} | set(c.get("phu_tinh") or [])
            hoa = {x["hoa"] for x in ls.get("tu_hoa") or [] if x["cung"] == cung}
            cac = sm._loc(sm.chon_tuvi_sao(sao, cung, do_sang, ten_sao, hoa, c.get("chi"), kb), tuoi)
            gan = []
            for m, ve in cac:
                if _NHOM_HOP[m["nhom"]] != h["loai"] or m["han"] in da:
                    continue
                gan.append(muc_hop(m, ve, o))
                da.add(m["han"])
                if len(gan) >= TOI_DA_MOI_HOP:
                    break
            if gan:
                h["sach"] = gan
                n += len(gan)
    return n
