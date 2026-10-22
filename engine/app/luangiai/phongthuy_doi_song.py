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

from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.calc import tietkhi
from app.calc import tuoi_dan_gian as tdg
from app.kb import phongthuy_do_thi as do_thi
from app.kb import phongthuy_doi_song_kb as kb
from app.kb import phongthuy_kb as kbp
from app.luangiai import doi_song_khuon as kh
from app.luangiai import phongthuy_bo_cuc as bo_cuc
from app.luangiai import tuoi_dan_gian as tdg_luan

PHONG_CHINH = ["cua_chinh", "phong_ngu_chinh", "bep", "ban_tho", "phong_lam_viec", "ve_sinh"]
# Q1 (2026-10-22): "hình thế là nền, lý khí là nhịp" — có dấu hiệu nhóm veto đã xác nhận thì chương Ngôi nhà / Từng phòng
# không vượt mức này; phi tinh, lưu niên, lưu nguyệt chỉ quyết định thời điểm.
MUC_TRAN_VETO = "can_bang"
_THU_AN_TOAN = [("lửa", "lửa và điện"), ("nóng bí", "nóng bí"), ("rò rỉ", "nước"), ("dao kéo", "vật sắc nhọn"), ("ẩm mốc", "ẩm thấp"),
                ("hợp đồng", "lời qua tiếng lại"), ("Bậc thang", "lối đi"), ("kín gió", "gió lùa")]
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


def _doan_cap_sao(ch: dict) -> list[str]:
    """PT-81: đoạn đời thường cho cặp sao ở phía cửa — lĩnh vực theo vai (hướng tinh: tiền bạc & công việc; sơn tinh: người ở)
    và năm sao lưu niên tới cung (năm nên chủ động hơn / năm thuận — nhịp gợi ý, không dự báo)."""
    lv = ch.get("linh_vuc") or {}
    ra = []
    if lv:
        ra.append(f"Hướng tinh {ch['huong']} ở phía cửa nói về tiền bạc, công việc: {lv.get('tien_bac', '')} {lv.get('cong_viec', '')}".strip())
        ra.append(f"Sơn tinh {ch['son']} nói về người ở: {lv.get('gia_dao', '')} {lv.get('suc_khoe', '')}".strip())
        if lv.get("tam_ly"):
            ra.append(lv["tam_ly"])
    ny = ch.get("nam_chu_y") or {}
    if ny.get("chu_dong") or ny.get("thuan"):
        phan = []
        if ny.get("chu_dong"):
            phan.append("năm nên chủ động hơn ở phía cửa (sao " + "/".join(str(x) for x in ch["kich_hoat"]["chu_dong"]) + " bay tới): "
                        + ", ".join(str(n) for n in ny["chu_dong"]))
        if ny.get("thuan"):
            phan.append("năm thuận để sửa sang, mở việc ở phía này: " + ", ".join(str(n) for n in ny["thuan"]))
        ra.append("Theo sao lưu niên 10 năm tới — " + "; ".join(phan) + ". Đây là nhịp gợi ý để sắp việc, không phải lời đoán.")
    ra += _doan_an_toan(ch)
    return ra


def _thu_an_toan(an_toan: list[str]) -> str:
    van = " ".join(an_toan)
    thu = [t for k, t in _THU_AN_TOAN if k in van]
    return ", ".join(dict.fromkeys(thu)) or "vài điều cần chăm kỹ hơn"


def _doan_an_toan(ch: dict) -> list[str]:
    """Lưu ý an toàn của cặp sao (lửa điện, nước, vật nhọn…) + luật nước vận 9 — lời nhắc chăm nhà, không dự báo."""
    ra = []
    at = ch.get("an_toan") or []
    if at:
        ra.append(kbp.mau_an_toan(_thu_an_toan(at)) + " " + " ".join(at))
    if ch.get("khong_dat_nuoc"):
        ra.append("Phía này không hợp đặt bể cá, thác nước hay đèn đỏ rực: sách xưa vận 9 chỉ đặt nước ở phía có hướng tinh 9, còn phía có sơn tinh 9 hay sao 5, sao 2 thì giữ yên và sạch.")
    elif ch.get("hop_dat_nuoc"):
        ra.append("Nếu bạn vốn thích bể cá nhỏ thì phía này là chỗ hợp theo sách xưa (hướng tinh 9 vận 9) — vẫn phải chăm nước sạch, không mua chỉ vì phong thuỷ.")
    return ra


def _hop_an_toan(ch: dict, noi: str) -> dict | None:
    at = ch.get("an_toan") or []
    if not at:
        return None
    return _hop("luu_y", f"{noi}: cẩn thận hơn với {_thu_an_toan(at)}", kbp.mau_an_toan(_thu_an_toan(at)), at[0], an_toan=at)


def _ap_tran_muc(c: dict, veto: list[dict]) -> dict:
    """Q1: trần mức theo dấu hiệu lớn đã xác nhận — ghi `tran_muc` để web giải thích vì sao chương không lên Thuận lợi."""
    if not veto:
        return c
    c["tran_muc"] = {"muc_toi_da": MUC_TRAN_VETO, "ly_do": [d["tieu_de"] for d in veto],
                     "giai_thich": "Hình thế là nền, lý khí là nhịp: còn dấu hiệu lớn chưa xử lý thì mức không vượt Cân bằng, dù sao tốt tới."}
    if c.get("muc") == "thuan":
        c["muc"] = MUC_TRAN_VETO
        c["nhan_muc"] = kb.nhan_muc(MUC_TRAN_VETO)
    return c


def _veto(bc_luan: dict | None) -> list[dict]:
    if not bc_luan:
        return []
    return [d for d in bc_luan["dien_giai"]["dau_hieu"] if d.get("veto") and not d["tot"]]


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
    c["tom_tat"] = (f"Bạn mệnh {mq['quai']}, {mq['nhom'].lower()}. {kb.nhom(mq['nhom'])} "
                    f"Bốn phía hợp với bạn: {', '.join(tot)}. Bốn phía kém: {', '.join(kem)}.")
    thu_tu = sorted(tot, key=lambda h: _UU_TIEN_DU_NIEN.index(bang[h]))
    c["hop"].append(_hop("cot_loi", f"Mệnh {mq['quai']} · {mq['nhom']}",
                         f"Quay mặt hay kê đầu về {', '.join(thu_tu)} là thuận với bạn. Nếu chỉ nhớ một hướng: {thu_tu[0]}."))
    for h in thu_tu[:3]:
        dn = bang[h]
        c["hop"].append(_hop("loi_khuyen", f"{h} — {dn}", f"{kb.du_nien(dn)['mot_cau'].capitalize()}. Dùng cho: {kb.du_nien(dn)['dung']}."))
    xau = sorted(kem, key=lambda h: -_UU_TIEN_DU_NIEN.index(bang[h]))[0]
    c["hop"].append(_hop("luu_y", f"{xau} — {bang[xau]}", f"{kb.du_nien(bang[xau])['mot_cau'].capitalize()}.",
                         "Để kho, nhà vệ sinh hoặc nơi ít ngồi lâu ở phía này; không kê đầu giường quay về đây."))
    c["doan"] = [f"Mệnh quái tính theo năm sinh (mốc {'Lập xuân' if mq['moc_nam'] == 'lap_xuan' else 'Tết âm lịch'}) và giới tính, "
                 f"ra tám phía tốt xấu quanh bạn. Tính chất quẻ {mq['quai']}: {q.get('tinh_chat', '')}.",
                 "Phía tốt dùng cho cửa, chỗ ngồi, đầu giường; phía kém dùng cho kho, nhà vệ sinh, cầu thang — đồ đạc và nếp dùng phòng "
                 "là thứ bạn đổi được ngay, không cần sửa nhà."]
    c["can_cu"] = [f"Bát trạch: mệnh quái {mq['quai']} (số {mq['so']}), năm tính {mq['nam_tinh']}. Du niên 8 phương: "
                   + "; ".join(f"{h} {bang[h]}" for h in pt.HUONG) + "."]
    for cb in mq.get("co_canh_bao", []):
        c["can_cu"].append(cb["chi_tiet"])
    c["bang_huong"] = bang
    c["cau_tu_soi"] = "Chỗ bạn ngồi làm việc và kê đầu giường hiện quay về phía nào? Có trùng phía hợp với bạn không?"
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
        x = {"vai": tv.get("vai", "khac"), "ten_vai": kb.vai(tv.get("vai", "khac")), "quai": m["quai"], "nhom": m["nhom"],
             "huong_tot": [h for h in pt.HUONG if bang[h] in pt.CAT],
             "cung_nhom_voi_chu": (m["nhom"] == mq["nhom"]) if mq else None,
             "huong_chung": hk.huong_chung(mq["quai"], m["quai"]) if mq else [],
             "thong_quan": hk.thong_quan(mq["quai"], m["quai"]) if mq else None}
        ra.append(x)
    return ra


# ----------------------------------------------------------------------------- chương 2
def _chuong_ngoi_nha(mq, huong, do, nha, b, tvs, bc_luan) -> dict:
    c = {"ma": "ngoi_nha_voi_ban", **kb.chuong("ngoi_nha_voi_ban"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": []}
    if not huong:
        c.update(thieu="can_huong", tom_tat=kb.mau("can_huong"))
        return c
    trach = pt.trach(huong)
    can_cu = [f"Nhà hướng {huong}" + (f" ({do:.0f}°)" if do is not None else "") + f", toạ {trach['toa']} → {trach['quai']} trạch ({trach['nhom']})."]
    # hình thế trước lý khí
    xau = sorted([d for d in (bc_luan or {}).get("dien_giai", {}).get("dau_hieu", []) if not d["tot"]], key=lambda d: not d.get("veto"))
    if xau:
        d0 = xau[0]
        c["hop"].append(_hop("luu_y", f"Trước hết: {d0['tieu_de'].lower()}", d0["noi_dung"], d0["goi_y"], viec=d0.get("viec") or None,
                             veto=True if d0.get("veto") else None))
    muc_parts = []
    if mq:
        dn = pt.du_nien(mq["quai"], huong)["du_nien"]
        cung_nhom = mq["nhom"].split()[0] == trach["nhom"].split()[0]
        muc_parts += [_muc_du_nien(dn), "thuan" if cung_nhom else "can_chu_dong"]
        can_cu.append(f"Hướng {huong} với mệnh {mq['quai']} là {dn}; {'cùng' if cung_nhom else 'khác'} nhóm Đông/Tây với trạch.")
        c["hop"].append(_hop("cot_loi", f"Hướng {huong} với bạn: {dn}",
                             f"{kb.du_nien(dn)['mot_cau'].capitalize()}. " + (f"Nhà và bạn cùng nhóm {trach['nhom'].split()[0]} — bố trí dễ."
                                                                             if cung_nhom else
                                                                             f"Nhà thuộc {trach['nhom']}, bạn {mq['nhom']} — khác nhóm, nên chọn phòng và đầu giường theo mệnh bạn thay vì theo nhà.")))
    else:
        c["hop"].append(_hop("cot_loi", f"Nhà hướng {huong} — {trach['quai']} trạch", f"{trach['nhom']}: các phía hợp với nhà là "
                             + ", ".join(h for h in pt.HUONG if pt.bang_huong(trach["quai"])[h] in pt.CAT) + ". Thêm năm sinh để so với mệnh bạn."))
    if b:
        ch = b["cap_huong"]
        muc_parts.append(ch["muc"])
        can_cu.append(f"Huyền Không vận {b['van']}, toạ {b['toa']['son']} hướng {b['huong']['son']}: cục {b['cuc_ten']}; "
                      f"cung hướng ({b['huong']['phuong']}) sơn tinh {ch['son']} – hướng tinh {ch['huong']} ({ch['ten']}), "
                      f"sao hướng đang {ch['trang_thai_huong']}.")
        loai = "diem_manh" if ch["muc"] == "thuan" else "luu_y" if ch["muc"] == "can_chu_dong" else "loi_khuyen"
        c["hop"].append(_hop(loai, f"Phía cửa theo năm xây {b['nam_xay']}: {kb.nhan_muc(ch['muc'])}", ch["y"],
                             (ch.get("luu_y") or None) if loai == "luu_y" else None))
        kcuc = (kbp.huyen_khong().get("cuc") or {}).get(b["cuc"], {})
        if kcuc:
            c["doan"].append(f"Theo năm xây, nhà thuộc cục {b['cuc_ten'].lower()}: {kcuc.get('y', '')} Gợi ý: {kcuc.get('goi_y', '')}")
        c["doan"].extend(_doan_cap_sao(ch))
        h_at = _hop_an_toan(ch, "Phía cửa")
        if h_at:
            c["hop"].append(h_at)
    if tvs:
        khac = [t for t in tvs if t["cung_nhom_voi_chu"] is False]
        if khac:
            c["doan"].append(kb.mau("khac_nhom") + " " + "; ".join(f"{t['ten_vai'].capitalize()} mệnh {t['quai']} hợp {', '.join(t['huong_tot'][:2])}" for t in khac) + ".")
        else:
            c["doan"].append(kb.mau("cung_nhom") + " " + "; ".join(f"{t['ten_vai'].capitalize()} mệnh {t['quai']}" for t in tvs) + ".")
        for t in tvs:
            tq = t.get("thong_quan") or {}
            if tq.get("hanh_thong_quan"):
                c["hop"].append(_hop("loi_khuyen", f"Bạn và {t['ten_vai']}: hai hành chạm nhau", tq["goi_y"]))
            if t["huong_chung"]:
                can_cu.append(f"Hướng tốt chung của bạn và {t['ten_vai']}: {', '.join(t['huong_chung'])}.")
    if nha.get("theo") == "ban_cong":
        c["doan"].append(kb.mau("ban_cong"))
    c["muc"] = _gop_muc(*muc_parts)
    c["nhan_muc"] = kb.nhan_muc(c["muc"]) if c["muc"] else None
    _ap_tran_muc(c, _veto(bc_luan))
    c["tom_tat"] = (f"Nhà hướng {huong}, {trach['quai']} trạch. " + (f"Với bạn: {kb.nhan_muc(c['muc']).lower()}." if c["muc"] else "")
                    + (" Có dấu hiệu lớn cần xử lý trước." if c.get("tran_muc") else "")).strip()
    c["doan"].insert(0, kb.mau("hinh_the_truoc"))
    c["can_cu"] = can_cu
    c["cau_tu_soi"] = "Bước vào nhà, bạn thấy sáng và dễ thở, hay tối và bí? Cảm giác đó quan trọng hơn mọi con số ở trên."
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
                ly = (f"{v['ten']} ở phía {v['cung']} là {dn} với {'bạn' if v['du_nien_menh'] else 'nhà'}" if dn else f"{v['ten']} ở phía {v['cung']}")
                if cap and cap["muc"] == "can_chu_dong":
                    ly += f"; cặp sao {cap['son']}–{cap['huong']} ({cap['ten']}) ở đây cũng kém"
                c["hop"].append(_hop("luu_y", f"{v['ten']} — nên để ý", ly + ".", kbv.get("thuc_te") or "Nếu không dời được, đổi cách dùng: giữ gọn, đủ sáng, dùng ít hơn."))
            elif muc == "thuan":
                c["hop"].append(_hop("diem_manh", f"{v['ten']} — đang hợp", f"{v['ten']} ở phía {v['cung']} ({dn}) là chỗ hợp. Giữ nguyên."))
        c["muc"] = _gop_muc(*mucs)
        ccb = bc_luan["da_tinh"]["cua_chu_bep"]
        if ccb:
            c["cua_chu_bep"] = ccb
            xau = [x for x in ccb["cap"] if not x["cat"]]
            c["can_cu"].append("Cửa – chủ – bếp (Dương Trạch Tam Yếu): " + "; ".join(f"{x['cap']} {x['du_nien']}" for x in ccb["cap"]) + ".")
            if xau:
                c["hop"].append(_hop("loi_khuyen", "Cửa, phòng ngủ, bếp chưa cùng nhịp",
                                     f"Cặp {', '.join(x['cap'] for x in xau)} đang ở du niên kém. Phần dễ đổi nhất là miệng bếp và đầu giường — quay về phía hợp với bạn."))
        dau_tien = True
        for d in sorted(bc_luan["dien_giai"]["dau_hieu"], key=lambda d: not d.get("veto")):
            if not d["tot"]:
                c["hop"].append(_hop("luu_y", ("Trước hết: " if d.get("veto") and dau_tien else "") + d["tieu_de"], d["noi_dung"], d["goi_y"],
                                     viec=d.get("viec") or None, veto=True if d.get("veto") else None))
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
        c["doan"].append("Mỗi phòng xét hai lớp: du niên của phía đó với bạn (Bát trạch) và cặp sao sơn–hướng theo năm xây (Huyền Không, nếu có). "
                         "Phòng nào 'cần chủ động' không có nghĩa là bỏ phòng — thường chỉ cần đổi cách dùng.")
    else:
        c["thieu"] = "can_bo_cuc"
        c["doan"].append(kb.mau("can_bo_cuc"))
    if bang:
        tot = sorted([h for h in pt.HUONG if bang[h] in pt.CAT], key=lambda h: _UU_TIEN_DU_NIEN.index(bang[h]))
        kem = sorted([h for h in pt.HUONG if bang[h] not in pt.CAT], key=lambda h: -_UU_TIEN_DU_NIEN.index(bang[h]))
        goi = [("cua_chinh", f"Cửa chính / lối vào: phía {tot[0]} ({bang[tot[0]]})"),
               ("phong_ngu_chinh", f"Phòng ngủ chính, đầu giường: phía {next((h for h in tot if bang[h] == 'Diên Niên'), tot[0])}"),
               ("bep", f"Bếp: thân bếp đặt phía kém ({kem[0]} {bang[kem[0]]}), miệng bếp quay về phía {next((h for h in tot if bang[h] == 'Thiên Y'), tot[0])}"),
               ("ban_tho", f"Bàn thờ, bàn học: phía {next((h for h in tot if bang[h] == 'Phục Vị'), tot[-1])} ({bang[next((h for h in tot if bang[h] == 'Phục Vị'), tot[-1])]})"),
               ("ve_sinh", f"Nhà vệ sinh, kho: phía {kem[0]} hoặc {kem[1]}")]
        c["goi_y_phong"] = [{"phong": p, "ten": _TEN_PHONG.get(p, p), "goi_y": g} for p, g in goi]
        if not c["hop"]:
            c["hop"].append(_hop("loi_khuyen", "Ba chỗ quan trọng nhất", f"Cửa về {tot[0]}; đầu giường về {goi[1][1].split('phía ')[1]}; miệng bếp về {goi[2][1].split('quay về phía ')[1]}. Ba điểm này sách xưa gọi là cửa – chủ – bếp."))
        c["can_cu"].append(("Theo mệnh bạn" if mq else "Theo trạch") + ": " + "; ".join(f"{h} {bang[h]}" for h in pt.HUONG) + ".")
    c["nhan_muc"] = kb.nhan_muc(c["muc"]) if c["muc"] else None
    _ap_tran_muc(c, _veto(bc_luan))
    c["tom_tat"] = (f"{len(c['phong'])} phòng đã khai: " + ", ".join(f"{p['ten'].lower()} {kb.nhan_muc(p['muc']).lower()}" for p in c["phong"]) + "."
                    if c["phong"] else "Chưa khai bố cục — dưới đây là gợi ý đặt phòng theo mệnh của bạn.")
    c["cau_tu_soi"] = k["tu_soi"][1] if len(k.get("tu_soi", [])) > 1 else None
    return c


# ----------------------------------------------------------------------------- chương 4
def _chuong_nam_nay(mq, sinh, huong, b, bc_luan, ngay_xem: dt.date) -> dict:
    c = {"ma": "nam_nay", **kb.chuong("nam_nay"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": [], "han_nam": [], "ba_thang": []}
    t_utc = dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - dt.timedelta(hours=7)
    nam = hk.nam_theo_lap_xuan(t_utc)
    hn = tdg_luan.han_nam_luan(nam)
    c["han_nam"] = [{k2: v for k2, v in x.items()} for x in hn["huong_tranh"]]
    c["can_cu"].append(f"Năm {nam} ({hn['can_chi']}), {hn['moc']} Phương tránh: " + "; ".join(f"{x['ten']} {x['phuong']}" for x in c["han_nam"]) + ".")
    phuong_tranh = {x["phuong"] for x in c["han_nam"]}
    cham = []
    if huong and huong in phuong_tranh:
        cham.append(f"phía cửa ({huong})")
    for v in (bc_luan or {}).get("da_tinh", {}).get("vi_tri", []):
        if v["cung"] in phuong_tranh and v["phong"] in ("phong_ngu_chinh", "bep"):
            cham.append(f"{v['ten'].lower()} ({v['cung']})")
    ten_tranh = ", ".join(f"{x['ten']} ({x['phuong']})" for x in c["han_nam"])
    if cham:
        c["hop"].append(_hop("luu_y", f"Năm {nam}: phía đang có sao năm", f"Năm nay {', '.join(cham)} trùng phía sách xưa khuyên giữ yên.",
                             "Không đục phá, không động thổ phía đó trong năm; sửa nhỏ, dọn gọn thì được."))
        muc_nam = "can_chu_dong"
    else:
        c["hop"].append(_hop("diem_manh", f"Năm {nam}: cửa và phòng chính không trùng phía tránh",
                             f"Các phía năm nay nên giữ yên là {ten_tranh}. Cửa chính và phòng chính của bạn không nằm ở đó."))
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
        c["can_cu"].append(f"Lưu niên {nam}: {ln['sao_tam']} nhập trung, sao {sao_nam_cua} tới cung cửa ({huong}). Lưu nguyệt: "
                           + "; ".join(f"tháng {x['chi_thang']} sao {x['sao_tai_cua']}" for x in c["ba_thang"]) + " (tháng theo tiết khí).")
    thuan_th = [x for x in c["ba_thang"] if x["muc"] == "thuan"]
    giu = [x for x in c["ba_thang"] if x["muc"] == "can_chu_dong"]
    nd = (f"Tháng {thuan_th[0]['chi_thang']} là tháng thuận để sửa sang, kê lại phía cửa. " if thuan_th else "Ba tháng tới không có tháng nổi bật để sửa lớn phía cửa. ") \
        + (f"Tháng {', '.join(x['chi_thang'] for x in giu)} nên giữ yên phía cửa." if giu else "")
    c["hop"].append(_hop("thoi_diem", "3 tháng tới (theo tiết khí)", nd.strip(), muc=_gop_muc(*mucs)))
    if sinh:
        tl = tdg_luan.xem_tuoi_lam_nha(sinh["nam"], nam, sinh["ngay"].month if sinh.get("ngay") else None, sinh["ngay"].day if sinh.get("ngay") else None)
        c["tuoi_lam_nha"] = {k2: tl[k2] for k2 in ("tuoi_mu", "ket_luan", "nam_thuan", "kim_lau", "hoang_oc", "tam_tai", "uoc_luong_nam_sinh")}
        c["hop"].append(_hop("thoi_diem", f"Tuổi làm nhà năm {nam}", tl["ket_luan"]["chu"] + (f" Năm thuận gần nhất theo tuổi: {', '.join(str(x['nam']) for x in tl['nam_thuan'][:2])}." if tl["ket_luan"]["ma"] != "thuan" and tl["nam_thuan"] else ""),
                             muc="thuan" if tl["ket_luan"]["ma"] == "thuan" else "can_bang"))
        c["can_cu"].append(tl["cach_tinh"])
    c["muc"] = _gop_muc(muc_nam, *mucs)
    c["nhan_muc"] = kb.nhan_muc(c["muc"])
    c["tom_tat"] = f"Năm {nam} ({hn['can_chi']}): phía giữ yên là {ten_tranh}. Ba tháng tới: " + ", ".join(f"tháng {x['chi_thang']} {x['nhan_muc'].lower()}" for x in c["ba_thang"]) + "."
    c["doan"] = ["Sao năm và sao tháng là lớp khí theo thời gian chồng lên nhà — dùng để chọn lúc sửa chữa, động thổ, dọn phòng. "
                 "Việc cần thiết cho an toàn (điện, nước, dột) thì làm ngay, không chờ tháng."]
    c["cau_tu_soi"] = "Trong ba tháng tới bạn định sửa hay kê lại chỗ nào? Có rơi vào phía đang cần giữ yên không?"
    return c


# ----------------------------------------------------------------------------- chương 5
def _chuong_viec_nen_lam(c1, c2, c3, c4) -> dict:
    c = {"ma": "viec_nen_lam", **kb.chuong("viec_nen_lam"), "muc": None, "nhan_muc": None, "hop": [], "doan": [], "can_cu": [], "hanh_dong": []}
    lam, cho, tranh = [], [], []
    for h in c1.get("hop", []):
        if h["loai"] == "loi_khuyen" and len(lam) < 2:
            lam.append(f"Kê đầu giường hoặc bàn làm việc về phía {h['tieu_de'].split(' — ')[0]}.")
    for h in c3.get("hop", []):
        if h["loai"] == "luu_y" and h.get("huong_xu_ly") and len(lam) < 4:
            lam.append(h["huong_xu_ly"])
    for h in c2.get("hop", []):
        if h["loai"] == "luu_y" and h.get("huong_xu_ly") and len(lam) < 4:
            lam.insert(0, h["huong_xu_ly"])
    for x in c4.get("ba_thang", []):
        if x["muc"] == "thuan" and len(cho) < 2:
            cho.append(f"Sửa sang, kê lại phía cửa vào tháng {x['chi_thang']} (theo tiết khí).")
    if c4.get("tuoi_lam_nha") and c4["tuoi_lam_nha"]["ket_luan"]["ma"] != "thuan" and c4["tuoi_lam_nha"]["nam_thuan"]:
        cho.append(f"Việc lớn (xây, sửa toàn bộ) dân gian thường chờ năm {c4['tuoi_lam_nha']['nam_thuan'][0]['nam']}.")
    if not cho:
        cho.append("Việc lớn chờ lúc nhà cửa, tiền bạc và người trong nhà cùng sẵn sàng — không chờ vì sao.")
    for x in c4.get("han_nam", [])[:3]:
        tranh.append(f"Không đục phá, động thổ phía {x['phuong']} ({x['ten']}) trong năm nay.")
    for h in c1.get("hop", []):
        if h["loai"] == "luu_y":
            tranh.append(h["huong_xu_ly"].replace("Để kho", "Không kê đầu giường, bàn làm việc ở phía kém; để kho"))
            break
    c["hanh_dong"] = [{"ma": "lam_ngay", "nhan": "Làm ngay (chỉ cần kê lại)", "viec": lam[:4] or ["Dọn gọn phía cửa chính, mở sáng, thông gió."]},
                      {"ma": "cho_luc", "nhan": "Chờ đúng lúc", "viec": cho[:4]},
                      {"ma": "tranh", "nhan": "Tránh trong năm nay", "viec": tranh[:4] or ["Không động thổ phía đang có sao năm."]}]
    c["hop"].append(_hop("cot_loi", "Nếu chỉ làm một việc", lam[0] if lam else "Dọn gọn phía cửa chính, mở sáng, thông gió."))
    # Q5: cùng những việc ấy xếp theo CHI PHÍ (0 đồng · ít tiền · sửa chữa) — việc của dấu hiệu đã xác nhận đi trước.
    theo = {"khong_ton": [], "it_tien": [], "sua_chua": []}
    for ch in (c2, c3):
        for h in ch.get("hop", []):
            for v in h.get("viec") or []:
                if v["lam"] not in theo[v["chi_phi"]] and len(theo[v["chi_phi"]]) < 5:
                    theo[v["chi_phi"]].append(v["lam"])
    for x in lam:
        if x not in theo["khong_ton"] and len(theo["khong_ton"]) < 5:
            theo["khong_ton"].append(x)
    if not theo["it_tien"]:
        theo["it_tien"].append("Thêm đèn ấm và một chậu cây ở lối vào; rèm cho cửa sổ phòng ngủ hướng nắng.")
    if not theo["sua_chua"]:
        theo["sua_chua"].append("Chưa thấy việc gì phải sửa chữa — giữ nguyên, chỉ kê lại là đủ.")
    from app.luangiai.phongthuy_bo_cuc import CHI_PHI  # noqa: PLC0415
    c["hanh_dong_chi_phi"] = [{"ma": k2, "nhan": CHI_PHI[k2], "viec": v} for k2, v in theo.items()]
    c["doan"] = [kb.mau("khong_vat_pham"),
                 "Có việc là của nhà (kê lại, sửa), có việc là của thói quen (dọn, đóng cửa, giờ giấc). Nhóm 0 đồng phần lớn là việc của thói quen — làm trước, rồi mới tính đến sửa."]
    c["tom_tat"] = "Ba nhóm việc theo thời điểm (làm ngay · chờ đúng lúc · tránh trong năm) và ba mức theo chi phí (0 đồng · ít tiền · sửa chữa)."
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
    ten_phong = {p: bo_cuc.TEN_PHONG[p] for p in g["phong"]}
    cung_phong = {v["phong"]: v["cung"] for v in (bc_luan or {}).get("da_tinh", {}).get("vi_tri", [])}
    if huong and "cua_chinh" not in cung_phong:
        cung_phong["cua_chinh"] = huong
    da_khai = {d["ma"]: d for d in (bc_luan or {}).get("dien_giai", {}).get("dau_hieu", [])}
    dau_hieu = [{"ma": x, "hoi": bo_cuc.DAU_HIEU[x]["hoi"], "co": x in da_khai, "veto": x in bo_cuc.dau_hieu_veto(),
                 "sao_kich_hoat": g["sao_kich_hoat"].get(x, [])} for x in g["dau_hieu"] if x in bo_cuc.DAU_HIEU]
    tu_khoa = [t.lower() for t in ten_phong.values()] + [d["tieu_de"].lower() for d in da_khai.values() if d["ma"] in g["dau_hieu"]]
    hop = []
    for c in chuong:
        for h in c.get("hop", []):
            if any(t in h["tieu_de"].lower() for t in tu_khoa) and len(hop) < 4:    # chỉ so tiêu đề hộp (phòng / dấu hiệu)
                hop.append({**h, "tu_chuong": c["ma"]})
    nam_sao = []
    for p, cung in cung_phong.items():
        if p in g["phong"] and cung != "Trung cung":
            q = _CUNG_QUAI[cung]
            toi = [n for n in range(nam, nam + 6) if hk.luu_nien(n)["cung"][q] in g["sao"]]
            if toi:
                nam_sao.append({"phong": p, "ten": bo_cuc.TEN_PHONG[p], "cung": cung, "nam": toi,
                                "sao": [hk.luu_nien(n)["cung"][q] for n in toi]})
    return {"ma": ma, "ten": ten, "phong": [{"ma": p, "ten": t, "cung": cung_phong.get(p)} for p, t in ten_phong.items()],
            "dau_hieu": dau_hieu, "hop": hop, "nam_sao_toi": nam_sao,
            "loi": "Lớp lý khí (sao năm) chỉ nói lúc nào nên chủ động hơn với phòng đó — nền vẫn là ánh sáng, gió, lối đi và các dấu hiệu bên trên."}


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
    cot_loi = []
    # Q1: dấu hiệu veto đã xác nhận luôn đứng đầu "Điều quan trọng nhất"; rồi hộp theo ý định; rồi như cũ.
    if veto:
        h0 = next((h for h in c2["hop"] if h.get("veto")), None)
        if h0:
            cot_loi.append({**h0, "tu_chuong": c2["ma"]})
    if theo_y_dinh and theo_y_dinh["hop"] and len(cot_loi) < 3:
        h1 = theo_y_dinh["hop"][0]
        if h1["tieu_de"] not in {x["tieu_de"] for x in cot_loi}:
            cot_loi.append(h1)
    for c in (c1, c2, c4):
        for h in c.get("hop", []):
            if h["loai"] in ("cot_loi", "luu_y") and len(cot_loi) < 3 and h["tieu_de"] not in {x["tieu_de"] for x in cot_loi}:
                cot_loi.append({**h, "tu_chuong": c["ma"]})
                break
    thieu = [x for x, ok in (("sinh", bool(mq)), ("huong", bool(huong)), ("nam_xay", bool(b)), ("bo_cuc", bool(bc_luan))) if not ok]
    da_tinh = {"menh_quai": {k: mq[k] for k in ("quai", "so", "nhom", "nam_tinh", "moc_nam")} if mq else None,
               "huong_nha": huong, "do_huong": do, "trach": pt.trach(huong) if huong else None,
               "huyen_khong": ({"van": b["van"], "nam_xay": b["nam_xay"], "cuc": b["cuc"], "cuc_ten": b["cuc_ten"], "toa": b["toa"]["son"],
                                "huong": b["huong"]["son"], "cap_huong": b["cap_huong"], "cap_toa": b["cap_toa"],
                                "cung": [{k: x[k] for k in ("cung", "phuong", "van", "son", "huong")} for x in b["cung"]]} if b else None),
               "thanh_vien": tvs, "ngay_xem": ngay_xem.isoformat()}
    # KC-1: khoá rỗng không ghi (khuôn chung; web coi thiếu = None).
    chuong = [{k: v for k, v in c.items() if v is not None} for c in (c1, c2, c3, c4, c5)]
    da_tinh["veto_da_xac_nhan"] = [{"ma": d["ma"], "tieu_de": d["tieu_de"]} for d in veto]
    da_tinh["goc_nhin"] = goc_nhin
    return {"mo_dun": "phongthuy", "phien_ban": "doi_song_1", "phai": "bat_trach_huyen_khong", "ten": "Nhà của bạn",
            "cot_loi": cot_loi, "chuong": chuong, "da_tinh": da_tinh, "thieu": thieu, "ket": kb.mau("ket"),
            "theo_y_dinh": theo_y_dinh, "nguyen_tac": "Hình thế là nền, lý khí là nhịp: dấu hiệu nhìn thấy và du niên với người ở quyết định mức; sao năm, sao tháng chỉ quyết định thời điểm.",
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
    viec = {"thuan": ["Sửa sang, kê lại phía cửa trong tháng này là hợp.", "Dọn thoáng lối vào, mở sáng."],
            "can_bang": ["Sửa nhỏ, dọn gọn được; việc lớn phía cửa để tháng thuận.", "Giữ lối vào sạch, đủ sáng."],
            "can_chu_dong": ["Tháng này giữ yên phía cửa: không đục phá, không động thổ.", "Chỉ dọn gọn, không kê dời đồ lớn."]}[th["muc"]]
    t_utc = dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - dt.timedelta(hours=7)
    return {"ngay_xem": ngay_xem.isoformat(), "huong": huong, "do_huong": do, "nam": hk.nam_theo_lap_xuan(t_utc),
            "phuong_tranh": [{"ten": x["ten"], "phuong": x["phuong"]} for x in c4["han_nam"]],
            "cua_trung_phuong_tranh": any(x["phuong"] == huong for x in c4["han_nam"]),
            "thang": {**th, "y": ts.get(th["muc"], th.get("y", ""))}, "ba_thang": c4["ba_thang"], "viec": viec,
            "huyen_khong": ({"cuc_ten": b["cuc_ten"], "van": b["van"], "cap_huong": {k: b["cap_huong"][k] for k in ("ma", "ten", "muc")}} if b else None),
            "tom_tat": c4["tom_tat"], **kb.meta()}
