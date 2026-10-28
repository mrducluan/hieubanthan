// Kịch bản dựng cho video 1–5 của docs/KICH-BAN-VIDEO-NGAN.md (dọc 9:16, 1080×1920, 30 fps).
//
// Mỗi cảnh:
//   noi     — lời đọc gửi ElevenLabs v3, mỗi phần tử một câu; tag cảm xúc trong [ngoặc vuông], số đọc bằng chữ.
//   phu_de  — phụ đề tương ứng TỪNG câu của `noi` (cùng số phần tử); *chữ* = tô vàng.
//   toi_thieu — thời lượng tối thiểu (giây) theo khung kịch bản; khi đã có giọng thật, cảnh dài theo giọng.
//   loai + tham số — kiểu hình (xem dung.mjs).
//
// Ranh giới (CLAUDE.md + đầu docs/KICH-BAN-VIDEO-NGAN.md): không doạ, không phán hung, không tên bệnh, không nêu tên
// hãng khác, không xin ngày sinh công khai, không nói "AI xem bói". Số liệu trên màn hình lấy từ ảnh chụp web thật
// (engine + web chạy cục bộ, hồ sơ mẫu "Nguyễn Minh Anh", 24/10/1988, nữ, Hà Nội, 07:30).

export const MIEN_TRU = "Kết quả để tham khảo và tự soi — quyết định vẫn là của bạn.";

export const VIDEO = [
  {
    ma: "v01",
    ten: "Cùng một ngày sinh, sao trang này ra 33, trang kia ra 6?",
    duong: "/than-so",
    utm: "vd01",
    canh: [
      {
        id: "hook", loai: "hai_so", toi_thieu: 5,
        so_trai: "33", so_phai: "6", nhan: "Đường đời", tieu_tren: "Cùng một ngày sinh", tieu_de: "Ai sai?",
        noi: [
          "[excited] Cùng một ngày sinh. Trang này nói bạn số ba mươi ba. Trang kia nói số sáu.",
          "[curious] Vậy... ai sai?",
        ],
        phu_de: ["Cùng một ngày sinh. Trang này nói bạn số *33*. Trang kia nói số *6*.", "Vậy… ai sai?"],
      },
      {
        id: "cong-het", loai: "phep_tinh", toi_thieu: 13,
        ngay: "24 / 10 / 1988",
        dong: [{ chu: "2 + 4 + 1 + 0 + 1 + 9 + 8 + 8", ket: "33" }],
        nhan: "Số Bậc thầy",
        noi: [
          "Mình thử ngày hai mươi tư, tháng mười, năm một nghìn chín trăm tám mươi tám.",
          "Cộng hết từng chữ số: hai, bốn, một, không, một, chín, tám, tám...",
          "[excited] ra ba mươi ba — số Bậc thầy!",
        ],
        phu_de: [
          "Mình thử ngày 24 tháng 10 năm 1988.",
          "Cộng hết từng chữ số: 2 + 4 + 1 + 0 + 1 + 9 + 8 + 8…",
          "ra *33* — số Bậc thầy!",
        ],
      },
      {
        id: "rut-gon", loai: "phep_tinh", toi_thieu: 14,
        ngay: "24 / 10 / 1988",
        dong: [
          { chu: "Ngày 24 → 2 + 4", ket: "6" },
          { chu: "Tháng 10 → 1 + 0", ket: "1" },
          { chu: "Năm 1988 → 26 → 2 + 6", ket: "8" },
          { chu: "6 + 1 + 8 = 15 → 1 + 5", ket: "6", lon: true },
        ],
        noi: [
          "[curious] Nhưng nếu rút gọn từng phần trước thì sao?",
          "Ngày hai mươi tư thành sáu. Tháng mười thành một. Năm một chín tám tám ra hai mươi sáu, rồi thành tám.",
          "Cộng lại mười lăm... [dramatic pause] ra sáu.",
        ],
        phu_de: [
          "Nhưng nếu *rút gọn từng phần* trước thì sao?",
          "Ngày 24 → 6. Tháng 10 → 1. Năm 1988 → 26 → 8.",
          "Cộng lại 15… ra *6*.",
        ],
      },
      {
        id: "man-hinh-cach", loai: "man_hinh", toi_thieu: 18,
        anh: "v1-cach-xem-mo.jpg", truot: [0, 1],
        nhan_noi: [{ chu: "Rút gọn con số → 6", y: 1010, tre: 0.35 }, { chu: "Cộng hết chữ số → 33", y: 1010, tre: 0.6, phai: true }],
        noi: [
          "[laughs] Không ai sai cả!",
          "Đó là hai cách tính có thật trong sách thần số.",
          "Hiểu Bản Thân hiện cả hai, cho bạn chọn, và báo luôn khi hai cách ra số khác nhau.",
        ],
        phu_de: [
          "Không ai sai cả!",
          "Đó là *hai cách tính có thật* trong sách thần số.",
          "Hiểu Bản Thân hiện *cả hai*, cho bạn chọn, và báo khi hai cách ra số khác nhau.",
        ],
      },
      {
        id: "tu-tich", loai: "man_hinh", toi_thieu: 15,
        anh: "v1-kiem-chung.jpg", anh_sau: "v1-kiem-chung-tich.jpg", doi_luc: 0.45, truot: [0, 0.08],
        nhan_noi: [{ chu: "3 điểm mạnh · 3 điểm mù", y: 300, tre: 0.15 }],
        noi: [
          "Mà không bắt bạn tin đâu nhé.",
          "Mỗi số có ba điểm mạnh, ba điểm mù — bạn tự tích nét nào đúng.",
          "[curious] Đúng ít quá? Web gợi ý số khác của chính bạn.",
        ],
        phu_de: [
          "Mà không bắt bạn tin đâu nhé.",
          "Mỗi số có 3 điểm mạnh, 3 điểm mù — bạn *tự tích* nét nào đúng.",
          "Đúng ít quá? Web gợi ý số khác của chính bạn.",
        ],
      },
      {
        id: "lat", loai: "chu", toi_thieu: 10,
        dong: ["Số của bạn", "*có đổi* không?"], phu: "Comment con số bạn ra ↓",
        noi: [
          "[mischievously] Giờ thử ngày sinh của bạn xem: hai cách có ra cùng một số không?",
          "[excited] Comment con số bạn ra nhé!",
        ],
        phu_de: ["Thử ngày sinh của bạn: hai cách có ra *cùng một số* không?", "Comment *con số* bạn ra nhé!"],
      },
      {
        id: "cta", loai: "cta", toi_thieu: 10,
        chip: ["Họ tên + ngày sinh", "30 giây", "Miễn phí"],
        noi: [
          "Vào hiểu bản thân chấm com, nhập họ tên và ngày sinh.",
          "[excited] Ba mươi giây có bốn con số cốt lõi. Miễn phí!",
        ],
        phu_de: ["Vào *hieuban.com*, nhập họ tên + ngày sinh.", "30 giây có 4 con số cốt lõi. *Miễn phí!*"],
      },
    ],
  },

  {
    ma: "v02",
    ten: "Vì sao bạn luôn tỏ ra ổn, nhưng bên trong mệt muốn chết?",
    duong: "/than-so",
    utm: "vd02",
    canh: [
      {
        id: "hook", loai: "pin", toi_thieu: 5,
        dong: ["Ai cũng nói bạn *mạnh mẽ*.", "Chỉ bạn biết bạn mệt cỡ nào."],
        noi: ["[softly] Ai cũng nói bạn mạnh mẽ.", "[sighs] Chỉ bạn biết... bạn mệt cỡ nào."],
        phu_de: ["Ai cũng nói bạn *mạnh mẽ*.", "Chỉ bạn biết… bạn mệt cỡ nào."],
      },
      {
        id: "keo", loai: "keo_hai_huong", toi_thieu: 15,
        trai: "Bên trong", phai: "Bên ngoài",
        noi: [
          "Có khi... không phải bạn yếu.",
          "[curious] Mà là hai con số trong bạn đang kéo về hai hướng.",
        ],
        phu_de: ["Có khi… không phải bạn yếu.", "Mà là *hai con số* trong bạn đang kéo về hai hướng."],
      },
      {
        id: "hai-vong", loai: "hai_vong", toi_thieu: 20,
        trong: { ten: "Linh hồn", nguon: "nguyên âm trong tên", vd: "7", nghia: "cần khoảng lặng" },
        ngoai: { ten: "Nhân cách", nguon: "phụ âm trong tên", vd: "3", nghia: "vui vẻ, nói chuyện giỏi" },
        ket: "Ngoài hoạt bát, trong cạn pin.",
        noi: [
          "Thần số có số Linh hồn — điều bạn thật sự cần, tính từ nguyên âm trong tên.",
          "Và số Nhân cách — cái người khác nhìn thấy, tính từ phụ âm.",
          "Ví dụ Linh hồn bảy cần khoảng lặng, mà Nhân cách ba lại vui vẻ, nói chuyện giỏi.",
          "[sighs] Ngoài thì hoạt bát... trong thì cạn pin.",
        ],
        phu_de: [
          "Số *Linh hồn* — điều bạn thật sự cần, tính từ *nguyên âm* trong tên.",
          "Số *Nhân cách* — cái người khác thấy, tính từ *phụ âm*.",
          "Ví dụ: Linh hồn 7 cần khoảng lặng, Nhân cách 3 lại vui vẻ, nói giỏi.",
          "Ngoài hoạt bát… *trong cạn pin*.",
        ],
      },
      {
        id: "man-hinh-ban-do", loai: "man_hinh", toi_thieu: 20,
        anh: "v2-ban-do.jpg", anh_sau: "v2-ben-trong-mo.jpg", doi_luc: 0.42, truot: [0, 0.1],
        nhan_noi: [{ chu: "Bản đồ con số", y: 300, tre: 0.08 }, { chu: "Bên trong & bên ngoài", y: 300, tre: 0.5, phai: true }],
        noi: [
          "Hiểu Bản Thân đặt hai số cạnh nhau, chỉ ra chỗ lệch...",
          "[warmly] và gợi ý cách sống cho cả hai — chứ không phải bỏ một bên.",
        ],
        phu_de: [
          "Hiểu Bản Thân đặt *hai số cạnh nhau*, chỉ ra chỗ lệch…",
          "và gợi ý cách sống *cho cả hai* — không phải bỏ một bên.",
        ],
      },
      {
        id: "lat", loai: "chu", toi_thieu: 12,
        dong: ["Bạn không giả tạo.", "Bạn chỉ chưa cho", "phần bên trong", "*một chỗ đứng*."],
        noi: ["[softly] Bạn không giả tạo.", "Bạn chỉ chưa cho phần bên trong... một chỗ đứng."],
        phu_de: ["Bạn không giả tạo.", "Bạn chỉ chưa cho phần bên trong *một chỗ đứng*."],
      },
      {
        id: "cta", loai: "cta", toi_thieu: 13,
        chip: ["Nhập họ tên đầy đủ", "Linh hồn + Nhân cách", "Tổng quan miễn phí"],
        noi: [
          "Nhập họ tên đầy đủ ở hiểu bản thân chấm com để xem số Linh hồn và Nhân cách của bạn.",
          "[warmly] Phần tổng quan miễn phí.",
        ],
        phu_de: ["Nhập *họ tên đầy đủ* ở hieuban.com để xem Linh hồn và Nhân cách của bạn.", "Phần tổng quan *miễn phí*."],
      },
    ],
  },

  {
    ma: "v03",
    ten: "Năm 2027 làm nhà: tuổi bạn có phạm Kim lâu, Hoang ốc, Tam tai không?",
    duong: "/xem-tuoi-lam-nha/2027",
    duong_cta: "/xem-tuoi-lam-nha",
    utm: "vd03",
    canh: [
      {
        id: "hook", loai: "ban_ve", toi_thieu: 5,
        nam: "2027",
        dong: ["Sắp làm nhà?", "Xem tuổi *trước khi đặt cọc*."],
        noi: ["[excited] Sắp làm nhà mà chưa biết tuổi mình phạm gì?", "Xem trước khi đặt cọc!"],
        phu_de: ["Sắp làm nhà mà chưa biết tuổi mình phạm gì?", "Xem *trước khi đặt cọc*!"],
      },
      {
        id: "ba-dieu", loai: "ba_the", toi_thieu: 15,
        the: [
          { ten: "Kim lâu", phu: "tuổi mụ" },
          { ten: "Hoang ốc", phu: "đếm đốt tay" },
          { ten: "Tam tai", phu: "theo con giáp" },
        ],
        noi: [
          "Người lớn hay hỏi ba điều: Kim lâu, Hoang ốc, Tam tai.",
          "[mischievously] Nghe thì sợ, nhưng thật ra... là phép tính đơn giản.",
        ],
        phu_de: ["Người lớn hay hỏi 3 điều: *Kim lâu*, *Hoang ốc*, *Tam tai*.", "Nghe thì sợ, nhưng thật ra là *phép tính đơn giản*."],
      },
      {
        id: "kim-lau", loai: "phep_chia", toi_thieu: 15,
        nhan: "Kim lâu",
        cong_thuc: "Tuổi mụ ÷ 9 → dư 1, 3, 6, 8",
        vd: { nam: "Sinh 1988 · năm 2027", tuoi: "40", du: "4", ket: "Không phạm" },
        chu_y: "Tuổi mụ tính theo năm âm lịch Việt — sinh trước Tết là khác",
        noi: [
          "Kim lâu: lấy tuổi mụ chia chín, dư một, ba, sáu, tám là phạm.",
          "[curious] Tuổi mụ tính theo năm âm lịch Việt — sinh trước Tết là khác đấy nhé.",
        ],
        phu_de: [
          "*Kim lâu*: tuổi mụ chia 9, dư 1, 3, 6, 8 là phạm.",
          "Tuổi mụ tính theo *năm âm lịch Việt* — sinh trước Tết là khác đấy.",
        ],
      },
      {
        id: "hoang-oc", loai: "vong_cung", toi_thieu: 13,
        cung: ["Nhất Cát", "Nhì Nghi", "Tam Địa Sát", "Tứ Tấn Tài", "Ngũ Thọ Tử", "Lục Hoang Ốc"],
        sang: 3,
        tam_tai: { giap: ["Hợi", "Mão", "Mùi"], nam: "Đinh Mùi 2027" },
        noi: [
          "Hoang ốc: đếm trên đốt tay, sáu cung từ Nhất Cát đến Lục Hoang Ốc.",
          "Tam tai thì theo con giáp — năm Đinh Mùi hai không hai bảy là năm Tam tai thứ ba của tuổi Hợi, Mão, Mùi.",
        ],
        phu_de: [
          "*Hoang ốc*: đếm đốt tay, 6 cung từ Nhất Cát đến Lục Hoang Ốc.",
          "*Tam tai*: năm Đinh Mùi 2027 là năm Tam tai thứ 3 của tuổi *Hợi, Mão, Mùi*.",
        ],
      },
      {
        id: "man-hinh-bang", loai: "man_hinh", toi_thieu: 17,
        anh: "v3-bang.jpg", anh_sau: "v3-tuoi-1988.jpg", doi_luc: 0.55, truot: [0, 0.05],
        nhan_noi: [{ chu: "Bảng 46 tuổi · 1960–2005", y: 300, tre: 0.1 }, { chu: "Bấm tuổi bạn", y: 300, tre: 0.55, phai: true }],
        noi: [
          "Hiểu Bản Thân tính sẵn cả bảng bốn mươi sáu tuổi, từ một chín sáu mươi tới hai không không năm.",
          "[excited] Bấm tuổi bạn là thấy ngay — kèm cách dân gian hay làm khi phạm, như mượn tuổi người thân.",
        ],
        phu_de: [
          "Tính sẵn *cả bảng 46 tuổi*, từ 1960 tới 2005.",
          "Bấm tuổi bạn là thấy ngay — kèm cách dân gian hay làm, như *mượn tuổi* người thân.",
        ],
      },
      {
        id: "lat", loai: "chu", toi_thieu: 10,
        dong: ["Phạm ≠", "*không được làm*."], phu: "Biết trước để chọn năm, chọn người đứng tên.",
        noi: [
          "Không phải năm nào phạm cũng là không được làm.",
          "[warmly] Biết trước để chọn năm, chọn người đứng tên — cho yên tâm.",
        ],
        phu_de: ["Không phải năm nào phạm cũng là *không được làm*.", "Biết trước để chọn năm, chọn người đứng tên cho *yên tâm*."],
      },
      {
        id: "cta", loai: "cta", toi_thieu: 13,
        chip: ["Chọn năm sinh", "Miễn phí", "Không cần đăng nhập"],
        noi: [
          "Vào hiểu bản thân chấm com, gạch chéo, xem tuổi làm nhà, chọn năm sinh.",
          "[excited] Miễn phí, không cần đăng nhập!",
        ],
        phu_de: ["Vào *hieuban.com/xem-tuoi-lam-nha*, chọn năm sinh.", "*Miễn phí*, không cần đăng nhập!"],
      },
    ],
  },

  {
    ma: "v04",
    ten: "Hai đứa mình hợp nhau bao nhiêu điểm?",
    duong: "/tu-vi#hop-tham",
    duong_cta: "/tu-vi",
    utm: "vd04",
    canh: [
      {
        id: "hook", loai: "vong_diem", che_do: "chay", toi_thieu: 5,
        diem: 70, muc: "Hợp nếu hiểu nhau",
        noi: ["[excited] Thử xem lá số hai đứa hợp nhau bao nhiêu điểm...", "[laughs] Ơ khoan!"],
        phu_de: ["Thử xem lá số hai đứa hợp nhau *bao nhiêu điểm*…", "Ơ khoan!"],
      },
      {
        id: "khong-phai-so", loai: "vong_diem", che_do: "dung", toi_thieu: 13,
        diem: 70, muc: "Hợp nếu hiểu nhau",
        dong: ["Nhưng con số", "*không phải phần hay nhất*."],
        noi: ["Điểm tham khảo trên một trăm.", "[mischievously] Nhưng con số... không phải phần hay nhất."],
        phu_de: ["Điểm *tham khảo* trên 100.", "Nhưng con số *không phải phần hay nhất*."],
      },
      {
        id: "nam-thanh", loai: "nam_thanh", toi_thieu: 25,
        // Số thật từ ảnh chụp web (cặp mẫu: nữ 24/10/1988 – nam 12/3/1987, người yêu).
        thanh: [
          { ten: "Bản mệnh năm sinh", sach: "mệnh nạp âm", d: 20, tran: 20 },
          { ten: "Cách nghĩ, cách quyết", sach: "can năm", d: 12, tran: 15 },
          { ten: "Con giáp", sach: "chi năm", d: 7, tran: 20 },
          { ten: "Chỗ ở, không gian chung", sach: "cung phi", d: 14, tran: 15 },
          { ten: "Lá số chạm nhau", sach: "tứ hoá vào cung", d: 17, tran: 30 },
        ],
        noi: [
          "Hiểu Bản Thân chấm theo năm thứ có thật trong sách: mệnh nạp âm, can năm, chi năm, cung phi...",
          "và tứ hoá năm người kia rơi vào cung nào của mình.",
          "[warmly] Mỗi thanh có lời giải thích bằng tiếng người — chỗ dễ hợp, chỗ cần nói rõ với nhau.",
        ],
        phu_de: [
          "Chấm theo *5 thứ có thật trong sách*: mệnh nạp âm, can năm, chi năm, cung phi…",
          "và *tứ hoá* năm người kia rơi vào cung nào của mình.",
          "Mỗi thanh có lời giải thích: chỗ *dễ hợp*, chỗ *cần nói rõ* với nhau.",
        ],
      },
      {
        id: "quan-he", loai: "quan_he", toi_thieu: 13,
        anh: "v4-form-dien.jpg",
        chon: ["Người yêu", "Bạn bè", "Đồng nghiệp", "Sếp"],
        noi: [
          "[curious] Và nó hỏi: hai bạn là người yêu, bạn bè, đồng nghiệp hay sếp?",
          "Cùng hai lá số, mỗi quan hệ đọc khác nhau.",
        ],
        phu_de: ["Hai bạn là *người yêu*, *bạn bè*, *đồng nghiệp* hay *sếp*?", "Cùng hai lá số, mỗi quan hệ *đọc khác nhau*."],
      },
      {
        id: "man-hinh-hop", loai: "man_hinh", toi_thieu: 10,
        anh: "v4-diem.jpg", anh_sau: "v4-hop.jpg", doi_luc: 0.45, truot: [0, 0.05],
        nhan_noi: [{ chu: "Chỗ dễ hợp · chỗ cần nói rõ", y: 300, tre: 0.5 }],
        noi: [
          "[warmly] Điểm thấp không có nghĩa là chia tay.",
          "Nó chỉ chỉ ra chỗ hai người cần hiểu nhau hơn.",
        ],
        phu_de: ["Điểm thấp *không có nghĩa* là chia tay.", "Nó chỉ ra chỗ hai người *cần hiểu nhau hơn*."],
      },
      {
        id: "cta", loai: "cta", toi_thieu: 12,
        chip: ["Xem lá số 2 người", "Gửi link người ấy tự nhập", "Thẻ chia sẻ không có ngày sinh"],
        noi: [
          "Vào hiểu bản thân chấm com, gạch chéo, tử vi — kéo xuống Xem lá số hai người.",
          "Có nút gửi link để người ấy tự nhập.",
          "[mischievously] Tag người ấy vào đây!",
        ],
        phu_de: ["Vào *hieuban.com/tu-vi*, kéo xuống *Xem lá số 2 người*.", "Có nút gửi link để người ấy tự nhập.", "*Tag người ấy* vào đây!"],
      },
    ],
  },

  {
    ma: "v05",
    ten: "Dọn về nhà mới mà cứ bức bối, khó ngủ, hay cãi nhau?",
    duong: "/phong-thuy",
    utm: "vd05",
    canh: [
      {
        id: "hook", loai: "phong_ngu", toi_thieu: 5,
        dong: ["Ngủ bao nhiêu cũng mệt?", "*Nhìn lên trần nhà* bạn xem."],
        noi: ["[curious] Ngủ bao nhiêu cũng mệt?", "[whispers] Nhìn lên trần nhà bạn xem..."],
        phu_de: ["Ngủ bao nhiêu cũng mệt?", "*Nhìn lên trần nhà* bạn xem…"],
      },
      {
        id: "bon-dau-hieu", loai: "bon_dau_hieu", toi_thieu: 15,
        the: [
          { ma: "duong", ten: "Đường đâm thẳng vào cửa" },
          { ma: "xa", ten: "Xà ngang đè giường" },
          { ma: "wc", ten: "Nhà vệ sinh giữa nhà" },
          { ma: "ban_cong", ten: "Cửa chính thông thẳng ban công" },
        ],
        noi: [
          "Phong thuỷ có bốn thứ người xưa xem trước tiên — trước cả hướng nhà.",
          "Đường đâm thẳng vào cửa. Xà ngang đè giường. Nhà vệ sinh giữa nhà. Cửa chính thông thẳng ra ban công.",
        ],
        phu_de: [
          "4 thứ người xưa xem *trước tiên* — trước cả hướng nhà.",
          "Đường đâm vào cửa · Xà ngang đè giường · WC giữa nhà · Cửa thông ban công.",
        ],
      },
      {
        id: "hai-cot", loai: "hai_cot", toi_thieu: 18,
        cot: ["Sách xưa", "Đời sống"],
        hang: [
          ["Xà ngang đè giường", "Nằm dưới xà thấy bị đè, khó thả lỏng"],
          ["Cửa thông ban công", "Gió lùa, nhà không giữ hơi ấm"],
          ["", "Ngồi đâu cũng như đang ở lối đi"],
        ],
        noi: [
          "Nói kiểu đời sống: xà ngang trên đầu khiến nhiều người thấy bị đè, khó thả lỏng.",
          "Cửa thông thẳng ban công thì gió lùa, nhà không giữ được hơi ấm — ngồi đâu cũng như đang ở lối đi.",
        ],
        phu_de: [
          "Xà ngang trên đầu: nhiều người thấy *bị đè*, khó thả lỏng.",
          "Cửa thông ban công: *gió lùa*, ngồi đâu cũng như ở lối đi.",
        ],
      },
      {
        id: "man-hinh-khao-sat", loai: "man_hinh", toi_thieu: 20,
        anh: "v5-dau-hieu-tich.jpg", anh_sau: "v5-ket-qua.jpg", doi_luc: 0.5, truot: [0, 0.06],
        nhan_noi: [{ chu: "Tích dấu hiệu nhà mình", y: 300, tre: 0.08 }, { chu: "Bạn xác nhận mới tính", y: 300, tre: 0.55, phai: true }],
        noi: [
          "Ở Hiểu Bản Thân, bạn tích dấu hiệu nhà mình, vẽ mặt bằng, hoặc chụp ảnh để máy gợi ý...",
          "[warmly] bạn xác nhận thì mới tính. Ra từng phòng, cái gì cần xử lý trước.",
        ],
        phu_de: [
          "Tích dấu hiệu, vẽ mặt bằng hoặc chụp ảnh để máy gợi ý…",
          "*Bạn xác nhận* mới tính. Ra từng phòng, cái gì *xử lý trước*.",
        ],
      },
      {
        id: "khong-dong", loai: "khong_dong", toi_thieu: 17,
        viec: ["Dời giường", "Kéo rèm", "Đặt kệ chắn"],
        khong: ["Không đập tường", "Không mua vật phẩm"],
        noi: [
          "[excited] Hay nhất: mỗi việc có cách không đồng trước.",
          "Dời giường, kéo rèm, đặt kệ chắn. Không đập tường, không mua vật phẩm.",
        ],
        phu_de: ["Hay nhất: mỗi việc có *cách 0 đồng* trước.", "Dời giường · kéo rèm · đặt kệ chắn. *Không đập tường, không mua vật phẩm.*"],
      },
      {
        id: "cta", loai: "cta", toi_thieu: 15,
        chip: ["Khảo sát nhà 2 phút", "Nhà phố", "Chung cư"],
        noi: [
          "Vào hiểu bản thân chấm com, gạch chéo, phong thuỷ, làm Khảo sát nhà hai phút.",
          "[warmly] Nhà phố hay chung cư đều được.",
        ],
        phu_de: ["Vào *hieuban.com/phong-thuy*, làm *Khảo sát nhà* 2 phút.", "Nhà phố hay chung cư *đều được*."],
      },
    ],
  },
];
