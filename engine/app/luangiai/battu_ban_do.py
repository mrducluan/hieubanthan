# -*- coding: utf-8 -*-
"""BD-1 — RULES "Bản đồ lá số" Bát tự: 8 chữ của tứ trụ, chạm chữ nào ra nghĩa riêng của chữ ấy TRONG lá số người xem.

Mỗi ô (4 can `c0..c3`, 4 chi `z0..z3`) có bốn lớp, đều ghép từ số ĐÃ TÍNH — không tính lại, không đổi mức nào:
1. `la_gi`  — chữ này là phần nào của bạn: thập thần (bản khí với chi) + người ứng theo giới (KB `battu_kb.thap_than`) +
   hai cách lấy dụng thần nói gì về hành của chữ (`battu_doi_song.phan_tich` — hai cách, không chọn thay) + số lần chữ
   lặp + nét thần sát đời thường (KB đời sống) + tàng can.
2. `o_dau`  — nằm ở trụ nào: phần của đời (Tam Mệnh Thông Hội «年為根 月為苗 日為花 時為實»), quãng tuổi QUY RA NĂM của
   chính người xem (sách: trụ năm tới khoảng 15 tuổi, trụ giờ từ khoảng 50 — hai trụ giữa chung quãng 16–49, không chia đôi
   khi sách không chia), "bạn đang ở quãng này"; chữ dưới trụ ngày = chỗ của người bạn đời (người lớn).
3. `noi_voi` — đang nối với ô nào: quan hệ giữa các trụ đã tính (`battu_mo_rong.quan_he`), lời theo CẶP TRỤ (KB `cap`).
4. `nam`    — năm nào trong 10 năm tới chạm chữ này (`battu_mo_rong.luu_nien`), chỉ nói "chạm vào chuyện gì", KHÔNG mức
   (mức năm tương lai thuộc chương Vận hạn trả phí).
`vi_sao` — thuật ngữ (thập thần, tàng can, trường sinh, nạp âm, thần sát, tên quan hệ) chỉ ở đây.

`noi_bat` — tối đa 3 điều nổi bật của lá số theo luật cố định (chữ lặp, khối hợp, sức tự thân, hành nhiều / thiếu, chữ lộ).
`thoi_gian` (lớp C) — từng năm từ năm sinh tới 10 năm sau + 8 đại vận: năm / vận chạm chữ nào. Năm ĐÃ QUA (từ 16 tuổi) mà hai
cách đọc khác nhau mang `dc` = [mức cách 1, mức cách 2] (đúng hàm của "Cách nào đúng với bạn") để web so câu người dùng kể
— câu trả lời chỉ lưu trên máy người dùng.

Chưa đủ 16 tuổi (`config.TUOI_NGUOI_LON`): không lớp vợ chồng / người yêu. Không gọi LLM, không lưu.
"""
from __future__ import annotations

import collections
import datetime as dt

from app import config, ngon_ngu
from app.calc import battu as bt_calc
from app.calc import battu_mo_rong as mr_calc
from app.kb import battu_doi_song_kb as kb_ds
from app.kb import battu_kb
from app.kb import nap
from app.kb import ten as _ten
from app.kb.loi import danh_sach, hoa_dau
from app.luangiai import battu_doi_chieu as dc
from app.luangiai import battu_doi_song as bt
from app.luangiai import battu_hien, hoan_canh

PHIEN_BAN = "ban_do_1"
_TEP = "battu_ban_do_kb.json"
SO_NAM_TOI = 10
NAM_MOI_O = 4                       # tối đa số năm "chạm" hiện ở một ô
MA_O = ("c0", "c1", "c2", "c3", "z0", "z1", "z2", "z3")
NHOM_LOAI = {"lục hợp": "hop", "bán hợp": "hop", "tam hợp": "hop", "tam hội": "hop", "can ngũ hợp": "hop",
             "lục xung": "xung", "can tương xung": "xung", "tương hình": "hinh", "tự hình": "hinh",
             "lục hại": "hai", "tương phá": "pha"}
CHUONG_NHOM = {"Tài": "tien_bac", "Quan Sát": "su_nghiep", "Ấn": "hoc_tap", "Thực Thương": "su_nghiep", "Tỷ Kiếp": "quan_he"}
UU_TIEN_LOAI = ("xung", "hinh", "hop", "hai", "pha", "trung")


@nap.nho
def _kb() -> dict:
    try:
        d = nap.doc(_TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _k(*khoa: str):
    x = _kb()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(k)
    return x


def _m(*khoa: str) -> str:
    x = _k("mau", *khoa)
    return x if isinstance(x, str) else ""


def meta() -> dict:
    d = _kb()
    return {"trang_thai": d.get("trang_thai", "nhap_ban_bien_tap"), "source_id": d.get("source_id", "battu_ban_do"),
            "school_id": d.get("school_id", "tu_binh")}


def _t(nhom: str, v: str) -> str:
    return _ten.ten(nhom, v)


def _thuong(s: str) -> str:
    s = (s or "").strip().rstrip(".")
    return s[:1].lower() + s[1:] if s else s


def _nhom(tt: str) -> str:
    return bt.TT_NHOM.get(tt, "Tỷ Kiếp")


def _nhom_y(g: str) -> str:
    return _k("nhom", g, "y") or g


def _tru_kb(i: int) -> dict:
    return _k("tru", str(i)) or {}


def _ten_tru(i: int) -> str:
    return _tru_kb(i).get("ten") or ("trụ năm", "trụ tháng", "trụ ngày", "trụ giờ")[i]


def _ngan(i: int, hang: str, lon: bool) -> str:
    t = _tru_kb(i)
    if i == 2 and hang == "chi":
        return t.get("ngan_duoi" if lon else "ngan_duoi_tre") or t.get("ngan", "")
    if i == 3 and not lon:
        return t.get("ngan_tre") or t.get("ngan", "")
    return t.get("ngan", "")


def _nguoi(tt: str | None, g: str | None, gioi: str, lon: bool) -> str | None:
    """Người ứng với chữ (lục thân Tử Bình). Người lớn: bảng riêng KB `nguoi` (vai vợ / chồng nói ở câu `sao_phoi`);
    chưa đủ tuổi: lời theo nhóm, không vợ chồng / người yêu."""
    if not tt:
        return None
    x = _k("nguoi", tt, gioi) if lon else _k("nhom", g, "nguoi_tre")
    return x or None


def _chu(o: dict) -> str:
    return _t("can", o["can"]) if o["hang"] == "can" else _t("chi", o["chi"])


def _dung(pt: dict, hanh: str) -> str | None:
    """Hai cách lấy dụng thần nói gì về hành `hanh` — mã cho web tô màu, không chọn thay người dùng."""
    t = [hanh in pt[c]["hanh"] for c in bt.CACH]
    b = [hanh in pt[c]["ky"] for c in bt.CACH]
    if all(t):
        return "them"
    if all(b):
        return "bot"
    if any(t) and any(b):
        return "nguoc"
    if any(t):
        return "mot_them"
    if any(b):
        return "mot_bot"
    return None


def _cau_dung(pt: dict, ma: str | None, hanh: str, chu: str) -> str | None:
    if not ma:
        return None
    khoa = "ky" if ma == "mot_bot" else "hanh"
    cach = next((c for c in bt.CACH if hanh in pt[c][khoa]), "cach_1")
    return _m("dung", ma).format(hanh=_t("hanh", hanh), chu=chu, cach=_m("ten_cach", cach))


def _vs_dung(pt: dict, hanh: str) -> str:
    def nhan(c: str) -> str:
        return _m("vs_dung_nhan", "them") if hanh in pt[c]["hanh"] else _m("vs_dung_nhan", "bot") if hanh in pt[c]["ky"] \
            else _m("vs_dung_nhan", "khong")
    return _m("vs_dung").format(hanh=_t("hanh", hanh), c1=nhan("cach_1"), c2=nhan("cach_2"))


def _quan_he_o(mr: dict) -> dict[str, list[tuple[str, str, dict]]]:
    """ô → [(ô kia, nhóm loại, quan hệ gốc)] — can nối can, chi nối chi."""
    ra: dict[str, list] = collections.defaultdict(list)
    for q in mr["quan_he"]:
        g = NHOM_LOAI.get(q["loai"])
        if not g:
            continue
        hang = "c" if q["loai"].startswith("can ") else "z"
        for a in q["tru"]:
            for b in q["tru"]:
                if a != b:
                    ra[f"{hang}{a}"].append((f"{hang}{b}", g, q))
    return ra


def _cau_cap(g: str, a: int, b: int, q: dict) -> str:
    if q["loai"] == "tự hình":
        return _k("cap", "tu_hinh") or ""
    i, j = sorted((a, b))
    return _k("cap", g, f"{i}{j}") or ""


def _tuoi_tru(i: int, nam_sinh: int, tuoi_nay: int) -> dict:
    tu, den = (_k("tuoi", str(i)) or [None, None])
    return {"tuoi_tu": tu, "tuoi_den": den, "nam_tu": nam_sinh + tu, "nam_den": nam_sinh + den if den else None,
            "dang_o": tu <= tuoi_nay and (den is None or tuoi_nay <= den),
            "da_qua": den is not None and tuoi_nay > den}


def _cau_tuoi(i: int, t: dict) -> str:
    ten = hoa_dau(_ten_tru(i))
    s = (_m("tuoi_khoang").format(Tru=ten, tru=_ten_tru(i), tu=t["tuoi_tu"], den=t["tuoi_den"], nam_tu=t["nam_tu"], nam_den=t["nam_den"])
         if t["tuoi_den"] else _m("tuoi_tu").format(Tru=ten, tru=_ten_tru(i), tu=t["tuoi_tu"], nam_tu=t["nam_tu"]))
    return s + (_m("dang_o") if t["dang_o"] else _m("da_qua") if t["da_qua"] else _m("chua_toi"))


def _ts_o(mr: dict, i: int) -> list[str]:
    """Thần sát đặt ở trụ i có lời đời thường (KB đời sống) — cát trước."""
    ds = [t for t in mr["than_sat"] if i in t["tru"]]
    ds.sort(key=lambda t: {"cát": 0, "trung": 1, "hung": 2}.get(t["loai"], 1))
    return [t["ten"] for t in ds]


def _chuong(o: dict, g: str | None, lon: bool) -> str:
    if o["ma"] == "c2":
        return "tong_quan"
    if o["ma"] == "z2":
        return "tinh_cam" if lon else "gia_dinh"
    if o["tru"] == 3 and o["hang"] == "chi":
        return "gia_dinh"
    return CHUONG_NHOM.get(g or "", "tong_quan")


def _o_ds(ls: dict) -> list[dict]:
    ds = []
    for i, t in enumerate(ls["tru"]):
        ds.append({"ma": f"c{i}", "tru": i, "hang": "can", "can": t["can"], "hanh": bt_calc.CAN_NH[bt_calc.CAN.index(t["can"])],
                   "thap_than": ls["thap_than_can"][i] if i != 2 else None})
    for i, t in enumerate(ls["tru"]):
        ds.append({"ma": f"z{i}", "tru": i, "hang": "chi", "chi": t["chi"], "hanh": bt_calc.CHI_NH[bt_calc.CHI.index(t["chi"])],
                   "thap_than": ls["thap_than_chi"][i][0]})
    return ds


def _lap_o(pt: dict, o: dict, ds_o: list[dict], qh_o: dict, ln10: list[dict], tuoi_tru: dict, gioi: str, lon: bool,
           muc_nam: dict | None = None) -> dict:
    ls, mr = pt["ls"], pt["mr"]
    nc = ls["nhat_chu"]
    chu = _chu(o)
    i = o["tru"]
    tt = o["thap_than"]
    g = _nhom(tt) if tt else None
    la_gi, vi_sao = [], []
    if o["ma"] == "c2":
        ndc = kb_ds.nhat_chu(nc["can"]) or {}
        la_gi.append(_m("la_ban").format(can=chu, am_duong=_t("am_duong", nc["am_duong"]).lower(), hanh=_t("hanh", nc["ngu_hanh"]),
                                         hinh=ndc.get("hinh_tuong") or _t("hanh", nc["ngu_hanh"])))
        pct = round(ls["than"]["ti_le"] * 100)
        k = "la_ban_than_yeu" if pt["than"] == "yeu" else "la_ban_than_manh" if pt["than"] == "manh" else "la_ban_than_vua"
        la_gi.append(_m(k).format(pct=pct, can=chu))
        vi_sao.append(_m("vs_nc").format(can=chu, am_duong=_t("am_duong", nc["am_duong"]), hanh=_t("hanh", nc["ngu_hanh"]),
                                          ket=_t("than_vuong", ls["than"]["ket_luan"]), pct=pct))
    else:
        k = battu_kb.thap_than(tt) or {}
        la_gi.append(_m("la_tt").format(chu=chu, nhom_y=_nhom_y(g), tinh_cach=_thuong(k.get("tinh_cach") or _nhom_y(g))))
        nguoi = _nguoi(tt, g, gioi, lon)
        if nguoi:
            la_gi.append(_m("nguoi").format(chu=chu, nguoi=nguoi))
        if lon and tt in (("Chính Tài", "Thiên Tài") if gioi == "nam" else ("Chính Quan", "Thất Sát")):
            la_gi.append(_m("sao_phoi").format(gioi=_m("gioi", gioi), chu=chu))
        vi_sao.append(_m("vs_tt").format(chu=chu, tt=_t("thap_than", tt), nc=_t("can", nc["can"])))
    if o["hang"] == "chi":
        tang = ls["tang_can"][i]
        tts = ls["thap_than_chi"][i]
        if len(tang) > 1:
            ds = [_m("tang_mot").format(can=_t("can", c), nhom_y=_nhom_y(_nhom(tts[k]))) for k, c in enumerate(tang)]
            la_gi.append(_m("tang_can").format(chi=chu, ds=danh_sach(ds)))
        vi_sao.append(_m("vs_tang").format(chi=chu, ds=", ".join(f"{_t('can', c)} ({_t('thap_than', tts[k])})" for k, c in enumerate(tang))))
        vi_sao.append(_m("vs_ts").format(chi=chu, ts=_t("truong_sinh", mr["truong_sinh"][i])))
        ts = _ts_o(mr, i)
        for ten in ts:                       # một nét thần sát đời thường (cát trước) — đủ chỗ cho các lớp khác
            x = kb_ds.than_sat(ten)
            if x and x.get("tieu_de") and x.get("y"):
                la_gi.append(_m("ts").format(chu=chu, tieu_de=_thuong(x["tieu_de"]), y=_thuong(x["y"]) + "."))
                break
        if ts:
            vi_sao.append(_m("ts_tru").format(tru=_ten_tru(i), ds=", ".join(_t("than_sat", x) for x in ts)))
    so_lan = sum(1 for x in ds_o if x["hang"] == o["hang"] and (x.get("can") or x.get("chi")) == (o.get("can") or o.get("chi")))
    if so_lan >= 2:
        la_gi.append(_m("lap").format(chu=chu, n=so_lan))
    dung = _dung(pt, o["hanh"])
    cd = None if o["ma"] == "c2" else _cau_dung(pt, dung, o["hanh"], chu)   # ô chính bạn: câu sức tự thân đã nói
    if cd:
        la_gi.append(cd)
    vi_sao.append(_vs_dung(pt, o["hanh"]))

    # lớp 2 — nằm ở đâu
    tk = _tru_kb(i)
    y_tru = (tk.get("y") if lon else tk.get("y_tre") or tk.get("y")) or ""
    o_dau = [_m("o_dau").format(chu=chu, tru=_ten_tru(i), tang=tk.get("tang", "").lower(), y=y_tru),
             _cau_tuoi(i, tuoi_tru[i])]
    if o["ma"] == "z2" and lon:
        o_dau.append(_m("duoi_ngay").format(chu=chu))
    vi_sao.append(_m("vs_nap").format(tru=_ten_tru(i), nap=_t("nap_am", mr["nap_am"][i]["ten"])))
    vi_sao.append(_m("vs_tru"))

    # lớp 3 — đang nối với ô nào (bỏ cặp trùng: một ô kia một nhóm)
    noi, da = [], set()
    for ma2, gl, q in sorted(qh_o.get(o["ma"], []), key=lambda x: (UU_TIEN_LOAI.index(x[1]), x[0])):
        if (ma2, gl) in da:
            continue
        da.add((ma2, gl))
        o2 = next(x for x in ds_o if x["ma"] == ma2)
        y = _cau_cap(gl, i, o2["tru"], q)
        noi.append({"o": ma2, "loai": gl, "cau": _m("noi").format(chu_kia=_chu(o2), tru_kia=_ten_tru(o2["tru"]), y=y)})
        vi_sao.append(q["mo_ta"] if ngon_ngu.la_viet() else battu_hien.mo_ta_quan_he(q))

    # lớp 4 — năm chạm tới (10 năm tới). Lời chỉ nói chữ này bị chạm vào chuyện gì; tốt / cần lưu ý là MỨC của chương
    # Vận hạn (một nguồn, `muc_nam`), không tự suy "hợp là tốt, xung là xấu".
    nam = []
    for ln in ln10:
        gl = None
        if o["hang"] == "chi" and ln["chi"] == o["chi"]:
            gl = "trung"
        elif o["hang"] == "can" and ln["can"] == o["can"]:
            gl = "trung"
        for q in ln["quan_he"]:
            if i in q["tru"] and (q["loai"].startswith("can ")) == (o["hang"] == "can"):
                g2 = NHOM_LOAI.get(q["loai"])
                if g2 and (gl is None or UU_TIEN_LOAI.index(g2) < UU_TIEN_LOAI.index(gl)):
                    gl = g2
        if gl:
            mn = (muc_nam or {}).get(ln["nam"])
            cau = _m("nam").format(nam=ln["nam"], cc=f"{_t('can', ln['can'])} {_t('chi', ln['chi'])}",
                                   loai_y=_m("nam_y", gl), chu=chu, tru=_ten_tru(i),
                                   ve=_m("nam_ve", gl).format(ngan=_ngan(i, o["hang"], lon)))
            if mn:
                cau += _m("nam_muc").format(muc=mn["nhan_muc"])
            nam.append({"nam": ln["nam"], "can": ln["can"], "chi": ln["chi"], "loai": gl, "muc": mn["muc"] if mn else None,
                        "cau": cau})
    ra = {**o, "nhom": g, "la_ban": o["ma"] == "c2", "dung": dung, "nguoi": None if o["ma"] == "c2" else _nguoi(tt, g, gioi, lon),
          "la_gi": la_gi, "o_dau": o_dau, "noi_voi": noi, "nam": nam[:NAM_MOI_O], "vi_sao": vi_sao,
          "chuong": _chuong(o, g, lon)}
    return ra


def _noi_bat(pt: dict, ds_o: list[dict], lon: bool) -> list[dict]:
    ls = pt["ls"]
    nc = ls["nhat_chu"]
    ung: list[tuple[int, dict]] = []
    for hang, khoa in (("chi", "chi"), ("can", "can")):
        dem = collections.Counter(o[khoa] for o in ds_o if o["hang"] == hang and not (hang == "can" and o["tru"] == 2))
        for x, n in dem.items():
            if n >= 2:
                os_ = [o for o in ds_o if o["hang"] == hang and o.get(khoa) == x]
                g = _nhom(os_[0]["thap_than"]) if os_[0]["thap_than"] else "Tỷ Kiếp"
                k = "chi_lap" if hang == "chi" else "can_lap"
                mau = _k("noi_bat", k, str(min(n, 4 if hang == "chi" else 3))) or ""
                ung.append((10 if n >= 3 else 6, {"ma": k, "o": [o["ma"] for o in os_],
                                                  "cau": mau.format(chi=_t("chi", x), can=_t("can", x), nhom_y=_nhom_y(g))}))
    for q in pt["mr"]["quan_he"]:
        if q["loai"] in ("tam hợp", "tam hội") and len(q["tru"]) == 3:
            h = q["mo_ta"].rsplit("(", 1)[-1].split()[0]
            g = pt["mr"]["vai_tro_hanh"].get(h, "")
            ung.append((9, {"ma": "cuc", "o": [f"z{i}" for i in q["tru"]],
                            "cau": _k("noi_bat", "cuc").format(ds=danh_sach([_t("chi", ls["tru"][i]["chi"]) for i in q["tru"]]),
                                                              hanh=_t("hanh", h), nhom_y=_nhom_y(g))}))
    ti = ls["than"]["ti_le"]
    if ti < 0.4 or ti > 0.62:
        k = "than_yeu" if ti < 0.4 else "than_manh"
        ung.append((8 if (ti < 0.3 or ti > 0.7) else 5, {"ma": k, "o": ["c2"],
                                                          "cau": _k("noi_bat", k).format(pct=round(ti * 100), can=_t("can", nc["can"]))}))
    h_nhieu = ls["ngu_hanh"]["nhieu_nhat"]
    r = pt["ty_le_hanh"][h_nhieu]
    if r >= 0.3 and h_nhieu != nc["ngu_hanh"]:
        g = pt["mr"]["vai_tro_hanh"][h_nhieu]
        ung.append((7, {"ma": "hanh_nhieu", "o": [o["ma"] for o in ds_o if o["hanh"] == h_nhieu],
                        "cau": _k("noi_bat", "hanh_nhieu").format(hanh=_t("hanh", h_nhieu), pct=round(r * 100),
                                                                  nc_hanh=_t("hanh", nc["ngu_hanh"]), nhom_y=_nhom_y(g))}))
    if ls["ngu_hanh"]["thieu"]:
        ung.append((5, {"ma": "thieu", "o": [], "cau": _k("noi_bat", "thieu").format(
            ds=danh_sach([_t("hanh", h) for h in ls["ngu_hanh"]["thieu"]]))}))
    for i in (1, 3):
        tt = ls["thap_than_can"][i]
        g = _nhom(tt)
        if g in ("Tài", "Quan Sát"):
            ung.append((4, {"ma": "lo_can", "o": [f"c{i}"], "cau": _k("noi_bat", "lo_can").format(
                can=_t("can", ls["tru"][i]["can"]), nhom_y=_nhom_y(g), tru=_ten_tru(i), tang=_tru_kb(i).get("tang", "").lower())}))
            break
    ung.sort(key=lambda x: -x[0])
    ra, da = [], set()
    da_o: list[set] = []
    for _, n in ung:
        if n["ma"] in da or (n["o"] and set(n["o"]) in da_o):      # cùng nhóm ô với điều đã chọn → bỏ (không nói hai lần)
            continue
        da.add(n["ma"])
        da_o.append(set(n["o"]))
        ra.append(n)
        if len(ra) == 3:
            break
    return ra


def _cham_nam(i_can: str, i_chi: str, ls: dict, quan_he: list[dict], tru_moi: int) -> list[dict]:
    """Một năm / một vận (can, chi) chạm ô nào: trùng chữ + quan hệ với trụ `tru_moi` (chỉ số của trụ thêm vào)."""
    ra: dict[str, str] = {}
    for i, t in enumerate(ls["tru"]):
        if t["chi"] == i_chi:
            ra[f"z{i}"] = "trung"
        if t["can"] == i_can and i != 2:
            ra[f"c{i}"] = "trung"
    for q in quan_he:
        if tru_moi not in q["tru"]:
            continue
        g = NHOM_LOAI.get(q["loai"])
        if not g:
            continue
        hang = "c" if q["loai"].startswith("can ") else "z"
        for i in q["tru"]:
            if i == tru_moi:
                continue
            ma = f"{hang}{i}"
            if ma not in ra or UU_TIEN_LOAI.index(g) < UU_TIEN_LOAI.index(ra[ma]):
                ra[ma] = g
    return [{"o": ma, "loai": g} for ma, g in sorted(ra.items(), key=lambda x: MA_O.index(x[0]))]


def _cau_cham(ch: list[dict], ds_o: dict, lon: bool) -> list[str]:
    """`lon` theo TUỔI CỦA NĂM / VẬN đang nói (vận tuổi nhỏ không nói "chuyện vợ chồng"). Cùng một chữ lặp ở nhiều trụ, cùng
    kiểu chạm → gộp một dòng ("ba chữ Ngọ ở trụ năm, trụ ngày và trụ giờ")."""
    nhom: dict[tuple[str, str, str], list[dict]] = {}
    for x in ch:   # gộp theo MÃ chữ (bản Anh "Mậu" và "Ngọ" cùng viết "Wu" — không gộp theo chữ hiển thị)
        o = ds_o[x["o"]]
        nhom.setdefault((x["loai"], o["hang"], o.get("can") or o.get("chi") or ""), []).append(o)
    ra = []
    for (loai, _hang, _ma), ds in nhom.items():
        chu = _chu(ds[0])
        ngan = danh_sach([_ngan(o["tru"], o["hang"], lon) for o in ds])
        ve = _m("nam_ve", loai).format(ngan=ngan)
        if len(ds) == 1:
            ra.append(_k("thoi_gian", "cham").format(loai_y=hoa_dau(_m("nam_y", loai)), chu=chu, tru=_ten_tru(ds[0]["tru"]), ve=ve))
        else:
            ra.append(_k("thoi_gian", "cham_nhom").format(loai_y=hoa_dau(_m("nam_y", loai)), so=_k("so_chu", str(len(ds))) or len(ds),
                                                           chu=chu, tru=danh_sach([_ten_tru(o["tru"]) for o in ds]), ve=ve))
    return ra


def _thoi_gian(pt: dict, sinh: dict, nam0: int, ngay_xem: dt.date, ds_o: list[dict], lon: bool, dong: list[dict]) -> dict:
    ls = pt["ls"]
    nam_sinh = sinh["lich"].year
    nam_dau = ls.get("nam_bat_tu", nam_sinh)
    o_theo = {o["ma"]: o for o in ds_o}
    dv = ls["dai_van"]["ds"]
    tgb = bt.thoi_gian_bieu(pt, ngay_xem)
    tg = _k("thoi_gian") or {}
    nam = []
    muc_nam = {g["nam"]: g for g in dong}
    nam_cuoi = max(muc_nam) if muc_nam else nam0 + SO_NAM_TOI
    for n in range(nam_dau, nam_cuoi + 1):
        ln = mr_calc.luu_nien(ls, n)
        tuoi = n - nam_sinh
        ch = _cham_nam(ln["can"], ln["chi"], ls, ln["quan_he"], 4)
        idx = next((k for k, d in enumerate(dv) if d["tu_nam"] <= n <= d["den_nam"]), None)
        cd = kb_ds.van(ln["thap_than"]) or {}
        cau = tg["nam"].format(nam=n, cc=f"{_t('can', ln['can'])} {_t('chi', ln['chi'])}", tuoi=max(tuoi, 0),
                               chu_de=cd.get("chu_de") or _t("thap_than", ln["thap_than"]))
        cau += tg["nam_cham"].format(n=len(ch)) if ch else tg["nam_khong"]
        x = {"nam": n, "can": ln["can"], "chi": ln["chi"], "thap_than": ln["thap_than"], "tuoi": tuoi, "dai_van": idx,
             "hanh_can": bt_calc._nh_can(ln["can"]), "hanh_chi": bt_calc.CHI_NH[bt_calc.CHI.index(ln["chi"])],
             "qua": n < nam0, "cham": ch, "cau": cau, "chi_tiet": _cau_cham(ch, o_theo, lon and tuoi >= config.TUOI_NGUOI_LON)}
        g = muc_nam.get(n)
        if g:   # năm nay + chín năm tới: đúng mức chương "Mười năm tới & điều nên tránh" (một nguồn)
            x.update({"muc": g["muc"], "nhan_muc": g["nhan_muc"], "mang": g.get("mang") or ""})
            if n == nam0:   # cách a (chủ dự án chốt): chỉ năm nay mở "nên tránh / nên làm"; năm sau mời mở chương
                x.update({k: g[k] for k in ("y", "nen_tranh", "nen_lam") if g.get(k)})
            else:
                x["khoa"] = True
        if n < nam0 and tuoi >= dc.TUOI_NHO_NHAT:
            m1, m2, _ = bt.muc_hai_cach(pt, ln["can"], ln["chi"])
            if m1 != m2:
                x.update({"ma": f"nam.{n}", "dc": [m1, m2], "hoi": tg["hoi"].format(nam=n, tuoi=tuoi)})
        nam.append(x)
    van = []
    for k, d in enumerate(dv):
        q = mr_calc.quan_he([*ls["tru"], {"can": d["can"], "chi": d["chi"]}], [*mr_calc.TEN_TRU, "đại vận"])
        ch = _cham_nam(d["can"], d["chi"], ls, q, 4)
        tt = bt_calc.thap_than(ls["nhat_chu"]["can"], d["can"])
        cd = kb_ds.van(tt) or {}
        van.append({"i": k, "can": d["can"], "chi": d["chi"], "thap_than": tt, "tu_nam": d["tu_nam"], "den_nam": d["den_nam"],
                    "nhan": _k("nhom", bt.TT_NHOM.get(tt, ""), "ngan") or "",
                    "tu_tuoi": d["tu_tuoi_thuc"], "hien_tai": bool(tgb[k]["hien_tai"]) if k < len(tgb) else False,
                    "cham": ch, "chi_tiet": _cau_cham(ch, o_theo, lon and d["tu_tuoi_thuc"] + 9 >= config.TUOI_NGUOI_LON),
                    "cau": tg["van"].format(tu_nam=d["tu_nam"], den_nam=d["den_nam"], tu_tuoi=d["tu_tuoi_thuc"],
                                            den_tuoi=d["tu_tuoi_thuc"] + 9, chu_de=cd.get("chu_de") or _t("thap_than", tt))})
    k = dc.khung(pt)
    return {"nam_xem": nam0, "nam": nam, "dai_van": van, "hoi_dan": tg.get("hoi_dan", ""), "nam_toi": tg.get("nam_toi", ""), **k}


def _cau_dung_hanh(pt: dict, ma: str | None, hanh: str) -> str | None:
    if not ma:
        return None
    khoa = "ky" if ma == "mot_bot" else "hanh"
    cach = next((c for c in bt.CACH if hanh in pt[c][khoa]), "cach_1")
    return _m("dung_hanh", ma).format(hanh=_t("hanh", hanh), cach=_m("ten_cach", cach))


VONG_HANH = ("Mộc", "Hỏa", "Thổ", "Kim", "Thủy")   # thứ tự tương sinh — web vẽ ngôi sao năm hành theo đúng thứ tự này


def _ngu_hanh(pt: dict, ds_o: list[dict]) -> list[dict]:
    """Năm hành của lá số cho hình "Năm hành": tỉ lệ (điểm engine), số chữ, hai cách nói gì, nghĩa với người này."""
    ls = pt["ls"]
    nc = ls["nhat_chu"]["ngu_hanh"]
    ra = []
    for h in VONG_HANH:
        g = pt["mr"]["vai_tro_hanh"][h]
        ra.append({"hanh": h, "phan_tram": round(pt["ty_le_hanh"][h] * 100), "so_chu": sum(o["hanh"] == h for o in ds_o),
                   "dung": _dung(pt, h), "nhat_chu": h == nc, "nhieu": h == ls["ngu_hanh"]["nhieu_nhat"],
                   "thieu": h in ls["ngu_hanh"]["thieu"], "nhom": g,
                   "y": _m("hanh_y").format(nc_hanh=_t("hanh", nc), hanh=_t("hanh", h), nhom_y=_nhom_y(g)),
                   "cau_dung": _cau_dung_hanh(pt, _dung(pt, h), h)})
    return ra


def lap(sinh: dict, ngay_xem: dt.date | None = None) -> dict:
    """`sinh` như `battu_doi_song.lap` → bản đồ 8 ô + điều nổi bật + lớp thời gian."""
    ngay_xem = ngay_xem or config.hom_nay_vn()
    ls = bt._la_so(sinh)
    pt = bt.phan_tich(ls)
    gioi = sinh["gioi_tinh"]
    tuoi = hoan_canh.tuoi_tron(sinh["lich"].date(), ngay_xem)
    lon = tuoi >= config.TUOI_NGUOI_LON
    tz = dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)
    nam0 = bt._nam_bat_tu(dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12) - tz)
    nam_sinh = sinh["lich"].year
    tuoi_tru = {i: _tuoi_tru(i, nam_sinh, tuoi) for i in range(4)}
    ds_o = _o_ds(ls)
    qh_o = _quan_he_o(pt["mr"])
    dong = bt.dong_nam_cua(sinh, ngay_xem, ls)
    muc_nam = {g["nam"]: g for g in dong}
    nam_cuoi = max(muc_nam) if muc_nam else nam0 + SO_NAM_TOI
    ln10 = [mr_calc.luu_nien(ls, n) for n in range(nam0, nam_cuoi + 1)]
    o = [_lap_o(pt, x, ds_o, qh_o, ln10, tuoi_tru, gioi, lon, muc_nam) for x in ds_o]
    tru = [{"i": i, "ten": _ten_tru(i), "tang": _tru_kb(i).get("tang", ""), **tuoi_tru[i]} for i in range(4)]
    return {"phien_ban": PHIEN_BAN, "tuoi": tuoi, "nguoi_lon": lon, "tru": tru, "o": o,
            "suc": round(ls["than"]["ti_le"] * 100), "ngu_hanh": _ngu_hanh(pt, ds_o),
            "noi_bat": _noi_bat(pt, ds_o, lon), "trich": _k("trich") or [], "tuoi_ghi_chu": _k("tuoi", "ghi_chu") or "",
            "thoi_gian": _thoi_gian(pt, sinh, nam0, ngay_xem, ds_o, lon, dong), "ngay_xem": ngay_xem.isoformat(), **meta()}
