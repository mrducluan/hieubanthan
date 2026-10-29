# Ý tưởng mở rộng kho tri thức hieuban.com: thần số, Tử vi, Bát tự, Kinh Dịch, phong thuỷ

Ngày lập: 29/10/2026. Tết Đinh Mùi rơi vào 06/02/2027 và còn khoảng 100 ngày.
Phạm vi: đây là đề xuất, chưa sửa gì trong repo. Mọi ý đều phải theo đúng kiến trúc 5 tầng: engine Python tính, KB JSON trong git có `source_id` + `school_id`, web chỉ hiển thị. Ngưỡng phần riêng của từng trang là ≥ 30 % (SEO-M).

## 0. Phương pháp và giới hạn

- Tôi đã tra SERP Google VN cho 14 truy vấn mẫu (nguồn ở cuối file). **Tôi không có số volume** vì không truy cập được Keyword Planner hay Ahrefs, và cũng không có số GSC của site. Chỗ nào ghi "ước đoán" là phán đoán theo SERP và theo mùa, chưa phải số đo.
- **Chưa kiểm được ăn thịt từ khoá.** Theo quy trình bắt buộc, trước khi dựng mỗi cụm phải lấy GSC (chiều page + query) cho các truy vấn mục tiêu, xem trang nào đang giữ truy vấn đó, rồi mới chốt tiêu đề và H1. Mỗi ý bên dưới có một dòng "Ranh giới" ghi rõ nguy cơ chồng lấn với trang hiện có.
- **Năm điều quan sát được trên SERP**, cũng là lý do chọn các ý dưới đây:
  1. Nhóm truy vấn huyền học dân gian đang do **blog bán lẻ và dịch vụ** chiếm: fptshop, dienmayxanh, thegioididong, viettelstore, cellphones, shopee/blog, momo, hoanghamobile, mytour. E-E-A-T của các trang này yếu và **sai dữ kiện**. Ví dụ: một nguồn ghi người sinh 2027 mệnh "Thiên Thượng Hoả" (đúng là Thiên Hà Thuỷ); shopee ghi nhầm "Giáp Tý 1974" (1974 là Giáp Dần). Site có engine tất định nên **đúng số** chính là lợi thế cạnh tranh.
  2. ngaydep.com chiếm truy vấn "sao chiếu mệnh 2027" bằng **hàng nghìn trang khuôn mẫu theo năm sinh × giới tính**. Theo chính kết quả tìm kiếm, các trang này lặp một đoạn mô tả, có trang ghi sai tuổi. Đây là khoảng trống về chất lượng, nhưng không được đi theo kiểu doorway của họ.
  3. Với các truy vấn chuyên sâu như "Thiên Cơ Thái Âm đồng cung Mệnh tại Thân", "Thuần Càn hào 5 động", "cách cục Tử Phủ Vũ Tướng", **SERP gần như không có trang tiếng Việt chuyên đề**. Kết quả rơi về ctext.org (tiếng Anh/Hán), hackmd hoặc trang không liên quan. Đây là khoảng trống thật.
  4. Truy vấn "thần số học tên …" và "bảng chữ cái thần số học" bị chia nhỏ, các nguồn **không thống nhất về chữ Y** và về chữ Đ/có dấu. Một bài chuẩn có nêu nguồn sẽ có cơ hội.
  5. Truy vấn theo mùa (tiết khí, năm 2027, Tam tai 2027, Thái Tuế 2027) đã có nhiều bài báo nhưng thiếu bảng tra tính đúng.

---

## 1. Ý tưởng cụm trang và KB mới (22 ý: 18 nên làm, 4 loại hoặc gộp)

Độ ưu tiên = tác động × công sức nghịch đảo. **A** = làm ngay, **B** = đợt 2, **C** = đợt 3 hoặc khi có số GSC.

### Nhóm làm trước mùa Tết (thời vụ)

**Ý 1: Hạn năm 2027 theo tuổi (sao chiếu mệnh Cửu Diệu + 8 hạn, lời tục lệ)** · Mảng: lịch & tuổi · **A**
- URL: `/han-nam/2027` (trang trụ: bảng 46–76 tuổi × nam/nữ) + `/han-nam/2027/tuoi-{năm sinh}` (một trang **gộp nam + nữ**, giống quyết định SEO-K cho tuổi hợp hướng). Khoảng 76 trang (1950–2025) mỗi năm, index năm âm hiện tại + năm sau.
- Truy vấn mẫu: "sao chiếu mệnh 2027", "tuổi 1990 năm 2027 sao gì", "hạn năm 2027 tuổi Mão", "năm 2027 tuổi nào gặp sao La Hầu".
- Ý định: tra cứu thông tin theo mùa, cao điểm tháng 12 đến tháng Giêng (ước đoán theo SERP và mùa).
- Cần thêm: CALC `calc/cuu_dieu.py` (sao theo tuổi mụ chia 9, bảng nam/nữ; 8 hạn Huỳnh Tuyền/Tam Kheo/Ngũ Mộ… theo tuổi mụ), viết golden trước. KB `cuu_dieu_kb.json` gồm 9 sao + 8 hạn: nguồn tục lệ, nháp, lời trung tính.
- Phần riêng đến từ: sao nam khác sao nữ, hạn, tuổi mụ, cờ Kim lâu / Tam tai / Thái Tuế / xung tuổi **đã có sẵn trong `tuoi_dan_gian`**, mốc Tết và Lập xuân của đúng năm sinh, link chéo sang trang làm nhà / xông đất cùng tuổi. Hai người khác năm sinh hiếm khi có cùng tổ hợp này.
- Ranh giới: **cấm** lời "cúng giải hạn", vật phẩm, doạ. Viết "dân gian thường…" và "việc nên làm" trong đời thường (giống VH-1). Không nhầm với Tử vi lưu niên: phải ghi rõ "Cửu Diệu là tục lệ, khác Tử vi Đẩu số".

**Ý 2: Năm 2027 Đinh Mùi với 12 con giáp** · Mảng: Bát tự / lịch & tuổi · **A**
- URL: `/nam-2027` (trụ) + `/nam-2027/tuoi-{con-giap}` (12 trang); trong mỗi trang có bảng 5 can (ví dụ tuổi Tý: Giáp Tý, Bính Tý…). Tổng 13 trang.
- Truy vấn mẫu: "2027 là năm con gì mệnh gì", "tuổi Sửu năm 2027", "năm 2027 tuổi nào xung Thái Tuế", "năm 2027 tuổi nào tam tai".
- Cần thêm: chủ yếu ghép CALC đã có (quan hệ chi tam hợp/lục hợp/xung/hình/hại/phá với Mùi, thập thần của can Đinh với can năm sinh, Ngũ Hoàng/Nhị Hắc lưu niên 2027 của `huyen_khong.luu_nien`, Tam tai). Mới cần thêm quan hệ **hình / hại / phá** nếu CALC chưa có, và KB `nam_2027.json` (lời theo quan hệ, nháp).
- Phần riêng: mỗi con giáp có quan hệ chi khác nhau, cộng bảng 5 can × thập thần khác nhau.
- Ranh giới: trùng ý định với `/bat-tu/menh-theo-nam/sinh-nam-2027-menh-gi` (nếu có) và `/phong-thuy/huong-xau-nam/2027`. Trang trụ `/nam-2027` nên **ôm truy vấn "2027 là năm con gì"** và link sang trang mệnh theo năm, không lặp lại phần nạp âm.

**Ý 3: Tuổi cưới năm 2027 (Kim lâu cưới, Tam tai, năm tuổi) theo năm sinh cô dâu** · Mảng: lịch & tuổi · **A**
- URL: `/xem-tuoi-cuoi/2027` (trụ, bảng) + `/xem-tuoi-cuoi/2027/tuoi-{năm sinh}`, các năm 1985–2005, khoảng 21 trang mỗi năm.
- Truy vấn mẫu: "năm 2027 tuổi nào cưới được", "nữ 1998 cưới năm 2027 có phạm Kim lâu không", "tuổi lấy vợ 2027".
- Cần thêm: CALC Kim lâu cưới (tuổi mụ **nữ**, có hai thuyết đếm, phải nêu cả hai), "tháng đại lợi / tiểu lợi" của nữ theo chi năm sinh (cần nguồn cổ thư Hiệp Kỷ / Ngọc Hạp; chưa có nguồn thì để `can_doi_chieu`). Nối sang `/xem-ngay-tot/cuoi-hoi-thang-*` đã có.
- Phần riêng: tuổi mụ nữ, kết quả Kim lâu theo hai thuyết, tháng đại lợi riêng của từng chi, mốc Tết.
- Ranh giới: **không** viết "không nên cưới" hay "đại kỵ" (CLAUDE.md HN-2N cấm). Chỉ nói "theo tục lệ, nhiều gia đình chọn…" kèm lối "mượn tuổi" và chọn ngày. Không đụng hợp đôi thần số (vốn không chấm điểm).

**Ý 4: 24 tiết khí (trang thường xanh, mỗi tiết một trang, bảng ngày giờ nhiều năm)** · Mảng: lịch · **A**
- URL: `/lich-am/tiet-khi` (trụ) + `/lich-am/tiet-khi/{lap-dong, dong-chi, …}` (24 trang). **Không** làm trang theo từng năm kiểu ngaydep; mỗi trang có bảng giờ giao tiết theo giờ Việt Nam 2020–2035.
- Truy vấn mẫu: "Lập đông 2026 ngày nào" (ngày 7/11, sắp tới), "Đông chí 2026", "tiết Đại hàn", "24 tiết khí là gì".
- Cần thêm: CALC `tietkhi` (VSOP87, đã có) ghép ra bảng; KB `tiet_khi_kb.json` (24 mục: nghĩa tên, kinh độ mặt trời, tháng theo tiết trong Bát tự / hoàng lịch, nhịp sinh hoạt mùa. Câu sức khoẻ theo quy tắc, không bệnh).
- Phần riêng: giờ giao tiết chính xác theo giờ VN (khác giờ Trung Quốc, có thể lệch ngày, đã nêu ở HL-1), tháng tiết nào bắt đầu, link sang trang ngày.
- Ranh giới: thêm khối "Tiết khí" vào `/lich-am/{năm}`; trang ngày giao tiết đã có ở `/xem-ngay-tot/{ngày}` thì link về đây, không viết lại.

**Ý 5: Giờ hoàng đạo (một trang trụ + 6 cặp chi ngày)** · Mảng: lịch · **A (làm nhanh)**
- URL: `/xem-ngay-tot/gio-hoang-dao` (1 trang, neo `#ngay-ty-ngo`… cho 6 nhóm).
- Truy vấn: "giờ hoàng đạo hôm nay", "giờ hoàng đạo là gì", "cách tính giờ hoàng đạo".
- Cần thêm: không có dữ liệu mới, ghép từ hoàng lịch hiện có, kèm khối "hôm nay" động.
- Ranh giới: trang ngày đã liệt kê giờ hoàng đạo của ngày. Trang này **giữ truy vấn định nghĩa + cách tính**, còn truy vấn có ngày cụ thể để trang ngày giữ.

### Nhóm chiều sâu (khoảng trống SERP thật)

**Ý 6: Bộ chính tinh toạ Mệnh theo chi ("Mệnh có X–Y tại chi Z")** · Mảng: Tử vi · **A**
- URL: `/tu-vi/menh-tai/{chi}` (12 trang trụ) + `/tu-vi/menh-tai/{chi}/{bo-sao}`. Số tổ hợp chính tinh thật sự có ở Mệnh theo khẩu quyết là khoảng 60 bộ khác nhau, kể cả "vô chính diệu" xét theo cung xung chiếu (con số này phải **đếm lại bằng engine**).
- Truy vấn mẫu: "Thiên Cơ Thái Âm đồng cung Mệnh tại Thân" (SERP trống), "Tử Phá Mệnh Mùi", "Vũ Tham Sửu Mùi", "Mệnh vô chính diệu tại Dậu".
- Cần thêm: CALC `tuvi_vi_tri` (đã đối chứng 60/60 lá lasotuvi) liệt kê tổ hợp. KB mới `tuvi_bo_sao_menh.json` có lời đời thường cho từng bộ, nguồn Trần Đoàn / Thái Vi Phú (ctext), school `nam_phai`.
- Phần riêng: độ sáng của **từng sao trong bộ** tại chi đó (Nam phái), tam phương tứ chính cụ thể (các sao chiếu về Quan Lộc / Tài Bạch thay đổi theo bộ), cách cục khớp được. Khác hẳn trang "sao ở cung" (một sao × cung chức năng).
- Ranh giới: trang `/tu-vi/sao-o-cung/{sao}-cung-menh` đang giữ truy vấn "sao X cung Mệnh". Trang mới **chỉ** nhắm truy vấn **có tên chi và bộ đôi sao**. Phải kiểm GSC xem trang "sao ở cung Mệnh" có đang ăn các truy vấn "… tại Thân" không. Nếu có, chuyển mục 12 vị trí sang trang mới và để link qua lại.

**Ý 7: 62 cách cục Tử vi** · Mảng: Tử vi · **A**
- URL: `/tu-vi/cach-cuc` + `/tu-vi/cach-cuc/{slug}` (62 trang).
- Truy vấn mẫu: "cách cục Tử Phủ Vũ Tướng", "Sát Phá Tham là gì", "Cơ Nguyệt Đồng Lương", "Nhật Nguyệt tịnh minh", "Quân Thần Khánh Hội".
- Cần thêm: KB đã có 62 cách cục đời thường (`tuvi_doi_song_kb.json`) và phiên âm cổ ca. Cần thêm **điều kiện thành cách** dưới dạng luật (engine kiểm), tỉ lệ lá số có cách đó trên mẫu ngày giờ 1940–2010 (như `thanso_ty_le`, ghi rõ "không phải thống kê dân số"), ví dụ lá số mẫu.
- Phần riêng: điều kiện riêng của từng cách, các chi đắc cách, tỉ lệ mẫu, phá cách. 62 trang không trùng dữ kiện với nhau.
- Ranh giới: thuật ngữ trong `/tu-dien` chỉ có định nghĩa ngắn, nên đặt canonical ý định "X là gì" ở trang cách cục và cho từ điển link sang.

**Ý 8: 384 hào (hào động)** · Mảng: Kinh Dịch · **B** (làm theo đợt)
- URL: `/kinh-dich/que/{que}/hao-{1..6}` (384 trang) + **Dụng Cửu / Dụng Lục** (2 trang).
- Truy vấn mẫu: "Thuần Càn hào 5 động" (SERP chỉ có ctext), "hào 3 quẻ Khôn", "phi long tại thiên nghĩa là gì", "quẻ Truân hào sơ".
- Cần thêm: KB đã có 384 hào "nói nôm na" + nguyên văn. Engine tính thêm **quẻ biến** khi chỉ hào đó động, hào trung/chính, ứng, thừa/thừa (承乘), hào chủ quẻ.
- Phần riêng: hào từ + Tiểu tượng nguyên văn, quẻ biến riêng, vị trí hào. Riêng thì đủ, nhưng 384 trang là lượng lớn, nên **làm đợt đầu 64 hào "chủ quẻ" + 6 hào của 8 quẻ thuần (48)**, bật index theo `do_rieng` và theo số hiển thị GSC.
- Ranh giới: trang quẻ đang có 6 hào trong thân. Cần **chuyển phần hào thành tóm tắt 1 câu + link**, nếu không sẽ ăn thịt lẫn nhau.

**Ý 9: 30 nạp âm + 5 hành (trang thực thể)** · Mảng: Bát tự · **A**
- URL: `/bat-tu/nap-am/{thien-ha-thuy, …}` (30 trang) + `/bat-tu/ngu-hanh/{kim,…}` (5 trang trụ).
- Truy vấn mẫu: "Thiên Hà Thủy là gì", "mệnh Lư Trung Hỏa hợp màu gì", "Kim khắc Mộc", "mệnh Thổ hợp hướng nào".
- Cần thêm: KB `battu_kb.nap_am` (30 mục, đã có). Ghép thêm 2 năm sinh trong chu kỳ 60 + tất cả năm 1924–2043, quan hệ sinh/khắc với 29 nạp âm còn lại (bảng 30 hàng tính được), ý nghĩa hình tượng.
- Phần riêng: hình tượng riêng, các năm sinh, bảng quan hệ nạp âm. Trang hành: màu / phương / mùa / số Hà Đồ.
- Ranh giới: trang "sinh năm X mệnh gì" nên link lên trang nạp âm (một nạp âm ứng hai năm), tránh lặp đoạn nghĩa. Đây là **trang thực thể cho AI** (xem mục 3).

**Ý 10: Nhật trụ 60 hoa giáp ("sinh ngày Giáp Tý trong Bát tự")** · Mảng: Bát tự · **B**
- URL: `/bat-tu/nhat-tru/{giap-ty}` (60 trang).
- Truy vấn mẫu: "ngày sinh Giáp Tý bát tự", "nhật trụ Đinh Mão", "người sinh ngày Canh Thìn".
- Cần thêm: CALC đã có tàng can, thập thần của chi ngày với nhật chủ, nạp âm, cung phu thê = chi ngày, tự toạ trường sinh. Cần KB `nhat_tru_kb.json` (60 mục, nguồn Tam Mệnh Thông Hội, nháp).
- Phần riêng: trường sinh tự toạ, thập thần của tàng can, nạp âm, các ngày dương lịch gần nhất rơi vào trụ đó (tính được). Khác trang `nhat-chu` (10 can).
- Ranh giới: nhắc rõ "chỉ là 1/8 chữ", và có lối sang công cụ.

**Ý 11: Thần sát Bát tự (khoảng 16 sao: Đào hoa, Dịch mã, Hoa cái, Thiên Ất quý nhân, Văn xương, Kình dương, Cô thần quả tú…)** · Mảng: Bát tự · **B**
- URL: `/bat-tu/than-sat/{dao-hoa,…}` (khoảng 16 trang).
- Truy vấn mẫu: "đào hoa trong bát tự", "sao dịch mã là gì", "thiên ất quý nhân tra theo can".
- Cần thêm: CALC đã có thần sát (BT-ĐS dùng). Cần bảng tra theo can/chi in ra từ chính hàm tính, cộng KB lời trung tính.
- Phần riêng: **bảng tra 10 can / 12 chi** do hàm tính in ra, mỗi sao một bảng khác nhau.
- Ranh giới: "Đào hoa" trùng tên sao Tử vi. Tiêu đề phải ghi rõ "trong Bát tự", còn trang Tử vi (Ý 12) ghi "trong Tử vi".

**Ý 12: Phụ tinh Tử vi (khoảng 30 sao: Tả Phù, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi, Thiên Việt, Kình, Đà, Hoả, Linh, Không, Kiếp, Lộc Tồn, Thiên Mã, Đào Hoa, Hồng Loan…)** · Mảng: Tử vi · **A**
- URL: `/tu-vi/phu-tinh/{slug}` (khoảng 30 trang).
- Truy vấn mẫu: "sao Hồng Loan", "sao Thiên Mã cung Mệnh", "Địa Không Địa Kiếp", "sao Lộc Tồn".
- Cần thêm: độ sáng lối Việt cho 16 phụ tinh (đã có), quy tắc an sao (theo iztro + lasotuvi), KB lời.
- Phần riêng: cách an (theo can / chi / tháng / giờ), bảng độ sáng 12 chi, khác phái (Hoả/Linh hiện hai phái đã chốt).
- Ranh giới: silo `/tu-vi/chinh-tinh` chỉ có 14 chính tinh, nên không ăn thịt. Chưa làm "phụ tinh × cung" (sẽ ra 360 trang mỏng) cho tới khi có số GSC.

**Ý 13: Huyền Không vận 9 theo 24 sơn hướng** · Mảng: phong thuỷ · **B**
- URL: `/phong-thuy/huyen-khong/van-9` (trụ) + `/phong-thuy/huyen-khong/van-9/toa-{son}-huong-{huong}` (24 trang). Kiêm hướng hoặc thế quái để trong thân trang (không tách URL).
- Truy vấn mẫu: "nhà hướng Đông Nam vận 9" (SERP chưa có bảng phi tinh cụ thể), "nhà toạ Tý hướng Ngọ vận 9", "vượng sơn vượng hướng vận 9".
- Cần thêm: CALC `huyen_khong` (đã có) dựng bàn 9 cung; KB `to_hop_81` (đã có) đọc sao sơn/hướng từng cung; năm 2026–2030 sao lưu niên tới cung hướng.
- Phần riêng: mỗi sơn hướng một bàn sao khác nhau, cục (vượng sơn vượng hướng / thượng sơn hạ thuỷ / song tinh), lời tổ hợp 81 cho cung cửa.
- Ranh giới: theo nguyên tắc Q1 "hình thế là nền, lý khí là nhịp", trang phải nói "bàn sao chỉ là nhịp, căn nhà thật cần khảo sát", có lối sang công cụ. Không dùng nhãn "đại hung".

**Ý 14: Ba lớp số tên — Linh hồn / Nhân cách / Sứ mệnh (1–9, 11, 22, 33)** · Mảng: thần số · **A**
- URL: `/than-so/linh-hon/{n}`, `/than-so/nhan-cach/{n}`, `/than-so/su-menh/{n}`, cộng 1 bài trụ **"Cách tính thần số theo tên tiếng Việt"** (chữ Y, Đ, dấu, tên đệm, tên thường gọi; có bảng ví dụ do engine tính). Khoảng 36 + 1 trang.
- Truy vấn mẫu: "số linh hồn 7", "số nhân cách 11", "chỉ số sứ mệnh 22", "bảng chữ cái thần số học", "chữ Y trong thần số học".
- Cần thêm: KB lớp riêng từ Linh hồn / Nhân cách / Sứ mệnh (`thanso_chan_dung.json`, đã có). Engine có cả Pitago và Chaldea, nên trang trụ cho thấy **cùng một tên ra số khác** ở hai phái.
- Phần riêng: lời riêng theo lớp (khác "ý nghĩa số" đường đời), ví dụ tên phổ biến được tính sẵn, đối chiếu Chaldea.
- Ranh giới: `/than-so/y-nghia-so/{n}` giữ truy vấn "số chủ đạo n" và "thần số học số n". Trang mới **phải có tên chỉ số trong title**.
- **Loại** phương án "một trang cho mỗi tên" (thần số học tên X): vô hạn trang và mỏng.

**Ý 15: Số ngày sinh 1–31** · Mảng: thần số · **B**
- URL: `/than-so/ngay-sinh/{1..31}` (31 trang).
- Truy vấn mẫu: "sinh ngày 29 thần số học", "người sinh ngày 7", "số ngày sinh 22".
- Cần thêm: KB số ngày sinh (đã có ở v2), số kép của ngày (10–31) nối sang `/than-so/so-kep`, tỉ lệ đường đời theo ngày đó trên mẫu 1940–2010 (`thanso_ty_le`).
- Phần riêng: 31 ngày, mỗi ngày có tổ hợp gốc + số kép + phân bố đường đời khác nhau.
- **Loại** phương án 366 trang "sinh ngày X tháng Y": ngày + tháng không đủ để ra số chủ đạo, nên 366 trang chỉ là biến thể của 31 trang (đúng kiểu doorway).

**Ý 16: Nhị thập bát tú + 12 trực** · Mảng: lịch · **B**
- URL: `/xem-ngay-tot/sao/{tu}` (28 trang), `/xem-ngay-tot/truc/{kien,…}` (12 trang).
- Truy vấn mẫu: "sao Giác ngày tốt hay xấu", "trực Thành là gì", "ngày trực Phá".
- Cần thêm: `hoang_lich_vendor` (đã có nghi/kỵ, nguồn có bản quyền mở), KB tên Hán Việt + nghĩa (đã có một phần ở `hoang_lich_kb.json`). Thêm danh sách 10 ngày tới rơi vào sao/trực đó (động).
- Phần riêng: nghi/kỵ riêng, thất tinh / tứ tượng, bảng ngày sắp tới.
- Ranh giới: trang ngày link vào đây, không lặp phần nghĩa.

**Ý 17: Sinh con năm 2027 (một trang trụ có công cụ)** · Mảng: lịch & tuổi · **B**
- URL: `/sinh-con/2027` (1 trang, kèm bảng tháng theo tiết, mốc Tết 06/02/2027 trước/sau, nạp âm, quan hệ chi với tuổi bố mẹ).
- Truy vấn mẫu: "con sinh năm 2027 hợp bố mẹ tuổi gì" (thuvienphapluat đang có), "sinh con 2027 tháng nào".
- Cần thêm: ghép CALC có sẵn.
- Phần riêng: trẻ sinh 01/01–05/02/2027 vẫn là Bính Ngọ, tháng tiết, bảng quan hệ.
- Ranh giới: **không** làm "tháng sinh tốt/xấu" kiểu phán, **không** "đặt tên con theo tuổi" (cần nguồn chữ Hán ngũ hành đáng tin; để đợt sau, khi có chuyên gia).

**Ý 18: Phong thuỷ nơi làm việc (văn phòng, bàn làm việc, cửa hàng)** · Mảng: phong thuỷ · **C**
- URL: `/phong-thuy/van-phong`, `/phong-thuy/ban-lam-viec`, `/phong-thuy/cua-hang` (3 trang trụ, link xuống `/phong-thuy/dau-hieu`).
- Truy vấn: "phong thủy bàn làm việc", "hướng ngồi làm việc hợp tuổi".
- Cần thêm: KB `bo_tri` (33 mục, 13 mục là tình huống), la bàn "Tìm hướng kê bàn" (UI-PT) đã có.
- Phần riêng: chỉ đủ khi KB thêm các dấu hiệu riêng của văn phòng (lưng tựa, cửa sau lưng, cột, quầy thu ngân).
- Ranh giới: không bán vật phẩm (cấm). Rủi ro mỏng nếu chỉ gom lại dấu hiệu cũ, nên để mức C.

### Các ý đã **loại hoặc gộp** và lý do

- **Tử vi trọn đời theo năm sinh × giới tính** (kiểu ngaydep / shopee): nội dung trên SERP chứa "hưởng thọ 60–66 tuổi", phán vận đời, thuộc nhóm bị CLAUDE.md cấm. Năm sinh không đủ để lập lá số, nên trang hoặc phải bịa hoặc lặp lại trang mệnh theo năm. **Gộp**: thêm mục "Các mốc theo tuổi" (Kim lâu, Tam tai, năm tuổi trong 10 năm tới) vào `/bat-tu/menh-theo-nam` và mời lập lá số đầy đủ.
- **Tuổi hợp làm ăn A × B (60 × 60 = 3.600 trang)**: doorway, và các nguồn trên SERP tự mâu thuẫn. **Gộp**: một bảng quan hệ chi/can/nạp âm trong trang con giáp (Ý 2) và trang nạp âm (Ý 9), kèm câu "ưu tiên năng lực, hợp đồng".
- **Quẻ × chủ đề (64 × 20 URL)**: mỏng. **Gộp**: neo `#tinh-duyen`, `#cong-viec`, `#tien-bac` trong trang quẻ, lấy lời từ `kinhdich_doi_song` (20 chủ đề, đã có).
- **Màu hợp mệnh theo từng năm (76 trang riêng)**: đã có trong trang mệnh theo năm, nên dồn về 5 trang hành (Ý 9).
- **Lá số người nổi tiếng**: rủi ro dữ liệu cá nhân (Luật 91/2025) và rủi ro phỉ báng; không làm.

**Lưu ý về ăn thịt từ khoá ngay trong silo hiện có:** truy vấn "lịch âm tháng 11 2026" rất có thể đang được `/xem-ngay-tot/thang-11-2026` và `/lich-am/2026` cùng giữ. Cần lấy GSC trước. Nếu hai trang cùng nằm top 20 và chia nhấp, hãy giao "lịch âm tháng" cho một trang duy nhất (đề xuất: trang tháng của xem ngày tốt, đổi H1 thành "Lịch âm tháng 11/2026 và ngày tốt"), trang còn lại chỉ link sang.

---

## 2. Tài sản dữ liệu dễ được dẫn link (linkable assets)

1. **"Tết Đinh Mùi 2027 bằng con số"** (`/bao-cao/tet-2027`, phát hành giữa tháng 12/2026): Lập xuân 04/02/2027 so với Tết 06/02/2027 và ai sinh trong khoảng đó đổi con giáp; số ngày tốt cưới hỏi / khai trương của tháng Giêng tính từ hoàng lịch; năm cá nhân phổ quát 2027 = 2 (2+0+2+7 = 11 → 2, có thể giữ 11); tuổi xông đất, hướng Ngũ Hoàng 2027; phân bố số chủ đạo theo mẫu ngày sinh. Kèm ảnh có QR (TCS-1) và bộ số liệu CSV. Dễ được báo đời sống và AI trích.
2. **"1.376 ngày âm lịch Việt Nam khác Trung Quốc (1930–2025)"**: đây là dữ liệu độc quyền đã có trong ghi chép LS60. Một trang giải thích vì sao (UTC+7 so với UTC+8, miền Nam 1960–1975), bảng tra năm nào Tết lệch, ảnh hưởng tới tuổi và lá số. Có tính báo chí và học thuật, khó sao chép.
3. **Bộ dữ liệu mở lịch âm Việt 1900–2100 (CC BY 4.0)**: CSV/JSON (ngày dương → âm, nhuận, can chi ngày/tháng/năm, tiết khí giờ VN), ghi rõ thuật toán Hồ Ngọc Đức và mốc miền Nam. Đăng ở `/du-lieu/lich-am` + GitHub release + Zenodo (có DOI). Điều kiện ghi nguồn = link về hieuban.com. Cần chủ dự án duyệt giấy phép (BM-1: không lộ thư viện nội bộ, chỉ nêu thuật toán công khai).
4. **Widget nhúng "Lịch âm hôm nay / giờ hoàng đạo"** cho website khác: một `<iframe>` hoặc ảnh SVG động có link "Lịch: hieuban.com". Phải nới `frame-ancestors` cho **riêng** đường dẫn `/nhung/*` (CSP-2), giới hạn tần suất, không cookie. Cần chủ dự án duyệt.
5. **Bảng tra in được (PDF A4)**: lịch âm 2027 kèm tiết khí và mùng 1/rằm; bảng Kim lâu / Hoang ốc / Tam tai 2027; bảng mệnh nạp âm 1940–2027. Mỗi bảng có QR về trang tương ứng.
6. **"Số chủ đạo nào hiếm nhất?"**: phân bố đường đời trên mọi ngày 1940–2010, theo **hai cách tính** (tổng hết so với từng phần; cùng ngày 24/10/1988 ra 33 hoặc 6). Ghi rõ không phải thống kê dân số. Chủ đề rất dễ chia sẻ và trích dẫn.
7. **Bảng so sánh mở các phái** (Pitago / Chaldea; Bát trạch / Huyền Không; lịch Việt / Trung): trang tham chiếu cho người viết và AI (xem mục 3).

---

## 3. Tối ưu cho AI Overviews và ChatGPT/Perplexity

- **Trang thực thể có định nghĩa một câu ở đầu** (≤ 30 từ, chủ ngữ là tên thực thể): 30 nạp âm, 24 tiết khí, 62 cách cục, 28 tú, 12 trực, thần sát, phụ tinh. Mỗi trang có `DefinedTerm` + `@id`, nối với `/tu-dien`, và `about` trỏ tới Wikipedia nếu có (SEO-K đã có `THUC_THE`).
- **Câu trả lời số cụ thể ở đầu và nhất quán trên mọi trang**: "Năm 2027 là năm Đinh Mùi, nạp âm Thiên Hà Thuỷ, từ 06/02/2027 đến 25/01/2028". Thêm một dòng **"Nhầm lẫn hay gặp"** (ví dụ "Đinh Mùi không phải Thiên Thượng Hoả"; "sinh 01/01–05/02/2027 vẫn tuổi Bính Ngọ"). Câu đính chính dạng này rất dễ được AI lấy vì đối thủ đang sai.
- **Bảng so sánh** (AI rất hay trích bảng): Tử vi và Bát tự khác nhau thế nào; Pitago và Chaldea; Bát trạch và Huyền Không; Cửu Diệu (tục lệ) và lưu niên Tử vi; âm lịch Việt và Trung; hai cách tính đường đời. Mỗi bảng 5–7 hàng, có neo `#so-sanh`.
- **Khối "Cách tính" có ví dụ bằng số** (ví dụ tên NGUYEN VAN AN ra Linh hồn 1 khi coi Y là phụ âm, và ra số nào nếu coi Y là nguyên âm). AI trích ví dụ có số tốt hơn lời chung chung.
- **Giữ khuôn SEO-M**: câu đầu trả lời thẳng ≤ 45 từ, một bảng thật, "Sách xưa nói gì" có trích dẫn, ngày sửa thật (sổ `ngay_cap_nhat.json`).
- **llms.txt**: thêm mục "Năm 2027" (trang trụ), "Thực thể" (nạp âm, tiết khí, cách cục: mục lục + mẫu URL), "Dữ liệu mở" (bộ lịch âm).
- Đo lượt trích: theo dõi lượt vào từ chatgpt.com, perplexity.ai, gemini (PostHog `$referrer`) và báo cáo hiệu suất AI của Bing Webmaster khi có.

---

## 4. Lộ trình 3 đợt và KPI

### Đợt 1: 01/11 đến 30/11/2026 (trước mùa Tết)

| Việc | Trang mới | Ghi chú |
|---|---|---|
| Lấy GSC page + query cho mọi truy vấn mục tiêu, chốt ranh giới (bắt buộc) | — | làm tuần đầu |
| Ý 4: 24 tiết khí (kịp Lập đông 07/11, Đông chí 22/12) | 25 | CALC có sẵn |
| Ý 5: giờ hoàng đạo | 1 | nhanh |
| Ý 9: 30 nạp âm + 5 hành | 35 | KB có sẵn |
| Ý 1: CALC Cửu Diệu + golden (viết test trước) + KB, trang `/han-nam/2027` | 77 | index sớm để Google kịp thu thập trước tháng 12 |
| Ý 2: năm 2027 × 12 con giáp | 13 | |
| Ý 7: 62 cách cục (đợt đầu 20 cách phổ biến) | 21 | |

### Đợt 2: 12/2026 đến 02/2027 (mùa Tết)

| Việc | Trang mới |
|---|---|
| Báo cáo "Tết 2027 bằng con số" + PDF in được + pitch báo (giữa tháng 12) | 1 + tài sản |
| Ý 3: tuổi cưới 2027 | 22 |
| Ý 17: sinh con 2027 | 1 |
| Ý 7 còn 42 cách cục; Ý 12 phụ tinh | 72 |
| Ý 14: ba lớp số tên + bài "cách tính theo tên tiếng Việt" | 37 |
| Trang "1.376 ngày âm lịch Việt khác Trung Quốc" | 1 |
| Cập nhật trang xông đất / làm nhà 2027 (đã có) có link sang hạn năm | — |

### Đợt 3: 03 đến 06/2027

| Việc | Trang mới |
|---|---|
| Ý 6: bộ sao toạ Mệnh theo chi | khoảng 72 |
| Ý 8: hào động, đợt đầu (khoảng 112), mở tiếp theo GSC | khoảng 112 |
| Ý 10 nhật trụ, Ý 11 thần sát | khoảng 76 |
| Ý 13 Huyền Không 24 sơn, Ý 15 số ngày sinh, Ý 16 tú + trực | khoảng 95 |
| Bộ dữ liệu mở lịch âm + widget nhúng (nếu được duyệt) | tài sản |
| Rà các trang có hiển thị 90 ngày = 0 thì gộp hoặc noindex (SEO-M) | — |

Tổng khoảng 800 trang mới trong 8 tháng. Mỗi trang phải qua `do_rieng` ≥ 30 % và bộ rà SEO 0 lỗi; trang chưa đạt thì để `index=false`.

### KPI (đặt mốc sau khi có số GSC của tháng 10/2026, không đặt số tuyệt đối khi chưa có baseline)

- **Chỉ mục**: ≥ 85 % URL của mỗi cụm mới được Google lập chỉ mục sau 60 ngày (đo qua `/sitemap-cum.xml` theo cụm).
- **Hiển thị / nhấp không thương hiệu**: các cụm thời vụ (hạn năm, 2027, tuổi cưới) đạt đỉnh trong tuần 25/01 đến 10/02/2027. Mục tiêu tương đối là ≥ 30 % tổng nhấp không thương hiệu của site trong tháng 01/2027.
- **Vị trí**: ≥ 30 % truy vấn mục tiêu của các cụm chiều sâu (cách cục, bộ sao toạ Mệnh, hào động, nạp âm) vào top 10 sau 120 ngày. Đây là cụm có SERP yếu nên kỳ vọng hợp lý.
- **Đoạn trích nổi bật / AI**: ≥ 20 trang thực thể được trích ở AI Overviews hoặc Perplexity (kiểm tay hằng tháng trên 50 truy vấn cố định) + lượt vào từ trình duyệt AI.
- **Link**: ≥ 15 tên miền giới thiệu mới từ báo cáo Tết và bộ dữ liệu mở trước 31/03/2027.
- **Chuyển đổi về công cụ** (vòng tăng trưởng, khâu THU HÚT): tỉ lệ `landing_viewed` (trang kiến thức) → `reading_started` ≥ mức hiện tại của cụm sao-ở-cung. Đo `cross_cta_clicked{tu}` từ các trang mới.
- **Chất lượng**: 0 trang vi phạm cụm cấm (test KB), 0 lỗi bộ rà SEO, phần riêng trung bình mỗi cụm ≥ 35 %.

---

## Nguồn SERP đã tra (29/10/2026)

- [ngaydep.com: sao chiếu mệnh và hạn niên 2027](https://ngaydep.com/xem-sao-chieu-menh-va-han-nien-nam-2027.html) · [ngaydep: nam 1967 năm 2027](https://ngaydep.com/nam-2027-nam-sinh-nam-1967-sao-gi-chieu-menh.html)
- [ngaydep: tử vi trọn đời Giáp Tý 1984](https://ngaydep.com/xem-tu-vi-tron-doi-cua-tuoi-giap-ty-1984.html) · [shopee blog: tử vi Giáp Tý 2024](https://shopee.vn/blog/tu-vi-tuoi-giap-ty-nam-2024-nam-mang/)
- [fptshop: 2027 là năm con gì](https://fptshop.com.vn/tin-tuc/for-gamers/2027-la-nam-con-gi-menh-gi-207401) · [dienmayxanh: năm 2027](https://www.dienmayxanh.com/kinh-nghiem-hay/nam-2027-la-nam-con-gi-1587259) · [viettelstore: 2027 tuổi nào tam tai](https://viettelstore.vn/tin-tuc/nam-2027-tuoi-nao-tam-tai) · [ngoisao: xung Thái Tuế 2027](https://ngoisao.vn/theo-dong-su-kien/doi-song-so/nhung-con-giap-nao-se-xung-khac-thai-tue-vao-nam-2027-d488358.html)
- [thuvienphapluat: con sinh 2027 hợp bố mẹ](https://thuvienphapluat.vn/hoi-dap-phap-luat/con-sinh-nam-2027-hop-voi-bo-me-tuoi-gi-138050238.html) · [hoanghamobile: 2027 mệnh gì](https://hoanghamobile.com/tin-tuc/2027-menh-gi/)
- [thuviennhadat: hướng nhà vượng khí vận 9](https://thuviennhadat.vn/cam-nang-nha-dat/cac-huong-nha-vuong-khi-trong-van-9-642310.html)
- [ctext: Book of Changes, Qian](https://ctext.org/book-of-changes/qian) · [mytour: Càn Thuần](https://mytour.vn/vi/blog/bai-viet/can-thuan.html)
- [baoquocte: sao Thái Âm cung Mệnh](https://baoquocte.vn/y-nghia-sao-thai-am-tai-cung-menh-va-cung-menh-phu-the-265973.html) · [hackmd: Mệnh Thiên Tướng](https://hackmd.io/@tuvidauso/menh-thien-tuong)
- [viettelstore: bảng chữ cái thần số học](https://viettelstore.vn/tin-tuc/bang-chu-cai-than-so-hoc) · [cellphones: đặt tên theo thần số học](https://cellphones.com.vn/sforum/dat-ten-theo-than-so-hoc)
- [ngaydep: Lập đông 2026](https://ngaydep.com/lap-dong-nam-2026-vao-ngay-nao-am-lich-va-duong-lich.html) · [vov: Lập thu 2026](https://vov.vn/doi-song/hom-nay-vao-tiet-lap-thu-2026-thoi-tiet-se-thay-doi-ra-sao-post1321976.vov)
- [mytour: tuổi Tuất trong kinh doanh, hôn nhân](https://mytour.vn/vi/blog/bai-viet/tac-dong-cua-tuoi-tuat-trong-linh-vuc-kinh-doanh-va-hon-nhan.html) · [momo: tử vi Giáp Tuất 2026](https://www.momo.vn/blog/xem-la-so-tu-vi-tuoi-giap-tuat-1994-nam-mang-nam-2026-c117dt2389)
