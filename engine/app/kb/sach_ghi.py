# -*- coding: utf-8 -*-
"""SX-C (2026-11-14) — lớp "sách xưa ghi": MỘT khuôn + MỘT bộ kiểm cho mọi câu trích cổ thư đưa vào lời luận, ở cả bốn môn.

Chủ dự án chốt: lấy HẾT nội dung có ích của sách, kể cả câu sách đoán nặng — nhưng hệ thống KHÔNG tự phán:

  nhóm A — sách khen / mô tả / phân loại / dặn dò          → nói nguyên ý:  "Sách xưa ghi «…» — …"
  nhóm B — sách chê chuyện tiền, việc, tính nết, quan hệ    → nói "nên chú ý …" kèm một việc cụ thể (CY-1)
  nhóm C — sách đoán thọ / yểu, bệnh, hình khắc người thân,
           chuyện con cái, phẩm hạnh theo giới              → "Sách xưa có nhắc «…». Hàm ý theo ghi chép xưa: …" —
                                                               nói giảm, nói vòng, luôn kèm việc giữ gìn; không số tuổi,
                                                               không tên bệnh hiểm nghèo, không gán cho người đọc.

SX-C3 (chủ dự án đổi 2026-11-24) — nhóm B và C nay NÓI SÁT NGUYÊN VĂN: người đọc được biết sách ghi đúng điều gì.
  · mục B / C đã viết lại mang cờ `sat: true` — khi đó `y` là nghĩa SÁT chữ Hán (thuật lại sách, không nói với người đọc
    "bạn sẽ…"), hiển thị kèm âm Hán Việt và câu kết "lời trích nguyên văn — Hiểu Bản Thân chỉ trích lại, không chịu trách
    nhiệm pháp lý về nội dung của sách";
  · chỉ nhóm PHÁN RẤT NẶNG vẫn nói giảm thành lời dặn giữ gìn (`_CAM_SAT`): chết / yểu / thọ ngắn → "nên khám sức khoẻ
    thường xuyên"; tai nạn, thương tật → "nhớ cẩn thận khi đi lại"; người thân mất → "chăm sóc sức khoẻ người ấy"; đoán thai
    → "khám thai đúng lịch"; bệnh hiểm nghèo → bộ phận + đi khám; tù ngục → "cẩn thận giấy tờ, pháp luật";
  · giữ nguyên: người chưa đủ 18 tuổi không nhận nhóm C; nhóm C không vào tiêu đề, tóm tắt, thẻ chia sẻ, thông báo đẩy,
    lời nhắc AI; câu hỏi trực tiếp về tuổi thọ / bệnh và khủng hoảng vẫn qua cổng an toàn riêng.

Mỗi mục là một dict phẳng:
  han     nguyên văn chữ Hán, KHÔNG dấu câu, là chuỗi con của kho nguồn `nguon` (≤ 80 chữ)
  am      phiên âm Hán Việt của đúng câu ấy
  y       nghĩa tiếng Việt ĐÃ nói giảm (1–2 câu, lời đời thường, không thuật ngữ)
  nhom    "A" | "B" | "C"
  chu_de  một mã trong CHU_DE
  sat     (B, C — SX-C3) `true` = `y` là nghĩa SÁT chữ Hán; chỉ nhóm phán rất nặng nói giảm (xem `_CAM_SAT`)
  ham_y   (B, C bắt buộc) câu "Nên chú ý …" / điều người xưa muốn dặn
  viec    (B, C bắt buộc) một việc nhỏ làm được ngay; chủ đề sức khoẻ / sức bền phải có ý đi khám
  nguon   tên tệp kho nguồn (không đuôi), vd "than_tuong_toan_bien"
  han_kho (tuỳ chọn) khi kho nguồn chen CHÚ NHỎ 〔…〕 giữa câu (vd 乾〔右頤下〕宮高聳…): `han_kho` là đoạn liền mạch có trong kho
          (宮高聳…), `han` là câu chính văn đã bỏ chú nhỏ (乾宮高聳…) — bộ kiểm so `han` với kho nguồn đã bỏ chú nhỏ

Mục TÓM Ý (`tom_y: true`) — cho sách chỉ có bản dịch Việt hiện đại, không có nguyên văn chữ Hán trong kho nguồn (Dương Trạch
Tam Yếu, Bát Trạch Minh Kính): không có `han` / `am`; `nguon` là mã trong TEN_SACH_TOM_Y; `y` do ban biên tập viết lại bằng lời
mình (không chép câu của bản dịch). Mọi luật nói giảm, nhóm, `ham_y`, `viec` áp như mục có nguyên văn.

Tầng KB: chỉ tra + kiểm, không sinh nghĩa. Bộ kiểm chạy trong test và qua `scripts/kiem_sach_ghi.py <tệp>`.
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

_GOC = Path(__file__).resolve().parents[2]
_NGUON = _GOC / "fixtures" / "nguon"

NHOM = ("A", "B", "C")
CHU_DE = ("tong_quan", "tinh_net", "cong_viec", "tien_bac", "tinh_duyen", "gia_dinh", "con_cai", "suc_khoe", "suc_ben",
          "di_lai", "nha_cua", "giay_to", "ban_be")
_CAN_KHAM = ("suc_khoe", "suc_ben")
_DAU = re.compile(r"[\s，。、；：？！「」『』《》〈〉“”‘’（）·,.;:?!()\[\]〔〕/\"'—–\-﹐﹑﹔﹕﹖﹗．…【】　]")
# Chữ Hán báo hiệu câu sách đang đoán nặng → không được gắn nhóm A (phồn + giản).
_HAN_NANG = re.compile(r"[死夭亡絕绝剋克刑妨淫賤贱孤寡疾病災灾厄牢獄狱貧贫窮穷凶殺杀破敗败禍祸傷伤哭喪丧盜盗]")
# Lời tiếng Việt không được dùng (đã có cách nói giảm thay thế — xem docs/KE-HOACH-NAP-SACH-XUA.md mục 2).
_CAM_TU = re.compile(
    r"(?<![\wÀ-ỹ])(chết|yểu|goá|góa|dâm|ngục|điên|đoạ|đọa|trộm|cướp|giết|bùa|ngải|què|mù)(?![\wÀ-ỹ])", re.I)
_CAM_CUM = ("đoản mệnh", "đoản thọ", "tổn thọ", "giảm thọ", "mất sớm", "chết sớm", "tuyệt tự", "tuyệt tử", "tuyệt hậu",
            "không có con", "vô sinh", "hiếm muộn suốt", "khắc chồng", "khắc vợ", "khắc cha", "khắc mẹ",
            "khắc con", "khắc phu", "khắc thê", "hại chồng", "hại vợ", "sát phu", "sát thê", "mồ côi", "hạ tiện",
            "đê tiện", "hèn hạ", "ti tiện", "bần tiện", "nghèo hèn", "ăn mày", "ăn xin", "tù tội", "ngồi tù", "tàn tật",
            "tật nguyền", "tự tử", "tự sát", "ung thư", "đột quỵ", "suy thận", "phá sản", "ly hôn", "ly dị", "bỏ chồng",
            "bỏ vợ", "ngoại tình", "lăng loàn", "tai hoạ", "tai họa", "tai ương", "đại hung", "cực hung", "chắc chắn",
            "bạn sẽ", "sẽ bị", "sẽ gặp", "sẽ mất", "sẽ mắc", "số bạn", "giải hạn", "vật phẩm", "cúng sao", "trấn yểm",
            "hình khắc", "tuổi thọ", "thọ yểu", "năm mất", "đoán bệnh",
            # Thai sản được nói (chủ dự án 2026-11-15) nhưng chỉ dạng giữ gìn / đi khám — không đoán kết quả của thai.
            "sảy thai", "đoạ thai", "khó sinh", "sinh nở khó", "hao người", "trẻ khó nuôi",
            # Hình khắc người thân nói thẳng — viết "X cần được để ý, chăm sóc nhiều hơn" (SX-C, 2026-11-15).
            "chịu thiệt", "trước thiệt", "sa sút")
# Tên riêng mang chữ "nặng" (tên sao, tên du niên, thần sát) — bỏ ra trước khi soi chữ nặng.
_TEN_RIENG = re.compile(r"破軍|破军|七殺|七杀|絕命|绝命|天刑|劫殺|劫杀|劫煞|病符|弔客|吊客|喪門|丧门|亡神|孤辰|寡宿|六煞|五鬼|禍害|祸害|"
                        r"化忌|忌星|地劫|羊刃|陽刃|阳刃|白虎|官符|死符|歲破|岁破|大耗|小耗|災煞|灾煞|傷官|伤官|七煞|天哭|破碎|截路")
_GIOI_HAN = {"han": 80, "y": 280, "ham_y": 200, "viec": 200}
# SX-C3: `sat` nói sát nguyên văn — chỉ còn cấm nhóm phán rất nặng + lời gán cho người đọc + vật phẩm.
_CAM_SAT_TU = re.compile(r"(?<![\wÀ-ỹ])(chết|yểu|giết|ngục|dâm|mù|què|điên|bùa|ngải)(?![\wÀ-ỹ])", re.I)
_CAM_SAT = ("đoản mệnh", "đoản thọ", "tổn thọ", "giảm thọ", "tuổi thọ", "thọ yểu", "mất sớm", "năm mất", "tự tử", "tự sát",
            "sảy thai", "đoạ thai", "khó sinh", "tuyệt tự", "tuyệt tử", "tuyệt hậu", "ung thư", "đột quỵ", "suy thận",
            "tù tội", "ngồi tù", "hạ tiện", "đê tiện", "ăn mày", "ăn xin", "tàn tật", "tật nguyền", "lăng loàn",
            "giải hạn", "cúng sao", "trấn yểm", "vật phẩm", "chắc chắn", "bạn sẽ", "sẽ bị", "sẽ gặp", "sẽ mất", "sẽ mắc",
            "số bạn", "đoán bệnh")

# Sách chỉ có bản dịch hiện đại → chỉ tóm ý (mục `tom_y: true`); tên hiển thị một chỗ.
TEN_SACH_TOM_Y = {"duong_trach_tam_yeu": "Dương Trạch Tam Yếu", "bat_trach_minh_kinh": "Bát Trạch Minh Kính"}

# Lời khung (một chỗ): môn nào cũng dùng đúng ba khuôn này.
CAU_KET = "Đây là ghi chép của người xưa, đọc để tham khảo và giữ gìn, không phải lời đoán riêng cho bạn."
# SX-C3: khối có câu nhóm B / C nói sát nguyên văn → câu kết nêu rõ đây là lời trích, ai chịu trách nhiệm về nội dung.
CAU_KET_TRICH = ("Các câu trên là lời trích nguyên văn từ sách xưa. Hiểu Bản Thân chỉ trích lại để bạn tham khảo: đó là "
                 "ghi chép của người xưa, không phải lời đoán riêng cho bạn, và Hiểu Bản Thân không chịu trách nhiệm pháp "
                 "lý về nội dung của sách.")
CAU_KET_SUC_KHOE = "Chuyện sức khoẻ thì nghe bác sĩ, không nghe sách tướng số."


def chuan(t: str) -> str:
    """Bỏ dấu câu + khoảng trắng — kho nguồn không giữ dấu câu (dấu câu Wikisource là CC BY-SA)."""
    return _DAU.sub("", t or "")


def _chuoi(x) -> list[str]:
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for k, v in x.items() if not k.startswith("_") and k not in ("ban", "source_id", "school_id") for s in _chuoi(v)]
    if isinstance(x, list):
        return [s for v in x for s in _chuoi(v)]
    return []


@lru_cache(maxsize=None)
def van_nguon(ten: str) -> str:
    """Toàn văn một kho nguồn (mọi chuỗi nối lại, đã `chuan`)."""
    return chuan("".join(_chuoi(json.loads((_NGUON / f"{ten}.json").read_text("utf-8")))))


@lru_cache(maxsize=None)
def van_nguon_chinh_van(ten: str) -> str:
    """Như `van_nguon` nhưng bỏ hẳn chú nhỏ 〔…〕 (lời chú của người chép / hiệu đính chen giữa câu) — chỉ còn chính văn."""
    return chuan("".join(re.sub(r"〔[^〕]*〕", "", s) for s in _chuoi(json.loads((_NGUON / f"{ten}.json").read_text("utf-8")))))


def kiem_muc(m: dict, vi_tri: str = "") -> list[str]:
    """Danh sách lỗi của một mục (rỗng = đạt)."""
    loi: list[str] = []
    them = lambda s: loi.append(f"{vi_tri}: {s}" if vi_tri else s)  # noqa: E731
    tom_y = bool(m.get("tom_y"))
    for k in (("y", "nhom", "chu_de", "nguon") if tom_y else ("han", "am", "y", "nhom", "chu_de", "nguon")):
        if not m.get(k):
            them(f"thiếu `{k}`")
    if loi:
        return loi
    if m["nhom"] not in NHOM:
        them(f"nhom {m['nhom']!r} không hợp lệ")
    if m["chu_de"] not in CHU_DE:
        them(f"chu_de {m['chu_de']!r} không hợp lệ")
    if tom_y:
        if m["nguon"] not in TEN_SACH_TOM_Y:
            them(f"mục tóm ý: nguồn {m['nguon']!r} không có trong TEN_SACH_TOM_Y")
        if m.get("han"):
            them("mục tóm ý không mang `han` (sách này chưa có nguyên văn trong kho nguồn)")
    else:
        if not (_NGUON / f"{m['nguon']}.json").exists():
            them(f"không có kho nguồn {m['nguon']}")
            return loi
        if m["han"] != chuan(m["han"]):
            them("`han` còn dấu câu / khoảng trắng")
        if m.get("han_kho"):
            if chuan(m["han_kho"]) not in van_nguon(m["nguon"]):
                them(f"`han_kho` «{m['han_kho']}» không có trong kho nguồn {m['nguon']}")
            if chuan(m["han_kho"]) not in m["han"] or chuan(m["han"]) not in van_nguon_chinh_van(m["nguon"]):
                them(f"«{m['han']}» không khớp chính văn kho nguồn {m['nguon']} (đã bỏ chú nhỏ) hoặc không chứa `han_kho`")
        elif chuan(m["han"]) not in van_nguon(m["nguon"]):
            them(f"«{m['han']}» không có trong kho nguồn {m['nguon']}")
    for k, n in _GIOI_HAN.items():
        if len(m.get(k) or "") > n:
            them(f"`{k}` dài quá {n} ký tự")
    tran = _TEN_RIENG.sub("", m.get("han") or "")
    # `a_phu_dinh: true` — người duyệt xác nhận chữ nặng chỉ nằm trong vế phủ định của câu khen (不憂貧, 無禍亦無災, 不為凶):
    # vẫn cho nhóm A, nhưng MỌI chữ nặng phải có chữ phủ định (不無免莫) trong vòng hai chữ trước / sau nó.
    if m.get("a_phu_dinh") and all(re.search(r"[不無无免莫]", tran[max(0, x.start() - 2): x.end() + 2])
                                     for x in _HAN_NANG.finditer(tran)):
        tran = ""
    if m["nhom"] == "A" and _HAN_NANG.search(tran):
        them(f"câu sách có chữ nặng «{_HAN_NANG.search(tran).group()}» mà gắn nhóm A — phải là B hoặc C")
    if m["nhom"] in ("B", "C"):
        for k in ("ham_y", "viec"):
            if not m.get(k):
                them(f"nhóm {m['nhom']} thiếu `{k}`")
    if m.get("sat") is not None and m.get("sat") is not True:
        them("`sat` chỉ nhận giá trị true")
    if m.get("sat") and m["nhom"] == "A":
        them("`sat` chỉ dùng cho nhóm B / C")
    if m["chu_de"] in _CAN_KHAM and m["nhom"] in ("B", "C") and "khám" not in ((m.get("viec") or "") + (m.get("ham_y") or "")).lower():
        them("chủ đề sức khoẻ / sức bền phải có ý đi khám trong `viec` hoặc `ham_y`")
    for k in ("y", "ham_y", "viec"):
        t = (m.get(k) or "")
        if k == "y" and m.get("sat"):                       # SX-C3: nghĩa sát — chỉ cấm nhóm phán rất nặng
            loi += [f"{vi_tri}: {x}" if vi_tri else x for x in kiem_sat(t)]
            continue
        if (x := _CAM_TU.search(t)):
            them(f"`{k}` có từ chưa nói giảm: «{x.group()}»")
        for c in _CAM_CUM:
            if c in t.lower():
                them(f"`{k}` có cụm chưa nói giảm: «{c}»")
        if re.search(r"[一-鿿]", t):
            them(f"`{k}` còn chữ Hán")
    return loi


def kiem_sat(t: str) -> list[str]:
    """SX-C3 — luật cho nghĩa sát nguyên văn: được nói thẳng điều sách chê; chỉ nhóm phán rất nặng phải nói giảm."""
    loi = []
    if (x := _CAM_SAT_TU.search(t or "")):
        loi.append(f"`sat` có từ phải nói giảm: «{x.group()}»")
    loi += [f"`sat` có cụm phải nói giảm: «{c}»" for c in _CAM_SAT if c in (t or "").lower()]
    if re.search(r"[一-鿿]", t or ""):
        loi.append("`sat` còn chữ Hán")
    return loi


def kiem_loi(t: str) -> list[str]:
    """Luật nói giảm áp cho MỘT chuỗi lời Việt bất kỳ (nhãn đồ hình, lời tóm ý…): từ thô, cụm thô, chữ Hán sót."""
    loi = []
    if (x := _CAM_TU.search(t or "")):
        loi.append(f"từ chưa nói giảm: «{x.group()}»")
    loi += [f"cụm chưa nói giảm: «{c}»" for c in _CAM_CUM if c in (t or "").lower()]
    if re.search(r"[一-鿿]", t or ""):
        loi.append("còn chữ Hán")
    return loi


def cac_muc(x, duong: str = ""):
    """Mọi dict có khoá `han` + `nhom` trong một cây JSON (kèm đường dẫn để báo lỗi)."""
    if isinstance(x, dict):
        if x.get("nhom") in NHOM and ("han" in x or x.get("tom_y")):
            yield duong, x
        for k, v in x.items():
            yield from cac_muc(v, f"{duong}.{k}" if duong else str(k))
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from cac_muc(v, f"{duong}[{i}]")


def kiem_tep(duong: Path) -> tuple[int, list[str]]:
    d = json.loads(Path(duong).read_text("utf-8"))
    loi: list[str] = []
    n = 0
    for vt, m in cac_muc(d):
        n += 1
        loi += kiem_muc(m, vt)
    return n, loi


def loi(m: dict, co_am: bool = True) -> str:
    """Câu hiển thị của một mục theo nhóm. Câu kết (`CAU_KET…`) do nơi gọi thêm MỘT lần cho cả khối."""
    if m.get("tom_y"):
        ten = TEN_SACH_TOM_Y.get(m["nguon"], "sách xưa")
        if m["nhom"] == "A":
            return f"Sách {ten} ghi, tóm ý: {m['y']}"
        if m["nhom"] == "B":
            return f"Sách {ten} ghi, tóm ý: {m['y']} {m['ham_y']}"
        return f"Sách {ten} có nhắc. Hàm ý theo ghi chép xưa: {m['y']} {m['ham_y']}"
    am = f" ({m['am'].rstrip('.')})" if co_am and m.get("am") else ""
    if m["nhom"] == "A":
        return f"Sách xưa ghi «{m['han']}»{am} — {m['y']}"
    if m.get("sat"):                                         # SX-C3: nói sát nguyên văn
        return f"Sách xưa ghi nguyên văn «{m['han']}»{am} — nghĩa là: {m['y']} {m['ham_y']}"
    if m["nhom"] == "B":
        return f"Sách xưa ghi «{m['han']}»{am} — {m['y']} {m['ham_y']}"
    return f"Sách xưa có nhắc «{m['han']}»{am}. Hàm ý theo ghi chép xưa: {m['y']} {m['ham_y']}"


def cau_ket(cac: list[dict]) -> str:
    """Câu kết của một khối: có mục nhóm C → câu "ghi chép của người xưa"; có chủ đề sức khoẻ → thêm câu bác sĩ."""
    ra = []
    if any(m["nhom"] in ("B", "C") and m.get("sat") for m in cac):
        ra.append(CAU_KET_TRICH)
    elif any(m["nhom"] == "C" for m in cac):
        ra.append(CAU_KET)
    if any(m["chu_de"] in _CAN_KHAM for m in cac):
        ra.append(CAU_KET_SUC_KHOE)
    return " ".join(ra)
