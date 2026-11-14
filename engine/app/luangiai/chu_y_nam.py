# -*- coding: utf-8 -*-
"""CY-1 (2026-11-04, chủ dự án giao) — "năm nên chú ý {mảng} hơn" cho MỌI mảng đời người dùng hay lo (RULES, tất định,
không LLM). Mở rộng cách làm SK-1 (`suc_khoe_nam` — sức khoẻ là một mảng của cùng cơ chế): những câu hỏi người dùng
quan tâm mà luận giải có đụng tới (tiền bạc, đầu tư, công việc, tình cảm, gia đạo, nhà cửa, đi lại, giấy tờ, bạn bè, vận
hạn) vẫn được trả lời — bằng NĂM do phép tính có sẵn chỉ ra + VIỆC cụ thể nên làm + RANH GIỚI của mảng (luật sư, không phải
lời khuyên đầu tư, an toàn giao thông…). Lời nhắc chủ động, không phải lời đoán: không "sẽ mất tiền / sẽ ly hôn / sẽ bị
kiện / sẽ gặp tai nạn", không đổi MỨC của chương nào. Mọi phép tính dùng lại CALC / RULES có sẵn (một bộ tính):
- Tử vi: `calc.tuvi_phi_hoa.phi_tu_can` (tứ hoá năm + can đại hạn — cùng hàm dòng mười năm của chương Vận hạn), cung lưu
  niên theo chi năm, đại hạn theo tuổi mụ, sao lưu năm đang xem (`luangiai.tuvi_sao_luu.doc`). Mỗi mảng một cung
  (KB `chu_y_kb.mang.<mảng>.tuvi.cung`): Hoá Kỵ năm nhập cung (2) · Kỵ năm chiếu từ cung đối (1) · cung lưu niên là cung
  đó (1) · đại hạn đi cung đó (1) · Hoá Kỵ can đại hạn nhập cung (1) · sao lưu khó ở cung (năm đang xem, 1). Năm ≥ 2
  điểm, có ít nhất một lý do của riêng năm → năm nên chú ý (đúng luật SK-1 cho Tật Ách).
- Bát tự: lưu niên (`calc.battu_mo_rong.luu_nien`, năm theo Lập xuân) — thập thần của can năm (Kiếp Tài / Tỷ Kiên →
  tiền, Thất Sát → công việc, Thương Quan → giấy tờ, Kiếp Tài → bạn bè) hoặc chi năm xung / hình trụ của mảng (chi ngày →
  tình cảm, nhà; trụ tháng / giờ → gia đạo; trụ năm → đi lại) — CHỈ khi hai cách lấy dụng thần (`battu_doi_song`
  `muc_hai_cach`) cùng không thấy năm đó thuận (luật "hai cách cùng thấy" như `gop_muc_mang`).
- Thần số: năm cá nhân (mốc 1/1 dương như trang đọc) theo chủ đề KB của mảng (4/8 tiền, 5 đi lại, 7/9 công việc…).
- Phong thuỷ: sao lưu niên Huyền Không (`calc.huyen_khong.luu_nien`) bay tới phía cửa chính (7 tiền, 3 giấy tờ, 5 nhà).
Lời ở KB `chu_y_kb.json` (một nguồn). Sức khoẻ vẫn theo SK-1 (hộp + mã cũ giữ nguyên)."""
from __future__ import annotations

import re

from app.kb import chu_y_kb as kb
from app.kb import ten as _ten
from app.kb.loi import L, danh_sach

SO_NAM = 10
TOI_DA_NAM = 3
TUOI_TOI_THIEU = 18          # dưới 18 tuổi: không hộp chú ý (lời cho trẻ đã có ở chương Vận hạn)
_DIEM = {"ky_nhap": 2, "ky_chieu": 1, "luu_nien": 1, "dai_han": 1, "ky_dai_han": 1, "sao_luu": 1}
NGUONG_TUVI = 2
_LOP_NAM = {"ky_nhap", "ky_chieu", "luu_nien", "sao_luu"}     # lý do của riêng một năm (không phải lớp mười năm)
_XUNG = {"lục xung"}
_HINH = {"tương hình", "tự hình", "lục hại"}
_TRU = {"nam": (0,), "thang_gio": (1, 3), "ngay": (2,), "ngay_xung": (2,), "gio": (3,)}


# ------------------------------------------------------------------ câu
def _noi(ds: list) -> str:
    return danh_sach([str(x) for x in ds])       # bản Việt: "A, B và C" như cũ; bản Anh: "A, B and C"


def cau_mang(mang: str, ds: list[dict], toi_da: int = TOI_DA_NAM, viec: str | None = None) -> str:
    """"Năm 2027 và 2030 nên chú ý tiền bạc hơn: hạn chế cho vay…" — năm đang đi riêng một câu (việc làm ngay).
    `viec` = việc ngắn dùng chung cho mọi năm (hộp nhiều mảng) — năm đang đi không tách câu riêng."""
    ds = ds[:toi_da]
    if viec is not None:
        nam = _noi([x["nam"] for x in ds]) + (L("chu_y.nam_dang_di", " (năm đang đi)") if len(ds) == 1 and ds[0].get("hien_tai") else "")
        return kb.mau("nam").format(nam=nam, mang=kb.ten(mang), viec=viec)
    nay = [x["nam"] for x in ds if x.get("hien_tai")]
    sau = [x["nam"] for x in ds if not x.get("hien_tai")]
    ra = []
    if nay:
        ra.append(kb.mau("nam_nay").format(nam=nay[0], mang=kb.ten(mang), viec=kb.viec(mang, True)))
    if sau:
        ra.append(kb.mau("nam").format(nam=_noi(sau), mang=kb.ten(mang), viec=kb.viec(mang)))
    return " ".join(ra)


def tieu_de(cac_mang: list[str]) -> str:
    return kb.mau("tieu_de").format(mang=", ".join(kb.ten(m) for m in cac_mang))   # danh sách mảng: dấu phẩy ở cả hai ngôn ngữ


def kiem(van: str) -> list[str]:
    """Cụm cấm (lời đoán biến cố, từ doạ, vật phẩm…) có trong `van` — rỗng = đạt. Khớp theo ranh giới âm tiết."""
    t = (van or "").lower()
    return [c for c in kb.cum_cam() if re.search(r"(?<!\w)" + re.escape(c.lower()) + r"(?!\w)", t)]


# ------------------------------------------------------------------ Tử vi
# Review CY-1 (2026-11-04): mảng đời KHÁC sức khoẻ dùng thang chặt hơn và ĐỌC CÙNG dữ liệu với chương Vận hạn — trước
# đây Kỵ của can đại hạn cộng +1 cho MỌI năm trong mười năm nên một lý do của năm đã đủ ngưỡng (28/99 năm "nên chú ý"
# rơi đúng năm Vận hạn gọi là thuận; mỗi báo cáo 5–6 hộp). Nay: chỉ lý do của RIÊNG năm cộng điểm (Kỵ năm nhập 2 · Kỵ năm
# chiếu 1 · cung lưu niên là cung đó 1 · chồng Kỵ gốc 1 · Vận hạn chấm năm đó "Cần lưu ý" vì Kỵ chạm đúng cung 1 · sao
# lưu khó năm đang xem 1 · ý bổ sung của năm 1), ngưỡng 3; lớp mười năm chỉ ghi làm bối cảnh. Năm Vận hạn chấm thuận,
# hoặc Hoá Lộc năm nhập đúng cung → không phải năm nên chú ý mảng đó (không nói ngược chương Vận hạn / Năm nay).
_DIEM_MANG = {"ky_nhap": 2, "ky_chieu": 1, "luu_nien": 1, "chong_ky": 1, "van_han_can": 1, "sao_luu": 1}
NGUONG_MANG = 3
_BOI_CANH = ("dai_han", "ky_dai_han")


def _dong_van_han(ls: dict, nam_am_xem: int, nam_am_sinh: int) -> dict[int, dict]:
    """Dòng mười năm của chương Vận hạn (`tuvi_doi_song.dong_muoi_nam`) — một bộ tính cho hỏi đáp khi chưa có báo cáo."""
    from app.luangiai import tuvi_doi_song as tvd  # noqa: PLC0415
    return {g["nam"]: g for g in tvd.dong_muoi_nam(ls, tvd.cham_cung(ls), nam_am_xem, nam_am_sinh)}


def tuvi_nam_cung(ls: dict, nam_am_xem: int, nam_am_sinh: int, cung: str, so_nam: int = SO_NAM,
                  sao_luu_ta: list[str] | None = None, them: dict[int, list[tuple[str, str]]] | None = None,
                  dong: dict[int, dict] | None = None, mang_thuong: bool = False) -> list[dict]:
    """Năm âm lịch trong `so_nam` năm tới mà cung `cung` được kích hoạt. `them` = {năm: [(mã lý do, căn cứ)]} (lý do
    riêng của năm, mỗi lý do 1 điểm). Hoá Lộc năm nhập đúng cung → bỏ năm (cả SK-1).
    - SK-1 (`mang_thuong=False`, sức khoẻ): thang SK-1 (`_DIEM`, ngưỡng 2, cần ≥ 1 lý do của riêng năm).
    - Mảng đời khác (`mang_thuong=True`): thang `_DIEM_MANG`, ngưỡng `NGUONG_MANG`, lớp mười năm chỉ là bối cảnh; năm
      `dong` (dòng Vận hạn {năm: dòng}) chấm thuận → bỏ.
    Mỗi dòng căn cứ mở bằng "Năm {n} ({can chi}): …" → [{nam, tuoi, diem, ly_do, can_cu, boi_canh, hien_tai, ky_sao}]."""
    from app.calc import lunar  # noqa: PLC0415
    from app.calc import tuvi_phi_hoa as phi  # noqa: PLC0415
    goc_ky = next((x["cung"] for x in ls.get("tu_hoa") or [] if x["hoa"] == "Kỵ"), None)
    ra = []
    for k in range(so_nam):
        nam = nam_am_xem + k
        can, chi = lunar.can_chi_nam(nam)
        tuoi = nam - nam_am_sinh + 1
        hoa = {x["hoa"]: x for x in phi.phi_tu_can(can, ls["cung"])}
        ky, loc = hoa["Kỵ"], hoa["Lộc"]
        g = (dong or {}).get(nam) or {}
        # SK-1 giữ bất biến "Kỵ năm nhập Tật Ách luôn là năm nên chú ý" — Lộc cùng vào thì vẫn nhắc đi khám
        if (loc["den_cung"] == cung and (mang_thuong or ky["den_cung"] != cung)) or (mang_thuong and g.get("muc") == "thuan"):
            continue
        dau = L("tv.cyn.dau", f"Năm {nam} ({can} {chi}): ", nam=nam, can=_ten.ten("can", can), chi=_ten.ten("chi", chi))
        tc, ks = _ten.ten("cung", cung), _ten.ten("sao", ky["sao"])
        ly, cu, bc = [], [], []
        if ky["den_cung"] == cung:
            ly.append("ky_nhap")
            cu.append(L("tv.cyn.ky_nhap", f"{dau}Hoá Kỵ năm ({ky['sao']}) nhập cung {cung}", dau=dau, sao=ks, cung=tc))
            if mang_thuong and goc_ky == cung:
                ly.append("chong_ky")
                cu.append(L("tv.cyn.chong_ky", f"{dau}trùng cung Hoá Kỵ gốc (chồng Kỵ)", dau=dau))
        elif ky["xung_cung"] == cung:
            ly.append("ky_chieu")
            cu.append(L("tv.cyn.ky_chieu", f"{dau}Hoá Kỵ năm ({ky['sao']}) ở cung {ky['den_cung']}, chiếu sang {cung}", dau=dau,
                        sao=ks, den=_ten.ten("cung", ky["den_cung"]), cung=tc))
        c_ln = next(c for c in ls["cung"] if c["chi"] == chi)
        if c_ln["ten"] == cung:
            ly.append("luu_nien")
            cu.append(L("tv.cyn.luu_nien", f"{dau}cung lưu niên ({chi}) là {cung}", dau=dau, chi=_ten.ten("chi", chi), cung=tc))
        if mang_thuong and g.get("muc") == "can_chu_dong" and (g.get("_tac") or (None, None))[1] == cung:
            ly.append("van_han_can")
            cu.append(L("tv.cyn.van_han_can", f"{dau}chương Vận hạn chấm năm này Cần lưu ý vì Hoá Kỵ năm chạm cung {cung}",
                        dau=dau, cung=tc))
        dh = next((c for c in ls["cung"] if c["dai_han"][0] <= tuoi <= c["dai_han"][1]), None)
        lop10 = []
        if dh:
            if dh["ten"] == cung:
                lop10.append(("dai_han", L("tv.cyn.dai_han", f"Đại hạn {dh['dai_han'][0]}–{dh['dai_han'][1]} tuổi đi cung {cung}",
                                           tu=dh["dai_han"][0], den=dh["dai_han"][1], cung=tc)))
            if dh.get("can"):
                ky_dh = next(x for x in phi.phi_tu_can(dh["can"], ls["cung"]) if x["hoa"] == "Kỵ")
                if ky_dh["den_cung"] == cung:
                    lop10.append(("ky_dai_han", L("tv.cyn.ky_dai_han", f"Hoá Kỵ của can đại hạn {dh['can']} ({ky_dh['sao']}) nhập {cung}",
                                                  can=_ten.ten("can", dh["can"]), sao=_ten.ten("sao", ky_dh["sao"]), cung=tc)))
        for ma, cau in lop10:
            if mang_thuong:
                bc.append(L("tv.cyn.boi_canh", f"Bối cảnh cả giai đoạn (không tính điểm cho từng năm): {cau}", cau=cau))
            else:
                ly.append(ma)
                cu.append(f"{dau}{cau}")
        if k == 0 and sao_luu_ta:
            ly.append("sao_luu")
            cu.append(L("tv.cyn.sao_luu", f"{dau}sao lưu ở {cung}: {', '.join(sao_luu_ta)}", dau=dau, cung=tc,
                        ds=", ".join(sao_luu_ta)))
        for ma, cau in (them or {}).get(nam, []):
            if ma not in ly:
                ly.append(ma)
                cu.append(f"{dau}{cau}")
        if mang_thuong:
            diem = sum(_DIEM_MANG.get(x, 1) for x in ly)
            if diem < NGUONG_MANG:
                continue
        else:
            diem = sum(_DIEM.get(x, 1) for x in ly)
            # năm chỉ có lớp mười năm (đại hạn) không thành "năm" riêng — lớp đó là cả giai đoạn
            if diem < NGUONG_TUVI or not (set(ly) & _LOP_NAM or any(x not in _DIEM for x in ly)):
                continue
        ra.append({"nam": nam, "tuoi": tuoi, "diem": diem, "ly_do": ly, "can_cu": cu, "boi_canh": bc,
                   "hien_tai": k == 0, "ky_sao": ky["sao"]})
    return ra


def sao_luu_kho(sao_luu: dict | None, cung: str) -> list[str]:
    """Tên sao lưu khó (Kình, Đà, Tang Môn, Bạch Hổ) ở cung `cung` năm đang xem (`tuvi_sao_luu.doc`)."""
    from app.luangiai import tuvi_sao_luu as tvsl  # noqa: PLC0415
    return [m["ten"] for m in (sao_luu or {}).get("muc") or [] if m["ma"] in tvsl._CHU_Y and cung in m["cac_cung"]]


def tuvi_nam(ls: dict, nam_am_xem: int, nam_am_sinh: int, mang: str, sao_luu: dict | None = None,
             so_nam: int = SO_NAM, dong: dict[int, dict] | None = None) -> list[dict]:
    """Năm nên chú ý mảng `mang` theo lá số Tử vi (cung của mảng trong KB). Sức khoẻ → SK-1. `dong` = dòng mười năm
    của chương Vận hạn ({năm: dòng}, báo cáo truyền vào); không có → tự dựng bằng cùng hàm (hỏi đáp)."""
    if mang == "suc_khoe":
        from app.luangiai import suc_khoe_nam as skn  # noqa: PLC0415
        return skn.tuvi_nam(ls, nam_am_xem, nam_am_sinh, so_nam, sao_luu_kho(sao_luu, skn.CUNG_SK))
    cung = kb.theo_mon(mang, "tuvi").get("cung")
    if not cung:
        return []
    if dong is None:
        dong = _dong_van_han(ls, nam_am_xem, nam_am_sinh)
    return [{**x, "mang": mang} for x in tuvi_nam_cung(ls, nam_am_xem, nam_am_sinh, cung, so_nam,
                                                       sao_luu_kho(sao_luu, cung), dong=dong, mang_thuong=True)]


def ma_ly_do(x: dict) -> str:
    """Lý do mạnh nhất của một năm → phần cuối mã kiểm chứng (theo LOẠI chỉ báo, không theo năm)."""
    ly = x.get("ly_do") or ["chung"]
    return max(ly, key=lambda m: (_DIEM.get(m, _DIEM_MANG.get(m, 0)), -ly.index(m)))


# ------------------------------------------------------------------ Bát tự
def battu_nam(ls: dict, dong: list[dict], mang: str) -> list[dict]:
    """Năm (Lập xuân) trong dòng mười năm `dong` (`battu_doi_song.dong_muoi_nam`, đã chấm hai cách) mà mảng `mang` có
    tác nhân của năm (thập thần can năm / chi năm xung, hình trụ của mảng — KB) VÀ hai cách lấy dụng thần cùng không thấy
    năm đó thuận. → [{nam, tuoi, ly_do, can_cu, hien_tai, mang}]."""
    from app.calc import battu_mo_rong as mr  # noqa: PLC0415
    o = kb.theo_mon(mang, "battu")
    if not o:
        return []
    ra = []
    for g in dong:
        if "thuan" in (g.get("muc_cach_1"), g.get("muc_cach_2")):
            continue
        ln = mr.luu_nien(ls, g["nam"])
        ly = None
        if g.get("_tt") in (o.get("thap_than") or []):
            ly = (re.sub(r"[^a-z0-9]+", "_", _khong_dau(g["_tt"])).strip("_"),
                  o["ly"].format(tt=_tt_bt(g["_tt"]), chi=_ten.ten("chi", ln["chi"])))
        elif o.get("quan_he"):
            tru = _TRU[o["quan_he"]]
            loai = _XUNG if o["quan_he"] in ("nam", "ngay_xung", "thang_gio") else _XUNG | _HINH
            q = next((q for q in ln["quan_he"] if not q["loai"].startswith("can ") and q["loai"] in loai
                      and any(i in q["tru"] for i in tru)), None)
            if q:
                ly = ("xung_" + o["quan_he"] if q["loai"] in _XUNG else "hinh_" + o["quan_he"],
                      o["ly"].format(tt=_tt_bt(g.get("_tt")), chi=_ten.ten("chi", ln["chi"])) + f" ({_mo_ta_bt(q)})")
        if not ly:
            continue
        dau = L("bt_ds.cyn.dau", f"Năm {g['nam']} ({ln['can']} {ln['chi']}, tính từ Lập xuân): ", nam=g["nam"],
                cc=f"{_ten.ten('can', ln['can'])} {_ten.ten('chi', ln['chi'])}")
        cu = [f"{dau}{ly[1]}",
              L("bt_ds.cyn.hai_cach", f"{dau}hai cách lấy dụng thần đều không thấy năm này thuận (cách 1: {_nhan(g.get('muc_cach_1'))}, "
                f"cách 2: {_nhan(g.get('muc_cach_2'))})", dau=dau, muc_1=_nhan(g.get("muc_cach_1")),
                muc_2=_nhan(g.get("muc_cach_2")))]
        ra.append({"nam": g["nam"], "tuoi": g.get("tuoi"), "ly_do": [ly[0]], "can_cu": cu,
                   "hien_tai": bool(g.get("hien_tai")), "mang": mang})
    return ra


def _nhan(m: str | None) -> str:
    vi = {"thuan": "thuận lợi", "can_bang": "cân bằng", "can_chu_dong": "cần lưu ý"}.get(m or "", "cân bằng")
    return L(f"bt_ds.cyn.muc.{m if m in ('thuan', 'can_bang', 'can_chu_dong') else 'can_bang'}", vi)


def _tt_bt(tt: str | None) -> str | None:
    """Tên thập thần theo ngôn ngữ (bản Việt nguyên chữ)."""
    return _ten.ten("thap_than", tt) if tt else tt


def _mo_ta_bt(q: dict) -> str:
    """Mô tả quan hệ CALC: bản Việt nguyên chữ, ngôn ngữ khác dựng lại từ mã."""
    from app import ngon_ngu  # noqa: PLC0415
    if ngon_ngu.la_viet():
        return q["mo_ta"]
    from app.luangiai import battu_hien  # noqa: PLC0415
    return battu_hien.mo_ta_quan_he(q)


def _khong_dau(s: str) -> str:
    from app.luangiai.hoi import chuan_hoa  # noqa: PLC0415
    return chuan_hoa(s)


# ------------------------------------------------------------------ Thần số
def thanso_nam(nam_ca_nhan_cua: dict[int, int], mang: str, nam_hien_tai: int | None = None) -> list[dict]:
    """{năm dương: số năm cá nhân} → năm có chủ đề KB của mảng (vd 4/8 tiền bạc, 5 đi lại)."""
    if mang == "suc_khoe":
        from app.luangiai import suc_khoe_nam as skn  # noqa: PLC0415
        return skn.thanso_nam(nam_ca_nhan_cua, nam_hien_tai)
    so = kb.theo_mon(mang, "thanso").get("so") or {}
    return [{"nam": n, "so": s, "ly_do": [f"nam{s}"], "hien_tai": n == nam_hien_tai, "mang": mang,
             "can_cu": [f"Năm {n} là {so[str(s)]}"]}
            for n, s in sorted(nam_ca_nhan_cua.items()) if str(s) in so]


def thanso_nam_nguoi(ngay: int, thang: int, mang: str, nam0: int, so_nam: int = SO_NAM) -> list[dict]:
    from app.calc import thanso  # noqa: PLC0415
    ncn = {y: int(thanso.nam_ca_nhan(ngay, thang, y, moc="duong_lich")) for y in range(nam0, nam0 + so_nam)}
    return thanso_nam(ncn, mang, nam0)


# ------------------------------------------------------------------ Phong thuỷ
def _cc_pt(n: int, y: str, noi: str, quai: str) -> str:
    """Căn cứ năm của sao lưu niên (EN-ALL GĐ 5: bản Anh thay cụm "the main door side" theo đúng nơi)."""
    y = y.replace("phía cửa chính", f"phía {noi} (quái {quai})")
    y = y.replace("the main door side", L("pt.cy.noi", "phía {noi} (quái {quai})", noi=noi, quai=_ten.ten("quai", quai)))
    return L("pt.cy.can_cu", "Lưu niên {n}: {y}", n=n, y=y)


def phongthuy_nam(quai: str, tu_nam: int, mang: str, so_nam: int = SO_NAM, noi: str = "cửa chính") -> list[dict]:
    """Năm (Lập xuân) sao lưu niên KB của mảng bay tới quái `quai` (phía cửa chính)."""
    from app.calc import huyen_khong as hk  # noqa: PLC0415
    sao = kb.theo_mon(mang, "phongthuy").get("sao") or {}
    ra = []
    for n in range(tu_nam, tu_nam + so_nam):
        so = hk.luu_nien(n)["cung"].get(quai)
        if str(so) in sao:
            ra.append({"nam": n, "sao": so, "ly_do": [f"sao{so}"], "hien_tai": n == tu_nam, "mang": mang,
                       "can_cu": [_cc_pt(n, sao[str(so)], noi, quai)]})
    return ra


# ------------------------------------------------------------------ hộp báo cáo
def hop_chuong(theo_mang: dict[str, list[dict]], ma_mau: str, hop_fn, trong: float = 1.3) -> dict | None:
    """MỘT hộp "thoi_diem" (không mức) cho một chương: mỗi mảng có năm → một câu năm + việc + ranh giới của mảng.
    `hop_fn(loai, tieu_de, noi_dung, can_cu, ma_mau, trong, **them)` = hàm dựng hộp của từng mảng."""
    co = [(m, ds[:TOI_DA_NAM]) for m, ds in theo_mang.items() if ds]
    if not co:
        return None
    nd = noi_dung_hop([(m, ds) for m, ds in co])
    # căn cứ theo năm CÓ CẤU TRÚC ({mảng: [{nam, can_cu}]}) — Thời gian tới / hỏi đáp lọc theo năm, không dò chuỗi
    theo_nam = {m: [{"nam": x["nam"], "can_cu": list(dict.fromkeys(x["can_cu"]))} for x in ds] for m, ds in co}
    cu = list(dict.fromkeys(c for v in theo_nam.values() for y in v for c in y["can_cu"]))
    cu += list(dict.fromkeys(c for _, ds in co for x in ds for c in x.get("boi_canh") or [] if c not in cu))
    cac_nam = sorted({x["nam"] for _, ds in co for x in ds})
    return hop_fn("thoi_diem", tieu_de([m for m, _ in co]), nd, cu, ma_mau, trong,
                  nam=cac_nam[0], cac_nam=cac_nam, chu_y=[m for m, _ in co],
                  nam_theo_mang={m: [x["nam"] for x in ds] for m, ds in co}, can_cu_theo_nam=theo_nam)


def ranh_gioi_nhieu(cac_mang: list[str]) -> str:
    """MỘT lời miễn trừ cho hộp nhiều mảng: câu chung + vế riêng ngắn của mảng cần (luật sư, đầu tư…)."""
    them = list(dict.fromkeys(kb.mang(m).get("ranh_gioi_gon") or "" for m in cac_mang))
    them = [x for x in them if x]
    return kb.mau("ranh_gioi_nhieu") + ("; " + "; ".join(them) if them else "") + "."


def noi_dung_hop(co: list[tuple[str, list[dict]]]) -> str:
    """Một mảng → câu năm + việc + ranh giới của mảng. Nhiều mảng (review CY-1: hộp 3 mảng 168 chữ, ba lời miễn trừ) →
    mỗi mảng một câu năm + việc NGẮN (`viec_ngan`), rồi MỘT lời miễn trừ chung."""
    if len(co) == 1:
        m, ds = co[0]
        return f"{cau_mang(m, ds)} {kb.ranh_gioi(m)}".strip()
    cau = " ".join(cau_mang(m, ds, viec=kb.mang(m).get("viec_ngan") or kb.viec(m)) for m, ds in co)
    return f"{cau} {ranh_gioi_nhieu([m for m, _ in co])}"


def hop_nam_dich(h: dict, nam: int) -> dict | None:
    """Bản của hộp `h` chỉ nói NĂM `nam` (Thời gian tới đọc một năm đích): mảng có năm đó → câu năm (không "năm đang đi",
    vì báo cáo nguồn chạy ở Tết năm đích) + ranh giới; căn cứ chỉ giữ dòng của năm đó (theo `can_cu_theo_nam`, có cấu
    trúc — không dò chuỗi). Không mảng nào → None."""
    co = [m for m in h.get("chu_y") or [] if nam in ((h.get("nam_theo_mang") or {}).get(m) or [])]
    if not co:
        return None
    nd = noi_dung_hop([(m, [{"nam": nam}]) for m in co])
    theo = {m: [y for y in (h.get("can_cu_theo_nam") or {}).get(m) or [] if y["nam"] == nam] for m in co}
    return {**h, "tieu_de": tieu_de(co), "noi_dung": nd, "chu_y": co, "nam": nam, "cac_nam": [nam],
            "nam_theo_mang": {m: [nam] for m in co}, "can_cu_theo_nam": theo,
            "can_cu": list(dict.fromkeys(c for v in theo.values() for y in v for c in y["can_cu"]))}


def tim_hop(chuong_ds: list[dict], mang: str) -> dict | None:
    """Hộp "Năm nên chú ý …" của báo cáo có mảng `mang` (đọc lại cho khung "Cần lưu ý", Thời gian tới, hỏi đáp)."""
    return next((h for c in chuong_ds for h in c.get("hop") or [] if mang in (h.get("chu_y") or [])), None)


def ap(chuong_ds: list[dict], mon: str, tinh, ma_fn, hop_fn, hoc: tuple = (None, None), tuoi: int | None = None,
       toi_da_hop: int = 6, toi_da_them: int = 0) -> None:
    """Gắn hộp "Năm nên chú ý {mảng} hơn" vào các chương mảng đời của báo cáo (sửa tại chỗ), SAU khi đã chọn "Điều
    quan trọng nhất" (hộp này không vào cốt lõi, không đổi mức). `tinh(mảng)` → danh sách năm; `ma_fn(chương, mảng
    ghép, lý do)` → mã kiểm chứng. Trần hộp giữ nguyên như hiện có: chương đã đủ `toi_da_hop + toi_da_them` hộp (Tử vi:
    6 hộp lá số + tối đa 2 hộp ý bổ sung — hộp này dùng chung chỗ của hộp thêm; Bát tự: 6) → không thêm, không xoá hộp
    nào (mã kiểm chứng cũ không mất). Luật HỌC chung (`doi_song_khuon.danh_gia_phieu`): ≥ 100 phiếu & < 40 % đúng → "Đang xem lại" vào căn cứ;
    phiếu "chưa đúng" của chính người xem → đứng cuối."""
    from app.luangiai import doi_song_khuon as kh  # noqa: PLC0415
    if tuoi is not None and tuoi < TUOI_TOI_THIEU:
        return
    trong_so, ca_nhan = hoc[0] or {}, hoc[1] or {}
    cache: dict[str, list[dict]] = {}
    for c in chuong_ds:
        mangs = kb.chuong(mon).get(c.get("ma", ""))
        if not mangs:
            continue
        if len(c.get("hop", [])) >= toi_da_hop + toi_da_them:
            continue
        theo = {}
        for m in mangs:
            if m not in cache:
                cache[m] = tinh(m)
            theo[m] = cache[m]
        co = [m for m in mangs if theo[m]]
        if not co:
            continue
        dau = theo[co[0]][0]
        # hộp nhiều mảng: mã theo BỘ mảng (không theo lý do của năm đầu — năm đầu đổi mỗi năm, phiếu cũ mất)
        h = hop_chuong(theo, ma_fn(c["ma"], "+".join(co), ma_ly_do(dau) if len(co) == 1 else ""), hop_fn)
        if not h:
            continue
        dg = kh.danh_gia_phieu(trong_so.get(h["ma_mau"]))
        if dg:
            h["ty_le_dung"], h["so_phieu"] = dg[0], dg[1]
            if dg[2]:
                c.setdefault("can_cu", []).append(L("hop.dang_xem_lai_dong", f"Đang xem lại: {h['tieu_de']}", tieu_de=h["tieu_de"]))
                continue
        h["_ch"] = c["ma"]
        hop = c.setdefault("hop", [])
        if ca_nhan.get(h["ma_mau"]) == "chua_dung":
            h["_chua_dung"] = True
            hop.append(h)
            continue
        i = next((k for k, x in enumerate(hop) if x.get("_chua_dung")), len(hop))
        hop.insert(min(2, i), h)
        c.setdefault("can_cu", []).extend(h["can_cu"])


# ------------------------------------------------------------------ hỏi đáp
def _co(t: str, ds: list[str]) -> bool:
    """Khớp theo ranh giới âm tiết cả hai đầu ("co thua" không khớp "có thuận", "tien" không khớp "tiếng")."""
    return any(re.search(r"(?<!\w)(?:" + m + r")(?!\w)", t) for m in ds)


def mang_hoi(t: str) -> str | None:
    """Câu hỏi (chữ đã bỏ dấu) về điều người dùng lo ở một mảng → mã mảng; câu hỏi vận hạn chung → "van_han"; không
    → None. Chỉ nhận khi có cả từ khoá mảng LẪN dấu hiệu lo / chọn thời điểm (câu "công việc năm sau thế nào" không vào)."""
    t = t or ""
    if _co(t, kb.van_han()):
        return "van_han"
    if not _co(t, kb.hoi_lo()):
        return None
    for m, ds in kb.hoi_tu_khoa().items():
        if _co(t, ds):
            return m
    return None


# Dấu hiệu LO RÕ (câu hỏi về rủi ro, không phải chọn thời điểm thuận): lời năm nên chú ý được đưa lên đoạn mở đầu.
LO_RO = [r"can than", r"chu y", r"de y", r"co bi", r"(?<!\w)bi (lua|kien|mat|sa thai|duoi|phat|tai nan|hai|lat|phan boi|thua)",
         r"co (mat|gap|thua|do vo|pha san|vo no)", r"(?<!\w)xau(?!\w)", r"(?<!\w)xui", r"rui ro", r"nguy hiem", r"pha san",
         r"do vo", r"vo no", r"thua lo", r"lo von", r"mat (tien|viec)", r"tai nan", r"lua dao", r"(?<!\w)kien(?!\w)",
         r"van han", r"han nam", r"(?<!\w)(so|lo) (bi|mat|gap|vo|pha|thua)"]


def lo_ro(t: str) -> bool:
    return _co(t or "", LO_RO)


def tu_bao_cao(chuong_ds: list[dict] | None, mang: str, nam_hien_tai: int) -> list[dict] | None:
    """Năm nên chú ý của mảng ĐỌC LẠI từ hộp "Năm nên chú ý …" của báo cáo đã dựng (một bộ tính với báo cáo — hỏi đáp
    nói đúng các năm của báo cáo). Báo cáo không có hộp của mảng → None (nơi gọi tự tính bằng cùng hàm)."""
    h = tim_hop(chuong_ds or [], mang)
    if not h:
        return None
    nam = (h.get("nam_theo_mang") or {}).get(mang) or []
    theo = (h.get("can_cu_theo_nam") or {}).get(mang) or []
    return [{"nam": n, "hien_tai": n == nam_hien_tai, "mang": mang,
             "can_cu": list(dict.fromkeys(c for y in theo if y["nam"] == n for c in y["can_cu"]))} for n in nam]


NOI_CHAC = [r"chac chan", r"cho (toi|em|minh) biet chac", r"biet chac", r"ngay cu the", r"noi chac"]


def noi_chac(t: str) -> bool:
    return _co(t or "", NOI_CHAC)


def doan_mang(mang: str, ds: list[dict], mon_ten: str | None = None) -> str:
    """Đoạn trả lời câu hỏi về một mảng: năm nên chú ý (hoặc "không có năm nổi riêng") + việc + ranh giới."""
    if ds:
        s = cau_mang(mang, ds)
    else:
        s = kb.mau("khong_nam").format(mang=kb.ten(mang))
        if kb.viec(mang):
            s += L("chu_y.viec_nen_giu", " Việc nên giữ: {viec}.", viec=kb.viec(mang))
    if mon_ten:
        s = f"{mon_ten}, {s[:1].lower()}{s[1:]}"
    return f"{s} {kb.ranh_gioi(mang)}".strip()


def muc_hoi(mang: str, ds: list[dict], mon_ten: str | None = None, chac: bool = False,
            nam_hoi: list[int] | None = None) -> dict:
    """Mục `ghi_chu` (ma `chu_y_nam`) cho gói bằng chứng hỏi đáp. `cau_nam` = câu năm + ranh giới (đoạn mở đầu nói
    thẳng). Câu hỏi nêu năm (`nam_hoi`) → câu đầu nói ĐÚNG năm đó (có trong các năm nên chú ý hay không), các năm khác
    nêu sau."""
    if nam_hoi:
        dung = [x for x in ds if x["nam"] in nam_hoi]
        khac = [x["nam"] for x in ds if x["nam"] not in nam_hoi][:TOI_DA_NAM]
        if dung:
            dau = cau_mang(mang, dung)
        else:
            dau = kb.mau("nam_khong").format(nam=_noi(nam_hoi), mang=kb.ten(mang), viec=kb.viec(mang))
        cau_nam = f"{dau} {kb.ranh_gioi(mang)}"
        nd = f"{mon_ten + ', ' + dau[:1].lower() + dau[1:] if mon_ten else dau}" + (
            f" {kb.mau('nam_khac').format(nam=_noi(khac), mang=kb.ten(mang))}" if khac else "") + f" {kb.ranh_gioi(mang)}"
        ds_cu = dung + [x for x in ds if x["nam"] in khac]
    else:
        nd = doan_mang(mang, ds, mon_ten)
        cau_nam = f"{cau_mang(mang, ds)} {kb.ranh_gioi(mang)}".strip() if ds else ""
        ds_cu = ds[:TOI_DA_NAM]
    if chac:
        nd = f"{kb.mau('khong_noi_chac')} {nd}"
    rg = kb.ranh_gioi(mang)
    # câu cho đoạn mở đầu của câu LO (không kèm ranh giới — đoạn mở đầu đặt ranh giới ở cuối); không có năm nào → câu
    # "mười năm tới không có năm nào nổi riêng về …" + việc nên giữ (vẫn trả lời đúng mảng được hỏi)
    rieng = cau_nam or doan_mang(mang, [])
    rieng = rieng[: -len(rg)].strip() if rg and rieng.endswith(rg) else rieng
    return {"loai": "ghi_chu", "ma": "chu_y_nam", "mang": mang, "cac_nam": [x["nam"] for x in ds_cu],
            "cau_nam": cau_nam, "cau_nam_rieng": rieng,
            "ranh_gioi": rg, "noi_dung": nd, "can_cu": list(dict.fromkeys(c for x in ds_cu for c in x["can_cu"])),
            **kb.meta()}


def doan_van_han(theo_mang: dict[str, list[dict]], nam_xem: list[int]) -> str:
    """Câu hỏi vận hạn chung: các mảng có năm nên chú ý trong `nam_xem` (năm nay, năm sau) — tối đa 3 mảng."""
    co = [(m, [x for x in ds if x["nam"] in nam_xem]) for m, ds in theo_mang.items()]
    co = [(m, ds) for m, ds in co if ds][:3]
    if not co:
        return kb.mau("van_han_khong")
    return kb.mau("van_han_chung").format(ds=" ".join(f"{cau_mang(m, ds)} {kb.ranh_gioi(m)}".strip() for m, ds in co))


def muc_van_han(theo_mang: dict[str, list[dict]], nam_xem: list[int], chac: bool = False) -> dict:
    nd = doan_van_han(theo_mang, nam_xem)
    if chac:
        nd = f"{kb.mau('khong_noi_chac')} {nd}"
    ds = [x for v in theo_mang.values() for x in v if x["nam"] in nam_xem]
    return {"loai": "ghi_chu", "ma": "chu_y_nam", "mang": "van_han", "cac_nam": sorted({x["nam"] for x in ds}),
            "cau_nam": "", "noi_dung": nd, "can_cu": [c for x in ds for c in x["can_cu"]], **kb.meta()}


def phongthuy_doan_hoi(mang: str, tu_nam: int, huong_cua: str | None = None, so_nam: int = 3) -> str:
    """Hỏi đáp Phong thuỷ — câu về điều người dùng lo ở một mảng. Mảng có sao lưu niên KB (7 tiền bạc, 3 giấy tờ, 5 nhà
    cửa): biết hướng cửa chính (hồ sơ nhà) → năm sao đó tới phía cửa (cùng hàm báo cáo Nhà của bạn); chưa biết → phía sao
    đó bay tới từng năm để người hỏi tự đối chiếu. Mảng khác → phong thuỷ nhà không chỉ ra năm riêng, nêu việc nên giữ."""
    from app.calc import huyen_khong as hk  # noqa: PLC0415
    sao = kb.theo_mon(mang, "phongthuy").get("sao") or {}
    ten_m = kb.ten(mang)
    if not sao:
        s = L("hoi.pt.cy.khong_nam", "Phong thuỷ nhà không chỉ ra năm riêng cho {m}. Việc nên giữ: {v}.", m=ten_m, v=kb.viec(mang))
        return f"{s} {kb.ranh_gioi(mang)}"
    if huong_cua:
        q = next((k for k, v in hk.QUAI.items() if v[1] == huong_cua), None)
        if q:
            hc = _ten.ten("huong", huong_cua) if _ten.muc("huong", huong_cua) else huong_cua
            return doan_mang(mang, phongthuy_nam(q, tu_nam, mang, SO_NAM, L("hoi.pt.cy.noi", "cửa chính ({h})", h=hc)),
                             L("hoi.pt.cy.theo_nha", "Theo nhà bạn đã lưu (cửa chính phía {h})", h=hc))
    so = int(next(iter(sao)))
    nam_phia = []
    for n in range(tu_nam, tu_nam + so_nam):
        q = next((k for k, v in hk.luu_nien(n)["cung"].items() if v == so), None)
        if q and q in hk.QUAI:
            h = hk.QUAI[q][1]
            nam_phia.append(L("hoi.pt.cy.nam_phia", "năm {n} phía {h}", n=n, h=_ten.ten("huong", h) if _ten.muc("huong", h) else h))
    sao_ten = sao[str(so)].split(' bay tới')[0]
    if " reaches" in sao_ten:                     # bản phủ tiếng Anh của câu sao: "star 7 (Seven Red) reaches …"
        sao_ten = sao_ten.split(" reaches")[0]
    s = L("hoi.pt.cy.theo_hk", "Theo Huyền Không, {sao} bay tới {ds}. Năm sao này tới đúng phía cửa chính nhà bạn thì năm đó "
          "nên chú ý {m} hơn: {v}. Lưu hồ sơ nhà (hướng cửa) để xem đúng năm cho nhà bạn.", sao=sao_ten,
          ds=L("hoi.pt.noi", ", ").join(nam_phia), m=ten_m, v=kb.viec(mang))
    return f"{s} {kb.ranh_gioi(mang)}"


def kinhdich_khung() -> str:
    """Câu khung mở đầu cho câu lo ở Kinh Dịch (KB `mau.kinhdich_khung`)."""
    return kb.mau("kinhdich_khung")


def kinhdich_doan_hoi(mang: str) -> str:
    """Hỏi đáp Kinh Dịch — quẻ đọc cho việc đang hỏi, không chấm riêng từng năm, không trả lời có / không: câu khung +
    việc nên giữ + ranh giới."""
    return L("hoi.kd.cy.doan", "{khung} Điều nên giữ về {ten}: {viec}. {ranh}", khung=kinhdich_khung(), ten=kb.ten(mang),
             viec=kb.viec(mang), ranh=kb.ranh_gioi(mang))


MANG_VAN_HAN = ("tien_bac", "cong_viec", "tinh_cam", "di_lai", "giay_to", "nha_cua", "ban_be", "gia_dao")


# Review 2026-11-14 (chủ dự án quyết): MỌI loại câu còn bị chặn kèm 1–2 câu "nên chú ý… / nên làm…" đúng loại — dịu, không
# phán, không phải lời khuyên chuyên môn. Bản Việt: chữ ở đây (mặc định của `L`); bản Anh: `kb/data/en/loi_khuon.json`
# mã `tu_choi.goi_y.*`. Nhóm nhận bằng luật cố định trên câu đã bỏ dấu (Việt) hoặc câu tiếng Anh thường hoá.
_GOI_Y_VI = {
    "thai": "Nên theo lịch khám thai và siêu âm ở cơ sở y tế — lá số hay con số không đoán được giới tính hay sức khoẻ của thai. Nếu "
            "muốn, bạn có thể hỏi về mảng con cái, gia đình của chính mình.",
    "thuoc_mo": "Đừng tự dừng hay đổi thuốc, cũng đừng quyết chuyện mổ theo lá số hay con số; hãy hỏi bác sĩ đang điều trị trước khi "
                "quyết. Nếu muốn, bạn có thể hỏi về nhịp nghỉ ngơi và năm nên chú ý sức khoẻ của mình.",
    "nguoi_than_benh": "Nên hỏi thẳng bác sĩ điều trị về tình trạng và những việc gia đình cần chuẩn bị, và dành thời gian "
                       "ở bên người thân lúc này.",
    "tuoi_tho": "Thay vì hỏi tuổi thọ, nên khám sức khoẻ tổng quát định kỳ mỗi năm và xem mục \"năm nên chú ý sức khoẻ\" "
                "trong bài đọc của bạn để sắp lịch khám.",
    "yem": "Không có cách nào tác động lên người khác bằng bùa hay lá số. Nếu đang có mâu thuẫn, nên nói chuyện thẳng, nhờ "
           "người trung gian, hoặc hỏi luật sư khi có thiệt hại.",
    "nguoi_khac": "Bạn có thể hỏi về gương mặt, lá số của chính mình; xem cho người khác thì nên để chính họ đồng ý và tự nhập.",
    "xep_hang": "Không so lòng người bằng lá số hay con số. Nên đối soát sổ sách định kỳ, tách quyền chi tiền và ghi thoả thuận bằng "
                "văn bản — cách này giữ được tiền và giữ được người.",
    "tuyen_dung": "Khi tuyển hay giữ người, nên phỏng vấn kỹ, cho thử việc, ký hợp đồng rõ ràng và hỏi người từng làm cùng "
                  "họ — công bằng cho người ứng tuyển và chắc hơn cho bạn.",
    "dau_tu": "Nên giữ một khoản tiền dự phòng và không dồn hết vào một kênh; đây không phải lời khuyên đầu tư. Bạn có thể "
              "xem năm nên chú ý tiền bạc trong bài đọc của mình.",
    "so_con_ten": "Bạn có thể hỏi về mảng con cái hay tình cảm của chính mình — lá số nói được nhịp và việc nên chuẩn bị, "
                  "không nói con số hay cái tên.",
    "the_thao": "Nên coi kết quả trận đấu, bầu cử là chuyện để xem cho vui, không đặt tiền vào đó.",
}
_GOI_Y_NHOM_VI = [
    ("thai", r"thai nhi|co thai|co bau|mang thai|mang bau|dinh bau|trong bung|trai hay (con )?gai|gai hay (con )?trai|sieu am"),
    ("thuoc_mo", r"(bo|ngung|dung|doi) (uong )?thuoc|thuoc nam|hoa tri|xa tri|phau thuat|(nen|co nen) mo|mo hay|chay than"),
    ("nguoi_than_benh", r"(bo|me|ba|ong|cha|chong|vo|con|chau|anh|chi|em)( noi| ngoai| gai| trai)? (toi|em|minh|nha toi)(?!\w)"
                        r".{0,40}(qua khoi|song duoc|con bao lau|song them|di (khong|ko)|mat (khong|ko))"),
    ("tuoi_tho", r"chet|qua doi|tu vong|song (duoc|den|them|bao)|tho (duoc|bao|may|den)|tuoi tho|con bao lau|qua khoi|bat dac"),
    ("yem", r"yem bua|bo bua|bua ngai|lam hai|tram yem"),
    ("nguoi_khac", r"(xem|doc|soi) (tuong|mat|la so|so) (cua |cho |giup )?(nguoi|anh ay|co ay|chong|vo|sep|dong nghiep|ban)"),
    ("xep_hang", r"ai trung thuc|ai (gian|lua|phan boi|dang tin)|nhan vien nao .{0,20}(trung thuc|gian|dang tin)"),
    ("tuyen_dung", r"tuyen (ung vien|nhan vien|nguoi|ke toan|nhan su|thu ky)|ung vien|sa thai|(chon|giu|loai) nhan vien|nen tuyen"
                   r"|tuoi nao .{0,25}(lam|vao lam) (nhan vien|ke toan|thu ky|tro ly|quan ly)"),
    ("dau_tu", r"gia (vang|dat|nha|xang|dola|do la|usd|bitcoin|coin)|chung khoan|co phieu|tien ao|bitcoin|crypto|ma (co phieu|nao tang)"),
    ("so_con_ten", r"may (dua )?con|bao nhieu (dua )?con|ten (gi|la gi)|(ten|chu cai) (cua )?(chong|vo|nguoi yeu) (tuong lai|sau nay)"),
    ("the_thao", r"doi nao thang|ai (se )?(thang|dac cu|trung cu)|ty so|ket qua tran"),
]
_GOI_Y_NHOM_EN = [
    ("thai", r"pregnan\w*|baby s? (?:gender|sex)|boy or (?:a )?girl|girl or (?:a )?boy|unborn|fetus|foetus|miscarr\w*|ivf|iui"),
    ("thuoc_mo", r"(?:stop|quit|skip|come off|go off|cut down|ditch) .{0,25}(?:meds|medication|medicine|pills|insulin|chemo\w*|treatment|"
                 r"antidepressants?)|surgery|operation|chemo\w*|dialysis|transplant"),
    ("nguoi_than_benh", r"(?:my (?:\w+ ){0,2}(?:mother|mom|mum|father|dad|husband|wife|son|daughter|grandma|grandpa|brother|sister)|he|she) "
                        r".{0,30}(?:recover|survive|pull through|make it|have left|how long)"),
    ("tuoi_tho", r"die|dies|death|dying|pass away|lifespan|life expectancy|how long .{0,20}live|live (?:to|past|until)"),
    ("yem", r"curse|hex|jinx|spell|black magic"),
    ("nguoi_khac", r"secretly|without (?:telling|asking)|behind (?:his|her|their) back|(?:his|her|their) (?:bazi|chart|face)"),
    ("xep_hang", r"(?:which|who) .{0,30}(?:honest|trustworthy|loyal|liar|lying|steal\w*|cheat\w*)|most honest|least honest"),
    ("tuyen_dung", r"hire|hiring|fire|firing|recruit\w*|candidates?|applicants?|employees?|staff|interns?|nanny|maids?|shortlist|"
                   r"tenants?|screen\w*"),
    ("dau_tu", r"gold|stocks?|shares?|crypto|bitcoin|btc|coins?|forex|property prices?|house prices?"),
    ("so_con_ten", r"how many (?:children|kids|babies|sons|daughters)|name|initials?|first letter"),
    ("the_thao", r"team|match|election|world cup|league|derby|race"),
]


_GOI_Y_THU_TU = ("thai", "thuoc_mo", "nguoi_than_benh", "tuoi_tho", "yem", "xep_hang", "tuyen_dung", "nguoi_khac", "dau_tu",
                 "so_con_ten", "the_thao")


def goi_y_tu_choi(raw: str, loai: str | None) -> str:
    """Câu bị từ chối vẫn kèm một lời nhắc "nên chú ý… / nên làm…" đúng loại: may rủi → giữ tiền; tai nạn chết / nặng → an
    toàn đi lại; tuyển / sa thải theo lá số → phỏng vấn, thử việc, hợp đồng, tham chiếu; xếp hạng ai trung thực → đối soát,
    tách quyền chi tiền, thoả thuận văn bản; tuổi thọ → khám định kỳ; bỏ thuốc / mổ → hỏi bác sĩ; thai → lịch khám thai;
    giá vàng, cổ phiếu → tiền dự phòng (không phải lời khuyên đầu tư); số con, tên người sẽ gặp → hỏi mảng của chính mình;
    yểm người khác / xem người khác → hỏi về chính mình. Không nhận ra nhóm → rỗng (giữ lời từ chối của mảng)."""
    from app.luangiai import an_toan as _at  # noqa: PLC0415
    from app.luangiai.hoi import chuan_hoa  # noqa: PLC0415
    t = chuan_hoa(raw or "")
    if loai == "may_rui" or re.search(r"(xo so|ve so|lo de|danh de|so de|ca do|ca cuoc|danh lo|so lo)", t):
        return kb.mau("may_rui")
    en = _at._la_en(raw or "")
    k = _at._sua_en(_at._hai_ban(raw or "")[1]) if en else t
    ds = dict(_GOI_Y_NHOM_EN if en else _GOI_Y_NHOM_VI)
    for nhom in _GOI_Y_THU_TU:
        mau = ds[nhom]
        if nhom == "tuoi_tho" and re.search(r"(?<!\w)(?:tai nan|accident|crash)(?!\w)", k):
            return kb.mau("tai_nan_nang")      # "năm nào gặp tai nạn chết" → thói quen đi lại an toàn
        if re.search(r"(?<!\w)(?:" + mau + r")(?!\w)", k):
            if nhom == "tuyen_dung" and loai not in ("tuyen_dung", "ngoai_pham_vi", None):
                continue
            return L(f"tu_choi.goi_y.{nhom}", _GOI_Y_VI[nhom])
    if not en and re.search(r"tai nan", t):
        return kb.mau("tai_nan_nang")
    if en and re.search(r"(?<!\w)(?:accident|crash)(?!\w)", k):
        return kb.mau("tai_nan_nang")
    if loai == "tuyen_dung":
        return L("tu_choi.goi_y.tuyen_dung", _GOI_Y_VI["tuyen_dung"])
    return ""
