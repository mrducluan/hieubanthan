import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// TM-1 (chủ dự án duyệt 2026-11-03) — menu con "Huyền học": 3 công cụ đã có bản theo năm ở menu "Năm" (hướng xấu theo năm,
// tuổi xông đất, sao hạn theo tuổi) nhường chỗ cho 3 cụm kiến thức lớn chưa có lối vào menu (sao ở cung, 64 quẻ, mệnh theo
// năm). Chỉ đổi DỮ LIỆU của menu đã lưu ở CMS (menu trống → web dùng mặc định trong code, đã đổi cùng lượt). Chỉ đổi dòng
// TRÙNG ĐÚNG mặc định cũ (đường dẫn + nhãn) dưới mục cha /huyen-hoc — dòng biên tập đã sửa tay giữ nguyên. Down đảo lại.
type Muc = { duong_dan: string; nhan: string; mo_ta: string }
const DOI: [Muc, Muc][] = [
  [{ duong_dan: '/phong-thuy/huong-xau-nam', nhan: 'Hướng xấu theo năm', mo_ta: 'Thái Tuế, Tam Sát, Ngũ Hoàng' },
   { duong_dan: '/tu-vi/sao-o-cung', nhan: 'Sao ở từng cung Tử vi', mo_ta: '14 chính tinh ở 12 cung: sáng hãm, sao đi cùng' }],
  [{ duong_dan: '/tuoi-xong-dat', nhan: 'Tuổi xông đất', mo_ta: 'Tuổi hợp gia chủ, giờ đẹp mùng 1' },
   { duong_dan: '/kinh-dich/que', nhan: '64 quẻ Kinh Dịch', mo_ta: 'Ý nghĩa từng quẻ, lời hào, cách hiểu đơn giản' }],
  [{ duong_dan: '/xem-sao-han', nhan: 'Sao hạn theo tuổi', mo_ta: 'La Hầu, Kế Đô, Thái Bạch… đọc bằng lời thường' },
   { duong_dan: '/bat-tu/menh-theo-nam', nhan: 'Sinh năm nào mệnh gì', mo_ta: 'Can chi, nạp âm, màu hợp, tuổi hợp 1950–2027' }],
]

async function doi(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'] | null, cap: [Muc, Muc][]) {
  for (const [cu, moi] of cap) {
    // Mục mới đã có sẵn dưới Huyền học (biên tập tự thêm) → không tạo bản trùng, giữ dòng cũ.
    const daCo = await db.execute(sql`SELECT 1 FROM "cms"."menu_dau_trang_muc_con" c JOIN "cms"."menu_dau_trang_muc" m ON m.id = c."_parent_id"
      WHERE m."duong_dan" = '/huyen-hoc' AND c."duong_dan" = ${moi.duong_dan}`)
    if (daCo.rows.length) { payload?.logger.info(`TM-1 menu: đã có ${moi.duong_dan} dưới Huyền học — giữ ${cu.duong_dan}`); continue }
    const r = await db.execute(sql`UPDATE "cms"."menu_dau_trang_muc_con" c SET "duong_dan" = ${moi.duong_dan}, "nhan" = ${moi.nhan}, "mo_ta" = ${moi.mo_ta}
      FROM "cms"."menu_dau_trang_muc" m
      WHERE m.id = c."_parent_id" AND m."duong_dan" = '/huyen-hoc' AND COALESCE(c."loai"::text, 'duong_dan') = 'duong_dan'
        AND c."duong_dan" = ${cu.duong_dan} AND c."nhan" = ${cu.nhan} RETURNING c.id`)
    if (r.rows.length) payload?.logger.info(`TM-1 menu: ${cu.duong_dan} → ${moi.duong_dan}`)
  }
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await doi(db, payload, DOI)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await doi(db, payload, DOI.map(([a, b]) => [b, a] as [Muc, Muc]))
}
