# -*- coding: utf-8 -*-
"""SX-C (2026-11-14) — khối "Sách xưa ghi gì" của từng môn.

RULES, tất định: chỉ CHỌN các mục đã có trong KB `*_sach_ghi*.json` (mỗi mục đã qua bộ kiểm `kb/sach_ghi.py`: câu Hán là
chuỗi con kho nguồn, lời Việt đã nói giảm) ứng với đúng dữ kiện ĐÃ TÍNH của lá số / ngôi nhà. Không sinh câu mới, không đổi
mức nào, không vào tiêu đề hộp / tóm tắt chương / thẻ chia sẻ / lời nhắc AI.

Ba nhóm (chủ dự án chốt): A nói nguyên ý · B "nên chú ý…" + một việc · C "hàm ý theo ghi chép xưa…" (nói giảm) + việc giữ
gìn. Người chưa đủ 18 tuổi không nhận mục nhóm C. Chỉ bản tiếng Việt (lời Việt chưa dịch).

Đầu ra chung của mọi hàm: `None` hoặc
    {"nhom": [{"ma", "ten", "muc": [{"ve", "sach", "han"?, "am"?, "loi", "nhom", "chu_de", "viec"?, "ngay_nay"?}]}], "cau_ket", "so_muc"}
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import nap, sach_ghi as sg

SACH = {"tu_vi_dau_so_toan_thu": "Tử Vi Đẩu Số Toàn Thư", "tam_menh_thong_hoi": "Tam Mệnh Thông Hội",
        "tam_menh_thong_hoi_du_bo": "Tam Mệnh Thông Hội",
        "uyen_hai_tu_binh": "Uyên Hải Tử Bình", "than_tuong_toan_bien": "Thần Tướng Toàn Biên",
        "lieu_trang_tuong_phap": "Liễu Trang tướng pháp", "duong_trach_thap_thu": "Dương Trạch Thập Thư",
        "nhan_tuong_co_thu": "sách tướng xưa", **sg.TEN_SACH_TOM_Y}
TUOI_NHOM_C = 18
_SANG = {"Miếu", "Vượng", "Đắc"}
_CUNG_TV = ("Mệnh", "Phu Thê", "Tài Bạch", "Quan Lộc", "Tật Ách", "Phúc Đức", "Thiên Di", "Điền Trạch", "Nô Bộc", "Tử Nữ",
            "Huynh Đệ", "Phụ Mẫu")
_KHI_TV = {"sang": "khi sao sáng", "ham": "khi sao ở thế yếu"}
_MIEU = {"Miếu", "Vượng"}
_MIEU_HAN = __import__("re").compile(r"(?<!不)(?:入庙|庙旺|旺庙|庙乐|入旺|庙地|旺地|旺宫)")


def _kb(ten: str) -> dict:
    return nap.doc(ten)


def muc(m: dict, ve: str) -> dict:
    """Một mục hiển thị. Phiên âm chỉ kèm nhóm A (âm Hán Việt của câu nặng đọc lên vẫn nặng)."""
    if m["nhom"] == "A":
        loi = m["y"]
    elif m.get("sat"):                                       # SX-C3: nhóm B / C nói sát nguyên văn + lời dặn
        loi = f"{m['y']} {m['ham_y']}"
    elif m["nhom"] == "B":
        loi = f"{m['y']} {m['ham_y']}"
    else:
        loi = f"Hàm ý theo ghi chép xưa: {m['y']} {m['ham_y']}"
    sach = SACH.get(m["nguon"], "sách xưa")
    if m.get("chuong"):                                      # nơi dẫn cụ thể (quyển / thiên / mục) khi KB có ghi
        sach = f"{sach}, {m['chuong']}"
    ra = {"ve": ve, "sach": sach, "loi": loi, "nhom": m["nhom"], "chu_de": m["chu_de"]}
    if m.get("tom_y"):
        ra["tom_y"] = True
    else:
        ra["han"] = m["han"]
        if m["nhom"] == "A" or m.get("sat"):                 # SX-C3: câu nói sát nguyên văn kèm cả âm Hán Việt
            ra["am"] = m["am"]
        if m.get("sat"):
            ra["nguyen_van"] = True
    if m.get("viec"):
        ra["viec"] = m["viec"]
    if m.get("ngay_nay"):                                    # điều sách dặn áp vào nhà ngày nay thế nào (Phong thuỷ)
        ra["ngay_nay"] = m["ngay_nay"]
    return ra


def tuoi_tu(nam_sinh, ngay_xem) -> int | None:
    """Tuổi tròn từ ngày sinh (date) hoặc chỉ năm sinh (int — tính thận trọng: năm xem − năm sinh − 1, để người sắp đủ
    18 không nhận nhóm C sớm). Không có → None."""
    import datetime as _dt  # noqa: PLC0415
    if isinstance(nam_sinh, _dt.date):
        from app.luangiai import hoan_canh  # noqa: PLC0415
        return hoan_canh.tuoi_tron(nam_sinh, ngay_xem)
    if isinstance(nam_sinh, int) and nam_sinh > 0:
        return ngay_xem.year - nam_sinh - 1
    return None


def _loc(cac: list[tuple[dict, str]], tuoi: int | None) -> list[tuple[dict, str]]:
    """Người chưa đủ 18 tuổi — và khi KHÔNG BIẾT tuổi — không nhận mục nhóm C."""
    tre = tuoi is None or tuoi < TUOI_NHOM_C
    return [(m, ve) for m, ve in cac if not (tre and m["nhom"] == "C")]


def khoi(nhom: list[tuple[str, str, list[tuple[dict, str]]]], tuoi: int | None = None) -> dict | None:
    """`nhom` = [(mã, tên nhóm, [(mục KB, "về điều gì")])] → khối hiển thị (bỏ nhóm rỗng)."""
    if not ngon_ngu.la_viet():
        return None
    ra, tat_ca = [], []
    for ma, ten, cac in nhom:
        cac = _loc(cac, tuoi)
        if cac:
            ra.append({"ma": ma, "ten": ten, "muc": [muc(m, ve) for m, ve in cac]})
            tat_ca += [m for m, _ in cac]
    if not ra:
        return None
    return {"nhom": ra, "cau_ket": sg.cau_ket(tat_ca) or sg.CAU_KET, "so_muc": len(tat_ca)}


# ───────────────────────── Tử vi ─────────────────────────

import re as _re

_CHINH_HAN = {"紫微": "Tử Vi", "天机": "Thiên Cơ", "太阳": "Thái Dương", "武曲": "Vũ Khúc", "天同": "Thiên Đồng",
              "廉贞": "Liêm Trinh", "天府": "Thiên Phủ", "太阴": "Thái Âm", "贪狼": "Tham Lang", "巨门": "Cự Môn",
              "天相": "Thiên Tướng", "天梁": "Thiên Lương", "七杀": "Thất Sát", "破军": "Phá Quân"}
_SAT = {"Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"}
_CAT = {"Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt"}
# Nhóm sao câu sách hay đặt làm điều kiện (chữ giản thể như kho nguồn Toàn Thư) → hàm kiểm trên chính cung đó.
_NHOM_HAN: list[tuple[str, str]] = [
    (r"四杀|四煞|羊|陀|火|铃|空|劫|杀|煞", "sat"), (r"左右|左辅|右弼|昌曲|文昌|文曲|魁钺|魁|钺|吉", "cat"),
    (r"化禄|禄存|禄", "loc"), (r"化权|权", "quyen"), (r"化科|科", "khoa"), (r"化忌|忌", "ky"),
]
_PHU_DINH = _re.compile(r"[无不]\s*[见遇加会]?$")
# Câu sách khoanh cung theo địa chi: "在子午宫", "巳亥陷宫", "辰戌旺宫"… (chữ 子 đứng một mình là "con" — không tính).
_CHI_HAN = "子丑寅卯辰巳午未申酉戌亥"
_CHI_VIET = ("Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi")
_CHI_CUNG = _re.compile(rf"([{_CHI_HAN}]{{1,6}})[庙旺陷平得利]{{0,2}}宫")


def _chi_dat(han: str, chi: str | None) -> bool:
    """Câu sách nêu cung theo địa chi → cung đang xét phải ở một trong các địa chi ấy. Không biết địa chi của cung →
    không chọn câu có điều kiện địa chi (thà thiếu còn hơn sai)."""
    neu = {c for m in _CHI_CUNG.finditer(han) for c in m.group(1)}
    if not neu:
        return True
    if chi not in _CHI_VIET:
        return False
    return _CHI_HAN[_CHI_VIET.index(chi)] in neu


def _dieu_kien_dat(han: str, sao: str, ten_sao: set[str], hoa: set[str], chi: str | None = None) -> bool:
    """Mọi sao / nhóm sao câu sách nêu kèm (ngoài chính sao đang xét) phải đúng với cung: nêu có → cung phải có; nêu
    "không …" (无 / 不见 …) → cung phải không có. Câu khoanh cung theo địa chi → cung phải đúng địa chi đó.
    Câu không nêu điều kiện nào → đạt."""
    if not _chi_dat(han, chi):
        return False
    # SX-D: "单居 / 独守 / 独坐" (sao đứng một mình) → cung không có chính tinh nào khác.
    if _re.search(r"单居|独守|独坐|单守", han) and ten_sao & (set(_CHINH_HAN.values()) - {sao}):
        return False
    s = _CHI_CUNG.sub("　", han)
    for h, ten in _CHINH_HAN.items():
        for m in list(_re.finditer(h, s)):
            if ten == sao:
                continue
            phu = bool(_PHU_DINH.search(s[max(0, m.start() - 3):m.start()]))
            if (ten in ten_sao) == phu:
                return False
        s = s.replace(h, "　")
    co = {"sat": bool(ten_sao & _SAT), "cat": bool(ten_sao & _CAT), "loc": "Lộc" in hoa or "Lộc Tồn" in ten_sao,
          "quyen": "Quyền" in hoa, "khoa": "Khoa" in hoa, "ky": "Kỵ" in hoa}
    for mau, nhom in _NHOM_HAN:
        for m in _re.finditer(mau, s):
            phu = bool(_PHU_DINH.search(s[max(0, m.start() - 3):m.start()]))
            if co[nhom] == phu:
                return False
        s = _re.sub(mau, "　", s)
    return True


def _trang_thai(do_sang: str | None) -> str | None:
    return "sang" if do_sang in _SANG else "ham" if do_sang == "Hãm" else None


def tuvi(cung: list[dict], tuoi: int | None = None) -> dict | None:
    """`cung` = 12 cung đầu ra của lá số (`ten`, `chinh_tinh[{ten, do_sang_nam_phai, tu_hoa}]`, `phu_tinh[{ten, tu_hoa}]`).
    Chọn câu khi: (1) `khi` khớp độ sáng Nam phái của chính sao (`chung` luôn khớp; sao "Bình" chỉ nhận `chung`) VÀ
    (2) mọi sao / nhóm sao câu sách nêu kèm đều đúng với cung đó (`_dieu_kien_dat`). Điều kiện không khớp → không chọn."""
    return khoi(tuvi_nhom(cung), tuoi)


def tuvi_nhom(cung: list[dict]) -> list[tuple[str, str, list[tuple[dict, str]]]]:
    """Phần chọn câu của `tuvi` (mục KB thô + "về điều gì") — dùng chung cho khối lá số và hỏi đáp."""
    kb = _kb("tuvi_sach_ghi.json")["muc"]
    theo_ten = {c["ten"]: c for c in cung}
    nhom = []
    for ten in _CUNG_TV:
        c = theo_ten.get(ten)
        if not c:
            continue
        sao_cung = [*c.get("chinh_tinh", []), *c.get("phu_tinh", [])]
        ten_sao = {s["ten"] for s in sao_cung}
        hoa = {s["tu_hoa"] for s in sao_cung if s.get("tu_hoa")}
        cac: list[tuple[dict, str]] = []
        for s in sao_cung:
            cac += chon_tuvi_sao(s["ten"], ten, s.get("do_sang_nam_phai"), ten_sao, hoa, c.get("chi"), kb)
        nhom.append((ten, f"Cung {ten}", cac))
    return nhom


def chon_tuvi_sao(sao: str, cung: str, do_sang: str | None, ten_sao: set[str], hoa: set[str], chi: str | None,
                  kb: dict | None = None) -> list[tuple[dict, str]]:
    """MỘT bộ chọn câu Toàn Thư cho một sao ở một cung — dùng chung khối "Sách xưa ghi" của lá số và hộp luận của báo cáo
    đời sống (`luangiai/sach_hop.py`). Câu chọn khi `khi` khớp độ sáng Nam phái (sao "Bình" chỉ nhận `chung`) và mọi
    điều kiện câu sách nêu kèm đúng với cung (`_dieu_kien_dat`)."""
    kb = kb if kb is not None else _kb("tuvi_sach_ghi.json")["muc"]
    tt = _trang_thai(do_sang)
    ra = []
    for m in (kb.get(sao) or {}).get(cung) or []:
        k = m.get("khi", "chung")
        # SX-D: chính câu sách nói "nhập miếu / miếu vượng" mà không nói vế hãm → chỉ khi sao Miếu / Vượng (Đắc, Bình chưa
        # tới); chỉ nói vế hãm → chỉ khi sao Hãm. Câu nói cả hai vế (庙旺…陷地…) giữ như `khi` ghi.
        mieu, ham = bool(_MIEU_HAN.search(m["han"])), "陷" in m["han"]
        if (mieu and not ham and do_sang not in _MIEU) or (ham and not mieu and do_sang != "Hãm"):
            continue
        if (k == "chung" or k == tt) and _dieu_kien_dat(m["han"], sao, ten_sao, hoa, chi):
            ra.append((m, f"Sao {sao} ở cung {cung}" + (f" · {_KHI_TV[k]}" if k in _KHI_TV else "")))
    return ra


# ───────────────────────── Bát tự ─────────────────────────

_KHAC = {"Mộc": "Kim", "Hỏa": "Thủy", "Thổ": "Mộc", "Kim": "Hỏa", "Thủy": "Thổ"}     # hành khắc mình
_GIOI_KHI = {"sách nói về nam": "nam", "với lá số nam": "nam", "sách nói về nữ": "nu", "với lá số nữ": "nu"}


def _khi_bt(khi: str, gioi: str | None) -> bool:
    """Chỉ nhận điều kiện máy KIỂM ĐƯỢC: "nói chung…" và điều kiện CHỈ về giới tính. Điều kiện vượng / suy, "khi … nhiều",
    "gặp …" chưa có phép tính tương ứng → không chọn (thà thiếu câu còn hơn nói điều không đúng với lá số)."""
    k = (khi or "").strip()
    if not k or k.startswith("nói chung"):
        return True
    return _GIOI_KHI.get(k) is not None and _GIOI_KHI[k] == gioi


def battu(ls: dict, mo_rong: dict, tuoi: int | None = None, gioi: str | None = None) -> dict | None:
    """Thần sát có trong lá số (mỗi sao tối đa 2 câu) · bốn thập thần sách bàn riêng (khi lộ ở hàng can) · nét của hành
    ngày sinh · phần cơ thể sách gắn với hành ấy (+ câu "gặp hành khắc đang mạnh" khi hành khắc ngày sinh đúng là hành
    nhiều điểm nhất). `gioi` = "nam" / "nu" để chọn câu sách nói riêng một giới."""
    ng = battu_ngay_gio(ls)
    return khoi(([("ngay_gio", "Ngày và giờ sinh", ng)] if ng else []) + battu_nhom(ls, mo_rong, gioi), tuoi)


_CAN_HAN, _CHI_HAN_BT = "甲乙丙丁戊己庚辛壬癸", "子丑寅卯辰巳午未申酉戌亥"


def battu_ngay_gio(ls: dict) -> list[tuple[dict, str]]:
    """TK-2 việc 3: bài ca chung của Tam Mệnh Thông Hội quyển 8–9 cho đúng can ngày × chi giờ của lá số (KB
    `battu_ngay_gio.json`). Sách chia mục theo TRỤ giờ (Ngũ Thử Độn từ can ngày) → chỉ chọn khi trụ giờ của lá số đúng trụ
    giờ sách ghi; sinh dạ Tý (trụ giờ lấy can của ngày sau) thường lệch → không chọn. Chỉ khối lá số, không vào hỏi đáp."""
    from app.calc import battu as _bt  # noqa: PLC0415
    try:
        ngay, gio = ls["tru"][2], ls["tru"][3]
        tru = _CAN_HAN[_bt.CAN.index(gio["can"])] + _CHI_HAN_BT[_bt.CHI.index(gio["chi"])]
    except (KeyError, IndexError, ValueError):
        return []
    m = (_kb("battu_ngay_gio.json").get("muc") or {}).get(f"{ngay['can']}|{gio['chi']}")
    if not m or m.get("bo") or m.get("tru_gio") != tru:
        return []
    return [(m, f"Sinh ngày {ngay['can']} giờ {gio['chi']}")]


def battu_nhom(ls: dict, mo_rong: dict, gioi: str | None = None) -> list[tuple[str, str, list[tuple[dict, str]]]]:
    """Phần chọn câu của `battu` — dùng chung cho khối lá số và hỏi đáp."""
    kb = _kb("battu_sach_ghi.json")
    hanh = ls["nhat_chu"]["ngu_hanh"]

    def kem(m: dict, goc: str) -> str:
        k = (m.get("khi") or "").strip()
        return goc if not k or k.startswith("nói chung") or k in _GIOI_KHI else f"{goc} · {k}"

    def chon(ds: list[dict], toi_da: int) -> list[dict]:
        return [m for m in ds if _khi_bt(m.get("khi", ""), gioi)][:toi_da]

    sao = [t["ten"] for t in mo_rong.get("than_sat") or []]
    sao += [t["ten"] for t in mo_rong.get("than_sat_tham_khao") or [] if t.get("co")]
    ts = [(m, kem(m, f"Lá số có sao {ten}")) for ten in dict.fromkeys(sao) for m in chon(kb["than_sat"].get(ten) or [], 2)]
    lo = {x for x in (ls.get("thap_than_can") or []) if x}
    tt = [(m, kem(m, f"Lá số có {ten} lộ ở hàng can")) for ten in kb["thap_than"] if ten in lo for m in chon(kb["thap_than"][ten], 2)]
    net = [(m, f"Ngày sinh thuộc hành {hanh}") for m in (kb["tinh_net"].get(hanh) or [])[:1]]
    diem = (ls.get("ngu_hanh") or {}).get("diem") or {}
    khac_manh = bool(diem) and max(diem, key=diem.get) == _KHAC[hanh]
    the = []
    for m in kb["than_the"].get(hanh) or []:
        k = (m.get("khi") or "")
        if k.startswith("nói chung") or (khac_manh and "là hành của mình" in k):
            the.append((m, kem(m, f"Ngày sinh thuộc hành {hanh}")))
    return [("than_sat", "Các sao trong lá số", ts), ("thap_than", "Vai nổi ở hàng can", tt),
            ("tinh_net", "Nét của hành ngày sinh", net), ("than_the", "Phần cơ thể sách gắn với hành này", the)]


# ───────────────────────── Phong thuỷ ─────────────────────────

def phongthuy(quai: str | None = None, dau_hieu: list[str] | None = None, cua: str | None = None, chu: str | None = None,
              bep: str | None = None, tuoi: int | None = None) -> dict | None:
    """Điều sách dặn theo cung mệnh · theo dấu hiệu ĐÃ XÁC NHẬN của nhà · theo cặp cửa – chủ, bếp – cửa (khi KB có)."""
    return khoi(phongthuy_nhom(quai, dau_hieu, cua, chu, bep), tuoi)


def phongthuy_nhom(quai: str | None = None, dau_hieu: list[str] | None = None, cua: str | None = None,
                   chu: str | None = None, bep: str | None = None) -> list[tuple[str, str, list[tuple[dict, str]]]]:
    """Phần chọn câu của `phongthuy` — dùng chung cho khối mệnh quái / khảo sát nhà và hỏi đáp."""
    nhom = []
    if quai:
        cm = _kb("phongthuy_cung_menh.json")
        cac = [(m, m["ten"]) for m in cm["cung"].get(quai) or []]
        nhom.append(("cung_menh", f"Sách dặn người cung {quai}", cac))
    if dau_hieu:
        co = set(dau_hieu)
        ds = _kb("phongthuy_sach_ghi.json")["dieu"]
        cac = [(m, m["tieu_de"]) for m in ds if m.get("dau_hieu") in co and m.get("con_ap_dung", True)]
        nhom.append(("dau_hieu", "Về những điều nhà bạn đang có", cac))
    if cua and (chu or bep):
        try:
            ty = _kb("phongthuy_tam_yeu.json")
        except FileNotFoundError:
            ty = None
        if ty:
            cac = []
            if chu and (m := ty["nha"].get(f"{cua}_{chu}")):
                cac.append((m, f"Cửa {cua}, phòng chính {chu} · {m['du_nien']}"))
            if bep and (m := ty["bep"].get(f"{bep}_{cua}")):
                cac.append((m, f"Bếp {bep}, cửa {cua} · {m['du_nien']}"))
            if bep:   # Dương Trạch Thập Thư (火唵說): bếp ở phương kém, nhường phương tốt
                cac += [(m, "Chỗ đặt bếp") for m in _kb("phongthuy_sach_ghi.json")["dieu"] if m.get("kem") == "bep"]
            nhom.append(("cua_chu_bep", "Cửa, phòng chính và bếp", cac))
    return nhom


# ───────────────────────── Nhân tướng ─────────────────────────

CO_THU_MOI_NET = 2        # tối đa câu cổ thư (bộ quy tắc PR #320) cho một nét
CO_THU_TOI_DA = 8         # tối đa câu cổ thư gắn với nét trong một bài đọc
CO_THU_DAN = 4            # số điều sách dặn khi xem tướng hiện trong một bài đọc


def _co_thu(dac_diem: list[str], gioi: str | None) -> tuple[list[tuple[dict, str]], list[tuple[dict, str]]]:
    """Quy tắc cổ thư Thần Tướng Toàn Biên / Liễu Trang (`nhantuong_ngu_hanh_va_co_thu.json` · `quy_tac_co_thu`, đã qua bộ
    kiểm SX-C): (1) câu gắn với nét người dùng ĐÃ XÁC NHẬN (`dac_diem` — một nét là đủ, `can_du` thì cần đủ mọi nét; `gioi`
    chỉ khi biết đúng giới) và (2) điều sách dặn khi xem tướng (`chung`) — chọn CO_THU_DAN câu, xoay theo bộ nét (tất định)."""
    import zlib  # noqa: PLC0415
    try:
        ds = _kb("nhantuong_ngu_hanh_va_co_thu.json").get("quy_tac_co_thu") or []
    except FileNotFoundError:
        return [], []
    try:
        ten_net = {k: v.get("ten") for k, v in _kb("nhan_tuong_kb.json")["dac_diem"].items()}
    except (FileNotFoundError, KeyError):
        ten_net = {}
    co = set(dac_diem)
    net, dem = [], {}
    for m in ds:
        if m.get("chung") or not m.get("dac_diem"):
            continue
        if m.get("gioi") and m["gioi"] != gioi:
            continue
        trung = [x for x in m["dac_diem"] if x in co]
        if not trung or (m.get("can_du") and len(trung) < len(m["dac_diem"])):
            continue
        dau = trung[0]
        if dem.get(dau, 0) >= CO_THU_MOI_NET:
            continue
        dem[dau] = dem.get(dau, 0) + 1
        net.append((m, ten_net.get(dau) or "Nét bạn đã chọn"))
    chung = [m for m in ds if m.get("chung")]
    dan = []
    if chung:
        bat_dau = zlib.crc32("|".join(sorted(co)).encode("utf-8")) % len(chung)
        dan = [(chung[(bat_dau + i) % len(chung)], "Điều sách dặn khi xem tướng") for i in range(min(CO_THU_DAN, len(chung)))]
    return net[:CO_THU_TOI_DA], dan


def nhan_tuong(dac_diem: list[str], tuoi: int | None = None, gioi: str | None = None) -> dict | None:
    """Câu sách gắn với các nét người dùng đã chọn (`dac_diem` = mã đặc điểm) và 12 cung trên mặt mà nét ấy thuộc về; thêm
    câu cổ thư Thần Tướng Toàn Biên / Liễu Trang theo nét + vài điều sách dặn khi xem tướng."""
    try:
        kb = _kb("nhan_tuong_sach_ghi.json")
    except FileNotFoundError:
        return None
    cac = [(m, m.get("ten") or "Nét bạn đã chọn") for ma in dac_diem for m in kb["dac_diem"].get(ma) or []]
    net, dan = _co_thu(dac_diem, gioi)
    nhom = [("net", "Về các nét bạn đã chọn", cac), ("net_co_thu", "Sách xưa còn ghi về các nét ấy", net)]
    if khoi(nhom, tuoi) is None:            # không có câu nào về chính các nét (sau lọc tuổi) → không mở khối chỉ để dặn chung
        return None
    return khoi(nhom + [("dan", "Sách xưa dặn khi xem tướng", dan)], tuoi)


def _cau(cac: list[dict], tuoi: int | None, toi_da: int = 3) -> list[str]:
    """Câu văn xuôi (hỏi đáp): nhóm A trước, rồi B, tối đa MỘT mục nhóm C; có nhóm C / sức khoẻ thì thêm câu kết."""
    tre = tuoi is None or tuoi < TUOI_NHOM_C
    a = [m for m in cac if m["nhom"] == "A"]
    b = [m for m in cac if m["nhom"] == "B"]
    c = [] if tre else [m for m in cac if m["nhom"] == "C"][:1]
    chon = (a[:toi_da - 1] + b[:1] + c)[:toi_da] if (b or c) else a[:toi_da]
    ra = [sg.loi(m, co_am=m["nhom"] == "A") for m in chon]
    if (ket := sg.cau_ket(chon)):
        ra.append(ket)
    return ra


def nt_bo_vi(ma_bv: str | None, ma_cung: str | None = None, tuoi: int | None = None) -> list[str]:
    """Hỏi đáp Nhân tướng: câu sách xưa về một bộ vị / một cung trên mặt (Thần Tướng Toàn Biên trước, Liễu Trang sau)."""
    if not ngon_ngu.la_viet():
        return []
    cac: list[dict] = []
    for ten in ("nhan_tuong_sach_ghi.json", "nhan_tuong_lieu_trang.json"):
        try:
            kb = _kb(ten)
        except FileNotFoundError:
            continue
        if ma_cung:
            cac += kb.get("cung", {}).get(ma_cung) or []
        elif ma_bv:
            cac += kb.get("bo_vi", {}).get(ma_bv) or []
    return _cau(cac, tuoi)


# Cụm đời thường trùng tên kiểu hình (sức khoẻ, đồ ăn, đồ dùng) — gặp là không xem như câu hỏi về tướng.
_KIEU_LOAI_TRU = ("mắt cá chân", "đau mắt cá", "sưng mắt cá", "trật mắt cá", "mắt cá tôi", "mắt cá bị", "mộc nhĩ",
                  "hổ khẩu", "mắt say", "say rượu", "kính mắt mèo", "mắt mèo kính", "nấm tai", "tai mèo")
# Câu phải có ngữ cảnh hỏi về tướng / tự mô tả gương mặt mới trả bằng bài thơ kiểu hình.
_KIEU_NGU_CANH = _re.compile(r"tướng|là gì|là sao|nghĩa là|nghĩa gì|nói gì|có tốt|tốt không|xấu không|sách|kiểu|"
                             r"tôi có|mình có|em có|người có|tôi là|của tôi|của mình")


def nt_kieu_hinh(cau_goc: str, tuoi: int | None = None) -> dict | None:
    """Câu hỏi nêu đúng tên một kiểu hình sách xưa đặt ("mắt phượng", "mày kiếm"…) VÀ có ngữ cảnh hỏi về tướng → {ma,
    bo_vi, loi}. So trên câu CÒN DẤU ("tai lợn" ≠ "tai lớn"); cụm đời thường trùng tên (mắt cá chân, mộc nhĩ…) bị loại."""
    if not ngon_ngu.la_viet():
        return None
    g = " " + " ".join((cau_goc or "").lower().split()) + " "
    if any(x in g for x in _KIEU_LOAI_TRU) or not _KIEU_NGU_CANH.search(g):
        return None
    tot = None
    for nhom, ds in _kb("nhan_tuong_kieu_hinh.json")["kieu"].items():
        for m in ds:
            for ten in (m["ten_viet"], m["ten"]):
                k = f" {ten.lower()}"
                i = g.find(k)
                if i >= 0 and not g[i + len(k)].isalpha() and (tot is None or len(ten) > tot[0]):
                    tot = (len(ten), nhom, m)
    if not tot:
        return None
    _, nhom, m = tot
    dong = [f"{m['ten_viet']} (sách gọi là {m['ten']}): {m['nhan_dang']}"]
    if not (m["nhom"] == "C" and (tuoi is None or tuoi < TUOI_NHOM_C)):
        dong += _cau([m], tuoi)
    dong.append("Đây là tên một kiểu hình trong sách tướng xưa; soi gương rồi tự xem mình gần kiểu nào, đừng vội nhận một kiểu.")
    return {"ma": m["ma"], "nhom": nhom, "loi": " ".join(dong), "sach": SACH[m["nguon"]]}


_DANG = (("di", r"dáng đi|bước đi|cách đi đứng|cách bước|tướng đi"),
         ("ngoi", r"dáng ngồi|cách ngồi|tư thế ngồi|tướng ngồi"),
         ("nam", r"dáng nằm|tư thế nằm|tư thế ngủ|tướng nằm|tướng ngủ|nằm ngủ hay"),
         ("an", r"cách ăn uống|tướng ăn|dáng ăn|lúc ăn hay"),
         ("noi", r"cách nói chuyện|tướng nói|lời ăn tiếng nói|giọng nói nói gì"),
         ("cuoi", r"tiếng cười|nụ cười|cách cười|tướng cười"))


def nt_dang_dieu(cau_goc: str, tuoi: int | None = None) -> dict | None:
    """Câu hỏi về dáng đi, ngồi, nằm, ăn, nói, cười → câu Liễu Trang tướng pháp (phần sách bàn cử chỉ — sửa được). So trên
    câu CÒN DẤU: bỏ dấu thì "dáng đi" trùng "đang đi", "tướng ngủ" trùng "tuồng"…"""
    import re  # noqa: PLC0415
    if not ngon_ngu.la_viet():
        return None
    try:
        kb = _kb("nhan_tuong_lieu_trang.json")["dang_dieu"]
    except FileNotFoundError:
        return None
    for ma, mau in _DANG:
        if re.search(mau, " ".join((cau_goc or "").lower().split())):
            cau = _cau(kb.get(ma) or [], tuoi)
            if cau:
                return {"ma": ma, "loi": " ".join(cau), "sach": SACH["lieu_trang_tuong_phap"]}
    return None
