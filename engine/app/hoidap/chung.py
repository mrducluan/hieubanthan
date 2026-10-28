# -*- coding: utf-8 -*-
"""Phần dùng chung cho mọi module hỏi đáp Huyền học (RULES, không LLM).

Tái dùng bộ chuẩn hoá và danh sách an toàn/từ chối của thần số (app.luangiai.hoi)
— không sửa chúng — và thêm các mẫu riêng của Huyền học.
"""
from __future__ import annotations

from app.luangiai import hoi as _h

chuan_hoa = _h.chuan_hoa
co = _h._co
dem = _h._dem

AN_TOAN_THEM = [r"chang con ly do", r"con ly do de song", r"ket thuc som", r"muon bien mat",
                r"danh dap", r"khong thiet song"]
# MT-ĐS B0 — ý tự hại nói bằng ngôn ngữ huyền học ("mệnh có Địa Kiếp, chắc tôi nên chết đi cho đỡ khổ", "năm tuổi là nên
# buông tay", "phòng hướng nào nhảy xuống đỡ đau"). Luật: ý tự hại ở BẤT KỲ đâu trong câu thắng mọi từ khoá chuyên môn.
AN_TOAN_HH = [
    r"(nen|muon|de|thoi|thi) chet (di|cho|quach|luon|phut)", r"chet di cho", r"chet cho (xong|roi|do)",
    r"muon ket thuc", r"ket thuc (cuoc doi|tat ca|di|cho xong|het)", r"song lam gi nua", r"chan song",
    r"(toi|em|minh|con) bien mat", r"bien mat (thi|cho|di)", r"la nen buong tay", r"het chiu noi",
    r"lam luon cho xong", r"(uong|nuot) het (thuoc|vi)", r"nhay (xuong|lau|cau)", r"tu thieu", r"cat tay",
    r"tu hai (ban than|minh)", r"tu lam dau", r"khong cho nua dau", r"bo di mai mai", r"luc toi ra di",
    r"(toi|em|minh) (cu )?muon di theo", r"het muon chet", r"muon chet", r"nghi den (chuyen )?(tu tu|chet)",
    r"khong muon song",
]
# Từ chối nhẹ: bộ Thần số dùng chung TRỪ các cụm Huyền học trả lời được theo kiểu "định hướng" (MT-ĐS mục 4):
# "chắc chắn" (B0); "tai nạn", "thắng kiện" (B1: trả lời bằng mảng đi lại / giấy tờ + lưu ý, không có/không).
_BO_CHAN_HH = {r"chac chan", r"tai nan", r"thang kien"}
TU_CHOI_THEM = [r"so de", r"song duoc bao lau", r"nao chet", r"tho bao nhieu", r"doan benh",
                r"benh gan", r"yem bua", r"chua duoc benh", r"nen tuyen", r"tuyen nhan vien",
                r"de quyet dinh tuyen", r"chon so lo", r"so lo"]
# MT-ĐS B0 — thọ / chết / sống được không (kể cả người thân, thai nhi), tên bệnh & bộ phận, lô đề, nhân sự trá hình.
TU_CHOI_HH = [
    r"tho (duoc )?bao nhieu", r"song (duoc )?(bao lau|den bao nhieu|bao nhieu tuoi|may nam|duoc may)",
    r"(con|be|no|ong|ba|bo|me|toi|minh|em|chau|vo|chong) (co )?song duoc (khong|ko)", r"co qua khoi",
    r"(\d{2,3} tuoi|ong noi|ong ngoai|ba noi|ba ngoai|cu nha).{0,40}co (di|mat|ra di) (khong|ko)",
    r"ket thuc doi", r"bat dac ky tu", r"(de|hay|phai) chet(?!\w)", r"so chet (tre|som|bat)", r"chet som", r"chet tre",
    r"nam nao .{0,30}co nguoi mat", r"(thai|con|be) .{0,25}di tat", r"di tat (bam sinh|thai)", r"bi di tat", r"tai bien", r"tram cam", r"tieu duong", r"benh (phoi|tim|gan|than|xuong|mau)",
    r"bi than yeu", r"(gan|than|tim|phoi|ung thu|da day) hay (gan|than|tim|phoi|ung thu|da day)", r"uong thuoc gi",
    r"khoi (duoc )?benh", r"choi (lo|de)(?!\w)", r"so chot", r"danh con (gi|so)", r"so may de trung", r"danh .{0,12}(de|cho) trung",
    r"lam hr|(?<!\w)hr(?!\w)", r"chu (cty|cong ty|doanh nghiep).{0,40}(ung vien|nhan vien|nhan|tuyen)",
    r"nhan vien .{0,40}(nghi viec|trung thuc|giu|chon|nhan|sa thai)", r"tuyen (ke toan|nhan vien|nguoi|nhan su|thu ky)",
    r"ai trung thuc", r"(chon|giu|loai) nhan vien",
]
TU_CHOI_HH_TAT_CA = [m for ds in _h.TU_CHOI.values() for m in ds if m not in _BO_CHAN_HH] + TU_CHOI_THEM + TU_CHOI_HH
# MT-ĐS B1 — câu tâm linh (vong, căn, ma, bùa, trùng tang, nghiệp…): KHÔNG luận, KHÔNG nối sang lá số (nối = ngầm xác
# nhận có vong), trả lời bằng lời dẫn hướng `mau.dan_huong` (+ `chia_buon` khi có người mất). Căn đồng là tín ngưỡng
# được công nhận — không nói "không có", chỉ nói hệ thống không xem.
TAM_LINH = [
    # "căn" và "cần" cùng bỏ dấu thành "can" → chỉ bắt "nặng căn", "nhiều căn", "căn đồng/cô/cậu/quan/tu".
    r"(?<!\w)vong (theo|nhap|vao|goi|am|linh|hon)", r"co vong", r"can dong", r"(?<!\w)(nang|nhieu) can(?!\w)",
    r"(co|la|phai) can (co|cau|quan|tu|ong|nang)(?!\w)", r"trinh dong", r"mo phu", r"(co|thay|nhin thay|la|hay co) ma (khong|ko|k)(?!\w)",
    r"(co|thay|hay la|la) ma$", r"nhin thay ma", r"bong de", r"(bo|yem|giai|chon|dinh|bi) bua", r"bua ngai", r"(?<!\w)ngai nap",
    r"trung tang", r"duyen am", r"tien kiep", r"nghiep (nang|chuong|bao)", r"tran trach", r"am binh",
    r"(moi|nho) thay (ve|cung|giai|xem|tran)", r"(di xem|xem|tim|gap) thay (bua|boi|giai|tran|cung sao|cung giai)", r"thay (ve )?(giai bua|tran trach|cung giai)", r"goi hon", r"ap vong", r"vong nhap", r"nhap hon",
    r"thay (nguoi|ng) la(?!\w)", r"thay nguoi mac ao",
]
TANG = [r"trung tang", r"nguoi (chet|mat)(?! viec| tien| tich)", r"chet trong nha", r"vua mat", r"mat .{0,12}nguoi"]


def tam_linh(t: str) -> bool:
    return co(t, TAM_LINH)


def co_tang(t: str) -> bool:
    return co(t, TANG)

# Lĩnh vực thần số → khoá lĩnh vực đời sống dùng chung cho Huyền học.
LV_DOI_SONG = {"su_nghiep": "cong_viec", "tinh_yeu": "tinh_cam", "gia_dinh": "gia_dinh",
               "con_cai": "gia_dinh", "tai_chinh": "tien_bac", "hoc_tap": "hoc_hanh"}


def dac_biet(t: str) -> str | None:
    """'an_toan' | 'tu_choi_nhe' | 'dan_huong' | None — ưu tiên cao nhất, mọi chế độ."""
    if co(t, _h.AN_TOAN) or co(t, AN_TOAN_THEM) or co(t, AN_TOAN_HH):
        return "an_toan"
    if co(t, TU_CHOI_HH_TAT_CA):
        return "tu_choi_nhe"
    if tam_linh(t):
        return "dan_huong"
    return None


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
