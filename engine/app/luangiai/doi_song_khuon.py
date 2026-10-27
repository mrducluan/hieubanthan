# -*- coding: utf-8 -*-
"""KC-1 — Khuôn "bài đọc đời sống" dùng chung mọi mảng (`phien_ban = "doi_song_1"`, docs/LUAN-GIAI-DOI-SONG.md 2.3).

Một báo cáo = {phien_ban, cot_loi: [hộp], chuong: [{ma, tieu_de, muc|None, nhan_muc, tom_tat, hop, doan, can_cu, cau_tu_soi}],
ket}. Hộp = {loai ∈ cot_loi·diem_manh·luu_y·loi_khuyen·thoi_diem, tieu_de, noi_dung, huong_xu_ly?, can_cu?, ma_mau?, muc?}.
Thuật ngữ chỉ ở `can_cu` ("Vì sao nói vậy"); lớp đời thường (tiêu đề, tóm tắt, hộp, câu tự soi) phải sạch cụm giọng AI /
từ doạ — `kiem_giong_van` dùng chung cho test mọi mảng. `ma_mau` tất định dạng `ds.<mảng>.<chương>.<khoá>` để gắn kiểm
chứng "x% thấy đúng" (migration 0017 chấp nhận mọi mã `ds.*`).
"""
from __future__ import annotations

import re

PHIEN_BAN = "doi_song_1"
NHAN_MUC = {"thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần lưu ý"}
LOAI_HOP = ("cot_loi", "diem_manh", "luu_y", "loi_khuyen", "thoi_diem")
_MA = re.compile(r"[^a-z0-9_+-]")


def ma_mau(*phan: str) -> str:
    """`ds.<mảng>.<chương>.<khoá…>` — chữ thường không dấu, ≤ 60 ký tự, tất định."""
    from app.luangiai.hoi import chuan_hoa  # noqa: PLC0415
    sach = [_MA.sub("", chuan_hoa(str(p)).replace(" ", "_")) for p in phan if p is not None and str(p) != ""]
    ma = "ds." + ".".join(s for s in sach if s)
    return ma[:60].rstrip(".+-")


def hop(loai: str, tieu_de: str, noi_dung: str, *, huong_xu_ly: str | None = None, can_cu: list[str] | None = None,
        ma: str | None = None, muc: str | None = None, **them) -> dict:
    assert loai in LOAI_HOP, loai
    h = {"loai": loai, "tieu_de": tieu_de.strip(), "noi_dung": " ".join(noi_dung.split())}
    if loai == "luu_y":
        h["huong_xu_ly"] = (huong_xu_ly or "Chậm lại một nhịp, hỏi thêm một người có kinh nghiệm trước khi quyết.").strip()
    elif huong_xu_ly:
        h["huong_xu_ly"] = huong_xu_ly.strip()
    if can_cu:
        h["can_cu"] = [c for c in can_cu if c]
    if ma:
        h["ma_mau"] = ma
    if muc:
        h["muc"] = muc
    h.update({k: v for k, v in them.items() if v is not None})
    return h


def chuong(ma: str, tieu_de: str, doan: list[str], *, hop: list[dict] | None = None, muc: str | None = None,
           tom_tat: str | None = None, can_cu: list[str] | None = None, cau_tu_soi: str | None = None, **them) -> dict:
    c = {"ma": ma, "tieu_de": tieu_de, "hop": hop or [], "doan": doan, "can_cu": can_cu or []}
    # Khoá trống không ghi (báo cáo cũ của thần số kiểm "None" không lọt ra lời văn); web coi thiếu = None.
    for k, v in (("muc", muc), ("nhan_muc", NHAN_MUC.get(muc) if muc else None), ("tom_tat", tom_tat), ("cau_tu_soi", cau_tu_soi)):
        if v is not None:
            c[k] = v
    c.update(them)
    return c


def gan_ma_mau(c: dict, mo_dun: str, *tien_to: str) -> dict:
    """HỌC-ĐS: gắn `ma_mau` tất định cho mọi hộp của một chương / một gói đọc chưa có mã —
    `ds.<mảng>.<chương|tiền tố>.<loại hộp>.<tiêu đề rút gọn>`; trùng trong cùng nhóm thì thêm `+2`, `+3`…"""
    da: dict[str, int] = {}
    goc = tien_to or (c.get("ma"),)
    for h in c.get("hop", []):
        if not h.get("ma_mau"):
            h["ma_mau"] = ma_mau(mo_dun, *goc, h["loai"], h["tieu_de"])
        n = da.get(h["ma_mau"], 0) + 1
        da[h["ma_mau"]] = n
        if n > 1:
            h["ma_mau"] = (h["ma_mau"][:57] + f"+{n}")[:60]
    return c


NGUONG_PHIEU, NGUONG_XEM_LAI, TI_LE_XEM_LAI = 30, 100, 0.40


def ap_hoc(bc: dict, trong_so: dict | None, ca_nhan: dict | None) -> dict:
    """Tầng HỌC dùng chung (ranh giới LG-ĐS): `trong_so` = bảng tỉ lệ công khai theo mã (≥ 30 phiếu → gắn `ty_le_dung`,
    `so_phieu`; ≥ 100 phiếu và < 40% đúng → hộp rời lớp đời thường, ghi một dòng "Đang xem lại" vào `can_cu`);
    `ca_nhan` = phiếu của chính người xem ("chua_dung" → xếp cuối). Không sinh câu mới, không sửa KB. Nhận cả báo cáo
    nhiều chương (`chuong[]`) lẫn một gói đọc (`hop` + `can_cu`). Trả về chính `bc` (đã sửa tại chỗ)."""
    trong_so, ca_nhan = trong_so or {}, ca_nhan or {}
    if not trong_so and not ca_nhan:
        return bc
    xem_lai: set[str] = set()

    def _nhom(g: dict):
        giu, cuoi = [], []
        for h in g.get("hop", []):
            m = h.get("ma_mau")
            p = trong_so.get(m) if m else None
            if p:
                dung, chua = int(p.get("dung", 0)), int(p.get("chua_dung", 0))
                tong = dung + chua
                if tong >= NGUONG_PHIEU:
                    h["ty_le_dung"], h["so_phieu"] = round(dung / tong, 2), tong
                    if tong >= NGUONG_XEM_LAI and dung / tong < TI_LE_XEM_LAI:
                        xem_lai.add(m)
                        dong = f"Đang xem lại: {h['tieu_de']}"
                        cc = g.setdefault("can_cu", [])
                        cc.append({"tieu_de": "Đang xem lại", "noi_dung": h["noi_dung"]} if (cc and isinstance(cc[0], dict)) else dong)
                        continue
            (cuoi if m and ca_nhan.get(m) == "chua_dung" else giu).append(h)
        g["hop"] = giu + cuoi

    if "chuong" in bc:
        for c in bc["chuong"]:
            _nhom(c)
        if bc.get("cot_loi"):
            bc["cot_loi"] = [h for h in bc["cot_loi"] if h.get("ma_mau") not in xem_lai]
    else:
        _nhom(bc)
    return bc


def chon_cot_loi(ds_chuong: list[dict], toi_da: int = 3, uu_tien: tuple[str, ...] = ("cot_loi", "luu_y", "thoi_diem")) -> list[dict]:
    """Mỗi chương góp tối đa một hộp (ưu tiên cốt lõi → lưu ý → thời điểm), gắn `tu_chuong` để SAO-2 cắt theo chương khoá."""
    ra: list[dict] = []
    for c in ds_chuong:
        for loai in uu_tien:
            h = next((x for x in c.get("hop", []) if x["loai"] == loai), None)
            if h:
                ra.append({**h, "tu_chuong": c["ma"], "loai_goc": h["loai"], "loai": "cot_loi"})
                break
        if len(ra) >= toi_da:
            break
    return ra


# ------------------------------------------------------------------ Trục 1 "Bài đọc dài dễ đi" (2026-10-26): gọn báo cáo
# Chỉ CẮT / SẮP LẠI câu đã có (KB), không sinh câu mới. Mã kiểm chứng giữ nguyên (ràng buộc SQL 0017/0021).
_TU_NOI = ("trong khi", "nhất là", "hoặc", "nhưng", "hay", "và", "nên", "vì", "khi", "mà", "để", "rồi")
_TU_NOI_RE = re.compile(r"^(?:\S+\s+){0,2}?(?=(?:%s)\s)" % "|".join(_TU_NOI), re.IGNORECASE)
_RANH_GIOI = re.compile(r"^\s*[,;:.!?…—–(]")
# Từ nối mở đầu thân sau khi bỏ tiêu đề: "và" bỏ hẳn; "nên" (= vì thế) dễ đọc thành lời khuyên → "Vì vậy".
_DOI_TU_NOI = {"và": "", "nên": "Vì vậy "}


def than_khong_lap_tieu_de(tieu_de: str, noi_dung: str) -> str:
    """Thân hộp bỏ phần đã nói ở tiêu đề (tiêu đề dựng từ vế đầu của chính câu thân — `doi_song_chung._tieu_de`).
    Chỉ cắt khi tiêu đề là ĐẦU thân và dừng ở ranh giới từ; tiêu đề dừng giữa vế (đã bỏ từ treo) → thân bắt đầu từ từ
    nối kế tiếp; không cắt gọn được → giữ nguyên. Thân trùng hẳn tiêu đề → "" (hộp chỉ còn tiêu đề)."""
    t = (tieu_de or "").strip().rstrip(".!?…:; ")
    n = " ".join((noi_dung or "").split())
    if len(t) < 4 or not n.lower().startswith(t.lower()):
        return n
    con = n[len(t):]
    if con and con[0].isalnum():                       # tiêu đề dừng giữa một từ ("Bạn lo" ↔ "Bạn lo lắng")
        return n
    het_cau = bool(re.match(r"^\s*[.!?…]", con))
    if _RANH_GIOI.match(con):
        con = con.lstrip(" ,;:.!?…—–(")
    elif con.strip():
        # Tiêu đề dừng giữa vế: bỏ tối đa 4 từ còn treo rồi bắt đầu ở từ nối kế tiếp hoặc sau dấu ngắt vế gần nhất.
        tu = con.split()
        for k in range(min(4, len(tu) - 1) + 1):
            sau = " ".join(tu[k:])
            if k and tu[k - 1][-1] in ",;:":
                con = sau
                break
            if _TU_NOI_RE.match(sau) and _TU_NOI_RE.match(sau).end() == 0:
                con = sau
                break
        else:
            return n
    con = con.strip()
    for w in () if het_cau else _TU_NOI:            # câu mới (sau dấu chấm) giữ nguyên chữ đầu, vd "Nên khen…"
        if con.lower().startswith(w + " "):
            if w in _DOI_TU_NOI:
                con = _DOI_TU_NOI[w] + con[len(w) + 1:]
            break
    con = con.strip()
    return con[:1].upper() + con[1:]


def _cau_cua(s: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", s or "") if c.strip()]


def _thuong_khong_dau_cau(s: str) -> str:
    return " ".join((s or "").lower().split()).rstrip(".!?…:; ")


def _mo_rong_tieu_de(tieu_de: str, noi_dung: str, toi_da: int = 60) -> str | None:
    """Tiêu đề trùng hộp khác trong chương → lấy thêm vế kế tiếp của CHÍNH câu thân (vd "Bạn điềm tĩnh" →
    "Bạn điềm tĩnh, biết tổ chức và giữ của"). Không có vế kế / quá dài → None."""
    t = (tieu_de or "").strip().rstrip(".!?…:; ")
    cau = re.split(r"(?<=[.!?…])\s", " ".join((noi_dung or "").split()), maxsplit=1)[0].rstrip(".!?… ")
    if len(t) < 4 or not cau.lower().startswith(t.lower()):
        return None
    m = re.match(r"\s*[,;:—–]\s*[^,;:—–(]+", cau[len(t):])
    if not m:
        return None
    moi = cau[:len(t) + m.end()].rstrip(" ,;:—–")
    return moi if len(moi) <= toi_da else None


def tieu_de_khong_trung(hop: list[dict]) -> dict[tuple[str, str], str]:
    """UX v3 (2026-10-26): trong một chương không có hai hộp cùng tiêu đề — hộp sau lấy thêm vế kế của câu thân
    (`_mo_rong_tieu_de`). Gọi TRƯỚC khi bỏ phần thân lặp tiêu đề. Sửa tại chỗ; trả {(mã, tiêu đề cũ): tiêu đề mới}."""
    da: set[str] = set()
    doi: dict[tuple[str, str], str] = {}
    for h in hop:
        t = _thuong_khong_dau_cau(h.get("tieu_de", ""))
        if t in da:
            moi = _mo_rong_tieu_de(h.get("tieu_de", ""), h.get("noi_dung", ""))
            if moi:
                doi[(h.get("ma_mau") or "", h["tieu_de"])] = moi
                h["tieu_de"] = moi
                t = _thuong_khong_dau_cau(moi)
        da.add(t)
    return doi


def gon_bao_cao(bc: dict, gon_doan: bool = True) -> dict:
    """Gọn một báo cáo đời sống (sửa tại chỗ, trả về `bc`):
    0. Trong một chương không có hai hộp cùng tiêu đề (`tieu_de_khong_trung`, UX v3); hộp "Điều quan trọng nhất" cùng mã
       nhận tiêu đề mới.
    1. Thân hộp không lặp tiêu đề (`than_khong_lap_tieu_de`); thân rỗng thì lấy câu "nên làm" KB của chính hộp
       (`loi_khuyen`) nếu câu ấy chưa có trong hộp khác của chương, không thì để trống.
       Hộp "Điều quan trọng nhất" lấy đúng thân của hộp gốc cùng mã.
    2. Mỗi `ma_mau` chỉ một hộp đầy đủ: trùng với "Điều quan trọng nhất" → `tham_chieu = "cot_loi"`; trùng một chương
       đứng trước → `tham_chieu = <mã chương ấy>`. Hộp vẫn mang mã (tầng HỌC đếm cùng một phiếu), web hiện một dòng.
    3. `gon_doan`: đoạn thân (sau câu tóm tắt `doan[0]`) bỏ câu chứa tiêu đề hay câu của hộp trong chương (câu nối liệt
       kê lại tiêu đề hộp, câu "xem trong hộp") — đoạn rỗng thì bỏ."""
    chuong_ds = bc.get("chuong") or []
    da_gon: dict[str, dict] = {}
    doi_tieu_de: dict[tuple[str, str], str] = {}
    for c in chuong_ds:
        hop = c.get("hop") or []
        doi_tieu_de.update(tieu_de_khong_trung(hop))
        for h in hop:
            goc = h.get("noi_dung") or ""
            moi = than_khong_lap_tieu_de(h.get("tieu_de", ""), goc)
            if moi != goc and not moi:
                lk = (h.get("loi_khuyen") or "").strip()
                khac = " ".join(x.get("noi_dung", "") for x in hop if x is not h)
                moi = lk if lk and lk not in khac and lk not in goc else ""
            h["noi_dung"] = moi
            if h.get("ma_mau") and h["ma_mau"] not in da_gon:
                da_gon[h["ma_mau"]] = h
    for h in bc.get("cot_loi") or []:
        g = da_gon.get(h.get("ma_mau") or "")
        h["tieu_de"] = doi_tieu_de.get((h.get("ma_mau") or "", h.get("tieu_de", "")), h.get("tieu_de", ""))
        h["noi_dung"] = g["noi_dung"] if g else than_khong_lap_tieu_de(h.get("tieu_de", ""), h.get("noi_dung", "")) \
            or h.get("noi_dung", "")
    da: dict[str, str] = {h["ma_mau"]: "cot_loi" for h in bc.get("cot_loi") or [] if h.get("ma_mau")}
    for c in chuong_ds:
        for h in c.get("hop") or []:
            m = h.get("ma_mau")
            if not m:
                continue
            if m in da:
                h["tham_chieu"] = da[m]
            else:
                h.pop("tham_chieu", None)
                da[m] = c["ma"]
    if gon_doan:
        for c in chuong_ds:
            hop = c.get("hop") or []
            doan = c.get("doan") or []
            if len(doan) < 2 or not hop:
                continue
            tieu_de = [_thuong_khong_dau_cau(h["tieu_de"]) for h in hop if len(h.get("tieu_de", "")) >= 12]
            cau_hop = [_thuong_khong_dau_cau(x) for h in hop for x in _cau_cua(h.get("noi_dung", "")) if len(x) >= 25]
            moi = [doan[0]]
            for d in doan[1:]:
                giu = [x for x in _cau_cua(d) if not any(k in _thuong_khong_dau_cau(x) for k in (*tieu_de, *cau_hop))]
                if giu:
                    moi.append(" ".join(giu))
            c["doan"] = moi
    return bc


def lop_doi_thuong(bc: dict) -> list[str]:
    """Mọi chuỗi thuộc lớp đời thường của một báo cáo (hoặc một `doc_que`): tiêu đề, tóm tắt, hộp, câu tự soi, việc nên làm."""
    ra: list[str] = []

    def _hop(h: dict):
        ra.extend([h.get("tieu_de", ""), h.get("noi_dung", ""), h.get("huong_xu_ly") or ""])

    for h in bc.get("cot_loi") or []:
        _hop(h)
    for k in ("ket_luan", "tom_tat", "cau_tu_soi", "ket"):
        if isinstance(bc.get(k), str):
            ra.append(bc[k])
    for h in bc.get("hop") or []:
        _hop(h)
    for n in bc.get("hanh_dong") or []:
        ra.extend(n.get("viec", []) if isinstance(n, dict) else [])
    for c in bc.get("chuong") or []:
        ra.extend([c.get("tieu_de", ""), c.get("tom_tat") or "", c.get("cau_tu_soi") or ""])
        for h in c.get("hop", []):
            _hop(h)
        for n in c.get("hanh_dong") or []:
            ra.extend(n.get("viec", []) if isinstance(n, dict) else [])
    return [s for s in ra if s]


def cum_cam_chung() -> list[str]:
    """Hợp các danh sách `cum_cam` của mọi KB đời sống (Tử vi, Kinh Dịch, Phong thuỷ) — một bộ test giọng văn cho mọi mảng."""
    from app.kb import kinhdich_doi_song_kb, phongthuy_doi_song_kb, tuvi_doi_song_kb  # noqa: PLC0415
    ds: list[str] = []
    for c in [*tuvi_doi_song_kb.cum_cam(), *kinhdich_doi_song_kb.cum_cam(), *phongthuy_doi_song_kb.cum_cam()]:
        if c not in ds:
            ds.append(c)
    return ds


# Tên chỉ số / thuật ngữ trùng chữ với cụm giọng AI nhưng là tên riêng của mảng (không phải giọng văn) — được phép.
NGOAI_LE = {"thanso": ("sứ mệnh",)}


def kiem_giong_van(bc: dict, ds: list[str] | None = None, mo_dun: str | None = None) -> list[tuple[str, str]]:
    """→ [(cụm cấm, chuỗi chứa nó)] trên lớp đời thường. Rỗng = đạt. `mo_dun` để miễn tên chỉ số riêng (NGOAI_LE)."""
    from app.kb.tuvi_doi_song_kb import tim_cum_cam  # noqa: PLC0415
    ds = ds if ds is not None else cum_cam_chung()
    mo_dun = mo_dun or bc.get("mo_dun")
    ds = [c for c in ds if c not in NGOAI_LE.get(mo_dun or "", ())]
    loi = []
    for s in lop_doi_thuong(bc):
        for c in tim_cum_cam(s, ds):
            loi.append((c, s[:120]))
    return loi
