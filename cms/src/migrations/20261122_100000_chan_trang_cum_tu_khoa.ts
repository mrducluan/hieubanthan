import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// FOOTER-2 (chủ dự án duyệt 2026-11-22) — chân trang xếp lại theo CỤM TỪ KHOÁ: Huyền học (10 trang trụ, chữ link theo cách
// người ta tìm: "Xem Tử vi", "Gieo quẻ Kinh Dịch", "Xem tướng mặt"…) · Lịch & tuổi (từ khoá theo năm / mùa Tết) · Kiến thức
// (mỗi môn một cụm lớn) · Về chúng tôi (E-E-A-T + pháp lý, gộp cột Pháp lý cũ). Bỏ link trùng URL (#neo), trang noindex
// (Tài khoản, Nạp Sao), trang đã có ở menu đầu (Hôm nay, Thời gian tới, Bản đồ đội ngũ, Lá số mẫu).
// Bản CMS production đã bị sửa tay trước KM-3 (cột Huyền học chỉ còn 6 mục, lời giới thiệu "Bảy hệ thống…" thiếu Kỳ Môn) nên
// KM-3 bỏ qua. Chủ dự án duyệt THAY cả bộ cột (không chỉ bổ sung). Chỉ chạy khi chân trang đã lưu ở CMS (có cột); chưa lưu →
// web dùng mặc định trong code (đã đổi cùng lượt). Lời giới thiệu chỉ thay khi còn đúng câu "Bảy hệ thống…".
// Down: trả về bộ cột mặc định trước FOOTER-2 (KM-3 + RS-2) — không khôi phục được chữ đã sửa tay trước đó.
type Cot = [string, [string, string][]][]

const MOI: Cot = [
  ['Huyền học', [['/than-so', 'Thần số học'], ['/tu-vi', 'Xem Tử vi'], ['/bat-tu', 'Xem Bát tự (Tứ trụ)'], ['/kinh-dich', 'Gieo quẻ Kinh Dịch'], ['/phong-thuy', 'Phong thuỷ nhà ở'], ['/nhan-tuong', 'Xem tướng mặt'], ['/tarot', 'Xem bài Tarot'], ['/ky-mon', 'Kỳ Môn Độn Giáp'], ['/hop-doi', 'Xem hợp đôi'], ['/huyen-hoc', 'Tất cả các môn huyền học']]],
  ['Lịch & tuổi', [['/xem-ngay-tot', 'Xem ngày tốt'], ['/lich-am', 'Lịch âm các năm'], ['/doi-lich-am-duong', 'Đổi lịch âm dương'], ['/nam', 'Năm nay con gì, mệnh gì'], ['/bat-tu/menh-theo-nam', 'Sinh năm nào mệnh gì'], ['/xem-tuoi-lam-nha', 'Tuổi làm nhà, cưới hỏi'], ['/tuoi-xong-dat', 'Tuổi xông đất'], ['/xem-sao-han', 'Sao hạn theo tuổi'], ['/phong-thuy/huong-hop-tuoi', 'Hướng nhà hợp tuổi'], ['/phong-thuy/huong-xau-nam', 'Hướng xấu theo năm']]],
  ['Kiến thức', [['/than-so/y-nghia-so', 'Ý nghĩa các con số'], ['/tu-vi/chinh-tinh', '14 chính tinh Tử vi'], ['/bat-tu/thap-than', 'Thập thần Bát tự'], ['/kinh-dich/que', '64 quẻ Kinh Dịch'], ['/phong-thuy/dau-hieu', 'Dấu hiệu phong thuỷ trong nhà'], ['/nhan-tuong/bo-vi', 'Bộ vị tướng mặt'], ['/tarot/la-bai', '78 lá bài Tarot'], ['/hop-doi/cap-so', 'Số chủ đạo hợp nhau'], ['/tu-dien', 'Từ điển thuật ngữ'], ['/kien-thuc', 'Thư viện kiến thức'], ['/blog', 'Blog']]],
  ['Về chúng tôi', [['/gioi-thieu', 'Giới thiệu & phương pháp'], ['/tac-gia', 'Đội ngũ biên soạn'], ['/tac-gia/duc-luan', 'Chủ biên Đức Luân'], ['/lien-he', 'Liên hệ'], ['/goi-xem', 'Các gói xem'], ['/chinh-sach-rieng-tu', 'Chính sách quyền riêng tư'], ['/dieu-khoan', 'Điều khoản sử dụng'], ['/mien-tru-trach-nhiem', 'Miễn trừ trách nhiệm'], ['/chinh-sach-rieng-tu#quyen', 'Yêu cầu về dữ liệu cá nhân']]],
]

const CU: Cot = [
  ['Huyền học', [['/than-so', 'Thần số học'], ['/tu-vi', 'Tử vi'], ['/bat-tu', 'Bát tự'], ['/kinh-dich', 'Kinh Dịch'], ['/phong-thuy', 'Phong thuỷ'], ['/nhan-tuong', 'Nhân tướng học'], ['/tarot', 'Tarot'], ['/ky-mon', 'Kỳ Môn Độn Giáp'], ['/hop-doi', 'Hợp đôi'], ['/huyen-hoc', 'Tất cả các mảng'], ['/hom-nay', 'Hôm nay của bạn'], ['/thoi-gian-toi', 'Thời gian tới của bạn'], ['/nam', 'Xem theo năm'], ['/xem-ngay-tot', 'Xem ngày tốt'], ['/xem-tuoi-lam-nha', 'Tuổi làm nhà, cưới hỏi']]],
  ['Kiến thức', [['/kien-thuc', 'Thư viện kiến thức'], ['/than-so/y-nghia-so', 'Ý nghĩa các con số'], ['/kinh-dich/que', '64 quẻ Kinh Dịch'], ['/tu-vi/chinh-tinh', '14 chính tinh Tử vi'], ['/tarot/la-bai', '78 lá bài Tarot'], ['/tu-dien', 'Từ điển thuật ngữ'], ['/tu-vi/la-so-mau', 'Lá số mẫu'], ['/phong-thuy/huong-hop-tuoi', 'Hướng hợp tuổi'], ['/hop-doi/cap-so', 'Số chủ đạo hợp nhau'], ['/tuoi-xong-dat', 'Tuổi xông đất'], ['/xem-sao-han', 'Sao hạn theo tuổi'], ['/doi-lich-am-duong', 'Đổi lịch âm dương'], ['/blog', 'Blog']]],
  ['Về chúng tôi', [['/gioi-thieu', 'Giới thiệu & phương pháp'], ['/tac-gia', 'Đội ngũ biên soạn'], ['/tac-gia/duc-luan', 'Chủ biên Đức Luân'], ['/gioi-thieu#nguon', 'Nguồn tri thức'], ['/lien-he', 'Liên hệ'], ['/lien-he#chu-de', 'Góp ý, báo lỗi'], ['/ban-do-doi-ngu', 'Bản đồ đội ngũ (Chủ DN)'], ['/tai-khoan', 'Tài khoản'], ['/nap-sao', 'Nạp Sao'], ['/goi-xem', 'Các gói xem']]],
  ['Pháp lý', [['/chinh-sach-rieng-tu', 'Chính sách quyền riêng tư'], ['/dieu-khoan', 'Điều khoản sử dụng'], ['/mien-tru-trach-nhiem', 'Miễn trừ trách nhiệm'], ['/chinh-sach-rieng-tu#quyen', 'Yêu cầu về dữ liệu cá nhân']]],
]

const GT_CU = 'Bảy hệ thống văn hoá — Thần số học, Tử vi, Bát tự, Nhân Tướng, Bài Tarot, Kinh Dịch, Phong thuỷ — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi và chiêm nghiệm.'
const GT_MOI = 'Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Kỳ Môn — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.'

type Db = MigrateUpArgs['db']
const ma = (p: string) => `${p}-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`

async function datCot(db: Db, bo: Cot): Promise<number> {
  const goc = await db.execute(sql`SELECT DISTINCT "_parent_id" AS id FROM "cms"."dieu_huong_cot"`)
  for (const { id } of goc.rows as { id: number }[]) {
    await db.execute(sql`DELETE FROM "cms"."dieu_huong_cot" WHERE "_parent_id" = ${id}`)   // liên kết xoá theo (cascade)
    for (const [i, [ten, ds]] of bo.entries()) {
      const cid = ma('ft2c')
      await db.execute(sql`INSERT INTO "cms"."dieu_huong_cot" ("_order", "_parent_id", "id", "ten") VALUES (${i + 1}, ${id}, ${cid}, ${ten})`)
      for (const [j, [duong, nhan]] of ds.entries()) {
        await db.execute(sql`INSERT INTO "cms"."dieu_huong_cot_lien_ket" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan")
          VALUES (${j + 1}, ${cid}, ${ma('ft2l')}, ${nhan}, 'duong_dan', ${duong})`)
      }
    }
  }
  return goc.rows.length
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const n = await datCot(db, MOI)
  await db.execute(sql`UPDATE "cms"."dieu_huong" SET "thuong_hieu_gioi_thieu" = ${GT_MOI} WHERE "thuong_hieu_gioi_thieu" = ${GT_CU}`)
  payload?.logger.info(n ? 'FOOTER-2: chân trang CMS → 4 cột theo cụm từ khoá' : 'FOOTER-2: chân trang chưa lưu ở CMS — web dùng mặc định trong code')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await datCot(db, CU)
}
