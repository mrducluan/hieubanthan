import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// MENU-TS (chủ dự án 2026-11-22) — "Thần số học" (/than-so) rời menu "Bản thân", đứng ĐẦU menu "Huyền học";
// "Tuổi làm nhà, cưới hỏi" (/xem-tuoi-lam-nha) rời menu Huyền học để giữ ≤ 12 mục con. URL không đổi.
// Chỉ đổi DỮ LIỆU menu đã lưu ở CMS (menu trống → web dùng mặc định trong code, đã đổi cùng lượt). Chỉ đụng dòng TRÙNG ĐÚNG
// mặc định (đường dẫn + nhãn) — dòng biên tập đã sửa tay giữ nguyên. Down trả lại như cũ.
const TS = { duong_dan: '/than-so', nhan: 'Thần số học', mo_ta: 'Bốn số cốt lõi, Bản đồ con số, năm cá nhân' }
const LN = { duong_dan: '/xem-tuoi-lam-nha', nhan: 'Tuổi làm nhà, cưới hỏi', mo_ta: 'Kim lâu, Hoang ốc, Tam tai, năm thuận' }
const BT = '/ban-than'
const HH = '/huyen-hoc'

const xoa = (cha: string, m: typeof TS) => sql`DELETE FROM "cms"."menu_dau_trang_muc_con" c USING "cms"."menu_dau_trang_muc" p
  WHERE p.id = c."_parent_id" AND p."duong_dan" = ${cha} AND COALESCE(c."loai"::text, 'duong_dan') = 'duong_dan'
    AND c."duong_dan" = ${m.duong_dan} AND c."nhan" = ${m.nhan} RETURNING c.id`

// đau = true → chèn lên đầu (MIN - 1), false → cuối (MAX + 1). Không chèn khi đã có cùng đường dẫn hoặc đã đủ 12.
const them = (cha: string, m: typeof TS, dau: boolean) => sql`INSERT INTO "cms"."menu_dau_trang_muc_con"
    ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan", "mo_ta")
  SELECT ${dau
    ? sql`COALESCE((SELECT MIN(c."_order") FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = p.id), 1) - 1`
    : sql`COALESCE((SELECT MAX(c."_order") FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = p.id), 0) + 1`},
    p.id, md5(random()::text || clock_timestamp()::text), ${m.nhan}, 'duong_dan', ${m.duong_dan}, ${m.mo_ta}
  FROM "cms"."menu_dau_trang_muc" p
  WHERE p."duong_dan" = ${cha}
    AND NOT EXISTS (SELECT 1 FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = p.id AND c."duong_dan" = ${m.duong_dan})
    AND (SELECT COUNT(*) FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = p.id) < 12
  RETURNING id`

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const a = await db.execute(xoa(HH, LN))
  const b = await db.execute(them(HH, TS, true))
  // Chỉ bỏ khỏi Bản thân khi Huyền học đã có /than-so (vừa thêm hoặc biên tập tự thêm) — không để mất lối vào.
  const co = await db.execute(sql`SELECT 1 FROM "cms"."menu_dau_trang_muc_con" c JOIN "cms"."menu_dau_trang_muc" p
    ON p.id = c."_parent_id" WHERE p."duong_dan" = ${HH} AND c."duong_dan" = ${TS.duong_dan}`)
  const c = co.rows.length ? await db.execute(xoa(BT, TS)) : { rows: [] }
  payload?.logger.info(`MENU-TS: bỏ ${a.rows.length} dòng Tuổi làm nhà, thêm ${b.rows.length} dòng Thần số học vào Huyền học, bỏ ${c.rows.length} dòng ở Bản thân`)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(xoa(HH, TS))
  await db.execute(them(BT, TS, true))
  await db.execute(them(HH, LN, false))
  payload?.logger.info('MENU-TS: trả Thần số học về Bản thân, Tuổi làm nhà về Huyền học')
}
