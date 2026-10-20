"""Gói Sao "Bản đồ con số" — Luận giải toàn bộ thần số (chủ dự án chọn 3 phần, 2026-10-20).

Cùng khuôn `toan_bo` (chương + `moi_xem`): chương 1 "Tổng quan" là chương đọc miễn phí — điểm "bước ngoặt" khơi gợi
(bạn hiếm cỡ nào, con số lặp lại, tên hai nhóm lệch nhau); tầng web cắt các chương sau thành lời mời, mở bằng Sao
(`web/lib/luan-giai-sao.ts`, mô-đun "thanso"). Ba chương mở bằng Sao:
  - Nghịch lý bên trong: Linh hồn ↔ Nhân cách, Đường đời ↔ Sứ mệnh theo nhóm năng lượng (KB `thanso_ban_do.json`),
    số thiếu + mũi tên biểu đồ ngày sinh, nợ nghiệp.
  - 12 tháng tới: năm cá nhân, 12 tháng cá nhân + việc hợp theo tháng, giai đoạn đỉnh cao đang đi, mốc bước ngoặt tới.
  - Sự nghiệp & tiền bạc: chân dung công việc của Đường đời + đích Sứ mệnh + bẫy + tiền + 4 giai đoạn đời.
RULES + template từ CALC/KB, không LLM (dien_dat = "mau"), không tên/ngày sinh trong lời văn, không dự báo sự kiện.
"""
from __future__ import annotations

import datetime as dt

from app.calc import thanso as tinh, thanso_dong_doi as dd_calc, thanso_mo_rong as mr, thanso_ty_le as tl
from app.kb import store, thanso_v2 as kb
from app.luangiai import thanso as lg
from app.luangiai.toan_bo import _moi_xem
from app.narrative import hoi_van

TIEU_DE = {"tong_quan": "Tổng quan: bạn hiếm cỡ nào", "nghich_ly": "Nghịch lý bên trong",
           "muoi_hai_thang": "12 tháng tới của bạn", "su_nghiep": "Sự nghiệp & tiền bạc"}
TEN_MOC = {"khoi_chu_ky": "mở chu kỳ 9 năm mới", "khep_chu_ky": "khép chu kỳ 9 năm", "chuyen_dinh": "sang giai đoạn đỉnh cao mới"}


def _nhom(so: int) -> tuple[str, dict] | None:
    for ma, n in kb.ban_do()["nhom"].items():
        if so in n["so"]:
            return ma, n
    return None


def _cau_noi(a: str, b: str) -> dict:
    return kb.ban_do()["cau_noi"]["|".join(sorted((a, b)))]


def _so_vn(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def _pt(x: float) -> str:
    return f"{x * 100:.1f}".replace(".", ",") + "%"


def _cau_dau(s: str | None) -> str:
    s = (s or "").strip()
    i = s.find(". ")
    return s[: i + 1] if i > 0 else s


def _tong_quan(so: dict, ngay: int, thang: int, nam: int, quy_uoc: str) -> list[str]:
    t = tl.ty_le(ngay, thang, nam, quy_uoc)
    d, c = t["duong_doi"], t["cap"]
    doan = [f"Đường đời {d['so']}: khoảng {_pt(d['ty_le'])} ngày sinh trong mẫu {t['mau']} cho ra con số này. "
            f"Cùng lúc mang Đường đời {d['so']} và số Ngày sinh {c['ngay_sinh']} thì hiếm hơn nhiều: "
            f"{_so_vn(c['so_ngay'])} trên {_so_vn(t['tong_ngay'])} ngày — khoảng 1 trong {round(1 / c['ty_le']) if c['ty_le'] else 0} ngày sinh."]
    if d["so"] in (11, 22, 33):
        doan.append(f"{d['so']} là số cái — chỉ khoảng {_pt(d['ty_le'])} ngày sinh có, nét của nó thường đậm và đòi hỏi nhiều ở chính bạn.")
    dem: dict[int, list[str]] = {}
    for vt in lg.VI_TRI_THU_TU:
        if so.get(vt):
            dem.setdefault(so[vt], []).append(lg.TEN_NGAN_VI_TRI[vt])
    for s, noi in sorted(dem.items(), key=lambda x: -len(x[1])):
        if len(noi) >= 2:
            tk = (store.nghia_so(s) or {}).get("tu_khoa", "")
            doan.append(f"Số {s} xuất hiện {len(noi)} lần trong 4 số cốt lõi của bạn ({', '.join(noi)}) — nét "
                        f"{tk.lower()} đậm hơn ở người chỉ có số này một lần.")
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    if lh and nc:
        doan.append(f"Bên trong bạn thuộc nhóm {lh[1]['ten']}, còn người khác nhìn thấy trước nhóm {nc[1]['ten']}"
                    + (" — trong ngoài cùng một nhịp." if lh[0] == nc[0] else
                       " — chỗ lệch này giải thích vì sao bạn đôi khi bị hiểu khác với con người thật của mình.")
                    + " Chương \"Nghịch lý bên trong\" đọc kỹ điều đó.")
    doan.append("Bản đồ đầy đủ còn có 12 tháng tới (tháng hợp để khởi sự, đổi việc, lo quan hệ, bàn chuyện tiền, khép "
                "việc cũ) và sự nghiệp, tiền bạc theo đủ bộ số và 4 giai đoạn đời của bạn.")
    return doan


def _nghich_ly(so: dict, mo_rong: dict) -> list[str]:
    doan = []
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    if lh and nc:
        cn = _cau_noi(lh[0], nc[0])
        doan.append(f"Bên trong (Linh hồn {so['linh_hon']}, nhóm {lh[1]['ten']}) bạn muốn {lh[1]['muon']}. Người khác thấy "
                    f"trước (Nhân cách {so['nhan_cach']}, nhóm {nc[1]['ten']}) một người {nc[1]['bieu_hien']}.")
        if lh[0] != nc[0]:
            doan.append(f"{cn['ten']}: {cn['doc']} Vì vậy bạn dễ bị hiểu là {nc[1]['bi_hieu_lam']} — trong khi điều bạn "
                        f"thật sự cần là {lh[1]['can']}.")
        else:
            doan.append(f"{cn['ten']}: {cn['doc']}")
        doan.append(f"Cách nói cho người khác hiểu: {cn['cach_noi_ro']} Khi hai phía hoà vào nhau: {cn['khi_hoa']}")
    d, s = _nhom(so.get("duong_doi") or 0), _nhom(so.get("su_menh") or 0)
    if d and s:
        if d[0] == s[0]:
            doan.append(f"Con đường bạn đi (Đường đời {so['duong_doi']}) và đích bạn hướng tới (Sứ mệnh {so['su_menh']}) cùng "
                        f"nhóm {d[1]['ten']}: bạn đang đi đúng hướng mình muốn tới — điều cần giữ là {d[1]['can']}.")
        else:
            cn = _cau_noi(d[0], s[0])
            doan.append(f"Con đường bạn đi (Đường đời {so['duong_doi']}, nhóm {d[1]['ten']}) và đích bạn hướng tới (Sứ mệnh "
                        f"{so['su_menh']}, nhóm {s[1]['ten']}) — {cn['ten'].lower()}: {cn['doc']} Khi hoà được: {cn['khi_hoa']}")
    bd = mo_rong.get("bieu_do") or {}
    if bd.get("so_thieu"):
        doan.append(f"Ngày sinh của bạn thiếu số {', '.join(map(str, bd['so_thieu']))} trong biểu đồ — những nét bạn thường "
                    "phải chủ động rèn thay vì có sẵn.")
    for m in bd.get("mui_ten", []):
        if m.get("y_nghia"):
            doan.append(f"{m['ten']}: {m['y_nghia']} Gợi ý: {m.get('goi_y', '')}".strip())
    for n in mo_rong.get("no_nghiep") or []:
        if n.get("nghia"):
            doan.append(f"Nợ nghiệp {n['so']} ({n.get('vi_tri', '')}): {_cau_dau(n['nghia'].get('y_nghia') or n['nghia'].get('mo_ta'))}")
    return doan or ["Bộ số của bạn chưa đủ (họ tên chưa có chữ cái) để đọc chỗ lệch giữa bên trong và bên ngoài."]


def _muoi_hai_thang(ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str) -> list[str]:
    van = kb.ban_do()
    y = ngay_xem.year
    ncn = int(tinh.nam_ca_nhan(ngay, thang, y, "duong_lich"))
    n = store.nghia_nam_ca_nhan(ncn) or {}
    doan = [f"Năm cá nhân {ncn} ({y}): {n.get('chu_de', '')}. {n.get('y_nghia', '')} Nên: {n.get('nen', '')}".strip()]
    theo_nhom: dict[str, list[str]] = {k: [] for k in van["nhom_viec"]}
    m, yy = ngay_xem.month, y
    for _ in range(12):
        s = mr.thang_ca_nhan(ngay, thang, yy, m)
        th = van["thang_hop"][str(s)]
        nk = kb.nghia_phu("thang_ca_nhan", s) or {}
        doan.append(f"{m}/{yy} — tháng cá nhân {s} ({th['nhan']}): {nk.get('chu_de', '')}. Hợp để: {', '.join(th['hop_de'])}."
                    + (f" Nên tránh: {nk['tranh']}" if nk.get("tranh") else ""))
        for k in th["nhom"]:
            if k in theo_nhom:
                theo_nhom[k].append(f"{m}/{yy}")
        m, yy = (1, yy + 1) if m == 12 else (m + 1, yy)
    for k, ten in van["nhom_viec"].items():
        if theo_nhom[k]:
            doan.append(f"{ten}: {', '.join(theo_nhom[k])}.")
    dd = dd_calc.dong_doi(ngay, thang, nam, y, quy_uoc=quy_uoc)
    hien = dd["hien_tai"]
    gd = next((g for g in dd["giai_doan"] if g["dinh"] == hien["dinh"]), None)
    if gd:
        nd = store.nghia_dinh_cao(gd["so"]) or {}
        den = f"{gd['den_tuoi']}" if gd.get("den_tuoi") else "+"
        doan.append(f"Bạn đang ở giai đoạn {hien['dinh']}/4 của đời (tuổi {gd['tu_tuoi']}–{den}, số {gd['so']}): "
                    f"{nd.get('chu_de', '')}. {nd.get('y_nghia', '')}".replace("–+", "+"))
    tiep = [b for b in dd["buoc_ngoat"] if b["nam"] > y][:2]
    if tiep:
        doan.append("Mốc sắp tới: " + "; ".join(f"năm {b['nam']} (tuổi {b['tuoi']}) {TEN_MOC.get(b['loai'], b['loai'])}"
                                              for b in tiep) + ".")
    doan.append("Đây là nhịp gợi ý để sắp việc, không phải dự báo điều sẽ xảy ra.")
    return doan


def _su_nghiep(so: dict, ngay: int, thang: int, nam: int, quy_uoc: str) -> list[str]:
    doan = []
    cv = ((kb.chan_dung(so["duong_doi"]) or {}).get("cong_viec")) or {}
    if cv:
        doan.append(f"Đường đời {so['duong_doi']} — thế mạnh trong công việc: {cv['the_manh']} Môi trường hợp: {cv['moi_truong']} "
                    f"Vai trò hợp: {cv['vai_tro']}")
        if cv.get("nghe"):
            doan.append(f"Nhóm nghề thường hợp: {'; '.join(cv['nghe'])}.")
    sm = so.get("su_menh")
    cs = ((kb.chan_dung(sm) or {}).get("cong_viec")) if sm else None
    if cs:
        doan.append(f"Sứ mệnh {sm} — đích nghề nghiệp bạn hướng tới: {cs['vai_tro']} Thế mạnh cần vun: {cs['the_manh']}")
    if cv:
        doan.append(f"Bẫy hay mắc: {cv['cai_bay']}")
        doan.append(f"Tiền bạc: {cv['tien_bac']}")
    for g in tinh.dinh_cao(ngay, thang, nam, tinh.duong_doi(ngay, thang, nam, quy_uoc)):
        c = ((kb.chan_dung(g["so"]) or {}).get("cong_viec")) or {}
        tuoi = f"{g['tu_tuoi']}–{g['den_tuoi']}" if g.get("den_tuoi") else f"{g['tu_tuoi']}+"
        if c:
            doan.append(f"Giai đoạn {g['dinh']} (tuổi {tuoi}, số {g['so']}): thuận cho kiểu việc {c['the_manh'].rstrip('.').lower()}.")
    return doan


def bao_cao(ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str = "tong_het") -> dict:
    so = tinh.chi_so_xac_dinh(ho_ten[0], ngay, thang, nam, quy_uoc)
    mo_rong = lg.luan_mo_rong(ho_ten[0], ngay, thang, nam, quy_uoc=quy_uoc)
    noi_dung = {
        "tong_quan": _tong_quan(so, ngay, thang, nam, quy_uoc),
        "nghich_ly": _nghich_ly(so, mo_rong),
        "muoi_hai_thang": _muoi_hai_thang(ngay, thang, nam, ngay_xem, quy_uoc),
        "su_nghiep": _su_nghiep(so, ngay, thang, nam, quy_uoc),
    }
    chuong = [{"ma": ma, "tieu_de": TIEU_DE[ma], "doan": doan, "moi_xem": _moi_xem("thanso", ma, doan)}
              for ma, doan in noi_dung.items()]
    meta = kb.meta_ban_do()
    return {"mo_dun": "thanso", "chuong": chuong, "ket": hoi_van.KET, "dien_dat": "mau", "quy_uoc_duong_doi": quy_uoc,
            "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
            "trang_thai": meta["trang_thai"]}
