# -*- coding: utf-8 -*-
"""TR-1 — RULES Tarot: bài đọc "Trải bài của bạn" (khuôn `doi_song_1`), hỏi đáp tất định, lá ngày, bộ bài cho web.

Đầu vào: trải bài + danh sách lá NGƯỜI DÙNG đã rút (web lấy thứ tự từ `calc.xao`, người dùng chọn lá) — engine không
chọn lá theo câu hỏi, không lưu câu hỏi (không trả lại `cau_hoi`). Bảy chương: Trải bài nói gì · Từng vị trí · Dòng chảy
giữa các lá (phẩm giá Golden Dawn + hướng nhìn Marseille + nhịp số) · Điều bên trong (B.O.T.A., Thoth) · Nhịp thời gian
(decan — gợi ý, không dự báo) · Việc nên làm trong 72 giờ (Marseille) · Tướng và lá bài (lá đại diện từ Nhân tướng, chỉ
cho chính mình). Mỗi hộp mang `phai` = trường phái và `ma_mau` tất định `ds.tarot.<chương>.<…>`; HỌC dùng `ap_hoc` chung.
Không điểm số, không "điềm xấu", không đọc người khác, an toàn MỘT bộ chặn chung."""
from __future__ import annotations

import datetime as dt
import re

from app import config
from app.calc import tarot as calc
from app.kb import tarot_kb as kb
from app.luangiai import doi_song_khuon as kh

MO_DUN = "tarot"
PHAI_CHUNG = "tarot_tong_hop"
TEN_PHAI = {"rws": "Waite (RWS)", "thoth": "Thoth / Golden Dawn", "tdm": "Marseille", "bota": "B.O.T.A."}
_MUC_SUC = {"tiep_suc": "thuan", "binh": "can_bang", "bi_kim": "can_chu_dong"}
_LOAI_SAC = {"sang": "diem_manh", "trung": "cot_loi", "nang": "luu_y"}
_TEN_QH = {"manh": "cùng nguyên tố, mạnh lên", "hop": "hợp nhau", "trung": "không hợp không xung", "xung": "xung nhau"}
TOI_DA_DONG_CHAY = 6


# ------------------------------------------------------------------ tiện ích
def _la(ma: str) -> dict:
    x = kb.mot_la(ma)
    if not x:
        raise ValueError(f"Không có lá {ma}")
    return x


def _ten(l: dict, nguoc: bool) -> str:
    return f"{l['ten']}{' (ngược)' if nguoc else ''}"


def _ngay(d: dt.date | None) -> str | None:
    return d.strftime("%d/%m/%Y") if d else None


def _ngay_ngan(d: dt.date | None) -> str:
    return d.strftime("%d/%m") if d else ""


def _gop_muc(ds: list[str | None]) -> str | None:
    ds = [m for m in ds if m]
    if not ds:
        return None
    t, c = ds.count("thuan"), ds.count("can_chu_dong")
    if t and not c:
        return "thuan"
    if c and not t:
        return "can_chu_dong" if c >= max(1, len(ds) // 2) else "can_bang"
    return "can_bang"


def _can_cu_phai(l: dict) -> list[str]:
    ra = []
    for k in ("rws", "thoth", "tdm", "bota"):
        tp = (l.get("truong_phai") or {}).get(k) or {}
        if tp.get("loi"):
            ra.append(f"{TEN_PHAI[k]}: {tp['loi']}")
    ct = l.get("chiem_tinh")
    if ct:
        ra.append(f"Golden Dawn gắn lá này với {ct['ten']}; chữ Hebrew {l.get('chu_cai')}, con đường {l.get('duong')} trên Cây Sự sống.")
    elif l.get("decan"):
        d = calc.decan(l["id"]) or {}
        c = kb.cung_hoang_dao().get(d.get("cung") or "") or {}
        h = kb.hanh_tinh().get(d.get("hanh_tinh") or "") or {}
        ra.append(f"Book T: decan {d.get('so')} của {c.get('ten')} ({h.get('ten')}), Sephirah {kb.sephirah(l['so'])}; {l.get('thoth_ten')}.")
    elif l.get("ten_nguyen_to_phu"):
        ra.append(f"Golden Dawn: {l['ten_nguyen_to_phu']} — {l.get('thoth_ten')}.")
    return ra


def _linh_vuc(cau_hoi: str | None, chu_de: str | None) -> str | None:
    cd = kb.chu_de()
    if chu_de and chu_de in cd:
        return cd[chu_de]["linh_vuc"]
    if not cau_hoi:
        return None
    from app.luangiai.hoi import chuan_hoa  # noqa: PLC0415
    t = f" {chuan_hoa(cau_hoi)} "
    tot, dai = None, 0
    for ma, x in cd.items():
        for k in x["tu_khoa"]:
            if f" {k} " in t and len(k) > dai:
                tot, dai = x["linh_vuc"], len(k)
    return tot


def _y(l: dict, nguoc: bool) -> str:
    return l["y_nguoc"] if nguoc else l["y_xuoi"]


# ------------------------------------------------------------------ từng chương
def _hop_la(v: dict, tb: dict, linh_vuc: str | None, pt: dict) -> dict:
    l = _la(v["id"])
    nguoc = v["nguoc"]
    sac = l["sac_thai_nguoc"] if nguoc else l["sac_thai"]
    vt = tb["vi_tri"][v["vi_tri"]]
    suc = v["suc"]
    doan = [_y(l, nguoc)]
    if linh_vuc and l["linh_vuc"].get(linh_vuc):
        ten_lv = {"tinh_cam": "tình cảm", "cong_viec": "công việc", "tien_bac": "tiền bạc", "suc_khoe": "sức khoẻ"}[linh_vuc]
        doan.append(f"Trong chuyện {ten_lv}: {l['linh_vuc'][linh_vuc]}")
    if suc["triet_tieu"]:
        doan.append(str(kb.mau("suc", "triet_tieu")))
    elif suc["chi_tiet"]:
        doan.append(str(kb.mau("suc", suc["suc"])))
    can_cu = [f"Vị trí '{vt['ten']}': {vt['hoi']}. Hình (Waite): {l['hinh_anh']}"]
    if suc["chi_tiet"]:
        ke = "; ".join(f"{_la(pt['vi_tri'][int(k.split('_')[-1])]['id'])['ten']} ({_TEN_QH[q]})" for k, q in suc["chi_tiet"])
        can_cu.append(f"Phẩm giá nguyên tố (Book T): lá {kb.TEN_NGUYEN_TO[l['nguyen_to']]} bên cạnh {ke} → {kb.pham_gia()['suc'][suc['suc']]}.")
    can_cu += _can_cu_phai(l)
    if nguoc:
        can_cu.append("Lá ngược đọc theo lối Waite (tính chất bị chặn / hướng vào trong); Marseille và Thoth không dùng lá ngược.")
    return kh.hop(_LOAI_SAC[sac], f"{vt['ten']}: {_ten(l, nguoc)}", " ".join(doan), huong_xu_ly=l["viec"], can_cu=can_cu,
                  ma=kh.ma_mau(MO_DUN, "tung_la", tb_ma(tb), vt["ma"], l["id"], "n" if nguoc else "x"), muc=_MUC_SUC[suc["suc"]],
                  phai="rws" if nguoc else PHAI_CHUNG, la=_tom_la(l, nguoc), vi_tri={"so": v["vi_tri"], "ma": vt["ma"], "ten": vt["ten"], "hoi": vt["hoi"]},
                  suc=suc["suc"], tu_khoa=list(l["tu_khoa_nguoc"] if nguoc else l["tu_khoa"])[:3], cau_tu_soi=l["cau_tu_soi"])


def tb_ma(tb: dict) -> str:
    return tb["_ma"]


def _tom_la(l: dict, nguoc: bool) -> dict:
    return {"id": l["id"], "ten": l["ten"], "en": l["en"], "nguoc": nguoc, "so": l["so"], "bo": l["bo"], "nguyen_to": l["nguyen_to"], "loai": l["loai"]}


def _chuong_tong_quan(pt: dict, tb: dict, hop_la: list[dict]) -> dict:
    c = kb.chuong()["tong_quan"]
    n = len(pt["vi_tri"])
    doan = [str(kb.mau("mo_dau")).format(so=n, trai_bai=tb["ten"])]
    hop = []
    an = pt["an_chinh"]
    doan.append(str(kb.mau("an_chinh", an["muc"])).format(so=an["so"], tong=an["tong"]))
    hop.append(kh.hop("cot_loi", f"{an['so']} trên {an['tong']} lá là ẩn chính", str(kb.mau("an_chinh", an["muc"])).format(so=an["so"], tong=an["tong"]),
                      can_cu=[f"Ẩn chính: {', '.join(_la(v['id'])['ten'] for v in pt['vi_tri'] if v['loai'] == 'an_chinh') or 'không có'}."],
                      ma=kh.ma_mau(MO_DUN, "tong_quan", "an_chinh", an["muc"]), phai=PHAI_CHUNG))
    nt = pt["nguyen_to"]
    if nt["troi"]:
        x = kb.nguyen_to()[nt["troi"]]
        hop.append(kh.hop("diem_manh", f"Nguyên tố trội: {x['ten']}", str(kb.mau("nguyen_to_troi")).format(ten=x["ten"], so=nt["dem"][nt["troi"]], tong=n, loi=x["loi"]),
                          can_cu=[f"Đếm nguyên tố: " + ", ".join(f"{kb.TEN_NGUYEN_TO[k]} {v}" for k, v in nt["dem"].items()) + " (Golden Dawn: mỗi lá một nguyên tố)."],
                          ma=kh.ma_mau(MO_DUN, "tong_quan", "nguyen_to", nt["troi"]), phai="thoth"))
    for k in nt["thieu"]:
        x = kb.nguyen_to()[k]
        hop.append(kh.hop("luu_y", f"Không có lá {x['ten']} nào", str(kb.mau("nguyen_to_thieu")).format(ten=x["ten"], thieu=kb.mau("thieu", k)),
                          huong_xu_ly=str(kb.mau("thieu", k)).split("—")[-1].strip().capitalize(), can_cu=["Thiếu một nguyên tố trong trải bài ≥ 5 lá (Golden Dawn): phần đời ấy chưa được hỏi tới."],
                          ma=kh.ma_mau(MO_DUN, "tong_quan", "thieu", k), phai="thoth"))
    sh = pt["so_hoc"]
    if len(sh["day"]) >= 2:
        day = " → ".join(str(s) for s in sh["day"])
        lap = next((s for s in sh["day"] if sh["day"].count(s) > 1), None)
        loi = str(kb.mau("so_hoc", sh["xu_huong"])).format(day=day, so=lap, y=kb.so_hoc(lap) if lap else "")
        hop.append(kh.hop("cot_loi", f"Nhịp số: {day}", loi, can_cu=["Lối Marseille: đọc các lá số 1–10 theo thứ tự vị trí như một dòng chảy; " + "; ".join(f"{s} = {kb.so_hoc(s)}" for s in sorted(set(sh["day"])))],
                          ma=kh.ma_mau(MO_DUN, "tong_quan", "so_hoc", sh["xu_huong"]), phai="tdm"))
    tt = hop_la[tb["trong_tam"]]
    tom_tat = f"Tâm điểm: {tt['la']['ten']}{' (ngược)' if tt['la']['nguoc'] else ''} — {', '.join(tt['tu_khoa'])}."
    return kh.chuong("tong_quan", c["tieu_de"], doan, hop=hop, muc=_gop_muc([h.get("muc") for h in hop_la]), tom_tat=tom_tat, cau_hoi=c["cau_hoi"],
                     cau_tu_soi="Nhìn cả bàn bài, lá nào bạn thấy mắt mình dừng lại lâu nhất — vì sao?")


def _chuong_tung_la(hop_la: list[dict], tb: dict) -> dict:
    c = kb.chuong()["tung_la"]
    muc = _gop_muc([h.get("muc") for h in hop_la])
    tom = {"thuan": "Nhiều lá được lá bên cạnh tiếp sức.", "can_bang": "Có lá được tiếp sức, có lá bị kìm — cân bằng.", "can_chu_dong": "Nhiều lá đang bị lá bên cạnh kìm — nên chủ động hơn là chờ."}
    return kh.chuong("tung_la", c["tieu_de"], [c["mo_ta"]], hop=hop_la, muc=muc, tom_tat=tom.get(muc or "can_bang"), cau_hoi=c["cau_hoi"],
                     cau_tu_soi="Lá nào ở vị trí nào làm bạn gật đầu ngay, lá nào bạn muốn cãi lại?")


def _chuong_dong_chay(pt: dict, tb: dict) -> dict:
    c = kb.chuong()["dong_chay"]
    vt = tb["vi_tri"]
    la_o = {v["vi_tri"]: _la(v["id"]) for v in pt["vi_tri"]}
    uu = {"xung": 0, "manh": 1, "hop": 2, "trung": 9}
    hop = []
    for cap in sorted(pt["ke_can"], key=lambda x: (uu[x["quan_he"]], x["a"], x["b"])):
        if cap["quan_he"] == "trung" or len(hop) >= TOI_DA_DONG_CHAY:
            continue
        a, b = la_o[cap["a"]], la_o[cap["b"]]
        qh = cap["quan_he"]
        loi = f"Lá {a['ten']} ({vt[cap['a']]['ten']}) và lá {b['ten']} ({vt[cap['b']]['ten']}) là {kb.TEN_NGUYEN_TO[a['nguyen_to']]} với {kb.TEN_NGUYEN_TO[b['nguyen_to']]} — {kb.pham_gia()['loi'][qh]}."
        if qh == "xung":
            loi += " Chỗ này là chỗ việc hay chậm hoặc lệch; đọc cả hai lá chậm lại, coi điều ở đây là việc cần chủ động chứ không phải điều tự đến."
            loai = "luu_y"
        else:
            loi += " Chỗ này là chỗ việc chảy dễ — nên bắt đầu từ đây."
            loai = "diem_manh"
        hop.append(kh.hop(loai, f"{a['ten']} × {b['ten']}: {_TEN_QH[qh]}", loi,
                          huong_xu_ly="Làm việc của lá được tiếp sức trước, để nó kéo lá bị kìm." if qh == "xung" else None,
                          can_cu=[f"Phẩm giá nguyên tố (Book T): {kb.TEN_NGUYEN_TO[a['nguyen_to']]} × {kb.TEN_NGUYEN_TO[b['nguyen_to']]} → {qh}; hai vị trí kề nhau trên bàn trải bài."],
                          ma=kh.ma_mau(MO_DUN, "dong_chay", tb_ma(tb), f"{cap['a']}_{cap['b']}", qh), phai="thoth", quan_he=qh, cap=[cap["a"], cap["b"]]))
    # hướng nhìn (Marseille) trên trục thời gian
    nhin = {h["vi_tri"]: h for h in pt["huong_nhin"]}
    for h in pt["huong_nhin"]:
        if not h["tren_truc"]:
            continue
        l = la_o[h["vi_tri"]]
        if h["huong"] == 0:
            loi = str(kb.mau("huong_nhin", "thang")).format(ten=l["ten"])
        elif h["toi"] is None:
            loi = str(kb.mau("huong_nhin", "ngoai")).format(ten=l["ten"])
        else:
            d = vt[h["toi"]]
            loi = str(kb.mau("huong_nhin", "toi" if h["huong"] == 1 else "ve")).format(ten=l["ten"], den=f"lá {la_o[h['toi']]['ten']} ({d['ten']})", y=d["hoi"].lower())
            k = nhin.get(h["toi"])
            if k and k["toi"] == h["vi_tri"]:
                loi += " " + str(kb.mau("huong_nhin", "doi_dau")).format(a=l["ten"], b=la_o[h["toi"]]["ten"])
        hop.append(kh.hop("cot_loi", f"Hướng nhìn: {l['ten']}", loi, can_cu=[f"Marseille (bản Conver): nhân vật trên lá {l['ten']} nhìn {'thẳng' if h['huong'] == 0 else 'sang phải' if h['huong'] == 1 else 'sang trái'}; trục đọc = {' → '.join(vt[i]['ten'] for i in tb.get('truc_nhin', []))}."],
                          ma=kh.ma_mau(MO_DUN, "dong_chay", "nhin", vt[h["vi_tri"]]["ma"], l["id"]), phai="tdm", vi_tri_nhin=h["vi_tri"], toi=h["toi"], huong=h["huong"]))
    doan = [c["mo_ta"]]
    if not hop:
        doan.append(str(kb.mau("khong_dau_hieu")))
    muc = _gop_muc(["can_chu_dong" if h["loai"] == "luu_y" else "thuan" if h["loai"] == "diem_manh" else None for h in hop])
    return kh.chuong("dong_chay", c["tieu_de"], doan, hop=hop, muc=muc, tom_tat=None, cau_hoi=c["cau_hoi"],
                     cau_tu_soi="Hai lá đang 'xung' nhau trên bàn — trong đời bạn, hai việc nào đang kéo nhau như thế?")


def _chuong_ben_trong(pt: dict, tb: dict) -> dict:
    c = kb.chuong()["ben_trong"]
    chon = [tb["trong_tam"]] + [i for i, v in enumerate(tb["vi_tri"]) if v["ma"] in ("dieu_can", "goc_re", "hy_vong_noi_lo") and i != tb["trong_tam"]]
    if len(tb["vi_tri"]) <= 3:
        chon = list(range(len(tb["vi_tri"])))
    hop = []
    for i in chon[:4]:
        v = pt["vi_tri"][i]
        l = _la(v["id"])
        bota, thoth = l["truong_phai"]["bota"]["loi"], l["truong_phai"]["thoth"]["loi"]
        mat_toi = thoth.split("mặt tối là")[-1].strip().rstrip(".") if "mặt tối là" in thoth else ""
        noi_dung = bota + (f" Mặt tối của lá này: {mat_toi}." if mat_toi else "")
        hop.append(kh.hop("cot_loi", f"{tb['vi_tri'][i]['ten']}: {l['ten']} soi nếp nghĩ nào", noi_dung,
                          can_cu=[f"B.O.T.A. (Paul Foster Case): {bota}", f"Thoth / Golden Dawn: {thoth}"],
                          ma=kh.ma_mau(MO_DUN, "ben_trong", l["id"], "n" if v["nguoc"] else "x"), phai="bota", la=_tom_la(l, v["nguoc"]), cau_tu_soi=l["cau_tu_soi"]))
    tt = _la(pt["vi_tri"][tb["trong_tam"]]["id"])
    return kh.chuong("ben_trong", c["tieu_de"], [str(kb.mau("ben_trong_mo"))], hop=hop, cau_hoi=c["cau_hoi"], cau_tu_soi=tt["cau_tu_soi"])


def _chuong_thoi_diem(pt: dict, tb: dict, ngay_xem: dt.date) -> dict:
    c = kb.chuong()["thoi_diem"]
    hop = []
    for i in tb.get("thoi_diem", []):
        v = pt["vi_tri"][i]
        l = _la(v["id"])
        k = calc.khoang_thoi_gian(l["id"], ngay_xem)
        vt = tb["vi_tri"][i]
        bo = kb.bo().get(l["bo"] or "") or {}
        if k["loai"] == "decan":
            cung = kb.cung_hoang_dao()[k["cung"]]
            xa = not k["dang_trong"] and k["sau_ngay"] > 60
            trong = str(kb.mau("dang_trong")) if k["dang_trong"] else str(kb.mau("sap_toi")).format(ngay=k["sau_ngay"]) if not xa else str(kb.mau("cua_so_xa")).format(ngay=k["sau_ngay"])
            loi = str(kb.mau("thoi_diem_decan")).format(ten=l["ten"], decan=k["so"], cung=cung["ten"], tu=_ngay_ngan(k["tu"]), den=_ngay_ngan(k["den"]), bo=bo.get("ten"), nhip=k["nhip"], trong=trong)
            tieu = (f"{vt['ten']}: {l['ten']} — nhịp {k['nhip']}, mốc năm {_ngay_ngan(k['tu'])}–{_ngay_ngan(k['den'])}" if xa
                    else f"{vt['ten']}: {l['ten']} — khoảng {_ngay_ngan(k['tu'])} tới {_ngay_ngan(k['den'])}")
        elif k["loai"] == "cung":
            cung = kb.cung_hoang_dao()[k["cung"]]
            trong = str(kb.mau("dang_trong")) if k["dang_trong"] else str(kb.mau("sap_toi")).format(ngay=k["sau_ngay"])
            loi = str(kb.mau("thoi_diem_cung")).format(ten=l["ten"], cung=cung["ten"], tu=_ngay_ngan(k["tu"]), den=_ngay_ngan(k["den"]), nhip=k["nhip"], trong=trong)
            tieu = f"{vt['ten']}: {l['ten']} — mùa {cung['ten']} ({_ngay_ngan(k['tu'])} tới {_ngay_ngan(k['den'])})"
        elif k["loai"] == "hanh_tinh":
            ht = kb.hanh_tinh()[k["hanh_tinh"]]
            loi = str(kb.mau("thoi_diem_hanh_tinh")).format(ten=l["ten"], hanh_tinh=ht["ten"], nhip=k["nhip"])
            tieu = f"{vt['ten']}: {l['ten']} — nhịp {ht['ten']}"
        elif k["loai"] == "bo":
            loi = str(kb.mau("thoi_diem_bo")).format(ten=l["ten"], bo=bo.get("ten"), nhip=k["nhip"])
            tieu = f"{vt['ten']}: {l['ten']} — nhịp bộ {bo.get('ten')}"
        else:
            loi = f"Lá {l['ten']} không có nhịp riêng — {k['nhip']}."
            tieu = f"{vt['ten']}: {l['ten']} — theo nhịp các lá bên cạnh"
        hop.append(kh.hop("thoi_diem", tieu, loi, muc=_MUC_SUC[v["suc"]["suc"]], tu=_ngay(k["tu"]), den=_ngay(k["den"]),
                          can_cu=[f"Book T (Golden Dawn): 36 lá số 2–10 ứng 36 decan hoàng đạo (mỗi decan ~10 ngày, mốc ngày phổ biến lệch ±1 ngày tuỳ năm); nhịp bộ: Gậy, Kiếm ngày–tuần; Cốc tuần–tháng; Tiền tháng–quý.",
                                  f"Mức của hộp = sức của lá ở vị trí này theo phẩm giá nguyên tố ({kb.pham_gia()['suc'][v['suc']['suc']]})."],
                          ma=kh.ma_mau(MO_DUN, "thoi_diem", tb_ma(tb), vt["ma"], l["id"]), phai="thoth", la=_tom_la(l, v["nguoc"]), loai_nhip=k["loai"], dang_trong=k["dang_trong"]))
    return kh.chuong("thoi_diem", c["tieu_de"], [str(kb.mau("thoi_diem_mo"))], hop=hop, tom_tat="Nhịp gợi ý để chọn lúc làm, không phải ngày dự báo.",
                     cau_hoi=c["cau_hoi"], cau_tu_soi="Nếu nhịp này đúng, việc bạn nên làm TRƯỚC khoảng ấy là gì?")


def _chuong_viec(pt: dict, tb: dict) -> dict:
    c = kb.chuong()["viec_nen_lam"]
    thu_tu = list(dict.fromkeys([*tb.get("loi_khuyen", []), tb["trong_tam"], *[v["vi_tri"] for v in pt["vi_tri"] if v["suc"]["suc"] == "bi_kim"], *range(len(pt["vi_tri"]))]))
    hop, da = [], set()
    for i in thu_tu:
        v = pt["vi_tri"][i]
        l = _la(v["id"])
        if l["viec"] in da:
            continue
        da.add(l["viec"])
        hop.append(kh.hop("loi_khuyen", f"Từ lá {l['ten']} ({tb['vi_tri'][i]['ten']})", l["viec"],
                          can_cu=[f"Marseille (Jodorowsky, tóm ý): {l['truong_phai']['tdm']['loi']}"],
                          ma=kh.ma_mau(MO_DUN, "viec", l["id"], "n" if v["nguoc"] else "x"), phai="tdm", la=_tom_la(l, v["nguoc"])))
        if len(hop) >= 3:
            break
    return kh.chuong("viec_nen_lam", c["tieu_de"], [str(kb.mau("viec_mo"))], hop=hop[:4] if len(hop) >= 2 else hop, cau_hoi=c["cau_hoi"],
                     cau_tu_soi="Trong các việc trên, việc nào bạn làm được ngay tối nay?")


def _tuoi(nam_sinh: dt.date | int | None, ngay_xem: dt.date) -> int | None:
    if nam_sinh is None:
        return None
    if isinstance(nam_sinh, dt.date):
        t = ngay_xem.year - nam_sinh.year - ((ngay_xem.month, ngay_xem.day) < (nam_sinh.month, nam_sinh.day))
    else:
        t = ngay_xem.year - int(nam_sinh)
    return max(t, 0)


def _chuong_tuong_va_la(pt: dict, tb: dict, tuoi: int | None, gioi_tinh: str | None, tra_loi_nt: dict | None, bo_dai_dien: str | None) -> dict:
    c = kb.chuong()["tuong_va_la"]
    ngu_hinh, dang = None, None
    if tra_loi_nt:
        from app.calc import nhan_tuong as calc_nt  # noqa: PLC0415
        tl = calc_nt.tra_loi_sach(tra_loi_nt)
        nh = calc_nt.ngu_hinh(tl)
        ngu_hinh = nh["hinh"] if nh["hinh"] != "pha" else None
        dang = tl.get("dang")
    dd = calc.dai_dien(tuoi, gioi_tinh, ngu_hinh=ngu_hinh, bo=bo_dai_dien, dang=dang)
    if not dd:
        return kh.chuong("tuong_va_la", c["tieu_de"], [str(kb.mau("dai_dien_mo")), str(kb.mau("dai_dien_thieu"))], cau_hoi=c["cau_hoi"], thieu=str(kb.mau("dai_dien_thieu")))
    l = _la(dd["id"])
    bo = kb.bo()[dd["bo"]]
    trong_bai = next((v for v in pt["vi_tri"] if v["id"] == dd["id"]), None)
    noi_dung = f"{l.get('nhan_vat') or ''} {l['y_xuoi']}".strip()
    if trong_bai:
        noi_dung += f" Lá này có mặt ngay trong trải bài ở vị trí '{tb['vi_tri'][trong_bai['vi_tri']]['ten']}' — chuyện này đang nói thẳng về bạn."
    hop = [kh.hop("cot_loi", f"Lá đại diện: {l['ten']}", noi_dung, can_cu=[dd["ly_do"], f"Waite (1910) chọn lá đại diện theo tuổi và dáng vẻ người hỏi; ở đây thay dáng vẻ bằng dáng mặt bạn tự quan sát (Nhân tướng) — chỉ cho chính bạn."],
                  ma=kh.ma_mau(MO_DUN, "tuong_va_la", l["id"]), phai=PHAI_CHUNG, la=_tom_la(l, False), ngu_hinh=ngu_hinh)]
    doan = [str(kb.mau("dai_dien_mo")), f"Bộ {bo['ten']} ({kb.TEN_NGUYEN_TO[bo['nguyen_to']]}) nói về {bo['mang']}; {bo['loi']}"]
    return kh.chuong("tuong_va_la", c["tieu_de"], doan, hop=hop, cau_hoi=c["cau_hoi"], cau_tu_soi=f"Nếu bạn là {l['ten']}, nét nào của lá ấy bạn nhận ra ở mình trong tuần này?")


# ------------------------------------------------------------------ báo cáo
def bao_cao(trai_bai: str, la: list[dict], *, cau_hoi: str | None = None, chu_de: str | None = None, ngay_xem: dt.date | None = None,
            nam_sinh: dt.date | int | None = None, gioi_tinh: str | None = None, tra_loi_nhan_tuong: dict | None = None,
            bo_dai_dien: str | None = None, trong_so: dict | None = None, ca_nhan: dict | None = None) -> dict:
    ngay_xem = ngay_xem or config.hom_nay_vn()
    tb = {**kb.trai_bai()[trai_bai], "_ma": trai_bai} if trai_bai in kb.trai_bai() else None
    if not tb:
        raise ValueError(f"Không có trải bài {trai_bai}")
    pt = calc.phan_tich(trai_bai, la)
    linh_vuc = _linh_vuc(cau_hoi, chu_de)
    hop_la = [_hop_la(v, tb, linh_vuc, pt) for v in pt["vi_tri"]]
    chuong = [_chuong_tong_quan(pt, tb, hop_la), _chuong_tung_la(hop_la, tb), _chuong_dong_chay(pt, tb), _chuong_ben_trong(pt, tb),
              _chuong_thoi_diem(pt, tb, ngay_xem), _chuong_viec(pt, tb),
              _chuong_tuong_va_la(pt, tb, _tuoi(nam_sinh, ngay_xem), gioi_tinh, tra_loi_nhan_tuong, bo_dai_dien)]
    thu_tu = kb.thu_tu_chuong()
    chuong.sort(key=lambda c: thu_tu.index(c["ma"]) if c["ma"] in thu_tu else 99)
    cot_loi = []
    tt = hop_la[tb["trong_tam"]]
    cot_loi.append({**tt, "tu_chuong": "tung_la", "loai_goc": tt["loai"], "loai": "cot_loi"})
    for ma, loai in (("dong_chay", "luu_y"), ("thoi_diem", "thoi_diem"), ("viec_nen_lam", "loi_khuyen")):
        c = next(x for x in chuong if x["ma"] == ma)
        h = next((x for x in c["hop"] if x["loai"] == loai), None) or (c["hop"][0] if c["hop"] else None)
        if h:
            cot_loi.append({**h, "tu_chuong": ma, "loai_goc": h["loai"], "loai": "cot_loi"})
    bc = {"mo_dun": MO_DUN, "phien_ban": kh.PHIEN_BAN, "phai": PHAI_CHUNG, "trang_thai": kb.meta()["trang_thai"], "ten": "Trải bài của bạn",
          "cot_loi": cot_loi[:4], "chuong": chuong, "ket": str(kb.mau("ket")), "thieu": [c["thieu"] for c in chuong if c.get("thieu")],
          "cau_hoi": None, "chu_de": chu_de if chu_de in kb.chu_de() else None, "linh_vuc": linh_vuc,
          "da_tinh": {"trai_bai": trai_bai, "ten_trai_bai": tb["ten"], "vi_tri": [{**v, "ten_la": _la(v["id"])["ten"]} for v in pt["vi_tri"]],
                      "ke_can": pt["ke_can"], "nguyen_to": pt["nguyen_to"], "an_chinh": pt["an_chinh"], "so_hoc": pt["so_hoc"], "huong_nhin": pt["huong_nhin"],
                      "ngay_xem": ngay_xem.isoformat()}}
    kh.ap_hoc(bc, trong_so, ca_nhan)
    return bc


# ------------------------------------------------------------------ lá ngày, bộ bài
def la_ngay(ngay: dt.date | None = None, ngay_sinh: dt.date | None = None) -> dict:
    ngay = ngay or config.hom_nay_vn()
    x = calc.la_ngay(ngay, ngay_sinh)
    l = _la(x["id"])
    return {"ngay": ngay.isoformat(), "rieng": x["rieng"],
            "la": {**_tom_la(l, False), "tu_khoa": l["tu_khoa"][:3], "y_xuoi": l["y_xuoi"], "viec": l["viec"], "cau_tu_soi": l["cau_tu_soi"], "hinh_anh": l["hinh_anh"]},
            "cach_tinh": "Lá của ngày chọn tất định từ ngày (và ngày sinh khi là lá riêng) — cùng ngày thì cùng lá; luôn đọc xuôi."}


def bo_bai() -> dict:
    """Dữ liệu bộ bài cho web vẽ (không có nhãn nội bộ): 78 lá rút gọn, bộ, nguyên tố, trải bài, chủ đề, trường phái."""
    la = {ma: {**_tom_la(x, False), "tu_khoa": x["tu_khoa"][:3], "huong_nhin": x["huong_nhin"], "chiem_tinh": (x.get("chiem_tinh") or {}).get("ten"),
               "decan": x.get("decan")} for ma, x in kb.la().items()}
    for v in la.values():
        v.pop("nguoc", None)
    return {"la": la, "thu_tu": list(calc.BO_BAI), "bo": kb.bo(), "nguyen_to": kb.nguyen_to(),
            "trai_bai": {k: {kk: vv for kk, vv in v.items() if kk != "_ma"} for k, v in kb.trai_bai().items()},
            "chu_de": {k: {"ten": v["ten"]} for k, v in kb.chu_de().items()},
            "truong_phai": {k: {"ten": v["ten"], "ngan": v["ngan"], "mo_ta": v["mo_ta"], "hoi": v["hoi"]} for k, v in kb.truong_phai().items()},
            "pham_gia": kb.pham_gia()}


# ------------------------------------------------------------------ hỏi đáp
_NGUOC = re.compile(r"(?<![a-z])(nguoc|reversed|dao nguoc|lon nguoc)(?![a-z])")
_LA_THU = re.compile(r"(?:la|vi tri) (?:thu |so )?(\d{1,2})")
_VI_TRI_TU = {"ket qua": "kha_nang", "kha nang": "kha_nang", "tuong lai": "sap_toi", "sap toi": "sap_toi", "dieu can": "dieu_can", "can tro": "dieu_can",
              "loi khuyen": "loi_khuyen", "qua khu": "qua_khu", "goc re": "goc_re", "hien tai": "hien_tai", "tam diem": "tam_diem", "hy vong": "hy_vong_noi_lo", "noi lo": "hy_vong_noi_lo"}


def _tim_la(t: str) -> tuple[str | None, str]:
    """(id, chuỗi đã bỏ tên lá) — tên dài nhất khớp theo ranh giới từ."""
    tot, dai, khop = None, 0, ""
    for ma, ds in kb.tu_khoa("la").items():
        for k in ds:
            if len(k) > dai and re.search(rf"(?<![a-z0-9]){re.escape(k)}(?![a-z0-9])", t):
                tot, dai, khop = ma, len(k), k
    return tot, (re.sub(rf"(?<![a-z0-9]){re.escape(khop)}(?![a-z0-9])", " ", t) if tot else t)


def _tra_loi_la(l: dict, nguoc: bool, linh_vuc: str | None, vi_tri: dict | None = None) -> dict:
    y = _y(l, nguoc)
    if vi_tri:
        van = str(kb.mau("hoi", "vi_tri")).format(ten=l["ten"], nguoc=" (ngược)" if nguoc else "", vi_tri=vi_tri["ten"], hoi=vi_tri["hoi"], y=y)
    else:
        van = str(kb.mau("hoi", "nghia_la")).format(ten=l["ten"], en=l["en"], nguoc=" ngược" if nguoc else "", y=y, tu_khoa=", ".join(l["tu_khoa_nguoc"] if nguoc else l["tu_khoa"]))
    if linh_vuc and l["linh_vuc"].get(linh_vuc):
        ten_lv = {"tinh_cam": "tình cảm", "cong_viec": "công việc", "tien_bac": "tiền bạc", "suc_khoe": "sức khoẻ và nhịp sống"}[linh_vuc]
        van += " " + str(kb.mau("hoi", "nghia_linh_vuc")).format(linh_vuc=ten_lv, loi=l["linh_vuc"][linh_vuc])
        if linh_vuc == "suc_khoe":
            van += " Đây là lời nhắc nhịp sống, không thay lời bác sĩ."
    van += f" Việc nên làm: {l['viec']}"
    hoi_tiep = [f"{l['ten']} {'xuôi' if nguoc else 'ngược'} nghĩa là gì?"]
    for lv, ten_lv in (("tinh_cam", "tình cảm"), ("cong_viec", "công việc"), ("tien_bac", "tiền bạc")):
        if lv != linh_vuc:
            hoi_tiep.append(f"{l['ten']} trong {ten_lv} thì sao?")
    return {"cau_tra_loi": van, "can_cu": [f"Hình (Waite): {l['hinh_anh']}", *_can_cu_phai(l)], "hoi_tiep": hoi_tiep[:3], "xu_ly": "vi_tri" if vi_tri else "nghia_la",
            "la": l["id"], "nguoc": nguoc, "linh_vuc": linh_vuc, "ten_la": l["ten"], "cau_tu_soi": l["cau_tu_soi"]}


def hoi(cau: str, *, trai_bai: str | None = None, la: list[dict] | None = None, ngay_xem: dt.date | None = None) -> dict:
    """Hỏi đáp tất định: nghĩa lá (xuôi / ngược, theo lĩnh vực), lá ở một vị trí của trải bài vừa rút, trải bài, khái niệm.
    An toàn / từ chối / dẫn hướng dùng MỘT bộ chặn chung; câu hỏi về người khác → chuyển về điều chính mình làm được."""
    from app.hoidap import chung  # noqa: PLC0415
    from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu an toàn / từ chối dùng chung các mảng
    from app.luangiai.hoi import chuan_hoa_cau  # noqa: PLC0415
    goc = (cau or "").strip()
    t = chuan_hoa_cau(goc)
    kq = {"cau_tra_loi": "", "can_cu": [], "hoi_tiep": [], "xu_ly": "tra_loi", "la": None, "nguoc": False, "linh_vuc": None}
    db = chung.dac_biet(t, goc)
    if db == "an_toan":
        kq.update(cau_tra_loi=kinhdich_kb.mau("an_toan") or "", xu_ly="an_toan")
        return kq
    if db == "tu_choi_nhe" or chung.co(t, kb.tu_khoa("ngoai")):
        kq.update(cau_tra_loi=chung.mau_tu_choi(goc, t, kinhdich_kb.mau("tu_choi") or ""), xu_ly="tu_choi_nhe")
        return kq
    if db == "dan_huong":
        kq.update(cau_tra_loi=chung.mau_dan_huong(t), xu_ly="dan_huong")
        return kq
    linh_vuc = _linh_vuc(goc, None)
    if chung.co(t, kb.tu_khoa("nguoi_khac")):
        kq.update(cau_tra_loi=str(kb.mau("hoi", "nguoi_khac")), xu_ly="nguoi_khac", linh_vuc=linh_vuc,
                  hoi_tiep=["Tôi nên làm gì với mối quan hệ này?", "Lá nào nói về chuyện tin nhau?"])
        return kq
    tb = {**kb.trai_bai()[trai_bai], "_ma": trai_bai} if trai_bai in kb.trai_bai() else None
    ds = None
    if tb and la:
        try:
            ds = calc.chuan_la(la, len(tb["vi_tri"]))
        except ValueError:
            ds = None
    # lá ở một vị trí của trải bài vừa rút
    if tb and ds:
        m = _LA_THU.search(t)
        vt_ma = next((v for k, v in _VI_TRI_TU.items() if k in t), None)
        i = None
        if m and 1 <= int(m.group(1)) <= len(ds):
            i = int(m.group(1)) - 1
        elif vt_ma:
            i = next((j for j, v in enumerate(tb["vi_tri"]) if v["ma"] == vt_ma), None)
            if i is None and vt_ma == "kha_nang" and tb.get("thoi_diem"):
                i = tb["thoi_diem"][-1]
            if i is None and vt_ma == "sap_toi" and tb.get("thoi_diem"):
                i = tb["thoi_diem"][0]
        if i is not None:
            l = _la(ds[i]["id"])
            kq.update(_tra_loi_la(l, ds[i]["nguoc"], linh_vuc, tb["vi_tri"][i]))
            kq["vi_tri"] = i
            return kq
    ma_la, con = _tim_la(t)
    if ma_la:
        l = _la(ma_la)
        nguoc = bool(_NGUOC.search(con))
        if not nguoc and ds:
            nguoc = next((x["nguoc"] for x in ds if x["id"] == ma_la), False)
        kq.update(_tra_loi_la(l, nguoc, linh_vuc))
        return kq
    for ma, ds_tk in kb.tu_khoa("trai_bai").items():
        if chung.co(t, [re.escape(k) for k in ds_tk]):
            x = kb.trai_bai()[ma]
            kq.update(cau_tra_loi=str(kb.mau("hoi", "trai_bai")).format(ten=x["ten"], mo_ta=x["mo_ta"], vi_tri="; ".join(f"{i + 1}. {v['ten']} ({v['hoi'].lower()})" for i, v in enumerate(x["vi_tri"]))),
                      xu_ly="trai_bai", can_cu=["Celtic Cross: Waite ghi lại trong The Pictorial Key to the Tarot (1910)."] if ma == "celtic" else [],
                      hoi_tiep=["Lá ngược nghĩa là gì?", "Phẩm giá nguyên tố là gì?"])
            return kq
    for ma, ds_tk in kb.tu_khoa("khai_niem").items():
        if chung.co(t, [re.escape(k) for k in ds_tk]):
            kq.update(cau_tra_loi=str(kb.mau("khai_niem", ma)), xu_ly="khai_niem",
                      hoi_tiep=["Lá Tháp nghĩa là gì?", "Celtic Cross là trải bài gì?", "Ẩn chính khác ẩn phụ thế nào?"])
            return kq
    kq.update(cau_tra_loi=str(kb.mau("hoi", "khong_hieu")), xu_ly="khong_hieu",
              hoi_tiep=["Lá Tháp nghĩa là gì?", "Ba Cốc ngược trong tình cảm?", "Celtic Cross là trải bài gì?"])
    return kq
