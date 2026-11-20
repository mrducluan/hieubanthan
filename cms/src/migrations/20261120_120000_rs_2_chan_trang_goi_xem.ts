import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// RS-2 (chủ dự án duyệt "làm đợt 2", 2026-11-20) — chân trang cột "Về chúng tôi" thêm "Các gói xem" (/goi-xem): trang bảng
// giá trước chỉ tới được từ Nạp Sao và hộp thoại Sao. Chỉ đổi DỮ LIỆU đã lưu ở CMS: thêm liên kết vào cuối cột khi cột chưa
// có /goi-xem và còn chỗ (≤ 15 liên kết / cột). Cột biên tập đã có /goi-xem hoặc đã đầy → giữ nguyên (ghi log).
// Chân trang chưa lưu ở CMS → web dùng mặc định trong code (đã đổi cùng lượt). Down chỉ xoá đúng liên kết đã thêm.
const COT = 'Về chúng tôi'
const DUONG = '/goi-xem'
const NHAN = 'Các gói xem'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const cot = await db.execute(sql`SELECT id FROM "cms"."dieu_huong_cot" WHERE "ten" = ${COT}`)
  for (const { id } of cot.rows as { id: string }[]) {
    const r = await db.execute(sql`SELECT "duong_dan", "_order" FROM "cms"."dieu_huong_cot_lien_ket" WHERE "_parent_id" = ${id}`)
    const ds = r.rows as { duong_dan: string | null; _order: number }[]
    if (ds.some((x) => x.duong_dan === DUONG)) { payload?.logger.info(`RS-2 chân trang: cột "${COT}" đã có ${DUONG} — giữ nguyên`); continue }
    if (ds.length >= 15) { payload?.logger.info(`RS-2 chân trang: cột "${COT}" đã đủ 15 liên kết — giữ nguyên`); continue }
    const thu = Math.max(0, ...ds.map((x) => Number(x._order) || 0)) + 1
    await db.execute(sql`INSERT INTO "cms"."dieu_huong_cot_lien_ket" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan")
      VALUES (${thu}, ${id}, md5(random()::text || clock_timestamp()::text), ${NHAN}, 'duong_dan', ${DUONG})`)
    payload?.logger.info(`RS-2 chân trang: cột "${COT}" thêm ${DUONG}`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DELETE FROM "cms"."dieu_huong_cot_lien_ket" WHERE "duong_dan" = ${DUONG} AND "nhan" = ${NHAN}
    AND "_parent_id" IN (SELECT id FROM "cms"."dieu_huong_cot" WHERE "ten" = ${COT})`)
}
