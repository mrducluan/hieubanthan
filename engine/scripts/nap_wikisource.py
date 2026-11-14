# -*- coding: utf-8 -*-
"""WS-1 — nạp nguyên văn cổ thư công cộng từ Wikisource tiếng Trung vào kho nguồn `fixtures/nguon/`.

Nguồn: wikitext thô từng trang (`index.php?title=<trang>&action=raw`), đã tải sẵn vào một thư mục, mỗi trang một tệp
`<tên trang, dấu "/" đổi thành "__">.txt`. Máy phiên bị giới hạn tốc độ nên bước tải làm riêng (chậm, nối tiếp được).

Dùng:  python scripts/nap_wikisource.py /thu/muc/raw

Quy tắc làm sạch (chỉ bỏ vỏ wiki, KHÔNG sửa chữ của sách):
- lấy phần trong <onlyinclude> nếu có; bỏ bản mẫu {{…}}, thẻ HTML, bảng điều hướng, thể loại, liên kết liên wiki;
- hình quẻ / bảng trong <pre>, {| … |} thay bằng dấu 〔圖〕 (chỉ giữ lời);
- chú thích nhỏ của bản mẫu {{*|…}} / {{注|…}} giữ chữ, đặt trong 〔…〕;
- trang chỉ là mục lục (ghép trang con bằng {{/x}}) không thành thiên riêng.

Mọi sách ở đây là bản GÕ LẠI của người dùng Wikisource → `can_doi_chieu: true` cho tới khi so được bản khắc / bản Tứ khố.
Lời người gõ thêm (lời người nhập liệu, phần «增訂» thời nay) không nạp.

Đã xem và KHÔNG nạp: 玉匣記 (bản trên Wikisource là bản biên tập thời nay có lời dẫn hiện đại, nội dung chủ yếu bùa chú /
ngày cúng — trái quy tắc không vật phẩm, không giải hạn); 淵海子平 (trang ghi «No source», giản thể — không hơn bản đang có);
卜筮正宗 (mới gõ phần đầu quyển); 平砂玉尺經 (giản thể, không ghi bản, sách bị chính Tưởng Đại Hồng bác);
窮通寶鑑 (giản thể, không ghi bản — kho đã có 120 ô từ bản khác);
五行精紀, 入地眼全書, 靈城精義 (bản gõ đổi giản → phồn bằng máy, sai kiểu 乙丑 → 乙醜, 吉凶 → 吉兇, 周 → 週 — không đủ tin;
靈城精義 là sách Tứ khố, nên lấy bản Kanripo ở đợt sau). 葬書, 宅經, 三命通會, 紫微斗數全書 (kho đã có bản Tứ khố / bản đầy đủ hơn).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
NGAY = "2026-11-13"

# tệp đích → (trang gốc Wikisource, tên Việt, tác giả / đời, school_id, ghi chú bản)
SACH: dict[str, dict] = {
    "tang_san_boc_dich": {"trang": "增刪卜易", "ten": "Tăng San Bốc Dịch", "tac_gia": "Dã Hạc lão nhân soạn, Lý Văn Huy tăng san (đời Thanh)",
                          "school_id": "luc_hao",
                          "ghi_chu": "người gõ ghi rõ làm từ một bản in phổ thông nhiều lỗi và một bản bạch thoại, chưa hiệu đính kỹ; "
                                     "lời người gõ và phần «原劍增訂» thời nay KHÔNG nạp"},
    "hoa_chau_lam": {"trang": "火珠林", "ten": "Hoả Châu Lâm", "tac_gia": "Ma Y đạo giả (truyền, Tống)", "school_id": "luc_hao", "ghi_chu": "bản gõ chữ giản thể"},
    "mai_hoa_dich_so": {"trang": "梅花易數", "ten": "Mai Hoa Dịch Số", "tac_gia": "Thiệu Ung (truyền, Tống)", "school_id": "mai_hoa"},
    "dia_ly_bien_chinh": {"trang": "地理辨正", "ten": "Địa Lý Biện Chính", "tac_gia": "Tưởng Đại Hồng chú (đầu Thanh)",
                          "school_id": "huyen_khong"},
    "ham_long_kinh": {"trang": "撼龍經", "ten": "Hám Long Kinh · Nghi Long Kinh", "tac_gia": "Dương Quân Tùng (Đường)",
                      "school_id": "loan_dau"},
    "thanh_nang_kinh": {"trang": "青囊經", "ten": "Thanh Nang Kinh", "tac_gia": "Hoàng Thạch Công (truyền)", "school_id": "huyen_khong"},
    "huyen_co_phu": {"trang": "玄機賦", "ten": "Huyền Cơ Phú", "tac_gia": "Ngô Cảnh Loan (truyền, Tống)", "school_id": "huyen_khong"},
    "trich_thien_tuy": {"trang": "滴天髓", "ten": "Trích Thiên Tuỷ", "tac_gia": "Kinh Đồ soạn, Lưu Cơ chú (truyền)", "school_id": "tu_binh"},
    "trich_thien_tuy_xien_vi": {"trang": "滴天髓闡微", "ten": "Trích Thiên Tuỷ Xiển Vi", "tac_gia": "Nhậm Thiết Tiều chú (Thanh)",
                                "school_id": "tu_binh", "ghi_chu": "bản gõ chữ giản thể"},
    "than_phong_thong_khao": {"trang": "神峰通考", "ten": "Thần Phong Thông Khảo", "tac_gia": "Trương Nam (Minh)", "school_id": "tu_binh", "ghi_chu": "bản gõ chữ giản thể"},
    "hoang_kim_sach": {"trang": "黃金策", "ten": "Hoàng Kim Sách", "tac_gia": "Lưu Cơ (truyền, Minh)", "school_id": "luc_hao"},
    "kinh_thi_dich_truyen": {"trang": "京氏易傳", "ten": "Kinh Thị Dịch Truyện", "tac_gia": "Kinh Phòng (Hán), Lục Tích chú",
                             "school_id": "luc_hao"},
    "thien_ngoc_kinh_noi_truyen": {"trang": "天玉經內傳", "ten": "Thiên Ngọc Kinh Nội Truyện", "tac_gia": "Dương Quân Tùng (truyền, Đường)",
                                   "school_id": "huyen_khong"},
    "nhan_tu_tu_tri": {"trang": "人子須知", "ten": "Nhân Tử Tu Tri (Địa lý nhân tử tu tri)", "tac_gia": "Từ Thiện Kế, Từ Thiện Thuật (Minh)",
                       "school_id": "loan_dau", "ghi_chu": "bản gõ giản thể, mới có phần đầu sách"},
}

_BO_MUC = re.compile(r"^=+\s*(錄入者言|原劍增訂說明|目錄|目录|外部連結|外部链接|參考文獻|参考文献|注釋|註釋|参见|參見)\s*=+\s*$")


def _ten_tep(trang: str) -> str:
    return trang.replace("/", "__") + ".txt"


def lam_sach(s: str) -> str:
    """Bỏ vỏ wiki, giữ nguyên chữ của sách."""
    m = re.search(r"<onlyinclude>(.*?)</onlyinclude>", s, flags=re.S)
    s = m.group(1) if m else s
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"-\{([^{}]*)\}-", r"\1", s)          # dấu khoá chuyển giản ↔ phồn của MediaWiki
    s = re.sub(r"<(pre|gallery|score|math)[^>]*>.*?</\1>", "〔圖〕", s, flags=re.S)
    s = re.sub(r"\{\|.*?\|\}", "〔圖〕", s, flags=re.S)
    s = re.sub(r"<ref[^>]*>(.*?)</ref>", r"〔\1〕", s, flags=re.S)
    # chú nhỏ: {{*|chữ}} {{注|chữ}} {{小註|chữ}} … giữ chữ
    for _ in range(3):
        s = re.sub(r"\{\{\s*(?:\*|注|註|小註|小注|small|YL|夹注|夾注)\s*\|([^{}|]*)\}\}", r"〔\1〕", s)
    for _ in range(4):
        s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[(?:Category|分類|分类|File|Image|文件|檔案)[^\]]*\]\]", "", s, flags=re.I)
    s = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[https?://\S+\s*([^\]]*)\]", r"\1", s)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"'{2,}", "", s)
    s = s.replace("&nbsp;", " ").replace("　", " ")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"^[:;*#]+\s*", "", s, flags=re.M)
    return re.sub(r"\n{2,}", "\n", s).strip()


def _tach_muc(s: str) -> list[tuple[str, str]]:
    """Trang một tệp có nhiều mục == … == → [(tên mục, lời)]. Không có mục → [("", cả trang)]."""
    ra, ten, dong, bo, cap_bo = [], "", [], False, 0
    for d in s.split("\n"):
        m = re.match(r"^(=+)\s*(.*?)\s*\1\s*$", d)
        if m:
            if dong and not bo:
                ra.append((ten, "\n".join(dong)))
            cap = len(m.group(1))
            if _BO_MUC.match(d):
                bo, cap_bo = True, cap
            elif bo and cap > cap_bo:
                pass                      # mục con của mục bị bỏ
            else:
                bo, cap_bo = False, 0
            ten, dong = lam_sach(m.group(2)), []
        else:
            dong.append(d)
    if dong and not bo:
        ra.append((ten, "\n".join(dong)))
    return ra


def _ten_thien(tho: str, mac_dinh: str) -> str:
    m = re.search(r"\|\s*section\s*=\s*([^\n|}]+)", tho)
    if m and lam_sach(m.group(1)):
        return lam_sach(m.group(1))
    return mac_dinh


def nap_sach(raw: Path, ma: str) -> dict | None:
    cf = SACH[ma]
    goc = cf["trang"]
    f_goc = raw / _ten_tep(goc)
    if not f_goc.exists():
        return None
    tho_goc = f_goc.read_text("utf-8")
    thien: list[dict] = []
    # thứ tự trang con: theo thứ tự xuất hiện trong trang gốc ({{/x}} hoặc [[/x]] hoặc [[書/x]]); còn lại theo tên tệp
    thu_tu = []
    for x in re.findall(r"\{\{\s*/([^{}|]+?)\s*\}\}|\[\[\s*/([^\]|#]+?)/?\s*(?:\|[^\]]*)?\]\]|\[\[\s*" + re.escape(goc) + r"/([^\]|#]+?)\s*(?:\|[^\]]*)?\]\]", tho_goc):
        t = next(a for a in x if a).strip().replace("_", " ")
        if t not in thu_tu:
            thu_tu.append(t)
    co_tep = sorted(p.name[len(_ten_tep(goc)) - 4 + 2:-4].replace("__", "/") for p in raw.glob(_ten_tep(goc)[:-4] + "__*.txt"))
    thu_tu = [t for t in thu_tu if t in co_tep] + [t for t in co_tep if t not in thu_tu]
    # lời nằm ngay trong trang gốc
    for ten, loi in _tach_muc(tho_goc):
        van = lam_sach(loi)
        if len(van) >= 40:
            thien.append({"so": "", "ten": ten or cf["trang"], "van": van})
    for con in thu_tu:
        tho = (raw / _ten_tep(f"{goc}/{con}")).read_text("utf-8")
        if re.match(r"\s*#(REDIRECT|重定向)", tho, flags=re.I):
            continue
        muc = _tach_muc(re.search(r"<onlyinclude>(.*?)</onlyinclude>", tho, flags=re.S).group(1)) if "<onlyinclude>" in tho else _tach_muc(tho)
        ten_trang = _ten_thien(tho, con)
        for ten, loi in muc:
            van = lam_sach(loi)
            if len(van) >= 40:
                thien.append({"so": con, "ten": ten or ten_trang, "van": van})
    if not thien:
        return None
    ban = (f"Wikisource tiếng Trung, trang {goc} (bản gõ lại của người dùng Wikisource, lấy {NGAY} qua action=raw) — CHƯA đối chiếu "
           "bản khắc; hình quẻ / bảng thay bằng 〔圖〕, chú nhỏ đặt trong 〔…〕")
    if cf.get("ghi_chu"):
        ban += "; " + cf["ghi_chu"]
    return {"_nguon": f"{goc} ({cf['ten']}), {cf['tac_gia']}. Cổ thư công cộng.", "ban": ban, "can_doi_chieu": True,
            "source_id": ma, "school_id": cf["school_id"], "thien": thien}


if __name__ == "__main__":
    raw = Path(sys.argv[1])
    chi = sys.argv[2:] or list(SACH)
    for ma in chi:
        d = nap_sach(raw, ma)
        if d is None:
            print(f"{ma}: CHƯA có tệp thô — bỏ qua")
            continue
        (NGUON / f"{ma}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(f"{ma}: {len(d['thien'])} thiên, {sum(len(t['van']) for t in d['thien'])} chữ")
