# -*- coding: utf-8 -*-
"""KC-1 — Bát tự về khuôn `doi_song_1`: bổ sung hộp nổi bật, tóm tắt, "Vì sao nói vậy", câu tự soi cho 4 chương của
Luận giải toàn bộ Bát tự (`toan_bo.battu`). `doan` của từng chương vẫn là lời ghép từ hỏi đáp (giữ cho diễn đạt AI, SAO-2);
hộp dựng tất định từ `calc.battu.la_so` + KB `battu_kb`, không điểm số, không mức "xấu" (mức chương để trống — Bát tự
không có thang chấm như cung Tử vi)."""
from __future__ import annotations

import collections
import datetime as dt

from app.calc import battu as bt
from app.kb import battu_kb as kb
from app.luangiai import doi_song_khuon as kh

_MUA = {"Dần": "xuan", "Mão": "xuan", "Thìn": "xuan", "Tỵ": "ha", "Ngọ": "ha", "Mùi": "ha",
        "Thân": "thu", "Dậu": "thu", "Tuất": "thu", "Hợi": "dong", "Tý": "dong", "Sửu": "dong"}
_THAN = {"vượng": "thân vượng — sức tự thân khá, chịu được việc nặng, hợp có chỗ để tiêu bớt sức",
         "nhược": "thân nhược — sức tự thân mỏng, hợp có người và nguồn tiếp sức, không ôm quá nhiều việc một lúc",
         "trung hoà": "thân trung hoà — không nghiêng hẳn bên nào, tuỳ giai đoạn mà nương theo"}
_UU_TIEN_TT = ("Chính Quan", "Thất Sát", "Chính Tài", "Thiên Tài", "Thực Thần", "Thương Quan", "Chính Ấn", "Thiên Ấn",
               "Tỷ Kiên", "Kiếp Tài")


def _dem_tt(ls: dict) -> collections.Counter:
    c: collections.Counter = collections.Counter(t for t in ls["thap_than_can"] if t != "Nhật chủ")
    for ds in ls["thap_than_chi"]:
        if ds:
            c[ds[0]] += 1
    return c


def _dau(s: str | None) -> str:
    s = (s or "").strip().rstrip(".")
    return s[:1].upper() + s[1:] if s else ""


def _tong_quan(ls: dict) -> dict:
    nc = ls["nhat_chu"]
    n = kb.nhat_chu(nc["can"]) or {}
    mua = _MUA.get(ls["tru"][1]["chi"], "")
    y_mua = (n.get("mua") or {}).get(mua)
    mt = (n.get("mat_toi") or "").split(",")[0].strip()
    hop = [kh.hop("cot_loi", f"Nhật chủ {nc['can']} — {n.get('hinh_tuong', nc['ngu_hanh'])}",
                  f"{_dau(n.get('tinh_chat'))}.", ma=kh.ma_mau("battu", "tong_quan", "nhat_chu", nc["can"])),
           kh.hop("diem_manh", "Điểm mạnh sẵn có", f"{_dau(n.get('diem_manh'))}.", ma=kh.ma_mau("battu", "tong_quan", "manh", nc["can"])),
           kh.hop("luu_y", "Điều dễ vấp", f"{_dau(n.get('mat_toi'))}.",
                  huong_xu_ly=(f"Khi thấy mình đang {mt}, dừng một nhịp rồi hãy quyết." if mt else None),
                  ma=kh.ma_mau("battu", "tong_quan", "vap", nc["can"]))]
    can_cu = [f"Tứ trụ: {' · '.join(f'{t['can']} {t['chi']}' for t in ls['tru'])}. Nhật chủ {nc['can']} ({nc['am_duong']} {nc['ngu_hanh']}).",
              f"Sinh tháng {ls['tru'][1]['chi']} ({mua or 'theo tiết'}): {y_mua}" if y_mua else ""]
    return {"hop": hop, "tom_tat": f"Bạn là người {n.get('tinh_chat', '').lower()} — hình ảnh {n.get('hinh_tuong', '')}.",
            "can_cu": [c for c in can_cu if c], "cau_tu_soi": n.get("cau_tu_soi")}


def _ngu_hanh(ls: dict) -> dict:
    nh, than, dt_ = ls["ngu_hanh"], ls["than"], ls["dung_than"]
    thieu = nh.get("thieu") or []
    hop = [kh.hop("cot_loi", f"Sức tự thân: {than['ket_luan']}", f"{_dau(_THAN.get(than['ket_luan'], than['ket_luan']))}.",
                  ma=kh.ma_mau("battu", "ngu_hanh", "than", than["ket_luan"]))]
    pu, dh = dt_.get("phu_uc") or {}, dt_.get("dieu_hau") or {}
    if pu.get("hanh") or dh.get("hanh"):
        ud = [f"{h}: {(kb.ngu_hanh(h) or {}).get('ung_dung', '')}" for h in dict.fromkeys([*(pu.get("hanh") or []), *(dh.get("hanh") or [])])]
        hop.append(kh.hop("loi_khuyen", "Hành nên nương theo (hai cách tính)",
                          f"Theo phù ức: {', '.join(pu.get('hanh') or []) or '—'} ({pu.get('giai_thich', '')}). Theo điều hậu: "
                          f"{', '.join(dh.get('hanh') or []) or '—'} ({dh.get('giai_thich', '')}). Hệ thống trình bày cả hai, không chọn thay bạn.",
                          huong_xu_ly="Ứng dụng dân gian (màu, hướng, nhóm nghề): " + "; ".join(ud) + ".",
                          ma=kh.ma_mau("battu", "ngu_hanh", "dung_than", *(pu.get("hanh") or ["-"]))))
    for h in thieu[:2]:
        k = kb.ngu_hanh(h) or {}
        hop.append(kh.hop("luu_y", f"Thiếu hành {h}", f"{_dau(k.get('khi_thieu'))}.",
                          huong_xu_ly=f"Bù bằng thói quen và môi trường: {k.get('ung_dung', '')}." if k.get("ung_dung") else None,
                          ma=kh.ma_mau("battu", "ngu_hanh", "thieu", h)))
    nn = nh.get("nhieu_nhat")
    if nn:
        k = kb.ngu_hanh(nn) or {}
        hop.append(kh.hop("diem_manh", f"Hành đậm nhất: {nn}", f"{_dau(k.get('tinh_chat'))}. Khi quá đà: {k.get('khi_thua', '').split(':')[-1].strip()}.",
                          ma=kh.ma_mau("battu", "ngu_hanh", "nhieu", nn)))
    diem = ", ".join(f"{h} {v}" for h, v in nh["diem"].items())
    cc = dt_.get("cach_cuc") or {}
    can_cu = [f"Điểm ngũ hành: {diem}; tỉ lệ thân {than['ti_le']} → {than['ket_luan']}. {than.get('thang_diem', '')}",
              f"Cách cục (Tử Bình Chân Thuyên): {cc.get('ten', '—')}, can lập cách {cc.get('can_lap_cach', '—')}, nguồn khí {cc.get('nguon_khi', '—')}." if cc else ""]
    return {"hop": hop, "tom_tat": f"Thân {than['ket_luan']}; hành đậm nhất {nn}" + (f", thiếu {', '.join(thieu)}" if thieu else "") + ".",
            "can_cu": [c for c in can_cu if c], "cau_tu_soi": "Việc nào bạn làm mà thấy được tiếp sức, việc nào làm xong là cạn? Hai danh sách đó nói về hành bạn đang thiếu."}


def _su_nghiep(ls: dict, gioi_tinh: str | None) -> dict:
    dem = _dem_tt(ls)
    cc = (ls.get("dung_than") or {}).get("cach_cuc") or {}
    tb = kb.cach_cuc_tbct(cc.get("ma", "")) if cc.get("ma") else None
    hop = []
    if cc.get("ten"):
        hop.append(kh.hop("cot_loi", f"Cách cục: {cc['ten']}", f"{_dau((tb or {}).get('y')) or cc['ten']}.",
                          ma=kh.ma_mau("battu", "su_nghiep", "cach", cc.get("ma", ""))))
    nhieu = sorted(dem.items(), key=lambda kv: (-kv[1], _UU_TIEN_TT.index(kv[0]) if kv[0] in _UU_TIEN_TT else 99))
    for ten, so in nhieu[:2]:
        k = kb.thap_than(ten) or {}
        hop.append(kh.hop("diem_manh", f"{ten} nổi ({so} lần)", f"{_dau(k.get('tinh_cach'))}. {k.get('y_nghia', '')}",
                          ma=kh.ma_mau("battu", "su_nghiep", "tt", ten)))
        if k.get("khi_nhieu") and so >= 2:
            hop.append(kh.hop("luu_y", f"{ten} nhiều quá thì", f"{_dau(k.get('khi_nhieu'))}.",
                              huong_xu_ly=f"Đặt một quy tắc hoặc một người kiểm lại trước khi quyết việc lớn về {k.get('nam' if gioi_tinh != 'nu' else 'nu', 'việc này').split(',')[0]}.",
                              ma=kh.ma_mau("battu", "su_nghiep", "nhieu", ten)))
    if tb and tb.get("hy"):
        hop.append(kh.hop("loi_khuyen", "Thế nào thì cách này 'thành'", f"{_dau(tb['hy'])}." + (f" Dễ 'bại' khi: {tb.get('ky', '')}" if tb.get("ky") else ""),
                          ma=kh.ma_mau("battu", "su_nghiep", "hy", cc.get("ma", ""))))
    thieu = [t for t in ("Chính Tài", "Thiên Tài", "Chính Quan", "Thất Sát", "Thực Thần", "Thương Quan") if dem.get(t, 0) == 0]
    can_cu = [f"Thập thần ở can: {', '.join(ls['thap_than_can'])}; bản khí địa chi: {', '.join(d[0] for d in ls['thap_than_chi'] if d)}.",
              f"Không lộ ở can và bản khí: {', '.join(thieu)} — cần xét tàng can và đại vận." if thieu else ""]
    return {"hop": hop, "tom_tat": (f"Cách cục {cc['ten']}" if cc.get("ten") else "Thập thần") + (f"; nổi nhất {nhieu[0][0]}." if nhieu else "."),
            "can_cu": [c for c in can_cu if c], "cau_tu_soi": (kb.thap_than(nhieu[0][0]) or {}).get("cau_tu_soi") if nhieu else None}


def _van(ls: dict, nam_xem: int) -> dict:
    dm = ls["nhat_chu"]["can"]
    dv = bt.dai_van_tai(ls, nam_xem)
    ln = bt.luu_nien(ls, nam_xem)
    hop = []
    if dv:
        tt = bt.thap_than(dm, dv["can"])
        k = kb.thap_than(tt) or {}
        hop.append(kh.hop("thoi_diem", f"Đại vận {dv['can']} {dv['chi']} ({dv['tu_nam']}–{dv['den_nam']})",
                          f"Chủ đề mười năm này là {tt} ({k.get('nhom', '')}): {k.get('y_nghia', '')} {k.get('tinh_cach', '')}.".replace("..", "."),
                          ma=kh.ma_mau("battu", "van", "dai_van", tt), tu=f"{dv['tu_nam']}-01-01", den=f"{dv['den_nam']}-12-31"))
    k2 = kb.thap_than(ln["thap_than"]) or {}
    hop.append(kh.hop("thoi_diem", f"Năm {nam_xem} ({ln['can']} {ln['chi']})",
                      f"Can năm là {ln['thap_than']} với nhật chủ: {k2.get('y_nghia', '')} Với trụ ngày: {ln['voi_tru_ngay']}.",
                      ma=kh.ma_mau("battu", "van", "luu_nien", ln["thap_than"]), tu=f"{nam_xem}-01-01", den=f"{nam_xem}-12-31"))
    hop.append(kh.hop("loi_khuyen", "Đọc vận thế nào cho đúng", kb.luu_y("van") or "Đại vận và lưu niên là chủ đề giai đoạn, không phải biến cố định sẵn."))
    kv = ls["dai_van"]["khoi_van"]
    can_cu = [f"Khởi vận lúc {kv['nam']} tuổi {kv['thang']} tháng (ngày {ls['dai_van']['ngay_khoi']}), đại vận đi {'thuận' if ls['dai_van']['thuan'] else 'nghịch'}.",
              "Thập thần của đại vận và lưu niên tính từ can của vận/năm so với nhật chủ."]
    return {"hop": hop, "tom_tat": (f"Đại vận {dv['can']} {dv['chi']} ({dv['tu_nam']}–{dv['den_nam']}); " if dv else "") + f"năm {nam_xem}: {ln['thap_than']}.",
            "can_cu": can_cu, "cau_tu_soi": "Mười năm này bạn đang xây gì — và năm nay là năm gieo hay năm gặt của việc đó?"}


def bo_sung(bc: dict, sinh: dict, ngay_xem: dt.date | None = None) -> dict:
    """Thêm khuôn đời sống vào báo cáo `toan_bo.battu` (giữ nguyên `doan`, `moi_xem`, các trường cũ)."""
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    ls = bt.la_so(sinh.get("lich") or sinh["ngay"], sinh["gioi_tinh"], sinh.get("gio_ty", "da_ty"))
    them = {"tong_quan": _tong_quan(ls), "ngu_hanh": _ngu_hanh(ls), "su_nghiep": _su_nghiep(ls, sinh.get("gioi_tinh")),
            "van": _van(ls, ngay_xem.year)}
    chuong = []
    for c in bc["chuong"]:
        x = them.get(c["ma"], {})
        chuong.append({**c, "hop": x.get("hop", []), "can_cu": x.get("can_cu", []),
                       **{k: x[k] for k in ("tom_tat", "cau_tu_soi") if x.get(k)}})
    return {**bc, "phien_ban": kh.PHIEN_BAN, "chuong": chuong, "cot_loi": kh.chon_cot_loi(chuong), "phai": "tu_binh"}
