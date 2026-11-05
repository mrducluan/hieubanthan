# Tên việc Nên / Kiêng trong Xem ngày tốt (HL-TEN, 2026-11-05)

Bảng nghi/kỵ của *Hiệp kỷ biện phương thư* ghi việc của xã hội nông nghiệp xưa (lùng bắt, săn bắn, đặt cối…).
Trang hiển thị **việc tương ứng ngày nay** theo đúng bản chất việc xưa; cách sách xưa gọi giữ ở trường `ten_goc`
(chỉ hiện trong "Giải nghĩa các việc nên / kiêng"). Phép tính và luật chọn ngày **không đổi** — chỉ đổi chữ.

Nguồn: `engine/app/kb/data/hoang_lich_kb.json` (`nghi_ky`, nháp — chờ người duyệt). Sửa tên = sửa KB qua PR.

## Nguyên tắc đối chiếu

1. Giữ bản chất việc: việc xưa làm gì thì tên mới là việc ngày nay cùng mục đích (捕捉 bắt thú phá hoại → bắt chuột, diệt côn trùng).
2. Không mở rộng nghĩa tuỳ tiện (đi thuyền không thành "đi máy bay"; khai trương không thành "đầu tư").
3. Việc nghi lễ còn sống trong đời người Việt (cúng giỗ, ăn hỏi, cải táng) giữ tên quen, chỉ bỏ chữ Hán Việt khó hiểu.
4. Hai việc khác nhau không được trùng chữ (Động thổ làm nhà ≠ Đào huyệt, làm mộ).
5. Việc y tế và kiện tụng luôn kèm lời nhắc: không hoãn đi khám, thời hạn pháp lý không chờ ngày đẹp.
6. Tên chip ≤ 26 ký tự (test `test_ten_viec_theo_loi_ngay_nay`); chi tiết ở `nghia`.

## Bảng đổi tên (81 mục)

| Chữ Hán | Tên cũ | Tên mới | Nghĩa ngày nay |
|---|---|---|---|
| 祭祀 | Cúng tế | **Cúng lễ** | cúng gia tiên, làm giỗ, đi lễ chùa, đền |
| 塑绘 | Tạc, vẽ tượng | **Tô, đắp tượng thờ** | đắp, tô sơn tượng thờ, vẽ tranh thờ |
| 齐醮 | Lập đàn chay | **Lễ cầu an, cầu siêu** | làm lễ chay cầu an, cầu siêu ở chùa hoặc tại nhà |
| 斋醮 | Lập đàn chay | **Lễ cầu an, cầu siêu** | làm lễ chay cầu an, cầu siêu ở chùa hoặc tại nhà |
| 造庙 | Dựng đền miếu | **Xây sửa đình, chùa** | xây, sửa đình, chùa, miếu, nhà thờ họ |
| 谢土 | Tạ thổ | **Lễ tạ đất** | lễ tạ đất đai sau khi xây sửa nhà xong |
| 订婚 | Đính hôn | **Ăn hỏi** | lễ ăn hỏi, đính hôn |
| 纳采 | Nạp thái | **Dạm ngõ** | nhà trai sang đặt vấn đề, mang lễ dạm ngõ |
| 问名 | Vấn danh | **Gặp mặt hai gia đình** | hai nhà gặp nhau, hỏi tên tuổi, ngày sinh đôi bên |
| 纳婿 | Kén rể | **Đón rể về ở** | chàng rể về ở bên nhà vợ (ở rể) |
| 合帐 | Treo màn cưới | **Sắp phòng cưới** | treo màn, trải chăn, trang trí phòng tân hôn |
| 订盟 | Kết ước | **Đính ước** | hai bên hứa hẹn, giao ước (thường là ước hôn) |
| 进人口 | Nhận người | **Đón người về nhà** | nhận con nuôi, đón người thân về ở cùng, nhận người giúp việc |
| 裁衣 | Cắt may áo | **May, sắm đồ mới** | cắt may hoặc mua quần áo mới (áo cưới, đồ Tết) |
| 挽面 | Se mặt | **Chăm sóc da mặt** | se mặt, làm đẹp da mặt, đi spa |
| 开容 | Sửa dung nhan | **Làm đẹp** | chỉnh trang dung mạo, trang điểm, làm tóc, làm da |
| 破土 | Động thổ (mộ) | **Đào huyệt, làm mộ** | đào đất làm huyệt, xây mộ — khác với động thổ làm nhà |
| 立碑 | Dựng bia | **Dựng bia mộ** | dựng, thay bia mộ |
| 成服 | Mặc đồ tang | **Để tang** | mặc đồ tang, phát tang |
| 除服 | Bỏ đồ tang | **Mãn tang** | bỏ đồ tang, xả tang |
| 开生坟 | Làm sinh phần | **Xây mộ sẵn** | xây sẵn phần mộ khi người còn sống |
| 移柩 | Di quan | **Đưa linh cữu** | chuyển linh cữu, di quan |
| 普渡 | Cúng thí thực | **Cúng cô hồn** | cúng thí thực, phổ độ (như dịp rằm tháng Bảy) |
| 入宅 | Nhập trạch | **Về nhà mới** | dọn vào ở nhà mới, làm lễ nhập trạch |
| 开井开池 | Đào giếng, ao | **Khoan giếng, đào ao** | khoan giếng, đào ao, xây bể nước |
| 作陂放水 | Đắp bờ tháo nước | **Làm thuỷ lợi** | đắp bờ, tháo nước cho ruộng, ao hồ |
| 破屋 | Phá nhà | **Phá nhà cũ** | dỡ, phá nhà cũ để làm lại |
| 坏垣 | Phá tường | **Đập tường** | đập, phá tường |
| 伐木做梁 | Chặt cây làm xà | **Chuẩn bị gỗ làm nhà** | chặt cây, xẻ gỗ, làm xà kèo cho nhà |
| 解除 | Giải trừ | **Dọn dẹp, tẩy uế** | dọn dẹp, làm sạch nhà, làm lễ giải trừ |
| 开柱眼 | Đục lỗ cột | **Khoan, đục cột** | đục mộng, khoan lỗ cột kèo |
| 穿屏扇架 | Lắp vách, khung | **Lắp vách, khung cửa** | dựng vách ngăn, lắp khung cửa, cửa sổ |
| 塞穴 | Lấp hang | **Bịt lỗ, chống chuột** | bịt lỗ tường, lấp hang chuột, tổ kiến, chống mối |
| 平治道涂 | Sửa đường | **Làm đường, sân** | san lấp, làm đường, đổ sân, lát lối đi |
| 造桥 | Bắc cầu | **Làm cầu** | xây, bắc cầu |
| 筑堤 | Đắp đê | **Đắp đê, kè bờ** | đắp đê, kè bờ ao, bờ sông |
| 开池 | Đào ao | **Đào ao, làm hồ** | đào ao, làm hồ cá, bể nước |
| 伐木 | Chặt cây | **Chặt, tỉa cây** | đốn, chặt hoặc tỉa cây lớn |
| 开渠 | Đào mương | **Làm mương, cống** | khơi mương, làm rãnh, cống thoát nước |
| 掘井 | Đào giếng | **Khoan giếng** | khoan, đào giếng nước |
| 扫舍 | Quét dọn nhà | **Tổng vệ sinh nhà** | quét dọn, lau dọn nhà cửa |
| 造畜稠 | Làm chuồng | **Làm chuồng trại** | làm chuồng trại vật nuôi, nhà cho thú cưng |
| 作梁 | Làm xà | **Làm xà, dầm** | làm xà, đổ dầm nhà |
| 修饰垣墙 | Trang trí tường | **Sơn sửa tường** | sơn, sửa, trang trí tường, hàng rào |
| 架马 | Dựng giàn | **Dựng giàn giáo** | dựng giàn giáo, khung tạm để thi công |
| 挂匾 | Treo biển | **Treo biển hiệu** | treo biển hiệu cửa hàng, công ty |
| 纳财 | Nạp tài | **Thu tiền, nhập hàng** | thu tiền, nhận tiền hàng, nhập hàng, thu nợ |
| 求财 | Cầu tài | **Lo việc làm ăn** | bàn chuyện làm ăn, tìm khách, tìm cơ hội kiếm tiền |
| 开仓 | Mở kho | **Mở kho, xuất hàng** | mở kho, xuất hàng ra bán |
| 置产 | Mua tài sản | **Mua nhà đất, tài sản** | mua nhà đất, sắm tài sản lớn |
| 雇佣 | Thuê người | **Thuê người làm** | tuyển, thuê người làm |
| 出货财 | Xuất hàng | **Xuất hàng, chi tiền** | giao hàng, xuất tiền, chi khoản lớn |
| 造车器 | Đóng xe, dụng cụ | **Làm xe, dụng cụ** | chế tạo, lắp ráp xe, máy, nông cụ, dụng cụ nghề |
| 经络 | Kéo sợi, dệt | **Dệt may** | kéo sợi, dệt vải, may mặc |
| 酝酿 | Ủ rượu, làm tương | **Làm đồ lên men** | nấu rượu, làm tương, muối dưa, ủ men |
| 作染 | Nhuộm | **Nhuộm vải** | nhuộm vải, nhuộm sợi |
| 鼓铸 | Đúc kim loại | **Rèn đúc kim loại** | rèn, đúc, hàn, gia công kim loại |
| 造船 | Đóng thuyền | **Đóng tàu thuyền** | đóng, sửa tàu thuyền |
| 割蜜 | Lấy mật | **Lấy mật ong** | thu hoạch mật ong |
| 栽种 | Trồng trọt | **Trồng cây** | gieo hạt, trồng cây, trồng rau |
| 取渔 | Đánh cá | **Đánh bắt cá** | đánh bắt cá, tát ao, thu hoạch thuỷ sản |
| 结网 | Đan lưới | **Sửa đồ nghề đánh bắt** | đan lưới, làm chài, sửa ngư cụ |
| 安碓磑 | Đặt cối | **Lắp máy xay, cối** | đặt cối giã, cối xay; nay là lắp máy xay xát, máy chế biến |
| 习艺 | Học nghề | **Học nghề, kỹ năng** | học nghề, học một kỹ năng mới |
| 见贵 | Gặp người quan trọng | **Gặp sếp, đối tác** | gặp cấp trên, đối tác, người có thể giúp mình; đi phỏng vấn |
| 乘船 | Đi thuyền | **Đi tàu thuyền** | đi tàu, thuyền, du lịch sông nước, biển |
| 渡水 | Qua sông nước | **Đi đường thuỷ** | qua sông, đi đường thuỷ |
| 出行 | Xuất hành | **Xuất hành, đi xa** | lên đường đi xa, đi công tác, du lịch |
| 剃头 | Cạo đầu | **Cắt tóc máu, xuống tóc** | cạo tóc: cắt tóc máu cho bé, xuống tóc đi tu |
| 整手足甲 | Cắt móng | **Cắt sửa móng** | cắt, sửa móng tay chân, làm móng |
| 捕捉 | Lùng bắt | **Bắt chuột, diệt côn trùng** | diệt chuột, trừ sâu bọ hại, bắt vật nuôi sổng chuồng |
| 畋猎 | Săn bắn | **Đi câu, đặt bẫy** | đi câu, đặt bẫy, đánh bắt ngoài trời |
| 教牛马 | Luyện vật nuôi | **Huấn luyện vật nuôi** | tập, dạy trâu bò, chó, mèo, thú cưng |
| 赴任 | Nhậm chức | **Nhận việc mới** | ngày đầu đi làm, nhận chức, chuyển công tác |
| 求医 | Đi khám bệnh | **Khám chữa bệnh** | bắt đầu một đợt khám, chữa bệnh có thể sắp xếp trước |
| 词讼 | Kiện tụng | **Khởi kiện, tranh chấp** | nộp đơn kiện, giải quyết tranh chấp |
| 立券 | Ký kết | **Ký giấy tờ** | ký hợp đồng, làm giấy tờ |
| 安机 | Lắp máy | **Lắp máy móc** | lắp đặt, chạy thử máy móc, thiết bị |
| 馀事勿取 | Ngoài việc nêu thì nên hoãn | **Việc khác nên hoãn** | sách lịch khuyên chỉ làm các việc ghi ở mục Nên, việc khác để ngày khác |
| 断蚁 | Diệt mối kiến | **Diệt mối, kiến** | phun thuốc diệt mối, kiến, mọt |
| 归岫 | Về nơi cũ | **Về quê, về nhà cũ** | trở về quê, về chốn cũ |

## Việc có lời nhắc (`luu_y`)

| Chữ Hán | Tên | Lời nhắc |
|---|---|---|
| 针灸 | Châm cứu | Bệnh cần khám thì đi ngay, không chờ ngày đẹp; sách lịch chỉ là tập quán chọn ngày cho việc sắp xếp được, không thay lời bác sĩ. |
| 求医 | Khám chữa bệnh | Bệnh cần khám thì đi ngay, không chờ ngày đẹp; sách lịch chỉ là tập quán chọn ngày cho việc sắp xếp được, không thay lời bác sĩ. |
| 治病 | Chữa bệnh | Bệnh cần khám thì đi ngay, không chờ ngày đẹp; sách lịch chỉ là tập quán chọn ngày cho việc sắp xếp được, không thay lời bác sĩ. |
| 词讼 | Khởi kiện, tranh chấp | Thời hạn pháp lý không chờ ngày đẹp; việc kiện tụng nên hỏi luật sư. |
| 求医疗病 | Khám chữa bệnh | Bệnh cần khám thì đi ngay, không chờ ngày đẹp; sách lịch chỉ là tập quán chọn ngày cho việc sắp xếp được, không thay lời bác sĩ. |
