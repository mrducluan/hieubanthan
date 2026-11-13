# -*- coding: utf-8 -*-
"""KD-V3 — RULES: "trả lời theo việc" cho Kinh Dịch (tất định, không LLM).

Vấn đề trước KD-V3: cùng một quẻ ra gần như cùng một bài đọc cho mọi câu hỏi (lời quẻ chung + nhóm việc của chủ đề);
dụng thần lấy theo người được nhắc ("bạn thân nợ tiền" → Huynh Đệ) thay vì theo VIỆC (khoản tiền → Thê Tài); câu về người
kia không đọc Thế–Ứng. Lớp này ghép ba thứ engine đã tính thành câu trả lời đúng điều được hỏi:
  1. HIỂU CÂU: kiểu câu (có nên · có thành không · người kia thế nào · khi nào · làm thế nào · thế của việc), vai
     (bạn · con · bố mẹ · vợ/chồng · người ấy · sếp · đối tác · bạn bè), việc (chủ đề KB) — tất định, không lưu câu.
  2. DỤNG THẦN THEO VIỆC + VAI (Tăng San Bốc Dịch): việc quyết hào chính, người được hỏi hộ là hào phụ.
  3. NGHIÊNG theo phái đang đọc: Nghĩa Lý = xu hướng của hào làm chủ (KB 384 hào) kẹp theo mức chữ đoán; Lục Hào = thế của
     dụng thần theo tháng ngày (vượng suy · động hoá · kỵ / nguyên thần · không / phá / mộ); Mai Hoa = thể–dụng. Phái khác
     chiều → nói rõ "hai cách đọc nhìn hai mặt" (không chọn bên, không đổi mức).
  4. LỜI: câu đầu theo kiểu câu × nghiêng + MỘT lý do riêng của lần gieo này; "Phía người kia" từ Thế–Ứng; "Điều cần gỡ
     trước" từ cấu trúc quẻ; việc nên làm theo xu hướng hào. Mọi chữ từ KB (`kinhdich_tra_loi.json` + KB cũ).
Mức (thuan / can_bang / can_chu_dong) và mã kiểm chứng của hộp cũ KHÔNG đổi; chỉ thêm hộp mới có mã mới.
"""
from __future__ import annotations

import re

from app import ngon_ngu as _nn
from app.calc.kinhdich_vendor import KHAC, SINH
from app.hoidap import chung, hieu_cau as hc_chung, mo_dau
from app.kb import kinhdich_doi_song_kb as kb_ds, kinhdich_kb as kbq, kinhdich_tra_loi_kb as kb
from app.kb import ten as _tn
from app.kb.loi import L

# chủ đề nói về NGƯỜI (khi hoà điểm với chủ đề nói về VIỆC thì việc thắng, người thành vai)
CHU_DE_NGUOI = ("con_cai", "gia_dinh", "ban_be", "tinh_cam", "hon_nhan", "hon_nhan_tt")
MUC_TU_NGHIENG = {"co": "thuan", "dieu_kien": "can_bang", "chua_voi": "can_chu_dong", "chua": "can_chu_dong"}
_TAG_TU_MUC = {"thuan": "tien", "can_bang": "giu", "can_chu_dong": "than_trong"}

_NGUOI_KIA = [r"nguoi (ay|do|kia|yeu)", r"anh ay", r"co ay", r"cau ay", r"ban ay", r"crush", r"doi tac", r"\bsep\b",
              r"(chong|vo) (toi|em|minh)", r"ban than", r"ben kia", r"\bho (co|dang|se|con|that|van)\b", r"nguoi ta"]
_HOI_LONG = [r"co (that long|thuong|yeu|thich|nghi|quay lai|quan tam|tin|con thuong|con yeu|y dinh|tha thu|doi y|giu loi)",
             r"co (dang )?(giau|lua|choi xau|noi doi|phan boi|qua mat)", r"co (con )?muon (giu|quay|o lai|tiep tuc|chia tay|bo)",
             r"co (dinh|y dinh|ke hoach)(?! (thuc|chat))", r"con muon", r"co (dang )?(hieu|nghe|de y|nho) (toi|minh|em)",
             r"nghi gi", r"(nghi|cam thay|thay) (the nao|sao) ve", r"dang nghi", r"(con )?(thuong|yeu|nho) (toi|minh|em)",
             r"co y gi", r"that long", r"co dang tin", r"co lua", r"co phan boi", r"co giu loi", r"thai do"]
_CACH_LAM = [r"nen lam (gi|the nao|sao|nhu the nao)", r"lam sao", r"lam the nao", r"cach nao", r"nen ung xu", r"nen noi",
             r"xu ly (the nao|sao)", r"nen (bat dau|chuan bi|tiep can|xu ly|ung xu|doi dien)", r"bang cach nao"]
_VAI = [("con", [r"con (toi|em|minh|tui)", r"con (trai|gai)", r"\bchau (toi|em|minh|noi|ngoai)", r"dua con", r"\bbe (nha|nha toi)",
                 r"cho con (di|hoc|thi|lam|o)", r"con minh"]),
        ("cha_me", [r"\b(bo|me|ba|cha|ma) (toi|em|minh)", r"(bo|cha) me", r"ong ba (toi|em|minh|noi|ngoai)"]),
        ("vo_chong", [r"(chong|vo) (toi|em|minh|tui)", r"ong xa", r"ba xa", r"vo chong (toi|em|minh)", r"hai vo chong",
                      r"(voi|cua|cho|gap|yeu|thuong|han gan voi) (chong|vo)(?!\w)", r"vo chong"]),
        ("nguoi_yeu", [r"nguoi yeu", r"ban trai", r"ban gai", r"nguoi (ay|do|kia)", r"crush", r"anh ay", r"co ay", r"cau ay"]),
        ("sep", [r"\bsep\b", r"cap tren", r"giam doc"]),
        ("doi_tac", [r"doi tac", r"hop tac voi", r"gop von voi", r"lam an voi", r"lam chung voi"]),
        ("ban_be", [r"ban than", r"ban (toi|em|minh|cu)\b", r"dong nghiep", r"nhom ban"])]


# ----------------------------------------------------------------------------- 1. hiểu câu
def kieu_cau(t: str) -> str:
    """Kiểu câu hỏi Kinh Dịch: co_nen · ket_qua · nguoi_kia · khi_nao · cach_lam · tong_quat (câu đã chuẩn hoá)."""
    if chung.co(t, _NGUOI_KIA) and chung.co(t, _HOI_LONG) and not chung.co(t, [r"co nen"]):
        return "nguoi_kia"
    k = hc_chung.kieu(t)
    if k == "khi_nao":
        return "khi_nao"
    if chung.co(t, _CACH_LAM):
        return "cach_lam"
    from app.hoidap.kinhdich import DU_DOAN, QUYET_DINH  # noqa: PLC0415
    if chung.co(t, QUYET_DINH) or chung.co(t, [r"\bnen\b"]):
        return "co_nen"
    # "Mở quán lúc này có ổn không" = việc mình định làm → câu nên hay không; "hồ sơ có được duyệt không" là kết quả
    if chung.co(t, [r"^(mo|mua|ban|di|chuyen|ky|nhan|dau tu|gop|khoi nghiep|hop tac|lam|xin|cuoi|doi|vay|thue|dang ky|nop)\b.{0,60}"
                    r"\bco (on|duoc|thuan|hop|tot|on khong|hay) khong"]):
        return "co_nen"
    if k == "co_nen" or chung.co(t, DU_DOAN) or chung.co(t, [r"(?<!\w)co (?!nen\b).{1,50}(khong|ko|k|chua)\W*$"]):
        return "ket_qua"                     # "có ổn / có được không" là hỏi kết quả, không phải hỏi nên hay không
    return "tong_quat"


def vai_trong_cau(t: str) -> str:
    """Người mà việc được hỏi gắn với: toi (mặc định) · con · cha_me · vo_chong · nguoi_yeu · sep · doi_tac · ban_be."""
    n2 = hc_chung.nguoi_thu_hai(t)
    if n2 and n2.get("quan_he") in ("vo_chong", "con", "nguoi_yeu", "cha_me", "sep", "doi_tac", "ban_be"):
        return n2["quan_he"]
    for ma, mau in _VAI:
        if chung.co(t, mau):
            return ma
    return "toi"


def hieu_cau(t: str, raw: str | None, ma_chu_de: str) -> dict:
    """Gói hiểu câu: {kieu, vai, viec (mã chủ đề), nhan_viec, nguoi_kia (bool: câu có người thứ hai)}."""
    cd = kb_ds.chu_de(ma_chu_de) or {}
    vai = vai_trong_cau(t)
    kieu = kieu_cau(t)
    goc = cd.get("goc") or ma_chu_de
    nhan = (cd.get("ten") or "").split(" (")[0].lower() if goc != "khac" else ""
    if not nhan:
        d = mo_dau.dieu_hoi(t, raw)
        nhan = ((d or {}).get("nhan_ro") or (d or {}).get("nhan") if _nn.la_viet() else mo_dau.nhan_hien(d)) \
            or kb.mau("viec_mac_dinh")       # EN-ALL GĐ 6: nhãn điều được hỏi theo ngôn ngữ (danh mục cố định `hoi.dh*`)
    nhan = nhan.removeprefix("chuyện ")
    return {"kieu": kieu, "vai": vai, "viec": goc, "ma_chu_de": ma_chu_de, "nhan_viec": nhan,
            "nguoi_kia": vai != "toi" or goc in CHU_DE_NGUOI or kieu == "nguoi_kia"}


# ----------------------------------------------------------------------------- 2. dụng thần theo việc + vai
def dung_than(hc: dict) -> dict:
    """{chinh, ten, phu?, ten_phu?, ky?, ten_ky?, vai?, ten_vai?} — việc quyết hào chính; vai (người được hỏi hộ) là hào phụ
    thứ hai; chủ đề biến thể người ấy nữ / nam (người dùng chọn) giữ dụng thần của KB chủ đề."""
    ma = hc["ma_chu_de"]
    cd = kb_ds.chu_de(ma) or {}
    d = dict(kb.dung_than_viec(hc["viec"]))
    if cd.get("goc") and cd.get("dung_than"):           # tinh_cam_nu → Thê Tài, tinh_cam_nam → Quan Quỷ
        d["chinh"] = cd["dung_than"]
    vai = hc["vai"]
    lt = kb.vai_luc_than(vai) if vai != "toi" else None
    if lt and (hc["viec"] in CHU_DE_NGUOI or d.get("chinh") == "Thế") and d.get("chinh") in ("Ứng", "Thế") and lt != "Ứng":
        d["chinh"], d["ten"] = lt, L("kd.tl.hao_cho", "hào đại diện cho {ai}", ai=kb.vai(vai))  # việc về chính người đó (sức khoẻ, đi xa, gia đình)
    elif lt and hc["viec"] not in CHU_DE_NGUOI and lt != d.get("chinh"):
        d["vai"], d["ten_vai"] = lt, L("kd.tl.hao_cho", "hào đại diện cho {ai}", ai=kb.vai(vai))
    d.setdefault("chinh", "Ứng")
    d.setdefault("ten", L("kd.tl.hao_viec_hoi", "hào đại diện cho việc được hỏi"))
    return d


# ----------------------------------------------------------------------------- 3. nghiêng
def tag_hao_chu(que: dict, goi: dict) -> tuple[str, str | None]:
    """(xu hướng của lời làm chủ, nguồn) — hào chủ theo quy tắc Chu Hy; lời là quái từ / Dụng → xu hướng rút từ mức chữ đoán."""
    from app.hoidap.kinhdich import chon_loi_doc  # noqa: PLC0415
    from app.luangiai.kinhdich_doi_song import muc_loi_kinh  # noqa: PLC0415
    ban, bien = que["quai_ban"]["so_king_wen"], (que.get("quai_bien") or {}).get("so_king_wen")
    chu = next((x for x in chon_loi_doc(ban, bien, que["hao_dong"]) if x["chu"]), None)
    if chu and chu["loai"] == "hao":
        t = kb.xu_huong_hao(chu["que"], chu["vi_tri"])
        if t:
            return t, L("kd.tl.nguon_hao", "hào {n}", n=chu["vi_tri"])
    lk = next((m for m in goi.get("muc", []) if m.get("loai") == "loi_kinh" and m.get("chu")), None)
    muc = muc_loi_kinh(lk["han"]) if lk else "can_bang"
    return _TAG_TU_MUC[muc], L("kd.tl.nguon_que_tu", "quái từ")


def nghieng_nghia_ly(tag: str, muc: str) -> str:
    """Xu hướng hào → nghiêng, KẸP theo mức chữ đoán (mức không đổi): thuận chỉ cho co / dieu_kien; cần lưu ý chỉ cho
    chua_voi / chua; cân bằng không cho 'co' (chưa có chữ cát) và không cho 'chua'."""
    n = kb.xu_huong(tag).get("nghieng") or "dieu_kien"
    if muc == "thuan":
        return n if n in ("co", "dieu_kien") else "dieu_kien"
    if muc == "can_chu_dong":
        return n if n in ("chua_voi", "chua") else "chua_voi"
    return "dieu_kien" if n in ("co", "dieu_kien") else "chua_voi"


def nghieng_luc_hao(pt: dict | None, muc: str) -> str:
    """Mức Lục Hào (đã tính) → nghiêng; vượng mà kỵ thần không động → co; suy mà kỵ thần động → chua."""
    if not pt or not pt.get("dung_than"):
        return "dieu_kien"
    d = pt["dung_than"]
    if d.get("phuc") or not d.get("vi_tri"):
        return "chua_voi"
    h = next((x for x in d["vi_tri"] if x.get("dong")), d["vi_tri"][0])
    ky = bool((d.get("ky_than") or {}).get("dong"))
    if muc == "thuan":
        return "co" if not ky else "dieu_kien"
    if muc == "can_chu_dong":
        return "chua" if (ky and h.get("tong") == "suy") else "chua_voi"
    return "dieu_kien"


def nghieng_mai_hoa(muc: str | None) -> str:
    return {"thuan": "co", "can_bang": "dieu_kien", "can_chu_dong": "chua_voi"}.get(muc or "", "dieu_kien")


def _xa(a: str, b: str) -> bool:
    """Hai nghiêng khác chiều (có ↔ chưa), không chỉ khác bậc."""
    r = {"co": 1, "dieu_kien": 0.5, "chua_voi": -0.5, "chua": -1}
    return (r[a] > 0) != (r[b] > 0)


# ----------------------------------------------------------------------------- 4. lời
def _the_ung_quan_he(h: dict, the: dict) -> str:
    a, b = h["ngu_hanh"], the["ngu_hanh"]
    if a == b:
        return "ty_hoa"
    if SINH[a] == b:
        return "ung_sinh_the"
    if SINH[b] == a:
        return "the_sinh_ung"
    if KHAC[a] == b:
        return "ung_khac_the"
    return "the_khac_ung"


def nguoi_kia(pt: dict | None, hc: dict, dt: dict) -> dict | None:
    """"Phía người kia" từ Thế–Ứng (hoặc hào dụng thần là người) theo ngày tháng: {quan_he, trang_thai, loi, ma}.
    Chỉ khi câu có người thứ hai; không đọc suy nghĩ riêng của ai — chỉ thế của hai bên trong việc."""
    if not pt or not hc.get("nguoi_kia"):
        return None
    hao = pt["hao"]
    the = next((x for x in hao if x.get("the_ung") == "Thế"), None)
    ten_lt = dt.get("chinh") if dt.get("chinh") in ("Thê Tài", "Quan Quỷ", "Tử Tôn", "Phụ Mẫu", "Huynh Đệ") else None
    if hc["viec"] not in CHU_DE_NGUOI and dt.get("vai"):
        ten_lt = dt["vai"]
    if ten_lt:
        ung = [x for x in hao if x.get("luc_than") == ten_lt]
    else:
        ung = [x for x in hao if x.get("the_ung") == "Ứng"]
    nguoi = kb.vai(hc["vai"] if hc["vai"] != "toi" else "nguoi_kia")
    if not the:
        return None
    if not ung:
        loi = (kb.trang_thai_nguoi_kia("phuc") or "").format(nguoi=nguoi)
        return {"quan_he": "phuc", "trang_thai": "phuc", "loi": loi[0].upper() + loi[1:], "ma": "phuc", "nguoi": nguoi}
    # hào người kia: ưu tiên hào Ứng, rồi hào động, rồi hào không phải Thế (hào Thế là chính bạn)
    h = next((x for x in ung if x.get("the_ung") == "Ứng"), None) or next((x for x in ung if x.get("dong")), None) \
        or next((x for x in ung if x.get("the_ung") != "Thế"), ung[0])
    qh = _the_ung_quan_he(h, the)
    phan = [(kb.the_ung(qh) or "").format(nguoi=nguoi)]
    tt = "tuan_khong" if h.get("tuan_khong") else "nguyet_pha" if h.get("nguyet_pha") else "dong" if h.get("dong") \
        else "vuong" if h.get("tong") == "vượng" else "suy" if h.get("tong") == "suy" else None
    if tt:
        phan.append((kb.trang_thai_nguoi_kia(tt) or "").format(nguoi=nguoi))
    loi = "; ".join(p for p in phan if p)
    return {"quan_he": qh, "trang_thai": tt, "loi": loi[0].upper() + loi[1:], "ma": f"{qh}.{tt or 'binh'}",
            "hao": h["vi_tri"], "nguoi": nguoi}


def can_go(que: dict, pt: dict | None, dt: dict, gn: dict, tag: str) -> list[dict]:
    """Điều cần gỡ trước (≤ 2), theo thứ tự: kỵ thần động → dụng thần không / phá / mộ → hào động hoá xấu → vị trí hào →
    quẻ biến khó → thể–dụng bất lợi."""
    ra: list[dict] = []
    ten = dt.get("ten") or L("kd.tl.hao_viec", "hào đại diện cho việc")

    def them(ma: str, **fmt) -> None:
        s = kb.can_go(ma)
        if s and all(x["ma"] != ma for x in ra):
            s = s.format(ten=ten, **fmt)
            ra.append({"ma": ma, "loi": s[0].upper() + s[1:]})
    d = (pt or {}).get("dung_than") or {}
    if (d.get("ky_than") or {}).get("dong"):
        them("ky_than_dong")
    h = next((x for x in d.get("vi_tri") or [] if x.get("dong")), (d.get("vi_tri") or [None])[0])
    if h:
        for ma in ("tuan_khong", "nguyet_pha", "nhap_mo"):
            if h.get(ma):
                them(ma)
        if h.get("dong") and h.get("hoa") and h["hoa"]["loai"] in ("hồi đầu khắc", "thoái thần", "hoá tiết", "phản ngâm"):
            them("hoa_xau", loai=_tn.ten("hoa_hao", h["hoa"]["loai"]))
    dong = que.get("hao_dong") or []
    if dong and dong[-1] == 3:
        them("hao_3")
    if dong and dong[-1] == 6:
        them("hao_6")
    mh = gn.get("mai_hoa") or {}
    if mh.get("quan_he"):
        qh0 = mh["quan_he"][0]["quan_he"] if isinstance(mh["quan_he"], list) else None
        if qh0 in ("the_sinh_dung", "dung_khac_the"):
            them(qh0)
    if que.get("quai_bien") and tag in ("tien", "tien_giu", "hop_tac"):
        from app.luangiai.kinhdich_doi_song import muc_loi_kinh  # noqa: PLC0415
        qb = que["quai_bien"]
        if muc_loi_kinh(((kbq.que_van(qb["so_king_wen"]) or {}).get("que_tu") or {}).get("han", "")) == "can_chu_dong":
            them("que_bien_xau", bien=_tn.ten("que_ten", qb["ten"]))
    return ra[:2]


def _ly_do(chinh: str, que: dict, goi: dict, gn: dict, pt: dict | None, dt: dict, tag: str) -> str:
    """MỘT lý do riêng của lần gieo này, bằng lời thường, theo phái đang đọc."""
    if chinh == "luc_hao" and pt and pt.get("dung_than"):
        d = pt["dung_than"]
        if d.get("phuc") or not d.get("vi_tri"):
            s = kb.ly_do_luc_hao("phuc") or ""
        else:
            h = next((x for x in d["vi_tri"] if x.get("dong")), d["vi_tri"][0])
            tong = {"vượng": "vuong", "suy": "suy"}.get(h.get("tong", ""), "binh")
            s = kb.ly_do_luc_hao(tong) or ""
            if h.get("dong") and h.get("hoa"):
                k = kb_ds.hoa(h["hoa"]["loai"]) or {}
                if k.get("doi_thuong"):
                    s += L("kd.tl.lai_dong", ", lại đang động: {y}", y=k["doi_thuong"])
        return s.format(ten=dt.get("ten") or L("kd.tl.hao_viec", "hào đại diện cho việc"))
    if chinh == "mai_hoa" and gn.get("mai_hoa"):
        from app.luangiai.kinhdich_doi_song import quan_he_ten  # noqa: PLC0415
        mh = gn["mai_hoa"]
        qh = mh["quan_he"][0]["quan_he"] if isinstance(mh.get("quan_he"), list) and mh["quan_he"] else None
        return L("kd.tl.theo_the_dung", "theo thể–dụng, {y}", y=quan_he_ten(qh or "", mh.get("tom_tat") or "")).rstrip(", ")
    lk = next((m for m in goi.get("muc", []) if m.get("loai") == "loi_kinh" and m.get("chu")), None)
    if lk and (lk.get("nom_na") or lk.get("y")):
        s = (lk.get("nom_na") or lk.get("y") or "").strip().rstrip(".")
        s = s.split(L("kd.hdg_dau", "Hiểu đơn giản:"), 1)[-1].strip()
        s = s[0].lower() + s[1:]
        nhu = L("kd.tl.nhu", "như ")
        return (L("kd.tl.loi_vi", "lời hào làm chủ ví ") + s) if s.startswith(nhu) else (L("kd.tl.loi_chu", "lời hào làm chủ: ") + s)
    return kb.xu_huong(tag).get("y") or ""


def tra_loi(que: dict, pl: dict, goi: dict, gn: dict, muc: str, *, pt: dict | None, chu_de: str,
            cau_goc: str | None = None) -> dict:
    """Gói "trả lời theo việc" cho một quẻ đã ra. `gn` = góc nhìn ba phái (đã có mức), `muc` = mức chung theo phái chính."""
    t = pl.get("cau_chuan_hoa") or ""
    hc0 = pl.get("_hieu_cau")                          # hoidap đã hiểu câu cùng chủ đề → dùng lại, không chạy lần hai
    hc = hc0 if hc0 and hc0.get("ma_chu_de") == chu_de else hieu_cau(t, cau_goc, chu_de)
    dt = dung_than(hc)
    chinh = gn.get("chinh") or "nghia_ly"
    tag, nguon_tag = tag_hao_chu(que, goi)
    ng = {"nghia_ly": nghieng_nghia_ly(tag, gn["nghia_ly"]["muc"]),
          "luc_hao": nghieng_luc_hao(pt, gn["luc_hao"]["muc"]) if gn.get("luc_hao") else None,
          "mai_hoa": nghieng_mai_hoa(gn["mai_hoa"]["muc"]) if gn.get("mai_hoa") else None}
    n = ng.get(chinh) or ng["nghia_ly"]
    # nghiêng không vượt mức chung đã chấm (mức là khoá của hộp / mã kiểm chứng)
    if MUC_TU_NGHIENG[n] != muc:
        n = {"thuan": "co" if n == "co" else "dieu_kien", "can_bang": "dieu_kien" if n in ("co", "dieu_kien") else "chua_voi",
             "can_chu_dong": "chua" if n == "chua" else "chua_voi"}[muc]
    # hai cách đọc chính (lời kinh ↔ dụng thần theo ngày tháng) khác CHIỀU mới nói; Mai Hoa chỉ xét khi là phái chính
    khac = [k for k, v in ng.items() if v and k != chinh and k != "mai_hoa" and _xa(n, v)]
    xh = kb.xu_huong(tag)
    ly_do = _ly_do(chinh, que, goi, gn, pt, dt, tag)
    nk = nguoi_kia(pt, hc, dt)
    kieu = hc["kieu"]
    if kieu == "nguoi_kia" and not nk:
        kieu = "ket_qua"
    mau = kb.kieu_cau(kieu).get("cau_dau") or kb.kieu_cau("tong_quat").get("cau_dau") or {}
    cau_dau = (mau.get(n) or "").format(viec=hc["nhan_viec"], ly_do=ly_do, nen=xh.get("nen", ""),
                                         nguoi_kia=(nk or {}).get("loi", "").rstrip("."))
    cau_dau = re.sub(r"\s+", " ", cau_dau).strip()
    if cau_dau and cau_dau[-1] not in ".!?":
        cau_dau += "."
    go = can_go(que, pt, dt, gn, tag)
    return {"kieu": kieu, "vai": hc["vai"], "viec": hc["viec"], "nhan_viec": hc["nhan_viec"], "dung_than": dt,
            "tag": tag, "nguon_tag": nguon_tag, "nhan_tag": xh.get("nhan"), "nghieng": n, "nhan_nghieng": kb.nghieng(n)["nhan"],
            "nghieng_phai": ng, "khac_chieu": khac, "ly_do": ly_do, "cau_dau": cau_dau, "nguoi_kia": nk, "can_go": go,
            "vap": xh.get("vap"), "nen": xh.get("nen"), **kb.meta()}


# ----------------------------------------------------------------------------- 5. AI diễn đạt (hướng C — chỉ phần trả lời)
_SYSTEM_DIEN_DAT = """Bạn là người đọc Kinh Dịch lâu năm, nói chuyện điềm đạm, KHÔNG phải thầy bói. Bạn nhận các ghi chú \
mà hệ thống đã rút từ quẻ cho MỘT việc được hỏi (đã nêu chủ đề; không có câu hỏi gốc, không có ngày sinh). Hãy viết lại \
thành MỘT đoạn liền mạch 4–7 câu, xưng "bạn", câu ngắn, giọng đời thường.

THỨ TỰ: câu đầu nói ngay quẻ nghiêng về đâu cho việc đó (đúng như ghi chú: nên / có điều kiện / chưa nên vội / chưa nên \
lúc này); rồi lý do bằng hình ảnh hào trong ghi chú; rồi phía người kia (nếu có); rồi điều cần gỡ trước; cuối cùng một \
việc nên làm. Kết bằng ý "quẻ không quyết thay bạn" nếu ghi chú có câu đó.

RÀNG BUỘC TUYỆT ĐỐI:
- CHỈ dùng ý có trong ghi chú. Không thêm con số, ngày, tên quẻ, tên hào, thuật ngữ, sự kiện, dự đoán hay lời khuyên \
nào không có trong đó. Không đổi chiều nghiêng (không biến "chưa nên vội" thành "nên").
- Không nói "quẻ xấu", "quẻ tốt", "hung", "cát", "sẽ thành", "sẽ thất bại", "chắc chắn", "định mệnh", "số phận".
- KHÔNG dùng các cụm sau: {cum_cam}.
- Không chào hỏi, không tiêu đề, không gạch đầu dòng, không kết luận chung chung ngoài ghi chú."""


def nguon_dien_dat(dq: dict) -> list[str]:
    """Ghi chú đưa cho AI = chính lớp A đã dựng (kết luận, hộp trả lời, việc nên làm) — KHÔNG có câu người dùng gõ."""
    tl = dq.get("tra_loi") or {}
    ra = [dq.get("ket_luan") or ""]
    for h in dq.get("hop") or []:
        if h.get("loai") in ("thoi_diem", "cot_loi"):          # cot_loi = chính câu kết luận (đã ở dòng đầu)
            continue
        s = f"{h['tieu_de']}: {h['noi_dung']}"
        if h.get("huong_xu_ly") and h["loai"] == "luu_y":
            s += f" Nên: {h['huong_xu_ly']}"
        ra.append(s)
    hd = next((x for x in dq.get("hanh_dong") or [] if x.get("muc") == dq.get("muc")), None)
    if hd and hd.get("viec"):
        ra.append("Việc nên làm: " + " ".join(hd["viec"][:2]))
    if tl.get("khac_chieu"):
        ra.append(kb.mau("hai_cach_khac"))
    ra.append(kb.mau("khong_quyet"))
    return [s for s in ra if s]


def dien_dat(dq: dict, mo_hinh: str | None = None) -> dict:
    """KD-V3 hướng C (tầng NARRATIVE): AI diễn đạt LẠI chỉ phần trả lời (nguồn = lớp A tất định), qua bộ kiểm chung
    `luan_giai_van.kiem_tra_chuong` (số, thuật ngữ lạ, cụm cấm, câu ý mới, độ dài) — hỏng / thiếu khoá / hết lượt → giữ bản
    mẫu. Mô hình: `KD_DIEN_DAT_MODEL` → `OPENROUTER_MODEL` → mặc định chung. Các phần khác của bài đọc không gọi AI."""
    import os  # noqa: PLC0415
    if not dq or not dq.get("tra_loi") or not os.environ.get("OPENROUTER_API_KEY"):
        return {**dq, "dien_dat": "mau"} if dq else dq
    from app.narrative import ai_goi, luan_giai_van as lgv  # noqa: PLC0415
    from app.narrative.ngan_sach import mo_ta_loi  # noqa: PLC0415
    nguon = nguon_dien_dat(dq)
    nguon_van = "\n".join(nguon)
    if len(nguon_van) < lgv.CHUONG_NGAN:
        return {**dq, "dien_dat": "mau"}
    mo_hinh = mo_hinh or os.environ.get("KD_DIEN_DAT_MODEL") or None
    try:
        van = ai_goi.goi_chat(
            [{"role": "system", "content": _SYSTEM_DIEN_DAT.format(cum_cam="; ".join(f'"{c}"' for c in lgv._cum_cam()))},
             {"role": "user", "content": "\n".join(f"- {s}" for s in nguon)}],
            nhiet_do=0.3, max_tokens=max(250, min(900, len(nguon_van) * 3 // 4)), mo_hinh=mo_hinh, het_gio=40,
            kiem=lambda v: lgv.kiem_tra_chuong(v.strip(), nguon_van)).strip()
        loi = lgv.kiem_tra_chuong(van, nguon_van)
    except Exception as e:  # noqa: BLE001 — AI lỗi không làm vỡ bài đọc
        return {**dq, "dien_dat": "mau", "dien_dat_loi": [f"llm lỗi: {mo_ta_loi(e)}"]}
    if loi or not van:
        return {**dq, "dien_dat": "mau", "dien_dat_loi": loi}
    return {**dq, "dien_dat": "tra_loi", "tra_loi": {**dq["tra_loi"], "van_ai": van}}
