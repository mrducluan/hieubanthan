"""Gói Sao "Bản đồ con số" — Luận giải toàn bộ thần số (chủ dự án chọn 3 phần, 2026-10-20).

Cùng khuôn `toan_bo` (chương + `moi_xem`): chương 1 "Tổng quan" là chương đọc miễn phí — điểm chuyển từ tổng quan sang
chiều sâu (bộ số của bạn hiếm cỡ nào, số lặp, biểu đồ thiếu số nào, bên trong vs bên ngoài, mốc riêng sắp tới); tầng
web cắt các chương sau thành lời mời, mở bằng Sao (`web/lib/luan-giai-sao.ts`, mô-đun "thanso"). Ba chương mở bằng Sao:
  - Bên trong & bên ngoài: Linh hồn ↔ Nhân cách, Đường đời ↔ Sứ mệnh theo nhóm năng lượng (KB `thanso_ban_do.json`),
    mũi tên biểu đồ ngày sinh, nợ nghiệp (gộp theo số).
  - 12 tháng tới: đọc theo năm cá nhân (KB `nam_doc_thang`), tháng then chốt (mỗi loại việc ≤ 2 tháng), nhịp từng tháng
    gọn một dòng, giai đoạn đỉnh cao đang đi + mốc sắp tới (gộp mốc cùng năm).
  - Sự nghiệp & tiền bạc: công thức nghề từ Đường đời + Sứ mệnh + Nhân cách, bẫy, tiền + tháng hợp bàn chuyện tiền,
    giai đoạn hiện tại + kế tiếp kèm thử thách — không chép lại chân dung đã hiện miễn phí.
Lời mời chương khoá (`moi_xem`) nêu một dữ kiện RIÊNG chưa lộ của chương. RULES + template từ CALC/KB, không LLM
(dien_dat = "mau"), không tên/ngày sinh trong lời văn, không dự báo sự kiện.
"""
from __future__ import annotations

import datetime as dt

from app.calc import thanso as tinh, thanso_dong_doi as dd_calc, thanso_mo_rong as mr, thanso_ty_le as tl
from app.kb import store, thanso_v2 as kb
from app.luangiai import doi_song_khuon as kh
from app.luangiai import thanso as lg
from app.narrative import hoi_van

TIEU_DE = {"tong_quan": "Tổng quan: bộ số của bạn", "nghich_ly": "Bên trong & bên ngoài",
           "muoi_hai_thang": "12 tháng tới của bạn", "su_nghiep": "Sự nghiệp & tiền bạc"}
TEN_MOC = {"khoi_chu_ky": "mở chu kỳ 9 năm mới", "khep_chu_ky": "khép chu kỳ 9 năm", "chuyen_dinh": "sang giai đoạn đời mới"}
TEN_VT = {**lg.TEN_NGAN_VI_TRI, "ngay_sinh": "Ngày sinh"}
NHOM_THEN_CHOT = ("khoi_su", "doi_viec", "tien_bac", "quan_he", "khep_lai")
HIEM, IT_GAP = 0.01, 0.02   # "hiếm" < 1% số ngày, "ít gặp" < 2%, còn lại "khá phổ biến"


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


def _cai(so: int) -> str:
    return f" (số cái {so} — nét của nhóm đậm và đòi hỏi nhiều hơn)" if so in (11, 22, 33) else ""


def _thang_toi(ngay: int, thang: int, ngay_xem: dt.date) -> list[dict]:
    van = kb.ban_do()
    ds, m, y = [], ngay_xem.month, ngay_xem.year
    for _ in range(12):
        s = mr.thang_ca_nhan(ngay, thang, y, m)
        ds.append({"thang": m, "nam": y, "so": s, "nam_ca_nhan": int(tinh.nam_ca_nhan(ngay, thang, y, "duong_lich")),
                   **van["thang_hop"][str(s)]})
        m, y = (1, y + 1) if m == 12 else (m + 1, y)
    return ds


def _then_chot(thang: list[dict]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {k: [] for k in NHOM_THEN_CHOT}
    for t in thang:
        for k in t["nhom"]:
            if k in out and len(out[k]) < 2:
                out[k].append(t)
    return out


def _giai_doan(ngay: int, thang: int, nam: int, y: int, quy_uoc: str) -> tuple[dict, dict | None, dict]:
    dd = dd_calc.dong_doi(ngay, thang, nam, y, quy_uoc=quy_uoc)
    gd = dd["giai_doan"]
    i = next(k for k, g in enumerate(gd) if g["dinh"] == dd["hien_tai"]["dinh"])
    return gd[i], (gd[i + 1] if i + 1 < len(gd) else None), dd


def _mm(t: dict) -> str:
    return f"{t['thang']}/{t['nam']}"


def _tuoi(g: dict) -> str:
    return f"{g['tu_tuoi']}–{g['den_tuoi']}" if g.get("den_tuoi") is not None else f"{g['tu_tuoi']}+"


# ------------------------------------------------------------------ chương 1 (miễn phí)
def _tong_quan(so: dict, ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str, mo_rong: dict) -> list[str]:
    t = tl.ty_le(ngay, thang, nam, quy_uoc)
    d, c = t["duong_doi"], t["cap"]
    mot_trong = round(1 / c["ty_le"]) if c["ty_le"] else 0
    doan = [f"Đường đời {d['so']}: {_pt(d['ty_le'])} số ngày trong lịch {t['mau']} cho ra con số này (tính theo ngày "
            "trong lịch, không phải theo số người)."]
    if c["ty_le"] < IT_GAP:
        doan.append(f"Cặp Đường đời {d['so']} và số Ngày sinh {c['ngay_sinh']} {'thì hiếm' if c['ty_le'] < HIEM else 'khá ít gặp'}: chỉ {_so_vn(c['so_ngay'])} trên "
                    f"{_so_vn(t['tong_ngay'])} ngày — khoảng 1 trong {mot_trong} ngày sinh.")
    else:
        doan.append(f"Cặp Đường đời {d['so']} và số Ngày sinh {c['ngay_sinh']} gặp ở khoảng 1 trong {mot_trong} ngày — khá "
                    "phổ biến; nét riêng của bạn nằm ở cách các con số khác kết hợp với nhau.")
    if d["so"] in (11, 22, 33):
        doan.append(f"{d['so']} là số cái — nét của nó thường đậm và đòi hỏi nhiều ở chính bạn.")
    bo = {**{v: so.get(v) for v in lg.VI_TRI_THU_TU}, "ngay_sinh": mr.so_ngay_sinh(ngay)}
    dem: dict[int, list[str]] = {}
    for vt, s in bo.items():
        if s:
            dem.setdefault(s, []).append(TEN_VT[vt])
    for s, noi in sorted(dem.items(), key=lambda x: -len(x[1])):
        if len(noi) >= 2:
            tk = (store.nghia_so(s) or {}).get("tu_khoa", "")
            doan.append(f"Số {s} xuất hiện {len(noi)} lần trong bộ số của bạn ({', '.join(noi)}) — nét {tk.lower()} đậm hơn "
                        "ở người chỉ có số này một lần.")
    thieu = (mo_rong.get("bieu_do") or {}).get("so_thieu") or []
    if thieu:
        doan.append(f"Biểu đồ ngày sinh của bạn có {9 - len(thieu)}/9 số, thiếu {', '.join(map(str, thieu))} — những nét "
                    "bạn thường phải chủ động rèn thay vì có sẵn.")
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    if lh and nc:
        doan.append(f"Bên trong bạn thuộc nhóm {lh[1]['ten']}, người khác nhìn thấy trước nhóm {nc[1]['ten']}"
                    + (" — trong ngoài cùng một nhịp; chương \"Bên trong & bên ngoài\" đọc điểm mạnh và chỗ dễ bị lạm dụng "
                       "của nhịp này." if lh[0] == nc[0] else
                       " — chỗ lệch này giải thích vì sao bạn đôi khi bị hiểu khác với con người thật; chương \"Bên trong "
                       "& bên ngoài\" đọc kỹ điều đó."))
    tc = _then_chot(_thang_toi(ngay, thang, ngay_xem))
    so_then_chot = len({(x["thang"], x["nam"]) for v in tc.values() for x in v})
    hien, _, _ = _giai_doan(ngay, thang, nam, ngay_xem.year, quy_uoc)
    doan.append(f"Trong 12 tháng tới có {so_then_chot} tháng then chốt được đánh dấu riêng cho bạn, và giai đoạn đời hiện tại "
                f"({hien['dinh']}/4) " + (f"kéo dài tới năm {hien['den_nam']}." if hien.get("den_nam") else "là giai đoạn cuối, kéo dài suốt phần đời sau.")
                + " Hai chương \"12 tháng tới\" và \"Sự nghiệp & tiền bạc\" đọc chi tiết.")
    return doan


# ------------------------------------------------------------------ chương 2
def _nghich_ly(so: dict, mo_rong: dict) -> list[str]:
    doan = []
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    if lh and nc:
        cn = _cau_noi(lh[0], nc[0])
        doan.append(f"Bên trong (Linh hồn {so['linh_hon']}, nhóm {lh[1]['ten']}{_cai(so['linh_hon'])}) bạn muốn {lh[1]['muon']}. "
                    f"Người khác thấy trước (Nhân cách {so['nhan_cach']}, nhóm {nc[1]['ten']}{_cai(so['nhan_cach'])}) một "
                    f"người {nc[1]['bieu_hien']}.")
        if lh[0] != nc[0]:
            doan.append(f"{cn['ten']}: {cn['doc']} Vì vậy bạn dễ bị hiểu là {nc[1]['bi_hieu_lam']} — trong khi điều bạn "
                        f"thật sự cần là {lh[1]['can']}.")
        else:
            doan.append(f"{cn['ten']}: {cn['doc']} Khi nhịp này quá đà, người khác có thể thấy bạn {nc[1]['bi_hieu_lam']} — "
                        f"điều bạn cần giữ là {lh[1]['can']}.")
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
    for m in (mo_rong.get("bieu_do") or {}).get("mui_ten", []):
        if m.get("y_nghia"):
            doan.append(f"{m['ten']}: {m['y_nghia']}" + (f" Gợi ý: {m['goi_y']}" if m.get("goi_y") else ""))
    theo_so: dict[int, dict] = {}
    for n in mo_rong.get("no_nghiep") or []:
        if n.get("nghia"):
            theo_so.setdefault(n["so"], {"nghia": n["nghia"], "o": []})["o"].append(TEN_VT.get(n.get("vi_tri"), n.get("vi_tri")))
    for s_, v in theo_so.items():
        doan.append(f"Nợ nghiệp {s_} — ở {', '.join(v['o'])}: {v['nghia'].get('y_nghia', '')}"
                    + (f" Gợi ý: {v['nghia']['goi_y']}" if v["nghia"].get("goi_y") else ""))
    return doan or ["Bộ số của bạn chưa đủ (họ tên chưa có chữ cái) để đọc chỗ lệch giữa bên trong và bên ngoài."]


# ------------------------------------------------------------------ chương 3
def _muoi_hai_thang(ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str) -> list[str]:
    van = kb.ban_do()
    y = ngay_xem.year
    ncn = int(tinh.nam_ca_nhan(ngay, thang, y, "duong_lich"))
    n = store.nghia_nam_ca_nhan(ncn) or {}
    doan = [f"Năm cá nhân {ncn} ({y}) — {n.get('chu_de', '')}. {van['nam_doc_thang'][str(ncn)]}"]
    thang_ds = _thang_toi(ngay, thang, ngay_xem)
    if any(t["nam"] > y for t in thang_ds):
        ncn2 = int(tinh.nam_ca_nhan(ngay, thang, y + 1, "duong_lich"))
        n2 = store.nghia_nam_ca_nhan(ncn2) or {}
        doan.append(f"Từ tháng 1/{y + 1}: năm cá nhân {ncn2} — {n2.get('chu_de', '')}. {van['nam_doc_thang'][str(ncn2)]}")
    tc = _then_chot(thang_ds)
    for k in NHOM_THEN_CHOT:
        for t in tc[k]:
            ghi = ""
            if t["nam_ca_nhan"] == 9 and k in ("khoi_su", "doi_viec"):
                ghi = f" Vì đang trong năm khép lại, hợp để chuẩn bị — cam kết lớn để từ 1/{t['nam'] + 1}."
            elif t["nam_ca_nhan"] == 1 and k == "khep_lai":
                ghi = " Trong năm mở đầu, đây là dọn chỗ cho việc mới."
            doan.append(f"Tháng then chốt — {van['nhom_viec'][k].lower()}: {t['thang']}/{t['nam']} (tháng cá nhân {t['so']}, "
                        f"{t['nhan'].lower()}): {', '.join(t['hop_de'])}.{ghi}")
    doan.append("Nhịp từng tháng: " + "; ".join(f"{t['thang']}/{t['nam']} · {t['so']} {t['nhan']}" for t in thang_ds) + ".")
    if any(t["thang"] == 1 for t in thang_ds[1:]):
        doan.append(van["ghi_chu_thang_1"])
    hien, _, dd = _giai_doan(ngay, thang, nam, y, quy_uoc)
    nd = store.nghia_dinh_cao(hien["so"]) or {}
    doan.append(f"Bạn đang ở giai đoạn {hien['dinh']}/4 của đời (tuổi {_tuoi(hien)}, số {hien['so']}): {nd.get('chu_de', '')}. "
                f"{nd.get('y_nghia', '')}")
    moc: dict[int, list[str]] = {}
    for b in dd["buoc_ngoat"]:
        if b["nam"] > y:
            moc.setdefault(b["nam"], []).append(TEN_MOC.get(b["loai"], b["loai"]))
    tiep = sorted(moc.items())[:2]
    if tiep:
        doan.append("Mốc sắp tới: " + "; ".join(f"năm {nm} (tuổi {nm - nam}) {' và '.join(ds)}" for nm, ds in tiep) + ".")
    doan.append("Đây là nhịp gợi ý để sắp việc, không phải dự báo điều sẽ xảy ra.")
    return doan


# ------------------------------------------------------------------ chương 4
def _su_nghiep(so: dict, ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str) -> list[str]:
    doan = []
    cv = ((kb.chan_dung(so["duong_doi"]) or {}).get("cong_viec")) or {}
    sm, nc = so.get("su_menh"), so.get("nhan_cach")
    cs = ((kb.chan_dung(sm) or {}).get("cong_viec")) if sm else None
    nhom_nc = _nhom(nc) if nc else None
    if cv:
        cong_thuc = f"Công thức nghề của bạn: Đường đời {so['duong_doi']} cho thế mạnh {cv['the_manh'].rstrip('.').lower()}"
        if cs:
            cong_thuc += f"; Sứ mệnh {sm} là đích bạn hướng tới — vai trò {cs['vai_tro'].rstrip('.').lower()}"
        if nhom_nc:
            cong_thuc += f"; ở chỗ làm, người khác thấy trước một người {nhom_nc[1]['bieu_hien']} (Nhân cách {nc})"
        doan.append(cong_thuc + ".")
        if cs and _nhom(so["duong_doi"]) and _nhom(sm) and _nhom(so["duong_doi"])[0] != _nhom(sm)[0]:
            doan.append(f"Đường đời và Sứ mệnh của bạn khác nhóm, nên việc hợp nhất thường là việc dùng được cả hai: thế mạnh "
                        f"hằng ngày của số {so['duong_doi']} để đi tới vai trò của số {sm} ({cs['the_manh'].rstrip('.').lower()}).")
        doan.append(f"Bẫy hay mắc: {cv['cai_bay']}")
        thang_tien = [t for t in _thang_toi(ngay, thang, ngay_xem) if "tien_bac" in t["nhom"]][:2]
        doan.append(f"Tiền bạc: {cv['tien_bac']}" + (f" Tháng hợp bàn chuyện tiền, lương trong 12 tháng tới: "
                                                    f"{', '.join(_mm(t) for t in thang_tien)}."
                                                    if thang_tien else ""))
    hien, ke, _ = _giai_doan(ngay, thang, nam, ngay_xem.year, quy_uoc)
    nd = store.nghia_dinh_cao(hien["so"]) or {}
    tt = store.nghia_thu_thach(hien["thu_thach"]) or {}
    doan.append(f"Giai đoạn hiện tại {hien['dinh']}/4 (tuổi {_tuoi(hien)}" + (f", tới năm {hien['den_nam']}" if hien.get("den_nam") else "")
                + f"), số {hien['so']} — {nd.get('chu_de', '')}: {nd.get('y_nghia', '')}"
                + (f" Thử thách đi kèm (số {hien['thu_thach']}): {tt.get('mo_ta', '')} — {tt.get('cach_vuot', '')}" if tt else ""))
    if ke:
        nk = store.nghia_dinh_cao(ke["so"]) or {}
        doan.append(f"Từ năm {ke['tu_nam']} (tuổi {ke['tu_tuoi']}): giai đoạn {ke['dinh']}, số {ke['so']} — {nk.get('chu_de', '')}. "
                    f"{nk.get('y_nghia', '')}")
    return doan


def _moi_xem_rieng(ma: str, doan: list[str], diem_nhan: str, cau_hoi: str) -> dict:
    chu = sum(len(d.split()) for d in doan)
    return {"diem_nhan": diem_nhan, "cau_hoi": cau_hoi, "so_doan": len(doan), "phut_doc": max(1, round(chu / 200))}


def bao_cao(ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str = "tong_het") -> dict:
    so = tinh.chi_so_xac_dinh(ho_ten[0], ngay, thang, nam, quy_uoc)
    mo_rong = lg.luan_mo_rong(ho_ten[0], ngay, thang, nam, quy_uoc=quy_uoc)
    noi_dung = {
        "tong_quan": _tong_quan(so, ngay, thang, nam, ngay_xem, quy_uoc, mo_rong),
        "nghich_ly": _nghich_ly(so, mo_rong),
        "muoi_hai_thang": _muoi_hai_thang(ngay, thang, nam, ngay_xem, quy_uoc),
        "su_nghiep": _su_nghiep(so, ngay, thang, nam, ngay_xem, quy_uoc),
    }
    # Lời mời chương khoá: một dữ kiện RIÊNG của chương mà người đọc chưa thấy ở phần miễn phí (không lộ nội dung).
    lh, nc = so.get("linh_hon"), so.get("nhan_cach")
    ncn = int(tinh.nam_ca_nhan(ngay, thang, ngay_xem.year, "duong_lich"))
    tc = _then_chot(_thang_toi(ngay, thang, ngay_xem))
    hien, ke, _ = _giai_doan(ngay, thang, nam, ngay_xem.year, quy_uoc)
    moi = {
        "nghich_ly": ((f"Linh hồn {lh} × Nhân cách {nc}: có một chỗ người khác hay hiểu sai về bạn, và một câu nói giúp họ hiểu đúng."
                       if lh and nc else "Chỗ lệch giữa con đường và đích đến của bạn."),
                      "Người khác đang thấy bạn khác con người thật ở điểm nào?"),
        "muoi_hai_thang": (f"Năm cá nhân {ncn}: {sum(len(v) for v in tc.values())} tháng then chốt — tháng nào để khởi sự, đổi việc, "
                           "bàn chuyện tiền.", f"Trong năm cá nhân {ncn} này, nên dồn sức vào tháng nào?"),
        "su_nghiep": ((f"Giai đoạn {hien['dinh']}/4 của bạn kéo dài tới năm {hien['den_nam']} — điều gì đổi ở giai đoạn {ke['dinh']}?"
                       if ke and hien.get("den_nam") else f"Giai đoạn {hien['dinh']}/4 của bạn và thử thách đi kèm."),
                      "Kiểu việc nào dùng được cả thế mạnh hằng ngày lẫn đích bạn hướng tới?"),
    }
    them = _khuon(so, ngay, thang, nam, ngay_xem, quy_uoc, mo_rong, tc, hien, ke)
    chuong = []
    for ma, doan in noi_dung.items():
        dn, ch = moi.get(ma, (doan[0], "Bộ số của bạn hiếm cỡ nào, và con số nào đậm nhất ở bạn?"))
        x = them.get(ma, {})
        chuong.append(kh.chuong(ma, TIEU_DE[ma], doan, hop=x.get("hop"), tom_tat=x.get("tom_tat"), can_cu=x.get("can_cu"),
                                cau_tu_soi=x.get("cau_tu_soi"), moi_xem=_moi_xem_rieng(ma, doan, dn, ch)))
    meta = kb.meta_ban_do()
    return {"mo_dun": "thanso", "phien_ban": kh.PHIEN_BAN, "phai": "pitago", "cot_loi": kh.chon_cot_loi(chuong[:1]),
            "chuong": chuong, "ket": hoi_van.KET, "dien_dat": "mau", "quy_uoc_duong_doi": quy_uoc,
            "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
            "trang_thai": meta["trang_thai"]}


# ------------------------------------------------------------------ KC-1: khuôn đời sống (hộp · tóm tắt · căn cứ · tự soi)
def _khuon(so: dict, ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str, mo_rong: dict,
           tc: dict, hien: dict, ke: dict | None) -> dict[str, dict]:
    t = tl.ty_le(ngay, thang, nam, quy_uoc)
    d = t["duong_doi"]
    nghia_dd = store.nghia_so(d["so"]) or {}
    bo = {**{v: so.get(v) for v in lg.VI_TRI_THU_TU}, "ngay_sinh": mr.so_ngay_sinh(ngay)}
    dem: dict[int, list[str]] = {}
    for vt, s_ in bo.items():
        if s_:
            dem.setdefault(s_, []).append(TEN_VT[vt])
    lap = [(s_, noi) for s_, noi in sorted(dem.items(), key=lambda x: -len(x[1])) if len(noi) >= 2]
    thieu = (mo_rong.get("bieu_do") or {}).get("so_thieu") or []
    so_then_chot = len({(x["thang"], x["nam"]) for v in tc.values() for x in v})
    ra: dict[str, dict] = {}

    # chương 1
    hop = [kh.hop("cot_loi", f"Đường đời {d['so']} — {nghia_dd.get('tu_khoa', '')}".rstrip(" —"),
                  f"{_pt(d['ty_le'])} số ngày trong lịch cho ra con số này" + (" (số cái, nét đậm và đòi hỏi nhiều ở chính bạn)" if d["so"] in (11, 22, 33) else "") + ".",
                  ma=kh.ma_mau("thanso", "tong_quan", "duong_doi", str(d["so"])))]
    for s_, noi in lap[:1]:
        hop.append(kh.hop("diem_manh", f"Số {s_} lặp {len(noi)} lần", f"Ở {', '.join(noi)} — nét {(store.nghia_so(s_) or {}).get('tu_khoa', '').lower()} đậm hơn người chỉ có số này một lần.",
                          ma=kh.ma_mau("thanso", "tong_quan", "lap", str(s_))))
    if thieu:
        hop.append(kh.hop("luu_y", f"Biểu đồ thiếu {', '.join(map(str, thieu))}", "Những nét này bạn thường phải chủ động rèn thay vì có sẵn.",
                          huong_xu_ly="Chọn một thói quen nhỏ cho mỗi số thiếu, làm đều hơn là làm nhiều.",
                          ma=kh.ma_mau("thanso", "tong_quan", "thieu", "-".join(map(str, thieu)))))
    hop.append(kh.hop("thoi_diem", "Nhịp sắp tới", f"{so_then_chot} tháng then chốt trong 12 tháng tới; giai đoạn đời hiện tại {hien['dinh']}/4"
                      + (f" kéo dài tới năm {hien['den_nam']}." if hien.get("den_nam") else " là giai đoạn cuối."),
                      ma=kh.ma_mau("thanso", "tong_quan", "nhip", str(hien["dinh"]))))
    ra["tong_quan"] = {"hop": hop, "tom_tat": f"Đường đời {d['so']}" + (f", số {lap[0][0]} lặp {len(lap[0][1])} lần" if lap else "") + f"; {so_then_chot} tháng then chốt sắp tới.",
                       "can_cu": [f"Tỉ lệ tính trên mẫu mọi ngày trong lịch {t['mau']} (không phải thống kê dân số); cách cộng Đường đời: {quy_uoc}.",
                                  "Bộ số: " + ", ".join(f"{TEN_VT[v]} {bo[v]}" for v in bo if bo[v]) + "."],
                       "cau_tu_soi": "Con số nào trong bộ số bạn thấy giống mình nhất ngay lần đọc đầu?"}

    # chương 2
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    dd_, sm = _nhom(so.get("duong_doi") or 0), _nhom(so.get("su_menh") or 0)
    hop, can_cu = [], []
    if lh and nc:
        cn = _cau_noi(lh[0], nc[0])
        hop.append(kh.hop("cot_loi", f"Bên trong {lh[1]['ten']} · bên ngoài {nc[1]['ten']}", f"Bạn muốn {lh[1]['muon']}; người khác thấy trước một người {nc[1]['bieu_hien']}.",
                          ma=kh.ma_mau("thanso", "nghich_ly", "lh_nc", f"{so['linh_hon']}-{so['nhan_cach']}")))
        hop.append(kh.hop("luu_y", "Dễ bị hiểu là", f"{_dau(nc[1]['bi_hieu_lam'])} — trong khi điều bạn cần là {lh[1]['can']}.",
                          huong_xu_ly=cn.get("cach_noi_ro"), ma=kh.ma_mau("thanso", "nghich_ly", "hieu_lam", str(so["nhan_cach"]))))
        if cn.get("khi_hoa"):
            hop.append(kh.hop("loi_khuyen", "Khi hai phía hoà vào nhau", cn["khi_hoa"], ma=kh.ma_mau("thanso", "nghich_ly", "hoa", f"{lh[0]}-{nc[0]}")))
        can_cu.append(f"Linh hồn {so['linh_hon']} (nhóm {lh[1]['ten']}) × Nhân cách {so['nhan_cach']} (nhóm {nc[1]['ten']}): {cn['ten']}.")
    if dd_ and sm:
        if dd_[0] == sm[0]:
            hop.append(kh.hop("diem_manh", "Đường đi và nơi hướng tới cùng nhóm", f"Đường đời {so['duong_doi']} và Sứ mệnh {so['su_menh']} cùng nhóm {dd_[1]['ten']} — điều cần giữ là {dd_[1]['can']}.",
                              ma=kh.ma_mau("thanso", "nghich_ly", "dd_sm", "cung")))
        else:
            cn2 = _cau_noi(dd_[0], sm[0])
            hop.append(kh.hop("loi_khuyen", "Đường đi khác nơi hướng tới", f"{cn2['ten']}: {cn2['doc']}", ma=kh.ma_mau("thanso", "nghich_ly", "dd_sm", "khac")))
        can_cu.append(f"Đường đời {so['duong_doi']} (nhóm {dd_[1]['ten']}) ↔ Sứ mệnh {so['su_menh']} (nhóm {sm[1]['ten']}).")
    ra["nghich_ly"] = {"hop": hop, "tom_tat": (f"Bên trong {lh[1]['ten'].lower()}, bên ngoài {nc[1]['ten'].lower()}." if lh and nc else "Bộ số chưa đủ để đọc chỗ lệch."),
                       "can_cu": can_cu, "cau_tu_soi": "Người khác đang thấy bạn khác con người thật ở điểm nào?"}

    # chương 3
    van = kb.ban_do()
    y = ngay_xem.year
    ncn = int(tinh.nam_ca_nhan(ngay, thang, y, "duong_lich"))
    n_ncn = store.nghia_nam_ca_nhan(ncn) or {}
    hop = [kh.hop("cot_loi", f"Năm cá nhân {ncn}", f"{n_ncn.get('chu_de', '')}. {van['nam_doc_thang'][str(ncn)]}".strip(". ") + ".",
                  ma=kh.ma_mau("thanso", "muoi_hai_thang", "nam", str(ncn)))]
    for k in ("khoi_su", "tien_bac", "quan_he"):
        for t_ in tc.get(k, [])[:1]:
            hop.append(kh.hop("thoi_diem", f"{van['nhom_viec'][k]}: {_mm(t_)}", f"Tháng cá nhân {t_['so']} ({t_['nhan'].lower()}): {', '.join(t_['hop_de'])}.",
                              muc="thuan", ma=kh.ma_mau("thanso", "muoi_hai_thang", k, str(t_["so"]))))
    ra["muoi_hai_thang"] = {"hop": hop, "tom_tat": f"Năm cá nhân {ncn}; {so_then_chot} tháng then chốt được đánh dấu riêng.",
                            "can_cu": ["Tháng cá nhân = năm cá nhân + tháng dương, rút gọn; năm cá nhân đổi từ 1/1 dương lịch (mốc trang đọc đang dùng)."],
                            "cau_tu_soi": "Trong năm cá nhân này, bạn định dồn sức vào tháng nào?"}

    # chương 4
    cv = ((kb.chan_dung(so["duong_doi"]) or {}).get("cong_viec")) or {}
    nd = store.nghia_dinh_cao(hien["so"]) or {}
    hop = []
    if cv:
        hop.append(kh.hop("cot_loi", f"Thế mạnh ở chỗ làm (Đường đời {so['duong_doi']})", f"{_dau(cv.get('the_manh'))}.", ma=kh.ma_mau("thanso", "su_nghiep", "manh", str(so["duong_doi"]))))
        if cv.get("cai_bay"):
            hop.append(kh.hop("luu_y", "Bẫy hay mắc", f"{_dau(cv['cai_bay'])}.", huong_xu_ly="Đặt một người hoặc một quy tắc kiểm lại trước khi quyết việc lớn.",
                              ma=kh.ma_mau("thanso", "su_nghiep", "bay", str(so["duong_doi"]))))
        if cv.get("tien_bac"):
            hop.append(kh.hop("loi_khuyen", "Tiền bạc", f"{_dau(cv['tien_bac'])}.", ma=kh.ma_mau("thanso", "su_nghiep", "tien", str(so["duong_doi"]))))
    hop.append(kh.hop("thoi_diem", f"Giai đoạn {hien['dinh']}/4 (tuổi {_tuoi(hien)})", f"Số {hien['so']} — {nd.get('chu_de', '')}." + (f" Từ năm {ke['tu_nam']}: giai đoạn {ke['dinh']}." if ke else ""),
                      ma=kh.ma_mau("thanso", "su_nghiep", "giai_doan", str(hien["dinh"])), tu_tuoi=hien.get("tu_tuoi"), den_tuoi=hien.get("den_tuoi")))
    ra["su_nghiep"] = {"hop": hop, "tom_tat": (f"Thế mạnh {cv.get('the_manh', '').split(',')[0].lower()}; " if cv else "") + f"giai đoạn {hien['dinh']}/4.",
                       "can_cu": [f"Chân dung công việc theo Đường đời {so['duong_doi']}, Sứ mệnh {so.get('su_menh')}, Nhân cách {so.get('nhan_cach')}; giai đoạn đỉnh cao theo chu kỳ 9 năm."],
                       "cau_tu_soi": "Kiểu việc nào dùng được cả thế mạnh hằng ngày lẫn đích bạn hướng tới?"}
    return ra


def _dau(s: str | None) -> str:
    s = (s or "").strip().rstrip(".")
    return s[:1].upper() + s[1:] if s else ""
