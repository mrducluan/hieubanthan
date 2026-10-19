import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// QH-URL (phương án B) — chỉ đổi DỮ LIỆU, không đổi bảng: chuyển ô đường dẫn của "Trang website" (duong) và "Mẫu cụm
// trang" (mau_duong) — bảng chính + mọi phiên bản — từ URL cũ sang URL silo, để chữ/ảnh/SEO đã sửa trong CMS đi theo
// trang mới thay vì bị đồng bộ sổ trang đánh dấu "không còn trên web" rồi đẻ nháp trống. Bảng ánh xạ chép cứng từ
// web/lib/chuyen-huong.json lúc viết (migration phải bất biến). Đường dẫn đích đã có tài liệu (đồng bộ chạy trước
// migration) → bỏ qua dòng đó (không đè), ghi log để Chủ biên gộp tay.
const DOI: [string, string][] = [
  ['/kien-thuc/than-so', '/than-so/y-nghia-so'],
  ['/kien-thuc/nghe-nghiep', '/than-so/nghe-nghiep'],
  ['/kien-thuc/tinh-yeu', '/than-so/tinh-yeu'],
  ['/kien-thuc/nam-ca-nhan', '/than-so/nam-ca-nhan'],
  ['/kien-thuc/no-nghiep', '/than-so/no-nghiep'],
  ['/kien-thuc/so-kep', '/than-so/so-kep'],
  ['/kien-thuc/hop-so', '/hop-doi/cap-so'],
  ['/kien-thuc/tu-vi', '/tu-vi/chinh-tinh'],
  ['/kien-thuc/cung-tu-vi', '/tu-vi/cung'],
  ['/kien-thuc/sao-cung', '/tu-vi/sao-o-cung'],
  ['/kien-thuc/tu-hoa', '/tu-vi/tu-hoa'],
  ['/kien-thuc/thap-than', '/bat-tu/thap-than'],
  ['/kien-thuc/nhat-chu', '/bat-tu/nhat-chu'],
  ['/kien-thuc/menh-tuoi', '/bat-tu/menh-theo-nam'],
  ['/kien-thuc/kinh-dich', '/kinh-dich/que'],
  ['/la-so-mau', '/tu-vi/la-so-mau'],
  ['/huong-xau-nam', '/phong-thuy/huong-xau-nam'],
  ['/phong-thuy/tuoi-', '/phong-thuy/huong-hop-tuoi/tuoi-'], // tiền tố trang tuổi (cả mẫu /phong-thuy/tuoi-{nam}-{gioi})
]

const BANG = [
  ['noi_dung_trang', '_noi_dung_trang_v', 'duong', 'version_duong'],
  ['mau_cum', '_mau_cum_v', 'mau_duong', 'version_mau_duong'],
] as const

async function doi(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload'], cap: [string, string][]) {
  for (const [cu, moi] of cap) {
    const tienTo = cu.endsWith('-')
    for (const [chinh, phienBan, cot, cotV] of BANG) {
      const t = sql.raw(`"cms"."${chinh}"`), tv = sql.raw(`"cms"."${phienBan}"`)
      const c = sql.raw(`"${cot}"`), cv = sql.raw(`"${cotV}"`)
      // Khớp: đúng đường cũ, hoặc đường con "{cũ}/…"; với tiền tố trang tuổi: bắt đầu bằng "{cũ}".
      const khop = (col: typeof c) =>
        tienTo ? sql`${col} LIKE ${cu + '%'}` : sql`(${col} = ${cu} OR ${col} LIKE ${cu + '/%'})`
      const dich = (col: typeof c) => sql`${moi} || substr(${col}, ${cu.length + 1})`
      const r = await db.execute(sql`
        UPDATE ${t} AS a SET ${c} = ${dich(c)}
        WHERE ${khop(c)} AND NOT EXISTS (SELECT 1 FROM ${t} b WHERE b.${c} = ${dich(sql.raw(`a."${cot}"`))})
        RETURNING a.id`)
      await db.execute(sql`
        UPDATE ${tv} AS v SET ${cv} = ${dich(cv)}
        WHERE ${khop(cv)} AND EXISTS (SELECT 1 FROM ${t} p WHERE p.id = v.parent_id AND p.${c} = ${dich(sql.raw(`v."${cotV}"`))})`)
      const conLai = await db.execute(sql`SELECT ${c} AS d FROM ${t} WHERE ${khop(c)}`)
      const n = r.rows.length
      const sot = conLai.rows.map((x) => String(x.d))
      if (n || sot.length) payload.logger.info(`QH-URL ${chinh}: ${cu} → ${moi}: đổi ${n}${sot.length ? `, TRÙNG đích bỏ qua: ${sot.join(', ')}` : ''}`)
    }
  }
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await doi(db, payload, DOI)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  // Đảo ánh xạ; trang tuổi đi trước để không bị quy tắc khác bắt nhầm.
  await doi(db, payload, DOI.map(([cu, moi]) => [moi, cu] as [string, string]).reverse())
}
