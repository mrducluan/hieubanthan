# -*- coding: utf-8 -*-
"""Chặng 2 — Bộ não Cố vấn Liên mảng Tam Tài (`POST /v1/co-van`, `mo_dun = "tam_tai"`).

Thiết kế tất định 100% (không LLM, không trung bình cộng điểm giữa các môn có κ ≈ 0.00):
  1. Cổng an toàn đầu tiên (`hoidap.chung.dac_biet`): khủng hoảng / cấp cứu / chẩn đoán bệnh / may rủi trả lời bảo vệ ngay,
     tuyệt đối không chạy phép luận mệnh lý.
  2. Nhận diện 8 mạch quyết định thực tế (song ngữ VI/EN) + thích nghi 3 Bậc đầu vào (0% ngõ cụt):
     - Bậc 1 (chỉ ngày sinh): Bát tự Tam trụ (`co_gio=False`) + Thần số Pitago + Phong thuỷ Mệnh quái + Hoàng lịch 30 ngày.
     - Bậc 2 (+ giờ sinh & nơi sinh): mở Bát tự Tứ trụ (2 cách dụng thần) + Tử vi Nam phái & Phi hoá Kỵ chuyển Kỵ.
     - Bậc 3 (+ hướng nhà/năm xây hoặc + ngày sinh đối tác): mở Huyền Không Vận 9 (kèm Đối chiếu 2 phái) hoặc Tương tác 2 người.
  3. Tam Tài Phân Vai Trực Giao:
     - Trụ Nhân (`nhan`): Nội lực & sức bền (Bát tự + Thần số)
     - Trụ Thiên (`thien`): Thời thế & mắt xích hệ quả bước 2 (Tử vi / Phi hoá + Nhịp 12 tháng)
     - Trụ Địa (`dia`): Đòn bẩy không gian & ngày đẹp hành động (Phong thuỷ + Hoàng lịch)
     Bảng chân trị bất khả mâu thuẫn: nếu Nhân hoặc Thiên ở mức `can_chu_dong`, kết luận 5 giây không bao giờ báo `thuan_mo`.
"""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.calc import battu as bt_calc, lunar, phongthuy as pt, thanso, tuvi_an_sao as az
from app.hoidap import chung
from app.kb import nap, ten as ten_kb
from app.kb.loi import L, danh_sach
from app.luangiai import (
    battu_doi_song as btd,
    doanh_chu_lich as dcl,
    doanh_chu_ngay as dcn,
    doi_song_khuon as kh,
    phongthuy_doi_song as ptds,
    toan_bo,
    tuvi_doi_song as tvd,
    tuvi_phi_hoa as ph_luan,
    ung_dung_co_dien as ud,
)

MO_DUN = "tam_tai"
_TEP = "co_van_tam_tai_kb.json"
_HANH_SLUG = {"Kim": "kim", "Mộc": "moc", "Thủy": "thuy", "Thuỷ": "thuy", "Hỏa": "hoa", "Hoả": "hoa", "Thổ": "tho"}
_HANH_NORM = {"Kim": "Kim", "Mộc": "Mộc", "Thủy": "Thủy", "Thuỷ": "Thủy", "Hỏa": "Hỏa", "Hoả": "Hỏa", "Thổ": "Thổ"}

_MAU_MACH: list[tuple[str, list[str]]] = [
    ("gop_von_hop_tac", [
        r"(hun von|gop von|chung von|gop co phan|lam an chung|lam chung|co[ -]?founder|chia co phan|chia 50|doi tac lam an)",
        r"\b(co[ -]?founder|pool capital|equity co[ -]?founder|business partner|equity split|joint venture)\b",
    ]),
    ("gia_dao_hoa_giai", [
        r"(vo chong|gia dinh|gia dao|con cai|nuoi day con|noi ngoai|bo me va hai vo chong).{0,45}(cai nhau|luc duc|cang thang|bat hoa|bat dong|lanh nhat|chien tranh lanh|ngot ngat|xung dot|hoa giai|go nut)",
        r"(cai nhau|luc duc|cang thang|bat hoa|bat dong|ngot ngat|xung dot).{0,45}(vo chong|gia dinh|bo me|trong nha)",
        r"(chien tranh lanh|bat hoa gia dinh|mau thuan vo chong)",
        r"\b(marriage|spouse|husband|wife|family|in-laws).{0,35}(conflict|argue|friction|tension|cold war)\b",
    ]),
    ("suc_ben_nang_luong", [
        r"(kiet suc|met moi|mat ngu|burnout|qua tai|hut hoi|ue oai|duoi suc|chan nan|nghi phep dai|ap luc tinh than)",
        r"\b(burnout|exhausted|insomnia|stamina|overloaded|drained|overwhelmed|fatigue)\b",
    ]),
    ("tinh_cam_cam_ket", [
        r"(ket hon|dang ky ket hon|cuoi hoi|giuc cuoi|tinh cam|nguoi yeu|ban trai|ban gai|hen ho|chia tay|ly hon|mo long|moi tinh)",
        r"\b(marry|wedding|relationship|dating|breakup|divorce|boyfriend|girlfriend|romance)\b",
    ]),
    ("nha_cua_mat_bang", [
        r"(mua nha|mua can ho|chung cu|nha pho|chuyen nha|chuyen cho o|chuyen dia diem|ra o rieng|thue mat bang|doi showroom|sua nha|dat bep)",
        r"\b(buy a house|apartment|relocat|commercial lease|premises|storefront|renovat)\b",
    ]),
    ("tai_chinh_dau_tu", [
        r"(dau tu|xuong tien|giu tien|co phieu|trai phieu|gui ky han|so tiet kiem|dong tien|cong no|thu hoi no|vay them von|thanh khoan|lo dat)",
        r"\b(invest|stocks|cashflow|receivables|debt|loan|liquidity|savings)\b",
    ]),
    ("su_nghiep_chuyen_viec", [
        r"(nghi viec|nghi han|nhay viec|chuyen viec|doi nghe|thang chuc|giam doc|san dau nguoi|tach xuong|mo tiem|khoi nghiep|ra lam rieng|mo cong ty|su nghiep)",
        r"\b(quit my job|change jobs|career|headhunter|director|promotion|startup|go independent)\b",
    ]),
]


def _kb() -> dict:
    return nap.doc(_TEP)


def nhan_dien_mach(cau_hoi: str, che_do: str = "doi_song") -> str:
    t = chung.chuan_hoa_cau(cau_hoi or "")
    for ma, ds in _MAU_MACH:
        if chung.co(t, ds):
            return ma
    return "tai_chinh_dau_tu" if che_do == "kinh_doanh" else "quyet_dinh_tong_hop"


def _nhan_muc(muc: str) -> str:
    if ngon_ngu.la_viet():
        return {"thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần lưu ý"}[muc]
    return {"thuan": "Favorable", "can_bang": "Balanced", "can_chu_dong": "Needs attention"}[muc]


def _tong_hop_nhip(muc_nhan: str, muc_thien: str, muc_dia: str) -> str:
    """Bảng chân trị tất định không bao giờ mâu thuẫn với 3 trụ:
    - Nếu cả Nhân & Thiên cùng `can_chu_dong` hoặc có ≥ 2 trụ `can_chu_dong` → `giu_phong_thu`.
    - Nếu không trụ nào trong (Nhân, Thiên) ở `can_chu_dong`, Địa không `can_chu_dong`, và có ít nhất 1 trụ `thuan` → `thuan_mo`.
    - Còn lại → `chuan_bi_chac`."""
    ba = (muc_nhan, muc_thien, muc_dia)
    if (muc_nhan == "can_chu_dong" and muc_thien == "can_chu_dong") or ba.count("can_chu_dong") >= 2:
        return "giu_phong_thu"
    if "can_chu_dong" not in ba and ("thuan" in (muc_nhan, muc_thien)):
        return "thuan_mo"
    return "chuan_bi_chac"


_CA_CUOC_THEM = [
    r"\b(bat keo|keo bong da|tai xiu|ca do|ca cuoc|danh lo|con lo|con de|lo de|vietlott|xo so|xoc dia|baccarat)\b",
    r"\b(sports bet|betting odds|lottery numbers|casino|gambling)\b",
]
_KHUNG_HOANG_THEM = [
    r"(khong muon song tiep|ket thuc cuoc doi|bien mat vinh vien khoi coi doi|quyen sinh|nhay cau|uong thuoc ngu tu)",
]


def _kiem_an_toan(cau_hoi: str) -> dict | None:
    t = chung.chuan_hoa_cau(cau_hoi or "")
    loai = chung.dac_biet(t, cau_hoi)
    if not loai and chung.co(t, _KHUNG_HOANG_THEM):
        loai = "an_toan"
    if not loai and chung.co(t, _CA_CUOC_THEM):
        loai = "tu_choi_nhe"
    if not loai:
        return None
    if loai == "an_toan":
        mau = L("hoi.tv.an_toan", "Mình nghe thấy bạn đang rất nặng lòng. Lúc này sự an toàn của bạn là quan trọng nhất — hãy gọi ngay người thân tin cậy hoặc đường dây hỗ trợ tâm lý/cấp cứu gần nhất.")
        dap = chung.mau_an_toan(cau_hoi, mau)
    elif loai == "dan_huong":
        dap = L("hoi.tv.dan_huong", "Hệ thống không dùng nghi lễ hay vật phẩm tâm linh. Bạn nên tập trung vào các điều chỉnh thực tế về sức khoẻ, tài chính và không gian sống.")
    else:
        mau_tc = L("hoi.tv.tu_choi", "Hệ thống không luận các câu hỏi về chẩn đoán bệnh, tuổi thọ, may rủi cờ bạc hay phán xét người khác.")
        dap = chung.mau_tu_choi(cau_hoi, t, mau_tc)
    return {"xu_ly": loai, "loai": loai, "cau_tra_loi": dap}


def _bieu_do_tu_battu(ls_bt: dict, co_gio: bool) -> tuple[dict, list[str]]:
    diem_raw = ls_bt["ngu_hanh"]["diem"]
    tong = sum(float(v) for v in diem_raw.values()) or 1.0
    hanh_ds = []
    thieu_ds: list[str] = []
    for h_goc in ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ"):
        d = float(diem_raw.get(h_goc, diem_raw.get("Thuỷ" if h_goc == "Thủy" else "Hoả" if h_goc == "Hỏa" else h_goc, 0.0)))
        tl = round(d / tong * 100.0, 1)
        tt = "thieu" if tl < 13.0 else "thua" if tl > 30.0 else "vua"
        if tt == "thieu":
            thieu_ds.append(h_goc)
        hanh_ds.append({
            "hanh_ma": _HANH_SLUG[h_goc],
            "ten": ten_kb.ten("hanh", h_goc),
            "diem": round(d, 2),
            "ty_le": tl,
            "trang_thai": tt,
        })
    if not thieu_ds:
        h_min = min(("Kim", "Mộc", "Thủy", "Hỏa", "Thổ"),
                    key=lambda hg: float(diem_raw.get(hg, diem_raw.get("Thuỷ" if hg == "Thủy" else "Hoả" if hg == "Hỏa" else hg, 0.0))))
        thieu_ds.append(h_min)
    can_ngay = ls_bt["nhat_chu"]["can"]
    nc_hanh = _HANH_NORM[ls_bt["nhat_chu"]["ngu_hanh"]]
    bd = {
        "nhat_chu": f"{ten_kb.ten('can', can_ngay)} ({ten_kb.ten('hanh', nc_hanh)})",
        "co_gio": co_gio,
        "hanh": hanh_ds,
    }
    return bd, thieu_ds[:2]


def lap(
    *,
    cau_hoi: str,
    ngay_sinh: dt.date,
    gioi_tinh: str = "nam",
    gio_sinh: str | None = None,
    do_tin_gio: str = "unknown",
    noi_sinh: str | None = None,
    tz_lich: float = 7.0,
    utc_lich: float | None = None,
    nha: dict | None = None,
    doi_tac: dict | None = None,
    che_do: str = "doi_song",
    ngay_xem: dt.date | None = None,
    trong_so: dict | None = None,
    ca_nhan: dict | None = None,
) -> dict:
    hom_nay = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    k = _kb()
    vi = ngon_ngu.la_viet()

    chan = _kiem_an_toan(cau_hoi)
    if chan is not None:
        return {
            "mo_dun": MO_DUN,
            "phien_ban": kh.PHIEN_BAN,
            "ngay_xem": hom_nay.isoformat(),
            "trang_thai": k["trang_thai"],
            "ket": k["ket"],
            "an_toan_chan": chan,
            "chuong": [],
        }

    mach = nhan_dien_mach(cau_hoi, che_do=che_do)
    m_kb = k["mach"][mach]
    co_gio = bool(gio_sinh and do_tin_gio != "unknown")
    co_nha = bool(nha and nha.get("do_huong") is not None)
    co_doi_tac = bool(doi_tac and doi_tac.get("ngay_sinh"))
    bac = 3 if (co_nha or co_doi_tac) else (2 if co_gio else 1)

    lop_da_dung = [k["lop_ten"]["battu_tu_tru" if co_gio else "battu_tam_tru"], k["lop_ten"]["thanso_pitago"]]
    if co_gio:
        lop_da_dung.append(k["lop_ten"]["tuvi_phi_hoa"])
    lop_da_dung.append(k["lop_ten"]["huyen_khong_van_9" if (co_nha and nha.get("nam_xay")) else "phongthuy_menh_quai"])
    lop_da_dung.append(k["lop_ten"]["hoang_lich_30_ngay"])
    if co_doi_tac:
        lop_da_dung.append(k["lop_ten"]["tuong_tac_doi_tac"])

    goi_y_nang: list[dict] = []
    if not co_gio:
        goi_y_nang.append({"bac_tiep": 2, **k["goi_y_nang_bac"]["bac_2"]})
    if not co_nha:
        goi_y_nang.append({"bac_tiep": 3, **k["goi_y_nang_bac"]["bac_3_nha"]})
    if not co_doi_tac and mach in ("gop_von_hop_tac", "tinh_cam_cam_ket", "gia_dao_hoa_giai"):
        goi_y_nang.append({"bac_tiep": 3, **k["goi_y_nang_bac"]["bac_3_doi_tac"]})

    # ---- 1. TRỤ NHÂN: Bát tự (Tứ trụ hoặc Tam trụ) + Thần số Pitago ------------------------------------------------
    nam_cn = int(thanso.nam_ca_nhan(ngay_sinh.day, ngay_sinh.month, hom_nay.year, "duong_lich"))
    if co_gio:
        hh, mm = (int(x) for x in str(gio_sinh).split(":"))
        lich_bt = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, hh, mm)
        sinh_bt = {"lich": lich_bt, "gioi_tinh": gioi_tinh, "gio_ty": "da_ty", **({"utc_lich": utc_lich} if utc_lich is not None else {})}
        ls_bt = bt_calc.la_so(lich_bt, gioi_tinh=gioi_tinh, co_gio=True)
        bc_bt = btd.lap(sinh_bt, hom_nay, ls=ls_bt)
        ch_bt = next((c for c in bc_bt["chuong"] if c["ma"] == m_kb["chuong_battu"]), bc_bt["chuong"][0])
        muc_nhan = ch_bt.get("muc") or "can_bang"
        u_co_dien = ud.tu_bao_cao_battu(bc_bt)
        hanh_can_ma = [x["hanh_ma"] for x in (u_co_dien or {}).get("hanh_ung_dung", [])]
        bd_nh, hanh_thieu = _bieu_do_tu_battu(ls_bt, co_gio=True)
        hanh_can_ten = danh_sach([x["ten_hanh"] for x in (u_co_dien or {}).get("hanh_ung_dung", [])]) or danh_sach([ten_kb.ten("hanh", h) for h in hanh_thieu])
        nx_nhan = ch_bt.get("tom_tat") or (ch_bt["doan"][0] if ch_bt.get("doan") else "")
        hd_ung_vien = [
            *(h.get("huong_xu_ly") for h in ch_bt.get("hop", []) if h.get("huong_xu_ly")),
            *(h.get("noi_dung") for h in ch_bt.get("hop", []) if h.get("loai") in ("loi_khuyen", "luu_y") and h.get("noi_dung") != nx_nhan),
            *(((u_co_dien or {}).get("hanh_ung_dung") or [{}])[0].get("thoi_quen") or []),
        ]
        hd_nhan = next((s for s in hd_ung_vien if s and s != nx_nhan), nx_nhan)
        cc_nhan = list(ch_bt.get("can_cu") or [])[:3]
    else:
        lich_bt = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, 12, 0)
        ls_bt = bt_calc.la_so(lich_bt, gioi_tinh=gioi_tinh, co_gio=False)
        bd_nh, hanh_thieu = _bieu_do_tu_battu(ls_bt, co_gio=False)
        hanh_can_ten = danh_sach([ten_kb.ten("hanh", h) for h in hanh_thieu])
        muc_nhan = "thuan" if nam_cn in (1, 3, 5, 8) else "can_chu_dong" if nam_cn in (4, 7) else "can_bang"
        kb_ud = nap.doc("ung_dung_co_dien_kb.json")
        u_co_dien = {
            "ma": "tam_tai_co_dien",
            "tieu_de": kb_ud["tieu_de"]["battu"],
            "nguyen_tac_uu_tien": kb_ud["nguyen_tac_uu_tien"]["battu"],
            "hanh_ung_dung": [ud._the_hanh(kb_ud, h) for h in hanh_thieu[:2]],
        }
        if vi:
            nx_nhan = f"Theo Bát tự Tam trụ, nhật chủ {bd_nh['nhat_chu']} đang thiếu lực hành {hanh_can_ten}, đi cùng Năm cá nhân số {nam_cn}."
            hd_nhan = f"Bổ sung nhịp làm việc và môi trường mang tính {hanh_can_ten} để giữ sức bền ổn định trước khi mở việc lớn."
            cc_nhan = [f"Tam trụ 6 chữ (chưa có giờ sinh): nhật chủ {bd_nh['nhat_chu']}, thiếu {hanh_can_ten}", f"Năm cá nhân Pitago {hom_nay.year}: số {nam_cn}"]
        else:
            nx_nhan = f"Across your Three Pillars, Day Master {bd_nh['nhat_chu']} benefits from {hanh_can_ten} support alongside Personal Year {nam_cn}."
            hd_nhan = f"Lean on {hanh_can_ten}-aligned habits and pacing to keep your personal bandwidth steady."
            cc_nhan = [f"BaZi Three Pillars (no birth hour): Day Master {bd_nh['nhat_chu']}, low {hanh_can_ten}", f"Pythagorean Personal Year {hom_nay.year}: {nam_cn}"]

    if u_co_dien:
        u_co_dien = {**u_co_dien, "ma": "tam_tai_co_dien"}

    # ---- 2. TRỤ THIÊN: Lịch 12 tháng + (nếu có giờ sinh) Tử vi cung chủ sự & Chuỗi Kỵ chuyển Kỵ --------------------
    muc_tieu_lich = "ra_mat" if mach in ("su_nghiep_chuyen_viec", "nha_cua_mat_bang") else "ky_ket" if mach == "gop_von_hop_tac" else "giu_tien" if mach == "tai_chinh_dau_tu" else "tang_truong"
    lich_12 = dcl.lich_quyet_dinh_12_thang(
        ngay=ngay_sinh.day, thang=ngay_sinh.month, nam=ngay_sinh.year,
        gioi_tinh=gioi_tinh, gio=gio_sinh if co_gio else None,
        muc_tieu=muc_tieu_lich, tu=hom_nay,
    )
    nhip_12 = [
        {
            "thang": th["nhan_thang"],
            "nhip": th["nhip_thang"],
            "nhan_nhip": k["nhan_nhip_thang"][th["nhip_thang"]],
            "goi_y": th["nen_lam"],
        }
        for th in lich_12["muoi_hai_thang"]
    ]
    ba_dau = [x["nhip"] for x in nhip_12[:3]]
    muc_lich_3t = "thuan" if ba_dau.count("day_manh") >= 2 else "can_chu_dong" if ba_dau.count("phong_thu") >= 2 else "can_bang"

    chuoi_ky_note = None
    if co_gio:
        hh, mm = (int(x) for x in str(gio_sinh).split(":"))
        ti = az.time_index(hh, mm)
        bc_tv = tvd.lap({"ngay": ngay_sinh, "ti": ti, "gioi_tinh": gioi_tinh, "tz_lich": tz_lich}, hom_nay)
        ch_tv = next((c for c in bc_tv["chuong"] if c["ma"] == m_kb["cung_tuvi"]), bc_tv["chuong"][0])
        muc_thien = ch_tv.get("muc") or muc_lich_3t
        if muc_lich_3t == "can_chu_dong" and muc_thien == "thuan":
            muc_thien = "can_bang"
        nx_thien = ch_tv.get("tom_tat") or (ch_tv["doan"][0] if ch_tv.get("doan") else "")
        # Lấy chuỗi Kỵ chuyển Kỵ đầu tiên để chỉ rõ mắt xích hệ quả bước 2
        from app.hoidap import tuvi as htv  # noqa: PLC0415
        ls_tv = htv.tom_tat(az.an_sao_tho(ngay_sinh, ti, gioi_tinh, "vi-VN", tz_lich=tz_lich))
        nam_am = lunar.solar_to_lunar(ngay_sinh.day, ngay_sinh.month, ngay_sinh.year, tz_lich)[2]
        ph_kq = ph_luan.lap(ls_tv, lunar.can_chi_nam(nam_am)[0], nam_xem=hom_nay.year)
        if ph_kq.get("chuoi_chuyen_ky"):
            ck0 = ph_kq["chuoi_chuyen_ky"][0]
            chuoi_ky_note = f"{ck0['nghia']} {ck0['viec_nen_lam']}"
        hd_thien = chuoi_ky_note or nhip_12[0]["goi_y"]
        cc_thien = list(ch_tv.get("can_cu") or [])[:2]
        if ph_kq.get("chuoi_chuyen_ky"):
            cc_thien += list(ph_kq["chuoi_chuyen_ky"][0].get("can_cu") or [])[:1]
    else:
        muc_thien = muc_lich_3t
        th_mo = [x["thang"] for x in nhip_12 if x["nhip"] == "day_manh"][:3]
        th_giu = [x["thang"] for x in nhip_12 if x["nhip"] == "phong_thu"][:3]
        if vi:
            nx_thien = (f"Trong 12 tháng tới, các mốc thuận mở bước rơi vào {', '.join(th_mo) or 'các tháng cân bằng'}; "
                        f"các mốc cần giữ sức và rà kỹ là {', '.join(th_giu) or 'không có tháng ép mạnh'}.")
            cc_thien = [f"Tổng hợp nhịp 12 tháng (con giáp, phong thuỷ năm & lịch tiết khí từ {hom_nay.isoformat()})"]
        else:
            nx_thien = (f"Over the next 12 months, stronger Advance windows appear in {', '.join(th_mo) or 'balanced months'}, "
                        f"while Consolidate checkpoints fall in {', '.join(th_giu) or 'no heavy-caution months'}.")
            cc_thien = [f"12-month multi-layer cadence starting {hom_nay.isoformat()}"]
        hd_thien = nhip_12[0]["goi_y"]

    # ---- 3. TRỤ ĐỊA: Phong thuỷ (Mệnh quái hoặc Vận 9) + Ngày đẹp Hoàng lịch 30 ngày + Đối tác ---------------------
    mq = pt.menh_quai(ngay_sinh.year, gioi_tinh, ngay_sinh)
    ten_quai = ten_kb.ten("quai", mq["quai"])
    bh = pt.bang_huong(mq["quai"])
    huong_sinh_khi = next((ten_kb.ten("huong", p) for p, dn in bh.items() if dn == "Sinh Khí"), "")

    if co_nha:
        bc_pt = ptds.luan_giai(
            {"nam": ngay_sinh.year, "gioi_tinh": gioi_tinh, "ngay": ngay_sinh},
            {"huong_do": float(nha["do_huong"]), **({"nam_xay": int(nha["nam_xay"])} if nha.get("nam_xay") else {}), "theo": "cua"},
            ngay_xem=hom_nay,
        )
        ch_pt = bc_pt["chuong"][0]
        muc_dia = ch_pt.get("muc") or "can_bang"
        nx_dia = ch_pt.get("tom_tat") or ch_pt["doan"][0]
        hd_dia_uv = [
            *(h.get("huong_xu_ly") for h in bc_pt.get("cot_loi", []) if h.get("huong_xu_ly")),
            *(h.get("noi_dung") for h in bc_pt.get("cot_loi", []) if h.get("noi_dung") and h.get("noi_dung") != nx_dia),
        ]
        hd_dia = next((s for s in hd_dia_uv if s and s != nx_dia),
                      f"Giữ khu vực cửa đón khí sạch thoáng và kê chỗ ngồi theo hướng {huong_sinh_khi}." if vi
                      else f"Keep the main entrance uncluttered and align your primary seating toward {huong_sinh_khi}.")
        cc_dia = [s.replace(" ()", "").replace("()", "").strip() for s in (ch_pt.get("can_cu") or [])][:3]
        if bc_pt.get("ung_dung_co_dien"):
            u_pt = bc_pt["ung_dung_co_dien"]
            u_co_dien = {**(u_co_dien or {}), "khu_vuc_van_9": u_pt.get("khu_vuc_van_9"),
                         **({"doi_chieu_hai_phai": u_pt["doi_chieu_hai_phai"]} if u_pt.get("doi_chieu_hai_phai") else {}),
                         "ma": "tam_tai_co_dien"}
    else:
        muc_dia = "thuan" if nhip_12[0]["nhip"] == "day_manh" else "can_bang"
        if vi:
            nx_dia = f"Bạn thuộc cung {ten_quai}; phương đón Sinh Khí tự nhiên là hướng {huong_sinh_khi}."
            hd_dia = f"Xoay ghế làm việc hoặc dọn thoáng góc phía {huong_sinh_khi}, đảm bảo đủ ánh sáng tự nhiên trước khi chốt việc quan trọng."
            cc_dia = [f"Bát trạch Mệnh quái theo Lập xuân: cung {ten_quai}, Sinh Khí tại {huong_sinh_khi}"]
        else:
            nx_dia = f"Your personal Eight Mansions trigram is {ten_quai}, with Vitality alignment toward {huong_sinh_khi}."
            hd_dia = f"Keep your desk or primary seating tidy, bright and oriented toward {huong_sinh_khi} when making key decisions."
            cc_dia = [f"Eight Mansions personal trigram (by Lichun): {ten_quai}, Vitality direction {huong_sinh_khi}"]

    try:
        ds_ngay_raw = dcn.ngay_tot(m_kb["viec_hoang_lich"], hom_nay, hom_nay + dt.timedelta(days=30), ngay_sinh, 3)
    except Exception:  # noqa: BLE001
        ds_ngay_raw = dcn.ngay_tot("ky_ket", hom_nay, hom_nay + dt.timedelta(days=30), ngay_sinh, 3)
    ngay_dep = [
        {
            "ngay": x["ngay"],
            "am_lich": x.get("am") or "",
            "truc": x.get("truc") or "",
            "ly_do": ", ".join(x.get("diem_cong") or []),
        }
        for x in ds_ngay_raw
    ]

    ghi_chu_doi_tac = None
    if co_doi_tac:
        dt_ns = dt.date.fromisoformat(str(doi_tac["ngay_sinh"]))
        ls_dt = bt_calc.la_so(dt.datetime(dt_ns.year, dt_ns.month, dt_ns.day, 12, 0), gioi_tinh=doi_tac.get("gioi_tinh") or "nam", co_gio=False)
        diem_dt = {_HANH_NORM[hk]: float(v) for hk, v in ls_dt["ngu_hanh"]["diem"].items()}
        hanh_troi_dt = max(diem_dt.items(), key=lambda kv: kv[1])[0]
        ten_ht_dt = ten_kb.ten("hanh", hanh_troi_dt)
        bu_duoc = hanh_troi_dt in hanh_thieu
        if vi:
            ghi_chu_doi_tac = (f"Người liên quan ({dt_ns.isoformat()}) có hành trội là {ten_ht_dt} — "
                               + ("bù đúng phần hành bạn đang khuyết, rất thuận để phân vai bổ trợ nhau."
                                  if bu_duoc else "cùng thiên hướng năng lượng với bạn, dễ đồng lòng nhanh nhưng cần tách rõ người giữ kỷ luật kiểm soát."))
        else:
            ghi_chu_doi_tac = (f"Counterparty ({dt_ns.isoformat()}) carries strong {ten_ht_dt} — "
                               + ("directly complementing your missing element for clean role synergy."
                                  if bu_duoc else "sharing a similar instinct to yours; separate review and treasury duties clearly."))

    # ---- 4. KẾT LUẬN 5 GIÂY & DỰNG 4 CHƯƠNG CHUẨN `doi_song_1` (TƯƠNG THÍCH SAO-2 ALLOWLIST) -----------------------
    nhip_kl = _tong_hop_nhip(muc_nhan, muc_thien, muc_dia)
    ma_kl = kh.ma_mau(MO_DUN, mach, nhip_kl)
    fmt_vars = {"hanh_can": hanh_can_ten, "nam_cn": nam_cn, "quai": ten_quai}
    ket_luan_5s = {
        "nhip": nhip_kl,
        "nhan_nhip": k["nhan_nhip_ket_luan"][nhip_kl],
        "cau_ket_luan": m_kb["ket_luan"][nhip_kl].format(**fmt_vars),
        "diem_tua_chinh": m_kb["diem_tua"].format(**fmt_vars),
        "diem_can_giu": m_kb["diem_giu"].format(**fmt_vars),
        "ma_mau": ma_kl,
    }

    vai_thien = (
        k["vai_tro_tru"]["thien"] if co_gio
        else ("Đọc từ Nhịp 12 tháng đa lớp (Con giáp, Phong thuỷ năm & Lịch tiết khí): chỉ rõ cửa sổ mở bước và giữ sức"
              if vi else "From 12-Month Multi-Layer Cadence (Branch, Annual Feng Shui & Solar Terms): maps Advance and Consolidate windows")
    )
    ba_tru = {
        "nhan": {"ma": "nhan", "ten_tru": k["ten_tru"]["nhan"], "vai_tro": k["vai_tro_tru"]["nhan"],
                 "muc": muc_nhan, "nhan_muc": _nhan_muc(muc_nhan), "nhan_xet": nx_nhan, "hanh_dong": hd_nhan, "can_cu": cc_nhan},
        "thien": {"ma": "thien", "ten_tru": k["ten_tru"]["thien"], "vai_tro": vai_thien,
                  "muc": muc_thien, "nhan_muc": _nhan_muc(muc_thien), "nhan_xet": nx_thien, "hanh_dong": hd_thien, "can_cu": cc_thien},
        "dia": {"ma": "dia", "ten_tru": k["ten_tru"]["dia"], "vai_tro": k["vai_tro_tru"]["dia"],
                "muc": muc_dia, "nhan_muc": _nhan_muc(muc_dia), "nhan_xet": nx_dia, "hanh_dong": hd_dia, "can_cu": cc_dia},
    }

    hop_c1 = [
        kh.hop("diem_manh" if nhip_kl == "thuan_mo" else "loi_khuyen", ket_luan_5s["nhan_nhip"], ket_luan_5s["cau_ket_luan"],
               huong_xu_ly=ket_luan_5s["diem_tua_chinh"], can_cu=cc_nhan[:1] + cc_thien[:1] + cc_dia[:1], ma=ma_kl),
        kh.hop("luu_y", "Nguyên tắc giữ an toàn cho quyết định này" if vi else "Safety boundary for this decision",
               ket_luan_5s["diem_can_giu"], can_cu=cc_thien[:1], ma=kh.ma_mau(MO_DUN, mach, "giu_an_toan")),
    ]
    c1 = kh.chuong("buc_tranh_tam_tai", k["chuong_tieu_de"]["c1"], [ket_luan_5s["cau_ket_luan"], ket_luan_5s["diem_tua_chinh"]],
                   hop=hop_c1, tom_tat=ket_luan_5s["cau_ket_luan"])

    doan_c2 = [nx_nhan, hd_nhan, nx_thien] + ([chuoi_ky_note] if chuoi_ky_note else [])
    hop_c2 = [
        kh.hop("diem_manh" if muc_nhan == "thuan" else "loi_khuyen", k["ten_tru"]["nhan"], nx_nhan, huong_xu_ly=hd_nhan,
               can_cu=cc_nhan, ma=kh.ma_mau(MO_DUN, "nhan", muc_nhan)),
        kh.hop("thoi_diem", k["ten_tru"]["thien"], nx_thien, huong_xu_ly=hd_thien,
               can_cu=cc_thien, ma=kh.ma_mau(MO_DUN, "thien", muc_thien)),
    ]
    c2 = kh.chuong("noi_luc_va_thoi_the", k["chuong_tieu_de"]["c2"], doan_c2, hop=hop_c2, tom_tat=nx_thien)

    doan_c3 = [f"{x['thang']} ({x['nhan_nhip']}): {x['goi_y']}" for x in nhip_12[:6]]
    hop_c3 = [kh.hop("thoi_diem", f"{nhip_12[0]['thang']}: {nhip_12[0]['nhan_nhip']}", nhip_12[0]["goi_y"],
                     can_cu=cc_thien[:1], ma=kh.ma_mau(MO_DUN, "thang_dau", nhip_12[0]["nhip"]))]
    c3 = kh.chuong("nhip_12_thang_va_ngay_dep", k["chuong_tieu_de"]["c3"], doan_c3, hop=hop_c3, tom_tat=doan_c3[0])

    doan_c4 = [nx_dia, hd_dia] + ([ghi_chu_doi_tac] if ghi_chu_doi_tac else [])
    hop_c4 = [kh.hop("loi_khuyen", k["ten_tru"]["dia"], nx_dia, huong_xu_ly=hd_dia, can_cu=cc_dia, ma=kh.ma_mau(MO_DUN, "dia", muc_dia))]
    if ghi_chu_doi_tac:
        hop_c4.append(kh.hop("loi_khuyen", "Góc nhìn phối hợp với người liên quan" if vi else "Counterparty synergy & role boundary",
                             ghi_chu_doi_tac, ma=kh.ma_mau(MO_DUN, "doi_tac")))
    c4 = kh.chuong("don_bay_khong_gian_va_doi_tac", k["chuong_tieu_de"]["c4"], doan_c4, hop=hop_c4, tom_tat=hd_dia)

    so_mo = sum(1 for x in nhip_12 if x["nhip"] == "day_manh")
    so_giu = sum(1 for x in nhip_12 if x["nhip"] == "phong_thu")
    loi_moi_rieng = {
        "c1": ket_luan_5s["cau_ket_luan"],
        "c2": ("Phân tích chi tiết điểm mạnh nội lực, hành bổ khuyết và mắt xích hệ quả bước hai."
               if vi else "Detailed breakdown of inner bandwidth, Five-Element support and second-order timing chains."),
        "c3": (f"Lịch hành động từng tháng trong 12 tháng tới ({so_mo} tháng thuận mở bước, {so_giu} tháng giữ nhịp) và 3 ngày đẹp Hoàng lịch."
               if vi else f"Month-by-month playbook across 12 months ({so_mo} Advance, {so_giu} Consolidate) plus 3 auspicious Almanac dates."),
        "c4": ("Hướng dẫn điều hoà không gian sống/làm việc theo Ngũ hành – Vận 9 và nguyên tắc phối hợp với người liên quan."
               if vi else "Practical workspace harmony by Five Elements / Period 9 and counterparty coordination rules."),
    }
    cac_ck = [("c1", c1), ("c2", c2), ("c3", c3), ("c4", c4)]
    ds_chuong = []
    for ma_k, ch_obj in cac_ck:
        ch_obj["moi_xem"] = {
            "diem_nhan": loi_moi_rieng[ma_k],
            "cau_hoi": k["chuong_cau_hoi"][ma_k],
            "so_doan": len(ch_obj["doan"]),
            "phut_doc": max(1, round(toan_bo.so_chu_chuong(ch_obj) / 200)),
        }
        ds_chuong.append({ck: cv for ck, cv in ch_obj.items() if cv is not None})

    cot_loi = [{**h, "tu_chuong": "buc_tranh_tam_tai"} for h in hop_c1]
    bc = {
        "mo_dun": MO_DUN,
        "phien_ban": kh.PHIEN_BAN,
        "ten": k["ten_bao_cao"],
        "ngay_xem": hom_nay.isoformat(),
        "trang_thai": k["trang_thai"],
        "source_id": k["source_id"],
        "school_id": k["school_id"],
        "ket": k["ket"],
        "mach": mach,
        "ten_mach": m_kb["ten"],
        "bac_dau_vao": bac,
        "lop_da_dung": lop_da_dung,
        "goi_y_nang_bac": goi_y_nang,
        "ket_luan_5_giay": ket_luan_5s,
        "ba_tru_tam_tai": ba_tru,
        "bieu_do_ngu_hanh": bd_nh,
        "nhip_12_thang": nhip_12,
        "ngay_dep_30_ngay": ngay_dep,
        **({"ung_dung_co_dien": u_co_dien} if u_co_dien else {}),
        "cot_loi": cot_loi,
        "chuong": ds_chuong,
    }
    return kh.ap_hoc(bc, trong_so, ca_nhan)
