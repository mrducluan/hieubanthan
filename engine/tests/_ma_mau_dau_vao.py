# -*- coding: utf-8 -*-
"""EN-6 — đầu vào CỐ ĐỊNH để chụp toàn bộ mã kiểm chứng (`ma_mau`) mà báo cáo đời sống của 6 mảng sinh ra.

Dùng chung cho `scripts/sinh_ma_mau_golden.py` (ghi fixtures/golden/ma_mau_doi_song.json) và
`tests/test_ma_mau_golden.py` (so). Mã kiểm chứng là KHOÁ phiếu "Đúng với mình" của người dùng (bảng kiem_chung_phieu):
đổi mã = phiếu cũ không còn gắn vào hộp nào. Muốn gom khuôn / sửa lời mà giữ mã → test này phải xanh; cố ý đổi mã →
sinh lại golden VÀ ghi rõ trong PR."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app.hoidap import kinhdich as kd
from app.luangiai import ban_do_con_so, chan_dung_tong_hop, giao_thoa, nhan_tuong, phongthuy_doi_song, tarot, thoi_gian_toi, toan_bo

GOLDEN = Path(__file__).resolve().parents[1] / "fixtures" / "golden"
XEM = dt.date(2026, 11, 2)


def _ma(x, ra: set[str]) -> set[str]:
    if isinstance(x, dict):
        m = x.get("ma_mau")
        if isinstance(m, str) and m:
            ra.add(m)
        for v in x.values():
            _ma(v, ra)
    elif isinstance(x, list):
        for v in x:
            _ma(v, ra)
    return ra


def chup() -> dict[str, list[str]]:
    ra: dict[str, set[str]] = {k: set() for k in ("tuvi", "battu", "thanso", "phongthuy", "kinhdich", "thoi_gian", "nhantuong", "chan_dung", "tarot", "giao_thoa")}
    la60 = json.loads((GOLDEN / "lasotuvi_60.json").read_text(encoding="utf-8"))
    la60 = la60.get("cases", la60) if isinstance(la60, dict) else la60
    for i, ca in enumerate(la60[:12]):
        sinh = {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"],
                "tinh_trang": ("doc_than", "co_doi", None)[i % 3]}
        _ma(toan_bo.tuvi(sinh, ngay_xem=XEM), ra["tuvi"])
    gbt = json.loads((GOLDEN / "battu_doi_song.json").read_text(encoding="utf-8"))["cases"]
    for i, ca in enumerate(gbt):
        sinh = {"lich": dt.datetime.fromisoformat(ca["lich"]), "gioi_tinh": ca["gioi_tinh"],
                "gio_ty": ca.get("gio_ty", "da_ty"), "tinh_trang": ("co_doi", None, "doc_than")[i % 3]}
        _ma(toan_bo.battu(sinh, ngay_xem=XEM), ra["battu"])
    for y, m, d in ((1988, 10, 24), (1975, 3, 9), (2001, 12, 31), (1960, 7, 7), (1993, 2, 28)):
        _ma(ban_do_con_so.bao_cao(["Nguyễn Đức Luân"], d, m, y, XEM, "tung_phan"), ra["thanso"])
    for nam, gt, do in ((1990, "nam", 180), (1985, "nu", 45), (1972, "nam", 300)):
        _ma(phongthuy_doi_song.luan_giai({"nam": nam, "gioi_tinh": gt, "ngay": dt.date(nam, 5, 17), "moc_nam": "lap_xuan"},
                                        {"huong_do": do, "nam_xay": 2008}, ngay_xem=XEM), ra["phongthuy"])
    for hao in ([7, 7, 8, 7, 7, 9], [6, 8, 7, 8, 8, 7], [9, 9, 9, 7, 7, 7]):
        out = kd.tra_loi("Tôi có nên chuyển việc sang công ty mới không?", "tu_dong", gia_tri_hao=hao,
                         thoi_diem=dt.datetime(2026, 11, 2, 10))
        _ma(out.get("doc_que"), ra["kinhdich"])
    for ns, tv, bt in ((dt.date(1990, 5, 17), {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"},
                        {"lich": dt.datetime(1990, 5, 17, 12), "gioi_tinh": "nu", "gio_ty": "da_ty"}),
                       (dt.date(1984, 1, 30), None, None)):
        _ma(thoi_gian_toi.lap(ns, XEM, 2027, "nu", tv, bt), ra["thoi_gian"])
    # NT-1: Nhân tướng học — ba bộ trả lời cố định (đủ, nửa, trống) × năm sinh / giới tính.
    from tests.test_nhan_tuong import TL_DAY  # noqa: PLC0415
    nua = {k: v for i, (k, v) in enumerate(TL_DAY.items()) if i % 2 == 0}
    nghich = {"khuon_mat": "tren_hep_duoi_rong", "tam_dinh": "cam_ngan", "sac_tong": "do_ung", "cot_nhuc": "tro_xuong", "tran": "hep_thap",
              "nep_tran": "nhieu_dut", "long_may": "roi_nguoc", "an_duong": "nep_doc", "mat_than": "sac_gat", "tam_bach": "duoi", "le_duong": "bong",
              "son_can": "thap_gay", "chuan_dau": "nhon_mong", "canh_mui": "mong_lo", "luong_quyen": "cao_tro", "phap_lenh": "cham_mep", "mieng": "khoe_cup",
              "cam": "nhon_lem", "tai": "dai_nep", "giong": "cao_nhanh", "net_mat": "buon_met", "dang": "nhanh_hap_tap", "nhan_trung": "nong_phang"}
    for tl, ns, gt in ((TL_DAY, 1988, "nam"), (nua, 1975, "nu"), ({}, None, None), (nghich, 2001, "nu")):
        _ma(nhan_tuong.bao_cao(tl, nam_sinh=ns, gioi_tinh=gt, ngay_xem=XEM,
                               battu={"cach_1": {"hanh": ["Hỏa", "Thổ"]}, "cach_2": {"hanh": ["Kim"]}} if ns else None), ra["nhantuong"])
    # CD-1: Chân dung tổng hợp — ba lá + bộ trả lời Nhân tướng đủ / trống (hộp mượn giữ mã gốc, chỉ mã ds.chan_dung.* là mới).
    for (ngay, ti, gt, gio), tl in (((dt.date(1988, 10, 24), 4, "nam", 8), TL_DAY), ((dt.date(1975, 3, 9), 11, "nu", 22), nua),
                                     ((dt.date(2001, 12, 31), 0, "nam", 0), {})):
        tv = {"ngay": ngay, "ti": ti, "gioi_tinh": gt}
        bt = {"lich": dt.datetime.combine(ngay, dt.time(gio, 30)), "gioi_tinh": gt, "gio_ty": "da_ty"}
        _ma(chan_dung_tong_hop.lap(tv, bt, tl, XEM), ra["chan_dung"])
    # Ý2: chương "Điều bạn đã xác nhận" từ phiếu của chính người xem (mã giao thoa, phái giao_thoa_1) — chụp một bộ phiếu cố định.
    PHIEU = {"ds.su_nghiep.thien_co.sang.thuan": "dung", "ds.bt.su_nghiep.chinh_quan.thuan.hien_tai": "dung",
             "ds.bt.tien_bac.chinh_tai.can_chu_dong.hien_tai": "dung", "ds.tien_bac.vu_khuc.can_chu_dong": "dung",
             "ds.tinh_cam.tham_lang.can_bang": "dung", "ds.bt.tinh_cam.thuc_than.can_bang.hien_tai": "chua_dung"}
    _ma(chan_dung_tong_hop.lap({"ngay": dt.date(1988, 10, 24), "ti": 4, "gioi_tinh": "nam"},
                               {"lich": dt.datetime(1988, 10, 24, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}, TL_DAY, XEM, ca_nhan=PHIEU), ra["chan_dung"])
    # TR-1: Tarot — ba trải bài cố định (Celtic 10 lá, 3 lá, 1 lá) × có / không khảo sát Nhân tướng.
    from tests.test_tarot import BA_LA, CELTIC  # noqa: PLC0415
    _ma(tarot.bao_cao("celtic", CELTIC, chu_de="cong_viec", ngay_xem=XEM, nam_sinh=1988, gioi_tinh="nam", tra_loi_nhan_tuong=TL_DAY), ra["tarot"])
    _ma(tarot.bao_cao("ba_la_thoi_gian", BA_LA, ngay_xem=XEM), ra["tarot"])
    _ma(tarot.bao_cao("mot_la", [{"id": "dai_13"}], chu_de="tinh_cam", ngay_xem=XEM), ra["tarot"])
    _ma(tarot.bao_cao("nam_la", [{"id": "gay_2", "nguoc": True}, {"id": "gay_5"}, {"id": "dai_19"}, {"id": "coc_2"}, {"id": "tien_4"}], chu_de="tien_bac", ngay_xem=XEM), ra["tarot"])
    # HTT-1: Điểm giao thoa — mã dựng từ mảng × môn × mức (không phụ thuộc lá số); chụp đủ ba luật A/B/C trên mọi mảng, mọi mức.
    # Tiền tố môn → chương CÓ THẬT của môn đó cho mảng (Kinh Dịch / Tarot mọi chương về "câu hỏi", Thời gian tới về "năm nay").
    TT = ["", "bt.", "nhantuong.", "chan_dung.", "thanso.", "tarot.", "phongthuy.", "kinhdich.", "tgt."]
    CH = {"": "{c}", "bt.": "{c}", "nhantuong.": "{c}", "chan_dung.": "{c}", "thanso.": "{c}", "tarot.": "tra_loi", "phongthuy.": "{c}",
          "kinhdich.": "chuyen_viec", "tgt.": "thang"}
    for chuong in ("su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe", "nam_nay", "tong_quan", "quan_he", "nha_cua", "cuoc_doi", "tra_loi"):
        for muc in ("thuan", "can_bang", "can_chu_dong", "x"):
            for n in range(2, len(TT) + 1):
                _ma(giao_thoa.lap([{"ma": f"ds.{t}{CH[t].format(c=chuong)}.k.{muc}", "ket_qua": "dung"} for t in TT[:n]]), ra["giao_thoa"])
            _ma(giao_thoa.lap([{"ma": f"ds.{chuong}.a.{muc}", "ket_qua": "dung"}, {"ma": f"ds.bt.{chuong}.b.{muc}", "ket_qua": "chua_dung"},
                               {"ma": "ds.su_nghiep.c.thuan", "ket_qua": "dung"}]), ra["giao_thoa"])
    # Luật B: mỗi môn, 2..11 mảng cùng mức thuận / cần chủ động.
    chuongs = ["su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe", "nam_nay", "tong_quan", "quan_he", "nha_cua", "cuoc_doi", "tra_loi"]
    for tt in TT:
        for muc in ("thuan", "can_chu_dong"):
            for n in range(2, len(chuongs) + 1):
                _ma(giao_thoa.lap([{"ma": f"ds.{tt}{c}.k.{muc}", "ket_qua": "dung"} for c in chuongs[:n]]), ra["giao_thoa"])
    return {k: sorted(v) for k, v in ra.items()}
