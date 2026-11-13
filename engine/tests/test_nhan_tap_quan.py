"""PT-NG5: hai nhãn tập quán ở Xem ngày tốt — ngày Tuế Phá, ngày Thụ Tử. Chỉ là NHÃN: không loại ngày, không đổi "ngày đẹp"."""
import datetime as dt

from app.calc import hoang_lich as hl
from app.luangiai import hoang_lich as rl

ZHI = "子丑寅卯辰巳午未申酉戌亥"


def test_thu_tu_bang_sau_duong_sau_am():
    # Hiệp Kỷ q.6: tháng Dần khởi ở Tuất; sáu tháng dương đi Tuất → Mão, sáu tháng âm đi Thìn → Dậu.
    mong = dict(zip("寅卯辰巳午未申酉戌亥子丑", "戌辰亥巳子午丑未寅申卯酉"))
    assert hl.THU_TU == mong
    assert [hl.THU_TU[c] for c in "寅辰午申戌子"] == list("戌亥子丑寅卯")
    assert [hl.THU_TU[c] for c in "卯巳未酉亥丑"] == list("辰巳午未申酉")


def test_nhan_tap_quan_tinh_tay():
    assert hl.nhan_tap_quan("子", "寅", "午") == ["tue_pha"]          # năm Ngọ, ngày Tý: xung Thái Tuế
    assert hl.nhan_tap_quan("戌", "寅", "卯") == ["thu_tu"]           # tháng Dần, ngày Tuất
    assert hl.nhan_tap_quan("戌", "寅", "辰") == ["tue_pha", "thu_tu"]
    assert hl.nhan_tap_quan("丑", "寅", "午") == []


def test_tan_suat_va_khong_doi_ket_qua_cu():
    d0, n, tp, tt = dt.date(2026, 1, 1), 730, 0, 0
    for i in range(n):
        c = hl.ngay(d0 + dt.timedelta(days=i))
        nh = c["nhan_tap_quan"]
        assert ("tue_pha" in nh) == ((ZHI.index(c["ngay_gz"][1]) - ZHI.index(c["nam_gz"][1])) % 12 == 6)
        assert ("thu_tu" in nh) == (c["ngay_gz"][1] == hl.THU_TU[c["thang_gz"][1]])
        assert not set(nh) & set(c["ky_dan_gian"])                     # nhãn riêng, không trộn vào danh sách kiêng
        tp += "tue_pha" in nh
        tt += "thu_tu" in nh
    assert 55 <= tp <= 66 and 55 <= tt <= 66                           # mỗi nhãn khoảng 1/12 số ngày


def test_trang_ngay_co_nhan_va_loi_trung_tinh():
    d = next(dt.date(2026, 3, 1) + dt.timedelta(days=i) for i in range(60)
             if "thu_tu" in hl.ngay(dt.date(2026, 3, 1) + dt.timedelta(days=i))["nhan_tap_quan"])
    kq = rl.ngay_xem(d)
    nh = {x["ma"]: x for x in kq["nhan_tap_quan"]}
    assert "thu_tu" in nh and nh["thu_tu"]["ten"] == "Thụ Tử"
    for x in kq["nhan_tap_quan"]:
        assert x["nghia"] and x["nguon"] and "không loại ngày" in x["luu_y"]
        assert not any(t in (x["nghia"] + x["luu_y"]).lower() for t in ("đại hung", "chết", "tai hoạ", "tuyệt đối"))
    assert rl.tom_tat(d)["nhan_tap_quan"] == [x["ten"] for x in kq["nhan_tap_quan"]]


def test_nhan_khong_lam_mat_ngay_dep():
    # Ngày "đẹp" (hoàng đạo + trực tốt + không kiêng dân gian) vẫn đẹp dù mang nhãn tập quán.
    co = 0
    for i in range(730):
        d = dt.date(2026, 1, 1) + dt.timedelta(days=i)
        c = hl.ngay(d)
        if c["nhan_tap_quan"] and c["hoang_dao"] and c["truc"] in rl.TRUC_TOT and not c["ky_dan_gian"] \
                and "馀事勿取" not in c["nghi"] and "诸事不宜" not in c["ky"]:
            assert rl.tom_tat(d)["dep"] is True
            co += 1
    assert co > 0


# --------------------------------------------------------------------------- PT-NG5: tri thức cổ thư ra bài đọc
def test_nha_cua_ban_co_cau_sach_xua_o_vi_sao_noi_vay():
    from app.kb import phongthuy_kb as kbp
    from app.luangiai import phongthuy_doi_song as ds
    import json
    from pathlib import Path
    bc = ds.luan_giai({"nam": 1990, "gioi_tinh": "nam"}, {"huong": "Nam"})
    nguon = json.loads((Path(__file__).parent.parent / "fixtures/nguon/phongthuy_co_thu.json").read_text("utf-8"))
    tat = "".join("".join(v["cau"]) for v in nguon["doan"].values())
    so = 0
    for c in bc["chuong"][:4]:
        dong = [x for x in c.get("can_cu", []) if x.startswith("Sách xưa — ")]
        assert len(dong) == 1, c["ma"]
        nv = dong[0].split("«")[1].split("»")[0]
        assert all(p.strip() in tat for p in nv.split("…"))            # nguyên văn có trong kho nguồn
        so += 1
    assert so == 4 and len(kbp.sach_xua("bat_trach", 2)) == 2


def test_tarot_ba_la_cung_so_va_da_so():
    from app.luangiai import tarot
    def tq(ds):
        r = tarot.bao_cao("ba_la_thoi_gian", [{"id": i, "nguoc": False} for i in ds])
        return next(c for c in r["chuong"] if c["ma"] == "tong_quan")["hop"]
    h = tq(["gay_7", "coc_7", "kiem_7"])
    lap = [x for x in h if ".lap_la." in (x.get("ma_mau") or "")]
    assert len(lap) == 1 and lap[0]["tieu_de"] == "Ba lá 7" and "Treaties and compacts." in lap[0]["can_cu"][0]
    assert not [x for x in tq(["gay_7", "coc_7", "kiem_2"]) if ".lap_la." in (x.get("ma_mau") or "")]
    troi = next(x for x in tq(["gay_7", "gay_2", "gay_10"]) if ".nguyen_to." in (x.get("ma_mau") or ""))
    assert any("A Majority of Wands" in x for x in troi["can_cu"])
