# -*- coding: utf-8 -*-
"""EN-ALL GĐ 7 (nhóm H) — hỏi đáp Thần số TIẾNG ANH đầy đủ: MỘT bộ phân loại + MỘT gói bằng chứng với bản Việt.

Câu tiếng Anh → (1) bộ chặn an toàn chung trên CÂU GỐC (`hoidap.chung.dac_biet` → `luangiai/an_toan.py`, có bộ tiếng Anh);
(2) dịch Ý sang cụm từ khoá tiếng Việt không dấu (`hoidap/en_gloss_ts`) rồi phân loại bằng ĐÚNG `luangiai.hoi.phan_loai` của
bản Việt (chạy ở ngữ cảnh tiếng Việt — từ khoá KB là chữ Việt); câu kiến thức (cách tính, phái, một con số được nêu tên) →
mục giải thích / từ điển của KB; (3) gói bằng chứng dựng bằng `hoi.goi_bang_chung` (KB đọc qua bản phủ tiếng Anh);
(4) lời đáp: hai lượt "bản Việt quyết" (`doi_song_khuon.vi_quyet_dinh`) — lượt Việt dựng đúng lời đáp của `narrative.hoi_van`
(thứ tự đoạn `chung.tra_loi_truoc`, đoạn mở đầu `mo_dau.so_mo` + `dat_dau`) và ghi quyết định; lượt Anh dựng lời bằng mẫu câu
`L()` (`kb/data/en/loi/hoi_thanso.json`) và theo đúng các quyết định ấy. Không LLM, không lưu, không trả lại câu hỏi.

Chỉ chạy khi ngôn ngữ lượt gọi khác tiếng Việt (`main.api_hoi`); bản Việt vẫn đi `narrative.hoi_van` (không đổi chữ nào).
"""
from __future__ import annotations

import copy
import datetime as dt
import re

from app import ngon_ngu
from app.config import hom_nay_vn
from app.kb import store, thanso_v2 as kb2
from app.kb.loi import L
from app.luangiai import doi_song_khuon as _dsk
from app.luangiai import hoi

_THANG_EN = ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
             "November", "December")
_THU_EN = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
CHAN = ("an_toan", "tu_choi_nhe", "dan_huong")


# --------------------------------------------------------------------------- #
# Chữ nhỏ dùng chung
# --------------------------------------------------------------------------- #
def _vt(vi_tri: str | None) -> str:
    return L(f"thanso.vi_tri.{vi_tri}", vi_tri) if vi_tri else L("tsq.vt.con_so", "con số")


def _cua(vai: str) -> str:
    """Sở hữu của người được nói tới ("your", "their"…)."""
    return {"ban": L("tsq.vai.ban", "của bạn"), "nguoi_kia": L("tsq.vai.nguoi_kia", "của người ấy"),
            "con": L("tsq.vai.con", "của bé"), "so_a": L("tsq.vai.so_a", "của người thứ nhất"),
            "so_b": L("tsq.vai.so_b", "của người thứ hai")}.get(vai, L("tsq.vai.ban", "của bạn"))


def _ai(vai: str) -> str:
    return {"ban": L("tsq.ai.ban", "bạn"), "nguoi_kia": L("tsq.ai.nguoi_kia", "người ấy"), "con": L("tsq.ai.con", "bé"),
            "so_a": L("tsq.ai.so_a", "người thứ nhất"), "so_b": L("tsq.ai.so_b", "người thứ hai")}.get(vai, L("tsq.ai.ban", "bạn"))


def _ngay(iso: str) -> str:
    d = dt.date.fromisoformat(iso)
    return L("tsq.ngay", "Ngày {d}/{m}/{y}", thu=_THU_EN[d.weekday()], d=d.day, m=d.month, ten_thang=_THANG_EN[d.month - 1],
             y=d.year)


def _thang(thang: int, nam: int | None) -> str:
    if nam:
        return L("tsq.thang_nam", "Tháng {thang}/{nam}", thang=thang, nam=nam, ten=_THANG_EN[thang - 1])
    return L("tsq.thang", "Tháng {thang}", thang=thang, ten=_THANG_EN[thang - 1])


def _cham(s: str | None) -> str:
    return (s or "").strip().rstrip(".").strip()


def _thuong(s: str) -> str:
    s = (s or "").strip()
    return s[:1].lower() + s[1:] if s[:2] != "I " and not re.match(r"[A-Z]{2}|I'", s) else s


# --------------------------------------------------------------------------- #
# Đoạn văn từ một mục bằng chứng (song song `narrative.hoi_van._doan`)
# --------------------------------------------------------------------------- #
def _doan(m: dict) -> tuple[str, str | None]:
    """→ (đoạn văn tiếng Anh, câu tự soi nếu có). Cùng khuôn mục với bản Việt."""
    l = m["loai"]
    if l == "linh_vuc":
        return (L("tsq.d.linh_vuc", "{lv} — {vt} {so} {cua}: {xu_huong} Mặt tối cần để ý: {mat_toi} Gợi ý: {goi_y}",
                  lv=m["ten_linh_vuc"], cua=_cua(m["vai"]), vt=_vt(m.get("vi_tri")), so=m["so"], xu_huong=m["xu_huong"],
                  mat_toi=m["mat_toi"], goi_y=m["goi_y"]), m.get("cau_tu_soi"))
    if l == "chan_dung":
        if m["mat"] == "cong_viec":
            return (L("tsq.d.cd_cong_viec", "Chân dung theo số chủ đạo {so} {cua} — công việc: thế mạnh là {the_manh} Môi "
                      "trường hợp: {moi_truong} Hướng nghề hay được gợi ý: {nghe}. Cái bẫy cần tránh: {cai_bay} Với tiền bạc: "
                      "{tien_bac}", so=m["so"], cua=_cua(m["vai"]), the_manh=m["the_manh"], moi_truong=m["moi_truong"],
                      nghe=" · ".join(m["nghe"]), cai_bay=m["cai_bay"], tien_bac=m["tien_bac"]), None)
        if m["mat"] == "tinh_cam":
            return (L("tsq.d.cd_tinh_cam", "Chân dung theo số chủ đạo {so} {cua} — tình cảm: {cach_yeu} Điều cần được: {can_duoc} "
                      "Hợp với: {hop} Dấu hiệu lệch nhịp: {lech}", so=m["so"], cua=_cua(m["vai"]), cach_yeu=m["cach_yeu"],
                      can_duoc=m["can_duoc"], hop=m["hop_kieu_nguoi"], lech=m["dau_hieu_lech"]), None)
        return (L("tsq.d.cd_tong_quan", "Chân dung theo số chủ đạo {so} {cua}: {chan_dung} Điểm mạnh: {manh}. Điểm mù: {mu}. "
                  "Khi căng thẳng: {cang}", so=m["so"], cua=_cua(m["vai"]), chan_dung=m["chan_dung"],
                  manh="; ".join(_cham(x) for x in m["diem_manh"]), mu="; ".join(_cham(x) for x in m["diem_mu"]),
                  cang=m["khi_cang_thang"]), None)
    if l == "trong_vai":
        return (L("tsq.d.trong_vai", "Với {quan_he}, {ai} (số chủ đạo {so}) thường: {vai} Cần: {can} Nên tránh: {tranh} "
                  "Cách nói chuyện hợp: {cach_noi}", quan_he=_thuong(m["ten_quan_he"]), ai=_ai(m["vai"]), so=m["so"],
                  vai=m["vai_mo_ta"], can=m["can"], tranh=m["tranh"], cach_noi=m["cach_noi"]), None)
    if l == "cap_so":
        return (L("tsq.d.cap_so", "Cặp {vt} {a} và {b} (tra theo cặp {cap}): điểm hoà — {hoa} Điểm dễ va — {va} Hai người có "
                  "thể: {cung_lam}", vt=m["ten_vi_tri"], a=m["so_a"], b=m["so_b"], cap=m["cap"], hoa=m["hoa"], va=m["va"],
                  cung_lam=m["cung_lam"]), None)
    if l == "nam_ca_nhan":
        dau = (L("tsq.d.nam_dau", "Năm {nam} là năm cá nhân {so} của bạn", nam=m["nam"], so=m["so"]) if m.get("nam")
               else L("tsq.d.nam_dau_so", "Năm cá nhân {so}", so=m["so"]))
        return (L("tsq.d.nam", "{dau} — {chu_de}: {y_nghia} Nên: {nen} Tránh: {tranh}", dau=dau, chu_de=m["chu_de"],
                  y_nghia=m["y_nghia"], nen=m["nen"], tranh=m["tranh"]), None)
    if l == "thang_ca_nhan":
        th = (L("tsq.d.thang_dau", "{thang} là tháng cá nhân {so}", thang=_thang(m["thang"], m.get("nam")), so=m["so"])
              if m.get("thang") else L("tsq.d.thang_dau_so", "Tháng cá nhân {so}", so=m["so"]))
        return L("tsq.d.thang", "{th} ({chu_de}): {nen} Tránh: {tranh}", th=th, chu_de=m["chu_de"], nen=m["nen"],
                 tranh=m["tranh"]), None
    if l == "thang_mo_dau":
        if not m["cac_thang"]:
            return L("tsq.d.mo_dau_khong", "Trong 12 tháng tới chưa có tháng cá nhân 1 — nhịp mở đầu theo thần số."), None
        ds = ", ".join(_thang(int(x.split("/")[0]), int(x.split("/")[1])) for x in m["cac_thang"])
        return (L("tsq.d.mo_dau", "Tháng cá nhân 1 ({chu_de}) của bạn trong 12 tháng tới: {ds}. {nen} Tránh: {tranh}",
                  chu_de=m["chu_de"], ds=ds, nen=m["nen"], tranh=m["tranh"]), None)
    if l == "ngay_ca_nhan":
        if m.get("ngay"):
            return L("tsq.d.ngay", "{ngay} — {y_nghia}", ngay=_ngay(m["ngay"]), y_nghia=m["y_nghia"]), None
        return m["y_nghia"], None
    if l == "dinh_cao":
        den = (L("tsq.d.tuoi_den", "{tu}–{den} tuổi", tu=m["tu_tuoi"], den=m["den_tuoi"]) if m["den_tuoi"]
               else L("tsq.d.tuoi_tu", "từ {tu} tuổi", tu=m["tu_tuoi"]))
        hien = L("tsq.d.hien_tai", " (giai đoạn hiện tại)") if m["hien_tai"] else ""
        return (L("tsq.d.dinh_cao", "Đỉnh cao {dinh}, số {so}, {den}{hien} — {chu_de}: {y_nghia} Bóng tối: {bong_toi}",
                  dinh=m["dinh"], so=m["so"], den=den, hien=hien, chu_de=m["chu_de"], y_nghia=m["y_nghia"],
                  bong_toi=m["bong_toi"]), m.get("phan_chung"))
    if l == "thu_thach":
        return (L("tsq.d.thu_thach", "Thử thách chính số {so} — {mo_ta}: {y_nghia} Cách vượt: {cach_vuot}", so=m["so"],
                  mo_ta=m["mo_ta"], y_nghia=m["y_nghia"], cach_vuot=m["cach_vuot"]), None)
    if l == "mui_ten":
        if m["trong"]:
            return L("tsq.d.mui_ten_trong", "{ten} ({ma_mt}): {y_nghia} Gợi ý: {goi_y}", ten=m["ten"], ma_mt=m["ma"],
                     y_nghia=m["y_nghia"], goi_y=m["goi_y"]), None
        return L("tsq.d.mui_ten", "{ten} ({ma_mt}): {y_nghia} Mặt tối: {mat_toi}", ten=m["ten"], ma_mt=m["ma"],
                 y_nghia=m["y_nghia"], mat_toi=m["mat_toi"]), None
    if l == "o_so":
        lan = (L("tsq.d.o_khong", "không có") if m["so_lan"] == 0
               else L("tsq.d.o_lan", "có {n} lần", n=m["so_lan"]) if m["so_lan"] > 1 else L("tsq.d.o_mot", "có 1 lần"))
        return L("tsq.d.o_so", "Ô số {so} ({y_nghia_o}) — ngày sinh {lan}: {mo_ta}", so=m["so"],
                 y_nghia_o=_cham(m["y_nghia_o"]), lan=lan, mo_ta=m["mo_ta"]), None
    if l == "no_nghiep":
        return L("tsq.d.no_nghiep", "{ten}: {y_nghia} Gợi ý: {goi_y}", ten=m["ten"], y_nghia=m["y_nghia"],
                 goi_y=m["goi_y"]), None
    if l in ("khong_no_nghiep", "bai_hoc_nghiep", "ngay_sinh", "truong_thanh", "thai_do"):
        return m["noi_dung"], None
    if l == "giai_thich":
        td = (m.get("tieu_de") or "").strip()
        td = td if td.endswith(("?", ":")) else _cham(td) + ":"
        return L("tsq.d.giai_thich", "{tieu_de} {noi_dung}", tieu_de=td, noi_dung=m["noi_dung"]), None
    if l == "nghia_so":
        doan = L("tsq.d.nghia_so", "Số {so} — {tu_khoa}. Mặt tối: {mat_toi}. Câu hỏi ngược: {phan_chung}", so=m["so"],
                 tu_khoa=_cham(m["tu_khoa"]), mat_toi=_cham(m["mat_toi"]), phan_chung=m["phan_chung"])
        if m.get("chan_dung"):
            doan += " " + m["chan_dung"]
        return doan, None
    if l == "chaldea":
        g, k = m.get("nghia_goc") or {}, m.get("nghia_kep") or {}
        if k:
            dau = L("tsq.d.chaldea_kep", "{ten} theo phái Chaldea: số kép {kep} ({bieu_tuong}), rút về số gốc {goc}",
                    ten=m["ten"], kep=m["kep"], bieu_tuong=k["bieu_tuong"], goc=m["goc"])
        else:
            dau = L("tsq.d.chaldea_goc", "{ten} theo phái Chaldea: số gốc {goc}", ten=m["ten"], goc=m["goc"])
        if g:
            dau += L("tsq.d.chaldea_hanh_tinh", " — {ten} ({hanh_tinh})", ten=g["ten"], hanh_tinh=g["hanh_tinh"])
        than = k.get("xu_huong") or g.get("xu_huong", "")
        toi = k.get("mat_toi") or g.get("mat_toi")
        return (dau + ". " + than + (L("tsq.d.mat_toi", " Mặt tối cần để ý: {x}", x=toi) if toi else ""),
                k.get("cau_tu_soi") or g.get("cau_tu_soi"))
    if l == "tong_hop":
        toi = _cham(m["mat_toi"])
        return (L("tsq.d.tong_hop", "Điểm chung giữa các phái: số {goc} gặp ở {lan} nguồn tính độc lập ({vi_tri}) — {tu_khoa}.",
                  goc=m["goc"], lan=m["lan"], vi_tri="; ".join(m["vi_tri"]), tu_khoa=_cham(m["tu_khoa"]))
                + (L("tsq.d.mat_toi_cham", " Mặt tối cần để ý: {x}.", x=toi) if toi else ""), m.get("phan_chung"))
    return "", None


def van_template(goi: dict) -> str:
    """Song song `hoi_van.van_template`: cùng số đoạn (≤ 6 mục, tự soi, lưu ý, lời kết) để quyết định thứ tự đoạn của bản
    Việt áp được cho bản Anh."""
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    if not goi["muc"]:
        return hoi.kb.mau("khong_ro")
    doan, soi = [], []
    for m in goi["muc"][:6]:
        d, s = _doan(m)
        if d:
            doan.append(d)
        if s and len(soi) < 2 and s not in soi:
            soi.append(s)
    if soi:
        doan.append(L("tsq.soi", "Câu hỏi để tự soi: {x}", x=" ".join(soi)))
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(L("tsq.ket", "Đây là góc nhìn tham khảo văn hoá để bạn tự soi, không phải lời tiên đoán về đời bạn."))
    return "\n\n".join(doan)


# --------------------------------------------------------------------------- #
# Đoạn mở đầu "trả lời trước" (song song `hoidap.mo_dau.so_mo`, lời tiếng Anh)
# --------------------------------------------------------------------------- #
def _so_phan(m: dict) -> tuple[str, str, str] | None:
    from app.hoidap import mo_dau as md  # noqa: PLC0415
    l = m.get("loai")
    if m.get("vai", "ban") != "ban":
        return None
    if l == "linh_vuc":
        return (L("tsq.sp.linh_vuc", "nhìn từ {vt} {so} của bạn, {x}", vt=_vt(m.get("vi_tri")), so=m["so"],
                  x=_thuong(_cham(m["xu_huong"]))), m.get("mat_toi", ""), m.get("goi_y", ""))
    if l == "chan_dung":
        so = m["so"]
        if m.get("mat") == "cong_viec":
            return (L("tsq.sp.cong_viec", "số chủ đạo {so} của bạn mạnh ở {x}", so=so, x=_thuong(_cham(m["the_manh"]))),
                    m.get("cai_bay", ""),
                    L("tsq.sp.moi_truong", "chọn môi trường {x}", x=_thuong(_cham(m["moi_truong"]))) if m.get("moi_truong") else "")
        if m.get("mat") == "tinh_cam":
            return (L("tsq.sp.tinh_cam", "với số chủ đạo {so}, {x}", so=so, x=_thuong(_cham(m["cach_yeu"]))),
                    m.get("dau_hieu_lech", ""),
                    L("tsq.sp.can_duoc", "nói rõ điều bạn cần: {x}", x=_thuong(_cham(m["can_duoc"]))) if m.get("can_duoc") else "")
        dm = (m.get("diem_mu") or [""])[0]
        return (L("tsq.sp.tong_quan", "với số chủ đạo {so}, {x}", so=so, x=_thuong(_cham(md.cau(m.get("chan_dung"))))),
                dm, m.get("khi_cang_thang", ""))
    if l == "thu_thach":
        return (L("tsq.sp.thu_thach", "thử thách chính của bạn là số {so} ({mo_ta}): {x}", so=m["so"],
                  mo_ta=_thuong(_cham(m["mo_ta"])), x=_thuong(_cham(md.cau(m["y_nghia"])))), "", m.get("cach_vuot", ""))
    if l == "o_so":
        lan = L("tsq.d.o_khong", "không có") if m["so_lan"] == 0 else (
            L("tsq.d.o_lan", "có {n} lần", n=m["so_lan"]) if m["so_lan"] > 1 else L("tsq.d.o_mot", "có 1 lần"))
        return (L("tsq.sp.o_so", "ô số {so} ({y}) trong ngày sinh của bạn {lan}: {x}", so=m["so"], y=_thuong(_cham(m["y_nghia_o"])),
                  lan=lan, x=_thuong(_cham(m["mo_ta"]))), "", "")
    if l == "mui_ten":
        return (L("tsq.sp.mui_ten", "{ten} trong biểu đồ ngày sinh: {x}", ten=m["ten"], x=_thuong(_cham(m["y_nghia"]))),
                m.get("mat_toi", ""), m.get("goi_y", ""))
    if l == "dinh_cao" and (m.get("hien_tai") or m.get("_tiep")):
        den = (L("tsq.d.tuoi_den", "{tu}–{den} tuổi", tu=m["tu_tuoi"], den=m["den_tuoi"]) if m.get("den_tuoi")
               else L("tsq.d.tuoi_tu", "từ {tu} tuổi", tu=m["tu_tuoi"]))
        dang = L("tsq.sp.dc_tiep", "giai đoạn kế tiếp của bạn là") if m.get("_tiep") else L("tsq.sp.dc_dang", "bạn đang ở")
        return (L("tsq.sp.dinh_cao", "{dang} đỉnh cao {dinh} (số {so}, {den}) — {chu_de}: {x}", dang=dang, dinh=m["dinh"],
                  so=m["so"], den=den, chu_de=_thuong(_cham(m["chu_de"])), x=_thuong(_cham(md.cau(m["y_nghia"])))),
                m.get("bong_toi", ""), "")
    if l == "no_nghiep":
        return L("tsq.sp.no_nghiep", "{ten}: {x}", ten=m["ten"], x=_thuong(_cham(md.cau(m["y_nghia"])))), "", m.get("goi_y", "")
    if l == "ngay_sinh" and m.get("noi_dung"):
        return (L("tsq.sp.ngay_sinh", "số ngày sinh {ngay} của bạn cho thấy {x}", ngay=m.get("ngay"),
                  x=_thuong(_cham(md.cau(re.sub(r"^(?:Day|Ngày) \d+\s*[:—-]\s*", "", m["noi_dung"]), 2)))), "", "")
    if l in ("bai_hoc_nghiep", "thai_do", "truong_thanh") and m.get("noi_dung"):
        return _thuong(_cham(md.cau(m["noi_dung"], 2))), "", ""
    return None


_TEN_LV = {"ban_than": ("tsq.lv.ban_than", "con người bạn"), "su_nghiep": ("tsq.lv.su_nghiep", "công việc"),
           "tai_chinh": ("tsq.lv.tai_chinh", "chuyện tiền bạc"), "tinh_yeu": ("tsq.lv.tinh_yeu", "tình cảm"),
           "gia_dinh": ("tsq.lv.gia_dinh", "gia đình"), "con_cai": ("tsq.lv.con_cai", "con cái"),
           "suc_khoe": ("tsq.lv.suc_khoe", "sức khoẻ và nhịp sống"), "hoc_tap": ("tsq.lv.hoc_tap", "học tập"),
           "ban_be_xa_hoi": ("tsq.lv.ban_be", "bạn bè và các mối quan hệ"), "cuoc_song": ("tsq.lv.cuoc_song", "nhịp sống"),
           "thoi_van": ("tsq.lv.thoi_van", "thời điểm"), "tam_linh": ("tsq.lv.tam_linh", "bài học của bạn"),
           "ten_goi": ("tsq.lv.ten_goi", "tên gọi")}


def _ten_lv(lv: str | None) -> str:
    ma, vi = _TEN_LV.get(lv or "", ("tsq.lv.mac_dinh", "con số của bạn"))
    return L(ma, vi)


def _con_hoi(t: str, goc: str) -> bool:
    """Câu về CON (thi cử, nuôi dạy…) mà gói đọc con số của người hỏi (không có ngày sinh của con)."""
    return bool(re.search(r"\bcon (trai|gai)? ?toi\b|\bcon toi\b", t)) and not re.search(r"\b(19|20)\d\d\b", goc or "")


def _mo_dau(goi: dict, pl: dict, goc: str, ngay_xem: dt.date, dau_muc: dict | None, them: list[dict]) -> str | None:
    """Đoạn mở đầu bản Anh — cùng điều kiện, cùng nguồn chữ (mục của gói, KB `chu_y_kb`) với `mo_dau.so_mo`."""
    from app.hoidap import hieu_cau, mo_dau as md  # noqa: PLC0415
    muc = goi.get("muc") or []
    t = pl["cau_chuan_hoa"]
    if goi.get("can_them") or not muc or pl.get("xu_ly") not in ("tra_loi", "tra_loi_kem_luu_y") \
            or pl.get("doi_tuong") not in (None, "ban_than") or pl.get("linh_vuc") in ("ky_thuat", "hop_doi") \
            or goi.get("thu_tu_co_dinh"):
        return None
    if md.khong_mo(t, goc):
        return md.dong_cam(md.dieu_hoi(t, t), t + " " + (goc or "").lower())
    dieu = md.dieu_hoi(t, t, goc=t)
    con = bool((dieu or {}).get("con")) or _con_hoi(t, goc)
    sang_so = "" if con else next(
        (p[0] for m in ([dau_muc] if dau_muc else []) + muc
         if (m or {}).get("loai") in ("linh_vuc", "chan_dung", "dinh_cao") and (p := _so_phan(m)) and p[0]), "")
    if hieu_cau.kieu(t) == "kien_thuc" or (not dieu and md._co(t, [r"(?<!\w)(nguoi )?so (chu dao |duong doi )?\d{1,2}(?!\d)"])):
        return None
    if con and md.mang_chu_y(dieu, t, goc) == "hoc_hanh":
        # câu về kỳ thi của con: không đọc con số của cha mẹ như thể nói về con — việc cho kỳ thi + ranh giới (KB)
        phan = md.hai_mat([L("tsq.md.con_khong_so", "Con số của bạn nói về bạn, không nói về con; muốn xem riêng cho con, "
                                                     "hãy nhập ngày sinh của con.")], dieu, t, t, viec_san=False, goc=goc)
        return f"{md.dau_cau(dieu, _ten_lv('con_cai'))}: {md.ghep(*phan)}"
    khong_dt = L("hoi.md.khong_dau_tu", md.KHONG_DAU_TU)
    khong_q = L("tsq.md.khong_quyet", md.KHONG_QUYET_SO)
    cy_dau = md.cy_lo(muc)
    if cy_dau:
        from app.kb import chu_y_kb as _cykb  # noqa: PLC0415
        phan = [_cykb.mau("thanso_dau"), md.bo_dau_cham(cy_dau["cau_nam"])]
        x = next((p for p in (_so_phan(m) for m in ([dau_muc] if dau_muc else []) + muc) if p), None)
        if x and x[0]:
            phan.insert(1, L("hoi.md.diem_manh", "Điểm mạnh của bạn: ") + x[0])
        if md.hoi_dau_tu(t, dieu):
            phan.append(khong_dt)
        if md.la_quyet_dinh(t):
            phan.append(khong_q)
        phan = md.hai_mat(phan, dieu, t, t, goc=goc, sang=sang_so)
        return f"{md.ve_mang(cy_dau['mang'])}: {md.thuong(md.ghep(*phan))}"
    moc = None
    tg = hieu_cau.thoi_gian(t, ngay_xem)
    hoi_moc = bool(tg) or md._co(t, [r"(nam|thang|ngay) ca nhan", r"nam nay", r"thang nay", r"hom nay", r"ngay mai"])
    phan: list[str] = []
    ba = None
    if hoi_moc:
        ds = [m for loai in ("ngay_ca_nhan", "thang_ca_nhan", "nam_ca_nhan") for m in muc if m.get("loai") == loai][:3]
        ba = [d for d in (_doan(m)[0] for m in ds) if d] or None
    if ba:
        if tg:
            x = tg[0]
            moc = (L("tsq.md.moc_thang", "tháng {thang}/{nam}", thang=x["thang"], nam=x["nam"], ten=_THANG_EN[x["thang"] - 1])
                   if x.get("thang") else L("tsq.md.moc_nam", "năm {nam}", nam=x["nam"]))
        phan += ba
        cy = next((m for m in muc if m.get("ma") == "chu_y_nam" and m.get("lo_ro") and m.get("cau_nam")), None)
        if cy:
            phan.append(md.bo_dau_cham(cy["cau_nam"]))
        if md.hoi_dau_tu(t, dieu):
            phan.append(khong_dt)
        if md.la_quyet_dinh(t):
            phan.append(khong_q)
        phan = md.hai_mat(phan, dieu, t, t, viec_san=False, goc=goc, sang=sang_so)
        return f"{md.dau_cau(dieu, _ten_lv(pl.get('linh_vuc')), moc)}: {md.ghep(*phan)}"
    ung = []
    if md._co(t, [r"tiep theo", r"ke tiep", r"sap toi", r"sau nay"]):
        dc = [m for m in muc if m.get("loai") == "dinh_cao"]
        i = next((k for k, m in enumerate(dc) if m.get("hien_tai")), None)
        if i is not None and i + 1 < len(dc):
            ung.append({**dc[i + 1], "_tiep": True})
    if md._co(t, md._HOI_TRONG):
        ung += [m for m in muc if (m.get("loai") == "o_so" and m.get("so_lan") == 0)
                or (m.get("loai") == "mui_ten" and m.get("trong"))]
    x_them = next((p for p in (_so_phan(m) for m in (them or [])) if p), None)
    if x_them and not ung:
        phan.append(x_them[0])
    nguon = ung + ([dau_muc] if dau_muc else []) + muc
    x = next((p for p in (_so_phan(m) for m in nguon) if p), None) or x_them
    if not x:
        return None
    chinh, vap, viec = x
    if x is not x_them or not phan:
        phan.append(chinh)
    phan += [L("tsq.md.vap", "Dễ vấp: {x}", x=_thuong(_cham(vap))) if vap else "",
             L("tsq.md.viec", "Việc nên làm: {x}", x=_thuong(_cham(viec))) if viec else ""]
    cy = next((m for m in muc if m.get("ma") == "chu_y_nam" and m.get("lo_ro") and m.get("cau_nam")), None)
    if cy:
        phan.append(md.bo_dau_cham(cy["cau_nam"]))
    if (dieu or {}).get("mang") == "suc_khoe":
        phan.append(L("tsq.md.bac_si", "Lời này không thay lời bác sĩ hay chuyên gia tâm lý"))
    if md.hoi_dau_tu(t, dieu):
        phan.append(khong_dt)
    if md.la_quyet_dinh(t):
        phan.append(khong_q)
    phan = md.hai_mat(phan, dieu, t, t, viec_san=False, goc=goc, sang=sang_so)
    return f"{md.dau_cau(dieu, _ten_lv(pl.get('linh_vuc')), moc)}: {md.thuong(md.ghep(*phan))}"


# --------------------------------------------------------------------------- #
# Hai lượt "bản Việt quyết"
# --------------------------------------------------------------------------- #
def _them_mo_dau(goi: dict, pl: dict, nguoi: dict, ngay_xem: dt.date) -> list[dict]:
    """Mục KB của đúng điều được hỏi mà gói chưa có (cùng hàm bản Việt `hoi_van._mo_dau_so`)."""
    from app.hoidap import mo_dau as md  # noqa: PLC0415
    from app.luangiai import noi_dau  # noqa: PLC0415
    if goi.get("thu_tu_co_dinh") or pl.get("so_nhac", {}).keys() & {"duong_doi", "su_menh", "linh_hon", "nhan_cach"}:
        return []
    t = pl["cau_chuan_hoa"]
    ma_nd = md.NOI_DAU_THEO_MA.get((md.dieu_hoi(t, t) or {}).get("ma"))
    return (noi_dau.muc_theo_ma(goi, ma_nd, nguoi, ngay_xem) if ma_nd
            else md.so_bo_sung(goi, t, t, nguoi, ngay_xem))


def _dung(pl: dict, goc: str, nguoi: dict, nguoi_kia: dict | None, ngay_xem: dt.date, phai: str) -> tuple[dict, str]:
    """Gói bằng chứng + lời đáp theo ngôn ngữ hiện tại. Lượt Việt = đúng lời của `hoi_van` (ghi quyết định thứ tự đoạn /
    đoạn mở đầu); lượt Anh theo các quyết định đó."""
    from app.hoidap import chung, mo_dau as md  # noqa: PLC0415
    from app.narrative import hoi_van  # noqa: PLC0415
    pl = copy.deepcopy(pl)
    goi = hoi.goi_bang_chung(pl, nguoi, nguoi_kia, ngay_xem)
    if phai == "chaldea":
        goi = hoi_van._goi_chaldea(goi, pl, nguoi)
        if goi.get("luu_y") and hoi_van.LUU_Y_CHALDEA in goi["luu_y"]:
            goi["luu_y"] = " ".join(x for x in (goi["luu_y"].replace(hoi_van.LUU_Y_CHALDEA, "").strip(),
                                                L("tsq.luu_y_chaldea", hoi_van.LUU_Y_CHALDEA)) if x)
    elif phai == "tong_hop":
        goi = hoi_van._goi_tong_hop(goi, pl, nguoi, ngay_xem)
    viet = ngon_ngu.la_viet()
    tmpl = hoi_van.van_template(goi) if viet else van_template(goi)
    if not goi.get("thu_tu_co_dinh"):
        tmpl = chung.tra_loi_truoc(tmpl, pl["cau_chuan_hoa"], khoa=("hoi.ts", "truoc"))
    if pl["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y") and phai != "chaldea":
        ds = _them_mo_dau(goi, pl, nguoi, ngay_xem)
        them = _dsk.quyet(("hoi.ts", "them"), [m.get("ma") or m.get("loai") for m in ds])
        them_ds = [m for m in ds if (m.get("ma") or m.get("loai")) in them]
        dau = tmpl.split("\n\n")[0]
        lam = hoi_van._doan if viet else _doan
        dau_muc = next((m for m in goi["muc"] if lam(m)[0] == dau), None)
        if viet:
            mo = md.so_mo(goi, pl["cau_chuan_hoa"], pl["cau_chuan_hoa"], ngay_xem, dau_muc, them_ds,
                          doan_fn=lambda m: hoi_van._doan(m)[0])
        else:
            mo = _mo_dau(goi, pl, goc, ngay_xem, dau_muc, them_ds)
        if mo and them_ds:
            goi["muc"].extend(them_ds)
            hoi._ket(goi)
        tmpl = md.dat_dau(tmpl, mo, goi, khoa=("hoi.ts", "dat"))
    return goi, tmpl


_dung_theo_vi = _dsk.vi_quyet_dinh(_dung)


# --------------------------------------------------------------------------- #
# Câu kiến thức
# --------------------------------------------------------------------------- #
_KT_MUC = {"nguon_goc": (["nguon_goc"], []), "do_tin": (["do_tin"], []), "phai": ([], ["pitago", "chaldea"]),
           "hai_cach": (["cach_tinh_duong_doi"], ["so_duong_doi"]), "so_cai": (["so_cai"], []),
           "cach_tinh": (["cach_tinh_duong_doi", "ba_chi_so_ten"], []), "no_nghiep": (["no_nghiep"], ["no_nghiep"]),
           "nam_ca_nhan": (["nam_ca_nhan"], ["nam_ca_nhan"]), "dinh_cao": (["dinh_cao_thu_thach"], ["dinh_cao"]),
           "bieu_do": (["bieu_do", "mui_ten"], []), "linh_hon": ([], ["so_linh_hon"]), "su_menh": ([], ["so_su_menh"]),
           "nhan_cach": ([], ["so_nhan_cach"]), "duong_doi": (["cach_tinh_duong_doi"], ["so_duong_doi"])}


def _pl_kien_thuc(kt: dict) -> dict:
    gt, td = _KT_MUC.get(kt["ma"], ([], []))
    return {"cau_chuan_hoa": "", "cau_goc": "", "gioi_thieu": "", "ngay_nhac": [], "so_nhac": {}, "cap_nhac": None,
            "giai_thich": gt, "tu_dien": td, "tu_choi": None, "linh_vuc": "ky_thuat", "doi_tuong": "ban_than",
            "xu_ly": "tra_loi", "y_dinh": "giai_thich"}


def _muc_nghia_so(so: int) -> dict | None:
    m = store.nghia_so(so) or {}
    if not m:
        return None
    cd = (kb2.chan_dung(so) or {}).get("tong_quan") or {}
    return {"loai": "nghia_so", "so": so, "tu_khoa": m.get("tu_khoa", ""), "mat_toi": m.get("mat_toi", ""),
            "phan_chung": m.get("phan_chung", ""), "chan_dung": cd.get("chan_dung", ""),
            "source_id": "balliett_jordan", "school_id": "pythagoras_vn"}


# --------------------------------------------------------------------------- #
# Câu hỏi tiếp + căn cứ
# --------------------------------------------------------------------------- #
_HT = {"ban_than": ("tsq.ht.ban_than", "Con số chủ đạo nói gì về tôi?"),
       "tinh_yeu": ("tsq.ht.tinh_yeu", "Trong tình yêu tôi thường thế nào?"),
       "su_nghiep": ("tsq.ht.su_nghiep", "Con số của tôi thể hiện thế nào trong công việc?"),
       "tai_chinh": ("tsq.ht.tai_chinh", "Tôi với tiền bạc thế nào?"),
       "nam": ("tsq.ht.nam", "Năm cá nhân của tôi năm nay nói về điều gì?"),
       "thang": ("tsq.ht.thang", "Tháng này của tôi thế nào?"),
       "dinh_cao": ("tsq.ht.dinh_cao", "Tôi đang ở giai đoạn đỉnh cao nào?"),
       "no_nghiep": ("tsq.ht.no_nghiep", "Tôi có nợ nghiệp không?"),
       "gia_dinh": ("tsq.ht.gia_dinh", "Con số của tôi nói gì về gia đình?"),
       "suc_khoe": ("tsq.ht.suc_khoe", "Năm nào tôi nên chăm sức khoẻ hơn?")}
_HT_THEO = {"ban_than": ["tinh_yeu", "su_nghiep", "nam"], "tinh_yeu": ["ban_than", "nam", "gia_dinh"],
            "su_nghiep": ["tai_chinh", "nam", "dinh_cao"], "tai_chinh": ["su_nghiep", "nam", "thang"],
            "thoi_van": ["thang", "dinh_cao", "su_nghiep"], "gia_dinh": ["tinh_yeu", "ban_than", "nam"],
            "suc_khoe": ["suc_khoe", "nam", "ban_than"], "tam_linh": ["no_nghiep", "ban_than", "dinh_cao"],
            "ky_thuat": ["ban_than", "nam", "tinh_yeu"]}


def _hoi_tiep(lv: str | None) -> list[str]:
    ds = _HT_THEO.get(lv or "", ["ban_than", "tinh_yeu", "nam"])
    return [L(*_HT[k]) for k in ds if k != lv][:3]


def _can_cu(goi: dict, nguoi: dict) -> list[str]:
    loai = {m.get("loai") for m in goi.get("muc") or []}
    ra = []
    if loai & {"linh_vuc", "chan_dung", "cap_so", "trong_vai"}:
        ra.append(L("tsq.cc.cot_loi", "Số chủ đạo tính từ ngày sinh ({quy_uoc}); sứ mệnh, linh hồn, nhân cách tính từ họ tên "
                    "trên giấy khai sinh.", quy_uoc=L(f"thanso.quy_uoc.{nguoi.get('quy_uoc') or 'tong_het'}", "")))
    if loai & {"nam_ca_nhan", "thang_ca_nhan", "ngay_ca_nhan"}:
        ra.append(L("tsq.cc.nhip", "Năm cá nhân = ngày + tháng sinh + năm dương lịch, rút về 1–9 (tính từ 1/1); tháng cá nhân "
                    "= năm cá nhân + số tháng; ngày cá nhân = tháng cá nhân + số ngày."))
    if loai & {"chaldea"}:
        ra.append(L("tsq.cc.chaldea", "Phái Chaldea (Cheiro, 1926): bảng chữ 1–8 theo âm, coi trọng tên thường gọi."))
    ra.append(L("tsq.cc.nguon", "Kho tri thức thần số học (phái Pitago, dòng Balliett → Jordan) — tham khảo văn hoá, không phải "
                "lời dự báo."))
    return ra


# --------------------------------------------------------------------------- #
# Điểm vào
# --------------------------------------------------------------------------- #
def tra_loi(cau: str, nguoi: dict, ngay_xem: dt.date | None = None, nguoi_kia: dict | None = None,
            phai: str = "pitago") -> dict:
    """Hỏi đáp Thần số bản ngôn ngữ khác tiếng Việt. Khuôn kết quả như `hoi_van.tra_loi` (những trường web dùng) +
    `ngon_ngu`, `hoi_tiep`, `can_cu`; câu có tín hiệu buồn yếu → `ho_tro`."""
    from app.hoidap import chung, en_gloss_ts as eg  # noqa: PLC0415
    from app.luangiai import an_toan as _at  # noqa: PLC0415
    ngay_xem = ngay_xem or hom_nay_vn()
    goc = (cau or "").strip()
    nguoi = {**nguoi, "quy_uoc": nguoi.get("quy_uoc") or "tong_het"}
    kq = {"phai": phai, "ngon_ngu": ngon_ngu.hien_tai(), "phan_loai": {}, "cau_tra_loi": "", "can_cu": [], "hoi_tiep": [],
          "che_do": "template", "da_bat_llm": False, "loi_kiem_tra": [], "can_them": [], "do_phu": "day_du", "truc_quan": [],
          "hoi_lai": None, "bang_chung": None}
    # 1. an toàn — MỘT bộ chặn chung, trên câu gốc
    t_goc = hoi.chuan_hoa_cau(goc)
    db = chung.dac_biet(t_goc, goc)
    if db:
        pl0 = {"linh_vuc": "khung_hoang" if db == "an_toan" else "ngoai_pham_vi", "doi_tuong": "ban_than", "xu_ly": db,
               "y_dinh": "loi_khuyen"}
        if db == "an_toan":
            loi = chung.mau_an_toan(goc, hoi.kb.mau("an_toan"))
        elif db == "tu_choi_nhe":
            loi = chung.mau_tu_choi(goc, t_goc, L("an_toan.tu_choi", ""))
        else:
            loi = L("an_toan.dan_huong", "")
        kq.update(cau_tra_loi=loi, phan_loai=pl0)
        return kq
    # 2. câu kiến thức / phân loại trên cụm từ khoá tiếng Việt
    kt = eg.kien_thuc(goc)
    if kt:
        pl = _pl_kien_thuc(kt)
        cau_vi = ""
    else:
        cau_vi = eg.gloss(goc, ngay_xem) or goc
        with ngon_ngu.dung(ngon_ngu.MAC_DINH):
            pl = hoi.phan_loai(cau_vi)
        if pl["xu_ly"] in CHAN:
            # cụm từ khoá rơi vào nhánh chặn của bản Việt (câu Anh luật tiếng Anh chưa bắt) — vẫn dùng lời bản ngôn ngữ này
            loi = (chung.mau_an_toan(goc, hoi.kb.mau("an_toan")) if pl["xu_ly"] == "an_toan"
                   else chung.mau_tu_choi(goc, t_goc, hoi.kb.mau(pl.get("tu_choi") or "du_doan_cu_the") or L("an_toan.tu_choi", ""))
                   if pl["xu_ly"] == "tu_choi_nhe" else L("an_toan.dan_huong", ""))
            kq.update(cau_tra_loi=loi, phan_loai={k: pl[k] for k in ("linh_vuc", "y_dinh", "doi_tuong", "xu_ly")})
            return kq
    # 3. gói bằng chứng + lời đáp (hai lượt bản Việt quyết)
    goi, van = _dung_theo_vi(pl, goc, nguoi, dict(nguoi_kia) if nguoi_kia else None, ngay_xem, phai)
    if kt and kt["ma"] == "nghia_so":
        m = _muc_nghia_so(kt["so"])
        if m:
            goi["muc"].insert(0, m)
            hoi._ket(goi)
            van = van_template(goi)        # câu chỉ hỏi nghĩa một con số: không có mục nào khác ngoài con số đó
    dac_biet = bool(goi["can_them"])
    kq.update(phan_loai=goi["phan_loai"], bang_chung=goi, cau_tra_loi=van, can_them=goi["can_them"],
              do_phu="day_du" if (goi["muc"] or dac_biet) else "khong", hoi_tiep=_hoi_tiep(pl.get("linh_vuc")),
              can_cu=_can_cu(goi, nguoi), hoi_lai=chung.hoi_lai_neu(pl, "thanso"))
    if not goi["can_them"]:
        from app.luangiai import truc_quan  # noqa: PLC0415
        kq["truc_quan"] = truc_quan.thanso(goi)        # khối hình như bản Việt (chữ qua L(), KB qua bản phủ)
    if _at.ho_tro_mem_en(goc):
        kq["ho_tro"] = _at.loi_ho_tro_mem()
    return kq
