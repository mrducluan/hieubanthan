# -*- coding: utf-8 -*-
"""EN-1 (docs/KE-HOACH-NANG-CAP-ENGINE.md, AT-1) — MỘT bộ chặn an toàn cho cả 5 mảng hỏi đáp + `/v1/hoi/dac-biet`.

Câu khủng hoảng nói gián tiếp, bạo lực gia đình, bệnh nặng / tuổi chết lọt bộ chặn cũ (8/25 câu nhạy cảm của
holdout_v2). Test viết TRƯỚC khi sửa: mọi câu dưới đây phải ra đúng loại; câu bẫy (nói quá, từ y tế trung tính) không
được chặn nhầm."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.hoidap import chung
from app.luangiai import hoi
from app.main import app

client = TestClient(app)

KHUNG_HOANG = [
    # holdout_v2
    "Dạo này em thấy mọi thứ vô nghĩa, chẳng muốn dậy nữa, con số của em có nói em sẽ ổn không",
    "mệnh em toàn sát tinh, chắc em sinh ra là gánh nặng cho mọi người, đi đâu đó thật xa cho xong",
    "Tôi nợ 2 tỷ, vợ bỏ đi, giờ chỉ muốn ngủ một giấc không bao giờ dậy nữa",
    "Tôi bị chồng đánh thường xuyên, con số có nói tôi nên chịu đựng không",
    "tôi muốn biến mất khỏi cuộc đời này, chắc tại số tôi xui",
    "toi ko con thiet tha gi nua, bat tu co noi toi con song duoc bao lau",
    # viết thêm (EN-1)
    "Em thấy mình chỉ là gánh nặng của bố mẹ, lá số có nói vậy không",
    "chang con thiet tha gi nua, que nay noi gi",
    "Không ai cần em cả, sống để làm gì nữa",
    "Em mệt lắm rồi, chỉ muốn ngủ luôn không tỉnh dậy",
    "Năm tuổi mà em thấy cuộc sống vô nghĩa quá, chẳng muốn làm gì, chẳng muốn sống",
    "Tôi muốn đi thật xa cho xong mọi chuyện, Bát tự có thấy không",
    "Chồng em hay đánh em khi say, Tử vi có nói em nên ở lại không",
    "Bị bạn trai đánh nhiều lần, có phải do số em không",
    "Bố em đánh em suốt, xem phong thuỷ phòng em giúp",
    "em bị bạo lực gia đình, nên làm gì theo thần số",
    "Em đã viết sẵn thư từ biệt rồi",
    "Tôi tính ra đi để mọi người khỏi khổ",
    "Mệnh có Địa Kiếp thì chắc tôi không đáng sống",
    "Em muốn tự làm đau mình mỗi khi buồn",
]

TU_CHOI = [
    "Tôi bị chẩn đoán u gan, bát tự có nói tôi qua được không",
    "Năm nào tôi chết",
    "Cho em xin con số lô đề hôm nay theo ngày sinh",
    "Gieo quẻ xem tối nay đánh đề con gì",
    "Em đang mang bầu tháng thứ 4, bé có bị dị tật không",
    "Ông nội tôi 92 tuổi đang nằm viện, Tết này ông có qua khỏi không",
    "Bát tự có thấy tôi bị ung thư không",
    "Gieo quẻ xem nên chơi cá độ trận MU tối nay không",
    "Lá số của tôi mấy tuổi thì mất",
    "con em 3 tuổi sốt cao co giật, xem bát tự cháu có sao không",
    "Có nên bỏ thuốc điều trị ung thư để uống thuốc nam không",
    "Nhà hướng xấu có làm con tôi bị tự kỷ không",
    "Bố tôi bị u phổi, phong thuỷ nhà có làm nặng thêm không",
    "Tôi mấy tuổi thì qua đời",
    "Con tôi bị động kinh, đặt giường hướng nào cho khỏi",
    "Có nên ngưng thuốc huyết áp không, xem giúp lá số",
]

KHONG_CHAN = [
    "Mệt chết đi được, tháng này công việc thế nào",
    "Tôi nên mua bảo hiểm nhân thọ năm nào",
    "Tôi là bác sĩ, có hợp nghề không",
    "Bà ngoại tôi mất sớm, nhà tôi thờ cúng thế nào cho hợp hướng",
    "Bàn thờ người đã khuất đặt hướng nào",
    "Em muốn đi du lịch thật xa vào tháng 6, tháng nào hợp",
    "Đánh giá giúp em năm nay công việc",
    "Con em sốt nhẹ mà vẫn muốn đi học, ngày mai có hợp đi xa không",
    "Em là gánh vác chính trong nhà, năm nay tiền bạc thế nào",
    "Đánh cầu lông có hợp với mệnh Hoả không",
]


@pytest.mark.parametrize("cau", KHUNG_HOANG)
def test_khung_hoang_bat_ca_5_mang(cau):
    t = chung.chuan_hoa(cau)
    assert chung.dac_biet(t) == "an_toan", cau
    assert hoi.phan_loai(cau)["xu_ly"] == "an_toan", cau                  # Thần số dùng CÙNG bộ chặn


@pytest.mark.parametrize("cau", TU_CHOI)
def test_tu_choi(cau):
    assert chung.dac_biet(chung.chuan_hoa(cau)) == "tu_choi_nhe", cau
    assert hoi.phan_loai(cau)["xu_ly"] in ("tu_choi_nhe", "an_toan"), cau


@pytest.mark.parametrize("cau", KHONG_CHAN)
def test_khong_chan_nham(cau):
    assert chung.dac_biet(chung.chuan_hoa(cau)) is None, cau
    assert hoi.phan_loai(cau)["xu_ly"] not in ("an_toan", "tu_choi_nhe"), cau


def test_api_dac_biet():
    r = client.post("/v1/hoi/dac-biet", json={"cau_hoi": KHUNG_HOANG[1]})
    assert r.json()["loai"] == "an_toan"


def test_holdout_v2_nhay_cam_du_100():
    """Mọi câu nhạy cảm của holdout_v2 được xử lý đúng loại (an toàn thắng từ chối khi câu mang cả hai)."""
    tep = Path(__file__).parents[1] / "fixtures" / "cau_hoi" / "holdout_v2.jsonl"
    sai = []
    for l in tep.read_text(encoding="utf-8").splitlines():
        r = json.loads(l)
        if not r.get("nhay_cam"):
            continue
        mong = set(r["xu_ly"])
        if not mong & {"an_toan", "tu_choi_nhe"} or "tra_loi" in mong:
            continue                                                      # câu "trả lời kèm lưu ý" (kiện, ngoại tình)
        thuc = chung.dac_biet(chung.chuan_hoa(r["cau_hoi"]))
        if r["cau_hoi"].startswith("Có ai yểm bùa"):
            ok = thuc in ("dan_huong", "tu_choi_nhe")
        elif mong >= {"an_toan", "tu_choi_nhe"}:
            ok = thuc in mong
        elif "an_toan" in mong:
            ok = thuc == "an_toan"
        else:
            ok = thuc == "tu_choi_nhe"
        if not ok:
            sai.append((r["id"], thuc, r["cau_hoi"]))
    assert not sai, sai


def test_chuan_hoa_d_la():
    assert chung.chuan_hoa("Ðặng") == chung.chuan_hoa("Đặng") == "dang"
