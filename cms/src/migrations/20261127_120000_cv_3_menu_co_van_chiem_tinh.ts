import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// CV-3 (chủ dự án giao 2026-11-27) — lối vào menu cho hai trang chưa có chỗ đứng:
//  • "Bản thân": thêm "Hỏi một quyết định" (/co-van);  • "Hợp đôi": thêm "Cố vấn kinh doanh" (/co-van-kinh-doanh);
//  • "Huyền học": thêm "Chiêm tinh phương Tây" (/chiem-tinh) ngay sau Kỳ Môn, "Dấu hiệu trong nhà" (/phong-thuy/dau-hieu)
//    nhường chỗ (≤ 12 mục con; vẫn có ở thanh mảng Phong thuỷ, hub Huyền học, chân trang);
//  • Chân trang, cột "Huyền học": thêm "Chiêm tinh phương Tây" sau Kỳ Môn (≤ 15 liên kết).
// Chỉ đổi DỮ LIỆU đã lưu ở CMS (trống → web dùng mặc định trong code, đã đổi cùng lượt). Không thêm khi đã có cùng đường dẫn
// hoặc đã đủ trần; chỉ bỏ dòng TRÙNG ĐÚNG mặc định (đường dẫn + nhãn). Down chỉ gỡ dòng trùng đúng mặc định.
type Muc = { duong_dan: string; nhan: string; mo_ta: string }
const CV: Muc = { duong_dan: '/co-van', nhan: 'Hỏi một quyết định', mo_ta: 'Mở shop, mua nhà, nghỉ việc: tháng nào hợp, cần chuẩn bị gì' }
const CVKD: Muc = { duong_dan: '/co-van-kinh-doanh', nhan: 'Cố vấn kinh doanh', mo_ta: 'Mở quán, góp vốn, chọn mặt bằng: hỏi quyết định, soạn nháp đối tác' }
const CT: Muc = { duong_dan: '/chiem-tinh', nhan: 'Chiêm tinh phương Tây', mo_ta: 'Bản đồ sao: cung Mặt Trời, Mặt Trăng, Cung Mọc, 12 nhà' }
const DH: Muc = { duong_dan: '/phong-thuy/dau-hieu', nhan: 'Dấu hiệu trong nhà', mo_ta: '23 điều nên rà: cửa, bếp, WC, cầu thang' }
const BT = '/ban-than'
const HD = '/hop-doi'
const HH = '/huyen-hoc'

const xoa = (cha: string, m: Muc) => sql`DELETE FROM "cms"."menu_dau_trang_muc_con" c USING "cms"."menu_dau_trang_muc" p
  WHERE p.id = c."_parent_id" AND p."duong_dan" = ${cha} AND COALESCE(c."loai"::text, 'duong_dan') = 'duong_dan'
    AND c."duong_dan" = ${m.duong_dan} AND c."nhan" = ${m.nhan} RETURNING c.id`

// Chèn vào CUỐI mục cha (không trùng đường dẫn, chưa đủ 12).
const themCuoi = (cha: string, m: Muc) => sql`INSERT INTO "cms"."menu_dau_trang_muc_con"
    ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan", "mo_ta")
  SELECT COALESCE((SELECT MAX(c."_order") FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = p.id), 0) + 1,
    p.id, md5(random()::text || clock_timestamp()::text), ${m.nhan}, 'duong_dan', ${m.duong_dan}, ${m.mo_ta}
  FROM "cms"."menu_dau_trang_muc" p
  WHERE p."duong_dan" = ${cha}
    AND NOT EXISTS (SELECT 1 FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = p.id AND c."duong_dan" = ${m.duong_dan})
    AND (SELECT COUNT(*) FROM "cms"."menu_dau_trang_muc_con" c WHERE c."_parent_id" = p.id) < 12
  RETURNING id`

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const a = await db.execute(themCuoi(BT, CV))
  const b = await db.execute(themCuoi(HD, CVKD))

  // Huyền học: bỏ "Dấu hiệu trong nhà" (giải phóng một chỗ) rồi chèn Chiêm tinh NGAY SAU Kỳ Môn (dồn các dòng sau xuống 1).
  const bo = await db.execute(xoa(HH, DH))
  const km = await db.execute(sql`SELECT c."_order" AS o, c."_parent_id" AS pid FROM "cms"."menu_dau_trang_muc_con" c
    JOIN "cms"."menu_dau_trang_muc" p ON p.id = c."_parent_id" WHERE p."duong_dan" = ${HH} AND c."duong_dan" = '/ky-mon' LIMIT 1`)
  let c = 0
  const kmRow = km.rows[0] as { o: number; pid: string } | undefined
  if (kmRow) {
    const da = await db.execute(sql`SELECT 1 FROM "cms"."menu_dau_trang_muc_con" WHERE "_parent_id" = ${kmRow.pid} AND "duong_dan" = ${CT.duong_dan}`)
    const dem = await db.execute(sql`SELECT COUNT(*)::int AS n FROM "cms"."menu_dau_trang_muc_con" WHERE "_parent_id" = ${kmRow.pid}`)
    if (!da.rows.length && (dem.rows[0] as { n: number }).n < 12) {
      await db.execute(sql`UPDATE "cms"."menu_dau_trang_muc_con" SET "_order" = "_order" + 1 WHERE "_parent_id" = ${kmRow.pid} AND "_order" > ${kmRow.o}`)
      await db.execute(sql`INSERT INTO "cms"."menu_dau_trang_muc_con" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan", "mo_ta")
        VALUES (${kmRow.o + 1}, ${kmRow.pid}, md5(random()::text || clock_timestamp()::text), ${CT.nhan}, 'duong_dan', ${CT.duong_dan}, ${CT.mo_ta})`)
      c = 1
    }
  } else {
    c = (await db.execute(themCuoi(HH, CT))).rows.length
  }

  // Chân trang: cột "Huyền học" thêm "Chiêm tinh phương Tây" sau Kỳ Môn (≤ 15 liên kết, không trùng).
  let f = 0
  const cot = await db.execute(sql`SELECT id FROM "cms"."dieu_huong_cot" WHERE "ten" = 'Huyền học'`)
  for (const { id } of cot.rows as { id: string }[]) {
    const dem = await db.execute(sql`SELECT COUNT(*)::int AS n FROM "cms"."dieu_huong_cot_lien_ket" WHERE "_parent_id" = ${id}`)
    const da = await db.execute(sql`SELECT 1 FROM "cms"."dieu_huong_cot_lien_ket" WHERE "_parent_id" = ${id} AND "duong_dan" = ${CT.duong_dan}`)
    const k = await db.execute(sql`SELECT "_order" AS o FROM "cms"."dieu_huong_cot_lien_ket" WHERE "_parent_id" = ${id} AND "duong_dan" = '/ky-mon' LIMIT 1`)
    if (da.rows.length || (dem.rows[0] as { n: number }).n >= 15 || !k.rows.length) continue
    const o = (k.rows[0] as { o: number }).o
    await db.execute(sql`UPDATE "cms"."dieu_huong_cot_lien_ket" SET "_order" = "_order" + 1 WHERE "_parent_id" = ${id} AND "_order" > ${o}`)
    await db.execute(sql`INSERT INTO "cms"."dieu_huong_cot_lien_ket" ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan")
      VALUES (${o + 1}, ${id}, md5(random()::text || clock_timestamp()::text), ${CT.nhan}, 'duong_dan', ${CT.duong_dan})`)
    f++
  }
  payload?.logger.info(`CV-3: menu thêm Hỏi một quyết định ${a.rows.length}, Cố vấn kinh doanh ${b.rows.length}, Chiêm tinh ${c} (bỏ Dấu hiệu ${bo.rows.length}); chân trang ${f} cột`)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(xoa(BT, CV))
  await db.execute(xoa(HD, CVKD))
  await db.execute(xoa(HH, CT))
  await db.execute(themCuoi(HH, DH))
  await db.execute(sql`DELETE FROM "cms"."dieu_huong_cot_lien_ket" l USING "cms"."dieu_huong_cot" c
    WHERE c.id = l."_parent_id" AND c."ten" = 'Huyền học' AND l."duong_dan" = ${CT.duong_dan} AND l."nhan" = ${CT.nhan}`)
  payload?.logger.info('CV-3: gỡ Hỏi một quyết định, Cố vấn kinh doanh, Chiêm tinh; trả Dấu hiệu trong nhà về cuối menu Huyền học')
}
