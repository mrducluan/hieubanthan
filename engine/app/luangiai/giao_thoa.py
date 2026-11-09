# -*- coding: utf-8 -*-
"""HTT-1 — RULES "Điểm giao thoa từ điều bạn đã xác nhận" (docs/DANH-GIA-HYBRID-TWO-TIER.md mục 3.4).

Ý lấy từ Tier 2 của tài liệu Drive (Hybrid Two-Tier: người dùng bấm "Đúng với mình" ≥ 2 hộp → hệ thống dệt "điểm giao thoa"),
làm TẤT ĐỊNH thay vì LLM + Apache AGE: đầu vào CHỈ là MÃ hộp đã bấm (`ds.*`, do engine sinh) và kết quả đúng / chưa đúng.
Từ mã suy môn · chương · mảng đời · mức (mã mang sẵn `thuan / can_bang / can_chu_dong`), rồi ghép theo ba luật:
  A. cùng MẢNG đời, ≥ 2 MÔN cùng được xác nhận → hộp "cùng nói trúng" (mức chung nếu trùng, "mỗi cách một mặt" nếu khác);
  B. cùng MÔN, ≥ 2 mảng cùng mức thuận / cần chủ động được xác nhận → hộp "nhịp chung";
  C. một mảng vừa có Đúng vừa có Chưa đúng → một hộp "chỗ chưa khớp" — không lặp nét đã phủ nhận.
Không điểm số, không câu chữ người dùng, không lưu; lời ở KB `giao_thoa_kb.json` (+ bản phủ `en/`). Không đổi mức môn nào.
Mã hộp `ds.giao_thoa.*` đi qua regex `doi_song` của SQL `kiem_chung_ma_hop_le` sẵn có (không migration).
"""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from app.kb import nap
from app.kb.loi import danh_sach
from app.luangiai import doi_song_khuon as kh

MO_DUN = "giao_thoa"
PHAI = "giao_thoa_1"
MUC = ("thuan", "can_bang", "can_chu_dong")
_KB = Path(__file__).parents[1] / "kb" / "data" / "giao_thoa_kb.json"
# Mã có tiền tố môn riêng; không có → Tử vi (ds.<chương>.…). `bt` = Bát tự.
_MON_TIEN_TO = {"bt": "battu", "thanso": "thanso", "phongthuy": "phongthuy", "kinhdich": "kinhdich", "nhantuong": "nhantuong",
                "chan_dung": "chan_dung", "tarot": "tarot", "tgt": "tgt"}
# Chương → mảng đời (chương không có trong bảng → không gán mảng, vẫn tính cho môn).
_CHUONG_MANG = {
    "tong_quan": "con_nguoi", "con_nguoi": "con_nguoi", "nghich_ly": "con_nguoi", "ngu_hanh": "con_nguoi",
    "su_nghiep": "cong_viec", "cong_viec": "cong_viec", "cong_viec_tien": "cong_viec", "hoc_tap": "cong_viec",
    "tien_bac": "tien_bac", "tinh_cam": "tinh_cam", "tinh_cam_gia_dinh": "tinh_cam", "gia_dinh": "gia_dinh",
    "suc_khoe": "suc_khoe", "quan_he": "quan_he", "nha_cua": "nha_cua", "ban_hop_huong": "nha_cua", "ngoi_nha_voi_ban": "nha_cua",
    "tung_phong": "nha_cua", "viec_nen_lam": "nha_cua", "nam_nay": "nam_nay", "muoi_hai_thang": "nam_nay", "thang": "nam_nay",
    "cuoc_doi": "giai_doan", "van_han": "giai_doan", "duong_bay": "giai_doan",
    "tra_loi": "cau_hoi", "cau_chuyen": "cau_hoi", "tung_la": "cau_hoi", "dong_chay": "cau_hoi", "ben_trong": "cau_hoi",
    "viec": "cau_hoi", "thoi_diem": "cau_hoi",
}
_MANG_CA_MON = {"kinhdich": "cau_hoi", "tarot": "cau_hoi", "tgt": "nam_nay"}
_LOAI = {"thuan": "diem_manh", "can_chu_dong": "luu_y", "can_bang": "loi_khuyen", "hon_hop": "loi_khuyen", "khong_ro": "loi_khuyen"}


@nap.nho
def kb() -> dict:
    return nap.doc(_KB.name)


def phan_tich_ma(ma: str) -> dict | None:
    """`ds.bt.su_nghiep.chinh_tai.thuan.hien_tai` → {mon: battu, chuong: su_nghiep, mang: cong_viec, muc: thuan}. Mã lạ / mã
    của chính lớp này → None."""
    p = (ma or "").split(".")
    if len(p) < 3 or p[0] != "ds" or p[1] == MO_DUN:
        return None
    if p[1] in _MON_TIEN_TO:
        mon, chuong, con = _MON_TIEN_TO[p[1]], p[2], p[3:]
    else:
        mon, chuong, con = "tuvi", p[1], p[2:]
    # Môn mà MỌI chương đều về một mảng: Kinh Dịch / Tarot = câu hỏi đang mang (kể cả chương "tổng quan" của trải bài —
    # không phải tính cách người đọc); Thời gian tới = năm / các tháng sắp tới.
    mang = _MANG_CA_MON.get(mon) or _CHUONG_MANG.get(chuong)
    muc = next((x for x in con if x in MUC), None)
    return {"ma": ma, "mon": mon, "chuong": chuong, "mang": mang, "muc": muc}


def _ten_mon(m: str) -> str:
    return kb()["mon"].get(m, {}).get("ten", m)


def _mang(m: str) -> dict:
    return kb()["mang"].get(m, {"ten": m, "ngan": m})


def _dien(mau: str, **slot) -> str:
    try:
        return mau.format(**slot)
    except (KeyError, IndexError):
        return mau


def _hop_dem(mon: str, n: int) -> str:
    return _dien(kb()["mau"]["hop_dem"], mon=_ten_mon(mon), n=n)


def lap(phieu: list[dict], *, ca_nhan: dict | None = None, trong_so: dict | None = None) -> dict:
    """`phieu` = [{ma, ket_qua: dung|chua_dung}] của phiên đang đọc; `ca_nhan` = phiếu đã lưu của chính người xem (web gửi khi
    đăng nhập) — phiên thắng khi trùng mã. Trả gói đọc khuôn `doi_song_1` một chương-không-tên: hop + tom_tat + cau_tu_soi."""
    votes: dict[str, str] = {}
    for m, kq in (ca_nhan or {}).items():
        if kq in ("dung", "chua_dung"):
            votes[m] = kq
    for p in phieu:
        if p.get("ket_qua") in ("dung", "chua_dung") and isinstance(p.get("ma"), str):
            votes[p["ma"]] = p["ket_qua"]
    dung = [x for m, kq in votes.items() if kq == "dung" and (x := phan_tich_ma(m))]
    chua = [x for m, kq in votes.items() if kq == "chua_dung" and (x := phan_tich_ma(m))]
    kbm = kb()["mau"]
    ra = {"mo_dun": MO_DUN, "phai": PHAI, "so_dung": len(dung), "so_chua_dung": len(chua), "du": len(dung) >= 2, "hop": [],
          "mang": [], "tom_tat": "", "cau_tu_soi": kbm["cau_tu_soi"]}
    if len(dung) < 2:
        ra["tom_tat"] = kbm["khong_du"]
        return ra

    theo_mang: dict[str, list[dict]] = defaultdict(list)
    chua_theo_mang: dict[str, list[dict]] = defaultdict(list)
    for x in dung:
        if x["mang"]:
            theo_mang[x["mang"]].append(x)
    for x in chua:
        if x["mang"]:
            chua_theo_mang[x["mang"]].append(x)
    hop: list[dict] = []
    mang_gap: list[str] = []

    # ---- A. cùng mảng, nhiều môn
    for mang in sorted(theo_mang, key=lambda k: list(kb()["mang"]).index(k) if k in kb()["mang"] else 99):
        ds = theo_mang[mang]
        mons = sorted({x["mon"] for x in ds}, key=lambda m: list(kb()["mon"]).index(m) if m in kb()["mon"] else 99)
        if len(mons) < 2:
            continue
        mucs = sorted({x["muc"] for x in ds if x["muc"]}, key=MUC.index)
        if len(mucs) == 1:
            khoa, muc_hop = mucs[0], mucs[0]
        elif len(mucs) > 1:
            khoa, muc_hop = "hon_hop", None
        else:
            khoa, muc_hop = "khong_ro", None
        mau = kbm["cung_mang"][khoa]
        mg = _mang(mang)
        ten_mon = [_ten_mon(m) for m in mons]
        ds_muc = danh_sach([f"{_ten_mon(m)} {kb()['muc'][x]}" for m in mons
                            for x in sorted({y['muc'] for y in ds if y['mon'] == m and y['muc']}, key=MUC.index)])
        slot = {"mang": mg["ten"], "ngan": mg["ngan"], "noi": danh_sach(ten_mon), "so": len(mons), "ds": ds_muc}
        h = kh.hop(_LOAI[khoa], _dien(mau["tieu_de"], **slot), _dien(mau["noi_dung"], **slot), huong_xu_ly=_dien(mau["huong_xu_ly"], **slot),
                   ma=kh.ma_mau(MO_DUN, mang, "mon", khoa, str(len(mons))), muc=muc_hop,
                   can_cu=[_dien(kbm["can_cu"], ds="; ".join(x["ma"] for x in ds))], phai=PHAI)
        hop.append(h)
        mang_gap.append(mg["ten"])
        ra["mang"].append({"ma": mang, "ten": mg["ten"], "mon": mons, "muc": muc_hop or khoa})

    # ---- B. cùng môn, nhiều mảng cùng mức (chỉ thuận / cần chủ động — nhịp đều không đáng gọi tên)
    theo_mon: dict[tuple[str, str], dict[str, dict]] = defaultdict(dict)
    for x in dung:
        if x["mang"] and x["muc"] in ("thuan", "can_chu_dong"):
            theo_mon[(x["mon"], x["muc"])].setdefault(x["mang"], x)
    for (mon, muc), mangs in sorted(theo_mon.items()):
        if len(mangs) < 2:
            continue
        mau = kbm["cung_mon"][muc]
        slot = {"mon": _ten_mon(mon), "ds": danh_sach([_mang(m)["ngan"] for m in mangs]), "muc": kb()["muc"][muc]}
        hop.append(kh.hop(_LOAI[muc], _dien(mau["tieu_de"], **slot), _dien(mau["noi_dung"], **slot), huong_xu_ly=_dien(mau["huong_xu_ly"], **slot),
                          ma=kh.ma_mau(MO_DUN, mon, "mang", muc, str(len(mangs))), muc=muc,
                          can_cu=[_dien(kbm["can_cu"], ds="; ".join(x["ma"] for x in mangs.values()))], phai=PHAI))

    # ---- C. mảng vừa đúng vừa chưa đúng → một câu, không lặp nét đã phủ nhận
    for mang in sorted(set(theo_mang) & set(chua_theo_mang)):
        mg = _mang(mang)
        dem_d: dict[str, int] = defaultdict(int)
        dem_c: dict[str, int] = defaultdict(int)
        for x in theo_mang[mang]:
            dem_d[x["mon"]] += 1
        for x in chua_theo_mang[mang]:
            dem_c[x["mon"]] += 1
        mau = kbm["lech"]
        slot = {"mang": mg["ten"], "ngan": mg["ngan"], "noi_dung_dung": danh_sach([_hop_dem(m, n) for m, n in sorted(dem_d.items())]),
                "noi_dung_sai": danh_sach([_hop_dem(m, n) for m, n in sorted(dem_c.items())])}
        hop.append(kh.hop("loi_khuyen", _dien(mau["tieu_de"], **slot), _dien(mau["noi_dung"], **slot), huong_xu_ly=_dien(mau["huong_xu_ly"], **slot),
                          ma=kh.ma_mau(MO_DUN, mang, "lech"), phai=PHAI,
                          can_cu=[_dien(kbm["can_cu"], ds="; ".join(x["ma"] for x in theo_mang[mang] + chua_theo_mang[mang]))]))

    ra["hop"] = hop
    ds_mon = danh_sach([_ten_mon(m) for m in sorted({x["mon"] for x in dung}, key=lambda m: list(kb()["mon"]).index(m) if m in kb()["mon"] else 99)])
    if mang_gap:
        ra["tom_tat"] = _dien(kbm["tom_tat"], so=len(dung), ds_mon=ds_mon, ds_mang=danh_sach(mang_gap))
    elif any(h["ma_mau"].split(".")[3:4] == ["mang"] for h in hop):      # chỉ luật B: cùng môn, nhiều mảng cùng mức
        ra["tom_tat"] = _dien(kbm["tom_tat_cung_mon"], so=len(dung), ds_mon=ds_mon)
    else:
        ra["tom_tat"] = _dien(kbm["tom_tat_khong_gap"], so=len(dung), ds_mon=ds_mon)
    # Tầng HỌC dùng chung: hộp giao thoa cũng có kiểm chứng; ≥ 100 phiếu & < 40 % đúng → xuống "Vì sao nói vậy".
    kh.ap_hoc(ra, trong_so, {k: v for k, v in (ca_nhan or {}).items() if k.startswith(f"ds.{MO_DUN}.")})
    return ra


def dien_dat(kq: dict) -> dict:
    """HTT-2 H5 (NARRATIVE, chủ dự án duyệt 2026-11-09): AI chỉ diễn đạt LẠI các hộp giao thoa đã ghép (lớp tất định ở trên là
    bản chính, luôn hiện trước) thành một đoạn liền mạch — nguồn = tóm tắt + từng hộp, không mã, không câu người dùng, không lá
    số. Qua bộ kiểm chung `kiem_ai` (số, thuật ngữ lạ, cụm cấm, câu ý mới, độ dài); nhớ theo mã băm nguồn (ai_goi) nên cùng tổ
    hợp hộp không tốn lượt lần hai. Chỉ bản tiếng Việt (bộ kiểm + lời nhắc là tiếng Việt); thiếu khoá / hết lượt / không qua
    kiểm → `dien_dat = "mau"`, không có `van_ai`. Web bật bằng cài đặt `giao_thoa.dien_dat` (mặc định tắt)."""
    import os  # noqa: PLC0415

    from app import ngon_ngu  # noqa: PLC0415
    if not kq.get("hop") or not ngon_ngu.la_viet() or not os.environ.get("OPENROUTER_API_KEY"):
        return {**kq, "dien_dat": "mau"}
    from app.narrative import luan_giai_van as lgv  # noqa: PLC0415
    doan = [x for x in [kq.get("tom_tat", "")] if x]
    doan += [f"{h['tieu_de']}: {h['noi_dung']}" + (f" Nên: {h['huong_xu_ly']}" if h.get("huong_xu_ly") else "") for h in kq["hop"]]
    c = lgv._mot_chuong({"ma": MO_DUN, "tieu_de": kb()["mau"].get("tieu_de_dien_dat", "Điểm giao thoa từ điều bạn đã xác nhận"),
                         "doan": doan}, "giao_thoa")
    if c.get("che_do") != "llm" or not c.get("van_ai"):
        return {**kq, "dien_dat": "mau"}
    return {**kq, "van_ai": c["van_ai"], "dien_dat": "ai"}


__all__ = ["dien_dat", "lap", "phan_tich_ma"]
