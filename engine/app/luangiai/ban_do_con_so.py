"""Gói Sao "Bản đồ con số" — Luận giải toàn bộ thần số (chủ dự án chọn 3 phần, 2026-10-20).

Cùng khuôn `toan_bo` (chương + `moi_xem`): chương 1 "Tổng quan" là chương đọc miễn phí — điểm chuyển từ tổng quan sang
chiều sâu (bộ số của bạn hiếm cỡ nào, số lặp, biểu đồ thiếu số nào, bên trong vs bên ngoài, mốc riêng sắp tới); tầng
web cắt các chương sau thành lời mời, mở bằng Sao (`web/lib/luan-giai-sao.ts`, mô-đun "thanso"). Ba chương mở bằng Sao:
  - Bên trong & bên ngoài: Linh hồn ↔ Nhân cách, Đường đời ↔ Sứ mệnh theo nhóm năng lượng (KB `thanso_ban_do.json`),
    mũi tên biểu đồ ngày sinh, nợ nghiệp (gộp theo số).
  - 12 tháng tới: đọc theo năm cá nhân (KB `nam_doc_thang`), tháng nên đánh dấu (mỗi loại việc ≤ 2 tháng), nhịp từng tháng
    gọn một dòng, giai đoạn đỉnh cao đang đi + mốc sắp tới (gộp mốc cùng năm).
  - Sự nghiệp & tiền bạc: công thức nghề từ Đường đời + Sứ mệnh + Nhân cách, bẫy, tiền + tháng hợp bàn chuyện tiền,
    giai đoạn hiện tại + kế tiếp kèm thử thách — không chép lại chân dung đã hiện miễn phí.
Lời mời chương khoá (`moi_xem`) nêu một dữ kiện RIÊNG chưa lộ của chương. RULES + template từ CALC/KB, không LLM
(dien_dat = "mau"), không tên/ngày sinh trong lời văn, không dự báo sự kiện.
"""
from __future__ import annotations

import datetime as dt

from app.calc import thanso as tinh, thanso_dong_doi as dd_calc, thanso_mo_rong as mr, thanso_ty_le as tl
from app import ngon_ngu
from app.kb import store
from app.kb.loi import L
from app.kb import thanso_v2 as kb
from app.kb import thanso_v2 as tsv2
from app.luangiai import doi_song_chung as dsc
from app.luangiai import doi_song_khuon as kh
from app.luangiai import thanso as lg
from app.narrative import hoi_van

TIEU_DE = {"tong_quan": "Tổng quan: bộ số của bạn", "nghich_ly": "Bên trong & bên ngoài",
           "muoi_hai_thang": "12 tháng tới của bạn", "su_nghiep": "Sự nghiệp & tiền bạc"}
TEN_MOC = {"khoi_chu_ky": "mở chu kỳ 9 năm mới", "khep_chu_ky": "khép chu kỳ 9 năm", "chuyen_dinh": "sang giai đoạn đời mới"}
TEN_VT = {**lg.TEN_NGAN_VI_TRI, "ngay_sinh": "Ngày sinh"}
NHOM_THEN_CHOT = ("khoi_su", "doi_viec", "tien_bac", "quan_he", "khep_lai")
HIEM, IT_GAP = 0.01, 0.02   # "hiếm" < 1% số ngày, "ít gặp" < 2%, còn lại "khá phổ biến"


def _tvt(vt: str) -> str:
    """Tên vị trí theo ngôn ngữ (4 chỉ số chính dùng chung mã `thanso.vi_tri.*`)."""
    return L(f"thanso.vi_tri.{vt}", TEN_VT[vt]) if vt in lg.TEN_NGAN_VI_TRI else L(f"tsbd.vt.{vt}", TEN_VT.get(vt, vt))


def _tieu_de(ma: str) -> str:
    return L(f"tsbd.tieu_de.{ma}", TIEU_DE[ma])


def _ten_moc(loai: str) -> str:
    return L(f"tsbd.moc.{loai}", TEN_MOC[loai]) if loai in TEN_MOC else loai


def _nhom(so: int) -> tuple[str, dict] | None:
    for ma, n in kb.ban_do()["nhom"].items():
        if so in n["so"]:
            return ma, n
    return None


def _cau_noi(a: str, b: str) -> dict:
    return kb.ban_do()["cau_noi"]["|".join(sorted((a, b)))]


def _so_vn(n: int) -> str:
    return f"{n:,}".replace(",", ".") if ngon_ngu.la_viet() else f"{n:,}"


def _pt(x: float) -> str:
    return (f"{x * 100:.1f}".replace(".", ",") if ngon_ngu.la_viet() else f"{x * 100:.1f}") + "%"


def _cai(so: int) -> str:
    return L("tsbd.cai", " (số cái {so} — nét của nhóm đậm và đòi hỏi nhiều hơn)", so=so) if so in (11, 22, 33) else ""


def _thang_toi(ngay: int, thang: int, ngay_xem: dt.date) -> list[dict]:
    van = kb.ban_do()
    ds, m, y = [], ngay_xem.month, ngay_xem.year
    for _ in range(12):
        s = mr.thang_ca_nhan(ngay, thang, y, m)
        ds.append({"thang": m, "nam": y, "so": s, "nam_ca_nhan": int(tinh.nam_ca_nhan(ngay, thang, y, "duong_lich")),
                   **van["thang_hop"][str(s)]})
        m, y = (1, y + 1) if m == 12 else (m + 1, y)
    return ds


def _then_chot(thang: list[dict]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {k: [] for k in NHOM_THEN_CHOT}
    for t in thang:
        for k in t["nhom"]:
            if k in out and len(out[k]) < 2:
                out[k].append(t)
    return out


def _giai_doan(ngay: int, thang: int, nam: int, y: int, quy_uoc: str) -> tuple[dict, dict | None, dict]:
    dd = dd_calc.dong_doi(ngay, thang, nam, y, quy_uoc=quy_uoc)
    gd = dd["giai_doan"]
    i = next(k for k, g in enumerate(gd) if g["dinh"] == dd["hien_tai"]["dinh"])
    return gd[i], (gd[i + 1] if i + 1 < len(gd) else None), dd


def _mm(t: dict) -> str:
    return f"{t['thang']}/{t['nam']}"


def _tuoi(g: dict) -> str:
    return f"{g['tu_tuoi']}–{g['den_tuoi']}" if g.get("den_tuoi") is not None else f"{g['tu_tuoi']}+"


# ------------------------------------------------------------------ chương 1 (miễn phí)
def _tong_quan(so: dict, ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str, mo_rong: dict) -> list[str]:
    t = tl.ty_le(ngay, thang, nam, quy_uoc)
    d, c = t["duong_doi"], t["cap"]
    mot_trong = round(1 / c["ty_le"]) if c["ty_le"] else 0
    # Review EN-2 (#7): tỉ lệ "x% số ngày" (~1/9 với mọi số) không còn ở đoạn hiển thị — chỉ ở "Vì sao nói vậy".
    tk = ((store.nghia_so(d["so"]) or {}).get("tu_khoa") or "").lower()
    doan = [L("tsbd.tq.dd_tk", "Đường đời {so}: {tk} là nét chạy suốt đời bạn.", so=d["so"], tk=tk) if tk
            else L("tsbd.tq.dd", "Đường đời {so} là con số gốc của bạn.", so=d["so"])]
    if c["ty_le"] < IT_GAP:
        doan.append(L("tsbd.tq.cap_hiem", "Cặp Đường đời {so} và số Ngày sinh {ns} {muc}: chỉ {a} trên {b} ngày — khoảng 1 trong {m} "
                      "ngày sinh (đếm theo ngày trong lịch, không phải theo số người).", so=d["so"], ns=c["ngay_sinh"],
                      muc=L("tsbd.tq.hiem", "thì hiếm") if c["ty_le"] < HIEM else L("tsbd.tq.it_gap", "khá ít gặp"),
                      a=_so_vn(c["so_ngay"]), b=_so_vn(t["tong_ngay"]), m=mot_trong))
    else:
        doan.append(L("tsbd.tq.cap_pho_bien", "Cặp Đường đời {so} và số Ngày sinh {ns} gặp ở khoảng 1 trong {m} ngày (đếm theo ngày "
                      "trong lịch, không phải theo số người) — khá phổ biến; nét riêng của bạn nằm ở cách các con số khác kết hợp với nhau.",
                      so=d["so"], ns=c["ngay_sinh"], m=mot_trong))
    if d["so"] in (11, 22, 33):
        doan.append(L("tsbd.tq.so_cai", "{so} là số cái — nét của nó thường đậm và đòi hỏi nhiều ở chính bạn.", so=d["so"]))
    bo = {**{v: so.get(v) for v in lg.VI_TRI_THU_TU}, "ngay_sinh": mr.so_ngay_sinh(ngay)}
    dem: dict[int, list[str]] = {}
    for vt, s in bo.items():
        if s:
            dem.setdefault(s, []).append(_tvt(vt))
    for s, noi in sorted(dem.items(), key=lambda x: -len(x[1])):
        if len(noi) >= 2:
            tk = (store.nghia_so(s) or {}).get("tu_khoa", "")
            doan.append(L("tsbd.tq.lap", "Số {s} xuất hiện {n} lần trong bộ số của bạn ({noi}) — nét {tk} đậm hơn "
                          "ở người chỉ có số này một lần.", s=s, n=len(noi), noi=", ".join(noi), tk=tk.lower()))
    thieu = (mo_rong.get("bieu_do") or {}).get("so_thieu") or []
    if thieu:
        doan.append(L("tsbd.tq.thieu", "Biểu đồ ngày sinh của bạn có {co}/9 số, thiếu {thieu} — những nét "
                      "bạn thường phải chủ động rèn thay vì có sẵn.", co=9 - len(thieu), thieu=", ".join(map(str, thieu))))
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    if lh and nc:
        doan.append(L("tsbd.tq.trong_ngoai", "Bên trong bạn thuộc nhóm {a}, người khác nhìn thấy trước nhóm {b}", a=lh[1]["ten"], b=nc[1]["ten"])
                    + (L("tsbd.tq.trong_ngoai_cung", " — trong ngoài cùng một nhịp; chương \"Bên trong & bên ngoài\" đọc điểm mạnh và "
                         "chỗ dễ bị lạm dụng của nhịp này.") if lh[0] == nc[0] else
                       L("tsbd.tq.trong_ngoai_lech", " — chỗ lệch này giải thích vì sao bạn đôi khi bị hiểu khác với con người thật; "
                         "chương \"Bên trong & bên ngoài\" đọc kỹ điều đó.")))
    tc = _then_chot(_thang_toi(ngay, thang, ngay_xem))
    so_then_chot = len({(x["thang"], x["nam"]) for v in tc.values() for x in v})
    hien, _, _ = _giai_doan(ngay, thang, nam, ngay_xem.year, quy_uoc)
    doan.append(L("tsbd.tq.nhip", "Trong 12 tháng tới có {n} tháng đáng chú ý dành riêng cho bạn, và giai đoạn đời hiện tại "
                  "({dinh}/4) ", n=so_then_chot, dinh=hien["dinh"])
                + (L("tsbd.tq.toi_nam", "kéo dài tới năm {nam}.", nam=hien["den_nam"]) if hien.get("den_nam")
                   else L("tsbd.tq.cuoi", "là giai đoạn cuối, kéo dài suốt phần đời sau."))
                + L("tsbd.tq.hai_chuong", " Hai chương \"12 tháng tới\" và \"Sự nghiệp & tiền bạc\" đọc chi tiết."))
    return doan


# ------------------------------------------------------------------ chương 2
def _nghich_ly(so: dict, mo_rong: dict) -> list[str]:
    doan = []
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    if lh and nc:
        cn = _cau_noi(lh[0], nc[0])
        doan.append(L("tsbd.nl.trong_ngoai", "Bên trong (Linh hồn {lh}, nhóm {lh_ten}{lh_cai}) bạn muốn {muon}. "
                      "Người khác thấy trước (Nhân cách {nc}, nhóm {nc_ten}{nc_cai}) một người {bieu_hien}.",
                      lh=so["linh_hon"], lh_ten=lh[1]["ten"], lh_cai=_cai(so["linh_hon"]), muon=lh[1]["muon"],
                      nc=so["nhan_cach"], nc_ten=nc[1]["ten"], nc_cai=_cai(so["nhan_cach"]), bieu_hien=nc[1]["bieu_hien"]))
        if lh[0] != nc[0]:
            doan.append(L("tsbd.nl.lech", "{ten}: {doc} Vì vậy bạn dễ bị hiểu là {bi} — trong khi điều bạn thật sự cần là {can}.",
                          ten=cn["ten"], doc=cn["doc"], bi=nc[1]["bi_hieu_lam"], can=lh[1]["can"]))
        else:
            doan.append(L("tsbd.nl.cung", "{ten}: {doc} Khi nhịp này quá đà, người khác có thể thấy bạn {bi} — "
                          "điều bạn cần giữ là {can}.", ten=cn["ten"], doc=cn["doc"], bi=nc[1]["bi_hieu_lam"], can=lh[1]["can"]))
        doan.append(L("tsbd.nl.cach_noi", "Cách nói cho người khác hiểu: {cach} Khi hai phía hoà vào nhau: {hoa}",
                      cach=cn["cach_noi_ro"], hoa=cn["khi_hoa"]))
    d, s = _nhom(so.get("duong_doi") or 0), _nhom(so.get("su_menh") or 0)
    if d and s:
        if d[0] == s[0]:
            doan.append(L("tsbd.nl.dd_sm_cung", "Con đường bạn đi (Đường đời {dd}) và đích bạn hướng tới (Sứ mệnh {sm}) cùng "
                          "nhóm {ten}: bạn đang đi đúng hướng mình muốn tới — điều cần giữ là {can}.",
                          dd=so["duong_doi"], sm=so["su_menh"], ten=d[1]["ten"], can=d[1]["can"]))
        else:
            cn = _cau_noi(d[0], s[0])
            doan.append(L("tsbd.nl.dd_sm_khac", "Con đường bạn đi (Đường đời {dd}, nhóm {d_ten}) và đích bạn hướng tới (Sứ mệnh "
                          "{sm}, nhóm {s_ten}) — {cn_ten}: {doc} Khi hoà được: {hoa}", dd=so["duong_doi"], d_ten=d[1]["ten"],
                          sm=so["su_menh"], s_ten=s[1]["ten"], cn_ten=cn["ten"].lower(), doc=cn["doc"], hoa=cn["khi_hoa"]))
    goi_y = L("tsbd.goi_y", " Gợi ý: {g}", g="{g}")
    for m in (mo_rong.get("bieu_do") or {}).get("mui_ten", []):
        if m.get("y_nghia"):
            doan.append(f"{m['ten']}: {m['y_nghia']}" + (goi_y.format(g=m["goi_y"]) if m.get("goi_y") else ""))
    theo_so: dict[int, dict] = {}
    for n in mo_rong.get("no_nghiep") or []:
        if n.get("nghia"):
            theo_so.setdefault(n["so"], {"nghia": n["nghia"], "o": []})["o"].append(_tvt(n.get("vi_tri")) if n.get("vi_tri") in TEN_VT else n.get("vi_tri"))
    for s_, v in theo_so.items():
        doan.append(L("tsbd.nl.no_nghiep", "Nợ nghiệp {so} — ở {o}: {y}", so=s_, o=", ".join(v["o"]), y=v["nghia"].get("y_nghia", ""))
                    + (goi_y.format(g=v["nghia"]["goi_y"]) if v["nghia"].get("goi_y") else ""))
    return doan or [L("tsbd.nl.chua_du", "Bộ số của bạn chưa đủ (họ tên chưa có chữ cái) để đọc chỗ lệch giữa bên trong và bên ngoài.")]


# ------------------------------------------------------------------ chương 3
def _muoi_hai_thang(ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str) -> list[str]:
    van = kb.ban_do()
    y = ngay_xem.year
    ncn = int(tinh.nam_ca_nhan(ngay, thang, y, "duong_lich"))
    n = store.nghia_nam_ca_nhan(ncn) or {}
    doan = [L("tsbd.mh.nam", "Năm cá nhân {so} ({nam}) — {chu_de}. {doc}", so=ncn, nam=y, chu_de=n.get("chu_de", ""),
              doc=van["nam_doc_thang"][str(ncn)])]
    thang_ds = _thang_toi(ngay, thang, ngay_xem)
    if any(t["nam"] > y for t in thang_ds):
        ncn2 = int(tinh.nam_ca_nhan(ngay, thang, y + 1, "duong_lich"))
        n2 = store.nghia_nam_ca_nhan(ncn2) or {}
        doan.append(L("tsbd.mh.nam_sau", "Từ tháng 1/{nam}: năm cá nhân {so} — {chu_de}. {doc}", nam=y + 1, so=ncn2,
                      chu_de=n2.get("chu_de", ""), doc=van["nam_doc_thang"][str(ncn2)]))
    tc = _then_chot(thang_ds)
    for k in NHOM_THEN_CHOT:
        for t in tc[k]:
            ghi = ""
            if t["nam_ca_nhan"] == 9 and k in ("khoi_su", "doi_viec"):
                ghi = L("tsbd.mh.ghi_9", " Vì đang trong năm khép lại, hợp để chuẩn bị — cam kết lớn để từ 1/{nam}.", nam=t["nam"] + 1)
            elif t["nam_ca_nhan"] == 1 and k == "khep_lai":
                ghi = L("tsbd.mh.ghi_1", " Trong năm mở đầu, đây là dọn chỗ cho việc mới.")
            doan.append(L("tsbd.mh.danh_dau", "Tháng nên đánh dấu — {nhom}: {thang}/{nam} (tháng cá nhân {so}, {nhan}): {viec}.{ghi}",
                          nhom=van["nhom_viec"][k].lower(), thang=t["thang"], nam=t["nam"], so=t["so"], nhan=t["nhan"].lower(),
                          viec=", ".join(t["hop_de"]), ghi=ghi))
    doan.append(L("tsbd.mh.nhip", "Nhịp từng tháng: {ds}.", ds="; ".join(f"{t['thang']}/{t['nam']} · {t['so']} {t['nhan']}" for t in thang_ds)))
    if any(t["thang"] == 1 for t in thang_ds[1:]):
        doan.append(van["ghi_chu_thang_1"])
    hien, _, dd = _giai_doan(ngay, thang, nam, y, quy_uoc)
    nd = store.nghia_dinh_cao(hien["so"]) or {}
    doan.append(L("tsbd.mh.giai_doan", "Bạn đang ở giai đoạn {dinh}/4 của đời (tuổi {tuoi}, số {so}): {chu_de}. {y}",
                  dinh=hien["dinh"], tuoi=_tuoi(hien), so=hien["so"], chu_de=nd.get("chu_de", ""), y=nd.get("y_nghia", "")))
    moc: dict[int, list[str]] = {}
    for b in dd["buoc_ngoat"]:
        if b["nam"] > y:
            moc.setdefault(b["nam"], []).append(_ten_moc(b["loai"]))
    tiep = sorted(moc.items())[:2]
    if tiep:
        doan.append(L("tsbd.mh.moc", "Mốc sắp tới: {ds}.", ds="; ".join(
            L("tsbd.mh.moc_nam", "năm {nam} (tuổi {tuoi}) {ds}", nam=nm, tuoi=nm - nam, ds=L("tsbd.va", " và ").join(ds))
            for nm, ds in tiep)))
    doan.append(L("tsbd.mh.goi_y", "Đây là nhịp gợi ý để sắp việc, không phải dự báo điều sẽ xảy ra."))
    return doan


# ------------------------------------------------------------------ chương 4
def _su_nghiep(so: dict, ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str) -> list[str]:
    doan = []
    cv = ((kb.chan_dung(so["duong_doi"]) or {}).get("cong_viec")) or {}
    sm, nc = so.get("su_menh"), so.get("nhan_cach")
    cs = ((kb.chan_dung(sm) or {}).get("cong_viec")) if sm else None
    nhom_nc = _nhom(nc) if nc else None
    if cv:
        cong_thuc = L("tsbd.sn.cong_thuc", "Công thức nghề của bạn: Đường đời {dd} cho thế mạnh {manh}", dd=so["duong_doi"],
                      manh=cv["the_manh"].rstrip(".").lower())
        if cs:
            cong_thuc += L("tsbd.sn.cong_thuc_sm", "; Sứ mệnh {sm} là đích bạn hướng tới — vai trò {vai}", sm=sm,
                           vai=cs["vai_tro"].rstrip(".").lower())
        if nhom_nc:
            cong_thuc += L("tsbd.sn.cong_thuc_nc", "; ở chỗ làm, người khác thấy trước một người {bieu_hien} (Nhân cách {nc})",
                           bieu_hien=nhom_nc[1]["bieu_hien"], nc=nc)
        doan.append(cong_thuc + ".")
        if cs and _nhom(so["duong_doi"]) and _nhom(sm) and _nhom(so["duong_doi"])[0] != _nhom(sm)[0]:
            doan.append(L("tsbd.sn.khac_nhom", "Đường đời và Sứ mệnh của bạn khác nhóm, nên việc hợp nhất thường là việc dùng được cả hai: thế mạnh "
                          "hằng ngày của số {dd} để đi tới vai trò của số {sm} ({manh}).", dd=so["duong_doi"], sm=sm,
                          manh=cs["the_manh"].rstrip(".").lower()))
        doan.append(L("tsbd.sn.bay", "Bẫy hay mắc: {x}", x=cv["cai_bay"]))
        thang_tien = [t for t in _thang_toi(ngay, thang, ngay_xem) if "tien_bac" in t["nhom"]][:2]
        doan.append(L("tsbd.sn.tien", "Tiền bạc: {x}", x=cv["tien_bac"])
                    + (L("tsbd.sn.thang_tien", " Tháng hợp bàn chuyện tiền, lương trong 12 tháng tới: {ds}.",
                         ds=", ".join(_mm(t) for t in thang_tien)) if thang_tien else ""))
    hien, ke, _ = _giai_doan(ngay, thang, nam, ngay_xem.year, quy_uoc)
    nd = store.nghia_dinh_cao(hien["so"]) or {}
    tt = store.nghia_thu_thach(hien["thu_thach"]) or {}
    doan.append(L("tsbd.sn.gd", "Giai đoạn hiện tại {dinh}/4 (tuổi {tuoi}", dinh=hien["dinh"], tuoi=_tuoi(hien))
                + (L("tsbd.sn.gd_toi", ", tới năm {nam}", nam=hien["den_nam"]) if hien.get("den_nam") else "")
                + L("tsbd.sn.gd_so", "), số {so} — {chu_de}: {y}", so=hien["so"], chu_de=nd.get("chu_de", ""), y=nd.get("y_nghia", ""))
                + (L("tsbd.sn.thu_thach", " Thử thách đi kèm (số {so}): {mo_ta} — {cach}", so=hien["thu_thach"],
                     mo_ta=tt.get("mo_ta", ""), cach=tt.get("cach_vuot", "")) if tt else ""))
    if ke:
        nk = store.nghia_dinh_cao(ke["so"]) or {}
        doan.append(L("tsbd.sn.ke", "Từ năm {nam} (tuổi {tuoi}): giai đoạn {dinh}, số {so} — {chu_de}. {y}", nam=ke["tu_nam"],
                      tuoi=ke["tu_tuoi"], dinh=ke["dinh"], so=ke["so"], chu_de=nk.get("chu_de", ""), y=nk.get("y_nghia", "")))
    return doan


def _moi_xem_rieng(ma: str, doan: list[str], diem_nhan: str, cau_hoi: str) -> dict:
    chu = sum(len(d.split()) for d in doan)
    return {"diem_nhan": diem_nhan, "cau_hoi": cau_hoi, "so_doan": len(doan), "phut_doc": max(1, round(chu / 200))}


def _ap_hoc(x: dict, trong_so: dict | None, ca_nhan: dict | None) -> None:
    """Tầng HỌC (như Tử vi / Bát tự đời sống, `doi_song_chung._ap_hoc`): hộp ≥ 100 phiếu & < 40% đúng → bỏ khỏi hộp,
    dòng "Đang xem lại" vào căn cứ chương; hộp người xem bấm "chưa đúng" xếp cuối; gắn `ty_le_dung`/`so_phieu` khi ≥ 30
    phiếu. Không đổi lời, không sinh câu mới."""
    if not (trong_so or ca_nhan) or not x.get("hop"):
        return
    hop, xem_lai = dsc._ap_hoc(x["hop"], trong_so, ca_nhan)
    for h in hop:
        h.pop("_chua_dung", None)
        if not h.get("dang_xem_lai"):
            h.pop("dang_xem_lai", None)
    x["hop"] = hop
    if xem_lai:
        x["can_cu"] = [*(x.get("can_cu") or []), *xem_lai]


def bao_cao(ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str = "tong_het",
            trong_so: dict | None = None, ca_nhan: dict | None = None) -> dict:
    """`trong_so` = {mã: {dung, chua_dung}} (tỉ lệ công khai), `ca_nhan` = {mã: "dung" | "chua_dung"} (phiếu của chính
    người xem) — tầng HỌC chỉ chọn/xếp hộp (`_ap_hoc`)."""
    so = tinh.chi_so_xac_dinh(ho_ten[0], ngay, thang, nam, quy_uoc)
    mo_rong = lg.luan_mo_rong(ho_ten[0], ngay, thang, nam, quy_uoc=quy_uoc)
    noi_dung = {
        "tong_quan": _tong_quan(so, ngay, thang, nam, ngay_xem, quy_uoc, mo_rong),
        "nghich_ly": _nghich_ly(so, mo_rong),
        "muoi_hai_thang": _muoi_hai_thang(ngay, thang, nam, ngay_xem, quy_uoc),
        "su_nghiep": _su_nghiep(so, ngay, thang, nam, ngay_xem, quy_uoc),
    }
    # Lời mời chương khoá: một dữ kiện RIÊNG của chương mà người đọc chưa thấy ở phần miễn phí (không lộ nội dung).
    lh, nc = so.get("linh_hon"), so.get("nhan_cach")
    ncn = int(tinh.nam_ca_nhan(ngay, thang, ngay_xem.year, "duong_lich"))
    tc = _then_chot(_thang_toi(ngay, thang, ngay_xem))
    hien, ke, _ = _giai_doan(ngay, thang, nam, ngay_xem.year, quy_uoc)
    moi = {
        "nghich_ly": ((L("tsbd.moi.nl", "Linh hồn {lh} × Nhân cách {nc}: có một chỗ người khác hay hiểu sai về bạn, và một câu nói giúp "
                         "họ hiểu đúng.", lh=lh, nc=nc)
                       if lh and nc else L("tsbd.moi.nl_thieu", "Chỗ lệch giữa con đường và đích đến của bạn.")),
                      L("tsbd.tu_soi.nl", "Người khác đang thấy bạn khác con người thật ở điểm nào?")),
        "muoi_hai_thang": (L("tsbd.moi.mh", "Năm cá nhân {so}: {n} tháng nên đánh dấu — tháng nào để khởi sự, đổi việc, bàn chuyện tiền.",
                             so=ncn, n=sum(len(v) for v in tc.values())),
                           L("tsbd.moi.mh_hoi", "Trong năm cá nhân {so} này, nên dồn sức vào tháng nào?", so=ncn)),
        "su_nghiep": ((L("tsbd.moi.sn", "Giai đoạn {dinh}/4 của bạn kéo dài tới năm {nam} — điều gì đổi ở giai đoạn {ke}?",
                         dinh=hien["dinh"], nam=hien.get("den_nam"), ke=ke["dinh"])
                       if ke and hien.get("den_nam") else
                       L("tsbd.moi.sn_cuoi", "Giai đoạn {dinh}/4 của bạn và thử thách đi kèm.", dinh=hien["dinh"])),
                      L("tsbd.tu_soi.sn", "Kiểu việc nào dùng được cả thế mạnh hằng ngày lẫn đích bạn hướng tới?")),
    }
    them = _khuon(so, ngay, thang, nam, ngay_xem, quy_uoc, mo_rong, tc, hien, ke)
    for x in them.values():
        _ap_hoc(x, trong_so, ca_nhan)
    chuong = []
    for ma, doan in noi_dung.items():
        dn, ch = moi.get(ma, (doan[0], L("tsbd.moi.tq_hoi", "Bộ số của bạn hiếm cỡ nào, và con số nào đậm nhất ở bạn?")))
        x = them.get(ma, {})
        chuong.append(kh.chuong(ma, _tieu_de(ma), doan, hop=x.get("hop"), tom_tat=x.get("tom_tat"), can_cu=x.get("can_cu"),
                                cau_tu_soi=x.get("cau_tu_soi"), moi_xem=_moi_xem_rieng(ma, doan, dn, ch)))
    meta = kb.meta_ban_do()
    # Trục 1: thân hộp không lặp tiêu đề, một mã một hộp đầy đủ (thân chương là bài viết riêng → không cắt đoạn).
    cot_loi = kh.gon_bao_cao({"cot_loi": kh.chon_cot_loi(chuong[:1]), "chuong": chuong}, gon_doan=False)["cot_loi"]
    return {"mo_dun": "thanso", "phien_ban": kh.PHIEN_BAN, "phai": "pitago", "cot_loi": cot_loi,
            "chuong": chuong, "ket": L("hoi.ket", hoi_van.KET), "dien_dat": "mau", "quy_uoc_duong_doi": quy_uoc,
            "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
            "trang_thai": meta["trang_thai"]}


# ------------------------------------------------------------------ KC-1: khuôn đời sống (hộp · tóm tắt · căn cứ · tự soi)
def _khuon(so: dict, ngay: int, thang: int, nam: int, ngay_xem: dt.date, quy_uoc: str, mo_rong: dict,
           tc: dict, hien: dict, ke: dict | None) -> dict[str, dict]:
    t = tl.ty_le(ngay, thang, nam, quy_uoc)
    d = t["duong_doi"]
    nghia_dd = store.nghia_so(d["so"]) or {}
    bo = {**{v: so.get(v) for v in lg.VI_TRI_THU_TU}, "ngay_sinh": mr.so_ngay_sinh(ngay)}
    dem: dict[int, list[str]] = {}
    for vt, s_ in bo.items():
        if s_:
            dem.setdefault(s_, []).append(_tvt(vt))
    lap = [(s_, noi) for s_, noi in sorted(dem.items(), key=lambda x: -len(x[1])) if len(noi) >= 2]
    thieu = (mo_rong.get("bieu_do") or {}).get("so_thieu") or []
    so_then_chot = len({(x["thang"], x["nam"]) for v in tc.values() for x in v})
    ra: dict[str, dict] = {}

    # chương 1
    # EN-2 (P2-12): "x% số ngày cho ra con số này" (~1/9 với mọi số) là "aha" giả → thân hộp nói nét mạnh và mặt dễ lệch
    # của chính con số; tỉ lệ chỉ còn ở "Vì sao nói vậy". Cặp Đường đời + Ngày sinh hiếm vẫn nêu ở đoạn thân (aha thật).
    mt = (nghia_dd.get("mat_toi") or "").split(",")[0].strip()
    _dl = ((tsv2.chan_dung(d["so"]) or {}).get("tong_quan") or {}).get("dong_luc") or ""
    hop = [kh.hop("cot_loi", L("tsbd.k.dd_td", "Đường đời {so} — {tk}", so=d["so"], tk=nghia_dd.get("tu_khoa", "")).rstrip(" —"),
                  # Review EN-2 (#7): thân không lặp từ khoá ở tiêu đề — nói động lực (kho chân dung) rồi mặt dễ lệch.
                  (L("tsbd.k.tiep_suc", "Điều tiếp sức cho bạn: {x}.", x=_dl[:1].lower() + _dl[1:].rstrip(".")) if _dl else
                   L("tsbd.k.net_manh", "Nét mạnh: {x}.", x=nghia_dd.get("tu_khoa", "").lower()) if nghia_dd.get("tu_khoa") else "")
                  + (L("tsbd.k.de_lech", " Mặt dễ lệch: {x}.", x=mt[:1].lower() + mt[1:]) if mt else "")
                  + (L("tsbd.k.so_cai", " Số cái: nét đậm và đòi hỏi nhiều ở chính bạn.") if d["so"] in (11, 22, 33) else ""),
                  ma=kh.ma_mau("thanso", "tong_quan", "duong_doi", str(d["so"])))]
    for s_, noi in lap[:1]:
        hop.append(kh.hop("diem_manh", L("tsbd.k.lap_td", "Số {s} lặp {n} lần", s=s_, n=len(noi)),
                          L("tsbd.k.lap", "Ở {noi} — nét {tk} đậm hơn người chỉ có số này một lần.", noi=", ".join(noi),
                            tk=(store.nghia_so(s_) or {}).get("tu_khoa", "").lower()),
                          ma=kh.ma_mau("thanso", "tong_quan", "lap", str(s_))))
    if thieu:
        hop.append(kh.hop("luu_y", L("tsbd.k.thieu_td", "Biểu đồ thiếu {ds}", ds=", ".join(map(str, thieu))),
                          L("tsbd.k.thieu", "Những nét này bạn thường phải chủ động rèn thay vì có sẵn."),
                          huong_xu_ly=L("tsbd.k.thieu_xu_ly", "Chọn một thói quen nhỏ cho mỗi số thiếu, làm đều hơn là làm nhiều."),
                          ma=kh.ma_mau("thanso", "tong_quan", "thieu", "-".join(map(str, thieu)))))
    hop.append(kh.hop("thoi_diem", L("tsbd.k.nhip_td", "Nhịp sắp tới"),
                      L("tsbd.k.nhip", "{n} tháng nên đánh dấu trong 12 tháng tới; giai đoạn đời hiện tại {dinh}/4", n=so_then_chot,
                        dinh=hien["dinh"])
                      + (L("tsbd.k.nhip_toi", " kéo dài tới năm {nam}.", nam=hien["den_nam"]) if hien.get("den_nam")
                         else L("tsbd.k.nhip_cuoi", " là giai đoạn cuối.")),
                      ma=kh.ma_mau("thanso", "tong_quan", "nhip", str(hien["dinh"]))))
    ra["tong_quan"] = {"hop": hop,
                       "tom_tat": L("tsbd.k.tq_tom_dd", "Đường đời {so}", so=d["so"])
                       + (L("tsbd.k.tq_tom_lap", ", số {s} lặp {n} lần", s=lap[0][0], n=len(lap[0][1])) if lap else "")
                       + L("tsbd.k.tq_tom_nhip", "; {n} tháng nên đánh dấu sắp tới.", n=so_then_chot),
                       "can_cu": [L("tsbd.k.cc_ty_le", "Đường đời {so}: {pt} số ngày trong lịch {mau} cho ra con số này — "
                                    "tỉ lệ tính trên mẫu mọi ngày (không phải thống kê dân số); cách tính con số Đường đời: {qu}.",
                                    so=d["so"], pt=_pt(d["ty_le"]), mau=t["mau"],
                                    qu=L(f"tsbd.qu.{quy_uoc}", lg.TEN_QUY_UOC_DD[quy_uoc]) if quy_uoc in lg.TEN_QUY_UOC_DD else quy_uoc),
                                  L("tsbd.k.cc_bo_so", "Bộ số: {ds}.", ds=", ".join(f"{_tvt(v)} {bo[v]}" for v in bo if bo[v]))],
                       "cau_tu_soi": L("tsbd.tu_soi.tq", "Con số nào trong bộ số bạn thấy giống mình nhất ngay lần đọc đầu?")}

    # chương 2
    lh, nc = _nhom(so.get("linh_hon") or 0), _nhom(so.get("nhan_cach") or 0)
    dd_, sm = _nhom(so.get("duong_doi") or 0), _nhom(so.get("su_menh") or 0)
    hop, can_cu = [], []
    if lh and nc:
        cn = _cau_noi(lh[0], nc[0])
        hop.append(kh.hop("cot_loi", L("tsbd.k.lh_nc_td", "Bên trong {a} · bên ngoài {b}", a=lh[1]["ten"], b=nc[1]["ten"]),
                          L("tsbd.k.lh_nc", "Bạn muốn {muon}; người khác thấy trước một người {bh}.", muon=lh[1]["muon"], bh=nc[1]["bieu_hien"]),
                          ma=kh.ma_mau("thanso", "nghich_ly", "lh_nc", f"{so['linh_hon']}-{so['nhan_cach']}")))
        hop.append(kh.hop("luu_y", L("tsbd.k.hieu_lam_td", "Dễ bị hiểu là"),
                          L("tsbd.k.hieu_lam", "{bi} — trong khi điều bạn cần là {can}.", bi=_dau(nc[1]["bi_hieu_lam"]), can=lh[1]["can"]),
                          huong_xu_ly=cn.get("cach_noi_ro"), ma=kh.ma_mau("thanso", "nghich_ly", "hieu_lam", str(so["nhan_cach"]))))
        if cn.get("khi_hoa"):
            hop.append(kh.hop("loi_khuyen", L("tsbd.k.hoa_td", "Khi hai phía hoà vào nhau"), cn["khi_hoa"],
                              ma=kh.ma_mau("thanso", "nghich_ly", "hoa", f"{lh[0]}-{nc[0]}")))
        can_cu.append(L("tsbd.k.cc_lh_nc", "Linh hồn {lh} (nhóm {a}) × Nhân cách {nc} (nhóm {b}): {ten}.", lh=so["linh_hon"],
                        a=lh[1]["ten"], nc=so["nhan_cach"], b=nc[1]["ten"], ten=cn["ten"]))
    if dd_ and sm:
        if dd_[0] == sm[0]:
            hop.append(kh.hop("diem_manh", L("tsbd.k.dd_sm_cung_td", "Đường đi và nơi hướng tới cùng nhóm"),
                              L("tsbd.k.dd_sm_cung", "Đường đời {dd} và Sứ mệnh {sm} cùng nhóm {ten} — điều cần giữ là {can}.",
                                dd=so["duong_doi"], sm=so["su_menh"], ten=dd_[1]["ten"], can=dd_[1]["can"]),
                              ma=kh.ma_mau("thanso", "nghich_ly", "dd_sm", "cung")))
        else:
            cn2 = _cau_noi(dd_[0], sm[0])
            hop.append(kh.hop("loi_khuyen", L("tsbd.k.dd_sm_khac_td", "Đường đi khác nơi hướng tới"), f"{cn2['ten']}: {cn2['doc']}",
                              ma=kh.ma_mau("thanso", "nghich_ly", "dd_sm", "khac")))
        can_cu.append(L("tsbd.k.cc_dd_sm", "Đường đời {dd} (nhóm {a}) ↔ Sứ mệnh {sm} (nhóm {b}).", dd=so["duong_doi"], a=dd_[1]["ten"],
                        sm=so["su_menh"], b=sm[1]["ten"]))
    ra["nghich_ly"] = {"hop": hop,
                       "tom_tat": (L("tsbd.k.nl_tom", "Bên trong {a}, bên ngoài {b}.", a=lh[1]["ten"].lower(), b=nc[1]["ten"].lower())
                                   if lh and nc else L("tsbd.k.nl_tom_thieu", "Bộ số chưa đủ để đọc chỗ lệch.")),
                       "can_cu": can_cu, "cau_tu_soi": L("tsbd.tu_soi.nl", "Người khác đang thấy bạn khác con người thật ở điểm nào?")}

    # chương 3
    van = kb.ban_do()
    y = ngay_xem.year
    ncn = int(tinh.nam_ca_nhan(ngay, thang, y, "duong_lich"))
    n_ncn = store.nghia_nam_ca_nhan(ncn) or {}
    hop = [kh.hop("cot_loi", L("tsbd.k.ncn_td", "Năm cá nhân {so}", so=ncn),
                  f"{n_ncn.get('chu_de', '')}. {van['nam_doc_thang'][str(ncn)]}".strip(". ") + ".",
                  ma=kh.ma_mau("thanso", "muoi_hai_thang", "nam", str(ncn)))]
    for k in ("khoi_su", "tien_bac", "quan_he"):
        for t_ in tc.get(k, [])[:1]:
            hop.append(kh.hop("thoi_diem", f"{van['nhom_viec'][k]}: {_mm(t_)}",
                              L("tsbd.k.thang", "Tháng cá nhân {so} ({nhan}): {viec}.", so=t_["so"], nhan=t_["nhan"].lower(),
                                viec=", ".join(t_["hop_de"])),
                              muc="thuan", ma=kh.ma_mau("thanso", "muoi_hai_thang", k, str(t_["so"]))))
    ra["muoi_hai_thang"] = {"hop": hop,
                            "tom_tat": L("tsbd.k.mh_tom", "Năm cá nhân {so}; {n} tháng đáng chú ý dành riêng cho bạn.", so=ncn, n=so_then_chot),
                            "can_cu": [L("tsbd.k.cc_thang", "Tháng cá nhân = năm cá nhân + tháng dương, rút gọn; năm cá nhân đổi từ 1/1 dương "
                                         "lịch (mốc trang đọc đang dùng).")],
                            "cau_tu_soi": L("tsbd.tu_soi.mh", "Trong năm cá nhân này, bạn định dồn sức vào tháng nào?")}

    # chương 4
    cv = ((kb.chan_dung(so["duong_doi"]) or {}).get("cong_viec")) or {}
    nd = store.nghia_dinh_cao(hien["so"]) or {}
    hop = []
    if cv:
        hop.append(kh.hop("cot_loi", L("tsbd.k.manh_td", "Thế mạnh ở chỗ làm (Đường đời {dd})", dd=so["duong_doi"]), f"{_dau(cv.get('the_manh'))}.",
                          ma=kh.ma_mau("thanso", "su_nghiep", "manh", str(so["duong_doi"]))))
        if cv.get("cai_bay"):
            hop.append(kh.hop("luu_y", L("tsbd.k.bay_td", "Bẫy hay mắc"), f"{_dau(cv['cai_bay'])}.",
                              huong_xu_ly=L("tsbd.k.bay_xu_ly", "Đặt một người hoặc một quy tắc kiểm lại trước khi quyết việc lớn."),
                              ma=kh.ma_mau("thanso", "su_nghiep", "bay", str(so["duong_doi"]))))
        if cv.get("tien_bac"):
            hop.append(kh.hop("loi_khuyen", L("tsbd.k.tien_td", "Tiền bạc"), f"{_dau(cv['tien_bac'])}.",
                              ma=kh.ma_mau("thanso", "su_nghiep", "tien", str(so["duong_doi"]))))
    hop.append(kh.hop("thoi_diem", L("tsbd.k.gd_td", "Giai đoạn {dinh}/4 (tuổi {tuoi})", dinh=hien["dinh"], tuoi=_tuoi(hien)),
                      L("tsbd.k.gd", "Số {so} — {chu_de}.", so=hien["so"], chu_de=nd.get("chu_de", ""))
                      + (L("tsbd.k.gd_ke", " Từ năm {nam}: giai đoạn {dinh}.", nam=ke["tu_nam"], dinh=ke["dinh"]) if ke else ""),
                      ma=kh.ma_mau("thanso", "su_nghiep", "giai_doan", str(hien["dinh"])), tu_tuoi=hien.get("tu_tuoi"), den_tuoi=hien.get("den_tuoi")))
    # CY-1: năm cá nhân có chủ đề tiền / việc (KB chu_y_kb) trong mười năm tới → "Năm nên chú ý tiền bạc, công việc hơn".
    from app.luangiai import chu_y_nam as cyn  # noqa: PLC0415
    if ngay_xem.year - nam >= cyn.TUOI_TOI_THIEU:
        mangs = cyn.kb.chuong("thanso").get("su_nghiep") or []
        theo = {m: cyn.thanso_nam_nguoi(ngay, thang, m, y) for m in mangs}
        co = [m for m in mangs if theo[m]]
        if co:
            h_cy = cyn.hop_chuong(theo, kh.ma_mau("thanso", "su_nghiep", "chu_y", "+".join(co), cyn.ma_ly_do(theo[co[0]][0])),
                                  lambda loai, td, nd, cu, ma, _w, **k: kh.hop(loai, td, nd, can_cu=cu, ma=ma, **k))
            if h_cy:
                hop.insert(min(2, len(hop)), h_cy)
    ra["su_nghiep"] = {"hop": hop,
                       "tom_tat": (L("tsbd.k.sn_tom_manh", "Thế mạnh {x}; ", x=cv.get("the_manh", "").split(",")[0].lower()) if cv else "")
                       + L("tsbd.k.sn_tom_gd", "giai đoạn {dinh}/4.", dinh=hien["dinh"]),
                       "can_cu": [L("tsbd.k.cc_sn", "Chân dung công việc theo Đường đời {dd}, Sứ mệnh {sm}, Nhân cách {nc}; giai đoạn đỉnh cao "
                                    "theo chu kỳ 9 năm.", dd=so["duong_doi"], sm=so.get("su_menh"), nc=so.get("nhan_cach"))],
                       "cau_tu_soi": L("tsbd.tu_soi.sn", "Kiểu việc nào dùng được cả thế mạnh hằng ngày lẫn đích bạn hướng tới?")}
    return ra


def _dau(s: str | None) -> str:
    s = (s or "").strip().rstrip(".")
    return s[:1].upper() + s[1:] if s else ""
