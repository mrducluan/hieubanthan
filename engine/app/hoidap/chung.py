# -*- coding: utf-8 -*-
"""Phần dùng chung cho mọi module hỏi đáp Huyền học (RULES, không LLM).

Tái dùng bộ chuẩn hoá và danh sách an toàn/từ chối của thần số (app.luangiai.hoi)
— không sửa chúng — và thêm các mẫu riêng của Huyền học.
"""
from __future__ import annotations

import re

from app.luangiai import hoi as _h

chuan_hoa = _h.chuan_hoa
chuan_hoa_cau = _h.chuan_hoa_cau          # EN-3: câu hỏi (mở viết tắt) — dùng ở chỗ định tuyến
co = _h._co
dem = _h._dem

# EN-1: mẫu khủng hoảng (kể cả lời nói bằng ngôn ngữ huyền học — "mệnh có Địa Kiếp, chắc tôi nên chết đi") đã gom về
# MỘT nguồn `luangiai/an_toan.py`, dùng chung với Thần số; so khớp cả chữ có dấu để không chặn nhầm câu bình thường.
from app.luangiai import an_toan as _at  # noqa: E402

# Từ chối nhẹ: bộ Thần số dùng chung TRỪ các cụm Huyền học trả lời được theo kiểu "định hướng" (MT-ĐS mục 4):
# "chắc chắn" (B0); "tai nạn", "thắng kiện" (B1: trả lời bằng mảng đi lại / giấy tờ + lưu ý, không có/không).
_BO_CHAN_HH = {r"chac chan", r"tai nan", r"(bi|gap|co) tai nan", r"tai nan (khong|nam nay|nam sau)", r"thang kien",
               # SK-1 (2026-11-04): câu sức khoẻ CHUNG về chính mình ("sức khoẻ của tôi thế nào", "hay đau dạ dày") → trả
               # lời bằng chương sức khoẻ (mức, hệ cơ quan, năm nên chú ý, đi khám, câu không thay lời bác sĩ). Câu hỏi CÓ /
               # KHÔNG bệnh ("bệnh gì", "mắc bệnh") vẫn là câu đặc biệt (`an_toan.hoi_benh`) — review SK-1. Kinh Dịch không
               # có chương sức khoẻ → vẫn không đọc quẻ cho hai cụm này (`KD_SUC_KHOE`).
               r"dau da day", r"suc khoe cua toi the nao"}
KD_SUC_KHOE = [r"dau da day", r"suc khoe cua toi the nao"]
TU_CHOI_THEM = [r"so de", r"song duoc bao lau", r"nao chet", r"tho bao nhieu", r"doan benh",
                r"benh gan",
                # "yểm bùa nhà hàng xóm" = tác động lên người khác → từ chối; "nhà tôi có BỊ yểm bùa không" = nỗi sợ tâm
                # linh → dẫn hướng (TAM_LINH) — EN-3d.
                r"(muon|cach|lam sao|giup toi|giup minh|nho thay) .{0,12}yem bua|yem bua (nha|nguoi|cho|ke|hang xom|ban|vo|chong|sep|dong nghiep|doi thu)(?! .{0,15}(toi|minh|em|nha toi)(?!\w))", r"chua duoc benh", r"nen tuyen", r"tuyen nhan vien",
                r"de quyet dinh tuyen", r"chon so lo", r"so lo"]
CHUA_BENH = (r"(benh|bi om|viem|sot|mat ngu|di ung|ung thu|huyet ap|tieu duong|phoi|da day|xuong khop|trieu chung"
             r"|dau (dau|bung|lung|khop|da day|rang|mat|nguc|bao tu))(?!\w).{0,40}chua (the nao|ra sao|sao cho|kieu gi|bang gi)")
_at.MO_HO[CHUA_BENH] = r"chữa"
# MT-ĐS B0 — thọ / chết / sống được không (kể cả người thân, thai nhi), tên bệnh & bộ phận, lô đề, nhân sự trá hình.
TU_CHOI_HH = [
    r"tho (duoc )?bao nhieu", r"song (duoc )?(bao lau|den bao nhieu|bao nhieu tuoi|may nam|duoc may)",
    r"(con|be|no|ong|ba|bo|me|toi|minh|em|chau|vo|chong) (co )?song duoc (khong|ko)", r"co qua khoi",
    r"(\d{2,3} tuoi|ong noi|ong ngoai|ba noi|ba ngoai|cu nha).{0,40}co (di|mat|ra di) (khong|ko)",
    r"ket thuc doi", r"bat dac ky tu", r"(de|hay|phai) chet(?!\w)", r"so chet (tre|som|bat)", r"chet som", r"chet tre",
    r"nam nao .{0,30}co nguoi mat", r"(?<!khoa )(?<!kham )benh (phoi|tim|gan|than|xuong|mau)",
    r"(gan|than|tim|phoi|ung thu|da day) hay (gan|than|tim|phoi|ung thu|da day)", r"uong thuoc gi",
    r"khoi (duoc )?benh", r"choi (lo|de)(?!\w)", r"so chot", r"danh con (gi|so)", r"so may de trung", r"danh .{0,12}(de|cho) trung",
    r"lam hr|(?<!\w)hr(?!\w)", r"chu (cty|cong ty|doanh nghiep).{0,40}(ung vien|nhan vien|nhan|tuyen)",
    r"nhan vien .{0,40}(nghi viec|trung thuc|giu|chon|nhan|sa thai)", r"tuyen (ke toan|nhan vien|nguoi|nhan su|thu ky)",
    r"ai trung thuc", r"(chon|giu|loai) nhan vien",
    # SK-1: câu sức khoẻ chung về CHÍNH mình được trả lời; vẫn từ chối (lời đáp gợi hệ cơ quan + đi khám): hỏi bệnh gì
    # kèm bộ phận cụ thể, hỏi bệnh của người khác, hỏi cách chữa.
    r"benh gi .{0,12}(phoi|gan|than|tim|da day|mau|xuong|ruot|mat)", r"(gan|than|tim|phoi|da day) hay (gi|cai gi)",
    r"(?<!\w)(con|be|me|bo|ong|ba|chong|vo|chau|anh|chi) (toi |em |minh )?.{0,25}benh gi",
    # "chưa" và "chữa" cùng bỏ dấu thành "chua" (review SK-1: "Công việc vẫn chưa ra sao cả" bị từ chối) → cần chữ chỉ
    # bệnh / triệu chứng đứng trước, và gõ có dấu thì phải đúng chữ "chữa" (`an_toan.MO_HO`).
    CHUA_BENH,
]
TU_CHOI_HH_TAT_CA = [m for ds in _h.TU_CHOI.values() for m in ds if m not in _BO_CHAN_HH] + TU_CHOI_THEM + TU_CHOI_HH
# MT-ĐS B1 — câu tâm linh (vong, căn, ma, bùa, trùng tang, nghiệp…): KHÔNG luận, KHÔNG nối sang lá số (nối = ngầm xác
# nhận có vong), trả lời bằng lời dẫn hướng `mau.dan_huong` (+ `chia_buon` khi có người mất). Căn đồng là tín ngưỡng
# được công nhận — không nói "không có", chỉ nói hệ thống không xem.
TAM_LINH = [
    # "căn" và "cần" cùng bỏ dấu thành "can" → chỉ bắt "nặng căn", "nhiều căn", "căn đồng/cô/cậu/quan/tu".
    r"(?<!\w)vong (theo|nhap|vao|goi|am|linh|hon)", r"co vong", r"can dong", r"(?<!\w)(nang|nhieu) can(?!\w)",
    r"(co|la|phai) can (co|cau|quan|tu|ong|nang)(?!\w)", r"trinh dong", r"mo phu", r"(co|thay|nhin thay|la|hay co|phai|bi) ma (khong|ko|k)(?!\w)",
    r"(co|thay|hay la|la) ma$", r"nhin thay ma", r"bong de", r"(bo|yem|giai|chon|dinh|bi) bua", r"bua ngai", r"(?<!\w)ngai nap",
    r"trung tang", r"duyen am", r"tien kiep", r"nghiep (nang|chuong|bao)", r"tran trach", r"am binh",
    r"(moi|nho) thay (ve|cung|giai|xem|tran)", r"(di xem|xem|tim|gap) thay (bua|boi|giai|tran|cung sao|cung giai)", r"thay (ve )?(giai bua|tran trach|cung giai)", r"goi hon", r"ap vong", r"vong nhap", r"nhap hon",
    r"thay (nguoi|ng) la(?!\w)", r"thay nguoi mac ao",
    # EN-3d (bộ dev): hồn người mất chưa đi — "nghe tiếng bước chân… người chết chưa siêu thoát"
    r"sieu thoat", r"(la|co|thay|bi|nhu) hon ma|hon ma (theo|o|ve|nao)", r"linh hon (nguoi )?(chet|da mat|mat|qua co)", r"linh hon (ong|ba|bo|me|cha|con) .{0,10}(da mat|qua co|chet)",
]
TANG = [r"trung tang", r"nguoi (chet|mat)(?! viec| tien| tich)", r"chet trong nha", r"vua mat", r"mat .{0,12}nguoi"]


def tam_linh(t: str) -> bool:
    return co(t, TAM_LINH)


def co_tang(t: str) -> bool:
    return co(t, TANG)

# Lĩnh vực thần số → khoá lĩnh vực đời sống dùng chung cho Huyền học.
LV_DOI_SONG = {"su_nghiep": "cong_viec", "tinh_yeu": "tinh_cam", "gia_dinh": "gia_dinh",
               "con_cai": "gia_dinh", "tai_chinh": "tien_bac", "hoc_tap": "hoc_hanh"}


def dac_biet(t: str, raw: str | None = None) -> str | None:
    """'an_toan' | 'tu_choi_nhe' | 'dan_huong' | None — ưu tiên cao nhất, mọi chế độ. `raw` = câu gốc CÓ dấu (EN-1:
    phân biệt "dạy/dậy", "mát/mất"…); thiếu thì so trên câu đã bỏ dấu `t`."""
    goc = raw or t
    if _at.khung_hoang(goc) or co(t, _h.AN_TOAN):
        return "an_toan"
    if _at.tu_choi(goc) or co(t, [m for m in TU_CHOI_HH_TAT_CA if not _at.bo_qua_mo_ho(m, raw)]):
        return "tu_choi_nhe"
    if co(t, [m for m in TAM_LINH if not _at.bo_qua_mo_ho(m, raw)]):
        return "dan_huong"
    return None


def mau_tu_choi(goc: str | None, t: str, mau_chung: str, he_la_so: dict | None = None) -> str:
    """SK-1: lời đáp câu đã xếp từ chối. Triệu chứng cấp → khuyên đi khám NGAY; câu hỏi có bệnh / đoán bệnh → không
    xác nhận, không phủ nhận, gợi hệ cơ quan (theo câu hỏi, không rõ thì theo lá số `he_la_so`) + đi khám + câu không
    thay lời bác sĩ; còn lại (sống chết, chữa trị, thai nhi, may rủi…) → `mau_chung` như cũ."""
    from app.kb import suc_khoe_kb  # noqa: PLC0415
    from app.luangiai import suc_khoe_nam as skn  # noqa: PLC0415
    nhom = _at.nhom_suc_khoe(goc or t)
    if nhom == "cap_cuu":
        return suc_khoe_kb.mau("cap_cuu")
    if nhom == "nguoi_than":                 # sức khoẻ người khác: không đọc lá số của người hỏi (review SK-1)
        return f"{suc_khoe_kb.mau('nguoi_than')} {skn.mien_tru()}"
    if nhom == "hoi_benh":
        return f"{skn.doan_hoi_benh(t, he_la_so)} {skn.mien_tru()}"
    return mau_chung


def muc_suc_khoe_hoi(t: str) -> dict | None:
    """SK-1: câu sức khoẻ (không bị từ chối) nhắc một bộ phận / hệ ("hay đau dạ dày", "lo về tim") → mục gợi đi khám đúng
    hệ đó (không chép chữ người dùng, chỉ tên hệ từ KB)."""
    from app.kb import suc_khoe_kb  # noqa: PLC0415
    he = suc_khoe_kb.he_cau_hoi(t)
    if not he:
        return None
    return {"loai": "ghi_chu", "ma": "suc_khoe_hoi", "he": he["he"], "kham": he["kham"],
            "noi_dung": suc_khoe_kb.mau("hoi_benh").format(he=he["he"], kham=he["kham"]),
            **suc_khoe_kb.meta()}


def mau_dan_huong(t: str) -> str:
    """Lời dẫn hướng cho câu tâm linh; có người mất → thêm lời chia buồn đứng trước."""
    from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu dùng chung Huyền học
    m = kinhdich_kb.mau("dan_huong") or ""
    return (kinhdich_kb.mau("chia_buon") + " " + m) if co_tang(t) else m


DAC_BIET = ("an_toan", "tu_choi_nhe", "dan_huong")
# MT-ĐS B2 — kiểu hỏi "thầy bảo / người ta nói …, có đúng không": không nhận xét lời người khác, chỉ đọc lại từ lá số.
XAC_NHAN = [r"thay (boi |cung |xem )?(bao|noi|phan|ke)(?!\w)", r"(nguoi ta|ng ta|ngta) (bao|noi|keu|phan)",
            r"(?<!\w)(me|ba|ong|bo|ban|bac|chi|anh) (toi |em |minh |chong toi |ngoai )?(bao|noi|keu) (toi|em|minh|la|rang|the|so)",
            r"(?<!\w)nghe noi", r"thay boi"]


def xac_nhan(t: str) -> bool:
    return co(t, XAC_NHAN)


# MT-ĐS B3 — câu hỏi sao hạn Cửu Diệu / Bát hạn (tập quán theo tuổi). "Thái Dương / Thái Âm" trùng tên chính tinh Tử vi
# → chỉ nhận khi đi kèm "sao hạn / chiếu mệnh / cúng sao"; các tên khác đủ riêng.
SAO_HAN_KW = [r"sao han", r"sao (gi|nao) chieu (menh|mang)", r"(sao )?(la hau|ke do|thai bach|tho tu|thuy dieu|van han|van hon|moc duc)(?!\w)",
              r"(thai duong|thai am) .{0,20}(chieu menh|sao han)", r"(chieu menh|cung sao|sao han|nam nay) .{0,20}(thai duong|thai am)",
              r"(huynh tuyen|tam kheo|ngu mo|thien tinh|toan tan|thien la|dia vong|diem vuong)(?!\w)", r"han (gi|nao) nam nay",
              r"cung sao", r"dang sao", r"han hang nam", r"nam nay .{0,15}sao (gi|nao)"]


def sao_han_hoi(t: str) -> bool:
    return co(t, SAO_HAN_KW)


def muc_sao_han(nam_xem: int, nam_sinh: int, gioi_tinh: str, thang_sinh: int | None = None,
                ngay_sinh: int | None = None) -> dict:
    """Mục `sao_han` cho hỏi đáp: đọc `luangiai.tuoi_dan_gian.sao_han_luan` (tập quán, miễn phí), đứng TRƯỚC phần lá số
    của năm; lời cố định nói rõ sao hạn không tính từ lá số."""
    from app.luangiai import tuoi_dan_gian as L  # noqa: PLC0415
    kq = L.sao_han_luan(nam_xem, nam_sinh, gioi_tinh, thang_sinh, ngay_sinh)
    return {"loai": "sao_han", "nam": kq["nam"], "tuoi_mu": kq["tuoi_mu"], "gioi_tinh": gioi_tinh, "sao": kq["sao"],
            "han": kq["han"], "kim_lau": kq["kim_lau"], "tam_tai": kq["tam_tai"], "cau_co_dinh": kq["cau_co_dinh"],
            "source_id": kq["source_id"], "school_id": kq["school_id"]}


def doan_sao_han(m: dict) -> str:
    if not m.get("sao"):
        return f"Dưới 10 tuổi dân gian không xếp sao hạn (tuổi mụ năm {m['nam']['nam']} là {m['tuoi_mu']}). {m['cau_co_dinh']}"
    s, h = m["sao"], m.get("han")
    gioi = "nam" if m["gioi_tinh"] == "nam" else "nữ"
    ra = (f"Theo tục xếp theo tuổi, {gioi} {m['tuoi_mu']} tuổi mụ năm {m['nam']['can_chi']} ({m['nam']['nam']}) gặp sao "
          f"{s['ten']}" + (f", hạn {h['ten']}" if h else "") + f". {s['nghia']}")
    if h:
        ra += f" {h['nghia']}"
    ra += " Việc nên làm: " + "; ".join(v.rstrip(".") for v in s["viec"][:2]) + "."
    co = [x for x in (f"Kim lâu {m['kim_lau']}" if m.get("kim_lau") else None,
                      f"Tam tai năm thứ {m['tam_tai']}" if m.get("tam_tai") else None) if x]
    if co:
        ra += " Cùng năm theo tục: " + ", ".join(co) + "."
    return ra + " " + m["cau_co_dinh"] + " Phần dưới là điều lá số của riêng bạn nói về năm này."


def linh_vuc_doi_song(t: str) -> str | None:
    diem = {lv: dem(t, kw) for lv, kw in _h.LINH_VUC_KW.items() if lv in LV_DOI_SONG}
    tot = max(diem.values())
    if tot == 0:
        return None
    return LV_DOI_SONG[max(diem, key=lambda k: diem[k])]


def ket(goi: dict) -> dict:
    """Điền so_trong_goi để bộ kiểm tra đầu ra chặn số lạ (như thần số)."""
    return _h._ket(goi)


def nam_xem_hh(nam_cau: int | None, ngay_xem, t: str) -> tuple[int, int]:
    """EN-1 DU-2 — "năm nay" của Huyền học không phải năm dương lịch: (năm theo Lập xuân — Bát tự, phi tinh, Thái Tuế;
    năm âm lịch Việt — tuổi mụ, tuổi làm nhà, sao hạn). Câu nêu rõ "năm 20xx" → dùng đúng số đó cho cả hai; "năm sau"
    cộng 1. Hỏi ngày 20/01/2027 "năm nay" → Bính Ngọ 2026 (chưa qua Lập xuân 04/02, chưa qua Tết 06/02)."""
    import datetime as _dt  # noqa: PLC0415
    from app.calc import huyen_khong, lunar  # noqa: PLC0415
    from app.config import CALENDAR_MERIDIAN_TZ  # noqa: PLC0415
    if nam_cau:
        return nam_cau, nam_cau
    # "năm tới" và "năm tôi" cùng bỏ dấu thành "nam toi" → loại "năm tôi định / sinh / là / 36 tuổi…" (review EN-1).
    them = 1 if co(t, [r"nam sau", r"nam toi(?! (dinh|sinh|la|muon|tinh|du|\d|duoc|nay))", r"sang nam"]) else 0
    lx = huyen_khong.nam_theo_lap_xuan(_dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 5))   # 12:00 giờ VN
    am = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, CALENDAR_MERIDIAN_TZ)[2]
    return lx + them, am + them



# ---- EN-3 (mục 3): "trả lời trước" — đoạn khớp câu hỏi nhất lên đầu phần thân (chỉ đổi thứ tự).
_DAU_CO_DINH = (r"^Tứ trụ \(năm", r"^Tuổi mụ tại thời điểm xem", r"^Mệnh quái \(cung phi\) của bạn",
                r"^Theo tục xếp theo tuổi", r"^Trong \d+ tháng tới")          # MT-ĐS B3: tập quán đứng trước lá số (có chủ ý)
_CHAN = (r"^Câu hỏi để tự soi", r"^Đây là góc nhìn tham khảo", r"^Bát trạch là một trường phái", r"^Lưu ý:",
         r"^Lời này không thay", r"^Tham khảo văn hoá")
# Đoạn không bao giờ đưa lên đầu (review EN-3): tự soi / lưu ý / ranh giới giữa bài, đoạn chuyên môn (thang điểm, dụng
# thần, đại hạn của người hỏi khi câu nói về con…), dòng dữ kiện.
_KHONG_LEN = (r"^Câu hỏi để tự soi", r"^Lưu ý", r"^Phần này chỉ nói", r"^Ngũ hành", r"^Dụng thần", r"^Giai đoạn mười năm",
              r"^Năm đang xem", r"^Tứ trụ", r"^Đây là góc nhìn", r"^Tuổi mụ", r"^Đại vận", r"^Lời này không thay",
              r"^Một cách đọc thêm", r"^Một trường phái khác")          # TV-YBS: đoạn thêm luôn đứng sau câu chính
_BO_TU = {"toi", "em", "minh", "ban", "co", "khong", "nen", "the", "nao", "gi", "la", "cua", "va", "voi", "cho", "thi",
          "nay", "do", "nhu", "duoc", "hay", "bi", "se", "da", "dang", "mot", "nhung", "cac", "ve", "o", "tu", "den",
          "lam", "sao", "xem", "giup", "a", "nhe", "vay", "roi", "con", "so", "nam", "thang", "ngay", "theo", "khi"}


def _cum(t: str) -> set[str]:
    w = [x for x in t.split() if len(x) > 1]
    hai = {f"{a} {b}" for a, b in zip(w, w[1:]) if not (a in _BO_TU and b in _BO_TU)}
    return hai | {x for x in w if x not in _BO_TU and len(x) >= 4}


def tra_loi_truoc(van: str, t: str) -> str:
    """Đưa lên đầu phần thân đoạn có nhiều cụm từ của câu hỏi nhất — chỉ khi đoạn đầu thân KHÔNG chung cụm nào với câu
    hỏi và đoạn kia chung ≥ 2 cụm (thứ tự có chủ ý của từng mảng giữ nguyên khi đoạn đầu đã nói tới điều được hỏi).
    Dòng đầu cố định (tứ trụ, tuổi mụ, mệnh quái, tập quán) và phần chân giữ chỗ; không thêm, không bớt chữ."""
    if not van or not t:
        return van
    p = van.split("\n\n")
    dau = 0
    while dau < len(p) and any(re.match(m, p[dau]) for m in _DAU_CO_DINH):
        dau += 1
    chan = len(p)
    while chan > dau and any(re.match(m, p[chan - 1]) for m in _CHAN):
        chan -= 1
    than = p[dau:chan]
    if len(than) < 2:
        return van
    q = _cum(t)
    diem = [0 if any(re.match(m, x) for m in _KHONG_LEN) else len(q & _cum(chuan_hoa(x))) for x in than]
    tot = max(range(len(than)), key=lambda i: (diem[i], -i))
    if tot == 0 or diem[0] > 0 or diem[tot] < 2:
        return van
    than = [than[tot]] + than[:tot] + than[tot + 1:]
    return "\n\n".join(p[:dau] + than + p[chan:])



_THU_MUC = {"thuan": 2, "can_bang": 1, "can_chu_dong": 0}


def doan_so_nam(ds: list[dict]) -> str:
    """EN-3: "Năm 2028 (Mậu Thân) với bạn: thuận lợi — … Năm 2029 …" + một câu so khi hai năm khác mức. `ds` = mục năm
    đã chấm (nam, can_chi, muc, nhan_muc, y). Không điểm số; câu so chỉ nói năm nào thuận hơn theo mức đã có."""
    # Review EN-3: mức của dòng 10 năm là mức CHUNG của năm (mảng nổi bật nhất năm đó), không phải mức riêng của việc
    # được hỏi → nói rõ "mức chung", và câu so cũng chỉ so mức chung.
    cau = []
    for d in ds:
        y = re.sub(rf"^Năm {d['nam']},\s*", "", d.get("y") or "").strip()
        cau.append(f"Năm {d['nam']} ({d['can_chi']}) với bạn: {d['nhan_muc'].lower()}" + (f" — {y}" if y else "."))
    if len(ds) >= 2:
        tot = max(ds, key=lambda d: _THU_MUC.get(d["muc"], 1))
        if len({_THU_MUC.get(d["muc"], 1) for d in ds}) > 1:
            cau.append(f"Xét mức chung của cả năm, năm {tot['nam']} thuận hơn; riêng việc bạn hỏi, đọc thêm phần dưới "
                       "trước khi chọn.")
        else:
            cau.append("Xét mức chung, các năm bạn hỏi ngang nhau — chọn năm nào tuỳ việc bạn chuẩn bị xong lúc nào.")
    cau.insert(0, "Mức chung của từng năm theo lá số (mảng nổi bật nhất năm đó):")
    return " ".join(c if c.endswith((".", "!", "?", ":")) else c + "." for c in cau)



def nam_hoi_hh(t: str, ngay_xem, kieu_nam: str) -> list[int]:
    """EN-3: các năm câu hỏi nêu, theo ranh giới năm của mảng (`kieu_nam` = "lap_xuan" | "am"). Chỉ trả khi có năm số
    cụ thể, "năm sau", hoặc ≥ 2 năm — câu "năm nay" đơn thuần đã có lời riêng của từng mảng."""
    from app.hoidap import hieu_cau  # noqa: PLC0415
    ds = hieu_cau.thoi_gian(t, ngay_xem)
    if not ds:
        return []
    ds = [x for x in ds if not x.get("thang")]          # câu chỉ hỏi tháng không thành đoạn "mức chung của năm"
    if not ds:
        return []
    lx, am = nam_xem_hh(None, ngay_xem, "")             # năm đang đi theo ranh giới của mảng (không cộng "năm sau")
    goc = lx if kieu_nam == "lap_xuan" else am
    ra = []
    for x in ds:
        if x.get("tuong_doi"):
            ra.append(goc + (1 if x["tuong_doi"] == "nam_sau" else 0))
        elif "lech" in x:                               # "ba năm tới", "2 năm nữa": tính từ năm đang đi của mảng
            ra.append(goc + x["lech"])
        else:
            ra.append(x["nam"])
    ra = sorted(set(ra))
    if len(ds) == 1 and ds[0].get("tuong_doi") == "nam_nay":
        return []
    return ra



def hoi_lai_neu(pl: dict, mo_dun: str) -> dict | None:
    """EN-3: khối "hỏi lại" khi câu rơi về mặc định (cờ `do_tin_thap`) và đang trả lời bình thường."""
    if not pl.get("do_tin_thap") or pl.get("xu_ly") not in ("tra_loi", "tra_loi_kem_luu_y"):
        return None
    from app.hoidap import hieu_cau  # noqa: PLC0415
    return hieu_cau.hoi_lai(mo_dun)


def them_so_nam(goi: dict, dong: list[dict], nam_hoi: list[int], bo_qua_dau: tuple[str, ...]) -> None:
    """EN-3: chèn mục `so_nam` (mức chung từng năm được hỏi, lấy từ dòng 10 năm của báo cáo — một nguồn) ngay sau các
    mục đầu cố định `bo_qua_dau` (tứ trụ, tập quán sao hạn). Năm ngoài dòng 10 năm bỏ qua."""
    from app.calc import lunar  # noqa: PLC0415
    theo = {d["nam"]: d for d in dong}
    ds = [theo[y] for y in nam_hoi if y in theo]
    if not ds:
        return
    vt = 0
    while vt < len(goi["muc"]) and vt < 2 and goi["muc"][vt]["loai"] in bo_qua_dau:
        vt += 1
    goi["muc"].insert(vt, {"loai": "so_nam", "nam": [
        {"nam": d["nam"], "can_chi": " ".join(lunar.can_chi_nam(d["nam"])), "muc": d["muc"], "nhan_muc": d["nhan_muc"],
         "y": d["y"], "mang": d.get("mang")} for d in ds]})
    ket(goi)


# ---- EN-5.4: câu quyết định có khung thời gian → cửa sổ tháng (một bộ tính: hàm tháng của Thời gian tới) ----------
def them_cua_so(goi: dict, pl: dict, mo_dun: str, sinh: dict, ngay_xem, ls: dict | None = None,
                bo_qua_dau: tuple[str, ...] = ()) -> None:
    """Chèn mục `cua_so` khi câu hỏi là "có nên / khi nào" kèm khung "N tháng tới"; không có khung → không làm gì."""
    from app.hoidap import hieu_cau  # noqa: PLC0415
    from app.luangiai import cua_so  # noqa: PLC0415
    t = pl["cau_chuan_hoa"]
    if pl.get("xu_ly") in DAC_BIET or goi.get("can_them") or not goi["muc"] or hieu_cau.kieu(t) not in ("co_nen", "khi_nao"):
        return
    n = hieu_cau.khung_thang(t, ngay_xem, pl.get("cau_goc"))
    if not n:
        return
    try:
        cs = cua_so.lap(mo_dun, sinh, ngay_xem, n, ls=ls)
    except Exception:  # noqa: BLE001 — cửa sổ là phần đọc thêm; lỗi không làm hỏng câu trả lời
        return
    if not cs["thang"]:
        return
    vt = 0
    while vt < len(goi["muc"]) and vt < 2 and goi["muc"][vt]["loai"] in bo_qua_dau:
        vt += 1
    goi["muc"].insert(vt, {"loai": "cua_so", **cs})
    ket(goi)


def _ten_thang_cs(x: dict) -> str:
    if "(" in x["ten"]:
        return x["ten"]
    a, b = x["tu"].split("-"), x["den"].split("-")
    return f"{x['ten']} ({int(a[2])}/{int(a[1])}–{int(b[2])}/{int(b[1])})"


def doan_cua_so(m: dict) -> str:
    th, ch = m["thuan"], m["cham"]
    s = (f"Trong {m['so_thang']} tháng tới, lá số không trả lời có hay không cho quyết định của bạn — nó cho biết "
         "nhịp từng tháng để bạn chọn lúc làm phần chính. ")
    if th:
        s += "Tháng thuận hơn: " + "; ".join(_ten_thang_cs(x) for x in th) + ". "
    if ch:
        s += "Tháng nên đi chậm: " + "; ".join(_ten_thang_cs(x) for x in ch) + ". "
    if not th and not ch:
        s += "Không có tháng nào nổi hẳn — nhịp khá đều, chọn lúc bạn chuẩn bị kịp nhất. "
    elif len(th) + len(ch) < len(m["thang"]):
        s += "Các tháng còn lại nhịp khá đều. "
    noi = "trong tháng thuận" if th else "trong những tháng nhịp đều"
    s += (f"Nếu đã quyết, làm phần chính (ký, nộp, chuyển, ra mắt) {noi}"
          + ("; tháng đi chậm dùng để chuẩn bị, rà lại điều kiện, hỏi thêm người có kinh nghiệm." if ch else "."))
    return s


def khop_dau(raw: str | None, t: str, rx_co_dau: list[str], rx_khong_dau: list[str]) -> bool:
    """EN-5 (code-review): thuật ngữ trùng chữ thường khi bỏ dấu ("mệnh cung"/"mệnh cũng", "Đà La"/"đã là", "Thiên Y"/
    "thiện ý") — người dùng gõ CÓ dấu thì so trên câu có dấu (`rx_co_dau`), gõ không dấu thì dùng mẫu chặt hơn
    (`rx_khong_dau`, có ngữ cảnh) trên câu đã chuẩn hoá `t`."""
    if raw:
        cd, _, co_dau = _at._hai_ban(raw)
        if co_dau:
            return co(cd, rx_co_dau)
    return co(t, rx_khong_dau)
