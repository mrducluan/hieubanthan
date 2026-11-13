# -*- coding: utf-8 -*-
"""PT-ĐS — RULES: báo cáo "Nhà của bạn" bằng lời đời thường, tất định, không LLM.

Ghép từ các phép tính đã có: Bát trạch (mệnh quái, du niên, trạch, cửa–chủ–bếp), bố cục nhà (PT-V0), Huyền Không (trạch bàn,
cặp sơn–hướng tinh, lưu niên, lưu nguyệt), hạn năm + tuổi làm nhà dân gian. Năm chương: Bạn hợp hướng nào · Ngôi nhà này với
bạn · Từng phòng · Năm nay và 3 tháng tới · Việc nên làm. Thành viên gia đình: mệnh riêng từng người, hướng chung, hành thông
quan khi hai mệnh khắc. Hình thế (dấu hiệu đã xác nhận) nêu TRƯỚC lý khí. Thiếu dữ liệu → chương ghi `thieu`, không vỡ.
Khuôn `doi_song_1` (như Luận giải Tử vi đời sống) để web dùng chung hộp nổi bật / "Vì sao nói vậy".
"""
from __future__ import annotations

import datetime as dt
import re

from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.calc import tietkhi
from app.calc import tuoi_dan_gian as tdg
from app import ngon_ngu
from app.kb import phongthuy_do_thi as do_thi
from app.kb import phongthuy_doi_song_kb as kb
from app.kb import phongthuy_kb as kbp
from app.kb import ten as _ten
from app.kb.loi import L
from app.luangiai import doi_song_khuon as kh
from app.luangiai import suc_khoe_nam as skn
from app.luangiai import phongthuy_bo_cuc as bo_cuc
from app.luangiai import tuoi_dan_gian as tdg_luan

PHONG_CHINH = ["cua_chinh", "phong_ngu_chinh", "bep", "ban_tho", "phong_lam_viec", "ve_sinh"]
# Q1 (2026-10-22): "hình thế là nền, lý khí là nhịp" — có dấu hiệu nhóm veto đã xác nhận thì chương Ngôi nhà / Từng phòng
# không vượt mức này; phi tinh, lưu niên, lưu nguyệt chỉ quyết định thời điểm.
MUC_TRAN_VETO = "can_bang"
_THU_AN_TOAN = [("lửa", "lửa và điện"), ("sắc nhọn", "vật sắc nhọn"), ("khoá cửa", "cửa nẻo, đồ quý"), ("nóng bí", "nóng bí"), ("rò rỉ", "nước"), ("dao kéo", "vật sắc nhọn"), ("ẩm mốc", "ẩm thấp"),
                ("hợp đồng", "lời qua tiếng lại"), ("Bậc thang", "lối đi"), ("kín gió", "gió lùa")]
_THU_CHUNG = "vài điều cần chăm kỹ hơn"
_MA_THU = {"lửa và điện": "lua_dien", "vật sắc nhọn": "sac_nhon", "cửa nẻo, đồ quý": "cua_neo", "nóng bí": "nong_bi", "nước": "nuoc",
           "ẩm thấp": "am_thap", "lời qua tiếng lại": "loi_qua", "lối đi": "loi_di", "gió lùa": "gio_lua"}
_TEN_PHONG = bo_cuc.TEN_PHONG
_CUNG_QUAI = {v[1]: k for k, v in hk.QUAI.items()}          # phương → quái Huyền Không
_UU_TIEN_DU_NIEN = ["Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị", "Hoạ Hại", "Lục Sát", "Ngũ Quỷ", "Tuyệt Mệnh"]


def _hop(loai: str, tieu_de: str, noi_dung: str, huong_xu_ly: str | None = None, can_cu: list[str] | None = None, **them) -> dict:
    h = {"loai": loai, "tieu_de": tieu_de, "noi_dung": noi_dung.strip()}
    if huong_xu_ly:
        h["huong_xu_ly"] = huong_xu_ly.strip()
    if can_cu:
        h["can_cu"] = can_cu
    h.update({k: v for k, v in them.items() if v is not None})
    return h


def _muc_du_nien(d: str | None) -> str | None:
    if d is None:
        return None
    if d in ("Sinh Khí", "Thiên Y", "Diên Niên"):
        return "thuan"
    if d == "Phục Vị":
        return "can_bang"
    return "can_chu_dong"


def _gop_muc(*ds: str | None) -> str | None:
    ds2 = [d for d in ds if d]
    if not ds2:
        return None
    diem = sum({"thuan": 1, "can_bang": 0, "can_chu_dong": -1}[d] for d in ds2) / len(ds2)
    return "thuan" if diem > 0.34 else "can_chu_dong" if diem < -0.34 else "can_bang"


def _menh(sinh: dict | None) -> dict | None:
    if not sinh:
        return None
    return pt.menh_quai(sinh["nam"], sinh["gioi_tinh"], sinh.get("ngay"), sinh.get("moc_nam", "lap_xuan"))


def _huong_nha(nha: dict) -> tuple[str | None, float | None]:
    bc = nha.get("bo_cuc") or {}
    do = nha.get("huong_do")
    if do is None:
        do = bc.get("huong_nha_do")
    if do is not None:
        return pt.huong_tu_do(float(do)), float(do) % 360
    h = nha.get("huong") or bc.get("huong_nha")
    return (h, None) if h else (None, None)


def _trach_ban(nha: dict, do: float | None, huong: str | None, nam_xem: int | None = None) -> dict | None:
    nam_xay = nha.get("nam_xay")
    if not nam_xay:
        return None
    if nha.get("toa"):
        toa = nha["toa"]
    elif do is not None:
        toa = hk.son_tu_do((do + 180) % 360)["son"]
    elif huong:
        q = _CUNG_QUAI[pt.DOI[huong]]
        toa = hk.QUAI[q][2][1][0]                   # sơn giữa (thiên nguyên) của quái toạ
    else:
        return None
    try:
        b = hk.trach_ban(int(nam_xay), toa)
    except ValueError:
        return None
    cung = {c["cung"]: c for c in b["cung"]}
    b["cung_map"] = cung
    qh, qt = b["huong"]["quai"], b["toa"]["quai"]
    b["cap_huong"] = hk.to_hop_cung(cung[qh]["son"], cung[qh]["huong"], b["van"], cung=qh, nam=nam_xem)
    b["cap_toa"] = hk.to_hop_cung(cung[qt]["son"], cung[qt]["huong"], b["van"], cung=qt, nam=nam_xem)
    return b


def _cap_tai(b: dict | None, phuong: str) -> dict | None:
    if not b or phuong == "Trung cung":
        return None
    c = b["cung_map"][_CUNG_QUAI[phuong]]
    return hk.to_hop_cung(c["son"], c["huong"], b["van"])

# ----------------------------------------------------------------------------- EN-ALL GĐ 5: tên hiển thị theo ngôn ngữ
def _h(x: str) -> str:
    return _ten.ten("huong", x)


def _dnt(x: str) -> str:
    return _ten.ten("du_nien", x)


def _q(x: str) -> str:
    return _ten.ten("quai", x)


def _ds(xs) -> str:
    return L("pt.noi", ", ").join(xs)


def _nhom_ngan(nhom: str) -> str:
    """"Đông tứ mệnh" → "Đông" / "East" (tên ngắn của nhóm theo ngôn ngữ)."""
    return L("pt.nhom_ngan.dong", "Đông") if nhom.startswith("Đông") else L("pt.nhom_ngan.tay", "Tây")


def _chi(x: str) -> str:
    return _ten.ten("chi", x)


def _thang(chi: str) -> str:
    return L("pt.thang_chi", "tháng {chi}", chi=_chi(chi))


def _hien():
    from app.luangiai import phongthuy_hien  # noqa: PLC0415
    return phongthuy_hien


def _doan_cap_sao(ch: dict) -> list[str]:
    """PT-81: đoạn đời thường cho cặp sao ở phía cửa — lĩnh vực theo vai (hướng tinh: tiền bạc & công việc; sơn tinh: người ở)
    và năm sao lưu niên tới cung (năm nên chủ động hơn / năm thuận — nhịp gợi ý, không dự báo)."""
    lv = ch.get("linh_vuc") or {}
    ra = []
    if lv:
        ra.append(L("pt.ds.cap.tien", "Về tiền bạc, công việc (theo phía cửa): {a} {b}", a=lv.get('tien_bac', ''), b=lv.get('cong_viec', '')).strip())
        ra.append(L("pt.ds.cap.nguoi", "Về người ở trong nhà: {a} {b}", a=lv.get('gia_dao', ''), b=lv.get('suc_khoe', '')).strip())
        if lv.get("tam_ly"):
            ra.append(lv["tam_ly"])
    ny = ch.get("nam_chu_y") or {}
    if ny.get("chu_dong") or ny.get("thuan"):
        phan = []
        if ny.get("chu_dong"):
            phan.append(L("pt.ds.cap.chu_dong", "năm nên chủ động hơn ở phía cửa: {ds}", ds=", ".join(str(n) for n in ny["chu_dong"])))
        if ny.get("thuan"):
            phan.append(L("pt.ds.cap.thuan", "năm thuận để sửa sang, mở việc ở phía này: {ds}", ds=", ".join(str(n) for n in ny["thuan"])))
        ra.append(L("pt.ds.cap.nhip", "Theo nhịp từng năm trong 10 năm tới — {phan}. Đây là nhịp gợi ý để sắp việc, không phải lời đoán.",
                    phan="; ".join(phan)))
    ra += _doan_an_toan(ch)
    return ra


@ngon_ngu.theo_viet
def _an_toan_vi(ma: str | None) -> list[str]:
    """Lời an toàn BẢN VIỆT của một cặp sao — so khớp từ khoá luôn trên chữ Việt (bản dịch chọn đúng nhãn bản Việt chọn)."""
    m = (kbp.huyen_khong().get("to_hop_81") or {}).get(ma or "") or {}
    return list(m.get("an_toan") or [])


def _thu_an_toan(ch: dict) -> tuple[str, bool]:
    """(nhóm việc cần chăm theo ngôn ngữ, có phải câu chung không)."""
    van = " ".join(_an_toan_vi(ch.get("ma")) or ch.get("an_toan") or [])
    thu = list(dict.fromkeys(t for k, t in _THU_AN_TOAN if k in van))
    if not thu:
        return L("pt.thu.chung", _THU_CHUNG), True
    return _ds(L(f"pt.thu.{_MA_THU[t]}", t) for t in thu), False


def _doan_an_toan(ch: dict) -> list[str]:
    """Lưu ý an toàn của cặp sao (lửa điện, nước, vật nhọn…) + luật nước vận 9 — lời nhắc chăm nhà, không dự báo."""
    ra = []                       # lời an toàn đã có hộp riêng (`_hop_an_toan`) → đoạn chỉ nói luật nước vận 9
    if ch.get("khong_dat_nuoc"):
        ra.append(L("pt.ds.khong_nuoc", "Phía này không hợp đặt bể cá, thác nước hay đèn đỏ rực: sách xưa vận 9 chỉ đặt nước ở phía có hướng tinh 9, còn phía có sơn tinh 9 hay sao 5, sao 2 thì giữ yên và sạch."))
    elif ch.get("hop_dat_nuoc"):
        ra.append(L("pt.ds.hop_nuoc", "Nếu bạn vốn thích bể cá nhỏ thì phía này là chỗ hợp theo sách xưa (hướng tinh 9 vận 9) — vẫn phải chăm nước sạch, không mua chỉ vì phong thuỷ."))
    return ra


def _hop_an_toan(ch: dict, noi: str) -> dict | None:
    at = ch.get("an_toan") or []
    if not at:
        return None
    thu, chung = _thu_an_toan(ch)
    td = (L("pt.ds.at.td", "{noi}: cẩn thận hơn với {thu}", noi=noi, thu=thu) if not chung
          else L("pt.ds.at.td_chung", "{noi}: vài điều nên chăm kỹ hơn", noi=noi))
    return _hop("luu_y", td, kbp.mau_an_toan(thu), at[0], an_toan=at)


def _ap_tran_muc(c: dict, veto: list[dict]) -> dict:
    """Q1: trần mức theo dấu hiệu lớn đã xác nhận — ghi `tran_muc` để web giải thích vì sao chương không lên Thuận lợi."""
    if not veto:
        return c
    c["tran_muc"] = {"muc_toi_da": MUC_TRAN_VETO, "ly_do": [d["tieu_de"] for d in veto],
                     "giai_thich": L("pt.ds.tran_muc", "Hình thế là nền, lý khí là nhịp: còn dấu hiệu lớn chưa xử lý thì mức không vượt Cân bằng, dù sao tốt tới.")}
    if c.get("muc") == "thuan":
        c["muc"] = MUC_TRAN_VETO
        c["nhan_muc"] = kb.nhan_muc(MUC_TRAN_VETO)
    return c


def _veto(bc_luan: dict | None) -> list[dict]:
    if not bc_luan:
        return []
    return [d for d in bc_luan["dien_giai"]["dau_hieu"] if d.get("veto") and not d["tot"]]


# Review EN-2 (#4): lời KB cặp sao Huyền Không còn thuật ngữ → đổi sang lời thường ở CHỮ HIỂN THỊ (hộp, đoạn, tóm tắt);
# "Vì sao nói vậy" (`can_cu`) giữ nguyên thuật ngữ. Chỉ thay cụm cố định, không sinh câu mới.
_LOI_THUONG = [
    (re.compile(r"lớp 'lý khí' theo sách xưa"), "lớp tính theo hướng và năm xây của sách xưa"),
    (re.compile(r"\bnhân đinh\b"), "người trong nhà"),
    (re.compile(r"\bvận 9\b"), "giai đoạn 2024–2043"),
    (re.compile(r"(?:[Ss]ao sơn|Sơn tinh|[Ss]ơn tinh) \d sách xưa gắn với ([^,;:—]+?)(?:, ([^,;:—]+?))?(?:,| và) ([^,;:—]+?)(?=\s*[:;—])"),
     lambda m: "sách xưa gắn phía này với " + m.group(1) + " và " + (m.group(2) or m.group(3))),
    (re.compile(r"(?:[Ss]ao sơn|Sơn tinh|[Ss]ơn tinh) \d sách xưa gắn với"), "sách xưa gắn phía này với"),
    (re.compile(r"Hai sao cùng hành nên tính sao"), "Hai lớp ở phía cửa cùng một tính nên"),
    (re.compile(r"cặp sao này"), "phía này"),
    (re.compile(r"Kim lâu (?:Thân|Thê|Tử|Lục [Ss]úc)\b"), "Kim lâu"),
    (re.compile(r"\b[Ss]ao năm\b"), "nhịp năm"),
    (re.compile(r"\b[Ss]ao tháng\b"), "nhịp tháng"),
]


# EN-ALL GĐ 5: cùng việc ấy cho chữ tiếng Anh (bản phủ KB cặp sao còn "Period 9", "mountain star n…").
_LOI_THUONG_EN = [
    (re.compile(r"\bin Period 9\b"), "in the 2024–2043 period"),
    (re.compile(r"\bPeriod 9\b"), "the 2024–2043 period"),
    (re.compile(r"\b[Tt]he old books link mountain star \d with"), "the old books link this side with"),
    (re.compile(r"Two stars of the same element tend to"), "With both layers at the door sharing one nature, things tend to"),
    (re.compile(r"\bthis pair of stars\b"), "this side"),
    (re.compile(r"\b[Aa]nnual stars?\b"), "yearly rhythm"),
    (re.compile(r"\b[Mm]onthly stars?\b"), "monthly rhythm"),
    (re.compile(r"Kim Lau – (?:Self|Spouse|Children|Livestock)\b"), "Kim Lau"),
]


def _thuong(s):
    if not isinstance(s, str):
        return s
    if not ngon_ngu.la_viet():
        for rx, thay in _LOI_THUONG_EN:
            s = rx.sub(thay, s)
        return re.sub(r"(^|[.!?]\s+)(the old books)", lambda m: m.group(1) + "The old books", s)
    for rx, thay in _LOI_THUONG:
        s = rx.sub(thay, s)
    s = re.sub(r"(^|[.!?]\s+)(sách xưa)", lambda m: m.group(1) + "Sách xưa", s)
    return s


def _thuong_chuong(c: dict) -> None:
    for k in ("tom_tat",):
        if k in c:
            c[k] = _thuong(c[k])
    c["doan"] = [_thuong(x) for x in c.get("doan", [])]
    for h in c.get("hop", []):
        for k in ("tieu_de", "noi_dung", "huong_xu_ly"):
            if k in h:
                h[k] = _thuong(h[k])


def _dn_kb(dn: str) -> dict:
    """KB du niên đời thường; chính tả "Họa" → "Hoạ" (KB dùng kiểu site)."""
    return kb.du_nien(dn.replace("Họa", "Hoạ"))


def _ten_thuong(dn: str) -> str:
    """Review EN-2: tên đời thường = vế đầu của câu KB `mot_cau` — MỘT nguồn, không lệch thân hộp."""
    return _dn_kb(dn)["mot_cau"].split(",")[0].split(";")[0].strip()


def _cau_sau_ten(dn: str) -> str:
    """Phần còn lại của câu KB sau tên đời thường (tiêu đề đã nói tên → thân không lặp), viết hoa đầu câu."""
    mc = _dn_kb(dn)["mot_cau"]
    ten = _ten_thuong(dn)
    con = mc[len(ten):].lstrip(" ,;")
    return (con[:1].upper() + con[1:] + ".") if con else ""


def _muc_thang(sao: int) -> str:
    ts = kb.thang_sao()
    return "thuan" if sao in ts["thuan"] else "can_chu_dong" if sao in ts["can_chu_dong"] else "can_bang"


# ----------------------------------------------------------------------------- chương 1
def _chuong_ban_hop_huong(mq: dict | None) -> dict:
    c = {"ma": "ban_hop_huong", **kb.chuong("ban_hop_huong"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": []}
    if not mq:
        c.update(thieu="can_sinh", tom_tat=kb.mau("can_sinh"))
        return c
    bang = pt.bang_huong(mq["quai"])
    tot = [h for h in pt.HUONG if bang[h] in pt.CAT]
    kem = [h for h in pt.HUONG if bang[h] not in pt.CAT]
    q = kbp.quai(mq["quai"]) or {}
    thu_tu = sorted(tot, key=lambda h: _UU_TIEN_DU_NIEN.index(bang[h]))
    nhom_ngan = _nhom_ngan(mq["nhom"])                                   # "Đông" / "Tây"
    c["tom_tat"] = L("pt.c1.tom_tat", "Bạn thuộc nhóm hướng {nhom}: bốn phía hợp với bạn là {tot} (tốt nhất là {h0}); bốn phía kém là {kem}.",
                     nhom=nhom_ngan, tot=_ds(_h(h) for h in thu_tu), h0=_h(thu_tu[0]), kem=_ds(_h(h) for h in kem))
    c["hop"].append(_hop("cot_loi", L("pt.c1.cot_loi.td", "Bạn hợp nhóm hướng {nhom}", nhom=nhom_ngan),
                         L("pt.c1.cot_loi.nd", "Quay mặt hay kê đầu về {tot} là thuận với bạn. Nếu chỉ nhớ một hướng: {h0}.",
                           tot=_ds(_h(h) for h in thu_tu), h0=_h(thu_tu[0]))))
    for h in thu_tu[:3]:
        dn = bang[h]
        c["hop"].append(_hop("loi_khuyen", f"{_h(h)}: {_ten_thuong(dn)}", L("pt.c1.dung_cho", "Dùng cho: {x}.", x=_dn_kb(dn)['dung'])))
    xau = sorted(kem, key=lambda h: -_UU_TIEN_DU_NIEN.index(bang[h]))[0]
    c["hop"].append(_hop("luu_y", f"{_h(xau)}: {_ten_thuong(bang[xau])}", _cau_sau_ten(bang[xau]),
                         L("pt.c1.xau.xu_ly", "Để kho, nhà vệ sinh hoặc nơi ít ngồi lâu ở phía này; không kê đầu giường quay về đây.")))
    moc = L("pt.moc.lap_xuan", "Lập xuân") if mq['moc_nam'] == 'lap_xuan' else L("pt.moc.tet", "Tết âm lịch")
    c["doan"] = [L("pt.c1.doan1", "Tám phía tốt xấu quanh bạn tính theo năm sinh (mốc {moc}) "
                   "và giới tính — mỗi người một bảng, người trong nhà có thể khác nhau.", moc=moc),
                 L("pt.c1.doan2", "Phía tốt dùng cho cửa, chỗ ngồi, đầu giường; phía kém dùng cho kho, nhà vệ sinh, cầu thang — đồ đạc và nếp dùng phòng "
                   "là thứ bạn đổi được ngay, không cần sửa nhà.")]
    c["can_cu"] = [L("pt.c1.can_cu", "Bát trạch: mệnh quái {q} (số {so}, {nhom}; tính chất quẻ: {tc}), năm tính {nam}. Du niên 8 phương: {ds}.",
                     q=_q(mq['quai']), so=mq['so'], nhom=_ten.ten("nhom_trach", mq['nhom']), tc=q.get('tinh_chat', ''), nam=mq['nam_tinh'],
                     ds="; ".join(f"{_h(h)} {_dnt(bang[h])}" for h in pt.HUONG))]
    co = mq.get("co_canh_bao", []) if ngon_ngu.la_viet() else _hien().co_canh_bao(mq.get("co_canh_bao", []))
    for cb in co:
        c["can_cu"].append(cb["chi_tiet"])
    c["bang_huong"] = bang
    c["cau_tu_soi"] = L("pt.c1.tu_soi", "Chỗ bạn ngồi làm việc và kê đầu giường hiện quay về phía nào? Có trùng phía hợp với bạn không?")
    return c


# ----------------------------------------------------------------------------- thành viên
def _thanh_vien(mq: dict | None, thanh_vien: list[dict]) -> list[dict]:
    ra = []
    for tv in thanh_vien:
        try:
            m = pt.menh_quai(tv["nam"], tv["gioi_tinh"], tv.get("ngay"), tv.get("moc_nam", "lap_xuan"))
        except (ValueError, KeyError):
            continue
        bang = pt.bang_huong(m["quai"])
        tq = hk.thong_quan(mq["quai"], m["quai"]) if mq else None
        x = {"vai": tv.get("vai", "khac"), "ten_vai": kb.vai(tv.get("vai", "khac")), "quai": m["quai"], "nhom": m["nhom"],
             "huong_tot": [h for h in pt.HUONG if bang[h] in pt.CAT],
             "cung_nhom_voi_chu": (m["nhom"] == mq["nhom"]) if mq else None,
             "huong_chung": hk.huong_chung(mq["quai"], m["quai"]) if mq else [],
             "thong_quan": tq if ngon_ngu.la_viet() else _hien().thong_quan(tq)}
        ra.append(x)
    return ra


# ----------------------------------------------------------------------------- chương 2
def _cau_nhom(trach: dict, mq: dict, cua_hop: bool, cung_nhom: bool) -> str:
    """6b-5 (2026-11-04): Bát trạch xếp nhà theo phía LƯNG nhà (toạ), không theo phía cửa — nhà hướng Đông Nam toạ Tây Bắc
    nên là nhà Tây tứ trạch. Trước đây câu "Nhà và bạn cùng nhóm hướng Tây — bố trí dễ" đứng ngay sau "cửa quay về phía
    kém" → người đọc thấy hai câu ngược nhau. Nay nói rõ nhóm tính theo lưng nhà và ghép đúng bốn trường hợp; mức chương
    không đổi (vẫn du niên của cửa + nhóm trạch–mệnh)."""
    n_nha, n_ban = _nhom_ngan(trach["nhom"]), _nhom_ngan(mq["nhom"])
    goc = L("pt.c2.nhom.goc", "Bát trạch xếp nhóm nhà theo lưng nhà: nhà toạ {toa} là nhà nhóm {n}", toa=_h(trach['toa']), n=n_nha)
    if cua_hop and cung_nhom:
        return L("pt.c2.nhom.ca_hai", "{goc}, cùng nhóm với bạn — cả cửa lẫn lưng nhà đều thuận.", goc=goc)
    if cua_hop:
        return L("pt.c2.nhom.cua_hop", "{goc}, khác nhóm {n} của bạn — chuyện rất thường gặp khi cửa đã hợp; xếp phòng ngủ, bàn làm việc theo bạn là đủ.", goc=goc, n=n_ban)
    if cung_nhom:
        return L("pt.c2.nhom.lung_hop", "{goc}, cùng nhóm với bạn — lưng nhà hợp nên dồn phòng ngủ, bàn làm việc về phía sau và hai bên hợp với bạn.", goc=goc)
    return L("pt.c2.nhom.khong", "{goc}, bạn nhóm {n} — cả cửa lẫn lưng nhà đều chưa hợp, nên chọn phòng và đầu giường theo bạn thay vì theo nhà.", goc=goc, n=n_ban)


_Y_CUC_EN = re.compile(r"^Both timely stars, mountain and facing, sit at the front: ")


def _chuong_ngoi_nha(mq, huong, do, nha, b, tvs, bc_luan) -> dict:
    c = {"ma": "ngoi_nha_voi_ban", **kb.chuong("ngoi_nha_voi_ban"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": []}
    if not huong:
        c.update(thieu="can_huong", tom_tat=kb.mau("can_huong"))
        return c
    trach = pt.trach(huong)
    can_cu = [L("pt.c2.cc.nha", "Nhà hướng {h}{do}, toạ {toa} → {q} trạch ({nhom}).", h=_h(huong),
                do=(f" ({do:.0f}°)" if do is not None else ""), toa=_h(trach['toa']), q=_q(trach['quai']),
                nhom=_ten.ten("nhom_trach", trach['nhom']))]
    # hình thế trước lý khí
    xau = sorted([d for d in (bc_luan or {}).get("dien_giai", {}).get("dau_hieu", []) if not d["tot"]], key=lambda d: not d.get("veto"))
    if xau:
        d0 = xau[0]
        c["hop"].append(_hop("luu_y", L("pt.truoc_het", "Trước hết: {x}", x=d0['tieu_de'].lower()), d0["noi_dung"], d0["goi_y"], viec=d0.get("viec") or None,
                             veto=True if d0.get("veto") else None))
    muc_parts = []
    if mq:
        dn = pt.du_nien(mq["quai"], huong)["du_nien"]
        cung_nhom = mq["nhom"].split()[0] == trach["nhom"].split()[0]
        muc_parts += [_muc_du_nien(dn), "thuan" if cung_nhom else "can_chu_dong"]
        can_cu.append(L("pt.c2.cc.cung" if cung_nhom else "pt.c2.cc.khac",
                        "Hướng {h} với mệnh {q} là {dn}; " + ("cùng" if cung_nhom else "khác") + " nhóm Đông/Tây với trạch.",
                        h=_h(huong), q=_q(mq['quai']), dn=_dnt(dn)))
        c["hop"].append(_hop("cot_loi", L("pt.c2.huong_ban", "Hướng {h} với bạn: {t}", h=_h(huong), t=_ten_thuong(dn)),
                             ((_cau_sau_ten(dn) + " ").lstrip() if dn in pt.CAT else
                              L("pt.c2.cua_kem", "Cửa nhà quay về phía kém với riêng bạn — không cần đổi nhà; bù bằng đầu giường, bàn làm việc "
                                "quay về phía hợp với bạn. ")) + _cau_nhom(trach, mq, dn in pt.CAT, cung_nhom)))
    else:
        c["hop"].append(_hop("cot_loi", L("pt.c2.nha_huong", "Nhà hướng {h}", h=_h(huong)),
                             L("pt.c2.phia_hop_nha", "Các phía hợp với nhà là {ds}. Thêm năm sinh để so với mệnh bạn.",
                               ds=_ds(_h(h) for h in pt.HUONG if pt.bang_huong(trach["quai"])[h] in pt.CAT))))
    if b:
        ch = b["cap_huong"]
        muc_parts.append(ch["muc"])
        can_cu.append(L("pt.c2.cc.hk", "Huyền Không vận {van}, toạ {toa} hướng {huong}: cục {cuc}; cung hướng ({phuong}) sơn tinh {son} – hướng tinh {hh} ({ten}), "
                        "sao hướng đang {tt}.", van=b['van'], toa=_ten.ten("son", b['toa']['son']), huong=_ten.ten("son", b['huong']['son']),
                        cuc=_ten.ten("cuc_hk", b['cuc_ten']), phuong=_h(b['huong']['phuong']), son=ch['son'], hh=ch['huong'], ten=ch['ten'],
                        tt=_ten.ten("trang_thai_sao", ch['trang_thai_huong'])))
        loai = "diem_manh" if ch["muc"] == "thuan" else "luu_y" if ch["muc"] == "can_chu_dong" else "loi_khuyen"
        lv = ch.get("linh_vuc") or {}
        than_cua = " ".join(x for x in (lv.get("tien_bac"), lv.get("gia_dao")) if x) or ch["y"]
        can_cu.append(L("pt.c2.cc.cap", "Cặp sao phía cửa: {y}", y=ch['y']))
        c["hop"].append(_hop(loai, L("pt.c2.cua_nam_xay", "Phía cửa theo năm xây {nam}: {muc}", nam=b['nam_xay'], muc=kb.nhan_muc(ch['muc'])), than_cua,
                             (ch.get("luu_y") or None) if loai == "luu_y" else None))
        kcuc = (kbp.huyen_khong().get("cuc") or {}).get(b["cuc"], {})
        if kcuc:
            y = re.sub(r"^(Cả )?sao vượng sơn lẫn hướng cùng về phía hướng: ", "", kcuc.get("y", ""))
            if not ngon_ngu.la_viet():
                y = _Y_CUC_EN.sub("", y)
            c["doan"].append(L("pt.c2.theo_nam_xay", "Theo năm xây: {y} Gợi ý: {g}", y=y[:1].lower() + y[1:], g=kcuc.get('goi_y', '')))
        c["doan"].extend(_doan_cap_sao(ch))
        h_at = _hop_an_toan(ch, L("pt.phia_cua", "Phía cửa"))
        if h_at:
            c["hop"].append(h_at)
    if tvs:
        khac = [t for t in tvs if t["cung_nhom_voi_chu"] is False]
        if khac:
            c["doan"].append(kb.mau("khac_nhom") + " " + "; ".join(
                L("pt.c2.tv_khac", "{vai} mệnh {q} hợp {h}", vai=t['ten_vai'].capitalize(), q=_q(t['quai']), h=_ds(_h(x) for x in t['huong_tot'][:2]))
                for t in khac) + ".")
        else:
            c["doan"].append(kb.mau("cung_nhom") + " " + "; ".join(
                L("pt.c2.tv_cung", "{vai} mệnh {q}", vai=t['ten_vai'].capitalize(), q=_q(t['quai'])) for t in tvs) + ".")
        for t in tvs:
            tq = t.get("thong_quan") or {}
            if tq.get("hanh_thong_quan"):
                c["hop"].append(_hop("loi_khuyen", L("pt.c2.tq.td", "Bạn và {vai}: hai hành chạm nhau", vai=t['ten_vai']), tq["goi_y"]))
            if t["huong_chung"]:
                can_cu.append(L("pt.c2.cc.chung", "Hướng tốt chung của bạn và {vai}: {ds}.", vai=t['ten_vai'], ds=_ds(_h(x) for x in t['huong_chung'])))
    if nha.get("theo") == "ban_cong":
        c["doan"].append(kb.mau("ban_cong"))
    c["muc"] = _gop_muc(*muc_parts)
    c["nhan_muc"] = kb.nhan_muc(c["muc"]) if c["muc"] else None
    _ap_tran_muc(c, _veto(bc_luan))
    c["tom_tat"] = (L("pt.c2.tt.nha", "Nhà hướng {h}. ", h=_h(huong))
                    + (L("pt.c2.tt.voi_ban", "Với bạn: {muc}.", muc=kb.nhan_muc(c['muc']).lower()) if c["muc"] else "")
                    + (L("pt.c2.tt.tran", " Có dấu hiệu lớn cần xử lý trước.") if c.get("tran_muc") else "")).strip()
    c["doan"].insert(0, kb.mau("hinh_the_truoc"))
    c["can_cu"] = can_cu
    c["cau_tu_soi"] = L("pt.c2.tu_soi", "Bước vào nhà, bạn thấy sáng và dễ thở, hay tối và bí? Cảm giác đó quan trọng hơn mọi con số ở trên.")
    return c


# ----------------------------------------------------------------------------- chương 3
def _chuong_tung_phong(mq, huong, b, bc_luan, bo_cuc_in) -> dict:  # noqa: C901
    c = {"ma": "tung_phong", **kb.chuong("tung_phong"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": [],
         "phong": [], "goi_y_phong": [], "cua_chu_bep": None}
    bang = pt.bang_huong(mq["quai"]) if mq else (pt.bang_huong(pt.trach(huong)["quai"]) if huong else None)
    k = kbp.bo_cuc()
    if bc_luan and bc_luan["da_tinh"]["vi_tri"]:
        mucs = []
        for v in bc_luan["da_tinh"]["vi_tri"]:
            dn = v["du_nien_menh"] or v["du_nien_trach"]
            m_dn = None if dn is None else ("thuan" if v["hop"] else "can_chu_dong")
            cap = _cap_tai(b, v["cung"])
            # Du niên với NGƯỜI Ở quyết định; cặp sao Huyền Không chỉ hạ một bậc khi kém (không nâng).
            muc = m_dn or (cap["muc"] if cap else None) or "can_bang"
            if cap and cap["muc"] == "can_chu_dong" and muc == "thuan":
                muc = "can_bang"
            mucs.append(muc)
            kbv = k["vi_tri_phong"].get(v["phong"], {})
            c["phong"].append({"phong": v["phong"], "ten": v["ten"], "cung": v["cung"], "du_nien": dn, "hop": v["hop"], "muc": muc,
                               "nhan_muc": kb.nhan_muc(muc), "cap_sao": cap, "nen": v["nen"], "kb": kbv.get("noi_dung"), "thuc_te": kbv.get("thuc_te")})
            if muc == "can_chu_dong":
                ai = L("pt.ban", "bạn") if v['du_nien_menh'] else L("pt.nha", "nhà")
                ly = (L("pt.c3.ly", "{ten} ở phía {cung} là {dn} với {ai}", ten=v['ten'], cung=_h(v['cung']), dn=_dnt(dn), ai=ai) if dn
                      else L("pt.c3.ly_0", "{ten} ở phía {cung}", ten=v['ten'], cung=_h(v['cung'])))
                if cap and cap["muc"] == "can_chu_dong":
                    ly += L("pt.c3.ly_cap", "; cặp sao {s}–{h} ({ten}) ở đây cũng kém", s=cap['son'], h=cap['huong'], ten=cap['ten'])
                c["hop"].append(_hop("luu_y", L("pt.c3.de_y", "{ten} — nên để ý", ten=v['ten']), ly + ".",
                                     kbv.get("thuc_te") or L("pt.c3.doi_dung", "Nếu không dời được, đổi cách dùng: giữ gọn, đủ sáng, dùng ít hơn.")))
            elif muc == "thuan":
                c["hop"].append(_hop("diem_manh", L("pt.c3.hop", "{ten} — đang hợp", ten=v['ten']),
                                     L("pt.c3.hop_nd", "{ten} ở phía {cung} ({dn}) là chỗ hợp. Giữ nguyên.", ten=v['ten'], cung=_h(v['cung']), dn=_dnt(dn))))
        c["muc"] = _gop_muc(*mucs)
        ccb = bc_luan["da_tinh"]["cua_chu_bep"]
        if ccb:
            c["cua_chu_bep"] = ccb
            xau = [x for x in ccb["cap"] if not x["cat"]]
            c["can_cu"].append(L("pt.c3.cc.ccb", "Cửa – chủ – bếp (Dương Trạch Tam Yếu): {ds}.",
                                 ds="; ".join(f"{x['cap']} {_dnt(x['du_nien'])}" for x in ccb["cap"])))
            if xau:
                c["hop"].append(_hop("loi_khuyen", L("pt.c3.ccb.td", "Cửa, phòng ngủ, bếp chưa cùng nhịp"),
                                     L("pt.c3.ccb.nd", "Cặp {ds} đang ở du niên kém. Phần dễ đổi nhất là miệng bếp và đầu giường — quay về phía hợp với bạn.",
                                       ds=_ds(x['cap'] for x in xau))))
        dau_tien = True
        for d in sorted(bc_luan["dien_giai"]["dau_hieu"], key=lambda d: not d.get("veto")):
            if not d["tot"]:
                c["hop"].append(_hop("luu_y", (L("pt.truoc_het", "Trước hết: {x}", x=d["tieu_de"]) if d.get("veto") and dau_tien else d["tieu_de"]),
                                     d["noi_dung"], d["goi_y"], viec=d.get("viec") or None, veto=True if d.get("veto") else None))
                dau_tien = False
        for q in bc_luan.get("quy_tac", [])[:2]:        # Q6: luật thực hành cho căn hộ (xử lý trong cửa, không đập kết cấu)
            c["hop"].append(_hop("loi_khuyen", q["tieu_de"], q["noi_dung"]))
        for p in c["phong"]:                            # lưu ý an toàn của cặp sao tại phòng bếp / phòng ngủ
            if p["phong"] in ("bep", "phong_ngu_chinh") and (p.get("cap_sao") or {}).get("an_toan"):
                h_at = _hop_an_toan(p["cap_sao"], p["ten"])
                if h_at:
                    c["hop"].append(h_at)
        c["quy_tac"] = bc_luan.get("quy_tac", [])
        c["mat_bang"] = bc_luan.get("mat_bang")
        c["doan"].append(L("pt.c3.doan", "Mỗi phòng xét hai lớp: du niên của phía đó với bạn (Bát trạch) và cặp sao sơn–hướng theo năm xây (Huyền Không, nếu có). "
                           "Phòng nào 'cần chủ động' không có nghĩa là bỏ phòng — thường chỉ cần đổi cách dùng."))
    else:
        c["thieu"] = "can_bo_cuc"
        c["doan"].append(kb.mau("can_bo_cuc"))
    if bang:
        tot = sorted([h for h in pt.HUONG if bang[h] in pt.CAT], key=lambda h: _UU_TIEN_DU_NIEN.index(bang[h]))
        kem = sorted([h for h in pt.HUONG if bang[h] not in pt.CAT], key=lambda h: -_UU_TIEN_DU_NIEN.index(bang[h]))
        # 6b-5: nhà đã có hướng → nói về CỬA ĐANG CÓ (không gợi "đặt cửa Tây Nam" cho nhà đang quay Đông Nam).
        if huong in bang:
            cua = (L("pt.c3.gy.cua_hop", "Cửa chính: đang quay về {h} ({dn}) — đã hợp, giữ nguyên, giữ lối vào sáng và gọn", h=_h(huong), dn=_dnt(bang[huong]))
                   if bang[huong] in pt.CAT else
                   L("pt.c3.gy.cua_kem", "Cửa chính: đang quay về {h} ({dn}) — không cần đổi cửa; nếu nhà có cửa phụ, lối vào phía "
                     "{t} ({tdn}) thì dùng làm lối đi hằng ngày", h=_h(huong), dn=_dnt(bang[huong]), t=_h(tot[0]), tdn=_dnt(bang[tot[0]])))
        else:
            cua = L("pt.c3.gy.cua", "Cửa chính / lối vào: phía {t} ({tdn})", t=_h(tot[0]), tdn=_dnt(bang[tot[0]]))
        h_giuong = next((h for h in tot if bang[h] == 'Diên Niên'), tot[0])
        h_bep = next((h for h in tot if bang[h] == 'Thiên Y'), tot[0])
        h_tho = next((h for h in tot if bang[h] == 'Phục Vị'), tot[-1])
        goi = [("cua_chinh", cua),
               ("phong_ngu_chinh", L("pt.c3.gy.giuong", "Phòng ngủ chính, đầu giường: phía {h}", h=_h(h_giuong))),
               ("bep", L("pt.c3.gy.bep", "Bếp: thân bếp đặt phía kém ({k} {kdn}), miệng bếp quay về phía {h}", k=_h(kem[0]), kdn=_dnt(bang[kem[0]]), h=_h(h_bep))),
               ("ban_tho", L("pt.c3.gy.tho", "Bàn thờ, bàn học: phía {h} ({dn})", h=_h(h_tho), dn=_dnt(bang[h_tho]))),
               ("ve_sinh", L("pt.c3.gy.wc", "Nhà vệ sinh, kho: phía {a} hoặc {b}", a=_h(kem[0]), b=_h(kem[1])))]
        c["goi_y_phong"] = [{"phong": p, "ten": bo_cuc.ten_phong(p) if p in _TEN_PHONG else p, "goi_y": g} for p, g in goi]
        if not c["hop"]:
            cua_ngan = (L("pt.c3.ba.cua_giu", "cửa giữ hướng {h}", h=_h(huong)) if huong in bang and bang[huong] in pt.CAT else
                        L("pt.c3.ba.loi_di", "lối đi hằng ngày phía {h}", h=_h(tot[0])) if huong in bang else
                        L("pt.c3.ba.cua_ve", "cửa về {h}", h=_h(tot[0])))
            c["hop"].append(_hop("loi_khuyen", L("pt.c3.ba.td", "Ba chỗ quan trọng nhất"),
                                 L("pt.c3.ba.nd", "{cua}; đầu giường về {g}; miệng bếp về {b}. Ba điểm này sách xưa gọi là cửa – chủ – bếp.",
                                   cua=cua_ngan[:1].upper() + cua_ngan[1:], g=_h(h_giuong), b=_h(h_bep))))
        c["can_cu"].append((L("pt.c3.cc.menh", "Theo mệnh bạn") if mq else L("pt.c3.cc.trach", "Theo trạch")) + ": "
                           + "; ".join(f"{_h(h)} {_dnt(bang[h])}" for h in pt.HUONG) + ".")
    c["nhan_muc"] = kb.nhan_muc(c["muc"]) if c["muc"] else None
    _ap_tran_muc(c, _veto(bc_luan))
    c["tom_tat"] = (L("pt.c3.tt", "{n} phòng đã khai: {ds}.", n=len(c['phong']),
                      ds=_ds(f"{p['ten'].lower()} {kb.nhan_muc(p['muc']).lower()}" for p in c["phong"]))
                    if c["phong"] else L("pt.c3.tt_0", "Chưa khai bố cục — dưới đây là gợi ý đặt phòng theo mệnh của bạn."))
    c["cau_tu_soi"] = k["tu_soi"][1] if len(k.get("tu_soi", [])) > 1 else None
    return c


# ----------------------------------------------------------------------------- chương 4
def _chuong_nam_nay(mq, sinh, huong, b, bc_luan, ngay_xem: dt.date) -> dict:
    c = {"ma": "nam_nay", **kb.chuong("nam_nay"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": [], "han_nam": [], "ba_thang": []}
    t_utc = dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - dt.timedelta(hours=7)
    nam = hk.nam_theo_lap_xuan(t_utc)
    hn = tdg_luan.han_nam_luan(nam)
    if not ngon_ngu.la_viet():
        hn = _hien().han_nam(hn)
    c["han_nam"] = [{k2: v for k2, v in x.items()} for x in hn["huong_tranh"]]
    c["can_cu"].append(L("pt.c4.cc.nam", "Năm {nam} ({cc}), {moc} Phương tránh: {ds}.", nam=nam, cc=hn['can_chi'], moc=hn['moc'],
                         ds="; ".join(f"{x['ten']} {_h(x['phuong'])}" for x in c["han_nam"])))
    phuong_tranh = {x["phuong"] for x in c["han_nam"]}
    cham = []
    if huong and huong in phuong_tranh:
        cham.append(L("pt.c4.cham_cua", "phía cửa ({h})", h=_h(huong)))
    for v in (bc_luan or {}).get("da_tinh", {}).get("vi_tri", []):
        if v["cung"] in phuong_tranh and v["phong"] in ("phong_ngu_chinh", "bep"):
            cham.append(f"{v['ten'].lower()} ({_h(v['cung'])})")
    if cham:
        c["hop"].append(_hop("luu_y", L("pt.c4.giu_yen.td", "Năm {nam}: phía cửa nên giữ yên", nam=nam),
                             L("pt.c4.giu_yen.nd", "Năm nay {ds} trùng phía sách xưa khuyên giữ yên.", ds=_ds(cham)),
                             L("pt.c4.giu_yen.xl", "Không đục phá, không động thổ phía đó trong năm; sửa nhỏ, dọn gọn thì được.")))
        muc_nam = "can_chu_dong"
    else:
        c["hop"].append(_hop("diem_manh", L("pt.c4.khong_trung.td", "Năm {nam}: cửa và phòng chính không trùng phía tránh", nam=nam),
                             L("pt.c4.khong_trung.nd", "Các phía năm nay nên giữ yên là {ds}. Cửa chính và phòng chính của bạn không nằm ở đó.",
                               ds=_ds(_h(p) for p in dict.fromkeys(x['phuong'] for x in c['han_nam'])))))
        muc_nam = "thuan"
    # 3 tháng tới: sao tháng vào cung hướng (cửa) + lưu niên
    ln = hk.luu_nien(nam)
    q_huong = _CUNG_QUAI[huong] if huong else None
    thang0 = hk.luu_nguyet_tai(ngay_xem)
    mucs = []
    for i in range(3):
        th = thang0["thang"] + i
        n2, th2 = (thang0["nam"], th) if th <= 12 else (thang0["nam"] + 1, th - 12)
        lm = hk.luu_nguyet(n2, th2)
        sao = lm["cung"][q_huong] if q_huong else lm["tam"]
        muc = _muc_thang(sao)
        mucs.append(muc)
        # KC-4: ngày dương bắt đầu tháng tiết (giờ VN) — để nhắc việc / lịch; tháng Sửu (k=12) rơi sang năm dương sau.
        kd = (315 + 30 * (th2 - 1)) % 360
        tu_ngay = (tietkhi.thoi_diem(n2 + (1 if th2 == 12 else 0), kd) + dt.timedelta(hours=7)).date().isoformat()
        c["ba_thang"].append({"nam": n2, "thang": th2, "chi_thang": lm["chi_thang"], "tu_ngay": tu_ngay, "sao_tam": lm["tam"],
                              "sao_tai_cua": sao if q_huong else None,
                              "ten_sao": hk.SAO[sao], "muc": muc, "nhan_muc": kb.nhan_muc(muc), "y": kb.thang_sao().get("y", {}).get(muc, "")})
    if q_huong:
        sao_nam_cua = ln["cung"][q_huong]
        c["can_cu"].append(L("pt.c4.cc.ln", "Lưu niên {nam}: {tam} nhập trung, sao {s} tới cung cửa ({h}). Lưu nguyệt: {ds} (tháng theo tiết khí).",
                             nam=nam, tam=_ten.ten("sao_bay", ln['sao_tam']), s=sao_nam_cua, h=_h(huong),
                             ds="; ".join(L("pt.c4.cc.thang_sao", "{thang} sao {s}", thang=_thang(x['chi_thang']), s=x['sao_tai_cua']) for x in c["ba_thang"])))
    thuan_th = [x for x in c["ba_thang"] if x["muc"] == "thuan"]
    giu = [x for x in c["ba_thang"] if x["muc"] == "can_chu_dong"]
    t0 = _thang(thuan_th[0]['chi_thang']) if thuan_th else ""
    nd = (L("pt.c4.th.thuan", "{thang} là tháng thuận để sửa sang, kê lại phía cửa. ", thang=t0[:1].upper() + t0[1:])
          if thuan_th else L("pt.c4.th.khong", "Ba tháng tới không có tháng nổi bật để sửa lớn phía cửa. ")) \
        + (L("pt.c4.th.giu", "{ds} nên giữ yên phía cửa.", ds=_thang_ds(giu)) if giu else "")
    c["hop"].append(_hop("thoi_diem", L("pt.c4.ba_thang.td", "3 tháng tới (theo tiết khí)"), nd.strip(), muc=_gop_muc(*mucs)))
    if sinh:
        tl = tdg_luan.xem_tuoi_lam_nha(sinh["nam"], nam, sinh["ngay"].month if sinh.get("ngay") else None, sinh["ngay"].day if sinh.get("ngay") else None)
        if not ngon_ngu.la_viet():
            tl = _hien().tuoi_lam_nha(tl)
        c["tuoi_lam_nha"] = {k2: tl[k2] for k2 in ("tuoi_mu", "ket_luan", "nam_thuan", "kim_lau", "hoang_oc", "tam_tai", "uoc_luong_nam_sinh")}
        c["hop"].append(_hop("thoi_diem", L("pt.c4.tuoi.td", "Tuổi làm nhà năm {nam}", nam=nam),
                             tl["ket_luan"]["chu"] + (L("pt.c4.tuoi.nam_thuan", " Năm thuận gần nhất theo tuổi: {ds}.", ds=_ds(str(x['nam']) for x in tl['nam_thuan'][:2]))
                                                      if tl["ket_luan"]["ma"] != "thuan" and tl["nam_thuan"] else ""),
                             muc="thuan" if tl["ket_luan"]["ma"] == "thuan" else "can_bang"))
        c["can_cu"].append(tl["cach_tinh"])
    # SK-1 (2026-11-04): năm sao lưu niên 2 / 5 (sách xưa gắn với sức khoẻ người ở) tới phía phòng ngủ chính (không có
    # thì phía toạ — sơn = người ở) → lời nhắc khám định kỳ; không đổi mức chương.
    vt_ngu = next((v for v in (bc_luan or {}).get("da_tinh", {}).get("vi_tri", []) if v["phong"] == "phong_ngu_chinh"
                   and v["cung"] in _CUNG_QUAI), None)
    q_sk, noi_sk = ((_CUNG_QUAI[vt_ngu["cung"]], L("pt.c4.noi_ngu", "phòng ngủ chính ({h})", h=_h(vt_ngu['cung']))) if vt_ngu
                    else ((b["toa"]["quai"], L("pt.c4.noi_toa", "toạ (lưng nhà)")) if b else (None, None)))
    if q_sk:
        h_sk = skn.hop_nam(skn.phongthuy_nam(q_sk, nam, noi=noi_sk), "",
                           lambda loai, td, nd, cu, _ma, _w, **k: _hop(loai, td, nd, can_cu=cu, **k))
        if h_sk:
            c["hop"].append(h_sk)
    # CY-1: sao lưu niên KB của từng mảng (7 tiền bạc, 3 giấy tờ, 5 nhà cửa) bay tới phía cửa chính → "Năm nên chú ý …
    # hơn" (lời nhắc chủ động, không đổi mức chương).
    if q_huong:
        from app.luangiai import chu_y_nam as cyn  # noqa: PLC0415
        mangs = cyn.kb.chuong("phongthuy").get("nam_nay") or []
        theo = {m: cyn.phongthuy_nam(q_huong, nam, m, noi=L("hoi.pt.cy.noi", "cửa chính ({h})", h=_h(huong))) for m in mangs}
        co = [m for m in mangs if theo[m]]
        if co:
            h_cy = cyn.hop_chuong(theo, kh.ma_mau("phongthuy", "nam_nay", "chu_y", "+".join(co), cyn.ma_ly_do(theo[co[0]][0])),
                                  lambda loai, td, nd, cu, ma, _w, **k: _hop(loai, td, nd, can_cu=cu, ma_mau=ma, **k))
            if h_cy:
                c["hop"].append(h_cy)
    c["muc"] = _gop_muc(muc_nam, *mucs)
    c["nhan_muc"] = kb.nhan_muc(c["muc"])
    phuong_yen = list(dict.fromkeys(x["phuong"] for x in hn["huong_tranh"]))
    c["tom_tat"] = L("pt.c4.tt", "Năm {nam} ({cc}): nên giữ yên, không động thổ lớn ở phía {ds}. Ba tháng tới: {bt}.", nam=nam, cc=hn['can_chi'],
                     ds=_ds(_h(p) for p in phuong_yen),
                     bt=_ds(f"{_thang(x['chi_thang'])} {x['nhan_muc'].lower()}" for x in c["ba_thang"]))
    c["doan"] = [L("pt.c4.doan", "Nhịp năm và nhịp tháng là lớp thời gian chồng lên nhà — dùng để chọn lúc sửa chữa, động thổ, dọn phòng. "
                   "Việc cần thiết cho an toàn (điện, nước, dột) thì làm ngay, không chờ tháng.")]
    c["cau_tu_soi"] = L("pt.c4.tu_soi", "Trong ba tháng tới bạn định sửa hay kê lại chỗ nào? Có rơi vào phía đang cần giữ yên không?")
    return c


def _thang_ds(ds: list[dict]) -> str:
    """"Tháng Dần, Mão" (bản Việt nối tên chi sau một chữ "Tháng") / "The Yin month, Mao month" theo ngôn ngữ."""
    if ngon_ngu.la_viet():
        return "Tháng " + ", ".join(x['chi_thang'] for x in ds)
    s = _ds(_thang(x['chi_thang']) for x in ds)
    return s[:1].upper() + s[1:]


# ----------------------------------------------------------------------------- chương 5
def _chuong_viec_nen_lam(c1, c2, c3, c4) -> dict:
    c = {"ma": "viec_nen_lam", **kb.chuong("viec_nen_lam"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": [], "hanh_dong": []}
    lam, cho, tranh = [], [], []
    for h in c1.get("hop", []):
        if h["loai"] == "loi_khuyen" and len(lam) < 2:
            lam.append(L("pt.c5.ke", "Kê đầu giường hoặc bàn làm việc về phía {x}.", x=h['tieu_de'].split(' — ')[0]))
    for h in c3.get("hop", []):
        if h["loai"] == "luu_y" and h.get("huong_xu_ly") and len(lam) < 4:
            lam.append(h["huong_xu_ly"])
    for h in c2.get("hop", []):
        if h["loai"] == "luu_y" and h.get("huong_xu_ly") and len(lam) < 4:
            lam.insert(0, h["huong_xu_ly"])
    for x in c4.get("ba_thang", []):
        if x["muc"] == "thuan" and len(cho) < 2:
            cho.append(L("pt.c5.cho_thang", "Sửa sang, kê lại phía cửa vào {thang} (theo tiết khí).", thang=_thang(x['chi_thang'])))
    if c4.get("tuoi_lam_nha") and c4["tuoi_lam_nha"]["ket_luan"]["ma"] != "thuan" and c4["tuoi_lam_nha"]["nam_thuan"]:
        cho.append(L("pt.c5.cho_nam", "Việc lớn (xây, sửa toàn bộ) dân gian thường chờ năm {nam}.", nam=c4['tuoi_lam_nha']['nam_thuan'][0]['nam']))
    if not cho:
        cho.append(L("pt.c5.cho_san_sang", "Việc lớn chờ lúc nhà cửa, tiền bạc và người trong nhà cùng sẵn sàng — không chờ vì sao."))
    for x in c4.get("han_nam", [])[:3]:
        tranh.append(L("pt.c5.tranh", "Không đục phá, động thổ phía {p} ({ten}) trong năm nay.", p=_h(x['phuong']), ten=x['ten']))
    for h in c1.get("hop", []):
        if h["loai"] == "luu_y":
            tranh.append(h["huong_xu_ly"].replace("Để kho", "Không kê đầu giường, bàn làm việc ở phía kém; để kho") if ngon_ngu.la_viet()
                         else L("pt.c5.tranh_kem", "Không kê đầu giường, bàn làm việc ở phía kém; để kho, nhà vệ sinh hoặc nơi ít ngồi lâu ở phía này; không kê đầu giường quay về đây."))
            break
    mac = L("pt.c5.mac_dinh", "Dọn gọn phía cửa chính, mở sáng, thông gió.")
    c["hanh_dong"] = [{"ma": "lam_ngay", "nhan": L("pt.c5.nhan.lam_ngay", "Làm ngay (chỉ cần kê lại)"), "viec": lam[:4] or [mac]},
                      {"ma": "cho_luc", "nhan": L("pt.c5.nhan.cho_luc", "Chờ đúng lúc"), "viec": cho[:4]},
                      {"ma": "tranh", "nhan": L("pt.c5.nhan.tranh", "Tránh trong năm nay"),
                       "viec": tranh[:4] or [L("pt.c5.tranh_mac", "Không động thổ ở phía năm nay nên giữ yên.")]}]
    c["hop"].append(_hop("cot_loi", L("pt.c5.mot_viec", "Nếu chỉ làm một việc"), lam[0] if lam else mac))
    # Q5: cùng những việc ấy xếp theo CHI PHÍ (0 đồng · ít tiền · sửa chữa) — việc của dấu hiệu đã xác nhận đi trước.
    # EN-ALL: bỏ trùng theo CHỮ → bản dịch theo đúng quyết định nhận / bỏ của bản Việt.
    theo = {"khong_ton": [], "it_tien": [], "sua_chua": []}
    i = 0
    for ch in (c2, c3):
        for h in ch.get("hop", []):
            for v in h.get("viec") or []:
                i += 1
                if kh.quyet(("pt.viec", i), v["lam"] not in theo[v["chi_phi"]] and len(theo[v["chi_phi"]]) < 5):
                    theo[v["chi_phi"]].append(v["lam"])
    for x in lam:
        i += 1
        if kh.quyet(("pt.viec", i), x not in theo["khong_ton"] and len(theo["khong_ton"]) < 5):
            theo["khong_ton"].append(x)
    if not theo["it_tien"]:
        theo["it_tien"].append(L("pt.c5.it_tien", "Thêm đèn ấm và một chậu cây ở lối vào; rèm cho cửa sổ phòng ngủ hướng nắng."))
    if not theo["sua_chua"]:
        theo["sua_chua"].append(L("pt.c5.sua_chua", "Chưa thấy việc gì phải sửa chữa — giữ nguyên, chỉ kê lại là đủ."))
    cp = bo_cuc.chi_phi()
    c["hanh_dong_chi_phi"] = [{"ma": k2, "nhan": cp[k2], "viec": v} for k2, v in theo.items()]
    c["doan"] = [kb.mau("khong_vat_pham"),
                 L("pt.c5.doan", "Có việc là của nhà (kê lại, sửa), có việc là của thói quen (dọn, đóng cửa, giờ giấc). Nhóm 0 đồng phần lớn là việc của thói quen — làm trước, rồi mới tính đến sửa.")]
    c["tom_tat"] = L("pt.c5.tt", "Ba nhóm việc theo thời điểm (làm ngay · chờ đúng lúc · tránh trong năm) và ba mức theo chi phí (0 đồng · ít tiền · sửa chữa).")
    c["cau_tu_soi"] = (kbp.bo_cuc().get("tu_soi") or [None])[0]
    return c


# ----------------------------------------------------------------------------- báo cáo
def _theo_y_dinh(ma: str | None, chuong: list[dict], bc_luan: dict | None, huong: str | None, nam: int) -> dict | None:
    """Đồ thị tri thức theo ý định (thay Cypher của Drive): từ điều người dùng đang băn khoăn → phòng cần nhìn, dấu hiệu nên
    rà (đã khai / chưa khai), hộp liên quan trong bài, và năm sao kích hoạt tới phía phòng đó (TRIGGERS_TIMING)."""
    if not ma:
        return None
    g = do_thi.theo_y_dinh(ma)
    if not g:
        return None
    from app.kb import y_dinh_chung  # noqa: PLC0415
    ten = (y_dinh_chung.tat_ca().get(ma) or {}).get("ten", ma)
    ten_phong = {p: bo_cuc.ten_phong(p) for p in g["phong"]}
    cung_phong = {v["phong"]: v["cung"] for v in (bc_luan or {}).get("da_tinh", {}).get("vi_tri", [])}
    if huong and "cua_chinh" not in cung_phong:
        cung_phong["cua_chinh"] = huong
    da_khai = {d["ma"]: d for d in (bc_luan or {}).get("dien_giai", {}).get("dau_hieu", [])}
    dau_hieu = [{"ma": x, "hoi": bo_cuc.hoi(x), "co": x in da_khai, "veto": x in bo_cuc.dau_hieu_veto(),
                 "sao_kich_hoat": g["sao_kich_hoat"].get(x, [])} for x in g["dau_hieu"] if x in bo_cuc.DAU_HIEU]
    tu_khoa = [t.lower() for t in ten_phong.values()] + [d["tieu_de"].lower() for d in da_khai.values() if d["ma"] in g["dau_hieu"]]
    # chỉ so tiêu đề hộp (phòng / dấu hiệu) — so CHỮ → bản dịch theo đúng các hộp bản Việt chọn
    chon = []
    for ci, c in enumerate(chuong):
        for hi, h in enumerate(c.get("hop", [])):
            if any(t in h["tieu_de"].lower() for t in tu_khoa) and len(chon) < 4:
                chon.append((ci, hi))
    chon = kh.quyet(("pt.y_dinh", ma), chon)
    hop = [{**chuong[ci]["hop"][hi], "tu_chuong": chuong[ci]["ma"]} for ci, hi in chon
           if ci < len(chuong) and hi < len(chuong[ci].get("hop", []))]
    nam_sao = []
    for p, cung in cung_phong.items():
        if p in g["phong"] and cung != "Trung cung":
            q = _CUNG_QUAI[cung]
            toi = [n for n in range(nam, nam + 6) if hk.luu_nien(n)["cung"][q] in g["sao"]]
            if toi:
                nam_sao.append({"phong": p, "ten": bo_cuc.ten_phong(p), "cung": cung, "nam": toi,
                                "sao": [hk.luu_nien(n)["cung"][q] for n in toi]})
    return {"ma": ma, "ten": ten, "phong": [{"ma": p, "ten": t, "cung": cung_phong.get(p)} for p, t in ten_phong.items()],
            "dau_hieu": dau_hieu, "hop": hop, "nam_sao_toi": nam_sao,
            "loi": L("pt.yd.loi", "Nhịp từng năm theo sách xưa chỉ nói lúc nào nên chủ động hơn với phòng đó — nền vẫn là ánh sáng, gió, lối đi và các dấu hiệu bên trên.")}


@kh.vi_quyet_dinh
def luan_giai(sinh: dict | None, nha: dict, thanh_vien: list[dict] | None = None, ngay_xem: dt.date | None = None,
              goc_nhin: str = "sach_xua", y_dinh: str | None = None) -> dict:
    """`sinh` = {nam, gioi_tinh, ngay|None, moc_nam} hoặc None · `nha` = {huong_do | huong | bo_cuc, nam_xay, toa, theo} ·
    `thanh_vien` = [{vai, nam, gioi_tinh, ngay|None}] · `ngay_xem` mặc định hôm nay (giờ VN) · `goc_nhin` (Q4) sach_xua /
    doi_song cho lời giải thích dấu hiệu · `y_dinh` (đồ thị tri thức) mã ý định chung → mục "Theo điều bạn đang băn khoăn"."""
    ngay_xem = ngay_xem or (dt.datetime.now(dt.timezone(dt.timedelta(hours=7)))).date()
    mq = _menh(sinh)
    huong, do = _huong_nha(nha)
    bc_luan = None
    if nha.get("bo_cuc"):
        try:
            bc_luan = bo_cuc.luan(nha["bo_cuc"], sinh, goc_nhin)
        except ValueError:
            bc_luan = None
    b = _trach_ban(nha, do, huong, ngay_xem.year)
    tvs = _thanh_vien(mq, thanh_vien or [])
    c1 = _chuong_ban_hop_huong(mq)
    c2 = _chuong_ngoi_nha(mq, huong, do, nha, b, tvs, bc_luan)
    c3 = _chuong_tung_phong(mq, huong, b, bc_luan, nha.get("bo_cuc"))
    c4 = _chuong_nam_nay(mq, sinh, huong, b, bc_luan, ngay_xem)
    c5 = _chuong_viec_nen_lam(c1, c2, c3, c4)
    for c in (c1, c2, c3, c4, c5):          # HỌC-ĐS: mã kiểm chứng ds.phongthuy.<chương>.<loại>.<tiêu đề>
        kh.gan_ma_mau(c, "phongthuy")
    veto = _veto(bc_luan)
    t_utc = dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - dt.timedelta(hours=7)
    theo_y_dinh = _theo_y_dinh(y_dinh, [c1, c2, c3, c4, c5], bc_luan, huong, hk.nam_theo_lap_xuan(t_utc))
    # Q1: dấu hiệu veto đã xác nhận luôn đứng đầu "Điều quan trọng nhất"; rồi hộp theo ý định; rồi như cũ. Chọn theo TIÊU ĐỀ
    # (bỏ trùng) → bản dịch lấy đúng các hộp bản Việt chọn (EN-ALL).
    nguon = [("c2", c2), ("y", theo_y_dinh or {}), ("c1", c1), ("c4", c4)]
    chon, da_td = [], set()
    if veto:
        i0 = next((i for i, h in enumerate(c2["hop"]) if h.get("veto")), None)
        if i0 is not None:
            chon.append(("c2", i0))
            da_td.add(c2["hop"][i0]["tieu_de"])
    if theo_y_dinh and theo_y_dinh["hop"] and len(chon) < 3:
        if theo_y_dinh["hop"][0]["tieu_de"] not in da_td:
            chon.append(("y", 0))
            da_td.add(theo_y_dinh["hop"][0]["tieu_de"])
    for ten_c, c in (("c1", c1), ("c2", c2), ("c4", c4)):
        for i, h in enumerate(c.get("hop", [])):
            if h["loai"] in ("cot_loi", "luu_y") and len(chon) < 3 and h["tieu_de"] not in da_td:
                chon.append((ten_c, i))
                da_td.add(h["tieu_de"])
                break
    chon = kh.quyet(("pt.cot_loi",), chon)
    ng = dict(nguon)
    cot_loi = []
    for ten_c, i in chon:
        if ten_c == "y":
            cot_loi.append(theo_y_dinh["hop"][i])
        else:
            cot_loi.append({**ng[ten_c]["hop"][i], "tu_chuong": ng[ten_c]["ma"]})
    thieu = [x for x, ok in (("sinh", bool(mq)), ("huong", bool(huong)), ("nam_xay", bool(b)), ("bo_cuc", bool(bc_luan))) if not ok]
    da_tinh = {"menh_quai": {k: mq[k] for k in ("quai", "so", "nhom", "nam_tinh", "moc_nam")} if mq else None,
               "huong_nha": huong, "do_huong": do, "trach": pt.trach(huong) if huong else None,
               "huyen_khong": ({"van": b["van"], "nam_xay": b["nam_xay"], "cuc": b["cuc"], "cuc_ten": b["cuc_ten"], "toa": b["toa"]["son"],
                                "huong": b["huong"]["son"], "cap_huong": b["cap_huong"], "cap_toa": b["cap_toa"],
                                "cung": [{k: x[k] for k in ("cung", "phuong", "van", "son", "huong")} for x in b["cung"]]} if b else None),
               "thanh_vien": tvs, "ngay_xem": ngay_xem.isoformat()}
    # KC-1: khoá rỗng không ghi (khuôn chung; web coi thiếu = None).
    for c in (c1, c2, c3, c4, c5):
        _thuong_chuong(c)
    chuong = [{k: v for k, v in c.items() if v is not None} for c in (c1, c2, c3, c4, c5)]
    da_tinh["veto_da_xac_nhan"] = [{"ma": d["ma"], "tieu_de": d["tieu_de"]} for d in veto]
    da_tinh["goc_nhin"] = goc_nhin
    return {"mo_dun": "phongthuy", "phien_ban": "doi_song_1", "phai": "bat_trach_huyen_khong", "ten": L("pt.ten_bao_cao", "Nhà của bạn"),
            "cot_loi": cot_loi, "chuong": chuong, "da_tinh": da_tinh, "thieu": thieu, "ket": kb.mau("ket"),
            "theo_y_dinh": theo_y_dinh,
            "nguyen_tac": L("pt.nguyen_tac", "Hình thế là nền, lý khí là nhịp: dấu hiệu nhìn thấy và du niên với người ở quyết định mức; sao năm, sao tháng chỉ quyết định thời điểm."),
            "y_dinh_chung": "nha_cua", "goi_mo": __import__("app.kb.y_dinh_chung", fromlist=["goi_mo"]).goi_mo("nha_cua", "phongthuy"), **kb.meta()}


# ----------------------------------------------------------------------------- KC-2: thẻ "Tháng này nhà bạn" (Hôm nay)
def thang_nay(nha: dict, ngay_xem: dt.date | None = None) -> dict:
    """Bản rút gọn cho thẻ ngày: phương giữ yên của năm, sao tháng tại cung cửa (3 tháng, theo tiết khí) và việc nên làm /
    tránh tháng này. Không cần năm sinh; có `nam_xay` thì thêm cục + cặp sao cung cửa. Không lưu."""
    ngay_xem = ngay_xem or (dt.datetime.now(dt.timezone(dt.timedelta(hours=7)))).date()
    huong, do = _huong_nha(nha)
    if not huong:
        raise ValueError("cần hướng nhà (huong_do hoặc huong)")
    b = _trach_ban(nha, do, huong)
    c4 = _chuong_nam_nay(None, None, huong, b, None, ngay_xem)
    th = c4["ba_thang"][0]
    ts = kb.thang_sao().get("y", {})
    viec = {"thuan": [L("pt.tn.thuan1", "Sửa sang, kê lại phía cửa trong tháng này là hợp."), L("pt.tn.thuan2", "Dọn thoáng lối vào, mở sáng.")],
            "can_bang": [L("pt.tn.bang1", "Sửa nhỏ, dọn gọn được; việc lớn phía cửa để tháng thuận."), L("pt.tn.bang2", "Giữ lối vào sạch, đủ sáng.")],
            "can_chu_dong": [L("pt.tn.cd1", "Tháng này giữ yên phía cửa: không đục phá, không động thổ."), L("pt.tn.cd2", "Chỉ dọn gọn, không kê dời đồ lớn.")]}[th["muc"]]
    t_utc = dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - dt.timedelta(hours=7)
    return {"ngay_xem": ngay_xem.isoformat(), "huong": huong, "do_huong": do, "nam": hk.nam_theo_lap_xuan(t_utc),
            "phuong_tranh": [{"ten": x["ten"], "phuong": x["phuong"]} for x in c4["han_nam"]],
            "cua_trung_phuong_tranh": any(x["phuong"] == huong for x in c4["han_nam"]),
            "thang": {**th, "y": ts.get(th["muc"], th.get("y", ""))}, "ba_thang": c4["ba_thang"], "viec": viec,
            "huyen_khong": ({"cuc_ten": b["cuc_ten"], "van": b["van"], "cap_huong": {k: b["cap_huong"][k] for k in ("ma", "ten", "muc")}} if b else None),
            "tom_tat": c4["tom_tat"], **kb.meta()}
