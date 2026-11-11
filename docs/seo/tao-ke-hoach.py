# -*- coding: utf-8 -*-
import unicodedata, re, json, datetime as dt, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

def slug(s):
    s = s.replace("đ","d").replace("Đ","D")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"[^a-z0-9]+","-",s).strip("-")
    return s[:75].rstrip("-")

CUM = {
 "C1": ("Thần số học", "/than-so", "→ Ổn định (đỉnh 2021–22 đã qua; nhích lên dịp năm mới dương)", "Cửa chính của site; 12 bài nối về /than-so và các trang lá ý nghĩa số, năm cá nhân, nợ nghiệp, số kép"),
 "C2": ("Tử vi", "/tu-vi", "◷ Mùa vụ: đỉnh 12–2 (Tết), nền ổn định", "Câu hỏi của người đã có lá số; nối về sao ở cung, tứ hoá, cung"),
 "C3": ("Bát tự & ngũ hành", "/bat-tu", "↑ Tăng nhẹ (cụm 'mệnh thiếu gì', 'tứ trụ')", "Khác biệt: dụng thần hai cách, Lập xuân, giờ Tý"),
 "C4": ("Phong thuỷ nhà ở", "/phong-thuy", "◷ Cao 9–1 (mua nhà, làm nhà cuối năm), nền ổn định", "Tình huống thật: chung cư, nhà thuê, mua nhà cũ; nối dấu hiệu trong nhà, cung phi"),
 "C5": ("Kinh Dịch", "/kinh-dich", "→ Ổn định, ngách", "Người mới hỏi cách hỏi + cách đọc; nối 64 quẻ"),
 "C6": ("Tarot", "/tarot", "↑ Đang lên (Gen Z, 'chữa lành')", "Cụm phương Tây tăng nhanh nhất; nối 78 lá"),
 "C7": ("Nhân tướng học", "/nhan-tuong", "↑ Đang lên (xem tướng qua ảnh, AI)", "Gom thành một đợt trong tháng 5; nối bộ vị"),
 "C8": ("Năm 2027 & Tết Đinh Mùi", "/nam/2027", "◷ Mùa vụ mạnh: lên từ tháng 11, đỉnh cuối 1 – đầu 2/2027, xuống sau Rằm tháng Giêng (20/2/2027)", "Phải đăng xong trước 10/1/2027; nối /tuoi-xong-dat, /xem-tuoi-lam-nha, /xem-sao-han, /nam/2027/*"),
 "C9": ("Xem ngày tốt & âm lịch", "/xem-ngay-tot", "◷ Hai đỉnh: trước Tết và mùa cưới; nền ổn định", "Nối trang ngày, tháng, việc-tháng, /lich-am"),
 "C10": ("Hợp đôi & tình cảm", "/hop-doi", "◷ Đỉnh trước 14/2 và mùa cưới", "Không chấm điểm (thần số), không phán 'không nên lấy nhau'"),
 "C11": ("Huyền học, AI & cách nhìn", "/huyen-hoc", "↑ Đang lên (hỏi AI xem bói, 'có khoa học không')", "Bài định vị thương hiệu: tự kiểm chứng, một bộ tính, không mê tín"),
}
TT, SS, LN = "Thông tin", "So sánh – cân nhắc", "Làm ngay (dùng công cụ)"

# cum, tu khoa chinh, tu khoa phu, dang, y dinh, luong tim, do kho, xu huong (None = theo cum), tieu de, trang la noi toi, CTA, thang, uu tien
A = [
# ---- C8 Tết 2027 ----
("C8","cách chọn người xông đất đầu năm","xông đất là gì; xông đất kiêng gì; chọn tuổi xông đất","Người mới","Thông tin","Cao","TB",None,"Cách chọn người xông đất đầu năm cho người mới: 4 bước, không cần thầy","/tuoi-xong-dat/2027","Tra tuổi hợp xông đất Tết 2027",1,"P1"),
("C8","không có người hợp tuổi xông đất thì làm sao","tự xông đất nhà mình được không; nhờ người xông đất","Tình huống","Thông tin","TB","Thấp",None,"Không tìm được người hợp tuổi xông đất thì làm sao? 5 cách tập quán vẫn dùng","/tuoi-xong-dat/2027","Tra tuổi hợp xông đất Tết 2027",1,"P1"),
("C8","tam tai là gì cách tính","năm 2027 tuổi nào tam tai; tam tai có nên làm nhà","Câu hỏi","Thông tin","Cao","TB",None,"Tam tai là gì? Cách tự tính Tam tai và năm 2027 những tuổi nào gặp","/nam/2027; /xem-sao-han/2027","Xem năm 2027 của tuổi bạn",1,"P1"),
("C8","kim lâu là gì cách tính tuổi kim lâu","phạm kim lâu có cưới được không; kim lâu làm nhà","Câu hỏi","Thông tin","Cao","TB",None,"Kim lâu là gì? Cách tính tuổi Kim lâu khi cưới và làm nhà (có ví dụ)","/nam/2027/cuoi-hoi; /xem-tuoi-lam-nha/2027","Kiểm tuổi cưới, làm nhà 2027",1,"P1"),
("C8","hoang ốc là gì cách đếm tuổi làm nhà","cách tính hoang ốc bằng bàn tay; tuổi làm nhà 2027","Cách làm","Thông tin","TB","Thấp",None,"Hoang ốc là gì? Cách đếm tuổi làm nhà bằng bàn tay cho người mới","/xem-tuoi-lam-nha/2027","Xem tuổi làm nhà 2027",1,"P1"),
("C8","mượn tuổi làm nhà như thế nào","mượn tuổi động thổ; mượn tuổi ai","Tình huống","Thông tin","TB","Thấp",None,"Mượn tuổi làm nhà thế nào cho đúng tập quán: chọn ai, làm những bước gì","/xem-tuoi-lam-nha/2027","Xem tuổi làm nhà 2027",1,"P1"),
("C8","sao la hầu kế đô năm 2027 nên làm gì","sao hạn là gì; sao thái bạch; cửu diệu","Câu hỏi","Thông tin","Cao","Cao",None,"Gặp sao La Hầu, Kế Đô năm 2027: hiểu đúng và việc nên làm trong đời sống","/xem-sao-han/2027","Tra sao hạn 2027 theo tuổi",1,"P1"),
("C8","năm tuổi 2027 tuổi mùi nên làm gì","tuổi mùi năm 2027; năm tuổi có nên cưới làm nhà","Tình huống","Thông tin","TB","TB",None,"Năm tuổi 2027 của người tuổi Mùi: nên làm gì, không cần lo gì","/nam/2027/tuoi-1991; /nam/2027","Xem năm 2027 theo tuổi",2,"P1"),
("C8","năm 2027 thần số học năm phổ quát 11","năm 2027 là năm số mấy thần số học","Câu hỏi","Thông tin","TB","Thấp","↑ Lên dần từ tháng 11, đỉnh 1/1/2027","Năm 2027 theo thần số học: năm phổ quát 11 nói gì với bạn","/than-so/nam-ca-nhan","Tính năm cá nhân 2027 của bạn",2,"P1"),
("C8","cách tính năm cá nhân 2027","năm cá nhân là gì; năm cá nhân 1 đến 9","Cách làm","Làm ngay (dùng công cụ)","TB","Thấp","↑ Lên dần từ tháng 11, đỉnh 1/1/2027","Cách tính năm cá nhân 2027 theo thần số học trong 1 phút (có ví dụ)","/than-so/nam-ca-nhan; /hom-nay","Tính năm cá nhân 2027",2,"P1"),
("C8","xuất hành đầu năm 2027 giờ nào hướng nào","giờ xuất hành mùng 1 tết; hướng xuất hành","Cách làm","Làm ngay (dùng công cụ)","Cao","Cao",None,"Xuất hành đầu năm Đinh Mùi: cách tự chọn giờ hoàng đạo và hướng đi","/xem-ngay-tot; /xem-ngay-tot/2027-02-06","Xem giờ tốt mùng 1 Tết",2,"P1"),
("C8","chọn ngày khai trương sau tết","ngày khai trương tháng giêng; ngày mở hàng","Cách làm","Làm ngay (dùng công cụ)","Cao","Cao",None,"Chọn ngày khai trương sau Tết: 5 bước tự xem và 3 lỗi hay gặp","/xem-ngay-tot/khai-truong-thang-2-2027","Lọc ngày khai trương tháng 2/2027",2,"P1"),
("C8","lập xuân là gì vì sao bát tự tính từ lập xuân","năm tuổi tính từ tết hay lập xuân; sinh đầu năm tính tuổi nào","So sánh","So sánh – cân nhắc","TB","Thấp",None,"Lập xuân là gì? Sinh trước Tết, sau Lập xuân thì tuổi Bát tự tính thế nào","/bat-tu; /bat-tu/menh-theo-nam","Lập lá số Bát tự",2,"P2"),
("C8","sinh con năm 2027 bố mẹ nên biết gì","sinh con năm đinh mùi hợp tuổi bố mẹ; con tuổi mùi","Tình huống","So sánh – cân nhắc","Cao","Cao",None,"Sinh con năm Đinh Mùi 2027: bố mẹ nên biết gì, điều gì không cần quá lo","/nam/2027/sinh-con","Xem tuổi bố mẹ với con 2027",2,"P1"),
("C8","xem tử vi năm 2027 trên lá số","lưu niên 2027; tử vi năm 2027 của tôi","Cách làm","Làm ngay (dùng công cụ)","Cao","Cao",None,"Xem Tử vi năm 2027 cho riêng bạn: 4 chỗ cần nhìn trên lá số","/thoi-gian-toi; /tu-vi","Xem 12 tháng tới của bạn",2,"P1"),
# ---- C1 Thần số ----
("C1","thần số học cho người mới bắt đầu","thần số học là gì; học thần số học từ đâu","Người mới","Thông tin","Cao","TB",None,"Thần số học cho người mới bắt đầu: 4 con số cần biết trước tiên","/than-so/y-nghia-so","Tính 4 con số của bạn (miễn phí)",1,"P1"),
("C1","tại sao thần số học ra 2 kết quả khác nhau","số chủ đạo 33 hay 6; cách cộng đường đời","Câu hỏi","So sánh – cân nhắc","TB","Thấp",None,"Vì sao cùng ngày sinh mà trang này ra số 33, trang kia ra số 6?","/than-so","Xem cả hai cách tính cho ngày sinh của bạn",1,"P1"),
("C1","thần số học có đúng không","thần số học có khoa học không; tự kiểm chứng thần số học","Câu hỏi","So sánh – cân nhắc","Cao","TB",None,"Thần số học có đúng không? Cách tự kiểm chứng bằng 3 điểm mạnh, 3 điểm mù","/than-so","Tự kiểm chứng con số của bạn",1,"P1"),
("C1","thần số học tên khai sinh hay tên thường gọi","tên có dấu tính thần số học; đổi tên thần số học","Câu hỏi","Thông tin","TB","Thấp",None,"Tính thần số học theo tên khai sinh hay tên thường gọi? Tên tiếng Việt có dấu tính thế nào","/than-so","Tính theo cả hai tên",3,"P2"),
("C1","thần số học pitago và chaldea khác nhau","chaldean numerology; nên theo trường phái nào","So sánh","So sánh – cân nhắc","Thấp","Thấp",None,"Thần số học Pitago và Chaldea khác nhau ở đâu? Nên theo cách nào","/than-so/so-kep","Xem số của bạn theo hai trường phái",3,"P2"),
("C1","ngày cá nhân thần số học dùng mỗi ngày","ngày cá nhân là gì; hôm nay là ngày số mấy","Cách làm","Làm ngay (dùng công cụ)","Thấp","Thấp",None,"Ngày cá nhân trong thần số học: thói quen 1 phút mỗi sáng","/hom-nay","Xem hôm nay của bạn",3,"P2"),
("C1","cách đọc biểu đồ ngày sinh thần số học","mũi tên thần số học; trục 1-5-9","Cách làm","Thông tin","TB","Thấp",None,"Cách đọc biểu đồ ngày sinh và các mũi tên cho người mới","/than-so","Xem biểu đồ ngày sinh của bạn",4,"P2"),
("C1","số chủ đạo có thay đổi không","câu hỏi thường gặp thần số học","Câu hỏi","Thông tin","TB","Thấp",None,"Số chủ đạo có thay đổi không? 7 câu người mới hay hỏi về thần số học","/than-so/y-nghia-so","Tính số chủ đạo",4,"P3"),
("C1","thần số học cho con cha mẹ nên biết","thần số học trẻ em; chọn nghề cho con theo thần số học","Tình huống","Thông tin","TB","Thấp",None,"Dùng thần số học để hiểu con: cha mẹ nên làm và không nên làm gì","/than-so/nghe-nghiep","Xem số của con",5,"P2"),
("C1","4 đỉnh cao thần số học cách tính","đỉnh cao cuộc đời; thử thách thần số học","Cách làm","Thông tin","TB","Thấp",None,"4 đỉnh cao trong thần số học: cách tính và đọc giai đoạn bạn đang đi","/than-so","Xem đỉnh cao của bạn",5,"P2"),
("C1","thiếu số trong biểu đồ ngày sinh","số thiếu thần số học; thiếu số 5","Câu hỏi","Thông tin","TB","Thấp",None,"Thiếu số trong biểu đồ ngày sinh: có phải điểm yếu không?","/than-so","Xem số thiếu của bạn",5,"P3"),
("C1","chỉ số linh hồn nhân cách sứ mệnh khác nhau","chỉ số linh hồn là gì; chỉ số sứ mệnh","So sánh","Thông tin","TB","Thấp",None,"Linh hồn, Nhân cách, Sứ mệnh: ba chỉ số từ họ tên khác nhau ở đâu","/than-so/y-nghia-so","Tính ba chỉ số từ họ tên",6,"P3"),
# ---- C2 Tử vi ----
("C2","không biết giờ sinh có xem tử vi được không","quên giờ sinh; định giờ sinh tử vi","Tình huống","Thông tin","TB","Thấp",None,"Không biết giờ sinh có xem Tử vi được không? 3 cách xử lý","/tu-vi","Lập lá số, thử định giờ sinh",1,"P1"),
("C2","tử vi và bát tự khác nhau thế nào","nên xem tử vi hay bát tự","So sánh","So sánh – cân nhắc","TB","Thấp",None,"Tử vi và Bát tự khác nhau thế nào? Nên xem môn nào trước","/tu-vi; /bat-tu","Lập cả hai lá số",2,"P1"),
("C2","sinh giờ tý 23h tử vi tính ngày nào","giờ tý muộn; sinh 23 giờ","Câu hỏi","Thông tin","Thấp","Thấp",None,"Sinh 23 giờ (giờ Tý muộn): lá số Tử vi tính sang ngày hôm sau hay không?","/tu-vi","Lập lá số đúng giờ Tý",3,"P2"),
("C2","vì sao lá số tử vi mỗi trang một khác","âm lịch việt nam và trung quốc lệch; lá số sai","Câu hỏi","So sánh – cân nhắc","TB","Thấp",None,"Vì sao lá số Tử vi mỗi trang một khác? Âm lịch Việt và lịch Trung Quốc lệch nhau","/tu-vi","Lập lá số theo âm lịch Việt Nam",3,"P2"),
("C2","cung mệnh vô chính diệu là gì","mệnh vô chính diệu tốt hay xấu","Câu hỏi","Thông tin","TB","Thấp",None,"Mệnh vô chính diệu là gì? Đọc thế nào cho đúng","/tu-vi/cung","Xem cung Mệnh của bạn",4,"P2"),
("C2","tứ hoá là gì cho người mới","hoá lộc hoá kỵ là gì","Người mới","Thông tin","TB","TB",None,"Tứ hoá cho người mới: Lộc, Quyền, Khoa, Kỵ và cách nhìn trên lá số","/tu-vi/tu-hoa","Xem tứ hoá trên lá số của bạn",4,"P2"),
("C2","tuần triệt là gì trong tử vi","tuần không triệt không; cung bị triệt","Câu hỏi","Thông tin","TB","Thấp",None,"Tuần, Triệt là gì trong lá số Tử vi? Hiểu đúng 'chậm' chứ không phải 'mất'","/tu-vi/cung","Xem Tuần Triệt trên lá số",6,"P3"),
("C2","cung thân là gì thân cư cung nào","thân cư quan lộc; thân cư phu thê","Câu hỏi","Thông tin","TB","Thấp",None,"Cung Thân là gì? Thân cư cung nào nói gì về nửa sau cuộc đời","/tu-vi/cung","Xem Thân cư cung nào",6,"P3"),
("C2","cách đọc cung phu thê cho người mới","cung phu thê có sao gì; xem tình duyên tử vi","Cách làm","Thông tin","Cao","Cao",None,"Đọc cung Phu Thê cho người mới: 5 bước, không phán hợp hay tan","/tu-vi/sao-o-cung","Xem cung Phu Thê của bạn",6,"P2"),
# ---- C3 Bát tự ----
("C3","mệnh thiếu hành gì cách xem","mệnh năm sinh khác ngũ hành bát tự; nạp âm","So sánh","So sánh – cân nhắc","Cao","TB",None,"Mệnh thiếu hành gì? Vì sao mệnh năm sinh khác ngũ hành trong Bát tự","/bat-tu; /bat-tu/menh-theo-nam","Xem ngũ hành trong lá số của bạn",2,"P1"),
("C3","lưu niên bát tự năm 2027","bát tự năm 2027 hợp hay khó","Cách làm","Làm ngay (dùng công cụ)","TB","Thấp","◷ Đỉnh 12–2","Lưu niên Bát tự: cách xem năm 2027 hợp hay khó với bạn","/bat-tu; /thoi-gian-toi","Xem năm 2027 trên lá số Bát tự",2,"P1"),
("C3","dụng thần là gì","cách tìm dụng thần; hỷ thần kỵ thần","Người mới","Thông tin","TB","TB",None,"Dụng thần là gì? Vì sao có hai cách lấy dụng thần","/bat-tu","Xem hai cách lấy dụng thần của bạn",4,"P2"),
("C3","thân vượng thân nhược là gì","cách biết thân vượng hay nhược","Câu hỏi","Thông tin","TB","Thấp",None,"Thân vượng, thân nhược là gì? Cách tự nhận ra trên lá số","/bat-tu/nhat-chu","Xem sức tự thân của bạn",4,"P2"),
("C3","đại vận bát tự cách xem","đại vận là gì; đang đi đại vận nào","Cách làm","Thông tin","TB","Thấp",None,"Đại vận trong Bát tự: cách biết mình đang đi vận nào, bao giờ đổi","/bat-tu","Xem đại vận đang đi",5,"P2"),
("C3","bổ khuyết ngũ hành bằng màu sắc nghề nghiệp","mệnh thiếu thủy nên làm gì; màu hợp mệnh","So sánh","So sánh – cân nhắc","Cao","Cao",None,"Bổ khuyết ngũ hành bằng màu sắc, nghề nghiệp: đâu là dân gian, đâu là sách Tử Bình","/bat-tu/thap-than","Xem hành bạn cần thêm",5,"P2"),
("C3","cách cục bát tự là gì","tử bình chân thuyên cách cục; chính quan cách","Người mới","Thông tin","Thấp","Thấp",None,"Cách cục Bát tự là gì? Đọc theo Tử Bình Chân Thuyên cho người mới","/bat-tu","Xem cách cục của bạn",6,"P3"),
("C3","thần sát đào hoa văn xương thiên ất quý nhân","đào hoa trong bát tự; quý nhân","Câu hỏi","Thông tin","TB","TB",None,"Đào Hoa, Văn Xương, Thiên Ất Quý Nhân: thần sát là gì, nên hiểu đến đâu","/bat-tu","Xem thần sát trên lá số",6,"P3"),
# ---- C4 Phong thuỷ ----
("C4","mua nhà cũ cần xem phong thủy gì","checklist xem nhà trước khi mua; xem nhà cũ","Tình huống","So sánh – cân nhắc","TB","TB",None,"Mua nhà cũ: 12 điều phong thuỷ nên xem trước khi đặt cọc","/phong-thuy/dau-hieu","Khảo sát căn nhà bạn định mua",1,"P1"),
("C4","đặt bếp hướng nào hợp tuổi","tọa hung hướng cát; bếp chung cư","Cách làm","Thông tin","Cao","Cao",None,"Đặt bếp theo tuổi: 'toạ hung hướng cát' là gì, nhà chật thì làm sao","/phong-thuy/huong-hop-tuoi","Tìm hướng bếp hợp bạn",2,"P2"),
("C4","phong thủy chung cư cho người mới","đo hướng chung cư ở đâu; hướng ban công","Người mới","Thông tin","Cao","Cao",None,"Phong thuỷ căn hộ chung cư cho người mới: đo hướng ở đâu, xử lý gì khi không đổi được cửa","/phong-thuy","Đo hướng căn hộ bằng điện thoại",4,"P1"),
("C4","cách đo hướng nhà bằng điện thoại","la bàn điện thoại đo hướng nhà","Cách làm","Làm ngay (dùng công cụ)","TB","Thấp",None,"Cách đo hướng nhà bằng la bàn điện thoại: 3 bước, tránh sai 15°","/phong-thuy","Mở la bàn đo hướng",4,"P1"),
("C4","nhà thuê có cần xem phong thủy không","phong thủy phòng trọ; phong thủy nhà thuê","Tình huống","Thông tin","TB","Thấp",None,"Ở nhà thuê có cần xem phong thuỷ? 7 việc 0 đồng nên làm","/phong-thuy/dau-hieu","Tìm hướng kê bàn, đầu giường",4,"P2"),
("C4","đặt bàn thờ trong chung cư","bàn thờ đặt hướng nào; kiêng đặt bàn thờ","Tình huống","Thông tin","Cao","Cao",None,"Đặt bàn thờ trong căn hộ: 6 lỗi hay gặp và cách sửa không tốn tiền","/phong-thuy/dau-hieu","Khảo sát nhà",5,"P2"),
("C4","đầu giường quay hướng nào","kê giường ngủ hợp tuổi","Cách làm","Làm ngay (dùng công cụ)","Cao","Cao",None,"Đầu giường quay hướng nào hợp tuổi? Cách tự tìm bằng điện thoại","/phong-thuy/huong-hop-tuoi","Tìm hướng đầu giường",5,"P2"),
("C4","phong thủy bàn làm việc văn phòng","hướng ngồi làm việc hợp tuổi","Tình huống","Thông tin","TB","TB",None,"Phong thuỷ bàn làm việc ở văn phòng: chọn hướng ngồi khi không được chọn chỗ","/phong-thuy/huong-hop-tuoi","Tìm hướng ngồi hợp bạn",6,"P3"),
# ---- C5 Kinh Dịch ----
("C5","cách đặt câu hỏi khi gieo quẻ","hỏi quẻ thế nào cho đúng","Cách làm","Thông tin","Thấp","Thấp",None,"Cách đặt câu hỏi khi gieo quẻ Kinh Dịch: 5 lỗi khiến quẻ 'không ứng'","/kinh-dich","Gieo quẻ hỏi việc",5,"P2"),
("C5","quẻ biến hào động là gì","quẻ chủ quẻ biến; hào động","Người mới","Thông tin","TB","Thấp",None,"Hào động, quẻ biến là gì? Đọc một quẻ có hào động cho người mới","/kinh-dich/que","Gieo quẻ và xem hào động",5,"P2"),
("C5","gieo quẻ online có chính xác không","gieo quẻ bằng điện thoại","Câu hỏi","So sánh – cân nhắc","TB","TB",None,"Gieo quẻ online có chính xác không? Điều gì quyết định một quẻ","/kinh-dich","Gieo quẻ 3 đồng xu online",5,"P2"),
("C5","kinh dịch cho người mới bắt đầu","đọc kinh dịch từ đâu; nhớ 64 quẻ","Người mới","Thông tin","TB","TB",None,"Kinh Dịch cho người mới: đọc từ đâu, nhớ 64 quẻ thế nào","/kinh-dich/que","Xem 64 quẻ",6,"P2"),
("C5","lục hào thế ứng dụng thần là gì","lục hào cho người mới","Người mới","Thông tin","Thấp","Thấp",None,"Lục hào cho người mới: Thế, Ứng, dụng thần nói gì","/kinh-dich","Gieo quẻ, xem Thế Ứng",6,"P3"),
("C5","gieo quẻ hỏi chuyện tình cảm","gieo quẻ hỏi người yêu có quay lại","Tình huống","Thông tin","TB","Thấp",None,"Gieo quẻ hỏi chuyện tình cảm: hỏi sao cho đúng, đọc quẻ thế nào","/kinh-dich","Gieo quẻ hỏi chuyện của bạn",6,"P2"),
# ---- C6 Tarot ----
("C6","tarot cho người mới bắt đầu","tự học tarot; học tarot ở đâu","Người mới","Thông tin","Cao","TB",None,"Tarot cho người mới bắt đầu: 7 ngày tự học, từ 22 lá ẩn chính","/tarot/la-bai","Rút thử 3 lá (miễn phí)",3,"P1"),
("C6","cách xào bài tarot và đặt câu hỏi","cách hỏi tarot; tráo bài tarot","Cách làm","Thông tin","TB","Thấp",None,"Cách xào bài Tarot và đặt câu hỏi để lá bài trả lời đúng việc","/tarot","Đặt câu hỏi và rút bài",3,"P1"),
("C6","lá bài ngược tarot có xấu không","ý nghĩa lá ngược; reversed tarot","Câu hỏi","Thông tin","TB","Thấp",None,"Lá Tarot ngược có xấu không? Cách đọc lá ngược cho người mới","/tarot/la-bai","Rút bài và xem lá ngược",3,"P1"),
("C6","hỏi tarot người ấy nghĩ gì về mình","tarot người ấy; tarot tình yêu","Tình huống","Thông tin","Cao","TB",None,"Hỏi Tarot 'người ấy nghĩ gì về mình': vì sao nên đổi câu hỏi và hỏi gì thay thế","/tarot","Hỏi Tarot về chuyện tình cảm của bạn",3,"P1"),
("C6","trải bài 3 lá tarot cách đọc","quá khứ hiện tại tương lai tarot","Cách làm","Làm ngay (dùng công cụ)","TB","Thấp",None,"Trải bài 3 lá Tarot: cách đọc Quá khứ – Hiện tại – Sắp tới","/tarot","Rút trải bài 3 lá",4,"P2"),
("C6","hỏi tarot có không được không","tarot yes no","Câu hỏi","Thông tin","TB","Thấp",None,"Hỏi Tarot 'có hay không' được không? Cách hỏi để có câu trả lời dùng được","/tarot","Hỏi Tarot việc có nên",4,"P2"),
("C6","xem tarot online có chính xác không","rút bài tarot online có ngẫu nhiên không","Câu hỏi","So sánh – cân nhắc","TB","TB",None,"Xem Tarot online có chính xác không? Rút bài trên máy khác rút tay ở đâu","/tarot","Rút bài online",4,"P2"),
("C6","trải bài celtic cross cách đọc","celtic cross 10 lá","Cách làm","Thông tin","Thấp","Thấp",None,"Trải bài Celtic Cross 10 lá cho người mới: vị trí và cách đọc lá kề nhau","/tarot","Rút Celtic Cross",6,"P3"),
("C6","bộ bài tarot cho người mới","rider waite thoth marseille khác nhau","So sánh","So sánh – cân nhắc","TB","TB",None,"Rider–Waite, Marseille, Thoth: bộ Tarot nào hợp người mới","/tarot/la-bai","Xem 78 lá Rider–Waite",6,"P3"),
# ---- C7 Nhân tướng ----
("C7","xem tướng mặt qua ảnh có chính xác không","xem tướng bằng ảnh; AI xem tướng","Câu hỏi","So sánh – cân nhắc","TB","Thấp",None,"Xem tướng mặt qua ảnh có chính xác không? Điều máy đo được và không đo được","/nhan-tuong","Tự soi gương có hướng dẫn",5,"P1"),
("C7","tam đình ngũ nhãn là gì","cách đo tam đình; khuôn mặt cân đối","Cách làm","Thông tin","TB","Thấp",None,"Tam đình, ngũ nhãn là gì? Cách tự đo trên khuôn mặt mình","/nhan-tuong/bo-vi","Đo tam đình trên ảnh",5,"P2"),
("C7","nốt ruồi trên mặt sách xưa nói gì","nốt ruồi trên mặt ý nghĩa; có nên tẩy nốt ruồi","Câu hỏi","Thông tin","Cao","Cao",None,"Nốt ruồi trên mặt: sách xưa nói gì, và vì sao không nên tẩy vì sợ 'tướng xấu'","/nhan-tuong/bo-vi","Xem vị trí nốt ruồi của bạn",5,"P2"),
("C7","nhân tướng học cho người mới 12 cung trên mặt","12 cung nhân tướng","Người mới","Thông tin","TB","TB",None,"Nhân tướng học cho người mới: 12 cung trên khuôn mặt nói gì","/nhan-tuong/bo-vi","Khảo sát gương mặt 6 bước",5,"P2"),
("C7","tướng tùy tâm sinh nghĩa là gì","tướng do tâm sinh","Câu hỏi","Thông tin","Thấp","Thấp",None,"'Tướng tuỳ tâm sinh' nghĩa là gì? Gương mặt đổi theo cách sống thế nào","/nhan-tuong","Xem bài đọc gương mặt",5,"P3"),
# ---- C9 Ngày tốt ----
("C9","chuyển nhà về nhà mới cần chuẩn bị gì","xem ngày nhập trạch; về nhà mới","Tình huống","Làm ngay (dùng công cụ)","Cao","Cao",None,"Chuyển nhà, về nhà mới: tự chọn ngày và danh sách việc 0 đồng","/xem-ngay-tot/ve-nha-moi-thang-12-2026","Lọc ngày về nhà mới",1,"P1"),
("C9","giờ hoàng đạo là gì cách tính","giờ hoàng đạo hôm nay","Câu hỏi","Thông tin","Cao","Cao",None,"Giờ hoàng đạo là gì? Cách tự tính 6 giờ tốt trong ngày","/xem-ngay-tot","Xem giờ tốt hôm nay",2,"P1"),
("C9","ngày hắc đạo có làm được việc không","ngày hoàng đạo hắc đạo khác nhau","Câu hỏi","Thông tin","TB","TB",None,"Ngày hắc đạo có làm được việc không? Hiểu đúng hoàng đạo – hắc đạo","/xem-ngay-tot","Xem ngày hôm nay",2,"P2"),
("C9","tam nương nguyệt kỵ là gì có cần kiêng không","ngày tam nương; mùng 5 14 23","Câu hỏi","Thông tin","TB","TB",None,"Tam nương, Nguyệt kỵ là gì? Có cần kiêng khi đi xa, khai trương","/xem-ngay-tot","Xem ngày bạn định làm việc",2,"P2"),
("C9","chọn ngày cưới hợp tuổi cả hai","xem ngày cưới hợp tuổi cô dâu chú rể bố mẹ","Cách làm","Làm ngay (dùng công cụ)","Cao","Cao",None,"Chọn ngày cưới hợp tuổi cả cô dâu, chú rể và bố mẹ: cách lọc ngày","/xem-ngay-tot","Chọn ngày cho cả nhà",2,"P1"),
("C9","tháng nhuận âm lịch là gì","sinh tháng nhuận tính tuổi; năm nhuận âm lịch","Câu hỏi","Thông tin","TB","Thấp",None,"Tháng nhuận âm lịch là gì? Sinh tháng nhuận, làm giỗ tháng nhuận tính thế nào","/lich-am; /doi-lich-am-duong","Đổi lịch âm – dương",3,"P2"),
# ---- C10 Hợp đôi ----
("C10","xem hợp tuổi vợ chồng có nên tin không","tuổi khắc có lấy nhau được không","Câu hỏi","So sánh – cân nhắc","Cao","Cao",None,"Xem hợp tuổi vợ chồng: đọc sao cho tỉnh táo khi kết quả 'khắc'","/hop-doi; /tu-vi#hop-tham","Xem lá số 2 người",3,"P1"),
("C10","thần số học hợp đôi cách tính","tính hợp nhau theo ngày sinh","Cách làm","Làm ngay (dùng công cụ)","TB","Thấp",None,"Hợp đôi theo thần số học: tính cho hai người thế nào, đọc nhịp năm của cả hai","/hop-doi/cap-so","Xem hợp đôi theo ngày sinh",3,"P1"),
("C10","tứ hành xung là gì","tuổi tứ hành xung lấy nhau","Câu hỏi","Thông tin","Cao","TB",None,"Tứ hành xung là gì? Hai người thuộc nhóm xung nhau nên hiểu thế nào","/hop-doi; /bat-tu/menh-theo-nam","Xem hai người hợp ở đâu",3,"P1"),
("C10","mệnh vợ chồng khắc nhau thì làm sao","ngũ hành vợ chồng tương khắc","Tình huống","Thông tin","TB","TB",None,"Mệnh vợ chồng khắc nhau thì làm sao? Ngũ hành sinh khắc cho người mới","/hop-doi","Xem lá số 2 người",3,"P2"),
("C10","xem hợp tuổi làm ăn","hợp tuổi hợp tác kinh doanh","Câu hỏi","So sánh – cân nhắc","TB","TB",None,"Xem hợp tuổi làm ăn: dùng để tham khảo, đừng dùng để chọn người","/tu-vi#hop-tham","Xem lá số 2 người (đồng nghiệp)",3,"P2"),
# ---- C11 Huyền học & AI ----
("C11","xem tử vi bằng chatgpt có chính xác không","hỏi AI xem bói; AI xem tử vi","Câu hỏi","So sánh – cân nhắc","TB","Thấp","↑ Đang lên nhanh","Hỏi ChatGPT xem Tử vi được không? 4 chỗ AI hay tính sai và cách kiểm","/tu-vi; /than-so","Lập lá số bằng bộ tính cố định",1,"P1"),
("C11","huyền học là gì có phải mê tín không","huyền học có khoa học không","Câu hỏi","Thông tin","TB","TB",None,"Huyền học là gì, có phải mê tín không? Cách dùng tỉnh táo","/huyen-hoc","Xem 7 môn huyền học",1,"P1"),
("C11","nên bắt đầu tìm hiểu huyền học từ đâu","người mới học huyền học","Người mới","So sánh – cân nhắc","Thấp","Thấp",None,"7 môn huyền học cho người mới: nên bắt đầu từ môn nào (bảng so sánh)","/huyen-hoc","Bắt đầu với thần số học",1,"P1"),
("C11","mbti và thần số học khác nhau","mbti hay thần số học chính xác hơn","So sánh","So sánh – cân nhắc","TB","Thấp","↑ Đang lên","MBTI và thần số học khác nhau thế nào? Dùng cái nào để hiểu mình","/than-so","Tính 4 con số của bạn",3,"P2"),
("C11","cung hoàng đạo và con giáp khác nhau","12 cung hoàng đạo hay 12 con giáp","So sánh","Thông tin","Cao","Cao",None,"Cung hoàng đạo và con giáp khác nhau thế nào? Phương Tây và phương Đông nhìn bạn ra sao","/huyen-hoc; /bat-tu/menh-theo-nam","Xem mệnh theo năm sinh",3,"P3"),
]
assert len(A) == 88, len(A)

# lich 26 tuan
BAT_DAU = dt.date(2026,11,16)
def cap(w): return 4 if w <= 10 else 3
THANG = {1:range(1,5),2:range(5,9),3:range(9,14),4:range(14,18),5:range(18,23),6:range(23,27)}
uu = {"P1":0,"P2":1,"P3":2}
lich = {w:[] for w in range(1,27)}
for m, ws in THANG.items():
    bai = [i for i,a in enumerate(A) if a[11]==m]
    bai.sort(key=lambda i:(uu[A[i][12]], i))
    slots = [w for w in ws for _ in range(cap(w))]
    assert len(bai) == len(slots), (m, len(bai), len(slots))
    # tro tron theo cum de moi tuan co nhieu cum: phat lan luot
    for i, w in zip(bai, slots):
        lich[w].append(i)
tuan_cua = {i:w for w,l in lich.items() for i in l}

MOC = {
 1:"Bắt đầu đợt Tết: bài xông đất, Tam tai, Kim lâu lên trước để Google kịp lập chỉ mục",
 3:"Đầu tháng 12: mùa làm nhà, cưới cuối năm",
 6:"22/12 Đông chí · Tết dương 1/1/2027 → bài năm cá nhân, năm phổ quát 11",
 8:"Hạn chót bài Tết: đăng xong trước 10/1/2027",
 11:"Cuối tháng Chạp: đỉnh tìm kiếm xông đất, xuất hành",
 12:"~4/2 Lập xuân · 5/2 Giao thừa · 6/2 mùng 1 Tết Đinh Mùi",
 13:"14/2 Valentine · 15/2 vía Thần tài · 20/2 Rằm tháng Giêng",
 14:"Sau Tết: khai trương, cưới mùa xuân → cập nhật bài ngày tốt",
 18:"Đợt Nhân tướng + Kinh Dịch",
 23:"Đợt hoàn thiện cụm Tử vi, Bát tự, Tarot",
 26:"Tổng kết 6 tháng, chọn cụm cho đợt sau",
}

CU = [ # slug bai cu, viec, ly do, tuan
("tu-vi-ly-so-la-gi-cach-hieu-la-so-va-kiem-tra-du-lieu-sinh","GỘP vào tu-vi-la-gi-cau-truc-la-so-cach-doc-va-gioi-han (308 qua slug_cu)","Hai bài cùng nhắm 'tử vi là gì' → tự tranh nhau",1),
("phong-thuy-nha-o-theo-tuoi-cach-tinh-huong-va-doi-chieu-can-nha","GỘP vào cach-xem-huong-nha-hop-tuoi","Cùng nhắm 'hướng nhà hợp tuổi'",2),
("xem-than-so-hoc-numerology-cach-tinh-va-doc-ho-so-tinh-tao","GỘP vào cach-tinh-than-so-hoc-tu-ngay-sinh-va-ho-ten","Cùng nhắm 'cách tính thần số học'",3),
("xem-hop-doi-xem-tinh-yeu-boi-tinh-yeu-boi-nguoi-do-doc-sao-cho-tinh-tao","SỬA tiêu đề + slug: 'Xem hợp đôi theo ngày sinh: đọc sao cho tỉnh táo' (giữ slug cũ trong slug_cu)","Tiêu đề nhồi 4 từ khoá; 'bói người đó' trái ranh giới không đọc người khác",4),
("xem-boi-dong-nghiep-xem-boi-sep-xem-hop-sep-dung-the-nao-cho-huu-ich","SỬA tiêu đề: 'Xem hợp với sếp, đồng nghiệp: dùng thế nào cho hữu ích' + thêm câu không dùng để chọn người","Tiêu đề nhồi từ khoá; ranh giới tuyển dụng",5),
("xem-kinh-dich-huyen-khong-phi-tinh-bat-tu-chon-dung-phuong-phap-truy-van","SỬA tiêu đề: 'Kinh Dịch, Huyền Không hay Bát tự: việc nào hỏi môn nào' (bài so sánh cho C11)","Tiêu đề liệt kê 3 môn, không rõ câu hỏi",6),
("luan-giai-la-so-tu-vi-tron-doi-6-buoc-doc-va-tu-doi-chieu","PHÂN VAI: giữ 'lá số tử vi trọn đời'; bài cach-xem-tu-vi-lap-la-so giữ 'cách xem tử vi' — sửa đoạn trùng, liên kết hai chiều","Hai bài gần nhau",7),
("vong-tron-ngu-hanh-cach-doc-tuong-sinh-va-tuong-khac","PHÂN VAI: giữ 'tương sinh tương khắc'; ngu-hanh-la-gi giữ 'ngũ hành là gì'","Gần nhau",8),
("than-so-hoc-la-gi","CẬP NHẬT: thêm mục 'hai cách tính đường đời', liên kết 6 bài C1 mới","Bài trụ blog của cụm C1",9),
("cach-xem-tu-vi-lap-la-so-va-doc-12-cung-tung-buoc","CẬP NHẬT: thêm 'Tử vi năm 2027', liên kết C2 mới","Đón mùa Tết",10),
("bat-tu-la-gi-cach-doc-tu-tru","CẬP NHẬT: liên kết C3 (dụng thần, thân vượng, Lập xuân)","Bài trụ blog C3",11),
("cach-xem-huong-nha-hop-tuoi","CẬP NHẬT sau gộp: thêm mục chung cư + đo bằng điện thoại","Bài trụ blog C4",12),
("cach-gieo-que-kinh-dich-bang-3-dong-xu","CẬP NHẬT: liên kết C5 (đặt câu hỏi, hào động)","Bài trụ blog C5",13),
("que-kinh-dich-mai-hoa-cach-lap-que-va-luan-que-co-can-cu","CẬP NHẬT: thêm 'quẻ ngày của riêng bạn' (hai số tự nghĩ)","Làm mới",14),
("xem-van-han-cach-doc-dai-han-tu-vi-va-hieu-gioi-han-cua-loi-luan","CẬP NHẬT: thêm năm 2027 và năm nên chú ý (CY-1)","Mùa vận hạn",15),
("xem-tai-loc-doc-van-tien-bac-va-bien-goi-y-thanh-ke-hoach-thuc-te","CẬP NHẬT: câu 'không phải lời khuyên đầu tư', liên kết Thời gian tới","Ranh giới CY-1",16),
("xem-su-nghiep-dung-than-so-hoc-tu-vi-va-bat-tu-de-soi-huong-di","CẬP NHẬT: liên kết Chân dung tổng hợp","Nối ba môn",17),
("ten-theo-ngu-hanh-6-buoc-chon-ten-co-y-nghia-va-de-dung","CẬP NHẬT: liên kết bài bổ khuyết ngũ hành (C3)","Nối cụm",18),
("ngu-hanh-la-gi-hieu-kim-moc-thuy-hoa-tho-va-cac-moi-quan-he","CẬP NHẬT: bảng ngũ hành từ dữ liệu engine","Làm dày",19),
("tu-vi-la-gi-cau-truc-la-so-cach-doc-va-gioi-han","CẬP NHẬT sau gộp: hợp nhất phần hay của bài bị gộp","Sau gộp",20),
("cach-tinh-than-so-hoc-tu-ngay-sinh-va-ho-ten","CẬP NHẬT sau gộp: ví dụ tên có dấu, Chaldea","Sau gộp",21),
("xem-phong-thuy-cach-tu-danh-gia-nha-o-va-chon-viec-nen-uu-tien","CẬP NHẬT: liên kết bài mua nhà cũ, nhà thuê","Nối cụm",22),
("astrology-la-gi-cach-doc-ban-do-sao-va-hieu-gioi-han-cua-chiem-tinh","CẬP NHẬT: nối bài cung hoàng đạo – con giáp (C11)","Cầu nối Đông – Tây",23),
("self-discovery-tu-hieu-minh-qua-gia-tri-thoi-quen-va-lua-chon","CẬP NHẬT: nối bài MBTI – thần số học","Định vị thương hiệu",24),
("(bài có nhiều hiển thị, ít nhấp trong Search Console)","VIẾT LẠI tiêu đề + mô tả theo truy vấn thật","Theo số liệu",25),
("(bài 90 ngày không có hiển thị)","GỘP hoặc noindex","Dọn kho",26),
]

KPI = [
("Lập chỉ mục","% bài mới được Google lập chỉ mục sau 4 tuần","Search Console → Trang","≥ 80%","Dưới 60% → kiểm liên kết nội bộ, gửi IndexNow, xin lập chỉ mục"),
("Hiển thị theo cụm","Số truy vấn khác nhau có hiển thị, lọc theo đường dẫn /blog + từ khoá cụm","Search Console → Hiệu suất, regex","Tăng mỗi tháng","Cụm không tăng sau 8 tuần → xem lại ý định tìm kiếm"),
("Câu hỏi đuôi dài","Số truy vấn có 'là gì|cách|có nên|có… không|vì sao|làm sao' có hiển thị","Search Console, regex","Tăng mỗi tháng","Đây là chỉ số chính của kế hoạch"),
("Thứ hạng đuôi dài","Thứ hạng trung bình của từ khoá chính từng bài","Search Console theo trang","≤ 20 sau 8 tuần, ≤ 10 sau 16 tuần","Không đạt → làm dày bài, thêm bảng / ví dụ"),
("Từ bài sang công cụ","Tỉ lệ bấm CTA cuối bài","PostHog cross_cta_clicked{tu: blog}, end_cta_clicked","Đặt mốc sau 4 tuần đầu","Đây là chỗ khâu Thu hút nối sang Trải nghiệm"),
("Đọc hết bài","reading_completed{mo_dun: blog} / lượt xem bài","PostHog","Đặt mốc sau 4 tuần đầu","Thấp → câu trả lời đầu bài chưa trúng ý"),
("Bắt đầu bài đọc","reading_started của mảng tương ứng, nguồn vào là /blog","PostHog","Tăng mỗi tháng","Chỉ số kinh doanh của nội dung"),
("AI trích","landing_viewed.den_tu = ai; nhắc tên hieuban trong ChatGPT, Perplexity, AI Overviews","PostHog + kiểm tay 20 câu hỏi/tháng","Tăng mỗi tháng","Bài có câu trả lời 40–60 chữ + bảng dễ được trích"),
("Mùa vụ","Nhấp từ cụm C8 tháng 1–2/2027","Search Console","Đặt mốc trong tháng 12","Rút bài học cho mùa Tết 2028"),
]

Y = [
("1","Phân vai từ khoá: từ khoá chính cho trang công cụ / trang lá; blog chỉ nhận câu hỏi đuôi dài","Site đã có hơn 1.000 trang tự dựng (sinh năm X mệnh gì, sao ở cung, 64 quẻ, 78 lá, tuổi xông đất theo năm…). Nếu blog cũng nhắm 'tuổi xông đất 2027' thì blog tranh với chính trang công cụ. Cột 'Trang lá nối tới' trong bảng là nơi nhận từ khoá chính; blog trả lời câu hỏi xung quanh rồi dẫn về đó.","Cao"),
("2","Lấy từ khoá đuôi dài từ chính người dùng","Kho câu hỏi có nhãn trong engine (thần số + 5 mảng huyền học, vài nghìn câu), mã ý định Hôm nay (HN-4), /quan-tri/hoi-dap (câu trả lời chưa tốt). Mỗi tháng rút 5 câu hỏi hay gặp nhất mà chưa có bài → thêm vào bảng. Đối thủ không có dữ liệu này.","Cao"),
("3","Lịch theo âm lịch, đăng trước đỉnh 6–8 tuần","Huyền học Việt Nam xoay quanh Tết. Bài mùa vụ phải đăng xong trước 10/1/2027 cho đỉnh cuối tháng 1 – đầu tháng 2. Sheet 'Mốc mùa vụ' ghi rõ từng mốc.","Cao"),
("4","Mỗi bài có một thứ trang khác không có","Ví dụ tính tay đúng ngày sinh, hai cách tính ra hai số, bảng số do engine tính, ảnh tóm tắt có QR, 'sách xưa nói gì' trích nguồn. Google gọi đây là thông tin mới (information gain); thiếu nó thì bài đuôi dài cũng khó lên.","Cao"),
("5","Viết cho cả AI (AEO/GEO)","Đầu bài là câu trả lời 40–60 chữ đứng riêng được; mỗi H2 là một câu hỏi; có bảng; trích nguồn cổ thư. AI Overviews làm giảm nhấp ở nhiều câu hỏi đuôi dài, nên mục tiêu thêm: được AI nhắc tên + người đọc bấm vào công cụ. Bing quan trọng vì ChatGPT / Copilot tìm bằng Bing — IndexNow đã có.","Cao"),
("6","Nối ngang giữa các cụm theo nỗi lo","Cùng một nỗi lo (tiền, việc, tình, nhà) có bài ở nhiều môn. Mỗi bài thêm một liên kết 'cùng câu hỏi, môn khác nhìn thế nào' → người đọc đi tiếp, Google thấy site sâu về cả chủ đề.","TB"),
("7","Cầu nối Đông – Tây ở chỗ người mới phân vân","Thần số (Pitago) ↔ Lạc Thư; Tarot ↔ Kinh Dịch (rút bài và gieo quẻ đều là hỏi một việc); cung hoàng đạo ↔ con giáp; MBTI ↔ thần số. Bài so sánh là ý định 'cân nhắc' — người đọc sắp chọn công cụ.","TB"),
("8","Sửa bài cũ trước khi viết thêm","3 cặp bài trùng từ khoá, 3 tiêu đề nhồi từ khoá. Gộp / sửa trong tuần 1–8, rồi mỗi tuần cập nhật 1 bài (sheet 'Bài cũ').","Cao"),
("9","Lời hứa tiêu đề = khác biệt + an toàn","'Tự kiểm chứng', 'không cần thầy', 'việc 0 đồng', 'đọc sao cho tỉnh táo'. Không phán, không doạ, không đọc người khác. Đúng ranh giới của dự án và hợp với hướng dẫn nội dung hữu ích của Google cho chủ đề nhạy cảm.","TB"),
("10","Mỗi bài thành 3 mẩu phân phối","Ảnh tóm tắt có QR, một video ngắn 30–45 giây, một bài fanpage có link trỏ thẳng trang trụ (không trỏ trang chủ). Liên kết ngoài về đúng trang giúp cả cụm.","TB"),
("11","Quyết theo cụm, không theo bài","Site mới, Google còn đang thu thập. Xem số theo cụm sau 8–12 tuần. Cụm có hiển thị → viết thêm; bài 90 ngày không hiển thị → gộp hoặc noindex.","TB"),
("12","Phương Tây: chưa mở cụm chiêm tinh","Cung hoàng đạo được tìm rất nhiều nhưng site chưa có công cụ chiêm tinh. Kế hoạch chỉ có 1–2 bài cầu nối. Muốn mở cụm này thì cần quyết làm công cụ trước.","Chờ anh quyết"),
]

def lich_rows():
    rows=[]
    for w in range(1,27):
        d = BAT_DAU + dt.timedelta(weeks=w-1)
        m = next(k for k,v in THANG.items() if w in v)
        bai = lich[w]
        cu = next((c for c in CU if c[3]==w), None)
        rows.append([w, d.strftime("%d/%m/%Y"), (d+dt.timedelta(days=6)).strftime("%d/%m/%Y"), m, len(bai)] +
            [f"{A[i][8]}  [{A[i][0]}]" for i in bai] + [""]*(4-len(bai)) +
            [cu[1].split(":")[0] + ": " + cu[0] if cu else "", MOC.get(w,"")])
    return rows

def main(out):
    wb = Workbook()
    H = Font(bold=True, color="FFFFFF"); F = PatternFill("solid", fgColor="1F3A5F")
    wrap = Alignment(wrap_text=True, vertical="top")
    def sheet(ten, cot, rows, rong):
        ws = wb.create_sheet(ten)
        ws.append(cot)
        for c in ws[1]: c.font=H; c.fill=F; c.alignment=wrap
        for r in rows: ws.append(r)
        for i,w in enumerate(rong,1): ws.column_dimensions[get_column_letter(i)].width=w
        for row in ws.iter_rows(min_row=2):
            for c in row: c.alignment=wrap
        ws.freeze_panes="B2"; ws.auto_filter.ref = ws.dimensions
        return ws
    wb.remove(wb.active)
    sheet("Hướng dẫn", ["Mục","Nội dung"], [
        ["Kế hoạch","Từ khoá SEO / GEO / AEO 6 tháng cho blog hieuban.com — 16/11/2026 → 16/5/2027"],
        ["Nhịp đăng","4 bài mới/tuần ở tuần 1–10 (mùa Tết), 3 bài mới/tuần ở tuần 11–26 → 88 bài mới + 26 lượt sửa/gộp bài cũ"],
        ["Theo tháng","Tháng 1: 16 · Tháng 2: 16 · Tháng 3: 17 · Tháng 4: 12 · Tháng 5: 15 · Tháng 6: 12 bài mới"],
        ["Lượng tìm, độ khó","ƯỚC LƯỢNG theo cấp (Cao / TB / Thấp), CHƯA ĐO: phiên làm việc không truy cập được Google Trends, Keyword Planner, và Search Console của hieuban.com chưa nối. Đối chiếu lại bằng Search Console sau 4 tuần và Keyword Planner khi có."],
        ["Xu hướng 12 tháng","Suy luận từ mùa vụ âm lịch và xu hướng ngành (Tarot, nhân tướng, hỏi AI đang lên; thần số ổn định sau đỉnh 2021–22). Ký hiệu: ↑ lên · → ổn định · ↓ xuống · ◷ mùa vụ."],
        ["Quy tắc vàng","Từ khoá chính → trang công cụ / trang lá đã có. Blog → câu hỏi đuôi dài, rồi dẫn về trang đó. Không viết bài trùng từ khoá với trang đã có."],
        ["Khuôn một bài","H1 = câu hỏi · câu trả lời 40–60 chữ đầu bài · H2 theo câu hỏi phụ · 1 bảng hoặc ví dụ tính · 'Sách xưa nói gì' (nếu có nguồn) · 3–5 câu hỏi thường gặp · CTA công cụ · 3 link trang lá + 1 bài cùng cụm + trang trụ · ảnh tóm tắt · ranh giới (SK-1 sức khoẻ, CY-1 tiền / pháp lý)"],
        ["Tài liệu đầy đủ","docs/KE-HOACH-TU-KHOA-SEO-6-THANG.md trong repo"],
    ], [22,120])
    sheet("Cụm chủ đề", ["Mã","Cụm","Trang trụ","Xu hướng 12 tháng (suy luận)","Vai trò","Số bài mới"],
        [[k, v[0], v[1], v[2], v[3], sum(1 for a in A if a[0]==k)] for k,v in CUM.items()], [6,24,16,40,60,10])
    rows=[]
    for n,a in enumerate(A,1):
        c=CUM[a[0]]
        w=tuan_cua[n-1]; d=BAT_DAU+dt.timedelta(weeks=w-1)
        rows.append([f"K{n:03d}", a[0], c[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7] or c[2], a[8], "/blog/"+slug(a[1]), c[1], a[9], a[10], a[12], a[11], w, d.strftime("%d/%m/%Y"), "Chưa viết"])
    sheet("Từ khoá & bài viết", ["Mã","Cụm","Tên cụm","Từ khoá chính","Từ khoá phụ / câu hỏi liên quan","Dạng","Ý định tìm kiếm","Lượng tìm (ước lượng)","Độ khó (ước lượng)","Xu hướng 12 tháng","Tiêu đề đề xuất (H1)","Đường dẫn đề xuất","Trang trụ","Trang lá nối tới (nhận từ khoá chính)","CTA cuối bài","Ưu tiên","Tháng","Tuần","Ngày bắt đầu tuần","Trạng thái"],
        rows, [7,6,18,30,34,11,18,10,10,26,50,40,14,30,28,8,7,7,12,11])
    sheet("Lịch 26 tuần", ["Tuần","Từ","Đến","Tháng","Số bài","Bài 1","Bài 2","Bài 3","Bài 4","Sửa / gộp bài cũ","Mốc mùa vụ"], lich_rows(), [6,11,11,7,7,40,40,40,40,40,40])
    sheet("Bài cũ", ["Bài hiện có (/blog/…)","Việc cần làm","Lý do","Tuần"], [list(c) for c in CU], [55,70,45,7])
    sheet("Mốc mùa vụ", ["Tuần","Ngày bắt đầu tuần","Mốc"], [[w,(BAT_DAU+dt.timedelta(weeks=w-1)).strftime("%d/%m/%Y"),t] for w,t in MOC.items()], [7,14,90])
    sheet("Chỉ số đo", ["Chỉ số","Đo gì","Ở đâu","Mục tiêu","Nếu không đạt"], [list(k) for k in KPI], [18,50,34,24,50])
    sheet("Ý tưởng nâng cấp", ["#","Ý tưởng","Vì sao, làm thế nào","Mức tác động"], [list(y) for y in Y], [4,44,110,12])
    wb.save(out)
    json.dump({"bai":[dict(zip(["cum","tu_khoa","phu","dang","y_dinh","luong","kho","xu_huong","tieu_de","trang_la","cta","thang","uu_tien"],a), tuan=tuan_cua[i], slug=slug(a[1])) for i,a in enumerate(A)]},
              open(out.replace(".xlsx",".json"),"w",encoding="utf-8"), ensure_ascii=False, indent=1)
    # in bang tom tat cho md
    for w in range(1,27):
        d=BAT_DAU+dt.timedelta(weeks=w-1)
        print(f"| {w} | {d:%d/%m} | " + "<br>".join(A[i][8] for i in lich[w]) + " |")

main(sys.argv[1])
