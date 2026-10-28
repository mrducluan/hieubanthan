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
# "chắc chắn" (B0) — "tai nạn", "thắng kiện" chuyển ở B1 khi có lời định hướng.
_BO_CHAN_HH = {r"chac chan"}
TU_CHOI_THEM = [r"so de", r"song duoc bao lau", r"nao chet", r"tho bao nhieu", r"doan benh",
                r"benh gan", r"yem bua", r"chua duoc benh", r"nen tuyen", r"tuyen nhan vien",
                r"de quyet dinh tuyen", r"chon so lo", r"so lo"]
# MT-ĐS B0 — thọ / chết / sống được không (kể cả người thân, thai nhi), tên bệnh & bộ phận, lô đề, nhân sự trá hình.
TU_CHOI_HH = [
    r"tho (duoc )?bao nhieu", r"song (duoc )?(bao lau|den bao nhieu|bao nhieu tuoi|may nam|duoc may)",
    r"(con|be|no|ong|ba|bo|me|toi|minh|em|chau|vo|chong) (co )?song duoc (khong|ko)", r"co qua khoi",
    r"(\d{2,3} tuoi|ong noi|ong ngoai|ba noi|ba ngoai|cu nha).{0,40}co (di|mat|ra di) (khong|ko)",
    r"ket thuc doi", r"bat dac ky tu", r"(so|de|hay|phai) chet(?!\w)", r"chet som", r"chet tre",
    r"nam nao .{0,30}co nguoi mat", r"di tat", r"tai bien", r"tram cam", r"tieu duong", r"benh (phoi|tim|gan|than|xuong|mau)",
    r"than yeu", r"(gan|than|tim|phoi|ung thu|da day) hay (gan|than|tim|phoi|ung thu|da day)", r"uong thuoc gi",
    r"khoi (duoc )?benh", r"choi (lo|de)(?!\w)", r"so chot", r"danh con (gi|so)", r"so may de trung", r"(de|cho|de ma) trung",
    r"lam hr|(?<!\w)hr(?!\w)", r"chu (cty|cong ty|doanh nghiep).{0,40}(ung vien|nhan vien|nhan|tuyen)",
    r"nhan vien .{0,40}(nghi viec|trung thuc|giu|chon|nhan|sa thai)", r"tuyen (ke toan|nhan vien|nguoi|nhan su|thu ky)",
    r"ai trung thuc", r"(chon|giu|loai) nhan vien",
]
TU_CHOI_HH_TAT_CA = [m for ds in _h.TU_CHOI.values() for m in ds if m not in _BO_CHAN_HH] + TU_CHOI_THEM + TU_CHOI_HH

# Lĩnh vực thần số → khoá lĩnh vực đời sống dùng chung cho Huyền học.
LV_DOI_SONG = {"su_nghiep": "cong_viec", "tinh_yeu": "tinh_cam", "gia_dinh": "gia_dinh",
               "con_cai": "gia_dinh", "tai_chinh": "tien_bac", "hoc_tap": "hoc_hanh"}


def dac_biet(t: str) -> str | None:
    """'an_toan' | 'tu_choi_nhe' | None — ưu tiên cao nhất, mọi chế độ."""
    if co(t, _h.AN_TOAN) or co(t, AN_TOAN_THEM) or co(t, AN_TOAN_HH):
        return "an_toan"
    if co(t, TU_CHOI_HH_TAT_CA):
        return "tu_choi_nhe"
    return None


def linh_vuc_doi_song(t: str) -> str | None:
    diem = {lv: dem(t, kw) for lv, kw in _h.LINH_VUC_KW.items() if lv in LV_DOI_SONG}
    tot = max(diem.values())
    if tot == 0:
        return None
    return LV_DOI_SONG[max(diem, key=lambda k: diem[k])]


def ket(goi: dict) -> dict:
    """Điền so_trong_goi để bộ kiểm tra đầu ra chặn số lạ (như thần số)."""
    return _h._ket(goi)
