import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// FOOTER-1 (chủ dự án báo 2026-11-22: chân trang thiếu các mảng Huyền học). Bản chân trang ở CMS đã được sửa tay trước KM-3
// (cột "Huyền học" còn 6 mục, lời giới thiệu "Bảy hệ thống…" thiếu Kỳ Môn) nên migration KM-3 thấy "đã sửa tay" và bỏ qua.
// Migration này BỔ SUNG chứ không thay: liên kết đã có giữ nguyên nhãn (biên tập có thể đã đổi chữ); liên kết mặc định còn
// thiếu được thêm vào; cột "Huyền học" xếp lại theo thứ tự mặc định (8 mảng trước, công cụ ngày / năm sau), liên kết biên tập
// tự thêm (không có trong mặc định) đứng cuối. Mỗi cột ≤ 15 liên kết (trần CMS) — thiếu chỗ thì ưu tiên theo thứ tự mặc định.
// Liên kết thêm mới có id tiền tố "ft1-" để down xoá đúng chúng. Lời giới thiệu chỉ thay khi còn ĐÚNG câu "Bảy hệ thống…".
type DS = [string, string][]

const HH: DS = [
  ['/than-so', 'Thần số học'], ['/tu-vi', 'Tử vi'], ['/bat-tu', 'Bát tự'], ['/kinh-dich', 'Kinh Dịch'],
  ['/phong-thuy', 'Phong thuỷ'], ['/nhan-tuong', 'Nhân tướng học'], ['/tarot', 'Tarot'], ['/ky-mon', 'Kỳ Môn Độn Giáp'],
  ['/hop-doi', 'Hợp đôi'], ['/huyen-hoc', 'Tất cả các mảng'],
  ['/hom-nay', 'Hôm nay của bạn'], ['/thoi-gian-toi', 'Thời gian tới của bạn'], ['/nam', 'Xem theo năm'],
  ['/xem-ngay-tot', 'Xem ngày tốt'], ['/xem-tuoi-lam-nha', 'Tuổi làm nhà, cưới hỏi'],
]
// "Về chúng tôi": chỉ thêm (cuối cột) hai trang đang thiếu ở bản CMS — /tac-gia là trang E-E-A-T (đội ngũ biên soạn).
const VE: DS = [['/tac-gia', 'Đội ngũ biên soạn'], ['/ban-do-doi-ngu', 'Bản đồ đội ngũ (Chủ DN)']]

const GT_CU = 'Bảy hệ thống văn hoá — Thần số học, Tử vi, Bát tự, Nhân Tướng, Bài Tarot, Kinh Dịch, Phong thuỷ — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi và chiêm nghiệm.'
const GT_MOI = 'Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Kỳ Môn — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.'

type Db = MigrateUpArgs['db']
type Log = MigrateUpArgs['payload'] | undefined
type Dong = { id: string; duong_dan: string | null; loai: string }

const docCot = async (db: Db, id: string) => (await db.execute(sql`SELECT id, "duong_dan", COALESCE("loai"::text, 'duong_dan') AS loai
  FROM "cms"."dieu_huong_cot_lien_ket" WHERE "_parent_id" = ${id} ORDER BY "_order"`)).rows as Dong[]

const them = (db: Db, cha: string, thu: number, [duong, nhan]: [string, string]) => db.execute(sql`INSERT INTO "cms"."dieu_huong_cot_lien_ket"
  ("_order", "_parent_id", "id", "nhan", "loai", "duong_dan")
  VALUES (${thu}, ${cha}, ${'ft1-' + Math.random().toString(36).slice(2) + Date.now().toString(36)}, ${nhan}, 'duong_dan', ${duong})`)

async function boSungHuyenHoc(db: Db, log: Log) {
  const cot = await db.execute(sql`SELECT id FROM "cms"."dieu_huong_cot" WHERE "ten" = 'Huyền học'`)
  for (const { id } of cot.rows as { id: string }[]) {
    const ds = await docCot(db, id)
    const co = new Map(ds.filter((d) => d.loai === 'duong_dan' && d.duong_dan).map((d) => [d.duong_dan!, d]))
    const ngoai = ds.filter((d) => !(d.loai === 'duong_dan' && d.duong_dan && HH.some(([h]) => h === d.duong_dan)))
    const choTrong = 15 - ds.length
    const thieu = HH.filter(([h]) => !co.has(h)).slice(0, Math.max(0, choTrong))
    const dua = new Set(thieu.map(([h]) => h))
    let thu = 1, so = 0
    for (const m of HH) {
      const d = co.get(m[0])
      if (d) await db.execute(sql`UPDATE "cms"."dieu_huong_cot_lien_ket" SET "_order" = ${thu++} WHERE id = ${d.id}`)
      else if (dua.has(m[0])) { await them(db, id, thu++, m); so++ }
    }
    for (const d of ngoai) await db.execute(sql`UPDATE "cms"."dieu_huong_cot_lien_ket" SET "_order" = ${thu++} WHERE id = ${d.id}`)
    log?.logger.info(`FOOTER-1: cột "Huyền học" thêm ${so} liên kết (còn thiếu ${HH.length - co.size - so})`)
  }
}

async function boSungVe(db: Db, log: Log) {
  const cot = await db.execute(sql`SELECT id FROM "cms"."dieu_huong_cot" WHERE "ten" = 'Về chúng tôi'`)
  for (const { id } of cot.rows as { id: string }[]) {
    const ds = await docCot(db, id)
    let thu = ds.length + 1, so = 0
    for (const m of VE) {
      if (ds.some((d) => d.duong_dan === m[0]) || thu > 15) continue
      await them(db, id, thu++, m); so++
    }
    log?.logger.info(`FOOTER-1: cột "Về chúng tôi" thêm ${so} liên kết`)
  }
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await boSungHuyenHoc(db, payload)
  await boSungVe(db, payload)
  await db.execute(sql`UPDATE "cms"."dieu_huong" SET "thuong_hieu_gioi_thieu" = ${GT_MOI} WHERE "thuong_hieu_gioi_thieu" = ${GT_CU}`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DELETE FROM "cms"."dieu_huong_cot_lien_ket" WHERE id LIKE 'ft1-%'`)
  // Thứ tự các dòng cũ của cột "Huyền học" không trả lại (chỉ là thứ tự hiển thị, nhãn / đường dẫn không đổi).
}
