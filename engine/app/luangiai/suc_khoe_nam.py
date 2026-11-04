# -*- coding: utf-8 -*-
"""SK-1 (2026-11-04, chủ dự án duyệt) — gợi ý sức khoẻ THEO THỜI ĐIỂM cho mọi mảng (RULES, tất định, không LLM).

Chính sách mới: không nêu tên bệnh → gợi HỆ CƠ QUAN sách xưa gắn với hành / sao + việc đi khám cụ thể; được (và nên)
nêu năm / giai đoạn chỉ báo sức khoẻ của lá số được kích hoạt, nói bằng lời PHÒNG NGỪA ("Năm 2028 nên chú ý sức khoẻ
bản thân hơn, nhất là đường hô hấp; sắp xếp đi khám hô hấp, phổi vào đầu năm.") — không bao giờ "sẽ ốm / sẽ bệnh".
Không đổi MỨC của chương nào: đây là lời / hộp đọc thêm. Mọi phép tính dùng lại CALC có sẵn (một bộ tính):
- Tử vi: `calc.tuvi_phi_hoa.phi_tu_can` (tứ hoá năm / đại hạn — cùng hàm dòng 10 năm), cung lưu niên theo chi năm,
  đại hạn theo tuổi mụ, sao lưu năm đang xem (`luangiai.tuvi_sao_luu.doc`).
- Bát tự: can chi năm theo Lập xuân (`calc.battu_mo_rong.luu_nien`, cùng dòng 10 năm), hành của can / chi (`calc.battu`),
  tỉ lệ ngũ hành đã chấm (`battu_doi_song.phan_tich`).
- Phong thuỷ: sao lưu niên Huyền Không (`calc.huyen_khong.luu_nien`) tới phía phòng ngủ / phía toạ.
- Thần số: năm cá nhân (KB `thanso_depth.nam_ca_nhan` có chủ đề nghỉ ngơi / chăm sức khoẻ).
Lời ở KB `suc_khoe_kb.json` (một nguồn)."""
from __future__ import annotations

import re

from app.kb import suc_khoe_kb as kb

SO_NAM = 10
TOI_DA_NAM = 3            # hộp / câu trả lời nêu tối đa 3 năm gần nhất (đủ để sắp lịch khám, không dài như danh sách lo)
CUNG_SK = "Tật Ách"
CUNG_XUNG_SK = "Phụ Mẫu"   # cung đối của Tật Ách (Kỵ ở đây chiếu sang Tật Ách)
_DIEM = {"ky_nhap": 2, "ky_chieu": 1, "luu_nien": 1, "dai_han": 1, "ky_dai_han": 1, "sao_luu": 1}
NGUONG_TUVI = 2
_LOP_NAM = {"ky_nhap", "ky_chieu", "luu_nien", "sao_luu"}     # lý do của riêng một năm (không phải lớp mười năm)


# ------------------------------------------------------------------ câu
def _tron(he: dict | None) -> dict | None:
    return he if he and he.get("he") and he.get("kham") else None


def cau_nam(nam: list[int] | int, he: dict | None, hien_tai: bool = False) -> str:
    """"Năm 2028 nên chú ý sức khoẻ bản thân hơn, nhất là {hệ}; sắp xếp đi {khám} vào đầu năm." (nhiều năm: "Năm 2028
    và 2031 …"). Không có hệ → câu khám tổng quát. `hien_tai` = năm đang đi (đầu năm đã qua → "sắp xếp … sớm")."""
    ds = [nam] if isinstance(nam, int) else list(nam)
    n = ", ".join(str(x) for x in ds[:-1]) + (f" và {ds[-1]}" if len(ds) > 1 else str(ds[-1]))
    he = _tron(he)
    if he:
        return kb.mau("nam_nay" if hien_tai else "nam").format(nam=n, he=he["he"], kham=he["kham"])
    return kb.mau("nam_nay_chung" if hien_tai else "nam_chung").format(nam=n)


def cau_cac_nam(ds: list[dict], toi_da: int = TOI_DA_NAM) -> str:
    """Gộp năm cùng hệ thành một câu: [{nam, he, hien_tai?}] → "Năm 2028 nên … Năm 2031 nên …" (năm đang đi riêng câu)."""
    nhom: dict[tuple, list] = {}
    for x in ds[:toi_da]:
        k = ((x.get("he") or {}).get("he") or "", bool(x.get("hien_tai")))
        nhom.setdefault(k, [x.get("he"), []])[1].append(x["nam"])
    return " ".join(cau_nam(nams, he, k[1]) for k, (he, nams) in nhom.items())


def mien_tru() -> str:
    return kb.mien_tru()


def kiem(van: str) -> list[str]:
    """Cụm cấm sức khoẻ (tên bệnh, "sẽ ốm", sống chết…) có trong `van` — rỗng = đạt."""
    t = (van or "").lower()
    return [c for c in kb.cum_cam() if re.search(r"(?<!\w)" + re.escape(c.lower()) + r"(?!\w)", t)]


# ------------------------------------------------------------------ Tử vi
def tuvi_he(ls: dict) -> dict | None:
    """Hệ cơ quan lá số nhắc: chính tinh ở Tật Ách (đầu tiên có trong KB) → chính tinh cung đối (Tật Ách vô chính diệu
    mượn sao xung chiếu) → chính tinh Mệnh."""
    theo = {c["ten"]: c for c in ls["cung"]}
    for ten in (CUNG_SK, CUNG_XUNG_SK, "Mệnh"):
        for s in (theo.get(ten) or {}).get("chinh_tinh") or []:
            if (h := kb.he_sao(s["ten"])):
                return {**h, "sao": s["ten"], "cung": ten}
    return None


def tuvi_nam(ls: dict, nam_am_xem: int, nam_am_sinh: int, so_nam: int = SO_NAM,
             sao_luu_ta: list[str] | None = None, them: dict[int, list[tuple[str, str]]] | None = None) -> list[dict]:
    """Năm âm lịch trong `so_nam` năm tới mà chỉ báo sức khoẻ của lá số được kích hoạt (điểm ≥ NGUONG_TUVI):
    Hoá Kỵ năm nhập Tật Ách (2) · Kỵ năm ở Phụ Mẫu chiếu Tật Ách (1) · cung lưu niên là Tật Ách (1) · đại hạn đang đi
    cung Tật Ách (1) · Hoá Kỵ của can đại hạn nhập Tật Ách (1) · sao lưu khó ở Tật Ách năm đang xem (1, `sao_luu_ta`
    = tên các sao đó) · TV-YBS: lý do thêm của năm từ KB ý bổ sung (`them` = {năm: [(mã lý do, căn cứ)]}, mỗi lý do 1
    điểm, là lý do của riêng năm — vd cung năm có Kình Dương / Đà La). → [{nam, tuoi, diem, ly_do: [mã], can_cu: [câu],
    he}] theo năm tăng dần."""
    from app.calc import lunar  # noqa: PLC0415
    from app.calc import tuvi_phi_hoa as phi  # noqa: PLC0415
    he0 = tuvi_he(ls)
    ra = []
    for k in range(so_nam):
        nam = nam_am_xem + k
        can, chi = lunar.can_chi_nam(nam)
        tuoi = nam - nam_am_sinh + 1
        ky = next(x for x in phi.phi_tu_can(can, ls["cung"]) if x["hoa"] == "Kỵ")
        ly, cu = [], []
        if ky["den_cung"] == CUNG_SK:
            ly.append("ky_nhap")
            cu.append(f"Hoá Kỵ năm {can} {chi} ({ky['sao']}) nhập cung Tật Ách")
        elif ky["xung_cung"] == CUNG_SK:
            ly.append("ky_chieu")
            cu.append(f"Hoá Kỵ năm {can} {chi} ({ky['sao']}) ở cung {ky['den_cung']}, chiếu sang Tật Ách")
        c_ln = next(c for c in ls["cung"] if c["chi"] == chi)
        if c_ln["ten"] == CUNG_SK:
            ly.append("luu_nien")
            cu.append(f"Cung lưu niên năm {nam} ({chi}) là Tật Ách")
        dh = next((c for c in ls["cung"] if c["dai_han"][0] <= tuoi <= c["dai_han"][1]), None)
        if dh:
            if dh["ten"] == CUNG_SK:
                ly.append("dai_han")
                cu.append(f"Đại hạn {dh['dai_han'][0]}–{dh['dai_han'][1]} tuổi đi cung Tật Ách")
            if dh.get("can"):
                ky_dh = next(x for x in phi.phi_tu_can(dh["can"], ls["cung"]) if x["hoa"] == "Kỵ")
                if ky_dh["den_cung"] == CUNG_SK:
                    ly.append("ky_dai_han")
                    cu.append(f"Hoá Kỵ của can đại hạn {dh['can']} ({ky_dh['sao']}) nhập Tật Ách")
        if k == 0 and sao_luu_ta:
            ly.append("sao_luu")
            cu.append(f"Sao lưu năm {nam} ở Tật Ách: {', '.join(sao_luu_ta)}")
        for ma, cau in (them or {}).get(nam, []):
            if ma not in ly:
                ly.append(ma)
                cu.append(cau)
        diem = sum(_DIEM.get(x, 1) for x in ly)
        # năm chỉ có lớp mười năm (đại hạn) không thành "năm" riêng — lớp đó nói ở câu giai đoạn (`tuvi_giai_doan`)
        if diem < NGUONG_TUVI or not (set(ly) & _LOP_NAM or any(x not in _DIEM for x in ly)):
            continue
        # hệ: Kỵ năm nhập Tật Ách mang sao có phần cơ thể sách xưa ghi → hệ của sao đó; còn lại → hệ của lá số
        he = (kb.he_sao(ky["sao"]) if "ky_nhap" in ly else None) or he0
        ra.append({"nam": nam, "tuoi": tuoi, "diem": diem, "ly_do": ly, "can_cu": cu, "he": he, "hien_tai": k == 0})
    return ra


def tuvi_giai_doan(ls: dict, nam_am_xem: int, nam_am_sinh: int, so_nam: int = SO_NAM) -> list[dict]:
    """Giai đoạn mười năm (đại hạn) chạm `so_nam` năm tới mà đi cung Tật Ách, hoặc Hoá Kỵ của can đại hạn nhập Tật Ách
    → [{tu, den, nam_tu, nam_den, ly_do, can_cu, he}]."""
    from app.calc import tuvi_phi_hoa as phi  # noqa: PLC0415
    he0 = tuvi_he(ls)
    t0, t1 = nam_am_xem - nam_am_sinh + 1, nam_am_xem - nam_am_sinh + so_nam
    ra = []
    for c in sorted(ls["cung"], key=lambda c: c["dai_han"][0]):
        tu, den = c["dai_han"]
        if den < t0 or tu > t1:
            continue
        ly, cu = [], []
        if c["ten"] == CUNG_SK:
            ly.append("dai_han")
            cu.append(f"Đại hạn {tu}–{den} tuổi đi cung Tật Ách")
        if c.get("can"):
            ky = next(x for x in phi.phi_tu_can(c["can"], ls["cung"]) if x["hoa"] == "Kỵ")
            if ky["den_cung"] == CUNG_SK:
                ly.append("ky_dai_han")
                cu.append(f"Hoá Kỵ của can đại hạn {c['can']} ({ky['sao']}) nhập Tật Ách")
        if ly:
            ra.append({"tu": tu, "den": den, "nam_tu": nam_am_sinh + tu - 1, "nam_den": nam_am_sinh + den - 1,
                       "ly_do": ly, "can_cu": cu, "he": he0})
    return ra


def cau_giai_doan(g: dict) -> str:
    he = _tron(g.get("he"))
    s = kb.mau("giai_doan").format(tu=g["tu"], den=g["den"], he=he["he"] if he else "sức khoẻ tổng quát")
    return s.replace(" tuổi", f" tuổi (khoảng {g['nam_tu']}–{g['nam_den']})", 1)


# ------------------------------------------------------------------ Bát tự
_KHAC = {"Mộc": "Kim", "Hỏa": "Thủy", "Thổ": "Mộc", "Kim": "Hỏa", "Thủy": "Thổ"}    # hành KHẮC hành khoá
_SINH = {"Mộc": "Thủy", "Hỏa": "Mộc", "Thổ": "Hỏa", "Kim": "Thổ", "Thủy": "Kim"}    # hành SINH hành khoá


def _ap_luc(h_nam: str, yeu: str) -> int:
    """+1 khi hành của can / chi năm khắc hành yếu; −1 khi sinh hoặc cùng hành (đỡ cho hành yếu); 0 còn lại."""
    return 1 if h_nam == _KHAC[yeu] else -1 if h_nam in (_SINH[yeu], yeu) else 0


def battu_nam(ty_le_hanh: dict[str, float], nam_muc: dict[int, str], nam0: int, so_nam: int = SO_NAM,
              nguong_dam: float = 0.30) -> list[dict]:
    """Năm (Lập xuân) trong `so_nam` năm tới mà năm "đè" lên phần yếu hoặc dồn thêm phần thừa của tứ trụ:
    - hành yếu nhất (tỉ lệ thấp nhất) bị khắc: áp lực của can + chi năm (`_ap_luc`) = 2, hoặc = 1 khi dòng 10 năm đã
      chấm năm đó "Cần lưu ý" (`nam_muc`, một bộ chấm với chương Vận hạn);
    - hành thừa (≥ `nguong_dam`) được dồn thêm: cả can lẫn chi của năm cùng hành đó.
    → [{nam, ly_do, can_cu, he}] (hệ = hệ cơ quan của hành bị đè / hành thừa)."""
    from app.calc import battu  # noqa: PLC0415
    thu_tu = ("Mộc", "Hỏa", "Thổ", "Kim", "Thủy")
    yeu = min(thu_tu, key=lambda h: (ty_le_hanh.get(h, 0), thu_tu.index(h)))
    lon = max(thu_tu, key=lambda h: (ty_le_hanh.get(h, 0), -thu_tu.index(h)))
    k_yeu = _KHAC[yeu]
    ra = []
    for k in range(so_nam):
        nam = nam0 + k
        i_can, i_chi = (nam - 4) % 10, (nam - 4) % 12
        can, chi = battu.CAN[i_can], battu.CHI[i_chi]
        hc, hh = battu.CAN_NH[i_can], battu.CHI_NH[i_chi]
        ap = _ap_luc(hc, yeu) + _ap_luc(hh, yeu)
        if ap >= 2 or (ap == 1 and nam_muc.get(nam) == "can_chu_dong"):
            ra.append({"nam": nam, "ly_do": ["khac_yeu"], "hien_tai": k == 0, "he": kb.he_hanh(yeu),
                       "can_cu": [f"Năm {nam} {can} {chi} ({hc}/{hh}): {k_yeu} khắc {yeu} — hành yếu nhất của tứ trụ "
                                  f"({round(ty_le_hanh.get(yeu, 0) * 100)}%)"]})
        elif ty_le_hanh.get(lon, 0) >= nguong_dam and hc == lon and hh == lon:
            ra.append({"nam": nam, "ly_do": ["don_thua"], "hien_tai": k == 0, "he": kb.he_hanh(lon),
                       "can_cu": [f"Năm {nam} {can} {chi}: cả can lẫn chi là {lon}, dồn thêm hành đang thừa của tứ trụ "
                                  f"({round(ty_le_hanh[lon] * 100)}%)"]})
    return ra


# ------------------------------------------------------------------ Phong thuỷ
def phongthuy_nam(quai: str, tu_nam: int, so_nam: int = SO_NAM, noi: str = "phòng ngủ") -> list[dict]:
    """Năm (Lập xuân) sao lưu niên 2 (Nhị Hắc) hoặc 5 (Ngũ Hoàng) bay tới quái `quai` (phía phòng ngủ / phía toạ) —
    sách xưa gắn hai sao Thổ này với sức khoẻ người ở. → [{nam, sao, ly_do, can_cu, he}]."""
    from app.calc import huyen_khong as hk  # noqa: PLC0415
    ra = []
    for n in range(tu_nam, tu_nam + so_nam):
        so = hk.luu_nien(n)["cung"].get(quai)
        m = kb.sao_huyen_khong(so) if so in (2, 5) else None
        if not m:
            continue
        ra.append({"nam": n, "sao": so, "ly_do": [f"sao_{so}"], "hien_tai": n == tu_nam, "he": kb.he_hanh(m.get("hanh")),
                   "can_cu": [f"Lưu niên {n}: sao {so} ({m['ten']}) bay tới phía {noi} (quái {quai})"]})
    return ra


def phongthuy_doan_hoi(tu_nam: int, phuong_ngu: str | None = None, so_nam: int = 3) -> str:
    """Hỏi đáp Phong thuỷ — câu sức khoẻ. Biết phía phòng ngủ chính (hồ sơ nhà) → năm sao 2 / 5 tới đúng phía đó (cùng hàm
    chương "Năm nay" của báo cáo Nhà của bạn); chưa biết → phía sao 2 (Nhị Hắc) bay tới từng năm để người hỏi tự đối chiếu
    với phòng ngủ. Kèm câu không thay lời bác sĩ."""
    from app.calc import huyen_khong as hk  # noqa: PLC0415
    if phuong_ngu:
        q = next((k for k, v in hk.QUAI.items() if v[1] == phuong_ngu), None)
        if q:
            ds = phongthuy_nam(q, tu_nam, SO_NAM, noi=f"phòng ngủ chính ({phuong_ngu})")
            if ds:
                return (f"Theo nhà bạn đã lưu (phòng ngủ chính ở phía {phuong_ngu}): {cau_cac_nam(ds)} "
                        f"{mien_tru()}")
            return (f"Theo nhà bạn đã lưu, mười năm tới sao lưu niên sách xưa gắn với sức khoẻ không bay tới phía phòng ngủ "
                    f"chính ({phuong_ngu}). {kb.mau('khong_nam')} {mien_tru()}")
    nam_phia = []
    for n in range(tu_nam, tu_nam + so_nam):
        q = next((k for k, v in hk.luu_nien(n)["cung"].items() if v == 2), None)
        if q and q in hk.QUAI:
            nam_phia.append(f"năm {n} phía {hk.QUAI[q][1]}")
    he = _tron(kb.he_hanh("Thổ"))
    s = ("Theo Huyền Không, sao 2 (Nhị Hắc — sách xưa gắn với sức khoẻ người ở) bay tới " + ", ".join(nam_phia) + ". "
         "Năm sao này tới đúng phía phòng ngủ chính của bạn thì năm đó nên chú ý sức khoẻ bản thân hơn"
         + (f", nhất là {he['he']}; sắp xếp đi {he['kham']} vào đầu năm" if he else "")
         + ", giữ phòng thoáng, sạch, ít đồ đạc. Lưu hồ sơ nhà (vị trí phòng ngủ) để xem đúng năm cho nhà bạn.")
    return f"{s} {mien_tru()}"


# ------------------------------------------------------------------ Thần số
def thanso_nam(nam_ca_nhan_cua: dict[int, int], nam_hien_tai: int | None = None) -> list[dict]:
    """{năm dương: số năm cá nhân} → năm có chủ đề nghỉ ngơi / chăm sức khoẻ (KB `nam_ca_nhan`). Thần số không gắn hệ
    cơ quan → câu khám tổng quát."""
    ra = []
    for nam, so in sorted(nam_ca_nhan_cua.items()):
        m = kb.nam_ca_nhan(so)
        if m:
            ra.append({"nam": nam, "so": so, "ly_do": [f"nam_{so}"], "he": None, "hien_tai": nam == nam_hien_tai,
                       "can_cu": [f"Năm {nam} là năm cá nhân {so}: {m['ly_do']}"]})
    return ra


# ------------------------------------------------------------------ hỏi đáp: câu nêu tên bệnh
def doan_hoi_benh(t_khong_dau: str, he_la_so: dict | None = None) -> str:
    """Câu hỏi NÊU tên bệnh / bộ phận ("tôi có bị … không"): không xác nhận, không phủ nhận — nói hệ cơ quan liên quan
    (theo câu hỏi; không rõ thì theo lá số) + đi khám để bác sĩ kiểm tra. Không nhắc lại tên bệnh."""
    he = _tron(kb.he_cau_hoi(t_khong_dau))
    if he:
        return kb.mau("hoi_benh").format(he=he["he"], kham=he["kham"])
    he = _tron(he_la_so)
    if he:                     # câu không nêu bộ phận → chỉ nói phần cơ thể LÁ SỐ nhắc chăm sóc (không "bạn đang lo về …")
        return f"{kb.mau('hoi_benh_chung')} {kb.mau('he_chart').format(he=he['he'], kham=he['kham'])}"
    return kb.mau("hoi_benh_chung")


# ------------------------------------------------------------------ hộp báo cáo
TIEU_DE_HOP = "Năm nên chú ý sức khoẻ hơn"


def hop_nam(ds: list[dict], ma_mau: str, hop_fn, trong: float = 1.4,
            giai_doan: list[dict] | None = None) -> dict | None:
    """Hộp "thoi_diem" — "Năm nên chú ý sức khoẻ hơn" (≤ 3 năm gần nhất + giai đoạn mười năm nếu có + lời miễn trừ);
    không có gì → None (chương sức khoẻ vốn đã có lời khám định kỳ). `hop_fn(loai, tieu_de, noi_dung, can_cu, ma_mau,
    trong, **them)` = hàm dựng hộp của từng mảng (giữ khuôn hộp riêng). Hộp KHÔNG mang mức — không đổi mức chương."""
    gd = (giai_doan or [])[:1]
    if not ds and not gd:
        return None
    cau = ([cau_cac_nam(ds)] if ds else []) + [cau_giai_doan(g) for g in gd]
    cu = [c for x in ds[:TOI_DA_NAM] for c in x["can_cu"]] + [c for g in gd for c in g["can_cu"]]
    them = {"nam": ds[0]["nam"], "cac_nam": [x["nam"] for x in ds[:TOI_DA_NAM]]} if ds else {}
    return hop_fn("thoi_diem", TIEU_DE_HOP, f"{' '.join(cau)} {mien_tru()}", cu, ma_mau, trong, **them)


def ma_ly_do(x: dict) -> str:
    """Lý do mạnh nhất của một năm → phần cuối mã kiểm chứng (`ds.suc_khoe.nam.<lý do>`): mã theo LOẠI chỉ báo, không theo
    năm (phiếu "Đúng với mình" gom được giữa nhiều người)."""
    ly = x.get("ly_do") or ["chung"]
    return max(ly, key=lambda m: (_DIEM.get(m, 0), -ly.index(m)))
