# -*- coding: utf-8 -*-
"""KD-ĐS — RULES: đọc quẻ Kinh Dịch bằng lời đời thường, tất định, không LLM.

Từ CÙNG một quẻ đã ra (gói bằng chứng của `hoidap.kinhdich`), dựng:
  - mức Thuận lợi / Cân bằng / Cần chủ động theo phái đang đọc (lời kinh làm chủ · thể–dụng Mai Hoa · dụng thần Lục Hào),
  - hộp nổi bật (cốt lõi · điểm mạnh · lưu ý kèm hướng xử lý · lời khuyên · thời điểm), ba nhóm việc nên làm theo chủ đề,
  - "Vì sao nói vậy" (thuật ngữ chỉ ở đây), lời kinh nguyên văn (gập), góc nhìn ba phái, ứng kỳ (nhịp gợi ý),
  - chủ đề (chip) + câu hỏi tiếp; làm rõ câu hỏi TRƯỚC khi gieo khi câu mơ hồ về dụng thần (mua/bán, người ấy, hai việc).
Mọi câu chữ lấy từ KB (`kinhdich_doi_song.json`, `kinhdich_kb.json`, `kinhdich_hao.json`); không thêm dữ kiện.
"""
from __future__ import annotations

import datetime as dt
import re

from app.calc import kinhdich_maihoa as mh
from app.calc.kinhdich_vendor import TRI_NGU_HANH
from app.hoidap import chung
from app.kb import kinhdich_doi_song_kb as kb
from app.kb import kinhdich_kb as kbq

LV_TEN = {"cong_viec": "công việc", "tinh_cam": "tình cảm", "gia_dinh": "gia đình", "tien_bac": "tiền bạc",
          "hoc_hanh": "học hành"}
QUAN_HE_TEN = {"dung_sinh_the": "hoàn cảnh đỡ bạn", "the_khac_dung": "bạn nắm được việc, nhưng tốn công",
               "ty_hoa": "hai bên ngang nhau, thuận theo nhịp", "the_sinh_dung": "bạn phải bỏ ra nhiều",
               "dung_khac_the": "hoàn cảnh đang ép bạn"}
# Hoà điểm: người cụ thể trước (như thứ tự chọn dụng thần: người → tiền → giấy tờ → công danh → khác).
_UU_TIEN = ["con_cai", "gia_dinh", "hon_nhan", "tinh_cam", "ban_be", "mua_nha", "ban_nha", "tien_no", "mat_do", "kinh_doanh",
            "hop_tac", "thang_tien", "chuyen_viec", "tranh_chap", "thi_cu", "giay_to", "xe_co", "suc_khoe", "di_xa"]


# ----------------------------------------------------------------------------- chủ đề
def _diem_chu_de(t: str) -> dict[str, int]:
    diem: dict[str, int] = {}
    for ma, m in kb.chu_de_tat_ca().items():
        n = sum(1 for k in m.get("tu_khoa", []) if re.search(r"(?<!\w)" + re.escape(k) + r"(?!\w)", t))
        if n:
            diem[ma] = n
    return diem


def chu_de_tu_cau(t: str) -> str:
    """Mã chủ đề từ câu đã chuẩn hoá (bỏ dấu). Nhiều chủ đề khớp → điểm cao hơn thắng, hoà thì theo thứ tự ưu tiên."""
    diem = _diem_chu_de(t)
    if not diem:
        return "khac"
    tot = max(diem.values())
    ung = [m for m in diem if diem[m] == tot]
    return next((m for m in _UU_TIEN if m in ung), ung[0])


def _goc(ma: str) -> str:
    m = kb.chu_de(ma)
    return (m or {}).get("goc") or ma


def can_lam_ro(t: str, chu_de: str | None, truong_phai: str | None) -> dict | None:
    """Câu còn mơ hồ về dụng thần → hỏi lại MỘT câu (tất định) trước khi gieo. Đã chọn chủ đề → không hỏi."""
    if chu_de:
        return None
    if re.search(r"mua hay ban|ban hay mua|mua hoac ban|ban hoac mua", t):
        return {"ma": "mua_ban", **kb.lam_ro("mua_ban")}
    ma = chu_de_tu_cau(t)
    m = kb.chu_de(ma) or {}
    if truong_phai == "luc_hao" and m.get("hoi_dung_than"):
        lr = kb.lam_ro("tinh_cam")
        for x in lr["lua_chon"]:
            x["ma"] = x["ma"].replace("{goc}", ma)
        return {"ma": "tinh_cam", **lr}
    if re.search(r"(?<!\w)(hay|hoac)(?!\w)", t):
        diem = _diem_chu_de(t)
        dts = {}
        for x in diem:
            cd = kb.chu_de(x) or {}
            dts.setdefault(cd.get("dung_than"), x)
        if len(dts) >= 2:
            lr = kb.lam_ro("hai_viec")
            lr["lua_chon"] = [{"ma": x, "nhan": (kb.chu_de(x) or {}).get("ten", x)} for x in dts.values()][:3]
            return {"ma": "hai_viec", **lr}
    return None


# ----------------------------------------------------------------------------- mức
def muc_loi_kinh(han: str) -> str:
    """Mức từ chữ đoán trong lời kinh làm chủ: 吉 亨 无咎 无不利 悔亡 利 → thuận · 凶 吝 厲 悔 不利 → cần chủ động · lẫn / không có → cân bằng."""
    s = (han or "").replace("無", "无").replace("厲", "厉")
    pos = 0
    for tok in ("无不利", "无咎", "悔亡"):
        pos += s.count(tok)
        s = s.replace(tok, "")
    neg = s.count("不利")
    s = s.replace("不利", "")
    pos += s.count("吉") + s.count("亨") + s.count("利")
    neg += s.count("凶") + s.count("吝") + s.count("厉") + s.count("悔")
    if pos and not neg:
        return "thuan"
    if neg and not pos:
        return "can_chu_dong"
    return "can_bang"


_DIEM = {"vượng": 1, "bình": 0, "suy": -1}


def muc_luc_hao(pt: dict) -> tuple[str, list[str]]:
    """Mức theo dụng thần (vượng suy · động hoá · nguyên/kỵ thần động · không/phá/mộ). → (mức, lý do đời thường)."""
    d = pt.get("dung_than")
    if not d:
        return "can_bang", []
    if d.get("phuc") or not d.get("vi_tri"):
        return "can_bang", [kb.mau("phuc_than") or "dụng thần chưa lộ"]
    vt = d["vi_tri"]
    h = next((x for x in vt if x.get("dong")), vt[0])
    diem, ly = _DIEM.get(h.get("tong", "bình"), 0), []
    ly.append(f"hào đại diện ({h['dia_chi']} {h['ngu_hanh']}) đang {h.get('tong', 'bình')} theo tháng và ngày")
    if h.get("dong") and h.get("hoa"):
        loai = h["hoa"]["loai"]
        k = kb.hoa(loai) or {}
        diem += int(k.get("muc", 0))
        ly.append(f"hào động hoá {h['hoa']['dia_chi']} — {loai}: {k.get('doi_thuong', '')}".rstrip(": "))
    if d.get("ky_than", {}).get("dong") and h.get("tong") != "vượng":
        diem -= 1
        ly.append("hào kỵ thần (lực cản) đang động")
    if d.get("nguyen_than", {}).get("dong"):
        diem += 1
        ly.append("hào nguyên thần (nguồn tiếp sức) đang động")
    for ma in ("tuan_khong", "nguyet_pha", "nhap_mo"):
        if h.get(ma):
            diem = min(diem, 0)
            ly.append(kb.trang_thai(ma) or ma)
    return ("thuan" if diem >= 1 else "can_chu_dong" if diem <= -1 else "can_bang"), ly


# ----------------------------------------------------------------------------- dựng gói
def _nom_na(s: str | None) -> str | None:
    if not s:
        return None
    s = s.split("Nôm na:", 1)[1] if "Nôm na:" in s else s
    s = s.strip()
    return s[0].upper() + s[1:] if s else None


def _hop(loai: str, tieu_de: str, noi_dung: str, huong_xu_ly: str | None = None) -> dict:
    h = {"loai": loai, "tieu_de": tieu_de, "noi_dung": noi_dung.strip()}
    if huong_xu_ly:
        h["huong_xu_ly"] = huong_xu_ly.strip()
    return h


def _goc_nhin_nghia_ly(que: dict, goi: dict, lv: str | None) -> dict:
    loi = [m for m in goi["muc"] if m["loai"] == "loi_kinh"]
    chu = next((m for m in loi if m.get("chu")), loi[0] if loi else None)
    muc = muc_loi_kinh(chu["han"]) if chu else "can_bang"
    ban = que["quai_ban"]
    q = kbq.que(ban["so_king_wen"]) or {}
    dong = que["hao_dong"]
    can_cu = [f"Quẻ bản {ban['ten']} {ban.get('ten_han', '')}".strip() + (f", hào động {', '.join(map(str, dong))}" if dong else ", không hào động")
              + (f", quẻ biến {que['quai_bien']['ten']}" if que.get("quai_bien") else "") + "."]
    if chu:
        can_cu.append(f"Lời làm chủ (quy tắc Chu Hy): {chu['tieu_de']} — 「{chu['han']}」 {chu['dich']}")
    if lv and q.get("linh_vuc", {}).get(lv):
        can_cu.append(f"Riêng về {LV_TEN[lv]}: {q['linh_vuc'][lv]}")
    return {"muc": muc, "nhan": kb.nhan_muc(muc), "tom_tat": q.get("y_chinh", ""), "loi_chu": chu, "can_cu": can_cu}


def _goc_nhin_mai_hoa(que: dict, mai_hoa: dict | None) -> dict | None:
    dong = que["hao_dong"]
    if len(dong) != 1:
        return None
    thuong, ha = que["quai_ban"]["thuong_quai"], que["quai_ban"]["ha_quai"]
    tc = (mai_hoa or {}).get("toan_cuc") or mh.toan_cuc(thuong, ha, dong[0])
    td = kbq.the_dung(tc["quan_he"][0]["quan_he"]) or {}
    qh = "; ".join(f"{x['vai'].replace('_', ' ')} {x['quai']} ({TRI_NGU_HANH[x['quai']]}): {QUAN_HE_TEN.get(x['quan_he'], x['quan_he'])}"
                   for x in tc["quan_he"])
    can_cu = [f"Thể {tc['the']} ({tc['the_ngu_hanh']}) là bạn; Dụng {tc['dung']} là việc. {td.get('ten', '')}: {td.get('y_nghia', '')}",
              f"Toàn cục so với Thể — {qh}."]
    return {"muc": tc["muc"], "nhan": kb.nhan_muc(tc["muc"]), "the": tc["the"], "dung": tc["dung"], "ho": tc["ho"],
            "bien": tc["bien"], "quan_he": tc["quan_he"], "tom_tat": QUAN_HE_TEN.get(tc["quan_he"][0]["quan_he"], ""),
            "luu_y": td.get("luu_y"), "ung_ky_so": (mai_hoa or {}).get("ung_ky_so"), "can_cu": can_cu}


def _goc_nhin_luc_hao(pt: dict | None) -> dict | None:
    if not pt:
        return None
    muc, ly = muc_luc_hao(pt)
    d, tg = pt.get("dung_than") or {}, pt["thoi_gian"]
    can_cu = [f"Tháng {tg['chi_thang']}, ngày {tg['can_ngay']} {tg['chi_ngay']}, tuần không {'/'.join(tg['tuan_khong'])}."]
    if d:
        vt = d.get("vi_tri") or []
        if vt:
            h = vt[0]
            can_cu.append(f"Dụng thần {d['ten']} ở hào {h['vi_tri']} ({h['dia_chi']} {h['ngu_hanh']}), lục thú {h['luc_thu']}; "
                          f"nguyệt lệnh: {h['nguyet_lenh']}, nhật thần: {h['nhat_than']}.")
        elif d.get("phuc_than"):
            p = d["phuc_than"]
            can_cu.append(f"Dụng thần {d['ten']} phục dưới hào {p['vi_tri']} ({p['dia_chi']} {p['ngu_hanh']}), phi thần {p['phi_than']}.")
        for vai, nhan in (("nguyen_than", "Nguyên thần"), ("ky_than", "Kỵ thần"), ("cuu_than", "Cừu thần")):
            x = d.get(vai)
            if x:
                can_cu.append(f"{nhan} {x['ten']}: hào {', '.join(map(str, x['vi_tri'])) or '—'}"
                              + (f", động {', '.join(map(str, x['dong']))}" if x["dong"] else "") + ".")
    can_cu += [s[0].upper() + s[1:] + "." for s in ly if s and not s.endswith(".")]
    return {"muc": muc, "nhan": kb.nhan_muc(muc), "dung_than": d.get("ten") if d else None, "phuc": bool(d.get("phuc")) if d else None,
            "luc_thu": pt["luc_thu"], "hao": pt["hao"], "ung_ky": pt.get("ung_ky", []), "ly_do": ly, "can_cu": can_cu,
            "tom_tat": (ly[0][0].upper() + ly[0][1:]) if ly else ""}


def _thoi_diem(que: dict, gn: dict, chinh: str, thoi_diem: dt.datetime | dt.date | None) -> tuple[str, list[dict]]:
    ung_ky = (gn.get("luc_hao") or {}).get("ung_ky") or []
    phan: list[str] = []
    if chinh == "luc_hao" and ung_ky:
        u = ung_ky[0]
        d = dt.date.fromisoformat(u["ngay_gan_nhat"])
        phan.append(f"Mốc gần nhất đáng để ý: ngày {u['chi']} ({d.day:02d}/{d.month:02d}), {u['ly_do']} — sau {u['sau_bao_nhieu_ngay']} ngày.")
    mhk = (gn.get("mai_hoa") or {}).get("ung_ky_so")
    if chinh == "mai_hoa" and mhk:
        phan.append(mhk["y"])
    if que["hao_dong"]:
        vt = que["hao_dong"][-1]
        phan.append(f"Hào động ở {kb.vi_tri_hao(vt) or f'vị trí {vt}'}.")
    else:
        phan.append(kb.mau("khong_hao_dong") or "")
    if ung_ky and chinh != "luc_hao":
        u = ung_ky[0]
        phan.append(f"Theo Lục Hào, mốc gần nhất là ngày {u['chi']} ({u['ngay_gan_nhat'][8:10]}/{u['ngay_gan_nhat'][5:7]}).")
    return " ".join(p for p in phan if p), ung_ky


def doc_que(que: dict, pl: dict, goi: dict, *, mai_hoa: dict | None = None, luc_hao: dict | None = None,
            thoi_diem: dt.datetime | dt.date | None = None, chu_de: str | None = None) -> dict:
    """Gói đọc quẻ đời thường từ quẻ đã ra + gói bằng chứng. Phái chính = `pl["truong_phai"]`."""
    ma = chu_de or "khac"
    cd = kb.chu_de(ma) or kb.chu_de("khac") or {"ten": "Việc khác", "hanh_dong": {}, "cau_tiep": [], "linh_vuc": None}
    lv = pl.get("linh_vuc") or cd.get("linh_vuc")
    chinh = pl.get("truong_phai") or "nghia_ly"
    gn = {"chinh": chinh, "nghia_ly": _goc_nhin_nghia_ly(que, goi, lv), "mai_hoa": _goc_nhin_mai_hoa(que, mai_hoa),
          "luc_hao": _goc_nhin_luc_hao(luc_hao)}
    muc = (gn.get(chinh) or gn["nghia_ly"])["muc"]
    ban = que["quai_ban"]
    q = kbq.que(ban["so_king_wen"]) or {}
    qv = kbq.que_van(ban["so_king_wen"]) or {}
    chu = gn["nghia_ly"]["loi_chu"]
    ten_viec = cd["ten"].split(" (")[0].lower()
    ket_luan = f"Về việc {ten_viec}: {kb.muc(muc).get('ket_luan', '')}".strip()

    # ---- hộp nổi bật
    hop = [_hop("cot_loi", f"Quẻ {ban['ten']} — {kb.nhan_muc(muc)}", ket_luan)]
    manh = [g for g in ("mai_hoa", "luc_hao") if gn.get(g) and gn[g]["muc"] == "thuan"]
    if muc == "thuan" or manh:
        nd = gn["nghia_ly"]["tom_tat"] if muc == "thuan" else gn[manh[0]]["tom_tat"] or gn["nghia_ly"]["tom_tat"]
        hop.append(_hop("diem_manh", "Điểm đang có lợi", nd))
    tranh = (cd.get("hanh_dong") or {}).get("can_chu_dong") or []
    luu_y = q.get("mat_toi", "")
    if ma == "suc_khoe":
        luu_y = (luu_y + " " + (kb.mau("suc_khoe") or "")).strip()
    if luu_y:
        hop.append(_hop("luu_y", "Điều dễ vấp", luu_y, tranh[0] if tranh else None))
    lk = q.get("loi_khuyen", "")
    if lv and q.get("linh_vuc", {}).get(lv):
        lk = (lk + " " + q["linh_vuc"][lv]).strip()
    if lk:
        hop.append(_hop("loi_khuyen", "Cách làm cho đúng", lk))
    td_van, ung_ky = _thoi_diem(que, gn, chinh, thoi_diem)
    if td_van:
        hop.append(_hop("thoi_diem", "Nhịp thời gian (gợi ý)", td_van))

    # ---- đoạn đời thường
    doan = []
    nn = _nom_na(qv.get("nom_na"))
    doan.append(f"Quẻ {ban['ten']} ({ban.get('ten_han', '')}). " + (nn or q.get("y_chinh", "")))
    if chu and (chu.get("nom_na") or chu.get("y")):
        doan.append("Điểm rơi của quẻ: " + (chu.get("nom_na") or chu.get("y")))
    if que.get("quai_bien"):
        qb = kbq.que(que["quai_bien"]["so_king_wen"]) or {}
        if qb.get("y_chinh"):
            doan.append(f"Việc đang chuyển dần sang quẻ {que['quai_bien']['ten']}: {qb['y_chinh']}")
    if gn["mai_hoa"] and chinh != "mai_hoa":
        doan.append(f"Nhìn theo thể–dụng: {gn['mai_hoa']['tom_tat']}.")
    if gn["luc_hao"] and gn["luc_hao"].get("dung_than") and chinh != "luc_hao" and gn["luc_hao"]["ly_do"]:
        doan.append(f"Nhìn theo hào đại diện cho việc: {gn['luc_hao']['ly_do'][0]}.")

    # ---- ba nhóm việc theo chủ đề, nhóm đúng mức đứng đầu
    thu_tu = [muc] + [m for m in kb.MUC if m != muc]
    hanh_dong = [{"muc": m, "nhan": kb.nhom_hanh_dong(m), "viec": list((cd.get("hanh_dong") or {}).get(m) or [])} for m in thu_tu]

    # ---- vì sao nói vậy
    can_cu = [{"tieu_de": "Thế và Ứng", "noi_dung": kb.the_ung()}]
    for g, ten in (("nghia_ly", "Nghĩa Lý — lời kinh"), ("mai_hoa", "Mai Hoa — thể, dụng, hỗ, biến"), ("luc_hao", "Lục Hào — dụng thần theo ngày tháng")):
        if gn.get(g):
            can_cu.append({"tieu_de": f"{ten} → {gn[g]['nhan']}", "noi_dung": " ".join(gn[g]["can_cu"])})
    loi_kinh = [{k: m.get(k) for k in ("tieu_de", "han", "dich", "y", "nom_na", "thoan", "chu")} for m in goi["muc"] if m["loai"] == "loi_kinh"]

    # ---- câu hỏi tiếp (không gieo lại cùng việc)
    cau = list(cd.get("cau_tiep") or [])[:2]
    lv_khac = next((k for k in LV_TEN if k != lv and q.get("linh_vuc", {}).get(k)), None)
    if lv_khac:
        cau.append(f"Quẻ {ban['ten']} nói gì về {LV_TEN[lv_khac]}?")
    return {"muc": muc, "nhan_muc": kb.nhan_muc(muc), "mo_ta_muc": kb.muc(muc).get("mo_ta", ""), "ket_luan": ket_luan,
            "hop": hop, "doan": doan, "hanh_dong": hanh_dong, "can_cu": can_cu, "cau_tu_soi": q.get("cau_tu_soi"),
            "loi_kinh": loi_kinh, "goc_nhin": gn, "ung_ky": ung_ky, "cau_lien_quan": cau[:3],
            "chu_de": {"ma": ma, "ten": cd["ten"], "dung_than": cd.get("dung_than")},
            "y_dinh_chung": _y_dinh_chung(ma), "goi_mo": _goi_mo(ma),
            "mot_que_mot_viec": kb.mau("mot_que_mot_viec"), **kb.meta()}


def danh_sach_chu_de() -> list[dict]:
    """Chip chủ đề cho web: chỉ chủ đề gốc (bỏ biến thể người ấy nữ/nam)."""
    return [{"ma": ma, "ten": m["ten"], "dung_than": m["dung_than"], "linh_vuc": m.get("linh_vuc")}
            for ma, m in kb.chu_de_tat_ca().items() if not m.get("goc")]


def _y_dinh_chung(ma_chu_de: str) -> str | None:
    from app.kb import y_dinh_chung  # noqa: PLC0415
    return y_dinh_chung.tu_ma_rieng("kinhdich", ma_chu_de)


def _goi_mo(ma_chu_de: str) -> dict | None:
    """KC-3: cùng nỗi băn khoăn này, mảng khác đọc được gì (link trong site, ≤ 3)."""
    from app.kb import y_dinh_chung  # noqa: PLC0415
    mc = y_dinh_chung.tu_ma_rieng("kinhdich", ma_chu_de)
    return y_dinh_chung.goi_mo(mc, "kinhdich") if mc else None
