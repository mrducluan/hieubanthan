import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// QLNS-1 (chủ dự án 2026-11-25) — công cụ đội ngũ đổi URL /ban-do-doi-ngu → /quan-ly-nhan-su (web 308 một bước, cả
// /ban-do-doi-ngu/moi?ma=…). Chỉ đổi DỮ LIỆU, không đổi bảng — cùng khuôn HH-1 (20261027_090000_hh_huyen_hoc):
// 1) "Trang website" (noi_dung_trang + phiên bản): duong cũ → mới để chữ / SEO đã sửa đi theo trang mới; nháp TRỐNG ở đích
//    (đồng bộ sổ trang tạo khi web deploy trước) bị xoá; đích đã có bản xuất bản thì giữ cả hai, ghi log để Chủ biên gộp tay.
// 2) Mọi ô đường dẫn trong schema cms (duong_dan / link / duong / *_link — menu, chân trang, lối đi tiếp, nút…).
// 3) Nhãn menu con TRÙNG ĐÚNG mặc định cũ → nhãn + mô tả mới (nhãn đã sửa tay giữ nguyên). Down đảo lại cả ba.
const CU = '/ban-do-doi-ngu'
const MOI = '/quan-ly-nhan-su'
const NHAN_CU = { nhan: 'Bản đồ đội ngũ (Chủ DN)', mo_ta: 'Xem 5 hành đội ngũ & gợi ý phối hợp 2 chiều cho 1–8 cộng sự' }
const NHAN_MOI = { nhan: 'Quản lý nhân sự (Chủ DN)', mo_ta: '5 hành của đội, cách phối hợp từng người, kế hoạch 30 ngày' }
const COT_DUONG = ['duong_dan', 'link', 'duong']

async function doiTrang(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'] | null, cu: string, moi: string, xoaNhapDich: boolean) {
  const coCu = (await db.execute(sql`SELECT 1 FROM "cms"."noi_dung_trang" WHERE "duong" = ${cu}`)).rows.length > 0
  if (!coCu) return
  if (xoaNhapDich) {
    await db.execute(sql`DELETE FROM "cms"."_noi_dung_trang_v" WHERE "parent_id" IN
      (SELECT id FROM "cms"."noi_dung_trang" WHERE "duong" = ${moi} AND COALESCE("_status"::text, 'draft') = 'draft')`)
    await db.execute(sql`DELETE FROM "cms"."noi_dung_trang" WHERE "duong" = ${moi} AND COALESCE("_status"::text, 'draft') = 'draft'`)
  }
  const r = await db.execute(sql`UPDATE "cms"."noi_dung_trang" SET "duong" = ${moi} WHERE "duong" = ${cu}
    AND NOT EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" b WHERE b."duong" = ${moi}) RETURNING id`)
  if (!r.rows.length) {
    payload?.logger.info(`QLNS-1 Trang website: ĐÃ có bản xuất bản ở ${moi} — giữ nguyên, ${cu} cần gộp tay`)
    return
  }
  await db.execute(sql`UPDATE "cms"."_noi_dung_trang_v" AS v SET "version_duong" = ${moi} WHERE v."version_duong" = ${cu}
    AND EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" p WHERE p.id = v.parent_id AND p."duong" = ${moi})`)
  payload?.logger.info(`QLNS-1 Trang website: ${cu} → ${moi}`)
}

async function doiLienKet(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'] | null, cu: string, moi: string) {
  const cot = await db.execute(sql`SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'cms' AND (column_name IN (${sql.join(COT_DUONG.map((c) => sql`${c}`), sql`, `)}) OR column_name LIKE ${'%\\_link'})
      AND data_type IN ('character varying', 'text') AND NOT (table_name = 'noi_dung_trang' AND column_name = 'duong')`)
  for (const row of cot.rows as { table_name: string; column_name: string }[]) {
    const t = sql.raw(`"cms"."${row.table_name}"`), c = sql.raw(`"${row.column_name}"`)
    const r = await db.execute(sql`UPDATE ${t} SET ${c} = ${moi} || substr(${c}, ${cu.length + 1})
      WHERE ${c} = ${cu} OR ${c} LIKE ${cu + '?%'} OR ${c} LIKE ${cu + '#%'} OR ${c} LIKE ${cu + '/%'} RETURNING 1`)
    if (r.rows.length) payload?.logger.info(`QLNS-1 ${row.table_name}.${row.column_name}: ${cu} → ${moi}: ${r.rows.length} dòng`)
  }
}

async function doiNhan(db: MigrateUpArgs['db'], duong: string, cu: typeof NHAN_CU, moi: typeof NHAN_CU) {
  await db.execute(sql`UPDATE "cms"."menu_dau_trang_muc_con" SET "nhan" = ${moi.nhan}, "mo_ta" = ${moi.mo_ta}
    WHERE "duong_dan" = ${duong} AND "nhan" = ${cu.nhan}`)
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await doiTrang(db, payload, CU, MOI, true)
  await doiLienKet(db, payload, CU, MOI)
  await doiNhan(db, MOI, NHAN_CU, NHAN_MOI)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await doiNhan(db, MOI, NHAN_MOI, NHAN_CU)
  await doiLienKet(db, payload, MOI, CU)
  await doiTrang(db, payload, MOI, CU, false)
}
