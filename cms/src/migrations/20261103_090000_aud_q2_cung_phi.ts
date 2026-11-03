import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// AUD-Q2 (chủ dự án duyệt 2026-11-03) — trang "hướng hợp tuổi" gộp theo CUNG PHI: 46 trang năm → 8 trang cung
// "/phong-thuy/huong-hop-tuoi/cung-…". Chỉ đổi DỮ LIỆU, không đổi bảng: mẫu cụm "…/tuoi-{nam}" → "…/{slug}".
// Ghi đè từng URL "…/tuoi-1990" để nguyên (nhiều năm dồn về một cung → không gộp tự động được; trang năm đã 308 nên
// đồng bộ sổ trang đánh dấu không còn trang — Chủ biên chép tay chữ cần giữ sang trang cung). Down: mẫu về như cũ.
const MAU_CU = '/phong-thuy/huong-hop-tuoi/tuoi-{nam}'
const MAU_MOI = '/phong-thuy/huong-hop-tuoi/{slug}'

async function doiMau(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'] | null, cu: string, moi: string) {
  // Như SEO-K: đồng bộ sổ trang (web deploy trước) có thể đã tạo mẫu NHÁP trống ở đường mới → xoá nháp đó để mẫu cũ
  // (chữ biên tập thật) chuyển sang. Mẫu mới đã xuất bản thì không đụng, chỉ ghi log để Chủ biên gộp tay.
  const coCu = (await db.execute(sql`SELECT 1 FROM "cms"."mau_cum" WHERE "mau_duong" = ${cu}`)).rows.length > 0
  if (!coCu) return
  await db.execute(sql`DELETE FROM "cms"."_mau_cum_v" WHERE "parent_id" IN
    (SELECT id FROM "cms"."mau_cum" WHERE "mau_duong" = ${moi} AND COALESCE("_status"::text, 'draft') = 'draft')`)
  await db.execute(sql`DELETE FROM "cms"."mau_cum" WHERE "mau_duong" = ${moi} AND COALESCE("_status"::text, 'draft') = 'draft'`)
  const r = await db.execute(sql`UPDATE "cms"."mau_cum" SET "mau_duong" = ${moi} WHERE "mau_duong" = ${cu}
    AND NOT EXISTS (SELECT 1 FROM "cms"."mau_cum" b WHERE b."mau_duong" = ${moi}) RETURNING id`)
  if (!r.rows.length) {
    payload?.logger.info(`AUD-Q2 mẫu cụm: ĐÃ có mẫu xuất bản ở ${moi} — giữ nguyên, mẫu ${cu} cần gộp tay`)
    return
  }
  await db.execute(sql`UPDATE "cms"."_mau_cum_v" AS v SET "version_mau_duong" = ${moi} WHERE v."version_mau_duong" = ${cu}
    AND EXISTS (SELECT 1 FROM "cms"."mau_cum" p WHERE p.id = v.parent_id AND p."mau_duong" = ${moi})`)
  payload?.logger.info(`AUD-Q2 mẫu cụm: ${cu} → ${moi}`)
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await doiMau(db, payload, MAU_CU, MAU_MOI)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await doiMau(db, payload, MAU_MOI, MAU_CU)
}
