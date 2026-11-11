# -*- coding: utf-8 -*-
"""CD-1 — RULES "Chân dung tổng hợp": ba cách nhìn (Tử vi · Bát tự · Nhân tướng) cùng một con người, theo MẢNG ĐỜI.

Phương án chọn (docs/CHAN-DUNG-TONG-HOP.md — so với "đồ thị nét người liên môn" và "trục ngũ hành"): chỉ ĐỌC mức mà ba
báo cáo đời sống đã chấm (`tuvi_doi_song.lap`, `battu_doi_song.lap`, `nhan_tuong.bao_cao` — một bộ tính), xếp thành
ma trận mảng × môn, ghép hộp "cùng thấy / nhìn khác nhau" (khuôn `nhat_quan` mở rộng từ năm sang mảng) và MƯỢN nguyên
hộp của từng môn — giữ mã kiểm chứng gốc để phiếu "Đúng với mình" về đúng môn đã nói câu ấy. Không tính lại, không điểm
số, không đổi mức môn nào, không phán môn nào đúng. Lời ở KB `chan_dung_kb.json` (nháp ban biên tập).
Chương 1 (ma trận + điều các cách cùng thấy) miễn phí; các chương sau mở bằng Sao ở tầng web (mô-đun `chan_dung`).
Ý2 (2026-11-09): chương "Điều bạn đã xác nhận" (`da_xac_nhan`) dựng từ phiếu `ca_nhan` của CHÍNH người xem (mã hộp đã bấm
"Đúng / Chưa đúng", đọc qua RLS) bằng lớp giao thoa `luangiai/giao_thoa` — báo cáo trả Sao cá nhân hơn theo thời gian dùng.
Ý4: hộp "nhìn khác nhau" nói thật hơn khi thống kê lá số mẫu (`dong_thuan_thong_ke`) cho thấy mảng ấy hai lá số hiếm khi trùng.
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

from app import config
from app.calc import lunar
from app.luangiai import doi_song_khuon as kh
from app.kb import nap
from app.luangiai import dong_thuan_thong_ke as dtk
from app.luangiai import giao_thoa as gt

MO_DUN = "chan_dung"
PHAI_BA_MON = "tuvi_battu_nhantuong"
PHAI = {"tuvi": "nam_phai_viet", "battu": "tu_binh", "nhantuong": "nhan_tuong_tong_hop", "ba_mon": PHAI_BA_MON,
        "hai_la_so": "tuvi_battu", "giao_thoa": gt.PHAI}
MON = ("tuvi", "battu", "nhantuong")
THU_TU_CHUONG = ["tong_quan", "con_nguoi", "cong_viec_tien", "tinh_cam_gia_dinh", "suc_khoe", "nang_luong", "nam_nay", "da_xac_nhan", "loi_khuyen"]
TOI_THIEU_XAC_NHAN = 2      # Ý2: cần ≥ 2 hộp "Đúng với mình" mới dệt được điểm giao thoa (như giao_thoa.lap)
MANG_CO_MUC = ["cong_viec", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe", "nam_nay"]
# mảng → chương của từng môn mà mức được ĐỌC từ đó (Nhân tướng gộp việc + tiền, tình cảm + gia đình trong một chương)
CHUONG_MON: dict[str, dict[str, str]] = {
    "cong_viec": {"tuvi": "su_nghiep", "battu": "su_nghiep", "nhantuong": "cong_viec_tien"},
    "tien_bac": {"tuvi": "tien_bac", "battu": "tien_bac", "nhantuong": "cong_viec_tien"},
    "tinh_cam": {"tuvi": "tinh_cam", "battu": "tinh_cam", "nhantuong": "tinh_cam_gia_dinh"},
    "gia_dinh": {"tuvi": "gia_dinh", "battu": "gia_dinh", "nhantuong": "tinh_cam_gia_dinh"},
    "suc_khoe": {"tuvi": "suc_khoe", "battu": "suc_khoe", "nhantuong": "suc_khoe"},
    "nam_nay": {"tuvi": "nam_nay", "battu": "nam_nay", "nhantuong": "nam_nay"},
}
MANG_CUA_CHUONG = {"cong_viec_tien": ["cong_viec", "tien_bac"], "tinh_cam_gia_dinh": ["tinh_cam", "gia_dinh"], "suc_khoe": ["suc_khoe"]}
TOI_DA_LOI_KHUYEN = 5
TOI_DA_COT_LOI = 3
_THU_TU_MUC = ("can_chu_dong", "can_bang", "thuan")
_LOAI = {"thuan": "diem_manh", "can_bang": "loi_khuyen", "can_chu_dong": "luu_y"}
_MA_NGAN = {"thuan": "t", "can_bang": "b", "can_chu_dong": "c", None: "x"}
_KB = Path(__file__).parents[1] / "kb" / "data" / "chan_dung_kb.json"
_TZ = config.TZ_LICH_AM["viet"]


@nap.nho
def kb() -> dict:
    return nap.doc(_KB.name)


def _ten(mon: str) -> str:
    return kb()["mon"][mon]["ten"]


def _noi(mons: list[str]) -> str:
    ten = [_ten(m) for m in mons]
    return ten[0] if len(ten) == 1 else ", ".join(ten[:-1]) + " và " + ten[-1]


def _gan(h: dict, nguon: str, **them) -> dict:
    """Hộp mượn / tổng hợp mang `nguon` + `phai` của môn; bỏ trường nội bộ và tham chiếu của bài gốc."""
    h = {k: v for k, v in h.items() if not k.startswith("_") and k not in ("tham_chieu", "tu_chuong", "loai_goc")}
    h.update({"nguon": nguon, "phai": h.get("phai") or PHAI[nguon], **them})
    return h


# ------------------------------------------------------------------ luật đồng thuận (thuần)
def dong_thuan(mang: str, muc: dict[str, str | None]) -> dict | None:
    """`muc` = {môn: mức chương của môn đó} — cần ≥ 2 môn có mức. Cùng mức → hộp "N cách xem cùng thấy" (mang mức);
    khác mức → hộp "nhìn khác nhau" (không gán mức chung, việc nên làm theo mức dè dặt nhất). Tất định theo thứ tự MON."""
    co = {m: muc.get(m) for m in MON if muc.get(m) in kh.NHAN_MUC}
    if len(co) < 2:
        return None
    k = kb()
    ten_mang, ngan = k["mang"][mang]["ten"], k["mang"][mang]["ngan"]
    noi = _noi(list(co))
    can_cu = [f"{_ten(m)}: {ten_mang.lower()} {kh.NHAN_MUC[v].lower()}" for m, v in co.items()]
    if len(set(co.values())) == 1:
        m = next(iter(co.values()))
        o = k["cung"][m]
        h = kh.hop(_LOAI[m], o["tieu_de"].format(mang=ten_mang, so=len(co)), o["noi_dung"].format(noi=noi, ngan=ngan),
                   huong_xu_ly=o["huong_xu_ly"].format(ngan=ngan), can_cu=can_cu, muc=m,
                   ma=kh.ma_mau(MO_DUN, mang, "cung", m, str(len(co))))
        return _gan(h, "ba_mon")
    thap = min(co.values(), key=_THU_TU_MUC.index)
    mat = "; ".join(f"{_ten(m)} ({k['mon'][m]['mat']}) thấy {kh.NHAN_MUC[v].lower()}" for m, v in co.items())
    o = k["khac"]
    noi_dung = o["noi_dung"].format(mat=mat)
    if len(co) == 3:
        dem = {v: [m for m, x in co.items() if x == v] for v in set(co.values())}
        da_so = next(((v, ms) for v, ms in dem.items() if len(ms) == 2), None)
        if da_so:
            v_ds, _ = da_so
            m_le, v_le = next((m, x) for m, x in co.items() if x != v_ds)
            noi_dung = o["da_so"].format(muc_da_so=kh.NHAN_MUC[v_ds].lower(), mon_le=_ten(m_le), muc_le=kh.NHAN_MUC[v_le].lower(),
                                         mat_le=k["mon"][m_le]["mat"]) + " " + noi_dung
    ma = "".join(_MA_NGAN[co.get(m)] for m in MON)
    # Ý4: hai lá số khác mức ở mảng mà trên lá số mẫu chúng hiếm khi trùng (kappa < 0,1) → nói thật là hai góc nhìn độc lập.
    # Chỉ thêm LỜI + căn cứ; mức, mã hộp, việc nên làm không đổi.
    tk = dtk.cua_mang(mang) if {"tuvi", "battu"} <= set(co) and co["tuvi"] != co["battu"] else None
    if tk and tk["kappa"] < dtk.KAPPA_THAP:
        noi_dung += " " + o["hiem_trung"].format(ngan=ngan, ti_le=round(tk["ti_le_cung"] * 100))
    if tk:
        can_cu.append(o["can_cu_thong_ke"].format(n=tk["n"], ti_le=round(tk["ti_le_cung"] * 100), ngau_nhien=round(tk["ngau_nhien"] * 100),
                                                  kappa=f"{tk['kappa']:.2f}".replace(".", ",")))
    h = kh.hop("loi_khuyen", o["tieu_de"].format(mang=ten_mang), noi_dung, huong_xu_ly=o["huong_xu_ly"][thap].format(ngan=ngan),
               can_cu=can_cu, ma=kh.ma_mau(MO_DUN, mang, "khac", ma))
    return _gan(h, "ba_mon")


# ------------------------------------------------------------------ đọc báo cáo từng môn
def _chuong(bc: dict | None, ma: str) -> dict | None:
    return next((c for c in bc["chuong"] if c["ma"] == ma), None) if bc else None


def _muc_mon(bc: dict | None, mon: str, mang: str) -> str | None:
    c = _chuong(bc, CHUONG_MON[mang][mon])
    if not c:
        return None
    if c.get("muc") in kh.NHAN_MUC:
        return c["muc"]
    if mang == "nam_nay":           # chương Năm nay của Nhân tướng không mang mức chương — đọc hộp thời điểm của vùng lưu niên
        return next((h.get("muc") for h in c.get("hop", []) if h.get("loai") == "thoi_diem" and h.get("muc") in kh.NHAN_MUC), None)
    return None


def _muon(bc: dict | None, ma_chuong: str, mon: str, uu_tien: str | None, da_dung: set[str], toi_da: int = 1,
          loc=None) -> list[dict]:
    """Mượn ≤ `toi_da` hộp của chương `ma_chuong` môn `mon` (ưu tiên loại `uu_tien`), mỗi mã chỉ dùng một lần trong cả bài."""
    c = _chuong(bc, ma_chuong)
    if not c:
        return []
    hop = [h for h in c.get("hop", []) if h.get("ma_mau") and h["ma_mau"] not in da_dung and not h.get("dang_xem_lai")
           and (h.get("tieu_de") or "").strip() and (loc is None or loc(h))]
    hop.sort(key=lambda h: (0 if uu_tien and h["loai"] == uu_tien else 1, 0 if h["loai"] != "thoi_diem" else 1))
    ra = []
    for h in hop[:toi_da]:
        da_dung.add(h["ma_mau"])
        ra.append(_gan(h, mon, nhan=str(kb()["mau"]["muon_hop"]).format(mon=_ten(mon))))
    return ra


def _dong_muc(mang: str, muc: dict[str, str | None]) -> str:
    ten = kb()["mang"][mang]["ten"]
    phan = [f"{_ten(m)}: {kh.NHAN_MUC[v] if v else 'chưa có'}" for m, v in muc.items()]
    return f"{ten} — " + " · ".join(phan) + "."


def _moi_xem(c: dict) -> dict:
    from app.luangiai.toan_bo import diem_nhan, so_chu_chuong  # noqa: PLC0415
    return {"diem_nhan": diem_nhan(c["doan"]), "cau_hoi": kb()["chuong"][c["ma"]]["cau_hoi"], "so_doan": len(c["doan"]),
            "phut_doc": max(1, round(so_chu_chuong(c) / 200))}


# ------------------------------------------------------------------ Ý2: chương từ phiếu của chính người xem
def _chuong_da_xac_nhan(ca_nhan: dict | None, da_dung: set[str]) -> dict:
    """Phiếu `ca_nhan` ({mã: dung|chua_dung}, do web đọc RLS của người đang xem) → `giao_thoa.lap` (ba luật A/B/C trên MÃ) → một
    chương khuôn `doi_song_1`. < 2 phiếu Đúng (hoặc khách) → chương chỉ có lời mời, không hộp. Hộp giữ `ma_mau` ds.giao_thoa.* +
    phái giao_thoa_1 để phiếu về đúng hộp; mã trùng hộp đã dùng trong bài thì bỏ (không lặp)."""
    k = kb()
    ck = k["chuong"]["da_xac_nhan"]
    phieu = {m: v for m, v in (ca_nhan or {}).items() if v in ("dung", "chua_dung") and isinstance(m, str)}
    kq = gt.lap([], ca_nhan=phieu) if phieu else {"du": False, "so_dung": 0, "so_chua_dung": 0, "hop": [], "tom_tat": ""}
    doan = [str(k["mau"]["da_xac_nhan_mo"])]
    hop: list[dict] = []
    if kq["du"] and kq["so_dung"] >= TOI_THIEU_XAC_NHAN:
        doan.append(kq["tom_tat"])
        if kq["so_chua_dung"]:
            doan.append(str(k["mau"]["da_xac_nhan_co_chua_dung"]).format(so=kq["so_chua_dung"]))
        for h in kq["hop"]:
            if h.get("ma_mau") and h["ma_mau"] not in da_dung:
                da_dung.add(h["ma_mau"])
                hop.append(_gan(h, "giao_thoa"))
        tom_tat = kq["tom_tat"]
    else:
        doan.append(str(k["mau"]["da_xac_nhan_khong_du"]))
        tom_tat = str(k["mau"]["da_xac_nhan_khong_du"])
    return kh.chuong("da_xac_nhan", ck["tieu_de"], doan, hop=hop, tom_tat=tom_tat, cau_hoi=ck["cau_hoi"],
                     cau_tu_soi=k["cau_tu_soi"]["da_xac_nhan"], so_xac_nhan=kq["so_dung"], so_chua_dung=kq["so_chua_dung"])


# ------------------------------------------------------------------ báo cáo
def lap(tv_sinh: dict, bt_sinh: dict, tra_loi: dict | None, ngay_xem: dt.date | None = None, *,
        trong_so: dict | None = None, ca_nhan: dict | None = None) -> dict:
    """`tv_sinh` như `tuvi_doi_song.lap`, `bt_sinh` như `battu_doi_song.lap`, `tra_loi` = khảo sát Nhân tướng (rỗng = chưa
    có). → báo cáo khuôn `doi_song_1` + `ma_tran` (mảng × môn, chỉ mức) — web vẽ, không tính."""
    from app.calc import nhan_tuong as calc_nt  # noqa: PLC0415
    from app.luangiai import battu_doi_song as bds  # noqa: PLC0415
    from app.luangiai import nhan_tuong as nt  # noqa: PLC0415
    from app.luangiai import nhat_quan  # noqa: PLC0415
    from app.luangiai import tuvi_doi_song as tds  # noqa: PLC0415

    ngay_xem = ngay_xem or config.hom_nay_vn()
    k = kb()
    tv = tds.lap(tv_sinh, ngay_xem)
    ls_bt = bds._la_so(bt_sinh)
    pt = bds.phan_tich(ls_bt)
    bt = bds.lap(bt_sinh, ngay_xem, ls=ls_bt)
    tl = calc_nt.tra_loi_sach(tra_loi)
    n = None
    if tl:
        n = nt.bao_cao(tl, nam_sinh=bt_sinh["lich"].date(), gioi_tinh=bt_sinh.get("gioi_tinh"), ngay_xem=ngay_xem,
                       battu={"cach_1": {"hanh": pt["cach_1"]["hanh"]}, "cach_2": {"hanh": pt["cach_2"]["hanh"]}})
    bao = {"tuvi": tv, "battu": bt, "nhantuong": n}
    thieu = [] if n else ["nhan_tuong"]

    # ---- ma trận mảng × môn + hộp tổng hợp từng mảng
    dong, hop_mang = [], {}
    for mang in MANG_CO_MUC:
        muc = {m: _muc_mon(bao[m], m, mang) for m in MON}
        h = dong_thuan(mang, muc)
        hop_mang[mang] = h
        co = [v for v in muc.values() if v]
        tt = "thieu" if h is None else "cung" if h.get("muc") else "khac"
        dong.append({"ma": mang, "ten": k["mang"][mang]["ten"], "muc": muc, "dong_thuan": tt,
                     "muc_chung": h.get("muc") if h else None, "so_mon": len(co)})
    so_cung = sum(1 for d in dong if d["dong_thuan"] == "cung")
    so_khac = sum(1 for d in dong if d["dong_thuan"] == "khac")
    da_dung: set[str] = set()
    chuong: list[dict] = []
    ck = k["chuong"]
    cts = k["cau_tu_soi"]

    # 1. Tổng quan (miễn phí): ma trận + các mảng cùng thấy; không có mảng cùng → mảng khác nhau đầu tiên
    mo = (k["tong_quan"]["mo_dau"] if n else k["tong_quan"]["mo_dau_hai_mon"]).format(so_cung=so_cung, so_khac=so_khac)
    hop1 = [hop_mang[d["ma"]] for d in dong if d["dong_thuan"] == "cung"]
    if not hop1:
        hop1 = [hop_mang[d["ma"]] for d in dong if d["dong_thuan"] == "khac"][:1]
    for h in hop1:
        da_dung.add(h["ma_mau"])
    chuong.append(kh.chuong("tong_quan", ck["tong_quan"]["tieu_de"], [mo, k["tong_quan"]["cach_doc"]], hop=hop1,
                            cau_hoi=ck["tong_quan"]["cau_hoi"], cau_tu_soi=cts["tong_quan"]))

    # 2. Con người bạn: nét nổi nhất của từng cách (hộp gốc, giữ mã)
    hop2 = (_muon(tv, "tong_quan", "tuvi", "diem_manh", da_dung, 2)
            + _muon(bt, "tong_quan", "battu", "diem_manh", da_dung, 2)
            + _muon(n, "tong_quan", "nhantuong", "cot_loi", da_dung, 1)
            + _muon(n, "con_nguoi", "nhantuong", "diem_manh", da_dung, 2))
    chuong.append(kh.chuong("con_nguoi", ck["con_nguoi"]["tieu_de"], [str(k["mau"]["con_nguoi_mo"])] + ([] if n else [str(k["mau"]["thieu_nhan_tuong"])]),
                            hop=hop2, cau_hoi=ck["con_nguoi"]["cau_hoi"], cau_tu_soi=cts["con_nguoi"], thieu=None if n else "Chưa có khảo sát gương mặt."))

    # 3–5. Chương theo mảng: dòng mức từng cách + hộp "khác nhau" (hộp "cùng" đã ở chương 1) + hộp mượn mỗi môn
    def _chuong_mang(ma: str, mo_dau: str, **them) -> dict:
        doan = [mo_dau]
        hop = []
        for mang in MANG_CUA_CHUONG[ma]:
            d = next(x for x in dong if x["ma"] == mang)
            doan.append(_dong_muc(mang, d["muc"]))
            h = hop_mang[mang]
            if h and d["dong_thuan"] == "khac" and h["ma_mau"] not in da_dung:   # hộp đã ở chương 1 thì không lặp
                hop.append(h); da_dung.add(h["ma_mau"])
            uu = _LOAI.get(d["muc_chung"]) if d["muc_chung"] else None
            for m in MON:
                hop += _muon(bao[m], CHUONG_MON[mang][m], m, uu, da_dung, 1)
        muc_chung = [hop_mang[x]["muc"] for x in MANG_CUA_CHUONG[ma] if hop_mang[x] and hop_mang[x].get("muc")]
        muc = muc_chung[0] if len(set(muc_chung)) == 1 and len(muc_chung) == len(MANG_CUA_CHUONG[ma]) else None
        return kh.chuong(ma, ck[ma]["tieu_de"], doan, hop=hop, muc=muc, cau_hoi=ck[ma]["cau_hoi"], cau_tu_soi=cts[ma], **them)

    chuong.append(_chuong_mang("cong_viec_tien", str(k["mau"]["mang_mo"])))
    chuong.append(_chuong_mang("tinh_cam_gia_dinh", str(k["mau"]["mang_mo"])))
    chuong.append(_chuong_mang("suc_khoe", str(k["mau"]["suc_khoe_mo"]), mien_tru=str(k["mau"]["suc_khoe_mien_tru"])))

    # 6. Năng lượng: hành lá số cần (hai cách Bát tự) × dáng mặt — chương "Tướng và lá số" của Nhân tướng đã ghép, mượn nguyên
    hop6 = _muon(n, "tuong_va_la_so", "nhantuong", "cot_loi", da_dung, 3) if n else []
    doan6 = [str(k["mau"]["nang_luong_mo"])]
    if not n:
        c1, c2 = ", ".join(pt["cach_1"]["hanh"]), ", ".join(pt["cach_2"]["hanh"])
        doan6.append(str(k["mau"]["nang_luong_thieu"]) + f" Cách 1 (cân sức): {c1 or 'chưa rõ'}; cách 2 (theo tháng sinh): {c2 or 'chưa rõ'}.")
    chuong.append(kh.chuong("nang_luong", ck["nang_luong"]["tieu_de"], doan6, hop=hop6, cau_hoi=ck["nang_luong"]["cau_hoi"],
                            cau_tu_soi=cts["nang_luong"], thieu=None if n else "Cần khảo sát gương mặt."))

    # 7. Năm nay: hai lá số cùng / khác mức năm (EN-2 nhat_quan) + hộp năm của từng cách
    nam_am = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, _TZ)[2]
    d_nam = next(x for x in dong if x["ma"] == "nam_nay")
    hop7 = []
    h_nq = nhat_quan.nam(nam_am, {"tuvi": d_nam["muc"]["tuvi"], "battu": d_nam["muc"]["battu"]})
    if h_nq and h_nq["ma_mau"] not in da_dung:
        da_dung.add(h_nq["ma_mau"]); hop7.append(_gan(h_nq, "hai_la_so"))
    hop7 += _muon(tv, "nam_nay", "tuvi", "thoi_diem", da_dung, 1, loc=lambda h: h.get("muc") and ".thang" not in h.get("ma_mau", ""))
    hop7 += _muon(bt, "nam_nay", "battu", "thoi_diem", da_dung, 1, loc=lambda h: h.get("muc"))
    hop7 += _muon(n, "nam_nay", "nhantuong", "thoi_diem", da_dung, 1)
    chuong.append(kh.chuong("nam_nay", ck["nam_nay"]["tieu_de"], [str(k["mau"]["nam_nay_mo"]), _dong_muc("nam_nay", d_nam["muc"])],
                            hop=hop7, cau_hoi=ck["nam_nay"]["cau_hoi"], cau_tu_soi=cts["nam_nay"]))

    # 8. Điều bạn đã xác nhận (Ý2): lớp giao thoa từ phiếu của chính người xem — mã hộp, không chữ; hộp giữ mã ds.giao_thoa.*
    chuong.append(_chuong_da_xac_nhan(ca_nhan, da_dung))

    # 9. Việc nên làm: từ hộp tổng hợp từng mảng — mảng cùng nhắc đi chậm trước, rồi khác nhau, rồi thuận
    def _uu(d: dict) -> tuple:
        mc = d["muc_chung"]
        return (0 if mc == "can_chu_dong" else 1 if d["dong_thuan"] == "khac" else 2 if mc == "can_bang" else 3, MANG_CO_MUC.index(d["ma"]))
    hop8 = []
    for d in sorted(dong, key=_uu):
        h = hop_mang[d["ma"]]
        if not h or not h.get("huong_xu_ly"):
            continue
        hop8.append(_gan(kh.hop("loi_khuyen", h["huong_xu_ly"].rstrip("."), f"Từ mảng {d['ten'].lower()}: {h['tieu_de'].rstrip('.')}.",
                                can_cu=h.get("can_cu"), ma=kh.ma_mau(MO_DUN, "loi_khuyen", d["ma"])), "ba_mon"))
        if len(hop8) >= TOI_DA_LOI_KHUYEN:
            break
    chuong.append(kh.chuong("loi_khuyen", ck["loi_khuyen"]["tieu_de"], [str(k["mau"]["loi_khuyen_mo"])], hop=hop8,
                            cau_hoi=ck["loi_khuyen"]["cau_hoi"], cau_tu_soi=cts["loi_khuyen"]))

    for c in chuong:
        c["moi_xem"] = _moi_xem(c)
    cot_loi = [{**h, "tu_chuong": "tong_quan", "loai_goc": h["loai"], "loai": "cot_loi"} for h in hop1[:TOI_DA_COT_LOI]]
    bc = {"phien_ban": kh.PHIEN_BAN, "mo_dun": MO_DUN, "phai": PHAI_BA_MON, "ngay_xem": ngay_xem.isoformat(),
          "ma_tran": {"mon": list(MON), "ten_mon": {m: _ten(m) for m in MON}, "dong": dong},
          "so_mang_cung": so_cung, "so_mang_khac": so_khac, "thieu": thieu, "cot_loi": cot_loi, "chuong": chuong,
          "ket": str(k["tong_quan"]["ket"]), "trang_thai": k["_meta"]["trang_thai"], "dien_dat": "mau",
          "nguon": "Tử vi Nam phái · Bát tự Tử Bình · Nhân tướng (Ma Y, Thần Tướng Toàn Biên) — ghép, không thêm dữ kiện"}
    return kh.ap_hoc(bc, trong_so, ca_nhan)
