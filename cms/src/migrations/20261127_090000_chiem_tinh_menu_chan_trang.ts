import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// CHANG-4 menu + chân trang (chủ dự án duyệt 2026-11-27) — Chiêm tinh phương Tây (/chiem-tinh) là trang trụ:
//  · menu đầu trang "Huyền học": "Sinh năm nào mệnh gì" (/bat-tu/menh-theo-nam) nhường chỗ cho "Chiêm tinh", đặt ngay sau
//    "Kỳ Môn Độn Giáp" (sau 8 công cụ) — giữ ≤ 12 mục con. Trang mệnh theo năm vẫn ở chân trang, hub, thanh mảng Bát tự.
//  · chân trang: thêm "Chiêm tinh phương Tây" ngay sau /ky-mon (TRU_CHAN_TRANG nay đòi /chiem-tinh — thiếu thì CMS không cho
//    lưu chân trang), lời giới thiệu khối thương hiệu nêu thêm Chiêm tinh.
// Chỉ đổi DỮ LIỆU đã lưu ở CMS (menu / chân trang trống → web dùng mặc định trong code, đã đổi cùng lượt). Chỉ đụng dòng
// TRÙNG ĐÚNG mặc định cũ (đường dẫn + nhãn); dòng đã sửa tay giữ nguyên (ghi log). Down trả lại như cũ.
const MENH = { duong_dan: '/bat-tu/menh-theo-nam', nhan: 'Sinh năm nào mệnh gì', mo_ta: 'Can chi, nạp âm, màu hợp, tuổi hợp 1950–2027' }
const CT = { duong_dan: '/chiem-tinh', nhan: 'Chiêm tinh', mo_ta: 'Bản đồ sao, cung Mặt Trời – Mặt Trăng – Mọc, hợp đôi' }
const CT_CHAN = { duong_dan: '/chiem-tinh', nhan: 'Chiêm tinh phương Tây' }
const HH = '/huyen-hoc'
const GT_CU = 'Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Kỳ Môn — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.'
const GT_MOI = 'Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Kỳ Môn, Chiêm tinh — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.'

type Db = MigrateUpArgs['db']
type Dong = { id: string; duong_dan: string | null; nhan: string | null; loai: string; _order: number }

/** Chèn một dòng ngay sau dòng có đường dẫn `sau` (dời các dòng phía sau xuống một bậc); không có thì thêm cuối. */
async function chenSau(db: Db, bang: 'menu_dau_trang_muc_con' | 'dieu_huong_cot_lien_ket', cha: string, ds: Dong[], sau: string,
  dong: { nhan: string; duong_dan: string; mo_ta?: string }) {
  const moc = ds.find((x) => x.loai === 'duong_dan' && x.duong_dan === sau)
  const thu = moc ? Number(moc._order) + 1 : Math.max(0, ...ds.map((x) => Number(x._order) || 0)) + 1
  if (moc) {
    await db.execute(sql`UPDATE ${sql.raw(`"cms"."${bang}"`)} SET "_order" = "_order" + 1 WHERE "_parent_id" = ${cha} AND "_order" >= ${thu}`)
  }
  if (bang === 'menu_dau_trang_muc_con') {
    await db.execute(sql`INSERT INTO "cms"."menu_dau_trang_muc_con" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan", "mo_ta")
      VALUES (${thu}, ${cha}, md5(random()::text || clock_timestamp()::text), ${dong.nhan}, 'duong_dan', ${dong.duong_dan}, ${dong.mo_ta ?? null})`)
  } else {
    await db.execute(sql`INSERT INTO "cms"."dieu_huong_cot_lien_ket" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan")
      VALUES (${thu}, ${cha}, md5(random()::text || clock_timestamp()::text), ${dong.nhan}, 'duong_dan', ${dong.duong_dan})`)
  }
}

const docCon = async (db: Db, bang: string, cha: string) => (await db.execute(sql`SELECT "id", "duong_dan", "nhan",
  COALESCE("loai"::text, 'duong_dan') AS loai, "_order" FROM ${sql.raw(`"cms"."${bang}"`)} WHERE "_parent_id" = ${cha} ORDER BY "_order"`)).rows as Dong[]

const xoaDung = (bang: string, cha: string, m: { duong_dan: string; nhan: string }) => sql`DELETE FROM ${sql.raw(`"cms"."${bang}"`)}
  WHERE "_parent_id" = ${cha} AND COALESCE("loai"::text, 'duong_dan') = 'duong_dan' AND "duong_dan" = ${m.duong_dan} AND "nhan" = ${m.nhan} RETURNING id`

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // Menu đầu trang
  const cha = (await db.execute(sql`SELECT id FROM "cms"."menu_dau_trang_muc" WHERE "duong_dan" = ${HH}`)).rows as { id: string }[]
  for (const { id } of cha) {
    const bo = await db.execute(xoaDung('menu_dau_trang_muc_con', id, MENH))
    const ds = await docCon(db, 'menu_dau_trang_muc_con', id)
    if (ds.some((x) => x.duong_dan === CT.duong_dan)) { payload?.logger.info('CHANG-4 menu: đã có /chiem-tinh dưới Huyền học — giữ nguyên'); continue }
    if (ds.length >= 12) { payload?.logger.info('CHANG-4 menu: Huyền học đã đủ 12 mục con (sửa tay) — không thêm /chiem-tinh'); continue }
    await chenSau(db, 'menu_dau_trang_muc_con', id, ds, '/ky-mon', CT)
    payload?.logger.info(`CHANG-4 menu: bỏ ${bo.rows.length} dòng Sinh năm nào mệnh gì, thêm Chiêm tinh vào Huyền học`)
  }
  // Chân trang: thêm sau /ky-mon (cột có /ky-mon; không có thì cột "Huyền học"), khi cả chân trang chưa có /chiem-tinh.
  const co = await db.execute(sql`SELECT 1 FROM "cms"."dieu_huong_cot_lien_ket" WHERE "duong_dan" = ${CT_CHAN.duong_dan}`)
  if (co.rows.length) payload?.logger.info('CHANG-4 chân trang: đã có /chiem-tinh — giữ nguyên')
  else {
    const cot = (await db.execute(sql`SELECT c.id FROM "cms"."dieu_huong_cot" c ORDER BY
      (EXISTS (SELECT 1 FROM "cms"."dieu_huong_cot_lien_ket" l WHERE l."_parent_id" = c.id AND l."duong_dan" = '/ky-mon')) DESC,
      (c."ten" = 'Huyền học') DESC, c."_order" LIMIT 1`)).rows as { id: string }[]
    for (const { id } of cot) {
      const ds = await docCon(db, 'dieu_huong_cot_lien_ket', id)
      if (ds.length >= 15) { payload?.logger.info('CHANG-4 chân trang: cột đã đủ 15 liên kết — chưa thêm /chiem-tinh, cần sửa tay'); continue }
      await chenSau(db, 'dieu_huong_cot_lien_ket', id, ds, '/ky-mon', CT_CHAN)
      payload?.logger.info('CHANG-4 chân trang: thêm Chiêm tinh phương Tây')
    }
  }
  await db.execute(sql`UPDATE "cms"."dieu_huong" SET "thuong_hieu_gioi_thieu" = ${GT_MOI} WHERE "thuong_hieu_gioi_thieu" = ${GT_CU}`)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  const cha = (await db.execute(sql`SELECT id FROM "cms"."menu_dau_trang_muc" WHERE "duong_dan" = ${HH}`)).rows as { id: string }[]
  for (const { id } of cha) {
    await db.execute(xoaDung('menu_dau_trang_muc_con', id, CT))
    const ds = await docCon(db, 'menu_dau_trang_muc_con', id)
    if (!ds.some((x) => x.duong_dan === MENH.duong_dan) && ds.length < 12) await chenSau(db, 'menu_dau_trang_muc_con', id, ds, '/tu-vi/sao-o-cung', MENH)
  }
  await db.execute(sql`DELETE FROM "cms"."dieu_huong_cot_lien_ket" WHERE "duong_dan" = ${CT_CHAN.duong_dan} AND "nhan" = ${CT_CHAN.nhan}`)
  await db.execute(sql`UPDATE "cms"."dieu_huong" SET "thuong_hieu_gioi_thieu" = ${GT_CU} WHERE "thuong_hieu_gioi_thieu" = ${GT_MOI}`)
  payload?.logger.info('CHANG-4: trả Sinh năm nào mệnh gì về menu Huyền học, bỏ Chiêm tinh khỏi menu + chân trang')
}
