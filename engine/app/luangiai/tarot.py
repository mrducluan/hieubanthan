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
from app.kb.loi import L

MO_DUN = "tarot"
PHAI_CHUNG = "tarot_tong_hop"
TEN_PHAI = {"rws": "Waite (RWS)", "thoth": "Thoth / Golden Dawn", "tdm": "Marseille", "bota": "B.O.T.A."}
_MUC_SUC = {"tiep_suc": "thuan", "binh": "can_bang", "bi_kim": "can_chu_dong"}
_LOAI_SAC = {"sang": "diem_manh", "trung": "cot_loi", "nang": "luu_y"}
# QTE-2: mọi chuỗi hiển thị đi qua `L(mã, bản Việt)` — tiếng Việt trả nguyên bản; ngôn ngữ khác tra `data/<ngôn ngữ>/loi_khuon.json`.
_TEN_NG_VI = {"tien": "tiến", "dieu_kien": "được nếu có điều kiện", "cho": "chưa nên vội"}
_TEN_QH_VI = {"manh": "cùng nguyên tố, mạnh lên", "hop": "hợp nhau", "trung": "không hợp không xung", "xung": "xung nhau"}
TOI_DA_DONG_CHAY = 6
_LOI_CAP_VI = {"manh": "cùng một nguyên tố, hai lá đẩy nhau mạnh lên (cả mặt sáng lẫn mặt đang lệch).",
               "hop": "hai nguyên tố hợp nhau, hai lá đỡ nhau.",
               "xung": "hai nguyên tố xung nhau, hai lá kìm nhau: tính chất của cả hai yếu đi hoặc lệch đi.",
               "trung": "không hợp không xung."}
# chữ HIỂN THỊ của dòng chảy (TR-4): không tên nguyên tố / trường phái — chúng nằm ở "Vì sao nói vậy"
_QH_THUONG_VI = {"manh": "đẩy nhau mạnh lên", "hop": "đỡ nhau", "xung": "kéo hai hướng"}
_LOI_CAP_THUONG_VI = {"manh": "cùng một kiểu sức nên đẩy nhau mạnh lên — cả mặt sáng lẫn mặt đang lệch của hai lá đều rõ hơn.",
                      "hop": "đỡ nhau — tính chất của hai lá dễ đi cùng một hướng.",
                      "xung": "kéo theo hai hướng khác nhau — tính chất của cả hai lá yếu đi hoặc lệch đi."}


def _ten_ng(k: str) -> str:
    return L(f"tarot.ten_ng.{k}", _TEN_NG_VI[k])


def _ten_qh(k: str) -> str:
    return L(f"tarot.ten_qh.{k}", _TEN_QH_VI[k])


def _loi_cap(k: str) -> str:
    return L(f"tarot.loi_cap.{k}", _LOI_CAP_VI[k])


def _qh_thuong(k: str) -> str:
    return L(f"tarot.qh_thuong.{k}", _QH_THUONG_VI[k])


def _loi_cap_thuong(k: str) -> str:
    return L(f"tarot.loi_cap_thuong.{k}", _LOI_CAP_THUONG_VI[k])


def _ten_nt(k: str) -> str:
    """Tên nguyên tố hiển thị (KB `nguyen_to.<k>.ten` đã theo ngôn ngữ; dự phòng bảng cố định)."""
    return (kb.nguyen_to().get(k) or {}).get("ten") or kb.TEN_NGUYEN_TO[k]


def _suc_chu(k: str) -> str:
    return str((kb.pham_gia().get("suc") or {}).get(k) or k)


# ------------------------------------------------------------------ tiện ích
def _la(ma: str) -> dict:
    x = kb.mot_la(ma)
    if not x:
        raise ValueError(f"Không có lá {ma}")
    return x


def _ten(l: dict, nguoc: bool) -> str:
    return f"{l['ten']}{L('tarot.nguoc_hau_to', ' (ngược)') if nguoc else ''}"


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
    if not ra:
        # QTE-2 (bản phủ ngôn ngữ tắt `truong_phai`): dẫn thẳng nguyên văn công cộng Waite 1910 / Mathers 1888 (tiếng Anh).
        for tr in l.get("trich") or []:
            if tr.get("sach") in ("waite_1910", "mathers_1888") and tr.get("nguyen_van"):
                ra.append(f"{kb.ten_nguon(tr['sach'])}: {tr['nguyen_van']}" + (f" Reversed: {tr['nguyen_van_nguoc']}" if tr.get("nguyen_van_nguoc") else ""))
    ct = l.get("chiem_tinh")
    if ct:
        ra.append(L("tarot.can_cu.golden_dawn", "Golden Dawn gắn lá này với {ten}; chữ Hebrew {chu}, con đường {duong} trên Cây Sự sống.", ten=ct['ten'], chu=l.get('chu_cai'), duong=l.get('duong')))
    elif l.get("decan"):
        d = calc.decan(l["id"]) or {}
        c = kb.cung_hoang_dao().get(d.get("cung") or "") or {}
        h = kb.hanh_tinh().get(d.get("hanh_tinh") or "") or {}
        ra.append(L("tarot.can_cu.book_t_decan", "Book T: decan {so} của {cung} ({hanh_tinh}), Sephirah {sephirah}; {thoth}.", so=d.get('so'), cung=c.get('ten'), hanh_tinh=h.get('ten'), sephirah=kb.sephirah(l['so']), thoth=l.get('thoth_ten')))
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


_TEN_LV_VI = {"tinh_cam": "tình cảm", "cong_viec": "công việc", "tien_bac": "tiền bạc", "suc_khoe": "sức khoẻ và nhịp sống"}


def _ten_lv(k: str) -> str:
    return L(f"tarot.ten_lv.{k}", _TEN_LV_VI[k])


def _tu_khoa(l: dict, nguoc: bool) -> list[str]:
    """Từ khoá hiển thị; bản phủ ngôn ngữ tắt `tu_khoa` → lấy từ nguyên văn Waite 1910 (danh sách cách nhau bằng dấu phẩy)."""
    k = l.get("tu_khoa_nguoc" if nguoc else "tu_khoa")
    if k:
        return list(k)
    tr = next((x for x in l.get("trich") or [] if x.get("sach") == "waite_1910"), None)
    van = (tr or {}).get("nguyen_van_nguoc" if nguoc else "nguyen_van") or ""
    return [x.strip().lower().rstrip(".") for x in van.split(",") if x.strip()][:4]
_MUC_NG = {"tien": "thuan", "dieu_kien": "can_bang", "cho": "can_chu_dong"}
_LOAI_NG = {"tien": "diem_manh", "dieu_kien": "cot_loi", "cho": "luu_y"}


def _lv(l: dict, nguoc: bool, linh_vuc: str | None) -> str | None:
    """Nghĩa của lá trong một lĩnh vực ĐÚNG chiều lá (lá ngược đọc `linh_vuc_nguoc`, không mượn nghĩa xuôi)."""
    if not linh_vuc:
        return None
    return ((l.get("linh_vuc_nguoc") if nguoc else l.get("linh_vuc")) or {}).get(linh_vuc)


def _cau_suc(suc: dict, nguoc: bool) -> str | None:
    if suc["triet_tieu"]:
        return str(kb.mau("suc", "triet_tieu"))
    if not suc["chi_tiet"]:
        return None
    if nguoc and suc["suc"] in ("tiep_suc", "bi_kim"):
        return str(kb.mau("suc", f"{suc['suc']}_nguoc"))
    return str(kb.mau("suc", suc["suc"]))


# ------------------------------------------------------------------ từng chương
def _hop_la(v: dict, tb: dict, linh_vuc: str | None, pt: dict) -> dict:
    l = _la(v["id"])
    nguoc = v["nguoc"]
    sac = l["sac_thai_nguoc"] if nguoc else l["sac_thai"]
    vt = tb["vi_tri"][v["vi_tri"]]
    suc = v["suc"]
    doan = [_y(l, nguoc)]
    lv = _lv(l, nguoc, linh_vuc)
    if lv:
        doan.append(L("tarot.trong_chuyen", "Trong chuyện {lv}: {loi}", lv=_ten_lv(linh_vuc), loi=lv))
    cs = _cau_suc(suc, nguoc)
    if cs:
        doan.append(cs)
    ng = calc.nghieng_la(l["id"], nguoc)
    can_cu = [L("tarot.can_cu.vi_tri_hinh", "Vị trí '{vt}': {hoi}. Hình (Waite): {hinh}", vt=vt['ten'], hoi=vt['hoi'], hinh=l['hinh_anh'])]
    if suc["chi_tiet"]:
        ke = "; ".join(f"{_la(pt['vi_tri'][int(k.split('_')[-1])]['id'])['ten']} ({_ten_qh(q)})" for k, q in suc["chi_tiet"])
        can_cu.append(L("tarot.can_cu.pham_gia", "Phẩm giá nguyên tố (Book T): lá {nt} bên cạnh {ke} → {suc}.", nt=_ten_nt(l['nguyen_to']), ke=ke, suc=_suc_chu(suc['suc'])))
    can_cu += _can_cu_phai(l)
    if nguoc:
        can_cu.append(L("tarot.can_cu.la_nguoc", "Lá ngược đọc theo lối Waite (tính chất bị chặn / hướng vào trong); Marseille và Thoth không dùng lá ngược."))
    can_cu.append(L("tarot.can_cu.muc_hop", "Mức của hộp = lá này nghiêng về {ng} với câu 'có nên / có thành không' (lối đọc có – không của Waite), "
                    "không tính theo sức lá bên cạnh ({suc}).", ng=_ten_ng(ng), suc=_suc_chu(suc['suc'])))
    return kh.hop(_LOAI_SAC[sac], f"{vt['ten']}: {_ten(l, nguoc)}", " ".join(doan), huong_xu_ly=l["viec"], can_cu=can_cu,
                  ma=kh.ma_mau(MO_DUN, "tung_la", tb_ma(tb), vt["ma"], l["id"], "n" if nguoc else "x"), muc=_MUC_NG[ng],
                  phai="rws" if nguoc else PHAI_CHUNG, la=_tom_la(l, nguoc), vi_tri={"so": v["vi_tri"], "ma": vt["ma"], "ten": vt["ten"], "hoi": vt["hoi"]},
                  suc=suc["suc"], tu_khoa=_tu_khoa(l, nguoc)[:3], cau_tu_soi=l["cau_tu_soi"])


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
    hop.append(kh.hop("cot_loi", L("tarot.tq.an_chinh_tieu_de", "{so} trên {tong} lá là ẩn chính", so=an['so'], tong=an['tong']), str(kb.mau("an_chinh", an["muc"])).format(so=an["so"], tong=an["tong"]),
                      can_cu=[L("tarot.tq.an_chinh_can_cu", "Ẩn chính: {ds}.", ds=', '.join(_la(v['id'])['ten'] for v in pt['vi_tri'] if v['loai'] == 'an_chinh') or L("tarot.khong_co", "không có"))],
                      ma=kh.ma_mau(MO_DUN, "tong_quan", "an_chinh", an["muc"]), phai=PHAI_CHUNG))
    nt = pt["nguyen_to"]
    if nt["troi"]:
        x = kb.nguyen_to()[nt["troi"]]
        hop.append(kh.hop("diem_manh", L("tarot.tq.nguyen_to_troi", "Nguyên tố trội: {ten}", ten=x['ten']), str(kb.mau("nguyen_to_troi")).format(ten=x["ten"], so=nt["dem"][nt["troi"]], tong=n, loi=x["loi"]),
                          can_cu=[L("tarot.tq.dem_nguyen_to", "Đếm nguyên tố: {ds} (Golden Dawn: mỗi lá một nguyên tố).", ds=", ".join(f"{_ten_nt(k)} {v}" for k, v in nt["dem"].items()))],
                          ma=kh.ma_mau(MO_DUN, "tong_quan", "nguyen_to", nt["troi"]), phai="thoth"))
    for k in nt["thieu"]:
        x = kb.nguyen_to()[k]
        hop.append(kh.hop("luu_y", L("tarot.tq.khong_co_la", "Không có lá {ten} nào", ten=x['ten']), str(kb.mau("nguyen_to_thieu")).format(ten=x["ten"], thieu=kb.mau("thieu", k)),
                          huong_xu_ly=str(kb.mau("thieu", k)).split("—")[-1].strip().capitalize(), can_cu=[L("tarot.tq.thieu_can_cu", "Thiếu một nguyên tố trong trải bài ≥ 5 lá (Golden Dawn): phần đời ấy chưa được hỏi tới.")],
                          ma=kh.ma_mau(MO_DUN, "tong_quan", "thieu", k), phai="thoth"))
    sh = pt["so_hoc"]
    if len(sh["day"]) >= 2:
        day = " → ".join(str(s) for s in sh["day"])
        lap = next((s for s in sh["day"] if sh["day"].count(s) > 1), None)
        loi = str(kb.mau("so_hoc", sh["xu_huong"])).format(day=day, so=lap, y=kb.so_hoc(lap) if lap else "")
        hop.append(kh.hop("cot_loi", L("tarot.tq.nhip_so", "Nhịp số: {day}", day=day), loi, can_cu=[L("tarot.tq.nhip_so_can_cu", "Lối Marseille: đọc các lá số 1–10 theo thứ tự vị trí như một dòng chảy; {ds}", ds="; ".join(f"{s} = {kb.so_hoc(s)}" for s in sorted(set(sh["day"]))))],
                          ma=kh.ma_mau(MO_DUN, "tong_quan", "so_hoc", sh["xu_huong"]), phai="tdm"))
    tt = hop_la[tb["trong_tam"]]
    tom_tat = L("tarot.tq.tam_diem", "Tâm điểm: {la} — {tu_khoa}.", la=f"{tt['la']['ten']}{L('tarot.nguoc_hau_to', ' (ngược)') if tt['la']['nguoc'] else ''}", tu_khoa=', '.join(tt['tu_khoa']))
    return kh.chuong("tong_quan", c["tieu_de"], doan, hop=hop, muc=_gop_muc([h.get("muc") for h in hop_la]), tom_tat=tom_tat, cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("tarot.tq.tu_soi", "Nhìn cả bàn bài, lá nào bạn thấy mắt mình dừng lại lâu nhất — vì sao?"))


def _chuong_tung_la(hop_la: list[dict], tb: dict) -> dict:
    c = kb.chuong()["tung_la"]
    muc = _gop_muc([h.get("muc") for h in hop_la])
    tom = {"thuan": "Phần lớn các lá nghiêng về thuận.", "can_bang": "Có lá thuận, có lá vướng — đọc từng vị trí để thấy chỗ nào cần gỡ.",
           "can_chu_dong": "Nhiều lá khuyên đi chậm — nên làm rõ trước rồi mới tiến."}
    m = muc or "can_bang"
    return kh.chuong("tung_la", c["tieu_de"], [c["mo_ta"]], hop=hop_la, muc=muc, tom_tat=L(f"tarot.tl.tom.{m}", tom[m]), cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("tarot.tl.tu_soi", "Lá nào ở vị trí nào làm bạn gật đầu ngay, lá nào bạn muốn cãi lại?"))


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
        nta, ntb = _ten_nt(a["nguyen_to"]), _ten_nt(b["nguyen_to"])
        loi = L("tarot.dc.cap", "Lá {a} ({vta}) và lá {b} ({vtb}) {loi}", a=a['ten'], vta=vt[cap['a']]['ten'], b=b['ten'], vtb=vt[cap['b']]['ten'], loi=_loi_cap_thuong(qh))
        can_them = [L("tarot.dc.cap_can_cu", "Lá {a} là {nta}, lá {b} là {ntb} — {loi}", a=a['ten'], nta=nta, b=b['ten'], ntb=ntb, loi=_loi_cap(qh))]
        # lá giữa có hai lá hai bên xung NHAU thì không bị hai lá ấy kìm (Book T) — nói rõ để không ngược hộp từng vị trí
        giua = [x for x in (cap["a"], cap["b"]) if pt["vi_tri"][x]["suc"]["triet_tieu"]]
        if giua:
            can_them.append(L("tarot.dc.giua", "Riêng lá {ten} đứng giữa hai lá xung nhau nên giữ nguyên nghĩa gốc (Book T).", ten=la_o[giua[0]]['ten']))
        lech = [la_o[x] for x in (cap["a"], cap["b"]) if calc.nghieng_la(la_o[x]["id"], pt["vi_tri"][x]["nguoc"]) == "cho"]
        if qh == "xung":
            loi += " " + L("tarot.dc.xung", "Đây là chỗ việc dễ chậm hoặc lệch: coi nó là việc cần chủ động gỡ, không phải điều tự đến.")
            loai = "luu_y"
        elif lech and len(lech) < 2:
            # một lá đang lệch được đẩy mạnh theo — không gọi là "chỗ chảy dễ"
            loi += " " + L("tarot.dc.mot_lech", "Lá {ten} đang lệch nên mặt lệch cũng được đẩy mạnh theo — dựa vào lá kia để kéo nó về.", ten=lech[0]['ten'])
            loai = "cot_loi"
        elif lech:
            loi += " " + L("tarot.dc.hai_lech", "Cả hai lá đều đang lệch nên chỗ này dễ trượt nhanh — chậm lại trước khi làm thêm.")
            loai = "luu_y"
        else:
            loi += " " + L("tarot.dc.chay_de", "Đây là chỗ việc chảy dễ — nên bắt đầu từ đây.")
            loai = "diem_manh"
        hop.append(kh.hop(loai, L("tarot.dc.tieu_de", "{a} và {b}: {qh}", a=a['ten'], b=b['ten'], qh=_qh_thuong(qh)), loi,
                          huong_xu_ly=L("tarot.dc.huong_xung", "Làm việc của lá được tiếp sức trước, để nó kéo lá bị kìm.") if qh == "xung" else None,
                          can_cu=[*can_them, L("tarot.dc.pham_gia_can_cu", "Phẩm giá nguyên tố (Book T): {nta} × {ntb} → {qh}; hai vị trí kề nhau trên bàn trải bài.", nta=nta, ntb=ntb, qh=qh)],
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
            loi = str(kb.mau("huong_nhin", "toi" if h["huong"] == 1 else "ve")).format(ten=l["ten"], den=L("tarot.dc.den", "lá {ten} ({vt})", ten=la_o[h['toi']]['ten'], vt=d['ten']), y=d["hoi"].lower())
            k = nhin.get(h["toi"])
            if k and k["toi"] == h["vi_tri"]:
                loi += " " + str(kb.mau("huong_nhin", "doi_dau")).format(a=l["ten"], b=la_o[h["toi"]]["ten"])
        if h.get("lat"):
            loi += " " + str(kb.mau("huong_nhin", "lat"))
        hop.append(kh.hop("cot_loi", L("tarot.dc.huong_nhin", "Hướng nhìn: {ten}", ten=l['ten']), loi, can_cu=[L("tarot.dc.huong_nhin_can_cu", "Marseille (bản Conver): nhân vật trên lá {ten} nhìn {huong}; trục đọc = {truc}.", ten=l['ten'], huong=L("tarot.nhin.thang", "thẳng") if h['huong'] == 0 else L("tarot.nhin.phai", "sang phải") if h['huong'] == 1 else L("tarot.nhin.trai", "sang trái"), truc=' → '.join(vt[i]['ten'] for i in tb.get('truc_nhin', [])))],
                          ma=kh.ma_mau(MO_DUN, "dong_chay", "nhin", vt[h["vi_tri"]]["ma"], l["id"]), phai="tdm", vi_tri_nhin=h["vi_tri"], toi=h["toi"], huong=h["huong"]))
    doan = [c["mo_ta"]]
    if not hop:
        doan.append(str(kb.mau("khong_dau_hieu")))
    muc = _gop_muc(["can_chu_dong" if h["loai"] == "luu_y" else "thuan" if h["loai"] == "diem_manh" else None for h in hop])
    return kh.chuong("dong_chay", c["tieu_de"], doan, hop=hop, muc=muc, tom_tat=None, cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("tarot.dc.tu_soi", "Hai lá đang 'xung' nhau trên bàn — trong đời bạn, hai việc nào đang kéo nhau như thế?"))


def _chuong_ben_trong(pt: dict, tb: dict) -> dict:
    c = kb.chuong()["ben_trong"]
    chon = [tb["trong_tam"]] + [i for i, v in enumerate(tb["vi_tri"]) if v["ma"] in ("dieu_can", "goc_re", "hy_vong_noi_lo") and i != tb["trong_tam"]]
    if len(tb["vi_tri"]) <= 3:
        chon = list(range(len(tb["vi_tri"])))
    hop = []
    for i in chon[:4]:
        v = pt["vi_tri"][i]
        l = _la(v["id"])
        tp = l.get("truong_phai") or {}
        bota, thoth = (tp.get("bota") or {}).get("loi"), (tp.get("thoth") or {}).get("loi")
        if not bota:
            # bản phủ ngôn ngữ chưa có lời B.O.T.A. → soi bằng câu tự hỏi + nghĩa ngược (mặt tối) của chính lá
            bota, thoth = l["cau_tu_soi"], ""
        mat_toi = thoth.split("mặt tối là")[-1].strip().rstrip(".") if thoth and "mặt tối là" in thoth else ""
        noi_dung = bota + (L("tarot.bt.mat_toi", " Mặt tối của lá này: {mat_toi}.", mat_toi=mat_toi) if mat_toi else "")
        hop.append(kh.hop("cot_loi", L("tarot.bt.tieu_de", "{vt}: {ten} soi nếp nghĩ nào", vt=tb['vi_tri'][i]['ten'], ten=l['ten']), noi_dung,
                          can_cu=[x for x in (f"B.O.T.A. (Paul Foster Case): {bota}" if tp.get("bota") else None, f"Thoth / Golden Dawn: {thoth}" if thoth else None) if x] or _can_cu_phai(l)[:1],
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
            trong = _trong(k, xa)
            loi = str(kb.mau("thoi_diem_decan")).format(ten=l["ten"], tu=_ngay_ngan(k["tu"]), den=_ngay_ngan(k["den"]), nhip=k["nhip"], trong=trong)
            them = L("tarot.td.decan_can_cu", "Lá {ten} ứng decan {so} của cung {cung} ({tu}–{den}); nhịp của bộ {bo}: {nhip}.", ten=l['ten'], so=k['so'], cung=cung['ten'], tu=_ngay_ngan(k['tu']), den=_ngay_ngan(k['den']), bo=bo.get('ten'), nhip=k['nhip'])
            tieu = (L("tarot.td.tieu_nhip", "{vt}: {ten} — nhịp {nhip}", vt=vt['ten'], ten=l['ten'], nhip=k['nhip']) if xa else L("tarot.td.tieu_khoang", "{vt}: {ten} — khoảng {tu} tới {den}", vt=vt['ten'], ten=l['ten'], tu=_ngay_ngan(k['tu']), den=_ngay_ngan(k['den'])))
        elif k["loai"] == "hoang_gia":
            c1, c2 = kb.cung_hoang_dao()[k["cung"]], kb.cung_hoang_dao()[k["cung_sau"]]
            xa = not k["dang_trong"] and k["sau_ngay"] > 60
            trong = _trong(k, xa)
            loi = str(kb.mau("thoi_diem_hoang_gia")).format(ten=l["ten"], tu=_ngay_ngan(k["tu"]), den=_ngay_ngan(k["den"]), nhip=k["nhip"], trong=trong)
            them = L("tarot.td.hoang_gia_can_cu", "Lá {ten} (Book T) cai khoảng từ 20° {c1} tới 20° {c2} ({tu}–{den}); nhịp của bộ {bo}: {nhip}.", ten=l['ten'], c1=c1['ten'], c2=c2['ten'], tu=_ngay_ngan(k['tu']), den=_ngay_ngan(k['den']), bo=bo.get('ten'), nhip=k['nhip'])
            tieu = (L("tarot.td.tieu_nhip", "{vt}: {ten} — nhịp {nhip}", vt=vt['ten'], ten=l['ten'], nhip=k['nhip']) if xa else L("tarot.td.tieu_khoang", "{vt}: {ten} — khoảng {tu} tới {den}", vt=vt['ten'], ten=l['ten'], tu=_ngay_ngan(k['tu']), den=_ngay_ngan(k['den'])))
        elif k["loai"] == "cung":
            cung = kb.cung_hoang_dao()[k["cung"]]
            them = None
            trong = str(kb.mau("dang_trong")) if k["dang_trong"] else str(kb.mau("sap_toi")).format(ngay=k["sau_ngay"])
            loi = str(kb.mau("thoi_diem_cung")).format(ten=l["ten"], cung=cung["ten"], tu=_ngay_ngan(k["tu"]), den=_ngay_ngan(k["den"]), nhip=k["nhip"], trong=trong)
            tieu = L("tarot.td.tieu_mua", "{vt}: {ten} — mùa {cung} ({tu} tới {den})", vt=vt['ten'], ten=l['ten'], cung=cung['ten'], tu=_ngay_ngan(k['tu']), den=_ngay_ngan(k['den']))
        elif k["loai"] == "hanh_tinh":
            ht = kb.hanh_tinh()[k["hanh_tinh"]]
            them = None
            loi = str(kb.mau("thoi_diem_hanh_tinh")).format(ten=l["ten"], hanh_tinh=ht["ten"], nhip=k["nhip"])
            tieu = L("tarot.td.tieu_nhip", "{vt}: {ten} — nhịp {nhip}", vt=vt['ten'], ten=l['ten'], nhip=ht['ten'])
        elif k["loai"] == "bo":
            them = None
            loi = str(kb.mau("thoi_diem_bo")).format(ten=l["ten"], bo=bo.get("ten"), nhip=k["nhip"])
            tieu = L("tarot.td.tieu_bo", "{vt}: {ten} — nhịp bộ {bo}", vt=vt['ten'], ten=l['ten'], bo=bo.get('ten'))
        else:
            them = None
            loi = L("tarot.td.khong_nhip", "Lá {ten} không có nhịp riêng — {nhip}.", ten=l['ten'], nhip=k['nhip'])
            tieu = L("tarot.td.tieu_ben_canh", "{vt}: {ten} — theo nhịp các lá bên cạnh", vt=vt['ten'], ten=l['ten'])
        ng = calc.nghieng_la(l["id"], v["nguoc"])
        hop.append(kh.hop("thoi_diem", tieu, loi, muc=_MUC_NG[ng], tu=_ngay(k["tu"]), den=_ngay(k["den"]),
                          can_cu=[*([them] if them else []), L("tarot.td.book_t", "Book T (Golden Dawn): 36 lá số 2–10 ứng 36 decan hoàng đạo (mỗi decan ~10 ngày, mốc ngày phổ biến lệch ±1 ngày tuỳ năm); Hiệp sĩ, Hoàng hậu, Vua cai từ 20° một cung tới 20° cung sau; nhịp bộ: Gậy, Kiếm ngày–tuần; Cốc tuần–tháng; Tiền tháng–quý."),
                                  L("tarot.td.muc_hop", "Mức của hộp = lá {la} nghiêng về {ng}.", la=_ten(l, v['nguoc']), ng=_ten_ng(ng))],
                          ma=kh.ma_mau(MO_DUN, "thoi_diem", tb_ma(tb), vt["ma"], l["id"]), phai="thoth", la=_tom_la(l, v["nguoc"]), loai_nhip=k["loai"], dang_trong=k["dang_trong"]))
    return kh.chuong("thoi_diem", c["tieu_de"], [str(kb.mau("thoi_diem_mo"))], hop=hop, tom_tat=L("tarot.td.tom_tat", "Nhịp gợi ý để chọn lúc làm, không phải ngày dự báo."),
                     cau_hoi=c["cau_hoi"], cau_tu_soi=L("tarot.td.tu_soi", "Nếu nhịp này đúng, việc bạn nên làm TRƯỚC khoảng ấy là gì?"))


def _trong(k: dict, xa: bool) -> str:
    if k["dang_trong"]:
        return str(kb.mau("dang_trong"))
    if xa:
        return str(kb.mau("cua_so_xa")).format(ngay=k["sau_ngay"], nhip=k["nhip"])
    return str(kb.mau("sap_toi")).format(ngay=k["sau_ngay"])


def _chuong_viec(pt: dict, tb: dict, hc: dict | None = None) -> dict:
    c = kb.chuong()["viec_nen_lam"]
    lv = (hc or {}).get("linh_vuc")
    thu_tu = list(dict.fromkeys([*tb.get("loi_khuyen", []), tb["trong_tam"], *[v["vi_tri"] for v in pt["vi_tri"] if v["suc"]["suc"] == "bi_kim"], *range(len(pt["vi_tri"]))]))
    hop, da = [], set()
    for i in thu_tu:
        v = pt["vi_tri"][i]
        l = _la(v["id"])
        chieu = "n" if v["nguoc"] else "x"
        viec = ((l.get("viec_lv") or {}).get(chieu) or {}).get(lv) if lv else None
        if (viec or l["viec"]) in da:
            continue
        da.add(viec or l["viec"])
        tdm = ((l.get("truong_phai") or {}).get("tdm") or {}).get("loi")
        can_cu = [f"Marseille (Jodorowsky, tóm ý): {tdm}"] if tdm else _can_cu_phai(l)[:1]
        if viec:
            can_cu.insert(0, L("tarot.vn.viec_lv_can_cu", "Việc của lá {la} trong chuyện {lv} (ban biên tập, theo nghĩa của lá trong lĩnh vực này).", la=_ten(l, v['nguoc']), lv=_ten_lv(lv)))
        hop.append(kh.hop("loi_khuyen", L("tarot.vn.tieu_de", "Từ lá {la} ({vt})", la=_ten(l, v['nguoc']), vt=tb['vi_tri'][i]['ten']), viec or l["viec"], can_cu=can_cu,
                          ma=kh.ma_mau(MO_DUN, "viec", l["id"], chieu, *([lv] if viec else [])), phai="tdm", la=_tom_la(l, v["nguoc"])))
        if len(hop) >= 3:
            break
    mo = str(kb.mau("viec_mo_cau")).format(viec=_ten_viec(hc)) if hc and hc.get("co_cau") and lv else str(kb.mau("viec_mo"))
    return kh.chuong("viec_nen_lam", c["tieu_de"], [mo], hop=hop, cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("tarot.vn.tu_soi", "Trong các việc trên, việc nào bạn làm được ngay tối nay?"))


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
        noi_dung += " " + L("tarot.tvl.trong_bai", "Lá này có mặt ngay trong trải bài ở vị trí '{vt}' — chuyện này đang nói thẳng về bạn.", vt=tb['vi_tri'][trong_bai['vi_tri']]['ten'])
    hop = [kh.hop("cot_loi", L("tarot.tvl.tieu_de", "Lá đại diện: {ten}", ten=l['ten']), noi_dung, can_cu=[dd["ly_do"], L("tarot.tvl.waite", "Waite (1910) chọn lá đại diện theo tuổi và dáng vẻ người hỏi; ở đây thay dáng vẻ bằng dáng mặt bạn tự quan sát (Nhân tướng) — chỉ cho chính bạn.")],
                  ma=kh.ma_mau(MO_DUN, "tuong_va_la", l["id"]), phai=PHAI_CHUNG, la=_tom_la(l, False), ngu_hinh=ngu_hinh)]
    doan = [str(kb.mau("dai_dien_mo")), L("tarot.tvl.bo", "Bộ {bo} ({nt}) nói về {mang}; {loi}", bo=bo['ten'], nt=_ten_nt(bo['nguyen_to']), mang=bo['mang'], loi=bo['loi'])]
    return kh.chuong("tuong_va_la", c["tieu_de"], doan, hop=hop, cau_hoi=c["cau_hoi"], cau_tu_soi=L("tarot.tvl.tu_soi", "Nếu bạn là {ten}, nét nào của lá ấy bạn nhận ra ở mình trong tuần này?", ten=l['ten']))


# ------------------------------------------------------------------ TR-2: trả lời đúng câu hỏi
def _vai(tb: dict) -> dict:
    return tb.get("vai_tra_loi") or {"chinh": [[tb["trong_tam"], 1]], "dieu_kien": None, "khuyen": (tb.get("loi_khuyen") or [tb["trong_tam"]])[0], "ket": tb["trong_tam"]}


def _viec_truoc(hc: dict) -> list[str]:
    v = kb.viec_truoc_khi_quyet()
    return list(v.get(hc.get("viec") or "") or v["_linh_vuc"].get(hc.get("linh_vuc") or "") or v["_linh_vuc"]["_chung"])


def _lv_cua(v: dict, lv: str | None) -> tuple[dict, str, str | None]:
    l = _la(v["id"])
    return l, l["tra_loi"]["n" if v["nguoc"] else "x"], _lv(l, v["nguoc"], lv)


def _chan(cau: str | None) -> str | None:
    """Câu hỏi đi qua MỘT bộ chặn chung trước khi đọc bài: 'an_toan' | 'tu_choi' | 'dan_huong' | None."""
    if not (cau or "").strip():
        return None
    from app.hoidap import chung  # noqa: PLC0415
    from app.luangiai.hoi import chuan_hoa_cau  # noqa: PLC0415
    t = chuan_hoa_cau(cau)
    db = chung.dac_biet(t, cau)
    if db == "an_toan":
        return "an_toan"
    if db == "tu_choi_nhe" or chung.co(t, kb.tu_khoa("ngoai")):
        return "tu_choi"
    return "dan_huong" if db == "dan_huong" else None


# CY-2 (2026-11-14): câu về NGƯỜI KHÁC (lòng người ấy, người cùng làm ăn có trung thực không) hoặc câu "nên chú ý gì /
# watch out for" không phải câu có / không → bỏ chip nghiêng (Nghiêng về có…), mở bằng PHÍA BẠN: điểm sáng (lá thuận nhất),
# chỗ cần canh (lá vướng nhất), rồi việc làm trong tuần (hộp lời khuyên có sẵn). Người cùng làm ăn thêm ranh giới pháp lý.
_LAM_AN_GIAU = re.compile(r"(co[ -]?founder|doi tac|nha dau tu|nha cung cap|cong su|nguoi gop von|partner|investor|supplier)"
                          r".{0,40}(giau|qua mat|an chan|hiding|hide|cheat)")
_NGUOI_XAU = re.compile(r"loi dung|choi xau|noi xau|ham hai|tieu nhan|dam sau lung|backstab|using me|use me|gossip")
_NEN_CHU_Y = re.compile(r"(nen|can) (chu y|de y|can than|canh|tranh|luu y)|\b(watch out|watch for|be careful|careful (about|with)|"
                        r"look out|beware|keep an eye)\b")


_NHAN_CO_KHONG = re.compile(r"^(Nghiêng về (có|không)|Có điều kiện|Chưa nên vội|Leans? (yes|no)|Lean (yes|no)|Conditional|Not yet)[^:.]{0,12}:\s*",
                            re.IGNORECASE)


def _phia_ban(cau: str | None, hc: dict) -> dict:
    if not (cau or "").strip():
        return {}
    from app.hoidap import mo_dau  # noqa: PLC0415
    from app.luangiai.hoi import chuan_hoa_cau  # noqa: PLC0415
    t = chuan_hoa_cau(cau)
    nla = mo_dau.la_nguoi_lam_an(t, cau) or bool(_LAM_AN_GIAU.search(t))
    khac = nla or hc.get("y_dinh") == "nguoi_khac" or bool(_NGUOI_XAU.search(t))
    pb = khac or bool(_NEN_CHU_Y.search(t))
    return {"_phia_ban": pb, "_nla": nla, "_khac": khac} if pb else {}


def _hop_phia_ban(hop0: dict, V: list[dict], vt: list[dict], lv: str | None, viec: str, khac: bool = True) -> tuple[dict, str]:
    """Hộp đầu của câu "phía bạn": điểm sáng + chỗ cần canh từ chính các lá đã rút (không nghiêng có / không)."""
    diem = {"tien": 1, "dieu_kien": 0, "cho": -1}
    ds = sorted(range(len(V)), key=lambda i: (-diem[calc.nghieng_la(V[i]["id"], V[i]["nguoc"])], i))
    sang, canh = ds[0], ds[-1]

    def loi(i: int) -> str:
        l, tl, lvt = _lv_cua(V[i], lv)
        return f"{_ten(l, V[i]['nguoc'])} ({vt[i]['ten']}) — {_cau_dau(_NHAN_CO_KHONG.sub('', lvt or l['tra_loi']['n' if V[i]['nguoc'] else 'x'])).rstrip('.')}"
    cau_dau = (L("tarot.tla.phia_ban", "Phía bạn trong {viec}: lá bài không nói được người khác, chỉ nói điều bạn đang có và chỗ bạn cần canh.",
                 viec=viec) if khac else
               L("tarot.tla.phia_ban_chu_y", "Trong {viec}, lá bài chỉ ra điều bạn đang có và chỗ bạn cần canh.", viec=viec))
    nd = " ".join([cau_dau, L("tarot.tla.diem_sang", "Điểm sáng: {loi}.", loi=loi(sang)),
                   L("tarot.tla.cho_can_canh", "Chỗ cần canh: {loi}.", loi=loi(canh))])
    h = {**hop0, "tieu_de": L("tarot.tla.tieu_de_phia_ban", "Phía bạn"), "noi_dung": nd, "muc": None}
    return h, cau_dau


def tra_loi_cau(pt: dict, tb: dict, hc: dict, ngay_xem: dt.date) -> dict:
    """Nghiêng + các hộp trả lời (không gồm lời chặn). Dùng chung cho chương 'Câu trả lời' và hỏi đáp."""
    M = kb.mau("tra_loi")
    vai = _vai(tb)
    lv = hc.get("linh_vuc")
    yd = {"nguoi_khac": "cach_lam"}.get(hc["y_dinh"], hc["y_dinh"])
    if tb_ma(tb) == "khi_nao" and yd in ("tong_quat", "ket_qua", "hieu_minh"):
        yd = "thoi_diem"                    # trải bài "Khi nào" luôn đọc như câu hỏi thời điểm
    hai = vai.get("hai_duong")
    if yd == "lua_chon" and not hai:
        yd = "quyet_dinh"
    viec = L("tarot.chuyen", "chuyện {x}", x=hc['nhan_viec']) if hc.get("nhan_viec") else str(M["viec_mac_dinh"])
    vt = tb["vi_tri"]
    V = pt["vi_tri"]
    if yd == "lua_chon":
        ng = _so_hai_duong(V, hai)
    else:
        ng = calc.nghieng_tong([(calc.nghieng_la(V[i]["id"], V[i]["nguoc"]), w, V[i]["suc"]["suc"]) for i, w in vai["chinh"]])
    n = ng["nghieng"]
    tieu_de = (M["tieu_de_lua_chon"] if yd == "lua_chon" else M["tieu_de_ket_qua"] if yd in ("ket_qua", "thoi_diem", "tong_quat", "hieu_minh") else M["tieu_de"])[n]
    cau_dau = str(M["nghieng"][yd][n]).format(viec=viec)
    # lá chính = lá nặng nhất trong các vị trí trả lời; hoà thì lá đứng sau (kết cục)
    i_chinh = max(vai["chinh"], key=lambda x: (x[1], x[0]))[0] if yd != "lua_chon" else (hai[1] if n == "tien" else hai[0] if n == "cho" else vai["khuyen"])
    l0, tl0, lv0 = _lv_cua(V[i_chinh], lv)
    noi_dung = f"{cau_dau} " + L("tarot.tla.la_nang", "Lá nặng nhất ở đây: {la} ({vt}) — {loi}", la=_ten(l0, V[i_chinh]['nguoc']), vt=vt[i_chinh]['ten'], loi=tl0)
    ds_truoc = _viec_truoc(hc)
    can_cu = [L("tarot.tla.can_cu_nghieng", "Nghiêng = trung bình có trọng số của các lá ở vị trí trả lời ({ds}): "
                "lá nghiêng 'tiến' +1, 'có điều kiện' 0, 'chưa nên vội' −1; lá được tiếp sức nặng thêm 1/4, bị kìm nhẹ đi 1/4 (Book T). "
                "Điểm {diem} (≥ +0,34 nghiêng có, ≤ −0,34 chưa nên vội).", ds=', '.join(f'{vt[i]["ten"]} ×{w}' for i, w in vai['chinh']), diem=f"{ng['diem']:+.2f}"),
              L("tarot.tla.can_cu_waite", "Nghiêng của từng lá theo lối đọc có – không phổ biến của trường phái Waite (lá ngược đổi chiều nghĩa).")]
    if yd == "lua_chon":
        can_cu[0] = L("tarot.tla.can_cu_hai_duong", "So hai đường: đường B trừ đường A = {diem} (chênh ≥ 0,5 mới nói đường nào nghiêng hơn).", diem=f"{ng['diem']:+.2f}")
    hop = [kh.hop("cot_loi", tieu_de, noi_dung, huong_xu_ly=str(M["truoc_khi"]).format(ds=ds_truoc[0]), can_cu=can_cu,
                  ma=kh.ma_mau(MO_DUN, "tra_loi", yd, n), muc=_MUC_NG[n], nghieng=n, phai=PHAI_CHUNG, la=_tom_la(l0, V[i_chinh]["nguoc"]),
                  vi_tri={"so": i_chinh, "ma": vt[i_chinh]["ma"], "ten": vt[i_chinh]["ten"], "hoi": vt[i_chinh]["hoi"]})]

    def hop_vi_tri(i: int, nhan: str | None = None, ep_loai: str | None = None) -> dict:
        l, tl, lvt = _lv_cua(V[i], lv)
        ngi = calc.nghieng_la(l["id"], V[i]["nguoc"])
        if hc.get("_phia_ban"):                 # CY-2: câu "phía bạn" không mang nhãn có / không của từng lá
            tl = _NHAN_CO_KHONG.sub("", tl)
        than = tl + ((" " + L("tarot.trong_chuyen", "Trong chuyện {lv}: {loi}", lv=_ten_lv(lv), loi=lvt)) if lvt else "")
        return kh.hop(ep_loai or _LOAI_NG[ngi], f"{nhan or vt[i]['ten']}: {_ten(l, V[i]['nguoc'])}", than, huong_xu_ly=l["viec"],
                      can_cu=[L("tarot.can_cu.vi_tri", "Vị trí '{vt}': {hoi}.", vt=vt[i]['ten'], hoi=vt[i]['hoi']), L("tarot.can_cu.nghieng_suc", "Lá {la} nghiêng về {ng}; {suc}.", la=_ten(l, V[i]['nguoc']), ng=_ten_ng(ngi), suc=_suc_chu(V[i]['suc']['suc'])),
                              *_can_cu_phai(l)[:1]],
                      ma=kh.ma_mau(MO_DUN, "tra_loi", tb_ma(tb), vt[i]["ma"], l["id"], "n" if V[i]["nguoc"] else "x", lv or "chung"),
                      muc=_MUC_NG[ngi], phai="rws", la=_tom_la(l, V[i]["nguoc"]), vi_tri={"so": i, "ma": vt[i]["ma"], "ten": vt[i]["ten"], "hoi": vt[i]["hoi"]})

    da = {i_chinh}
    if yd == "lua_chon":
        for i in hai:
            hop.append(hop_vi_tri(i))
            da.add(i)
    for i, _w in sorted(vai["chinh"], key=lambda x: -x[1]):
        if i not in da:
            hop.append(hop_vi_tri(i))
            da.add(i)
    dk = vai.get("dieu_kien")
    if dk is not None and dk not in da:
        h = hop_vi_tri(dk, nhan=vt[dk]["ten"] if ("trước" in vt[dk]["ten"] or "first" in vt[dk]["ten"].lower()) else L("tarot.tla.can_go", "Điều cần gỡ trước ({vt})", vt=vt[dk]['ten']))
        hop.append(h)
        da.add(dk)
    if yd == "thoi_diem":
        # Lá kết cục trước; không có khoảng ngày (Át, Tiểu đồng, ẩn chính theo hành tinh) thì lá trả lời kế tiếp có khoảng.
        ung = [vai["ket"], *[i for i, _w in sorted(vai["chinh"], key=lambda x: -x[1]) if i != vai["ket"]]]
        chon = next((i for i in ung if calc.khoang_thoi_gian(V[i]["id"], ngay_xem).get("tu")), None)
        i = chon if chon is not None else vai["ket"]
        l = _la(V[i]["id"])
        k = calc.khoang_thoi_gian(l["id"], ngay_xem)
        if k.get("tu"):
            trong = L("tarot.tla.dang_trong", "Bạn đang ở trong khoảng này.") if k["dang_trong"] else L("tarot.tla.con_ngay", "Còn khoảng {n} ngày nữa tới.", n=k['sau_ngay'])
            khoang = L("tarot.tla.khoang", "khoảng {tu} tới {den}", tu=_ngay_ngan(k['tu']), den=_ngay_ngan(k['den']))
            loi = str(M["thoi_diem"]).format(la=l["ten"], vi_tri=vt[i]["ten"], khoang=khoang, trong=trong).strip()
        else:
            khoang = L("tarot.tla.nhip", "nhịp {nhip}", nhip=k['nhip'])
            loi = str(M["thoi_diem_khong_cua_so"]).format(la=l["ten"], vi_tri=vt[i]["ten"], nhip=k["nhip"])
        hop.append(kh.hop("thoi_diem", L("tarot.tla.nhip_goi_y", "Nhịp gợi ý: {khoang}", khoang=khoang), loi,
                          tu=_ngay(k.get("tu")), den=_ngay(k.get("den")), muc=_MUC_NG[n], phai="thoth", ma=kh.ma_mau(MO_DUN, "tra_loi", "thoi_diem", l["id"]),
                          la=_tom_la(l, V[i]["nguoc"]), loai_nhip=k["loai"],
                          can_cu=[L("tarot.tla.book_t", "Book T (Golden Dawn) gắn lá số 2–10 với decan (~10 ngày), Hiệp sĩ / Hoàng hậu / Vua với vùng 30° hoàng đạo (~1 tháng), "
                                    "ẩn chính với cung hoặc hành tinh; đây là nhịp gợi ý để chọn lúc làm, không phải ngày dự báo.")]))
    kq, _tlk, lvk = _lv_cua(V[vai["khuyen"]], lv)
    hop.append(kh.hop("loi_khuyen", L("tarot.tla.ba_viec_quyet", "Trước khi quyết, làm 3 việc") if yd in ("quyet_dinh", "lua_chon") else L("tarot.tla.ba_viec_tuan", "Làm 3 việc trong tuần này"),
                      " · ".join(f"{k + 1}) {x}" for k, x in enumerate(ds_truoc[:3])),
                      huong_xu_ly=L("tarot.tla.theo_la_khuyen", "Theo lá lời khuyên ({la}): {viec}", la=_ten(kq, V[vai['khuyen']]['nguoc']), viec=lvk or kq['viec']),
                      can_cu=[L("tarot.tla.ds_viec_can_cu", "Danh sách việc theo loại việc bạn hỏi (ban biên tập); dòng cuối lấy từ lá ở vị trí lời khuyên.")],
                      ma=kh.ma_mau(MO_DUN, "tra_loi", "viec", hc.get("viec") or lv or "chung"), phai=PHAI_CHUNG))
    if hc.get("_phia_ban"):
        hop[0], cau_dau = _hop_phia_ban(hop[0], V, vt, lv, viec, bool(hc.get("_khac")))
        tieu_de = hop[0]["tieu_de"]
    return {"nghieng": ng, "y_dinh_doc": yd, "tieu_de": tieu_de, "cau_dau": cau_dau, "hop": hop, "la_chinh": i_chinh,
            "phia_ban": bool(hc.get("_phia_ban"))}


def _ten_viec(hc: dict | None) -> str:
    """Tên ngắn của điều được hỏi, chỉ từ danh mục (không chữ người dùng gõ)."""
    M = kb.mau("cau_chuyen")
    hc = hc or {}
    if hc.get("nhan_viec"):
        return L("tarot.chuyen", "chuyện {x}", x=hc['nhan_viec'])
    if hc.get("linh_vuc"):
        return L("tarot.chuyen", "chuyện {x}", x=_ten_lv(hc['linh_vuc']))
    return str(M["viec_chung"]) if hc.get("co_cau") else str(M["chuyen_cua_ban"])


def _cau_dau(text: str) -> str:
    """Câu đầu của một nghĩa (bỏ tiền tố 'Lá ngược:'), có dấu chấm cuối."""
    t = re.sub(r"^(Lá ngược|Reversed):\s*", "", text.strip())
    t = re.split(r"(?<=[.!?])\s", t, maxsplit=1)[0].strip()
    return t[:1].upper() + t[1:] if t else t


def _hoi_minh(l: dict, nguoc: bool) -> str:
    """Câu tự hỏi của CHÍNH lá, đúng chiều: lá ngược dùng câu 'Hỏi mình' trong nghĩa ngược."""
    for dau in ("Hỏi mình:", "Ask yourself:"):
        if nguoc and dau in l["y_nguoc"]:
            return l["y_nguoc"].split(dau, 1)[1].strip()
    return l["cau_tu_soi"]


def _so_hai_duong(V: list[dict], hai: list[int]) -> dict:
    """Đường B trừ đường A (chênh ≥ 0,5 mới nói đường nào nghiêng hơn) — một công thức cho câu trả lời và câu chuyện."""
    a, b = (calc.nghieng_tong([(calc.nghieng_la(V[i]["id"], V[i]["nguoc"]), 1, V[i]["suc"]["suc"])]) for i in hai)
    hieu = b["diem"] - a["diem"]
    return {"nghieng": "tien" if hieu >= 0.5 else "cho" if hieu <= -0.5 else "dieu_kien", "diem": round(hieu, 3)}


def _chuong_cau_chuyen(pt: dict, tb: dict, hc: dict) -> dict:
    """TR-4: kể các lá theo thứ tự trên bàn như MỘT câu chuyện về điều được hỏi — nghĩa của lá trong đúng lĩnh vực, đúng chiều —
    rồi một câu nối (mẫu theo nghiêng lá đầu → lá cuối), điểm tựa + chỗ cần canh kèm câu tự hỏi của chính lá. Không chấm điểm,
    không dự báo; chỉ ghép lại nghĩa đã có của các lá."""
    c = kb.chuong()["cau_chuyen"]
    M = kb.mau("cau_chuyen")
    vt, V = tb["vi_tri"], pt["vi_tri"]
    lv = hc.get("linh_vuc")
    viec = _ten_viec(hc)
    thu_tu = tb.get("cau_chuyen") or list(range(len(vt)))
    doan = [str(M["mo"]).format(viec=viec) if hc.get("co_cau") or lv else str(M["mo_chung"])]
    for i in thu_tu:
        l = _la(V[i]["id"])
        nghia = _lv(l, V[i]["nguoc"], lv) or _cau_dau(_y(l, V[i]["nguoc"]))
        doan.append(f"{vt[i]['ten']} — {_ten(l, V[i]['nguoc'])}: {nghia.rstrip()}" + ("" if nghia.rstrip().endswith((".", "!", "?")) else "."))
    ng = {i: calc.nghieng_la(V[i]["id"], V[i]["nguoc"]) for i in thu_tu}
    hai = (tb.get("vai_tra_loi") or {}).get("hai_duong")
    if hai:
        n = _so_hai_duong(V, hai)["nghieng"]
        mau, ma_noi, muc = M["hai_duong"][n], f"hai_duong_{n}", _MUC_NG[n]
    elif len(thu_tu) == 1:
        n = ng[thu_tu[0]]
        mau, ma_noi, muc = M["mot_la"][n], f"mot_{n}", _MUC_NG[n]
    else:
        dau, cuoi = ng[thu_tu[0]], ng[thu_tu[-1]]
        mau, ma_noi, muc = M["noi"][f"{dau}_{cuoi}"], f"{dau}_{cuoi}", _MUC_NG[cuoi]
    duong = " → ".join(f"{vt[i]['ten']}: {_ten(_la(V[i]['id']), V[i]['nguoc'])} ({_ten_ng(ng[i])})" for i in thu_tu)
    hop = [kh.hop("cot_loi", str(mau["tieu_de"]), str(mau["loi"]).format(viec=viec),
                  can_cu=[L("tarot.cc.can_cu_noi", "Câu nối chọn theo nghiêng của lá đầu và lá cuối câu chuyện: {duong}.", duong=duong),
                          L("tarot.tla.can_cu_waite", "Nghiêng của từng lá theo lối đọc có – không phổ biến của trường phái Waite (lá ngược đổi chiều nghĩa).")]
                  + ([L("tarot.cc.can_cu_hai_duong", "Trải bài hai lựa chọn: câu nối theo phép so đường B với đường A, như chương 'Câu trả lời'.")] if hai else []),
                  ma=kh.ma_mau(MO_DUN, "cau_chuyen", tb_ma(tb), "noi", ma_noi), muc=muc, phai=PHAI_CHUNG)]
    # điểm tựa / chỗ cần canh: lá 'tiến' / 'chưa nên vội' nặng nhất (vị trí trả lời trước, rồi lá đứng sau)
    w = {i: x for i, x in (tb.get("vai_tra_loi") or {}).get("chinh", [])}

    def chon(loai_ng: str) -> int | None:
        ung = [i for i in thu_tu if ng[i] == loai_ng]
        return max(ung, key=lambda i: (w.get(i, 0), thu_tu.index(i))) if ung else None

    for loai_ng, loai_hop, khoa, nhan in (("tien", "diem_manh", "tua", L("tarot.cc.diem_tua", "Điểm tựa")), ("cho", "luu_y", "canh", L("tarot.cc.cho_canh", "Chỗ cần canh"))):
        i = chon(loai_ng)
        if i is None:
            continue
        l, nguoc = _la(V[i]["id"]), V[i]["nguoc"]
        chieu = "n" if nguoc else "x"
        tu_khoa = ", ".join(_tu_khoa(l, nguoc)[:3])
        viec_la = ((l.get("viec_lv") or {}).get(chieu) or {}).get(lv) if lv else None
        hop.append(kh.hop(loai_hop, L("tarot.cc.tieu_de", "{nhan} ở {vt}: {la}", nhan=nhan, vt=vt[i]['ten'], la=_ten(l, nguoc)), str(M[khoa]).format(tu_khoa=tu_khoa, hoi=_hoi_minh(l, nguoc)),
                          huong_xu_ly=viec_la or l["viec"],
                          can_cu=[L("tarot.cc.can_cu_la", "Lá {la} nghiêng về {ng}; vị trí '{vt}': {hoi}.", la=_ten(l, nguoc), ng=_ten_ng(ng[i]), vt=vt[i]['ten'], hoi=vt[i]['hoi']), *_can_cu_phai(l)[:1]],
                          ma=kh.ma_mau(MO_DUN, "cau_chuyen", khoa, l["id"], chieu), muc=_MUC_NG[ng[i]], phai="rws",
                          la=_tom_la(l, nguoc), vi_tri={"so": i, "ma": vt[i]["ma"], "ten": vt[i]["ten"], "hoi": vt[i]["hoi"]}))
    return kh.chuong("cau_chuyen", c["tieu_de"], doan, hop=hop, muc=muc, tom_tat=str(mau["tieu_de"]) + ".", cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("tarot.cc.tu_soi", "Đọc lại câu chuyện: đoạn nào giống đời bạn nhất lúc này?"), doan_truoc=True)


def _chuong_tra_loi(pt: dict, tb: dict, hc: dict, ngay_xem: dt.date, chan: str | None, cau: str | None = None) -> dict:
    c = kb.chuong()["tra_loi"]
    M = kb.mau("tra_loi")
    if chan:
        from app.hoidap import chung  # noqa: PLC0415
        from app.kb import kinhdich_kb  # noqa: PLC0415
        loi = {"an_toan": chung.mau_an_toan(cau, L("an_toan.khung_hoang", kinhdich_kb.mau("an_toan") or str(M["an_toan"]))), "tu_choi": L("an_toan.tu_choi", str(M["tu_choi"])), "dan_huong": L("an_toan.dan_huong", chung.mau_dan_huong(""))}[chan]
        return kh.chuong("tra_loi", c["tieu_de"], [loi], cau_hoi=c["cau_hoi"], chan=chan)
    tl = tra_loi_cau(pt, tb, hc, ngay_xem)
    doan = []
    if not hc["co_cau"]:
        doan.append(str(M["khong_cau"]))
    elif hc["y_dinh"] == "tong_quat":
        doan.append(str(M["chua_ro_cau"]))
    if hc["y_dinh"] == "nguoi_khac":
        doan.append(str(M["nguoi_khac"]))
    if hc["y_dinh"] == "lua_chon" and tl["y_dinh_doc"] != "lua_chon":
        doan.append(str(M["lua_chon_khong_tach"]))
    if tl["y_dinh_doc"] == "lua_chon":
        lc = hc.get("lua_chon")
        doan.append(str(M["hai_duong_nhan"]).format(a=lc[0], b=lc[1]) if lc else str(M["hai_duong_mac_dinh"]))
    goi = hc.get("goi_y_trai_bai")
    if goi and goi != tb_ma(tb) and hc["y_dinh"] in ("quyet_dinh", "lua_chon") and not _vai(tb).get("hai_duong"):
        doan.append(str(M["goi_y_trai_bai"]).format(ten=kb.trai_bai()[goi]["ten"]))
    if hc.get("linh_vuc") == "suc_khoe":
        doan.append(str(M["suc_khoe"]))
    if hc["y_dinh"] in ("quyet_dinh", "lua_chon"):
        doan.append(str(M["quyet_cua_ban"]))
    if hc.get("_nla"):
        from app.kb import chu_y_kb as _cykb  # noqa: PLC0415
        doan.append(_cykb.ranh_gioi("hop_tac"))
    return kh.chuong("tra_loi", c["tieu_de"], doan, hop=tl["hop"], muc=None if tl.get("phia_ban") else _MUC_NG[tl["nghieng"]["nghieng"]],
                     tom_tat=tl["cau_dau"], cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("tarot.tla.tu_soi", "Nếu lá bài nói đúng điều bạn sợ nhất, tuần này bạn làm gì khác đi?"), nghieng=tl["nghieng"]["nghieng"])


def hieu_cau_cong_khai(cau: str | None, chu_de: str | None = None) -> dict:
    """Cho web gợi ý trải bài ngay khi người dùng gõ xong câu hỏi: chỉ mã + nhãn danh mục, không trả lại chữ đã gõ."""
    from app.luangiai import tarot_cau_hoi  # noqa: PLC0415
    hc = tarot_cau_hoi.hieu_cau(cau, chu_de)
    chan = _chan(cau)
    goi = hc["goi_y_trai_bai"]
    ten_yd_vi = {"quyet_dinh": "câu hỏi 'có nên'", "lua_chon": "chọn giữa hai đường", "ket_qua": "câu hỏi 'có thành không / ra sao'",
                 "thoi_diem": "câu hỏi 'khi nào'", "cach_lam": "câu hỏi 'làm sao'", "ly_do": "câu hỏi 'vì sao'", "nguoi_khac": "câu hỏi về lòng người khác",
                 "hieu_minh": "câu hỏi về chính bạn", "tong_quat": "chủ đề chung"}
    ten_yd = L(f"tarot.ten_yd.{hc['y_dinh']}", ten_yd_vi[hc["y_dinh"]])
    loi = None
    if chan == "an_toan":
        from app.kb import kinhdich_kb  # noqa: PLC0415
        from app.hoidap import chung  # noqa: PLC0415
        loi = chung.mau_an_toan(cau, L("an_toan.khung_hoang", kinhdich_kb.mau("an_toan") or ""))
    elif hc["y_dinh"] == "nguoi_khac":
        loi = str(kb.mau("tra_loi", "nguoi_khac"))
    return {**{k: hc[k] for k in ("y_dinh", "linh_vuc", "chu_de", "viec", "nhan_viec", "lua_chon", "co_cau")}, "chan": chan, "ten_y_dinh": ten_yd,
            "goi_y_trai_bai": goi, "ten_goi_y": kb.trai_bai()[goi]["ten"], "loi": loi}


def the_tra_loi(trai_bai: str, la: list[dict], *, y_dinh: str, viec: str | None = None, linh_vuc: str | None = None,
                ngay_xem: dt.date | None = None) -> dict:
    """TR-3: dữ kiện thẻ chia sẻ "Câu trả lời của lá bài" — máy chủ web đọc lại ở đây rồi mới ký mã (client không tự khai
    nghiêng / tên lá). Đầu vào chỉ là MÃ (ý định, loại việc, lĩnh vực theo danh mục) + lá đã rút; không câu hỏi."""
    from app.luangiai import tarot_cau_hoi as tc  # noqa: PLC0415
    tb = {**kb.trai_bai()[trai_bai], "_ma": trai_bai} if trai_bai in kb.trai_bai() else None
    if not tb:
        raise ValueError(f"Không có trải bài {trai_bai}")
    if y_dinh not in tc.Y_DINH:
        raise ValueError("Ý định không có trong danh mục")
    ds_viec = {ma: (nhan, lv) for ma, nhan, lv, _ in tc.VIEC}
    if viec is not None and viec not in ds_viec:
        raise ValueError("Việc không có trong danh mục")
    if linh_vuc is not None and linh_vuc not in _TEN_LV_VI:
        raise ValueError("Lĩnh vực không có trong danh mục")
    nhan = ds_viec[viec][0] if viec else None
    hc = {"y_dinh": y_dinh, "linh_vuc": linh_vuc or (ds_viec[viec][1] if viec else None), "chu_de": None, "viec": viec, "nhan_viec": nhan,
          "lua_chon": None, "goi_y_trai_bai": tc.GOI_Y_TRAI_BAI[y_dinh], "co_cau": True, "ro": True}
    pt = calc.phan_tich(trai_bai, la)
    tl = tra_loi_cau(pt, tb, hc, ngay_xem or config.hom_nay_vn())
    vt = tb["vi_tri"]
    return {"trai_bai": trai_bai, "ten_trai_bai": tb["ten"], "tieu_de": tl["tieu_de"], "nghieng": tl["nghieng"]["nghieng"],
            "cau_dau": tl["cau_dau"], "nhan_viec": nhan, "y_dinh": y_dinh, "la_chinh": tl["la_chinh"],
            "la": [{"id": v["id"], "nguoc": v["nguoc"], "ten": _la(v["id"])["ten"], "vi_tri": vt[v["vi_tri"]]["ten"]} for v in pt["vi_tri"]]}


def dien_dat_tra_loi(bc: dict) -> dict:
    """TR-3 (NARRATIVE): AI chỉ diễn đạt LẠI chương "Câu trả lời" thành một đoạn liền mạch. Nguồn = chính các hộp của chương
    (lớp A, tất định) — không câu hỏi người dùng gõ, không ngày sinh. Qua bộ kiểm chung `kiem_ai` (số, thuật ngữ, cụm cấm,
    câu ý mới, độ dài); hỏng / thiếu khoá / hết lượt → giữ bản mẫu. Các chương khác không gọi AI."""
    import os  # noqa: PLC0415
    c = next((x for x in bc["chuong"] if x["ma"] == "tra_loi"), None)
    if not c or not c.get("hop") or not os.environ.get("OPENROUTER_API_KEY"):
        return {**bc, "dien_dat": "mau"}
    from app.narrative import luan_giai_van as lgv  # noqa: PLC0415
    nguon = [f"{h['tieu_de']}: {h['noi_dung']}" + (f" Nên: {h['huong_xu_ly']}" if h.get("huong_xu_ly") else "") for h in c["hop"]]
    nguon += [d for d in c["doan"] if d]
    kq = lgv._mot_chuong({**c, "doan": nguon}, "Tarot")
    if kq.get("che_do") != "llm":
        return {**bc, "dien_dat": "mau"}
    chuong = [({**x, "van_ai": kq["van_ai"], "che_do": "llm"} if x is c else x) for x in bc["chuong"]]
    return {**bc, "chuong": chuong, "dien_dat": "tra_loi"}


# ------------------------------------------------------------------ báo cáo
def bao_cao(trai_bai: str, la: list[dict], *, cau_hoi: str | None = None, chu_de: str | None = None, ngay_xem: dt.date | None = None,
            nam_sinh: dt.date | int | None = None, gioi_tinh: str | None = None, tra_loi_nhan_tuong: dict | None = None,
            bo_dai_dien: str | None = None, trong_so: dict | None = None, ca_nhan: dict | None = None) -> dict:
    ngay_xem = ngay_xem or config.hom_nay_vn()
    tb = {**kb.trai_bai()[trai_bai], "_ma": trai_bai} if trai_bai in kb.trai_bai() else None
    if not tb:
        raise ValueError(f"Không có trải bài {trai_bai}")
    pt = calc.phan_tich(trai_bai, la)
    from app.luangiai import tarot_cau_hoi  # noqa: PLC0415
    hc = tarot_cau_hoi.hieu_cau(cau_hoi, chu_de)
    chan = _chan(cau_hoi)
    hc = {**hc, **_phia_ban(cau_hoi, hc)}            # CY-2 (không ra ngoài: `hieu_cau` chỉ chép các khoá danh mục)
    linh_vuc = hc["linh_vuc"]
    hop_la = [_hop_la(v, tb, linh_vuc, pt) for v in pt["vi_tri"]]
    tra = _chuong_tra_loi(pt, tb, hc, ngay_xem, chan, cau_hoi)
    chuyen = None if chan else _chuong_cau_chuyen(pt, tb, hc)
    chuong = [tra, *([chuyen] if chuyen else []), _chuong_tong_quan(pt, tb, hop_la), _chuong_tung_la(hop_la, tb), _chuong_dong_chay(pt, tb),
              _chuong_ben_trong(pt, tb), _chuong_thoi_diem(pt, tb, ngay_xem), _chuong_viec(pt, tb, hc),
              _chuong_tuong_va_la(pt, tb, _tuoi(nam_sinh, ngay_xem), gioi_tinh, tra_loi_nhan_tuong, bo_dai_dien)]
    thu_tu = kb.thu_tu_chuong()
    chuong.sort(key=lambda c: thu_tu.index(c["ma"]) if c["ma"] in thu_tu else 99)
    cot_loi = []
    if tra["hop"]:
        # điều quan trọng nhất = câu trả lời ngắn + điều cần gỡ / lời khuyên của chính câu hỏi
        cot_loi.append({**tra["hop"][0], "tu_chuong": "tra_loi", "loai_goc": tra["hop"][0]["loai"], "loai": "cot_loi"})
        h = next((x for x in tra["hop"][1:] if x["loai"] == "luu_y"), None)
        if h:
            cot_loi.append({**h, "tu_chuong": "tra_loi", "loai_goc": h["loai"], "loai": "cot_loi"})
    if chuyen and chuyen["hop"]:
        # câu nối của câu chuyện: nhìn cả đoạn đường của điều được hỏi trong một câu
        h = chuyen["hop"][0]
        cot_loi.append({**h, "tu_chuong": "cau_chuyen", "loai_goc": h["loai"], "loai": "cot_loi"})
    tt = hop_la[tb["trong_tam"]]
    if not any((x.get("la") or {}).get("id") == tt["la"]["id"] for x in cot_loi):
        cot_loi.append({**tt, "tu_chuong": "tung_la", "loai_goc": tt["loai"], "loai": "cot_loi"})
    for ma, loai in (("dong_chay", "luu_y"), ("thoi_diem", "thoi_diem"), ("viec_nen_lam", "loi_khuyen")):
        if len(cot_loi) >= 4:
            break
        c = next(x for x in chuong if x["ma"] == ma)
        h = next((x for x in c["hop"] if x["loai"] == loai), None) or (c["hop"][0] if c["hop"] else None)
        if h:
            cot_loi.append({**h, "tu_chuong": ma, "loai_goc": h["loai"], "loai": "cot_loi"})
    bc = {"mo_dun": MO_DUN, "phien_ban": kh.PHIEN_BAN, "phai": PHAI_CHUNG, "trang_thai": kb.meta()["trang_thai"], "ten": L("tarot.ten_bai", "Trải bài của bạn"),
          "cot_loi": cot_loi[:4], "chuong": chuong, "ket": str(kb.mau("ket")), "thieu": [c["thieu"] for c in chuong if c.get("thieu")],
          "cau_hoi": None, "chu_de": hc["chu_de"], "linh_vuc": linh_vuc,
          # chỉ mã + nhãn danh mục, không chữ người dùng gõ
          "hieu_cau": {k: hc[k] for k in ("y_dinh", "linh_vuc", "chu_de", "viec", "nhan_viec", "lua_chon", "goi_y_trai_bai", "co_cau")} | {"chan": chan,
                       "nghieng": tra.get("nghieng")},
          "da_tinh": {"trai_bai": trai_bai, "ten_trai_bai": tb["ten"], "vi_tri": [{**v, "ten_la": _la(v["id"])["ten"]} for v in pt["vi_tri"]],
                      "ke_can": pt["ke_can"], "nguyen_to": pt["nguyen_to"], "an_chinh": pt["an_chinh"], "so_hoc": pt["so_hoc"], "huong_nhin": pt["huong_nhin"],
                      "ngay_xem": ngay_xem.isoformat()}}
    kh.ap_hoc(bc, trong_so, ca_nhan)
    return bc


# ------------------------------------------------------------------ lá ngày, bộ bài
def la_ngay(ngay: dt.date | None = None, ngay_sinh: dt.date | None = None) -> dict:
    ngay = ngay or config.hom_nay_vn()
    x = calc.la_ngay(ngay, ngay_sinh, muoi=config.LA_NGAY_MUOI)
    l = _la(x["id"])
    return {"ngay": ngay.isoformat(), "rieng": x["rieng"],
            "la": {**_tom_la(l, False), "tu_khoa": _tu_khoa(l, False)[:3], "y_xuoi": l["y_xuoi"], "viec": l["viec"], "cau_tu_soi": l["cau_tu_soi"], "hinh_anh": l["hinh_anh"]},
            "cach_tinh": L("tarot.la_ngay.cach_tinh", "Lá của ngày chọn tất định từ ngày (và ngày sinh khi là lá riêng) — cùng ngày thì cùng lá; luôn đọc xuôi.")}


def bo_bai() -> dict:
    """Dữ liệu bộ bài cho web vẽ (không có nhãn nội bộ): 78 lá rút gọn, bộ, nguyên tố, trải bài, chủ đề, trường phái."""
    la = {ma: {**_tom_la(x, False), "tu_khoa": _tu_khoa(x, False)[:3], "tu_khoa_nguoc": _tu_khoa(x, True)[:3], "huong_nhin": x["huong_nhin"], "chiem_tinh": (x.get("chiem_tinh") or {}).get("ten"),
               "decan": x.get("decan")} for ma, x in kb.la().items()}
    for v in la.values():
        v.pop("nguoc", None)
    return {"la": la, "thu_tu": list(calc.BO_BAI), "bo": kb.bo(), "nguyen_to": kb.nguyen_to(),
            "trai_bai": {k: {kk: vv for kk, vv in v.items() if kk != "_ma"} for k, v in kb.trai_bai().items()},
            "chu_de": {k: {"ten": v["ten"]} for k, v in kb.chu_de().items()},
            "truong_phai": {k: {"ten": v["ten"], "ngan": v["ngan"], "mo_ta": v["mo_ta"], "hoi": v["hoi"]} for k, v in kb.truong_phai().items()},
            "pham_gia": kb.pham_gia(),
            # TR-5: chip chuyện hay hỏi + câu mẫu (web chỉ ĐIỀN vào ô hỏi; chủ đề phải có trong `chu_de`)
            "goi_y_hoi": [{"ma": g["ma"], "ten": g["ten"], "chu_de": g.get("chu_de"), "cau": list(g["cau"])} for g in kb.goi_y_hoi()]}


# ------------------------------------------------------------------ hỏi đáp
_NGUOC = re.compile(r"(?<![a-z])(nguoc|reversed|dao nguoc|lon nguoc)(?![a-z])")
_LA_THU = re.compile(r"(?:la|vi tri) (?:thu |so )?(\d{1,2})")
_VI_TRI_TU = {"ket qua": "kha_nang", "kha nang": "kha_nang", "tuong lai": "sap_toi", "sap toi": "sap_toi", "dieu can": "dieu_can", "can tro": "dieu_can",
              "loi khuyen": "loi_khuyen", "qua khu": "qua_khu", "goc re": "goc_re", "hien tai": "hien_tai", "tam diem": "tam_diem", "hy vong": "hy_vong_noi_lo", "noi lo": "hy_vong_noi_lo",
              # QTE: tên vị trí tiếng Anh (chỉ xét khi có trải bài vừa rút)
              "outcome": "kha_nang", "final card": "kha_nang", "near future": "sap_toi", "future card": "sap_toi", "what is coming": "sap_toi",
              "obstacle": "dieu_can", "crossing card": "dieu_can", "what crosses": "dieu_can", "advice card": "loi_khuyen", "advice position": "loi_khuyen",
              "past card": "qua_khu", "recent past": "qua_khu", "root card": "goc_re", "the root": "goc_re", "present card": "hien_tai", "heart of the matter": "tam_diem",
              "hopes and fears": "hy_vong_noi_lo", "hopes": "hy_vong_noi_lo", "fears": "hy_vong_noi_lo"}


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
        van = str(kb.mau("hoi", "vi_tri")).format(ten=l["ten"], nguoc=L("tarot.nguoc_hau_to", " (ngược)") if nguoc else "", vi_tri=vi_tri["ten"], hoi=vi_tri["hoi"], y=y)
    else:
        van = str(kb.mau("hoi", "nghia_la")).format(ten=l["ten"], en=l["en"], nguoc=L("tarot.nguoc_tinh_tu", " ngược") if nguoc else "", y=y, tu_khoa=", ".join(_tu_khoa(l, nguoc)))
    lv = _lv(l, nguoc, linh_vuc)   # đúng chiều lá: lá ngược đọc nghĩa ngược trong lĩnh vực (như bài đọc — TR-2)
    if lv:
        van += " " + str(kb.mau("hoi", "nghia_linh_vuc")).format(linh_vuc=_ten_lv(linh_vuc), loi=lv)
        if linh_vuc == "suc_khoe":
            van += " " + L("an_toan.suc_khoe_nhac", "Đây là lời nhắc nhịp sống, không thay lời bác sĩ.")
    viec = ((l.get("viec_lv") or {}).get("n" if nguoc else "x") or {}).get(linh_vuc) if linh_vuc else None
    van += " " + L("tarot.hoi.viec", "Việc nên làm: {viec}", viec=viec or l['viec'])
    hoi_tiep = [L("tarot.hoi.tiep_chieu", "{ten} {chieu} nghĩa là gì?", ten=l['ten'], chieu=L("tarot.xuoi", "xuôi") if nguoc else L("tarot.nguoc", "ngược"))]
    for lv in ("tinh_cam", "cong_viec", "tien_bac"):
        if lv != linh_vuc:
            hoi_tiep.append(L("tarot.hoi.tiep_lv", "{ten} trong {lv} thì sao?", ten=l['ten'], lv=_ten_lv(lv)))
    return {"cau_tra_loi": van, "can_cu": [L("tarot.can_cu.hinh", "Hình (Waite): {hinh}", hinh=l['hinh_anh']), *_can_cu_phai(l)], "hoi_tiep": hoi_tiep[:3], "xu_ly": "vi_tri" if vi_tri else "nghia_la",
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
        kq.update(cau_tra_loi=chung.mau_an_toan(goc, L("an_toan.khung_hoang", kinhdich_kb.mau("an_toan") or "")), xu_ly="an_toan")
        return kq
    if db == "tu_choi_nhe" or chung.co(t, kb.tu_khoa("ngoai")):
        # 2026-11-14: bản Anh cũng nhận lời "nên chú ý / nên làm" + nhóm sức khoẻ (cấp cứu…) — bản Việt không đổi
        kq.update(cau_tra_loi=chung.mau_tu_choi(goc, t, L("an_toan.tu_choi", kinhdich_kb.mau("tu_choi") or "")), xu_ly="tu_choi_nhe")
        return kq
    if db == "dan_huong":
        kq.update(cau_tra_loi=L("an_toan.dan_huong", chung.mau_dan_huong(t)), xu_ly="dan_huong")
        return kq
    linh_vuc = _linh_vuc(goc, None)
    if chung.co(t, kb.tu_khoa("nguoi_khac")):
        kq.update(cau_tra_loi=str(kb.mau("hoi", "nguoi_khac")), xu_ly="nguoi_khac", linh_vuc=linh_vuc,
                  hoi_tiep=[L("tarot.hoi.tiep_qh1", "Tôi nên làm gì với mối quan hệ này?"), L("tarot.hoi.tiep_qh2", "Lá nào nói về chuyện tin nhau?")])
        return kq
    tb = {**kb.trai_bai()[trai_bai], "_ma": trai_bai} if trai_bai in kb.trai_bai() else None
    ds = None
    if tb and la:
        try:
            ds = calc.chuan_la(la, len(tb["vi_tri"]))
        except ValueError:
            ds = None
    # Tên lá tìm TRƯỚC (bỏ tên lá khỏi câu): "lá 3 Cốc" là lá Ba Cốc, không phải "lá thứ 3" của trải bài.
    ma_la, con = _tim_la(t)
    # lá ở một vị trí của trải bài vừa rút (chỉ khi câu không gọi tên một lá)
    if tb and ds and not ma_la:
        m = _LA_THU.search(con)
        vt_ma = next((v for k, v in _VI_TRI_TU.items() if k in con), None)
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
    if ma_la:
        l = _la(ma_la)
        nguoc = bool(_NGUOC.search(con))
        if not nguoc and ds:
            nguoc = next((x["nguoc"] for x in ds if x["id"] == ma_la), False)
        kq.update(_tra_loi_la(l, nguoc, linh_vuc))
        return kq
    # TR-2: câu hỏi về CHÍNH việc của người hỏi ("có nên đổi việc", "dự án có thành không") — có trải bài vừa rút thì trả
    # lời theo đúng các lá ấy; chưa rút thì gợi trải bài hợp câu hỏi (không rút hộ, không đoán).
    from app.luangiai import tarot_cau_hoi  # noqa: PLC0415
    hc = tarot_cau_hoi.hieu_cau(goc)
    trai_bai_hoi = next((ma for ma, ds_tk in kb.tu_khoa("trai_bai").items() if chung.co(t, [re.escape(k) for k in ds_tk])), None)
    if hc["ro"] and not trai_bai_hoi and hc["y_dinh"] in ("quyet_dinh", "lua_chon", "ket_qua", "thoi_diem", "cach_lam", "ly_do") and not chung.co(t, [re.escape(k) for ds_tk in kb.tu_khoa("khai_niem").values() for k in ds_tk if len(k) > 6]):
        goi = kb.trai_bai()[hc["goi_y_trai_bai"]]
        if tb and ds:
            pt = calc.phan_tich(tb_ma(tb), ds)
            tl = tra_loi_cau(pt, tb, hc, ngay_xem or config.hom_nay_vn())
            h0 = tl["hop"][0]
            ke = [f"{h['tieu_de']}: {h['noi_dung']}" for h in tl["hop"][1:3] if h["loai"] != "loi_khuyen"]
            viec_h = next((h for h in tl["hop"] if h["loai"] == "loi_khuyen"), None)
            van = h0["noi_dung"] + ("".join(f" {x}" for x in ke)) + (f" {viec_h['tieu_de']}: {viec_h['noi_dung']}" if viec_h else "")
            if hc["linh_vuc"] == "suc_khoe":
                van += " " + str(kb.mau("tra_loi", "suc_khoe"))
            kq.update(cau_tra_loi=van, xu_ly="tra_loi_trai_bai", linh_vuc=hc["linh_vuc"], nghieng=tl["nghieng"]["nghieng"], y_dinh=hc["y_dinh"],
                      can_cu=h0.get("can_cu", []), hoi_tiep=[L("tarot.hoi.tiep_tb1", "Lá ở vị trí lời khuyên nói gì?"), L("tarot.hoi.tiep_tb2", "Lá ngược trong trải bài này nghĩa là gì?"), L("tarot.hoi.tiep_tb3", "Nhịp thời gian của lá kết cục?")])
            return kq
        kq.update(cau_tra_loi=str(kb.mau("tra_loi", "chua_rut")).format(ten=goi["ten"]), xu_ly="goi_y_rut", linh_vuc=hc["linh_vuc"], y_dinh=hc["y_dinh"],
                  goi_y_trai_bai=hc["goi_y_trai_bai"], hoi_tiep=[L("tarot.hoi.tiep_kn1", "Lá ngược nghĩa là gì?"), L("tarot.hoi.tiep_kn2", "Trải bài Hai lựa chọn là gì?"), L("tarot.hoi.tiep_kn3", "Celtic Cross là trải bài gì?")])
        return kq
    for ma, ds_tk in kb.tu_khoa("trai_bai").items():
        if chung.co(t, [re.escape(k) for k in ds_tk]):
            x = kb.trai_bai()[ma]
            kq.update(cau_tra_loi=str(kb.mau("hoi", "trai_bai")).format(ten=x["ten"], mo_ta=x["mo_ta"], vi_tri="; ".join(f"{i + 1}. {v['ten']} ({v['hoi'].lower()})" for i, v in enumerate(x["vi_tri"]))),
                      xu_ly="trai_bai", can_cu=[L("tarot.hoi.celtic_can_cu", "Celtic Cross: Waite ghi lại trong The Pictorial Key to the Tarot (1910).")] if ma == "celtic" else [],
                      hoi_tiep=[L("tarot.hoi.tiep_kn1", "Lá ngược nghĩa là gì?"), L("tarot.hoi.tiep_pg", "Phẩm giá nguyên tố là gì?")])
            return kq
    for ma, ds_tk in kb.tu_khoa("khai_niem").items():
        if chung.co(t, [re.escape(k) for k in ds_tk]):
            kq.update(cau_tra_loi=str(kb.mau("khai_niem", ma)), xu_ly="khai_niem",
                      hoi_tiep=[L("tarot.hoi.tiep_thap", "Lá Tháp nghĩa là gì?"), L("tarot.hoi.tiep_kn3", "Celtic Cross là trải bài gì?"), L("tarot.hoi.tiep_an", "Ẩn chính khác ẩn phụ thế nào?")])
            return kq
    kq.update(cau_tra_loi=str(kb.mau("hoi", "khong_hieu")), xu_ly="khong_hieu",
              hoi_tiep=[L("tarot.hoi.tiep_thap", "Lá Tháp nghĩa là gì?"), L("tarot.hoi.tiep_coc", "Ba Cốc ngược trong tình cảm?"), L("tarot.hoi.tiep_kn3", "Celtic Cross là trải bài gì?")])
    return kq
