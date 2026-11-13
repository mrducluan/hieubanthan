# PT-NG1 — đối chiếu Phong thuỷ / Huyền Không với NGUYÊN VĂN cổ thư bản Văn Uyên Các Tứ khố toàn thư
# (bản số hoá kanripo, dựng bằng scripts/nap_nguon_phongthuy.py → fixtures/nguon/phongthuy_co_thu.json).
#   · Mọi câu trích trong KB (`phongthuy_kb.co_thu`) phải là chuỗi con đúng từng chữ của nguồn.
#   · Các bảng engine đang dùng (du niên Bát trạch, cung phi nam nữ, 24 sơn, tử bạch năm – tháng, Tam sát,
#     nửa bảng thế tinh) phải khớp quy tắc ghi trong Hiệp Kỷ Biện Phương Thư / Thanh Nang Áo Ngữ.
import json, re
from pathlib import Path

import pytest

from app.calc import huyen_khong as hk, phongthuy as pt, tuoi_dan_gian as tdg
from app.kb import phongthuy_kb as kb

GOC = Path(__file__).resolve().parents[1]
NGUON = json.loads((GOC / "fixtures" / "nguon" / "phongthuy_co_thu.json").read_text(encoding="utf-8"))
DOAN = NGUON["doan"]
KB = json.loads((GOC / "app" / "kb" / "data" / "phongthuy_kb.json").read_text(encoding="utf-8"))
HK = json.loads((GOC / "app" / "kb" / "data" / "phongthuy_huyen_khong.json").read_text(encoding="utf-8"))

QUAI = {"乾": "Càn", "兌": "Đoài", "離": "Ly", "震": "Chấn", "巽": "Tốn", "坎": "Khảm", "艮": "Cấn", "坤": "Khôn"}
PHUONG = {q: v[1] for q, v in pt.QUAI.items()}
SON = {"子": "Tý", "丑": "Sửu", "寅": "Dần", "卯": "Mão", "辰": "Thìn", "巳": "Tỵ", "午": "Ngọ", "未": "Mùi", "申": "Thân",
       "酉": "Dậu", "戌": "Tuất", "亥": "Hợi", "甲": "Giáp", "乙": "Ất", "丙": "Bính", "丁": "Đinh", "庚": "Canh", "辛": "Tân",
       "壬": "Nhâm", "癸": "Quý", "㢲": "Tốn", **QUAI}


def _cau(ma: str) -> str:
    return "".join(DOAN[ma]["cau"])


def test_fixture_co_du_sach_va_doan():
    assert set(NGUON["sach"]) == {"tang_thu", "trach_kinh", "thanh_nang_ao_ngu", "thanh_nang_tu", "thien_ngoc_kinh", "hiep_ky"}
    assert len(DOAN) >= 27 and all(d["sach"] in NGUON["sach"] and d["cau"] for d in DOAN.values())


# ───────── KB: câu trích là nguyên văn ─────────
@pytest.mark.parametrize("ma", sorted(KB["co_thu"]))
def test_moi_trich_kb_la_nguyen_van(ma):
    m = KB["co_thu"][ma]
    d = DOAN[m["doan"]]
    assert m["sach"] == d["sach"]
    for c in m["nguyen_van"].split(" … "):
        assert c in d["cau"], (ma, c[:20])
    assert m["nghia"].strip() and m["mang"] in ("loan_dau", "duong_trach", "bat_trach", "huyen_khong", "lich_nam")
    assert "phien_am" in m


def test_kb_ghi_ro_doi_chieu_va_khong_nhan_nguon_chua_doc():
    dc = KB["doi_chieu"]
    assert set(dc["da_doi_chieu"]) == set(NGUON["sach"])
    # Dương Trạch Tam Yếu, Bát Trạch Minh Kính, Thẩm Thị Huyền Không Học chưa có nguyên văn → phải nằm ở danh sách chờ.
    assert {"duong_trach_tam_yeu", "bat_trach_minh_kinh", "tham_thi_huyen_khong_hoc"} <= set(dc["chua_doi_chieu"])
    assert HK["doi_chieu"]["the_quai"]["khop_thanh_nang_ao_ngu"] == 12


def test_loi_kb_co_thu_khong_doa_khong_vat_pham():
    cam = [c.lower() for c in json.loads((GOC / "app" / "kb" / "data" / "phongthuy_doi_song.json").read_text(encoding="utf-8"))["cum_cam"]]
    for ma, m in KB["co_thu"].items():
        chu = " ".join([m["nghia"], m.get("doi_song", "")]).lower()
        assert not [c for c in cam if re.search(rf"(?<!\w){re.escape(c)}(?!\w)", chu)], ma


# ───────── Bát trạch: đại du niên (Hiệp Kỷ) ─────────
def test_du_nien_cung_can_khop_hiep_ky():
    """「乾上爻變為兌為貪狼，兌中爻變為震為五鬼，震下爻變為坤為武曲，坤中爻變為坎為文曲，坎上爻變為巽為禄存，
    巽中爻變為艮為巨門，艮下爻變為離為破軍」 + bảng tên: 貪狼=生氣, 廉貞=五鬼, 武曲=延年, 文曲=六煞, 禄存=禍害, 巨門=天醫, 破軍=絶命."""
    s = _cau("hiep_ky.dai_du_nien_thu_tu")
    sao = {"貪狼": "Sinh Khí", "五鬼": "Ngũ Quỷ", "武曲": "Diên Niên", "文曲": "Lục Sát", "禄存": "Hoạ Hại", "巨門": "Thiên Y", "破軍": "Tuyệt Mệnh"}
    cap = re.findall(r"變為(.)為(貪狼|五鬼|武曲|文曲|禄存|巨門|破軍)", s)
    assert len(cap) == 7
    bang = pt.bang_huong("Càn")
    for q, ten in cap:
        assert bang[PHUONG[QUAI[q]]] == sao[ten], (q, ten)
    assert bang["Tây Bắc"] == "Phục Vị"
    ten = _cau("hiep_ky.dai_du_nien_ten")
    for han in ("亦曰生氣", "亦曰五鬼", "又曰延年", "又曰六煞", "又曰禍害", "亦曰天醫"):
        assert han in ten


def test_du_nien_ca_tam_quai_khop_phep_phien_quai():
    """上一爻變 = Sinh Khí; 下二爻變 = Thiên Y; 三爻俱變 = Diên Niên — các cặp quẻ ghi trong nguyên văn."""
    s = DOAN["hiep_ky.phien_quai"]["cau"][1]
    khoi = re.split(r"上一爻變者則|下二爻變者則|三爻俱變者則|三爻俱不變者則", s)[1:4]
    for doan, ten in zip(khoi, ("Sinh Khí", "Thiên Y", "Diên Niên")):
        cap = re.findall(r"(.)(.)互變", doan)
        assert len(cap) == 4, ten
        for a, b in cap:
            assert pt.bang_huong(QUAI[a])[PHUONG[QUAI[b]]] == ten, (a, b, ten)
            assert pt.bang_huong(QUAI[b])[PHUONG[QUAI[a]]] == ten, (b, a, ten)


def test_dong_tay_tu_trach_khop_hiep_ky():
    s = _cau("hiep_ky.dong_tay_tu_trach")
    assert "乾兌為老陽艮坤為老隂" in s and "二老相配為西四宅" in s and "二少相配為東四宅" in s
    assert pt.DONG_TU == {"Ly", "Chấn", "Tốn", "Khảm"}
    for q in ("Càn", "Đoài", "Cấn", "Khôn"):
        assert pt.nhom(q).startswith("Tây")


def test_cung_phi_nam_nu_khop_tam_nguyen():
    """男命上元甲子起坎一，中元起巽四，下元起兑七，逆行；女命上元起中五，中元起坤二，下元起艮八，順行."""
    assert "男命上元甲子起坎一中元甲子起巽四下元甲子起兑七逆行九宫" in _cau("hiep_ky.menh_cung_nam_nu")
    for nam, so_nam, so_nu in ((1864, 1, 5), (1924, 4, 2), (1984, 7, 8)):
        assert pt.menh_quai(nam, "nam")["so"] in (so_nam, 2 if so_nam == 5 else so_nam)
        nu = pt.menh_quai(nam, "nu")
        assert nu["so"] == so_nu or (so_nu == 5 and nu["quai"] == "Cấn")       # nữ 5 ký Cấn (quy ước phổ biến, không có trong đoạn này)
    # nam lùi, nữ tiến mỗi năm
    assert [pt.menh_quai(1984 + i, "nam")["so"] for i in range(3)] == [7, 6, 2]   # 7 → 6 → 5 (nam 5 ký Khôn = 2)
    assert [pt.menh_quai(1984 + i, "nu")["so"] for i in range(3)] == [8, 9, 1]


# ───────── 24 sơn, tử bạch, Tam sát ─────────
def test_24_son_thuoc_8_quai_khop_hiep_ky():
    s = _cau("hiep_ky.hai_muoi_bon_son")
    cum = re.findall(r"(.)(.)(.)屬(.)", s)
    assert len(cum) == 8
    for a, b, c, q in cum:
        assert {SON[a], SON[b], SON[c]} == {t for t, _ in hk.QUAI[QUAI[q]][2]}, q


def test_tu_bach_nam_khop_hiep_ky():
    """上元甲子一白入中宫，乙丑九紫，丙寅八白 …；中元甲子四緑，下元甲子七赤."""
    assert "上元甲子一白入中宫乙丑九紫丙寅八白" in _cau("hiep_ky.tu_bach_nam")
    assert [hk.luu_nien(1864 + i)["tam"] for i in range(10)] == [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]
    assert hk.luu_nien(1924)["tam"] == 4 and hk.luu_nien(1984)["tam"] == 7


def test_tu_bach_thang_khop_hiep_ky():
    """子午卯酉年正月起八白，辰戌丑未年正月起五黄，寅申巳亥年正月起二黑，逐月逆轉."""
    assert "子午卯酉年為上元正月起八白辰戌丑未年為中元正月起五黄寅申巳亥年為下元正月起二黑逐月逆轉" in _cau("hiep_ky.tu_bach_thang")
    mong = {**dict.fromkeys(["Tý", "Ngọ", "Mão", "Dậu"], 8), **dict.fromkeys(["Thìn", "Tuất", "Sửu", "Mùi"], 5),
            **dict.fromkeys(["Dần", "Thân", "Tỵ", "Hợi"], 2)}
    for nam in range(2020, 2032):
        t1 = hk.luu_nguyet(nam, 1)
        assert t1["tam"] == mong[t1["chi_nam"]], nam
        assert hk.luu_nguyet(nam, 2)["tam"] == (t1["tam"] - 2) % 9 + 1          # mỗi tháng lùi một số


def test_tam_sat_khop_hiep_ky():
    """申子辰合水局…故三煞在南方巳午未."""
    assert "三煞在南方巳午未" in _cau("hiep_ky.tam_sat")
    for nam in (2028, 2032, 2036):                                               # Thân, Tý, Thìn
        ts = tdg.han_nam(nam)["tam_sat"]
        assert ts["phuong"] == "Nam" and ts["chi"] == ["Tỵ", "Ngọ", "Mùi"], nam


# ───────── Huyền Không: nửa bảng thế tinh có trong Thanh Nang Áo Ngữ ─────────
def test_the_tinh_khop_thanh_nang_ao_ngu_12_son():
    """坤壬乙巨門從頭出，艮丙辛位位是破軍，巽辰亥盡是武曲位，甲癸申貪狼一路行 — 12/24 sơn của bảng thế tinh Thẩm thị."""
    s = _cau("thanh_nang_ao_ngu.ai_tinh")
    so = {"巨門": 2, "破軍": 7, "武曲": 6, "貪狼": 1}
    nhom = re.findall(r"(.)(.)(.)(?:巨門從頭出|位位是破軍|盡是武曲位|貪狼一路行)", s)
    ten = re.findall(r"巨門|破軍|武曲|貪狼", s)
    assert len(nhom) == 4 and len(ten) == 4
    dem = 0
    for (a, b, c), t in zip(nhom, ten):
        for ch in (a, b, c):
            assert hk.THE_TINH[SON[ch]] == so[t], (ch, t)
            dem += 1
    assert dem == 12


def test_ten_cuc_va_to_hop_co_goc_trong_kinh():
    assert "山上龍神不下水水裏龍神不上山" in _cau("thanh_nang_tu.long_than")       # gốc của "thượng sơn hạ thuỷ"
    assert "父母三般卦" in _cau("thien_ngoc_kinh.tam_ban") and "七星去打劫" in _cau("thien_ngoc_kinh.da_kiep")
    assert {"phu_mau_tam_ban", "that_tinh_chan_da_kiep"} <= set(HK["to_hop"]) and "thuong_son_ha_thuy" in HK["cuc"]


# ───────── Hỏi đáp: mục giải thích mới có nguồn ─────────
@pytest.mark.parametrize("ma", ["phong_thuy_la_gi", "ngu_hu_ngu_thuc", "du_nien_tu_dau", "hai_muoi_bon_son", "tu_bach_cuu_tinh"])
def test_muc_giai_thich_moi(ma):
    g = kb.giai_thich(ma)
    assert g and g["tieu_de"] and len(g["noi_dung"]) > 120 and g["tu_khoa"]
    assert all(t in KB["co_thu"] for t in g["trich"]), ma


# ───────── PT-NG2: Bát Trạch Minh Kính (bản dịch Việt — chỉ dữ kiện) ─────────
BTMK = json.loads((GOC / "fixtures" / "nguon" / "phongthuy_bat_trach_minh_kinh.json").read_text(encoding="utf-8"))
_TAT = {"Sinh": "Sinh Khí", "Thiên": "Thiên Y", "Diên": "Diên Niên", "Ngũ": "Ngũ Quỷ", "Lục": "Lục Sát", "Hoạ": "Hoạ Hại", "Tuyệt": "Tuyệt Mệnh"}


@pytest.mark.parametrize("goc", sorted(BTMK["du_nien_ca"]["cau"]))
def test_du_nien_ca_bat_trach_minh_kinh_khop_bang_huong(goc):
    """Bài ca du niên: 8 câu × 7 sao = 56 ô, đi theo vòng Càn → Khảm → Cấn → Chấn → Tốn → Ly → Khôn → Đoài."""
    vong = BTMK["du_nien_ca"]["vong"]
    i = vong.index(goc)
    bang = pt.bang_huong(goc)
    assert bang[PHUONG[goc]] == "Phục Vị"
    for k, tat in enumerate(BTMK["du_nien_ca"]["cau"][goc].split(), start=1):
        assert bang[PHUONG[vong[(i + k) % 8]]] == _TAT[tat], (goc, k, tat)


def test_gui_cung_va_xep_hang_theo_bat_trach_minh_kinh():
    assert pt.menh_quai(1986, "nam")["quai"] == BTMK["gui_cung"]["nam"]      # nam 1986: cung 5 → gửi Khôn
    assert pt.menh_quai(1986, "nam")["so"] == 2
    assert pt.menh_quai(1864, "nu")["quai"] == BTMK["gui_cung"]["nu"]        # nữ thượng nguyên Giáp Tý: cung 5 → gửi Cấn
    cat = {k for k, v in BTMK["xep_hang"].items() if v.endswith("cát")}
    assert cat == set(pt.CAT)
    assert {"bat_trach_minh_kinh"} <= set(KB["doi_chieu"]["doc_ban_dich"])
