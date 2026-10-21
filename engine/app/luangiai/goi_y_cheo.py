# -*- coding: utf-8 -*-
"""CTA-1 — "Đọc tiếp về bạn": khối gợi chéo cuối phần xem của mọi trang công cụ + dữ liệu thẻ "Bản đồ 5 mảng".

Tầng RULES, tất định, không LLM, không DB. Chỉ ĐỌC hàm tính (CALC) và kho tri thức có sẵn — không tính lại theo cách
khác, không sinh nghĩa mới:
  · Thần số   — `thanso.duong_doi` (theo quy ước web gửi) + từ khoá (`store.nghia_so`) + một nét từ KB chân dung
  · Tử vi     — an sao (`tuvi_an_sao`, cùng tiền xử lý `_DauVao` với lá số) → chính tinh cung Mệnh (độ sáng Nam phái)
                + câu đời thường KB `tuvi_doi_song_kb.sao_linh_vuc[sao][Mệnh]`
  · Bát tự    — nhật chủ (`battu.la_so` khi có giờ, không thì can ngày sinh) + hình ảnh KB `battu_kb.nhat_chu`
                + sức tự thân (`la_so.than`) khi có giờ
  · Phong thuỷ — mệnh quái (`phongthuy.menh_quai`, năm theo Lập xuân) + bốn hướng tốt (`bang_huong`)
  · Kinh Dịch — quẻ đầu ngày (cùng hàm với Hôm nay: giờ Tý, mọi người cùng quẻ) + "nói nôm na" KB
  · Hôm nay   — ngày cá nhân (`thanso_mo_rong.ngay_ca_nhan`) + chủ đề KB
  · Xem ngày  — giờ hoàng đạo trong ngày (`hoang_lich.ngay_xem`)
  · Hợp đôi   — đường đời + nét tình cảm KB chân dung

Câu dẫn + câu hỏi mở ở KB `goi_y_cheo_kb.json` (nháp AI). Biến thể chọn theo (trang đang xem, ngày xem) sao cho cùng một
hồ sơ, cùng ngày, một mảng không lặp đúng câu ở hai trang khác nhau. Thuật ngữ chỉ nằm ở `nhan`; câu chính đời thường.
"""
from __future__ import annotations

import datetime as dt
import json
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException

from app.calc import battu, lunar, phongthuy as pt, thanso, thanso_mo_rong as mr
from app.kb import battu_kb, store, thanso_v2, tuvi_doi_song_kb as kb_tv

# Trang công cụ có khối "Đọc tiếp" (mã mảng ở web = khoá này).
MANG_TRANG = ("than_so", "tu_vi", "bat_tu", "phong_thuy", "kinh_dich", "hop_doi", "hom_nay", "xem_ngay",
              "tuoi_lam_nha", "tuoi_xong_dat")
# Mảng có thẻ gợi chéo.
THE = ("than_so", "tu_vi", "bat_tu", "phong_thuy", "kinh_dich", "hop_doi", "hom_nay", "xem_ngay")
_SO_MAU = 3      # số câu dẫn / câu hỏi mỗi mảng dùng để xoay (KB có thể nhiều hơn)

_F = Path(__file__).parents[1] / "kb" / "data"


@dataclass(frozen=True)
class HoSo:
    ngay: int
    thang: int
    nam: int
    gio: str | None = None                 # "HH:MM"
    gioi_tinh: str | None = None           # "nam" | "nu"
    ho_ten: list[str] | None = field(default=None, hash=False, compare=False)
    noi_sinh: str | None = None
    vung: str | None = None                # "north" | "south"
    gio_mua_he: bool = False
    do_tin_gio: str | None = None          # "exact" | "approx" | "unknown" — unknown = coi như chưa có giờ
    lich: str = "viet"
    quy_uoc: str = "tong_het"

    @property
    def co_gio(self) -> bool:
        return bool(self.gio) and self.do_tin_gio != "unknown"


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads((_F / "goi_y_cheo_kb.json").read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _chan_dung() -> dict:
    return json.loads((_F / "thanso_chan_dung.json").read_text(encoding="utf-8"))["so"]


@lru_cache(maxsize=1)
def _que_hao() -> dict:
    return json.loads((_F / "kinhdich_hao.json").read_text(encoding="utf-8"))["que"]


@lru_cache(maxsize=1)
def _cum_cam() -> tuple[str, ...]:
    return tuple(kb_tv.cum_cam())


def _sach(s: str | None) -> bool:
    """Câu lấy từ KB khác có dùng được trong lời mời không (không cụm "giọng AI" / doạ)."""
    return bool(s) and not kb_tv.tim_cum_cam(s, list(_cum_cam()))


def _thuong(s: str) -> str:
    """Viết thường chữ đầu (chèn giữa câu sau dấu hai chấm / gạch)."""
    s = s.strip()
    return s[:1].lower() + s[1:] if s else s


def _bo_cham(s: str) -> str:
    return s.strip().rstrip(".").rstrip()


# --------------------------------------------------------------------------- dữ kiện từng mảng (đọc CALC + KB)
def _duong_doi(h: HoSo) -> int:
    return int(thanso.duong_doi(h.ngay, h.thang, h.nam, h.quy_uoc, giu_master=True))


def _dau_vao_la_so(h: HoSo):
    """Cùng tiền xử lý thời gian với lá số Tử vi / Bát tự (múi giờ lịch sử, nơi sinh, âm lịch Việt)."""
    from app.tuvi_api import TuanTrietInput, _DauVao
    inp = TuanTrietInput(birth_date=dt.date(h.nam, h.thang, h.ngay), birth_time=h.gio or "12:00",
                         gender=h.gioi_tinh or "nam", noi_sinh=h.noi_sinh, vung=h.vung, gio_mua_he=h.gio_mua_he,
                         lich=h.lich if h.lich in ("viet", "trung") else "viet")
    return _DauVao(inp)


@lru_cache(maxsize=256)
def _sao_menh(h: HoSo) -> dict | str:
    """→ {"sao": [...], "do_sang": str|None, "muon": bool} hoặc mã thiếu ("gio" | "noi_sinh")."""
    if not h.co_gio:
        return "gio"
    from app.calc import tuvi_an_sao, tuvi_do_sang_vn
    try:
        dv = _dau_vao_la_so(h)
    except HTTPException:
        return "noi_sinh"
    cal = dv.tb.calendar_dt
    ti = tuvi_an_sao.time_index(cal.hour, cal.minute)
    la = tuvi_an_sao.an_sao_tho(cal.date(), ti, h.gioi_tinh or "nam", "vi-VN", tz_lich=dv.tz_lich, **dv.tuy_chon)
    cung = la["palaces"]
    i = next(k for k, p in enumerate(cung) if p["name"] == "Mệnh")
    muon = not cung[i]["majorStars"]
    p = cung[(i + 6) % 12] if muon else cung[i]                  # vô chính diệu → mượn cung đối diện
    sao = [x["name"] for x in p["majorStars"]]
    return {"sao": sao, "do_sang": tuvi_do_sang_vn.do_sang(sao[0], p["earthlyBranch"]) if sao else None, "muon": muon}


@lru_cache(maxsize=256)
def _bat_tu(h: HoSo) -> dict:
    """→ {"can", "hanh", "than": "vượng"|"nhược"|"trung hoà"|None, "thieu": None|"gio"|"noi_sinh"}."""
    if h.co_gio:
        try:
            dv = _dau_vao_la_so(h)
            ls = battu.la_so(dv.tb.calendar_dt, h.gioi_tinh or "nam")
            return {"can": ls["nhat_chu"]["can"], "hanh": ls["nhat_chu"]["ngu_hanh"], "than": ls["than"]["ket_luan"],
                    "thieu": None}
        except HTTPException:
            thieu = "noi_sinh"
    else:
        thieu = "gio"
    can = lunar.can_chi_ngay(dt.date(h.nam, h.thang, h.ngay))[0]
    return {"can": can, "hanh": battu._nh_can(can), "than": None, "thieu": thieu}


def _cung_phi(h: HoSo) -> dict | None:
    if h.gioi_tinh not in ("nam", "nu"):
        return None
    mq = pt.menh_quai(h.nam, h.gioi_tinh, dt.date(h.nam, h.thang, h.ngay), "lap_xuan")
    bang = pt.bang_huong(mq["quai"])
    huong = {d: hg for hg, d in bang.items()}
    return {"quai": mq["quai"], "huong": huong["Sinh Khí"], "ds_huong": [huong[d] for d in pt.CAT]}


def _que_ngay(ngay_xem: dt.date) -> dict:
    from app.luangiai.hom_nay import _que_ngay as que
    q = que(ngay_xem)
    nn = (_que_hao().get(str(q["so"])) or {}).get("nom_na") or ""
    if "Nôm na:" in nn:
        nn = nn.split("Nôm na:", 1)[1]
    nn = nn.strip()
    if not _sach(nn):
        nn = q.get("loi_khuyen") or ""
    return {"so": q["so"], "ten": q["ten"], "nom_na": nn}


def _gio_dep(ngay_xem: dt.date) -> dict:
    from app.luangiai import hoang_lich as hl
    ds = hl.ngay_xem(ngay_xem)["gio_hoang_dao"]
    sang = [g for g in ds if int(g["khung"][:2]) >= 5] or ds
    return {"so_gio": len(ds), "khung": sang[0]["khung"]}


def _chu_de_ngay(so: int) -> str:
    s = thanso_v2.nghia_phu("ngay_ca_nhan", so) or ""
    return s.split(":", 1)[1].strip() if ":" in s else s


# --------------------------------------------------------------------------- dựng thẻ
def _bien_the(mang: str, trang: str, ngay_xem: dt.date) -> int:
    """0…8 — mỗi trang (trừ trang của chính mảng) một số khác nhau trong cùng ngày; đổi theo ngày."""
    trang_co = [p for p in MANG_TRANG if p != mang]
    return (trang_co.index(trang) + ngay_xem.toordinal()) % len(trang_co)


def _mau(m: dict, v: int) -> tuple[str, str]:
    return m["mo_dau"][v % _SO_MAU], m["cau_hoi"][(v // _SO_MAU) % _SO_MAU]


def _goc(mang: str) -> dict:
    m = _kb()["mang"][mang]
    return {"mang": mang, "ten": m["ten"], "bieu_tuong": m["bieu_tuong"], "duong": m["duong"],
            "source_id": m["source_id"], "school_id": m["school_id"], "trang_thai": _kb()["trang_thai"]}


def _the(mang: str, nhan: str, cau: str, cau_hoi: str, cta: str, ca_nhan: bool, can_them: str | None = None) -> dict:
    return {**_goc(mang), "nhan": nhan, "cau": " ".join(cau.split()), "cau_hoi": cau_hoi, "cta": cta,
            "ca_nhan": ca_nhan, "can_them": can_them}


def _chung(mang: str, nhan: str = "") -> dict:
    c = _kb()["mang"][mang]["chung"]
    return _the(mang, nhan or _kb()["mang"][mang]["ten"], c["cau"], c["cau_hoi"], c["cta"], False)


def _thieu(mang: str, khoa: str, can_them: str) -> dict:
    c = _kb()["mang"][mang][khoa]
    return _the(mang, _kb()["mang"][mang]["ten"], c["cau"], c["cau_hoi"], c["cta"], False, can_them)


def _net_than_so(so: int, v: int) -> str | None:
    cd = (_chan_dung().get(str(so)) or {}).get("tong_quan") or {}
    ds = [x for x in cd.get("diem_manh") or [] if _sach(x)]
    return _thuong(ds[(v // _SO_MAU) % len(ds)]) if ds else None


def _the_than_so(h: HoSo, v: int) -> dict:
    m = _kb()["mang"]["than_so"]
    so = _duong_doi(h)
    net = _net_than_so(so, v) or _thuong(store.nghia_so(so)["tu_khoa"])
    tk = _thuong((store.nghia_so(so) or {}).get("tu_khoa") or "")
    md, ch = _mau(m, v)
    return _the("than_so", m["nhan"].format(so=so), md.format(so=so, tu_khoa=tk, net=_bo_cham(net)),
                ch.format(so=so), m["cta"], True)


def _the_tu_vi(h: HoSo, v: int) -> dict:
    m = _kb()["mang"]["tu_vi"]
    sm = _sao_menh(h)
    if sm == "gio":
        return _thieu("tu_vi", "thieu_gio", "gio")
    if sm == "noi_sinh":
        return _thieu("tu_vi", "thieu_noi_sinh", "noi_sinh")
    assert isinstance(sm, dict)
    if not sm["sao"]:
        return _chung("tu_vi")
    nhom = "ham" if sm["do_sang"] == "Hãm" else "sang"
    o = kb_tv.sao_linh_vuc(sm["sao"][0], "Mệnh", nhom) or {}
    ung = [o.get(k) for k in ("manh", "de_vap") if _sach(o.get(k))]
    if not ung:
        return _chung("tu_vi")
    net = ung[(v // _SO_MAU) % len(ung)]
    md, ch = _mau(m, v)
    ten = ", ".join(sm["sao"])
    nhan = (m["nhan_muon"] if sm["muon"] else m["nhan"]).format(sao=ten)
    return _the("tu_vi", nhan, md.format(net=_thuong(net)), ch, m["cta"], True)


def _the_bat_tu(h: HoSo, v: int) -> dict:
    m = _kb()["mang"]["bat_tu"]
    b = _bat_tu(h)
    nc = battu_kb.nhat_chu(b["can"]) or {}
    if not nc.get("hinh_tuong"):
        return _chung("bat_tu")
    tc = next((x for x in (nc.get("tinh_chat"), nc.get("diem_manh")) if _sach(x)), None)
    if not tc:
        return _chung("bat_tu")
    md, ch = _mau(m, v)
    cau = md.format(hinh_tuong=nc["hinh_tuong"], tinh_chat=_bo_cham(tc))
    cau += " " + (m["than"].get(b["than"] or "", "") if b["than"] else m["thieu_gio_than"])
    return _the("bat_tu", m["nhan"].format(can=b["can"], hanh=b["hanh"]), cau, ch, m["cta"], True,
                b["thieu"] if not b["than"] else None)


def _the_phong_thuy(h: HoSo, v: int) -> dict:
    m = _kb()["mang"]["phong_thuy"]
    cp = _cung_phi(h)
    if cp is None:
        return _thieu("phong_thuy", "thieu_gioi_tinh", "gioi_tinh")
    md, ch = _mau(m, v)
    ds = ", ".join(cp["ds_huong"][:-1]) + " và " + cp["ds_huong"][-1]
    return _the("phong_thuy", m["nhan"].format(quai=cp["quai"], huong=cp["huong"]),
                md.format(huong=cp["huong"], ds_huong=ds), ch, m["cta"], True)


def _the_kinh_dich(ngay_xem: dt.date, v: int) -> dict:
    m = _kb()["mang"]["kinh_dich"]
    q = _que_ngay(ngay_xem)
    if not q["nom_na"]:
        return _chung("kinh_dich")
    md, ch = _mau(m, v)
    return _the("kinh_dich", m["nhan"].format(ten=q["ten"]), md.format(nom_na=q["nom_na"]), ch, m["cta"], False)


def _the_hop_doi(h: HoSo, v: int) -> dict:
    m = _kb()["mang"]["hop_doi"]
    so = _duong_doi(h)
    tc = (_chan_dung().get(str(so)) or {}).get("tinh_cam") or {}
    md, ch = _mau(m, v)
    net, nho = tc.get("cach_yeu"), tc.get("hop_kieu_nguoi") if v % _SO_MAU == 1 else tc.get("can_duoc")
    if not (_sach(net) and _sach(nho)):
        return _chung("hop_doi")
    return _the("hop_doi", m["nhan"].format(so=so), md.format(so=so, net=_thuong(net), net_nho=_thuong(nho)), ch,
                m["cta"], True)


def _the_hom_nay(h: HoSo, ngay_xem: dt.date, v: int) -> dict:
    m = _kb()["mang"]["hom_nay"]
    so = mr.ngay_ca_nhan(h.ngay, h.thang, ngay_xem.year, ngay_xem.month, ngay_xem.day)
    cd = _chu_de_ngay(so)
    if not cd:
        return _chung("hom_nay")
    md, ch = _mau(m, v)
    return _the("hom_nay", m["nhan"].format(so=so), md.format(so=so, chu_de=cd), ch, m["cta"], True)


def _the_xem_ngay(ngay_xem: dt.date, v: int) -> dict:
    m = _kb()["mang"]["xem_ngay"]
    g = _gio_dep(ngay_xem)
    md, ch = _mau(m, v)
    return _the("xem_ngay", m["nhan"].format(so_gio=g["so_gio"]), md.format(**g), ch, m["cta"], False)


def _dung_the(mang: str, h: HoSo | None, ngay_xem: dt.date, v: int) -> dict:
    if mang == "kinh_dich":
        return _the_kinh_dich(ngay_xem, v)
    if mang == "xem_ngay":
        return _the_xem_ngay(ngay_xem, v)
    if h is None:
        return _chung(mang)
    return {"than_so": _the_than_so, "tu_vi": _the_tu_vi, "bat_tu": _the_bat_tu, "phong_thuy": _the_phong_thuy,
            "hop_doi": _the_hop_doi}[mang](h, v) if mang != "hom_nay" else _the_hom_nay(h, ngay_xem, v)


def goi_y(h: HoSo | None, mang_hien_tai: str, ngay_xem: dt.date) -> dict:
    """Thẻ gợi chéo cho trang `mang_hien_tai`: mọi mảng khác, xoay thứ tự theo ngày; thẻ thiếu dữ liệu (cần thêm giờ /
    giới tính / nơi sinh) xếp sau. Web hiện 3 thẻ đầu."""
    if mang_hien_tai not in MANG_TRANG:
        raise ValueError(f"mang_hien_tai không hợp lệ: {mang_hien_tai}")
    ds = [c for c in THE if c != mang_hien_tai]
    lech = (ngay_xem.toordinal() + MANG_TRANG.index(mang_hien_tai)) % len(ds)
    ds = ds[lech:] + ds[:lech]
    the = [_dung_the(c, h, ngay_xem, _bien_the(c, mang_hien_tai, ngay_xem)) for c in ds]
    the.sort(key=lambda t: t["can_them"] is not None)          # sort ổn định: giữ thứ tự xoay trong từng nhóm
    k = _kb()
    return {"mang_hien_tai": mang_hien_tai, "ngay_xem": ngay_xem.isoformat(), "ca_nhan": h is not None, "the": the,
            "source_id": k["source_id"], "school_id": k["school_id"], "trang_thai": k["trang_thai"],
            "luu_y": "Gợi ý đọc tiếp — mỗi câu ghép từ con số đã tính và kho tri thức, để tự soi, không phải dự báo."}


# --------------------------------------------------------------------------- Bản đồ 5 mảng
def lua_chon_doan(so: int) -> list[int]:
    """Ba lựa chọn cho trò "Đoán số": đáp án + hai số 1–9 khác (tất định theo đáp án). Không phải phép tính huyền học."""
    goc = so if so <= 9 else int(thanso.rut_gon(so, giu_master=False))
    khac = [x for x in range(1, 10) if x not in (so, goc)]
    a = khac[(so * 7 + 3) % len(khac)]
    b = khac[(so * 5 + 1) % len(khac)]
    if b == a:
        b = khac[(khac.index(a) + 1) % len(khac)]
    ds = [so, a, b]
    r = so % 3
    return ds[r:] + ds[:r]


def ban_do_5_mang(h: HoSo, ngay_xem: dt.date) -> dict:
    """Năm mảnh của thẻ "Bản đồ 5 mảng": chỉ nhãn đã tính — KHÔNG ngày sinh, can chi năm, con giáp hay giờ sinh."""
    so = _duong_doi(h)
    b = _bat_tu(h)
    nc = battu_kb.nhat_chu(b["can"]) or {}
    sm = _sao_menh(h)
    cp = _cung_phi(h)
    q = _que_ngay(ngay_xem)
    sao = None
    if isinstance(sm, dict) and sm["sao"]:
        sao = {"nhan": ", ".join(sm["sao"]), "muon": sm["muon"]}
    kq = {
        "duong_doi": {"so": so, "tu_khoa": (store.nghia_so(so) or {}).get("tu_khoa")},
        "nhat_chu": {"can": b["can"], "hanh": b["hanh"], "nhan": f"{b['can']} {b['hanh']}",
                     "hinh_tuong": nc.get("hinh_tuong")},
        "sao_menh": sao,
        "cung_phi": {"quai": cp["quai"], "huong": cp["huong"]} if cp else None,
        "que_ngay": {"so": q["so"], "ten": q["ten"]},
        "doan": {"dung": so, "lua_chon": lua_chon_doan(so)},
    }
    kq["so_manh"] = sum(1 for k in ("duong_doi", "nhat_chu", "sao_menh", "cung_phi", "que_ngay") if kq[k])
    kq["thieu"] = [x for x, ok in (("gio", sao is not None or h.co_gio), ("gioi_tinh", cp is not None)) if not ok]
    return kq
