import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// KM-3 (chủ dự án duyệt 2026-11-18) — menu con "Huyền học": thêm "Kỳ Môn Độn Giáp" (/ky-mon) vào cuối.
// Chỉ đổi DỮ LIỆU menu đã lưu ở CMS (menu trống → web dùng mặc định trong code, đã đổi cùng lượt). Đã có dòng /ky-mon
// dưới /huyen-hoc (biên tập tự thêm) → giữ nguyên. Mục cha đã đủ 12 menu con → không thêm (trần của CMS). Down chỉ xoá dòng
// TRÙNG ĐÚNG mặc định (đường dẫn + nhãn) — dòng đã sửa tay không đụng.
const MUC = { duong_dan: '/ky-mon', nhan: 'Kỳ Môn Độn Giáp', mo_ta: 'Giờ này hướng nào thuận, hợp việc gì' }
const CHA = '/huyen-hoc'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const co = await db.execute(sql`SELECT 1 FROM "cms"."menu_dau_trang_muc_con" c
    JOIN "cms"."menu_dau_trang_muc" m ON m.id = c."_parent_id" WHERE m."duong_dan" = ${CHA} AND c."duong_dan" = ${MUC.duong_dan}`)
  if (co.rows.length) { payload?.logger.info('KM-3: đã có /ky-mon dưới Huyền học — giữ nguyên'); return }
  const r = await db.execute(sql`INSERT INTO "cms"."menu_dau_trang_muc_con" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan", "mo_ta")
    SELECT COALESCE((SELECT MAX(c."_order") FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = m.id), 0) + 1,
      m.id, md5(random()::text || clock_timestamp()::text), ${MUC.nhan}, 'duong_dan', ${MUC.duong_dan}, ${MUC.mo_ta}
    FROM "cms"."menu_dau_trang_muc" m
    WHERE m."duong_dan" = ${CHA} AND (SELECT COUNT(*) FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = m.id) < 12
    RETURNING id`)
  if (r.rows.length) payload?.logger.info('KM-3: thêm /ky-mon (Kỳ Môn Độn Giáp) vào cuối menu Huyền học')
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  const r = await db.execute(sql`DELETE FROM "cms"."menu_dau_trang_muc_con" c USING "cms"."menu_dau_trang_muc" m
    WHERE m.id = c."_parent_id" AND m."duong_dan" = ${CHA} AND COALESCE(c."loai"::text, 'duong_dan') = 'duong_dan'
      AND c."duong_dan" = ${MUC.duong_dan} AND c."nhan" = ${MUC.nhan} RETURNING c.id`)
  if (r.rows.length) payload?.logger.info('KM-3: bỏ /ky-mon khỏi menu Huyền học')
}
