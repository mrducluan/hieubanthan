"""KT-TT đợt 2 — tri thức mới phải truy được về nguồn và không làm lệch phần đang chạy.

- Kinh Dịch: bản dịch Ngô Tất Tố ghép đúng hào; loại tượng tám quái trích đúng Thuyết Quái.
- Bát tự: bảng điều hậu khớp nguyên văn Cùng Thông Bảo Giám từng ô; kho nguồn Tử Bình Chân Thuyên đủ 47 thiên.
- Tử vi: MỌI sao engine an được đều có nghĩa trong KB; kho nguồn Toàn Thư đủ phần.
"""
import json
import re
from pathlib import Path

from app import ngon_ngu
from app.hoidap import tuvi as hoi_tuvi
from app.kb import battu_kb, kinhdich_kb, trang, tuvi_kb

GOC = Path(__file__).resolve().parents[1]
doc = lambda p: json.loads((GOC / p).read_text(encoding="utf-8"))
CAN = dict(zip(["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"], "甲乙丙丁戊己庚辛壬癸"))
_SO_HAO = {"đầu": 1, "hai": 2, "ba": 3, "tư": 4, "bốn": 4, "năm": 5, "trên": 6}


# ----------------------------------------------------------------------------- Kinh Dịch
def test_ngo_tat_to_ghep_dung_hao_va_du_do_phu():
    kb = doc("app/kb/data/kinhdich_truyen_nghia.json")["que"]
    assert len(kb) == 64
    co_dich = co_trinh = co_tt = 0
    for q, v in kb.items():
        for h, x in (v.get("hao") or {}).items():
            d = (x.get("tu") or {}).get("dich", "")
            m = re.match(r"\s*Hào\s+(?:Chín|Sáu)\s+(Đầu|Hai|Ba|Tư|Bốn|Năm|Trên)\b", d, flags=re.I)
            if m:      # câu dịch tự nói vị trí hào → phải đúng hào đang gắn
                assert _SO_HAO[m.group(1).lower()] == int(h), (q, h, d[:40])
            co_dich += bool(d)
            co_trinh += bool((x.get("tu") or {}).get("trinh"))
            co_tt += bool((x.get("tieu_tuong") or {}).get("dich"))
    assert co_dich >= 360 and co_trinh >= 360 and co_tt >= 360, (co_dich, co_trinh, co_tt)
    assert sum(bool((v.get("dai_tuong") or {}).get("dich")) for v in kb.values()) == 64


def test_truyen_nghia_chi_o_ban_viet_va_trich_tron_cau():
    tn = kinhdich_kb.truyen_nghia(10, "hao", 3)
    assert tn and tn["nguoi_dich"] == "Ngô Tất Tố" and tn["tieu_tuong"]["han"] and len(tn["trinh"]) <= 420
    assert tn["trinh"].rstrip()[-1] in ".!?…”\""
    with ngon_ngu.dung("en"):
        assert kinhdich_kb.truyen_nghia(10, "hao", 3) is None and kinhdich_kb.loai_tuong("Càn") is None


def test_loai_tuong_tam_quai_trich_dung_thuyet_quai():
    nguon = "".join(d["kinh"] for d in doc("fixtures/nguon/chu_dich_truyen_nghia.json")["thien"]["thuyet_quai"])
    bq = doc("app/kb/data/kinhdich_kb.json")["bat_quai"]
    assert len(bq) == 8
    for ten, v in bq.items():
        lt = v["loai_tuong"]
        assert lt["trich"] and all(t in nguon for t in lt["trich"]), ten
        assert len(lt["vat"]) >= 8 and kinhdich_kb.loai_tuong(ten).startswith("Theo Thuyết Quái")


def test_trang_que_co_tieu_tuong_va_loi_trinh_chu():
    t = trang.lay("que", "que-10-ly")
    td = [m["tieu_de"] for m in t["muc"]]
    assert any("Tiểu tượng" in x for x in td) and any("Trình Di" in x for x in td)


# ----------------------------------------------------------------------------- Bát tự
def test_dieu_hau_khop_nguyen_van_tung_o():
    kb = doc("app/kb/data/battu_dieu_hau.json")
    fx = doc("fixtures/nguon/cung_thong_bao_giam.json")["o"]
    assert kb["can_doi_chieu"] is False
    n = 0
    for can, hang in kb["bang"].items():
        assert len(hang) == 12
        for chi, ds in hang.items():
            o = fx[can][chi]
            cau = kb["trich"][can][chi]
            assert cau == o["trich"] and len(cau) >= 8
            assert ds[:len(o["can_trong_cau"])] == o["can_trong_cau"], (can, chi)      # thứ tự theo đúng câu sách
            assert any(CAN[c] in cau for c in o["can_trong_cau"]), (can, chi)            # câu trích nêu can ấy (5 ô câu trích chỉ nêu can đầu)
            assert len(ds) == len(set(ds)) and 1 <= len(ds) <= 5
            n += 1
    assert n == 120
    assert battu_kb.dieu_hau("Giáp", "Mùi")["can"][:2] == ["Đinh", "Canh"]               # «先丁后庚»


def test_kho_nguon_tu_binh_chan_thuyen_du_47_thien():
    d = doc("fixtures/nguon/tu_binh_chan_thuyen.json")["thien"]
    assert [t["so"] for t in d] == list(range(1, 48))
    assert d[7]["ten"] == "论用神" and "八字用神，专求月令" in d[7]["van"]
    assert all(len(t["van"]) > 100 for t in d)


# ----------------------------------------------------------------------------- Tử vi
def test_moi_sao_engine_an_duoc_deu_co_nghia():
    g = doc("fixtures/golden/iztro_ten_vi.json")
    ten = []
    for k in ("phu_tinh", "tap_dieu", "truong_sinh", "bac_si", "tuong_tien", "tue_tien"):
        ten += list(g[k].values()) if isinstance(g[k], dict) else list(g[k])
    from app.calc import tuvi_thai_tue_vn
    thieu = [t for t in dict.fromkeys(ten + tuvi_thai_tue_vn.VIET) if not (tuvi_kb.phu_tinh(t) or tuvi_kb.sao_nho(t))]
    assert not thieu, thieu


def test_sao_nho_co_nguon_va_loi_khong_phan():
    kb = doc("app/kb/data/tuvi_kb.json")
    cam = re.compile(r"chết|yểu|tù tội|tai hoạ|tai họa|dâm|hung tinh|bệnh tật|sẽ bị|chắc chắn", re.I)
    for ten, m in kb["sao_nho"].items():
        assert m["source_id"] in kb["sao_nho_nguon"] and m["school_id"] and m["do_tin"] in ("truyen_thong_viet", "hien_dai"), ten
        assert 30 <= len(m["y_nghia"]) <= 260 and not cam.search(m["y_nghia"]), ten
        if re.search(r"sức khoẻ|giữ sức|sức yếu|mệt", m["y_nghia"]):
            assert "không thay lời bác sĩ" in m["y_nghia"], ten
    assert not set(kb["sao_nho"]) & set(kb["phu_tinh"])          # không trùng mục phụ tinh đang dùng để nhận tên sao


def test_hoi_dap_nhan_sao_nho_ma_khong_nham_chu_thuong():
    assert hoi_tuvi.phan_loai("Sao Tấu Thư là gì?")["loai"] == "phu_tinh"
    assert hoi_tuvi.phan_loai("Lâm Quan là gì")["phu"] == ["Lâm Quan"]
    assert hoi_tuvi.phan_loai("tôi muốn làm quan thì là gì").get("phu") in ([], None)
    assert hoi_tuvi.phan_loai("vào quân đội nghĩa là gì với lá số tôi").get("phu") in ([], None)
    assert "Tử" not in tuvi_kb.ten_phu_tinh() and "Mộ" not in tuvi_kb.ten_phu_tinh()


def test_kho_nguon_toan_thu_du_phan():
    d = doc("fixtures/nguon/tu_vi_dau_so_toan_thu.json")
    assert len(d["quyen_1"]) == 56 and len(d["quyen_3"]) == 20 and len(d["an_sao"]) >= 40 and len(d["muoi_hai_cung"]) >= 240
    assert any(x["thien"] == "太微賦" for x in d["quyen_1"])
    assert {x["cung"] for x in d["muoi_hai_cung"]} >= {"命宫", "财帛", "官禄", "疾厄"}


def test_kho_nguon_uyen_hai_tu_binh():
    d = doc("fixtures/nguon/uyen_hai_tu_binh.json")
    t = d["thien"]
    assert d["can_doi_chieu"] is True and len(t) >= 180
    ten = {x["ten"] for x in t}
    assert {"论日为主", "论月令", "喜忌篇", "四言独步", "五言独步", "珞琭子消息赋", "论伤官", "论阳刃"} <= ten
    assert sum(1 for x in t if x.get("thuoc") == "干支体象") == 22          # 10 can + 12 chi
    assert all(x["van"] or x["ten"] in ("干支体象", "群兴论") for x in t)


def test_co_tho_nhat_chu_khop_nguyen_van_uyen_hai():
    from app.kb import battu_kb, trang
    van = {v for x in doc("fixtures/nguon/uyen_hai_tu_binh.json")["thien"] if x.get("thuoc") == "干支体象" for v in x["van"]}
    han = dict(zip(["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"], "甲乙丙丁戊己庚辛壬癸"))
    for can, h in han.items():
        ct = battu_kb.co_tho(can)
        assert ct["han"] in van and ct["han"].startswith(h), can
        assert 80 <= len(ct["y"]) <= 420 and not any(c in ct["y"] for c in ("chết", "hoạ", "tai ương", "yểu")), can
    tr = trang.lay("nhat_chu", "nhat-chu-giap")
    assert any("Uyên Hải" in m["tieu_de"] and "甲木天干作首排" in m["danh_sach"][0] for m in tr["muc"])


def test_q5_hy_ky_cach_cuc_khop_luan_dung_than():
    """Q5: bảng hỷ / kỵ (dụng thần cách 2) khớp câu nguyên văn thiên «Luận dụng thần» — câu trích phải có trong kho nguồn."""
    from app.kb import battu_doi_song_kb as dk
    van = "".join(x["van"] for x in doc("fixtures/nguon/tu_binh_chan_thuyen.json")["thien"])
    for cau in ("七煞喜食神以制伏，忌财印以资扶", "七煞逢财无制，七煞格败也", "印喜官煞以相生，劫才以护印",
                "食喜身旺以相生，生财以护食", "伤官喜佩印以制伏，生财以化伤"):
        assert cau in van, cau
    sat = dk.cach("that_sat")
    assert sat["hy"] == ["Thực Thương"] and sat["ky"] == ["Tài"] and sat["than_nhuoc"] == {"hy": ["Ấn"], "ky": ["Tài"]}
    for ma in ("chinh_an", "thien_an"):
        assert dk.cach(ma)["hy"] == ["Quan Sát", "Tỷ Kiếp"] and dk.cach(ma)["ky"] == ["Tài"]
    assert dk.cach("thuc_than")["than_nhuoc"]["hy"] == ["Tỷ Kiếp"] and dk.cach("thuong_quan")["than_nhuoc"]["hy"] == ["Ấn"]


def test_co_van_thap_than_khop_nguyen_van_uyen_hai():
    van = "\n".join(v for x in doc("fixtures/nguon/uyen_hai_tu_binh.json")["thien"] for v in x["van"])
    kbd = doc("app/kb/data/battu_kb.json")
    cv = kbd["co_van_thap_than"]
    assert set(cv) == set(kbd["thap_than"])
    for ten, o in cv.items():
        assert o["han"] and all(h in van for h in o["han"]), ten
        assert 100 <= len(o["y"]) <= 420, ten
        assert not any(c in o["y"].lower() for c in ("chết", "khắc vợ", "khắc chồng", "yểu", "tai hoạ", "hoạ")), ten
    with ngon_ngu.dung("en"):
        en = trang.lay("thap_than", trang._ds_thap_than()[0][1])
    assert any("Yuan Hai Zi Ping" in m["tieu_de"] for m in en["muc"])


def test_phu_tinh_cung_khop_nguyen_van_toan_thu():
    """KT-TT3: 52 mục phụ tinh × cung — nguyên văn là đoạn của kho nguồn; chỉ 6 cung về việc và nếp sống."""
    van = {x["van"] for x in doc("fixtures/nguon/tu_vi_dau_so_toan_thu.json")["muoi_hai_cung"]}
    ptc = doc("app/kb/data/tuvi_kb.json")["phu_tinh_cung"]
    cung = {c for ds in ptc.values() for c in ds}
    assert cung == {"Tài Bạch", "Quan Lộc", "Thiên Di", "Phúc Đức", "Điền Trạch", "Nô Bộc"}
    assert sum(len(ds) for ds in ptc.values()) >= 50 and set(ptc) <= set(tuvi_kb.ten_phu_tinh())
    cam = ("chết", "yểu", "khắc", "hoạ", "phá sản", "tù", "nghèo hèn", "hạ tiện", "bỏ tổ", "trộm")
    for sao, ds in ptc.items():
        for c, m in ds.items():
            assert m["trich"] in van, (sao, c)
            assert 40 <= len(m["y"]) <= 330 and not any(x in m["y"].lower() for x in cam), (sao, c, m["y"])
    assert tuvi_kb.phu_tinh_cung("Kình Dương", "Tài Bạch")["y"] and tuvi_kb.phu_tinh_cung("Kình Dương", "Phu Thê") is None


def test_cach_cuc_sach_ghi_khop_dinh_cuc_toan_thu():
    """KT-TT7 — `sach_ghi.han` của cách cục Tử vi là nguyên văn một dòng trong «定富局 / 定贵局» (Toàn Thư quyển 1)."""
    import json
    from pathlib import Path
    goc = Path(__file__).parent.parent
    nguon = json.loads((goc / "fixtures/nguon/tu_vi_dau_so_toan_thu.json").read_text("utf-8"))
    van = "\n".join(t["van"] for t in nguon["quyen_1"] if t["thien"] in ("定富局", "定贵局", "定贫贱局", "定杂局"))
    cach = json.loads((goc / "app/kb/data/tuvi_cach_cuc.json").read_text("utf-8"))["cach"]
    co = {k: c["sach_ghi"] for k, c in cach.items() if c.get("sach_ghi")}
    assert len(co) >= 6
    for k, g in co.items():
        assert g["han"] in van and g["y"] and "sẽ" not in g["y"], k
    # ba cách điều kiện hệ thống đang khác sách — ghi cờ, CHƯA đổi phép nhận diện (đổi = đổi kết quả lá số)
    # KT-TT8: Quân thần khánh hội + Nguyệt sinh thương hải đã theo sách; hai cách còn lại giữ cách hiểu phổ biến
    assert {k for k, g in co.items() if g.get("khac_dieu_kien")} == {"ma_dau_doi_kiem", "loc_ma_boi_an"}


def test_tu_quai_tren_trang_que_la_nguyen_van():
    """KT-N1 — 64 trang quẻ: câu Tự Quái trích kèm phải là chuỗi con nguyên văn kho nguồn Truyện Nghĩa (bỏ dấu câu)."""
    import json as _j
    import re as _re
    from pathlib import Path as _P
    goc = _P(__file__).resolve().parent.parent
    src = _j.loads((goc / "fixtures" / "nguon" / "chu_dich_truyen_nghia.json").read_text("utf-8"))
    van = "".join(x["kinh"] for x in src["thien"]["tu_quai"])
    trang = _j.loads((goc / "app" / "kb" / "data" / "bo_sung_que.json").read_text("utf-8"))["trang"]
    co = 0
    for k, pg in trang.items():
        for t in pg.get("trich_dan", []):
            if t.get("chuong") == "Tự quái truyện":
                assert t.get("nguyen_van"), k
                assert _re.sub(r"[，。\s]", "", t["nguyen_van"]) in van, k
                co += 1
    assert co == 64
