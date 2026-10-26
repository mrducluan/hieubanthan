# -*- coding: utf-8 -*-
"""Y5 (2026-10-26) — cụm trang kiến thức "dấu hiệu nhà ở" `/phong-thuy/dau-hieu/{slug}`, dựng từ KB (chỉ ĐỌC + GHÉP).

Một trang cho mỗi dấu hiệu quan sát được của form Khảo sát nhà (`luangiai.phongthuy_bo_cuc.DAU_HIEU`, mã = mục `bo_tri`
của `phongthuy_kb.json`): sách xưa nói gì (`noi_dung`), nhìn theo đời sống hiện đại (`giai_thich_hien_dai`), việc nên làm
theo 3 mức chi phí (`viec` — một bảng thật), luật thực hành áp dụng (`quy_tac_thuc_hanh`, vd căn hộ), phòng hay gặp và
ý định liên quan (đồ thị `phongthuy_do_thi.json`), câu tự kiểm tra (câu hỏi khảo sát). Không vật phẩm, không điểm số,
không sinh nghĩa mới — mọi câu nghĩa lấy nguyên từ KB; câu nối là khung cố định.
"""
from __future__ import annotations

DUONG_CONG_CU = "/phong-thuy#khao-sat-nha"
DUONG_CUM = "/phong-thuy/dau-hieu"          # = web lib/chuyen-huong.json chu_de["dau-hieu"]
_TEN_NHOM = {"ngoai_canh": "ngoại cảnh quanh nhà", "hinh_nha": "hình dáng nhà", "trong_nha": "bố trí trong nhà"}


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _bc():
    from app.luangiai import phongthuy_bo_cuc as bc  # noqa: PLC0415 — danh mục dấu hiệu + việc theo loại nhà
    return bc


def _kb() -> dict:
    return _t()._doc("phongthuy_kb.json")


def _do_thi() -> dict:
    return _t()._doc("phongthuy_do_thi.json")


def ds_dau_hieu() -> list[tuple[str, str]]:
    bt = _kb()["bo_tri"]
    return [(ma, _t()._slug(bt[ma]["tieu_de"])) for ma in _bc().DAU_HIEU]


def _cau_dau(s: str) -> str:
    i = s.find(". ")
    return s if i < 0 else s[: i + 1]


def _tieu_de(ten: str, tot: bool) -> str:
    ung = ([f"{ten} trong phong thuỷ: ý nghĩa và cách giữ", f"{ten}: ý nghĩa phong thuỷ"] if tot else
           [f"{ten} có sao không? Ý nghĩa và cách xử lý", f"{ten} có sao không? Cách xử lý", f"{ten}: phong thuỷ nói gì"])
    return next((x for x in ung if len(x) <= 70), ung[-1][:70])


def _quy_tac(ma: str) -> list[tuple[str, dict]]:
    """Luật thực hành gắn với dấu hiệu (lọc theo `ap_dung.dau_hieu`) — luật nền / Huyền Không bỏ qua."""
    ra = []
    for k, q in (_kb().get("quy_tac_thuc_hanh") or {}).items():
        if k.startswith("_") or not isinstance(q, dict):
            continue
        if ma in ((q.get("ap_dung") or {}).get("dau_hieu") or []):
            ra.append((k, q))
    return ra


def trang_dau_hieu(ma: str, slug: str) -> dict:
    t, bc = _t(), _bc()
    kb = _kb()
    m = kb["bo_tri"][ma]
    dh = bc.DAU_HIEU[ma]
    ten, tot, veto = m["tieu_de"], bool(dh.get("tot")), bool(m.get("veto"))
    nguon_y = "quan niệm dân gian" if m["nguon"] == "dan_gian" else "sách phong thuỷ xưa"
    viec = m.get("viec") or []
    v0 = next((v["lam"] for v in viec if v["chi_phi"] == "khong_ton"), None)
    g = _do_thi()
    phong = [bc.TEN_PHONG[p] for p in g.get("dau_hieu_phong", {}).get(ma, []) if p in bc.TEN_PHONG]
    yd_kb = t._doc("y_dinh_chung.json")["y_dinh"]
    y_dinh = [yd_kb[k]["ten"] for k, v in g["y_dinh"].items() if ma in v.get("dau_hieu", []) and k in yd_kb]
    qt = _quy_tac(ma)
    can_ho = [q for _, q in qt if "can_ho" in ((q.get("ap_dung") or {}).get("loai_nha") or [])]
    chung = [q for _, q in qt if not (q.get("ap_dung") or {}).get("loai_nha")]
    viec_can_ho = bc._viec_cho(ma, m, "can_ho")

    tra_loi = ((f"{ten} là dấu hiệu tốt theo {nguon_y}. " if tot else "")
               + (f"Đây là một trong những dấu hiệu nên xử lý trước. " if veto else "")
               + _cau_dau(m["noi_dung"]) + " " + _cau_dau(m.get("giai_thich_hien_dai") or "")
               + (f" Việc không tốn tiền: {v0}" if v0 else "")).strip()
    muc = [{"tieu_de": "Sách xưa nói gì" if m["nguon"] != "dan_gian" else "Dân gian nói gì",
            "doan": m["noi_dung"]}]
    if m.get("giai_thich_hien_dai"):
        muc.append({"tieu_de": "Nhìn theo đời sống hiện đại", "doan": m["giai_thich_hien_dai"]})
    if veto:
        muc.append({"tieu_de": "Vì sao xếp vào nhóm nên xử lý trước",
                    "doan": ("Hiểu Bản Thân xếp dấu hiệu này vào nhóm “xử lý trước”: khi bạn đã xác nhận nhà có nó, bài đọc "
                             "Nhà của bạn giữ mức tối đa là Cân bằng cho phần liên quan cho tới khi bạn đánh dấu đã xử lý — "
                             "hướng tốt, sao tốt không bù được chuyện ở ngay trước mắt. Hình thế là nền, lý khí là nhịp.")})
    if viec:
        muc.append({"tieu_de": "Việc nên làm theo chi phí",
                    "doan": f"Gợi ý chung: {m['goi_y']} Bắt đầu từ việc 0 đồng; chỉ sửa chữa khi việc nhỏ chưa đủ.",
                    "bang": {"cot": ["Chi phí", "Việc nên làm"],
                             "dong": [[bc.CHI_PHI[v["chi_phi"]], v["lam"]] for v in viec]}})
    if can_ho or viec_can_ho != viec:
        ds = [q["noi_dung"] for q in can_ho]
        if viec_can_ho != viec:
            ds.append("Việc làm được ở căn hộ: " + " · ".join(v["lam"] for v in viec_can_ho))
        muc.append({"tieu_de": "Nếu bạn ở chung cư", "danh_sach": ds})
    for q in chung:
        muc.append({"tieu_de": q["tieu_de"], "doan": q["noi_dung"]})
    if phong or y_dinh:
        doan = []
        if phong:
            doan.append(f"Dấu hiệu thuộc nhóm {_TEN_NHOM.get(dh['nhom'], 'bố trí nhà')}, hay gặp ở: {', '.join(phong)}.")
        if y_dinh:
            doan.append("Nên rà dấu hiệu này trước khi bạn đang băn khoăn về: " + "; ".join(y.lower() for y in y_dinh) + ".")
        muc.append({"tieu_de": "Hay gặp ở đâu, liên quan chuyện gì", "doan": " ".join(doan)})
    muc.append({"tieu_de": "Tự kiểm tra nhà bạn",
                "danh_sach": [dh["hoi"], "Mở Khảo sát nhà, tích dấu hiệu bạn thấy — bài đọc Nhà của bạn sẽ xếp việc nên làm theo "
                              "đúng hướng nhà và người ở; đã xử lý thì bấm “Tôi đã xử lý” để xem trước – sau."]})

    hoi_dap = [{"hoi": (f"{ten} có tốt không?" if tot else f"{ten} có sao không?"), "dap": tra_loi}]
    if v0:
        hoi_dap.append({"hoi": f"Xử lý “{ten.lower()}” thế nào mà không tốn tiền?", "dap": v0})
    if can_ho:
        hoi_dap.append({"hoi": f"Ở chung cư thì xử lý “{ten.lower()}” ra sao?", "dap": can_ho[0]["noi_dung"]})
    if kb["mau"].get("tu_choi_vat_pham"):
        hoi_dap.append({"hoi": "Có cần mua vật phẩm phong thuỷ để hoá giải không?",
                        "dap": kb["mau"]["tu_choi_vat_pham"] + " Việc nên làm ở trên đều là kê lại, đổi thói quen, sửa nhỏ."})

    ds = [x for x, _ in ds_dau_hieu() if bc.DAU_HIEU[x]["nhom"] == dh["nhom"]]
    i = ds.index(ma)
    lien_quan = [{"loai": "dau_hieu", "slug": dict(ds_dau_hieu())[ds[j % len(ds)]]} for j in (i - 1, i + 1) if ds[j % len(ds)] != ma]
    return {
        "loai": "dau_hieu", "slug": slug,
        "tieu_de": _tieu_de(ten, tot),
        "mo_ta": t._cat(f"{ten}: {nguon_y} nói gì, nhìn theo đời sống hiện đại và việc nên làm theo 3 mức chi phí, bắt đầu "
                        "từ việc 0 đồng."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [kb["_nguon"]],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": list({x["slug"]: x for x in lien_quan}.values()),
        "lien_ket_ngoai": [{"duong": DUONG_CONG_CU, "ten": "Khảo sát nhà — tích dấu hiệu, xem việc nên làm cho đúng nhà bạn"},
                           {"duong": "/phong-thuy/huong-hop-tuoi", "ten": "Tuổi nào hợp hướng nào"}],
        "minh_hoa": {"kieu": "dau_hieu", "nhom": dh["nhom"], "phong": phong[:3], "veto": veto, "tot": tot, "ten": ten},
    }


TRANG = {"dau_hieu": (ds_dau_hieu, trang_dau_hieu)}
TEN_NGAN = {"dau_hieu": lambda ma: _kb()["bo_tri"][ma]["tieu_de"]}
