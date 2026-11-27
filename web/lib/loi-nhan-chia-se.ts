// HCS-1 — lời nhắn soạn sẵn theo THẺ và theo TRANG (hàm thuần, tất định, không AI). Người gửi chọn một trong 2–3 lời
// (hoặc sửa) trong hộp chia sẻ; mã lời (`ma`) đi vào đo lường `share_target{bien_the}` để biết lời nào kéo bạn bè bấm.
//
// Nguyên tắc viết (docs/HOP-CHIA-SE.md):
//  1. Nói bằng giọng NGƯỜI GỬI ("mình"), không giọng quảng cáo; ≤ 2 câu + lời mời hành động ở cuối, kết bằng dấu ":" để link
//     đứng ngay sau.
//  2. Mỗi thẻ ba lối mở: (a) KHOE + HỎI LẠI ("Mình số 7. Bạn số mấy?") · (b) NỖI LO người nhận đang có ("sắp mua nhà",
//     "đứng giữa hai lựa chọn", "sáng mùng 1 mới cuống") · (c) TRÒ CHƠI / THÁCH ("đoán xem mình số mấy").
//  3. Chỉ dùng dữ kiện đã có trên thẻ (con số, tên quẻ, nhãn nghiêng…) — không ngày sinh, không can chi năm sinh, không con giáp
//     (THE-CHIA-SE: đủ để suy năm sinh). Không phán, không doạ, không hứa chính xác ("đúng 100%"), không vật phẩm.
//  4. Lời nói về NGƯỜI KHÁC chỉ ở thẻ cặp đôi (hợp đôi, xem lá số 2 người) — "Gửi cho người ấy".

export interface LoiNhan { ma: string; chu: string }

export type LoaiThe =
  | "card" | "invite" | "ngay" | "xong_dat" | "huy_hieu" | "hai" | "nha" | "que" | "tarot"
  | "ban_do" | "ba_la" | "thang" | "hoi" | "trang" | "ban_do_sao" | "hop_doi_sao";

export interface DuLieuThe {
  so?: number | null;          // con số chính của thẻ (đường đời, ngày cá nhân…)
  tuKhoa?: string | null;      // từ khoá / chủ đề ngắn đi kèm con số
  ten?: string | null;         // tên huy hiệu, tên quẻ, tên lá…
  nhan?: string | null;        // nhãn nghiêng (Tarot), mức (hai người)
  viec?: string | null;        // nhãn loại việc / chủ đề người dùng hỏi (danh mục, không phải câu gõ)
  nam?: number | null;         // năm xem (xông đất) — năm CÔNG KHAI, không phải năm sinh
  canChi?: string | null;      // can chi của NĂM XEM (công khai)
  diem?: number | null;        // điểm tham khảo hai người
  thang?: number | null;       // tháng của tổng kết tháng
  soNgayGhe?: number | null;   // số buổi đã ghé trong tháng
  moi?: string | null;         // câu mời riêng của huy hiệu
}

const sach = (s: string) => s.replace(/\s+/g, " ").replace(/\s([:?.!,])/g, "$1").trim();
const coSo = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/** Lời nhắn soạn sẵn cho một thẻ. Luôn trả ≥ 2 lời; lời đầu là lời mặc định. */
export function loiNhanThe(loai: LoaiThe, d: DuLieuThe = {}): LoiNhan[] {
  const ds: Array<[string, string | null]> = (() => {
    switch (loai) {
      case "card":
        return [
          ["card.khoe", coSo(d.so) ? `Mình là số ${d.so}${d.tuKhoa ? ` — ${d.tuKhoa}` : ""}. Đọc xong thấy đúng tới mức hơi ngại. Bạn số mấy? Nhập ngày sinh, 30 giây là biết:` : null],
          ["card.doan", "Đoán xem mình là số mấy? Bấm vào xem đáp án, rồi xem luôn số của bạn:"],
          ["card.vap", `Ai hay tự hỏi “sao mình cứ vấp mãi một kiểu” thì xem thử con số của mình.${coSo(d.so) ? ` Của mình là số ${d.so}:` : ""}`],
        ];
      case "invite":
        return [
          ["invite.luot", "Mình nhập ngày sinh rồi, tới lượt bạn. Xem hai đứa mình hợp nhau ở đâu, dễ lệch nhau ở đâu:"],
          ["invite.hieu", "Có chuyện hai đứa mình nói mãi vẫn không hiểu nhau? Thử xem con số của mỗi người nói gì — bạn nhập ngày sinh nhé:"],
          ["invite.so", coSo(d.so) ? `Mình là số ${d.so}. Bạn số mấy? Ghép lại xem hai đứa mình bù cho nhau chỗ nào:` : null],
        ];
      case "hai":
        return [
          ["hai.diem", coSo(d.diem) ? `Hai đứa mình được ${d.diem}/100${d.nhan ? ` — “${d.nhan}”` : ""}. Bạn với người ấy được bao nhiêu? Chỉ cần ngày sinh hai người:` : null],
          ["hai.gian", "Trước khi giận người ấy, xem thử hai người vốn khác nhau ở đâu — đọc xong dễ nhường nhau hơn:"],
          ["hai.cap", "Cặp nào cũng có chỗ hợp và chỗ phải nhường nhau. Xem thử của bạn với người ấy:"],
        ];
      case "ngay":
        return [
          ["ngay.so", coSo(d.so) ? `Hôm nay là Ngày cá nhân ${d.so} của mình${d.tuKhoa ? ` — ${d.tuKhoa}` : ""}. Ngày của bạn số mấy? Xem để biết hôm nay nên đẩy việc hay nên chậm lại:` : null],
          ["ngay.vuong", `Có ngày làm gì cũng trôi, có ngày làm gì cũng vướng.${coSo(d.so) ? ` Hôm nay của mình là ngày ${d.so}.` : ""} Còn bạn?`],
          ["ngay.chot", "Trước khi chốt việc gì quan trọng hôm nay, xem thử ngày của bạn hợp làm gì:"],
        ];
      case "xong_dat": {
        const tet = `Tết ${d.canChi ? `${d.canChi} ` : ""}${d.nam ?? ""}`.trim();
        return [
          ["xd.tuoi", `${tet} nhà mình nên mời tuổi nào xông đất? Gõ năm sinh gia chủ là ra mấy tuổi hợp — xem giúp nhà bạn luôn:`],
          ["xd.cuong", "Đừng để sáng mùng 1 mới cuống tìm người xông đất. Xem trước tuổi hợp với gia chủ nhà bạn, chưa tới 1 phút:"],
          ["xd.ong_ba", `Ông bà mình rất coi trọng người bước vào nhà đầu năm. Gửi cả nhà xem tuổi xông đất ${tet}:`],
        ];
      }
      case "huy_hieu":
        return [
          ["hh.khoe", d.ten ? `Mình vừa có huy hiệu “${d.ten}”. ${d.moi ?? "Bạn thử xem giữ được mấy ngày:"}` : null],
          ["hh.thu", "Mấy hôm nay mình giữ được một thói quen nhỏ mỗi sáng. Bạn thử xem giữ được mấy ngày:"],
        ];
      case "nha":
        return [
          ["nha.so_do", `Mình vừa xem nhà mình${d.ten ? ` (hướng ${d.ten})` : ""}: phòng nào hợp, chỗ nào nên sửa đã rõ. Nhà bạn thì sao?`],
          ["nha.mua", "Đang định mua nhà, thuê nhà hay sửa nhà? Xem trước nhà hợp với người ở chỗ nào, đỡ tốn tiền sửa sau:"],
          ["nha.ke", "Kê giường, kê bàn thế nào cho hợp người ở? Mình vừa xem nhà mình, bạn xem thử nhà bạn:"],
        ];
      case "que":
        return [
          ["que.viec", d.ten ? `Mình đang phân vân${d.viec ? ` chuyện ${d.viec.toLowerCase()}` : " một việc"} và gieo được quẻ ${d.ten}. Bạn đang lăn tăn việc gì? Gieo thử một quẻ:` : null],
          ["que.chon", `Khi đứng giữa hai lựa chọn, mình hay gieo một quẻ để nghĩ chậm lại.${d.ten ? ` Hôm nay là quẻ ${d.ten}.` : ""} Bạn thử:`],
          ["que.loi", "Đọc lời quẻ xong thấy nhẹ đầu hơn hẳn. Bạn có việc gì đang phân vân không? Gieo thử:"],
        ];
      case "tarot":
        return [
          ["tarot.tra_loi", d.nhan ? `Mình hỏi lá bài${d.viec ? ` chuyện ${d.viec}` : ""} — câu trả lời: “${d.nhan}”. Bạn có câu nào đang canh cánh không? Rút thử:` : null],
          ["tarot.phan_van", "Đang phân vân có nên làm hay không? Mình rút bài rồi, thấy rõ hơn hẳn. Tới lượt bạn:"],
          ["tarot.khong_boi", "Không bói số phận — chỉ giúp mình nhìn câu hỏi rõ hơn. Bạn thử rút ba lá:"],
        ];
      case "ban_do":
        return [
          ["bd.doan", "Đoán thử: mình số mấy? 5 mảnh ghép làm nên mình ở đây — đoán xong xem luôn của bạn:"],
          ["bd.khoe", "Tử vi, Bát tự, Thần số, phong thuỷ, Kinh Dịch cùng nhìn một con người — đây là 5 mảnh ghép của mình. Bạn có mấy mảnh giống?"],
        ];
      case "ba_la":
        return [
          ["bl.khoe", `Ba lá của mình hôm nay${coSo(d.so) ? `: ngày ${d.so}` : ""}${d.ten ? `, quẻ ${d.ten}` : ""}. Lật ba lá của bạn xem hôm nay có gì:`],
          ["bl.sang", "Sáng nào mình cũng lật ba lá trước khi bắt đầu ngày. Hôm nay của bạn thế nào?"],
        ];
      case "thang":
        return [
          ["tk.khoe", `Tháng ${d.thang ?? ""} của mình: ${d.soNgayGhe ?? 0} buổi sáng dừng lại xem ngày${coSo(d.so) ? `, tháng cá nhân ${d.so}` : ""}. Tháng này của bạn đi nhịp nào?`],
          ["tk.thu", "Mỗi sáng dừng lại một phút xem ngày của mình — thử một tháng xem có khác không:"],
        ];
      case "hoi":
        return [
          ["hoi.cau", d.ten ? `Mình vừa hỏi “${d.ten}” và được trả lời theo đúng lá số. Bạn hỏi câu này về chính bạn thử:` : null],
          ["hoi.thac_mac", d.ten ? `Câu này chắc bạn cũng từng thắc mắc: “${d.ten}”. Hỏi thử, có lời đáp theo ngày sinh của bạn:` : null],
          ["hoi.chung", "Hỏi gì cũng được về tiền bạc, công việc, tình cảm — trả lời theo đúng ngày sinh của bạn:"],
        ];
      case "ban_do_sao":   // CHANG-4: ten = cung Mặt Trời, nhan = cung Mặt Trăng (engine trả, đã có trên thẻ)
        return [
          ["st.khoe", d.ten ? `Mình Mặt Trời ${d.ten}${d.nhan ? `, Mặt Trăng ${d.nhan}` : ""}. Bạn thì sao? Nhập ngày sinh là có bản đồ sao của bạn:` : null],
          ["st.doan", "Đoán xem cung Mọc của mình là gì? Bấm vào xem, rồi xem luôn bản đồ sao của bạn:"],
          ["st.ba_diem", "Không chỉ cung Mặt Trời — Mặt Trăng và cung Mọc mới cho thấy mình thật sự thế nào. Xem thử của bạn:"],
        ];
      case "hop_doi_sao":   // CHANG-4: ten = một chủ đề tương tác (danh mục engine), không tên người kia
        return [
          ["sd.gap", d.ten ? `Hai bản đồ sao của mình với người ấy gặp nhau ở chuyện “${d.ten}”. Bạn với người ấy thì sao?` : null],
          ["sd.hieu", "Hai người khác nhau ở đâu, dễ hợp nhau ở đâu — không chấm điểm, chỉ để hiểu nhau hơn. Xem thử của bạn:"],
          ["sd.ru", "Gửi người ấy cùng xem hai bản đồ sao — mỗi người tự nhập ngày sinh của mình:"],
        ];
      case "trang":
        return [["trang.chung", "Gửi bạn đọc thử:"]];
    }
  })();
  const kq = ds.filter((x): x is [string, string] => Boolean(x[1])).map(([ma, chu]) => ({ ma, chu: sach(chu) }));
  return kq.length ? kq : [{ ma: `${loai}.chung`, chu: "Gửi bạn xem thử:" }];
}

/** Lối mở theo cụm trang (khớp TIỀN TỐ đường dẫn, dài trước ngắn sau) — nỗi lo của người đọc cụm đó. */
const HOOK_TRANG: Array<[string, string]> = [
  ["/xem-ngay-tot", "Sắp làm việc lớn — cưới hỏi, khai trương, về nhà mới? Xem ngày trước cho yên tâm:"],
  ["/lich-am", "Lưu lại xem cho tiện — Tết, mùng 1, rằm và ngày lễ cả năm:"],
  ["/doi-lich-am-duong", "Đổi ngày âm – dương nhanh, có cả can chi và tiết khí:"],
  ["/nam/", "Năm tới bạn bao nhiêu tuổi, có vướng Tam tai, Kim lâu không? Xem theo năm sinh:"],
  ["/tuoi-xong-dat", "Đừng để sáng mùng 1 mới cuống tìm người xông đất. Xem trước tuổi hợp với gia chủ:"],
  ["/xem-tuoi-lam-nha", "Định xây, sửa nhà? Xem trước tuổi gia chủ năm nay có hợp không, đỡ phải mượn tuổi phút chót:"],
  ["/xem-sao-han", "Năm nay bạn gặp sao gì? Xem sao hạn theo năm sinh và việc nên làm cho nhẹ lòng:"],
  ["/phong-thuy/huong-hop-tuoi", "Sắp mua nhà, thuê nhà? Xem trước hướng hợp tuổi của bạn:"],
  ["/phong-thuy/huong-xau-nam", "Năm nay hướng nào nên tránh động thổ, sửa nhà? Xem trước khi khởi công:"],
  ["/phong-thuy/dau-hieu", "Nhà bạn có chỗ này không? Xem cách xử lý đơn giản, phần lớn không tốn tiền:"],
  ["/phong-thuy", "Nhà bạn hợp hướng nào, kê giường kê bàn ra sao? Xem thử:"],
  ["/tu-vi/", "Ai có sao này trong lá số thì đọc thử — mình đọc thấy khá trúng:"],
  ["/tu-vi", "Lá số Tử vi của bạn nói gì về năm nay? Lập thử, miễn phí:"],
  ["/bat-tu/", "Mệnh bạn mạnh hành gì, thiếu hành gì? Đọc thử:"],
  ["/bat-tu", "Mệnh bạn thiếu hành gì? Xem Bát tự theo giờ sinh, miễn phí:"],
  ["/than-so/", "Bạn số mấy? Đọc thử phần nói về con số này:"],
  ["/than-so", "Bạn số mấy? Nhập ngày sinh, 30 giây là biết:"],
  ["/hop-doi", "Hai người hợp nhau ở đâu, dễ lệch nhau ở đâu? Xem thử bằng ngày sinh:"],
  ["/kinh-dich/que", "Bạn từng gieo được quẻ này chưa? Lời quẻ nói khá trúng chuyện đời:"],
  ["/kinh-dich", "Đang phân vân một việc? Gieo thử một quẻ Kinh Dịch:"],
  ["/tarot/", "Bạn từng rút được lá này? Đây là nghĩa của nó, cả xuôi và ngược:"],
  ["/tarot", "Đang phân vân có nên làm hay không? Rút thử ba lá:"],
  ["/nhan-tuong", "Soi gương đối chiếu thử xem:"],
  ["/chi-tay", "Xòe bàn tay ra đối chiếu thử xem:"],
  ["/ky-mon", "Hôm nay giờ nào, hướng nào thuận cho việc của bạn? Xem nhanh:"],
  ["/blog/", "Bài này hay, gửi bạn đọc thử:"],
];

function catCau(s: string, toiDa = 140): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= toiDa) return t;
  const cat = t.slice(0, toiDa);
  const dau = Math.max(cat.lastIndexOf(". "), cat.lastIndexOf("; "));
  return dau > 50 ? cat.slice(0, dau + 1) : `${cat.slice(0, cat.lastIndexOf(" "))}…`;
}

/** Lời nhắn cho một TRANG công khai: (1) câu hỏi + câu trả lời ngắn của chính trang, (2) nỗi lo theo cụm, (3) gửi người cần. */
export function loiNhanTrang(duong: string, tieuDe: string, traLoi?: string | null): LoiNhan[] {
  const td = tieuDe.replace(/\s*[·|—–-]\s*Hiểu Bản Thân\s*$/u, "").trim();
  const ds: LoiNhan[] = [];
  if (traLoi && traLoi.trim()) {
    const dau = /[?？]$/.test(td) ? td : `${td}:`;
    ds.push({ ma: "trang.tra_loi", chu: sach(`${dau} ${catCau(traLoi)} Xem đầy đủ:`) });
  }
  const hook = HOOK_TRANG.find(([p]) => duong === p || duong.startsWith(p));
  if (hook) ds.push({ ma: `trang.hook.${hook[0].replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`, chu: hook[1] });
  ds.push({ ma: "trang.gui", chu: sach(`Gửi bạn đang băn khoăn chuyện này — ${td}${/[?？!.:]$/.test(td) ? "" : ":"}`) });
  return ds;
}

/** Nút mời chia sẻ theo thẻ (CTA chung, docs/HOP-CHIA-SE.md mục 3). "Gửi cho người ấy" CHỈ cho thẻ cặp đôi. */
export const CTA_CHIA_SE: Record<LoaiThe, { nhan: string; phu: string }> = {
  card: { nhan: "Thách bạn bè đoán số của mình", phu: "Đoán xong họ xem được số của chính họ" },
  invite: { nhan: "Gửi cho người ấy", phu: "Người ấy nhập ngày sinh là thấy hai bạn hợp nhau ở đâu" },
  hai: { nhan: "Gửi cho người ấy", phu: "Thẻ không ghi tên người kia, không có ngày sinh" },
  ngay: { nhan: "Rủ bạn bè xem ngày hôm nay", phu: "Ai cũng có một con số ngày riêng" },
  xong_dat: { nhan: "Gửi cả nhà xem tuổi xông đất", phu: "Chỉ có thông tin chung của năm, không có tuổi nhà bạn" },
  huy_hieu: { nhan: "Khoe huy hiệu", phu: "Kèm ảnh có mã QR" },
  nha: { nhan: "Gửi người nhà xem sơ đồ", phu: "Không có địa chỉ, không có năm sinh" },
  que: { nhan: "Rủ bạn gieo một quẻ", phu: "Thẻ không có câu bạn hỏi" },
  tarot: { nhan: "Rủ bạn rút bài cùng", phu: "Thẻ không có câu bạn hỏi" },
  ban_do: { nhan: "Thách bạn đoán 5 mảnh ghép", phu: "Bạn bè đoán đường đời của bạn trước khi xem" },
  ba_la: { nhan: "Rủ bạn lật ba lá", phu: "Không có ngày sinh trên thẻ" },
  thang: { nhan: "Khoe tháng của mình", phu: "Không có ngày sinh trên thẻ" },
  hoi: { nhan: "Rủ bạn hỏi câu này", phu: "Chỉ gửi câu hỏi, không gửi câu trả lời của bạn" },
  trang: { nhan: "Gửi người đang cần đọc", phu: "Kèm ảnh tóm tắt có mã QR" },
  ban_do_sao: { nhan: "Rủ bạn bè xem bản đồ sao", phu: "Thẻ không có ngày giờ sinh, nơi sinh" },
  hop_doi_sao: { nhan: "Gửi cho người ấy", phu: "Thẻ không ghi tên người kia, không có ngày sinh" },
};
