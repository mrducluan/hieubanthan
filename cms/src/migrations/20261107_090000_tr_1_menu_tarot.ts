import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// TR-1 menu (chủ dự án chốt 2026-11-07) — menu con "Huyền học": thêm "Xem Tarot" (/tarot); "64 quẻ Kinh Dịch" (/kinh-dich/que)
// và "Thư viện kiến thức" (/kien-thuc) rời menu (vẫn ở thanh mảng Kinh Dịch, hub Huyền học, chân trang) — giữ ≤ 12 mục con.
// Chỉ đổi DỮ LIỆU menu đã lưu ở CMS (menu trống → web dùng mặc định trong code, đã đổi cùng lượt). Chỉ đụng dòng TRÙNG ĐÚNG
// mặc định cũ (đường dẫn + nhãn) dưới mục cha /huyen-hoc — dòng biên tập đã sửa tay giữ nguyên. Down đảo lại.
type Muc = { duong_dan: string; nhan: string; mo_ta: string }
const QUE: Muc = { duong_dan: '/kinh-dich/que', nhan: '64 quẻ Kinh Dịch', mo_ta: 'Ý nghĩa từng quẻ, lời hào, cách hiểu đơn giản' }
const THU_VIEN: Muc = { duong_dan: '/kien-thuc', nhan: 'Thư viện kiến thức', mo_ta: 'Nghĩa sao, quẻ, con số — tra cứu miễn phí' }
const TAROT: Muc = { duong_dan: '/tarot', nhan: 'Xem Tarot', mo_ta: 'Xáo bài, rút lá, 5 trải bài, 78 lá có nguồn' }

type Db = MigrateUpArgs['db']
type Log = MigrateUpArgs['payload'] | null

const coDuoi = async (db: Db, duong: string) => (await db.execute(sql`SELECT 1 FROM "cms"."menu_dau_trang_muc_con" c
  JOIN "cms"."menu_dau_trang_muc" m ON m.id = c."_parent_id" WHERE m."duong_dan" = '/huyen-hoc' AND c."duong_dan" = ${duong}`)).rows.length > 0

/** Dòng `cu` (trùng đúng mặc định) → `moi`; không có dòng `cu` thì thêm `moi` vào cuối. Đã có `moi` → không làm gì. */
async function thay(db: Db, payload: Log, cu: Muc, moi: Muc) {
  if (await coDuoi(db, moi.duong_dan)) { payload?.logger.info(`TR-1 menu: đã có ${moi.duong_dan} dưới Huyền học — giữ nguyên`); return }
  const r = await db.execute(sql`UPDATE "cms"."menu_dau_trang_muc_con" c SET "duong_dan" = ${moi.duong_dan}, "nhan" = ${moi.nhan}, "mo_ta" = ${moi.mo_ta}
    FROM "cms"."menu_dau_trang_muc" m
    WHERE m.id = c."_parent_id" AND m."duong_dan" = '/huyen-hoc' AND COALESCE(c."loai"::text, 'duong_dan') = 'duong_dan'
      AND c."duong_dan" = ${cu.duong_dan} AND c."nhan" = ${cu.nhan} RETURNING c.id`)
  if (r.rows.length) { payload?.logger.info(`TR-1 menu: ${cu.duong_dan} → ${moi.duong_dan}`); return }
  await them(db, payload, moi)
}

/** Thêm `muc` vào cuối menu con của Huyền học (chỉ khi mục cha có trong CMS và chưa có `muc`). */
async function them(db: Db, payload: Log, muc: Muc) {
  if (await coDuoi(db, muc.duong_dan)) return
  const r = await db.execute(sql`INSERT INTO "cms"."menu_dau_trang_muc_con" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan", "mo_ta")
    SELECT COALESCE((SELECT MAX(c."_order") FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = m.id), 0) + 1,
      m.id, md5(random()::text || clock_timestamp()::text), ${muc.nhan}, 'duong_dan', ${muc.duong_dan}, ${muc.mo_ta}
    FROM "cms"."menu_dau_trang_muc" m WHERE m."duong_dan" = '/huyen-hoc' RETURNING id`)
  if (r.rows.length) payload?.logger.info(`TR-1 menu: thêm ${muc.duong_dan} vào cuối Huyền học`)
}

/** Xoá dòng trùng đúng mặc định cũ dưới Huyền học. */
async function xoa(db: Db, payload: Log, muc: Muc) {
  const r = await db.execute(sql`DELETE FROM "cms"."menu_dau_trang_muc_con" c USING "cms"."menu_dau_trang_muc" m
    WHERE m.id = c."_parent_id" AND m."duong_dan" = '/huyen-hoc' AND COALESCE(c."loai"::text, 'duong_dan') = 'duong_dan'
      AND c."duong_dan" = ${muc.duong_dan} AND c."nhan" = ${muc.nhan} RETURNING c.id`)
  if (r.rows.length) payload?.logger.info(`TR-1 menu: bỏ ${muc.duong_dan} khỏi Huyền học`)
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await thay(db, payload, QUE, TAROT)      // giữ đúng vị trí dòng "64 quẻ" cho "Xem Tarot"
  await xoa(db, payload, THU_VIEN)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await thay(db, payload, TAROT, QUE)
  await them(db, payload, THU_VIEN)
}
