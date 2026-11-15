# -*- coding: utf-8 -*-
"""SX-H (2026-11-15) — "Sách xưa ghi gì về điều bạn hỏi" trong hỏi đáp Tử vi · Bát tự · Phong thuỷ.

RULES, tất định. Chỉ CHỌN mục KB sách xưa đã có (`*_sach_ghi*.json`, đã qua bộ kiểm `kb/sach_ghi.py`) bằng ĐÚNG bộ chọn
của khối lá số (`luangiai/sach_ghi_mon.*_nhom` — một nguồn), rồi lọc theo điều người dùng hỏi:
    · chủ đề câu hỏi (tiền bạc, công việc, tình duyên…) ↔ trường `chu_de` của mục KB;
    · phạm vi: cung được hỏi (Tử vi), sao / thần sát được nhắc tên (xếp trước), dấu hiệu nhà (Phong thuỷ).
Tối đa 2 mục, nhóm A trước rồi B, tối đa MỘT mục nhóm C — người chưa đủ 18 tuổi hoặc chưa biết tuổi không nhận nhóm C.

Đoạn này KHÔNG vào gói bằng chứng (`goi["muc"]`) → không vào lời nhắc AI, không chạm đoạn mở đầu / mức / mã kiểm chứng;
nó được chèn vào câu trả lời cuối cùng (bản mẫu hay bản AI), ngay trước phần chân (tự soi, lưu ý, lời tham khảo).
Câu khủng hoảng / từ chối / dẫn hướng, câu cần thêm dữ kiện, lá số giờ tạm (không biết giờ sinh) → không có đoạn này.
Chỉ bản tiếng Việt (lời Việt chưa dịch).
"""
from __future__ import annotations

import re

from app import ngon_ngu
from app.kb import sach_ghi as sg
from app.luangiai import sach_ghi_mon as sgm

TIEU_DE = "Sách xưa ghi gì về điều bạn hỏi:"
TOI_DA = 2

# Chủ đề câu hỏi (câu đã bỏ dấu, chữ thường) → nhãn `chu_de` của mục KB sách xưa. Một câu có thể thuộc nhiều chủ đề.
_CHU_DE: list[tuple[str, tuple[str, ...]]] = [
    ("tien_bac", (r"(?<!\w)tien(?! (si|su|kiep))", r"tai chinh", r"giau", r"tai loc", r"lam an", r"kinh doanh",
                  r"dau tu", r"thu nhap", r"no nan", r"cua cai", r"tai san", r"(?<!\w)luong(?!\w)", r"buon ban")),
    ("cong_viec", (r"cong viec", r"su nghiep", r"(?<!\w)nghe(?! (nhac|loi|noi))", r"cong danh", r"thang chuc",
                   r"viec lam", r"chuc vu", r"(?<!\w)sep(?!\w)", r"khoi nghiep", r"cong ty", r"nhay viec", r"doi viec",
                   r"lam viec")),
    ("tinh_duyen", (r"tinh duyen", r"tinh yeu", r"nguoi yeu", r"ket hon", r"lay (chong|vo)", r"hon nhan",
                    r"vo chong", r"dao hoa", r"ban doi", r"ly hon", r"(?<!\w)yeu(?!\w)", r"nguoi ay")),
    ("gia_dinh", (r"gia dinh", r"cha me", r"bo me", r"anh em", r"anh chi em", r"ho hang", r"gia dao", r"ong ba",
                  r"(me|bo|cha) (toi|minh|em)")),
    ("con_cai", (r"con cai", r"con (toi|minh|em)(?!\w)", r"sinh con", r"co con", r"tre nho", r"con trai", r"con gai",
                 r"mang thai", r"thai san", r"hiem muon")),
    ("suc_khoe", (r"suc khoe", r"(?<!\w)benh(?!\w)", r"(?<!\w)om(?!\w)", r"di kham", r"co the", r"than the",
                  r"met moi", r"giac ngu", r"suc ben")),
    ("di_lai", (r"di xa", r"xuat ngoai", r"nuoc ngoai", r"du lich", r"di lai", r"an toan", r"tai nan", r"dinh cu",
                r"xuat khau lao dong", r"lai xe")),
    ("ban_be", (r"ban be", r"quy nhan", r"nguoi giup", r"hop tac", r"dong nghiep", r"giao tiep", r"tieu nhan")),
    ("nha_cua", (r"(?<!\w)nha(?! (nuoc|thuoc|hang|may|tho))", r"dat dai", r"bat dong san", r"phong ngu", r"(?<!\w)bep(?!\w)",
                 r"cua chinh", r"can ho", r"chung cu")),
    ("giay_to", (r"(?<!\w)kien(?!\w)", r"giay to", r"phap ly", r"hop dong", r"tranh chap")),
    ("tinh_net", (r"tinh cach", r"tinh tinh", r"con nguoi", r"ban than", r"toi la nguoi", r"diem manh", r"diem yeu",
                  r"tinh net")),
]
# Mục KB gắn "sức bền" đi cùng câu hỏi sức khoẻ; câu hỏi chung (không thuộc chủ đề nào) nhận mục tổng quan + tính nết.
_KEM = {"suc_khoe": ("suc_ben",)}
_CHUNG = ("tong_quan", "tinh_net")

# Tử vi: chủ đề → cung nói về chủ đề ấy (khi câu không chỉ ra cung nào).
_CUNG_CHU_DE = {"tien_bac": "Tài Bạch", "cong_viec": "Quan Lộc", "tinh_duyen": "Phu Thê", "gia_dinh": "Phụ Mẫu",
                "con_cai": "Tử Nữ", "suc_khoe": "Tật Ách", "di_lai": "Thiên Di", "ban_be": "Nô Bộc",
                "nha_cua": "Điền Trạch", "tinh_net": "Mệnh"}
_THU_TU = {"A": 0, "B": 1, "C": 2}
# Phương của cửa / bếp trong câu hỏi → quái (bát quái hậu thiên) — khoá tra của Dương Trạch Tam Yếu.
_QUAI_HUONG = {"Bắc": "Khảm", "Tây Nam": "Khôn", "Đông": "Chấn", "Đông Nam": "Tốn", "Tây Bắc": "Càn", "Tây": "Đoài",
               "Đông Bắc": "Cấn", "Nam": "Ly"}
_CHINH_TINH = ("Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
               "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân")


_TN_TV: list[re.Pattern] = []


def _thuat_ngu_tv() -> re.Pattern:
    if not _TN_TV:
        _TN_TV.append(_dung_thuat_ngu_tv())
    return _TN_TV[0]


def _dung_thuat_ngu_tv() -> re.Pattern:
    """Thuật ngữ Tử vi không được nằm trong thân câu trả lời (chỉ ở "Vì sao nói vậy"): tên sao, tên cung, độ sáng, tứ hoá,
    "cung + địa chi"… — cùng tinh thần bộ đo `scripts/do_chung_chung_tuvi.THUAT_NGU`."""
    from app.kb import tuvi_kb  # noqa: PLC0415
    ten = (*_CHINH_TINH, *tuvi_kb.ten_phu_tinh(), *(c for c in sgm._CUNG_TV if c != "Mệnh"))
    return re.compile(r"Miếu|Hãm|(?<!\w)[Hh]o[áa] (?:Lộc|Quyền|Khoa|Kỵ)|(?<!\w)tự ho[áa]|tam phương|tam hợp|xung chiếu|"
                      r"(?<!\w)cung (?=[A-ZĐ])|đại hạn|lưu niên|tiểu hạn|" + "|".join(re.escape(x) for x in ten))


def _sach_loi(m: dict) -> str:
    return " ".join(m.get(k) or "" for k in ("y", "ham_y", "viec"))


def _sach_ngu(m: dict, loai_bo: re.Pattern | None) -> bool:
    """Mục dùng được trong thân câu trả lời: không cụm giọng AI / chung chung, không thuật ngữ bị cấm của môn."""
    from app.kb import tuvi_doi_song_kb as kds  # noqa: PLC0415
    t = _sach_loi(m)
    if kds.tim_cum_cam(t, kds.cum_cam()) or kds.tim_cum_cam(t, kds.cum_chung_chung()):
        return False
    return not (loai_bo and loai_bo.search(t))


def chu_de(t: str) -> list[str]:
    """Các chủ đề của câu hỏi (câu đã chuẩn hoá: bỏ dấu, chữ thường), theo thứ tự xuất hiện trong bảng."""
    return [cd for cd, mau in _CHU_DE if any(re.search(m, t) for m in mau)]


def _chu_de_kb(cds: list[str]) -> set[str]:
    if not cds:
        return set(_CHUNG)
    return {x for cd in cds for x in (cd, *_KEM.get(cd, ()))}


def chon(nhom: list[tuple[str, str, list[tuple[dict, str]]]], cds: list[str] | None, tuoi: int | None,
         pham_vi: set[str] | None = None, uu_tien: tuple[str, ...] = (), toi_da: int = TOI_DA,
         loai_bo: re.Pattern | None = None) -> list[tuple[dict, str]]:
    """Từ danh sách nhóm của bộ chọn khối (`sach_ghi_mon.*_nhom`) → ≤ `toi_da` mục cho câu hỏi.
    `pham_vi`: chỉ lấy nhóm có mã trong tập này (vd tên cung). `uu_tien`: tên sao / thần sát người dùng nhắc → xếp trước.
    Lọc theo chủ đề; lọc hết thì giữ phạm vi (phạm vi đã do câu hỏi chỉ ra). Nhóm C: ≤ 1 mục, bỏ khi < 18 tuổi / chưa rõ."""
    tre = tuoi is None or tuoi < sgm.TUOI_NHOM_C
    cac = [(m, ve) for ma, _ten, ds in nhom if pham_vi is None or ma in pham_vi for m, ve in ds
           if not (tre and m["nhom"] == "C") and _sach_ngu(m, loai_bo)]
    if not cac:
        return []
    kb_cd = None if cds is None else _chu_de_kb(cds)              # None = câu hỏi đích danh, không lọc chủ đề
    loc = cac if kb_cd is None else [x for x in cac if x[0]["chu_de"] in kb_cd]
    if not loc and pham_vi is not None:
        loc = cac
    def khoa(x: tuple[dict, str]) -> tuple[int, int]:
        m, ve = x
        return (0 if any(u and u in ve for u in uu_tien) else 1, _THU_TU[m["nhom"]])
    ra, co_c = [], False
    for m, ve in sorted(loc, key=khoa):
        if m["nhom"] == "C":
            if co_c:
                continue
            co_c = True
        if all(m is not x[0] for x in ra):
            ra.append((m, ve))
        if len(ra) >= toi_da:
            break
    return ra


def _cau(m: dict) -> str:
    """Thân câu trả lời: lời sách theo nhóm (đã nói giảm) + việc nhỏ. Nhãn "về điều gì" (tên sao, cung, thần sát) là thuật
    ngữ → chỉ ở "Vì sao nói vậy"."""
    viec = f" Việc nhỏ: {m['viec']}" if m["nhom"] in ("B", "C") and m.get("viec") else ""
    return f"{sg.loi(m, co_am=False)}{viec}"


def gan(goi: dict, cac: list[tuple[dict, str]], nhan_trong_bai: bool = False) -> None:
    """Ghi các mục đã chọn vào gói (khoá riêng `sach_ghi_hoi`, ngoài `muc`) để `chen` dựng đoạn + "Vì sao nói vậy".
    `nhan_trong_bai`: câu kiến thức (không lá số) — nhãn "về điều gì" đứng ngay đầu đoạn, không có "Vì sao nói vậy"."""
    if not cac or not ngon_ngu.la_viet():
        return
    goi["sach_ghi_hoi"] = {
        "doan": [f"{ve}: {_cau(m)}" if nhan_trong_bai else _cau(m) for m, ve in cac],
        "cau_ket": sg.cau_ket([m for m, _ in cac]),
        "can_cu": [] if nhan_trong_bai else
                  [f"Sách xưa ({sgm.SACH.get(m['nguon'], 'sách xưa')}) — {ve}" + (f": «{m['han']}»" if m.get("han") else "")
                   for m, ve in cac],
        "muc": [{"ve": ve, "nhom": m["nhom"], "chu_de": m["chu_de"], "nguon": m["nguon"]} for m, ve in cac],
    }
    # Số trong lời sách (vd "20 phút") là số của KB đã duyệt → đăng ký như mọi số trong gói (bộ kiểm đầu ra).
    so = [int(x) for d in goi["sach_ghi_hoi"]["doan"] for x in re.findall(r"\d+", d)]
    goi["so_trong_goi"] = list(dict.fromkeys([*(goi.get("so_trong_goi") or []), *so]))


def chen(van: str, goi: dict, chan: tuple[str, ...], truoc=None) -> str:
    """Chèn đoạn sách xưa vào câu trả lời: sau phần trả lời chính, trước đoạn "Một cách đọc thêm" (`truoc(đoạn)` đúng)
    nếu có, không thì ngay trước phần chân (tự soi, lưu ý, lời tham khảo)."""
    s = goi.get("sach_ghi_hoi")
    if not s or not van:
        return van
    them = [TIEU_DE, *s["doan"], *([s["cau_ket"]] if s["cau_ket"] else [])]
    p = van.split("\n\n")
    i = next((k for k, x in enumerate(p) if any(re.match(c, x) for c in chan) or (truoc and truoc(x))), len(p))
    return "\n\n".join(p[:i] + them + p[i:])


def bo_qua(pl: dict, goi: dict, dac_biet: tuple[str, ...], sinh: dict | None) -> bool:
    """Không có đoạn sách xưa khi: không phải bản Việt · câu đặc biệt (khủng hoảng, từ chối, dẫn hướng…) · cần thêm dữ
    kiện · lá số dựng với giờ tạm (người dùng không biết giờ sinh)."""
    return (not ngon_ngu.la_viet() or pl.get("xu_ly") in dac_biet or bool(goi.get("can_them"))
            or bool(sinh and sinh.get("gio_tam")))


# ───────────────────────── từng môn ─────────────────────────

def cung_tuvi(ls: dict) -> list[dict]:
    """Lá số dạng gọn của hỏi đáp Tử vi (`hoidap.tuvi.tom_tat`) → dạng cung của bộ chọn khối (`sach_ghi_mon.tuvi_nhom`)."""
    hoa = {(x["sao"], x["cung"]): x["hoa"] for x in ls.get("tu_hoa") or []}
    return [{"ten": c["ten"], "chi": c.get("chi"),
             "chinh_tinh": [{"ten": s["ten"], "do_sang_nam_phai": s.get("do_sang"), "tu_hoa": s.get("tu_hoa")}
                            for s in c["chinh_tinh"]],
             "phu_tinh": [{"ten": p, "tu_hoa": hoa.get((p, c["ten"]))} for p in c["phu_tinh"]]} for c in ls["cung"]]


def tuvi(goi: dict, ls: dict, t: str, sao_nhac: list[str], tuoi: int | None) -> None:
    """Cung được hỏi = cung theo chủ đề câu hỏi + cung mà gói bằng chứng đã đọc (theo thứ tự đó)."""
    cds = chu_de(t)
    cung = [_CUNG_CHU_DE[cd] for cd in cds if cd in _CUNG_CHU_DE]
    for m in goi.get("muc") or []:
        c = m.get("ten") if m.get("loai") == "cung" else m.get("cung")
        if isinstance(c, str) and c in sgm._CUNG_TV:
            cung.append(c)
    if not cung:
        cung = ["Mệnh"]
    pv = set(dict.fromkeys(cung))
    gan(goi, chon(sgm.tuvi_nhom(cung_tuvi(ls)), cds, tuoi, pv, tuple(sao_nhac), loai_bo=_thuat_ngu_tv()))


def tuvi_kien_thuc(goi: dict, sao: str, cung: str, tuoi: int | None) -> None:
    """Câu kiến thức "sao X ở cung Y nghĩa là gì" (không lá số): câu Toàn Thư về đúng sao ở đúng cung, mọi điều kiện
    độ sáng (nhãn ghi rõ "khi sao sáng / ở thế yếu" ở "Vì sao nói vậy"); tối đa 3 mục, A trước. Câu trả lời kiến thức tự
    nói về sao nên không lọc tên sao như câu về lá số."""
    ds = (sgm._kb("tuvi_sach_ghi.json")["muc"].get(sao) or {}).get(cung) or []
    cac = [(m, f"Sao {sao} ở cung {cung}" + (f" · {sgm._KHI_TV[m['khi']]}" if m.get("khi") in sgm._KHI_TV else ""))
           for m in ds]
    gan(goi, chon([(cung, cung, cac)], None, tuoi, toi_da=3), nhan_trong_bai=True)


def battu(goi: dict, ls: dict, t: str, tuoi: int | None, gioi: str | None, ten_nhac: list[str]) -> None:
    from app.calc import battu_mo_rong  # noqa: PLC0415
    cds = chu_de(t)
    nhom = sgm.battu_nhom(ls, battu_mo_rong.mo_rong(ls), gioi)
    # Câu hỏi đích danh một thần sát → chỉ nhóm thần sát; còn lại chọn theo chủ đề trên mọi nhóm.
    pv = {"than_sat"} if ten_nhac else None
    gan(goi, chon(nhom, cds, tuoi, pv, tuple(f"sao {x}" for x in ten_nhac)))


def phongthuy(goi: dict, t: str, sinh: dict | None, tuoi: int | None) -> None:
    """Dấu hiệu nhà mà gói bằng chứng đang đọc (mục `bo_tri`) → câu sách về đúng dấu hiệu ấy; câu trả lời bàn mệnh quái /
    hướng của người hỏi (mục `menh_quai`, `du_nien`) → điều sách dặn người cung đó. Không có hai thứ ấy → không có đoạn."""
    muc = goi.get("muc") or []
    cap = next((c for m in muc if m.get("loai") == "cua_chu_bep" for c in m.get("cap") or [] if c.get("cap") == "cửa–bếp"),
               None)
    if cap and (cua := _QUAI_HUONG.get(cap["tu"])) and (bep := _QUAI_HUONG.get(cap["den"])):
        nhom = sgm.phongthuy_nhom(cua=cua, bep=bep)
        # Tam Yếu tra theo cặp bếp – cửa; chỉ dùng khi du niên sách ghi trùng du niên engine tính (một bộ tính).
        nhom = [(ma, ten, [(m, ve) for m, ve in ds if m.get("du_nien") == cap["du_nien"]]) for ma, ten, ds in nhom]
        gan(goi, chon(nhom, None, tuoi, {"cua_chu_bep"}, toi_da=1))
        return
    dau_hieu = list(dict.fromkeys(m["ma"] for m in muc if m.get("loai") == "bo_tri" and m.get("ma")))
    quai = next((m["quai"] for m in muc if m.get("loai") == "menh_quai" and m.get("quai")), None)
    if not quai and any(m.get("loai") == "du_nien" for m in muc):
        quai = next((m["quai"] for m in muc if m.get("quai")), None)
    if not dau_hieu and not quai:
        return
    nhom = sgm.phongthuy_nhom(quai=quai, dau_hieu=dau_hieu or None)
    # Câu sách đã trích ngay trong lời mục bố trí (KT-PT1, trường `sach`) thì không nhắc lại ở đoạn sách xưa.
    # Phạm vi chọn trước khi lọc: câu hỏi về một dấu hiệu mà câu sách duy nhất đã trích ở trên → không có đoạn,
    # không lấy điều dặn theo cung mệnh (lạc đề) thế chỗ.
    pv = {"dau_hieu"} if dau_hieu and any(ma == "dau_hieu" and ds for ma, _, ds in nhom) else {"cung_menh"}
    da = {m["sach"]["han"] for m in muc if isinstance(m.get("sach"), dict) and m["sach"].get("han")}
    nhom = [(ma, ten, [(m, ve) for m, ve in ds if m.get("han") not in da]) for ma, ten, ds in nhom]
    gan(goi, chon(nhom, chu_de(t) or ["nha_cua"], tuoi, pv))
