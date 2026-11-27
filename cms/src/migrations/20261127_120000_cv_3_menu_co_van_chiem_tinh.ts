import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// CV-3 (chủ dự án giao 2026-11-27) — lối vào menu cho hai trang chưa có chỗ đứng:
//  • "Bản thân": thêm "Hỏi một quyết định" (/co-van);  • "Hợp đôi": thêm "Cố vấn kinh doanh" (/co-van-kinh-doanh);
//  (Chiêm tinh vào menu + chân trang do migration chiem_tinh_menu_chan_trang lo.)
// Chỉ đổi DỮ LIỆU đã lưu ở CMS (trống → web dùng mặc định trong code, đã đổi cùng lượt). Không thêm khi đã có cùng đường dẫn
// hoặc đã đủ trần; chỉ bỏ dòng TRÙNG ĐÚNG mặc định (đường dẫn + nhãn). Down chỉ gỡ dòng trùng đúng mặc định.
type Muc = { duong_dan: string; nhan: string; mo_ta: string }
const CV: Muc = { duong_dan: '/co-van', nhan: 'Hỏi một quyết định', mo_ta: 'Mở shop, mua nhà, nghỉ việc: tháng nào hợp, cần chuẩn bị gì' }
const CVKD: Muc = { duong_dan: '/co-van-kinh-doanh', nhan: 'Cố vấn kinh doanh', mo_ta: 'Mở quán, góp vốn, chọn mặt bằng: hỏi quyết định, soạn nháp đối tác' }
const BT = '/ban-than'
const HD = '/hop-doi'

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

  payload?.logger.info(`CV-3: menu thêm Hỏi một quyết định ${a.rows.length}, Cố vấn kinh doanh ${b.rows.length}`)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(xoa(BT, CV))
  await db.execute(xoa(HD, CVKD))
  payload?.logger.info('CV-3: gỡ Hỏi một quyết định, Cố vấn kinh doanh')
}
