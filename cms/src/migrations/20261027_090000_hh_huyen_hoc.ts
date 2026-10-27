import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// HH-1 (chủ dự án 2026-10-27) — hub "Khám phá" /kham-pha đổi thành "Huyền học" /huyen-hoc: chỉ đổi DỮ LIỆU, không đổi bảng.
// 1) "Trang website" (noi_dung_trang + phiên bản): duong /kham-pha → /huyen-hoc để chữ/ảnh/SEO đã sửa đi theo trang mới.
//    Đồng bộ sổ trang (web deploy trước) có thể đã tạo sẵn NHÁP trống ở /huyen-hoc → xoá nháp đó; bản đã xuất bản thì giữ,
//    ghi log để Chủ biên gộp tay.
// 2) Mọi ô đường dẫn trong schema cms (cột duong_dan / duong / link / *_link — menu đầu trang, chân trang, lối đi tiếp,
//    khối nút, nút banner, dải thông báo, nút trang đích; link trong thân bài Lexical không đổi — web vẫn 308):
//    "/kham-pha" và "/kham-pha?…|#…|/…" → "/huyen-hoc…" (web vẫn 308, nhưng link nội bộ không bắt Google đi chuyển hướng).
// 3) Nhãn menu đầu trang trỏ /huyen-hoc còn là "Khám phá" và tên cột chân trang "Khám phá" → "Huyền học" (nhãn đã đổi tay thì
//    giữ nguyên). Down đảo lại cả ba.
const CU = '/kham-pha'
const MOI = '/huyen-hoc'
const COT_DUONG = ['duong_dan', 'link', 'duong']   // + mọi cột tên kết thúc bằng _link (nut_link, thong_bao_link, banner_nut_link)

// xoaNhapDich: chỉ chiều up — nháp ở đích là nháp TRỐNG do đồng bộ sổ trang tạo. Chiều down không xoá gì: đích (/kham-pha)
// còn tài liệu nghĩa là up đã không chuyển (đích /huyen-hoc có bản xuất bản từ trước) → giữ nguyên cả hai.
async function doiTrang(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'] | null, cu: string, moi: string, xoaNhapDich: boolean) {
  const coCu = (await db.execute(sql`SELECT 1 FROM "cms"."noi_dung_trang" WHERE "duong" = ${cu}`)).rows.length > 0
  if (!coCu) return
  if (xoaNhapDich) {
    await db.execute(sql`DELETE FROM "cms"."_noi_dung_trang_v" WHERE "parent_id" IN
      (SELECT id FROM "cms"."noi_dung_trang" WHERE "duong" = ${moi} AND COALESCE("_status"::text, 'draft') = 'draft')`)
    const xoa = await db.execute(sql`DELETE FROM "cms"."noi_dung_trang" WHERE "duong" = ${moi}
      AND COALESCE("_status"::text, 'draft') = 'draft' RETURNING id`)
    if (xoa.rows.length) payload?.logger.info(`HH-1 Trang website: xoá nháp chưa xuất bản ở ${moi} (đồng bộ sổ trang tạo) để chữ của ${cu} chuyển sang`)
  }
  const r = await db.execute(sql`UPDATE "cms"."noi_dung_trang" SET "duong" = ${moi} WHERE "duong" = ${cu}
    AND NOT EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" b WHERE b."duong" = ${moi}) RETURNING id`)
  if (!r.rows.length) {
    payload?.logger.info(`HH-1 Trang website: ĐÃ có bản xuất bản ở ${moi} — giữ nguyên, ${cu} cần gộp tay`)
    return
  }
  await db.execute(sql`UPDATE "cms"."_noi_dung_trang_v" AS v SET "version_duong" = ${moi} WHERE v."version_duong" = ${cu}
    AND EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" p WHERE p.id = v.parent_id AND p."duong" = ${moi})`)
  payload?.logger.info(`HH-1 Trang website: ${cu} → ${moi}`)
}

async function doiLienKet(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'] | null, cu: string, moi: string) {
  const cot = await db.execute(sql`SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'cms' AND (column_name IN (${sql.join(COT_DUONG.map((c) => sql`${c}`), sql`, `)}) OR column_name LIKE ${'%\\_link'})
      AND data_type IN ('character varying', 'text') AND NOT (table_name = 'noi_dung_trang' AND column_name = 'duong')`)
  for (const row of cot.rows as { table_name: string; column_name: string }[]) {
    const t = sql.raw(`"cms"."${row.table_name}"`), c = sql.raw(`"${row.column_name}"`)
    const r = await db.execute(sql`UPDATE ${t} SET ${c} = ${moi} || substr(${c}, ${cu.length + 1})
      WHERE ${c} = ${cu} OR ${c} LIKE ${cu + '?%'} OR ${c} LIKE ${cu + '#%'} OR ${c} LIKE ${cu + '/%'} RETURNING 1`)
    if (r.rows.length) payload?.logger.info(`HH-1 ${row.table_name}.${row.column_name}: ${cu} → ${moi}: ${r.rows.length} dòng`)
  }
}

async function doiNhan(db: MigrateUpArgs['db'], duong: string, cu: string, moi: string) {
  await db.execute(sql`UPDATE "cms"."menu_dau_trang_muc" SET "nhan" = ${moi} WHERE "duong_dan" = ${duong} AND "nhan" = ${cu}`)
  await db.execute(sql`UPDATE "cms"."dieu_huong_cot" SET "ten" = ${moi} WHERE "ten" = ${cu}`)
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await doiTrang(db, payload, CU, MOI, true)
  await doiLienKet(db, payload, CU, MOI)
  await doiNhan(db, MOI, 'Khám phá', 'Huyền học')
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await doiNhan(db, MOI, 'Huyền học', 'Khám phá')
  await doiLienKet(db, payload, MOI, CU)
  await doiTrang(db, payload, MOI, CU, false)
}
