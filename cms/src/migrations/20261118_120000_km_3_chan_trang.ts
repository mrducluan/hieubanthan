import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// KM-3 (chủ dự án giao 2026-11-18) — chân trang thêm các mảng Huyền học còn thiếu: Nhân tướng học, Tarot, Kỳ Môn Độn Giáp
// (cột "Huyền học") và 78 lá bài Tarot (cột "Kiến thức"). Mỗi cột tối đa 15 liên kết → ba công cụ tra cứu (Tuổi xông đất, Sao
// hạn, Đổi lịch) dời từ cột "Huyền học" sang cột "Kiến thức". Lời giới thiệu khối thương hiệu nêu đủ tám mảng.
// Chỉ đổi DỮ LIỆU đã lưu ở CMS, và chỉ khi cột / lời giới thiệu còn TRÙNG ĐÚNG mặc định cũ (cùng đường dẫn, nhãn, thứ tự) —
// cột biên tập đã sửa tay giữ nguyên (ghi log). Chân trang chưa lưu ở CMS → web dùng mặc định trong code (đã đổi cùng lượt).
// Down chỉ trả về khi dữ liệu còn trùng đúng bản mới.
type DS = [string, string][]

const HH_CU: DS = [
  ['/than-so', 'Thần số học'], ['/tu-vi', 'Tử vi'], ['/bat-tu', 'Bát tự'], ['/kinh-dich', 'Kinh Dịch'],
  ['/phong-thuy', 'Phong thuỷ'], ['/hop-doi', 'Hợp đôi'], ['/huyen-hoc', 'Tất cả các mảng'],
  ['/hom-nay', 'Hôm nay của bạn'], ['/thoi-gian-toi', 'Thời gian tới của bạn'], ['/nam', 'Xem theo năm'],
  ['/xem-ngay-tot', 'Xem ngày tốt'], ['/xem-tuoi-lam-nha', 'Tuổi làm nhà, cưới hỏi'], ['/tuoi-xong-dat', 'Tuổi xông đất'],
  ['/xem-sao-han', 'Sao hạn theo tuổi'], ['/doi-lich-am-duong', 'Đổi lịch âm dương'],
]
const HH_MOI: DS = [
  ['/than-so', 'Thần số học'], ['/tu-vi', 'Tử vi'], ['/bat-tu', 'Bát tự'], ['/kinh-dich', 'Kinh Dịch'],
  ['/phong-thuy', 'Phong thuỷ'], ['/nhan-tuong', 'Nhân tướng học'], ['/tarot', 'Tarot'], ['/ky-mon', 'Kỳ Môn Độn Giáp'],
  ['/hop-doi', 'Hợp đôi'], ['/huyen-hoc', 'Tất cả các mảng'],
  ['/hom-nay', 'Hôm nay của bạn'], ['/thoi-gian-toi', 'Thời gian tới của bạn'], ['/nam', 'Xem theo năm'],
  ['/xem-ngay-tot', 'Xem ngày tốt'], ['/xem-tuoi-lam-nha', 'Tuổi làm nhà, cưới hỏi'],
]
const KT_CU: DS = [
  ['/kien-thuc', 'Thư viện kiến thức'], ['/than-so/y-nghia-so', 'Ý nghĩa các con số'], ['/kinh-dich/que', '64 quẻ Kinh Dịch'],
  ['/tu-vi/chinh-tinh', '14 chính tinh Tử vi'], ['/tu-dien', 'Từ điển thuật ngữ'], ['/tu-vi/la-so-mau', 'Lá số mẫu'],
  ['/phong-thuy/huong-hop-tuoi', 'Hướng hợp tuổi'], ['/hop-doi/cap-so', 'Số chủ đạo hợp nhau'], ['/blog', 'Blog'],
]
const KT_MOI: DS = [
  ['/kien-thuc', 'Thư viện kiến thức'], ['/than-so/y-nghia-so', 'Ý nghĩa các con số'], ['/kinh-dich/que', '64 quẻ Kinh Dịch'],
  ['/tu-vi/chinh-tinh', '14 chính tinh Tử vi'], ['/tarot/la-bai', '78 lá bài Tarot'], ['/tu-dien', 'Từ điển thuật ngữ'], ['/tu-vi/la-so-mau', 'Lá số mẫu'],
  ['/phong-thuy/huong-hop-tuoi', 'Hướng hợp tuổi'], ['/hop-doi/cap-so', 'Số chủ đạo hợp nhau'], ['/tuoi-xong-dat', 'Tuổi xông đất'],
  ['/xem-sao-han', 'Sao hạn theo tuổi'], ['/doi-lich-am-duong', 'Đổi lịch âm dương'], ['/blog', 'Blog'],
]
const GT_CU = 'Năm hệ thống văn hoá — thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.'
const GT_MOI = 'Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Kỳ Môn — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.'

type Db = MigrateUpArgs['db']
type Log = MigrateUpArgs['payload'] | undefined

async function doiCot(db: Db, log: Log, ten: string, cu: DS, moi: DS) {
  const cot = await db.execute(sql`SELECT id FROM "cms"."dieu_huong_cot" WHERE "ten" = ${ten}`)
  for (const { id } of cot.rows as { id: string }[]) {
    const r = await db.execute(sql`SELECT "duong_dan", "nhan", COALESCE("loai"::text, 'duong_dan') AS loai
      FROM "cms"."dieu_huong_cot_lien_ket" WHERE "_parent_id" = ${id} ORDER BY "_order"`)
    const ds = r.rows as { duong_dan: string | null; nhan: string; loai: string }[]
    const trung = ds.length === cu.length && ds.every((x, i) => x.loai === 'duong_dan' && x.duong_dan === cu[i]![0] && x.nhan === cu[i]![1])
    if (!trung) { log?.logger.info(`KM-3 chân trang: cột "${ten}" đã sửa tay — giữ nguyên`); continue }
    await db.execute(sql`DELETE FROM "cms"."dieu_huong_cot_lien_ket" WHERE "_parent_id" = ${id}`)
    for (const [i, [duong, nhan]] of moi.entries()) {
      await db.execute(sql`INSERT INTO "cms"."dieu_huong_cot_lien_ket" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan")
        VALUES (${i + 1}, ${id}, md5(random()::text || clock_timestamp()::text), ${nhan}, 'duong_dan', ${duong})`)
    }
    log?.logger.info(`KM-3 chân trang: cột "${ten}" → ${moi.length} liên kết`)
  }
}

async function doiGioiThieu(db: Db, cu: string, moi: string) {
  await db.execute(sql`UPDATE "cms"."dieu_huong" SET "thuong_hieu_gioi_thieu" = ${moi} WHERE "thuong_hieu_gioi_thieu" = ${cu}`)
  await db.execute(sql.raw(`ALTER TABLE "cms"."dieu_huong" ALTER COLUMN "thuong_hieu_gioi_thieu" SET DEFAULT '${moi.replace(/'/g, "''")}'`))
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await doiCot(db, payload, 'Huyền học', HH_CU, HH_MOI)
  await doiCot(db, payload, 'Kiến thức', KT_CU, KT_MOI)
  await doiGioiThieu(db, GT_CU, GT_MOI)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await doiGioiThieu(db, GT_MOI, GT_CU)
  await doiCot(db, payload, 'Kiến thức', KT_MOI, KT_CU)
  await doiCot(db, payload, 'Huyền học', HH_MOI, HH_CU)
}
