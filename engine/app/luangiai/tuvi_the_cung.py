# -*- coding: utf-8 -*-
"""RULES — lời đời thường cho THẺ CUNG (lá số `/v1/tuvi/an-sao` → chinh_tinh[].giai_nghia) và cho câu trả lời hỏi
đáp về một cung trong lá số của chính người hỏi (`hoidap.tuvi`). Rà chung chung đợt 2 (`docs/LUAN-GIAI-DOI-SONG.md`
mục 7): bản cũ ghép "Đế tinh: … Sáng: …" / "Mặt tối: … Biểu hiện dễ thấy: …" — chỉ phụ thuộc sao (mọi lá cùng câu),
lộ thuật ngữ. Nay: 2–3 câu nói về NGƯỜI XEM theo sao × cung × sáng/hãm (KB đời sống `sao_linh_vuc`, cùng nguồn với
luận giải đời sống) + một việc nên làm; tên sao, độ sáng, tính chất sao chỉ ở `can_cu` ("Vì sao nói vậy").

Chỉ TRA KB, không gọi LLM, không sinh nghĩa mới.
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import ten as _ten
from app.kb import tuvi_doi_song_kb as kds
from app.kb import tuvi_kb
from app.kb.loi import L

NHOM_CAT = ("Lục cát tinh", "Lộc")


def ten_mang(cung: str) -> str:
    return kds.ten_doi_thuong(cung) or cung.lower()


def nhom_sang(do_sang: str | None) -> str:
    """Như luận giải đời sống: chỉ "Hãm" đọc theo lời khi hãm; còn lại (kể cả Bình / chưa rõ) theo lời khi sáng."""
    return "ham" if do_sang == "Hãm" else "sang"


def loi_sao_cung(sao: str, cung: str, do_sang: str | None, muon_tu: str | None = None) -> dict | None:
    """→ {"thuong_thay": 2 câu (điều thường thấy ở bạn + chỗ dễ vấp), "nen_lam": 1 câu, "can_cu": [...]}.
    `muon_tu` = cung đối diện khi cung đang xem vô chính diệu (mượn sao)."""
    ct = tuvi_kb.chinh_tinh(sao)
    if not ct:
        return None
    nhom = nhom_sang(do_sang)
    m = kds.sao_linh_vuc(sao, cung, nhom) or {}
    t = ten_mang(cung)
    if not ngon_ngu.la_viet():
        return _loi_sao_cung_dich(sao, cung, do_sang, muon_tu, ct, nhom, m, t)
    manh = m.get("manh") or f"Ở chuyện {t}, bạn mạnh ở chỗ {ct['diem_manh']}."
    vap = m.get("de_vap") or f"Ở chuyện {t}, bạn dễ vấp ở chỗ {ct['mat_toi']}."
    nen = m.get("loi_khuyen")
    thuong = f"{vap} {manh}" if nhom == "ham" else f"{manh} {vap}"
    vi_tri = (f"{sao} ({do_sang or 'chưa rõ độ sáng'}) ở cung {muon_tu}, chiếu sang {cung} (vô chính diệu, mượn sao)"
              if muon_tu else f"{sao} ({do_sang or 'chưa rõ độ sáng'}) ở cung {cung} — độ sáng theo Nam phái")
    cu = [vi_tri, f"Nét chung của {sao} ({ct['ten_han']}, hành {ct['ngu_hanh']}): {ct['tinh_chat']}"]
    sac = tuvi_kb.nhom_do_sang(do_sang)
    if sac:
        cu.append(ct["khi_sang" if sac == "sang" else "khi_ham"])
    nd = tuvi_kb.sao_cung(sao, cung)
    if nd:
        cu.append(f"Sách nói {sao} ở cung {cung}: {nd}")
    return {"thuong_thay": thuong, "nen_lam": nen, "can_cu": cu}


def _loi_sao_cung_dich(sao: str, cung: str, do_sang: str | None, muon_tu: str | None, ct: dict, nhom: str, m: dict,
                       t: str) -> dict:
    """EN-ALL GĐ 4 — bản ngôn ngữ khác của `loi_sao_cung`: cùng số câu, cùng thứ tự; chữ từ bản phủ KB (đời sống +
    tuvi_kb) và mẫu `L()`; tên sao / cung / độ sáng / hành theo bảng tên."""
    manh = m.get("manh") or L("tuvi_ls.the.manh", "", mang=t, y=ct["diem_manh"])
    vap = m.get("de_vap") or L("tuvi_ls.the.vap", "", mang=t, y=ct["mat_toi"])
    thuong = f"{vap} {manh}" if nhom == "ham" else f"{manh} {vap}"
    ds = _ten.ten("do_sang", do_sang) if do_sang else L("tuvi_ls.the.chua_ro_do_sang", "chưa rõ độ sáng")
    s, c = _ten.ten("sao", sao), _ten.ten("cung", cung)
    vi_tri = (L("tuvi_ls.the.vi_tri_muon", "", sao=s, do_sang=ds, muon_tu=_ten.ten("cung", muon_tu), cung=c)
              if muon_tu else L("tuvi_ls.the.vi_tri", "", sao=s, do_sang=ds, cung=c))
    cu = [vi_tri, L("tuvi_ls.the.net_chung", "", sao=s, han=ct["ten_han"], hanh="/".join(_ten.ten("hanh", h) for h in ct["ngu_hanh"].replace("Thuỷ", "Thủy").replace("Hoả", "Hỏa").split("/")),
                    tinh_chat=ct["tinh_chat"])]
    sac = tuvi_kb.nhom_do_sang(do_sang)
    if sac:
        cu.append(ct["khi_sang" if sac == "sang" else "khi_ham"])
    nd = tuvi_kb.sao_cung(sao, cung)
    if nd:
        cu.append(L("tuvi_ls.the.sach_noi", "", sao=s, cung=c, noi_dung=nd))
    return {"thuong_thay": thuong, "nen_lam": m.get("loi_khuyen"), "can_cu": cu}


def loi_phu_tinh(cung: str, sao: list[dict]) -> str | None:
    """Cát / sát / đào hoa / Tuần–Triệt trong cung (mục `phu_tinh_cung` của hỏi đáp: [{ten, nhom}]) → lời thường."""
    nhom: dict[str, list[str]] = {"cat": [], "sat": [], "dao_hoa": [], "tt": []}
    for s in sao:
        n = s.get("nhom")
        k = "cat" if n in NHOM_CAT else "sat" if n == "Lục sát tinh" else "dao_hoa" if n == "Nhóm đào hoa" else (
            "tt" if n == "Tuần/Triệt" else None)
        if k:
            nhom[k].append(s["ten"])
    cau = []
    for k in ("cat", "sat", "dao_hoa"):
        if not nhom[k]:
            continue
        m = kds.nhom_sao_linh_vuc(k, cung) or {}
        y = m.get("y")
        if not y:
            continue
        ve = [] if k == "dao_hoa" else list(dict.fromkeys(v for v in (kds.nhom_sao_chi_tiet(x) for x in nhom[k]) if v))[:2]
        cau.append(f"{y.rstrip('. ')}; {', '.join(ve)}." if ve else y)
        # Việc nên làm: sát theo đúng cặp sao; cát / đào hoa không thêm (lời chung theo cung, lặp ở nửa số lá).
        lk = kds.sat_loi_khuyen(cung, nhom[k]) or m.get("loi_khuyen") if k == "sat" else None
        if lk:
            cau.append(lk)
    if nhom["tt"]:
        tt = kds.tuan_triet(cung) or {}
        triet = any("Triệt" in x for x in nhom["tt"])
        y = tt.get("triet" if triet else "tuan")
        lk = tt.get("loi_khuyen_triet" if triet else "loi_khuyen") or tt.get("loi_khuyen")
        cau += [x for x in (y, lk) if x]
    return " ".join(cau) or None
