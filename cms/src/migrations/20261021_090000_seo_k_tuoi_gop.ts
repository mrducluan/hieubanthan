import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// SEO-K (chủ dự án duyệt 2026-10-21) — trang "tuổi hợp hướng" gộp nam + nữ cùng năm: chỉ đổi DỮ LIỆU, không đổi bảng.
// Mẫu cụm "/phong-thuy/huong-hop-tuoi/tuoi-{nam}-{gioi}" → ".../tuoi-{nam}" và ghi đè từng URL ".../tuoi-1990-nam|nu" →
// ".../tuoi-1990" (bảng chính + mọi phiên bản). Năm có ghi đè cho CẢ nam và nữ: giữ bản nam, bản nữ để nguyên (ghi log
// để Chủ biên gộp tay — đường cũ không còn trang nên đồng bộ sổ trang sẽ đánh dấu). Down: mẫu về như cũ; ghi đè từng URL
// trả về bản "-nam" (không biết trước đây là nam hay nữ).
const MAU_CU = '/phong-thuy/huong-hop-tuoi/tuoi-{nam}-{gioi}'
const MAU_MOI = '/phong-thuy/huong-hop-tuoi/tuoi-{nam}'
const GOC = '/phong-thuy/huong-hop-tuoi/tuoi-'

async function doiMau(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'] | null, cu: string, moi: string) {
  // Đồng bộ sổ trang (web mới deploy trước) có thể đã tạo sẵn mẫu NHÁP trống ở đường mới → xoá nháp đó để mẫu cũ (chữ
  // biên tập thật) chuyển sang. Mẫu mới đã xuất bản thì không đụng, chỉ ghi log để Chủ biên gộp tay.
  const coCu = (await db.execute(sql`SELECT 1 FROM "cms"."mau_cum" WHERE "mau_duong" = ${cu}`)).rows.length > 0
  if (!coCu) return
  await db.execute(sql`DELETE FROM "cms"."_mau_cum_v" WHERE "parent_id" IN
    (SELECT id FROM "cms"."mau_cum" WHERE "mau_duong" = ${moi} AND COALESCE("_status"::text, 'draft') = 'draft')`)
  await db.execute(sql`DELETE FROM "cms"."mau_cum" WHERE "mau_duong" = ${moi} AND COALESCE("_status"::text, 'draft') = 'draft'`)
  const r = await db.execute(sql`UPDATE "cms"."mau_cum" SET "mau_duong" = ${moi} WHERE "mau_duong" = ${cu}
    AND NOT EXISTS (SELECT 1 FROM "cms"."mau_cum" b WHERE b."mau_duong" = ${moi}) RETURNING id`)
  if (!r.rows.length) {
    payload?.logger.info(`SEO-K mẫu cụm: ĐÃ có mẫu xuất bản ở ${moi} — giữ nguyên, mẫu ${cu} cần gộp tay`)
    return
  }
  await db.execute(sql`UPDATE "cms"."_mau_cum_v" AS v SET "version_mau_duong" = ${moi} WHERE v."version_mau_duong" = ${cu}
    AND EXISTS (SELECT 1 FROM "cms"."mau_cum" p WHERE p.id = v.parent_id AND p."mau_duong" = ${moi})`)
  payload?.logger.info(`SEO-K mẫu cụm: ${cu} → ${moi}`)
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await doiMau(db, payload, MAU_CU, MAU_MOI)
  for (const gioi of ['nam', 'nu']) {
    const re = `^${GOC}[0-9]{4}-${gioi}$`
    const r = await db.execute(sql`
      UPDATE "cms"."noi_dung_trang" AS a SET "duong" = substr(a."duong", 1, ${GOC.length + 4})
      WHERE a."duong" ~ ${re}
        AND NOT EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" b WHERE b."duong" = substr(a."duong", 1, ${GOC.length + 4}))
      RETURNING a.id`)
    await db.execute(sql`
      UPDATE "cms"."_noi_dung_trang_v" AS v SET "version_duong" = substr(v."version_duong", 1, ${GOC.length + 4})
      WHERE v."version_duong" ~ ${re}
        AND EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" p WHERE p.id = v.parent_id AND p."duong" = substr(v."version_duong", 1, ${GOC.length + 4}))`)
    const sot = await db.execute(sql`SELECT "duong" AS d FROM "cms"."noi_dung_trang" WHERE "duong" ~ ${re}`)
    if (r.rows.length || sot.rows.length)
      payload.logger.info(`SEO-K tuổi ${gioi}: đổi ${r.rows.length}${sot.rows.length ? `, TRÙNG đích bỏ qua: ${sot.rows.map((x) => String(x.d)).join(', ')}` : ''}`)
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await doiMau(db, payload, MAU_MOI, MAU_CU)
  const re = `^${GOC}[0-9]{4}$`
  await db.execute(sql`UPDATE "cms"."noi_dung_trang" AS a SET "duong" = a."duong" || '-nam' WHERE a."duong" ~ ${re}
    AND NOT EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" b WHERE b."duong" = a."duong" || '-nam')`)
  await db.execute(sql`UPDATE "cms"."_noi_dung_trang_v" AS v SET "version_duong" = v."version_duong" || '-nam'
    WHERE v."version_duong" ~ ${re}
      AND EXISTS (SELECT 1 FROM "cms"."noi_dung_trang" p WHERE p.id = v.parent_id AND p."duong" = v."version_duong" || '-nam')`)
}
