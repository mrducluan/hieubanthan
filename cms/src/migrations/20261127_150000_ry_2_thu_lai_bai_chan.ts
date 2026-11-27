import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { thuLaiBaiRankYakBiChan } from '../lib/rankyak'

// RY-2 — chỉ DỮ LIỆU, không đổi bảng. Bộ kiểm định bài từng báo nhầm "trùng số chủ đạo" là cụm cấm "trúng số" (chuẩn hoá dấu
// bỏ hết dấu thanh của a/e/o/u/y) và "bắt bạn mua vật phẩm giải hạn" (lời cảnh báo) là "mua vật phẩm" → 2 bài RankYak
// ("Tên thần số học…", "Lá số tử vi: lập miễn phí…") kẹt ở bản nháp dù RankYak ghi "Published". Sau khi sửa bộ kiểm định, chấm lại
// các nháp RankYak từng bị "lỗi chặn" và tự xuất bản bài đạt điểm (không nhập lại chữ). Bài còn lỗi thật (vd có số điện thoại,
// Zalo) giữ nháp. Lỗi bất kỳ chỉ ghi log — không chặn deploy.
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  try {
    const kq = await thuLaiBaiRankYakBiChan(payload)
    for (const b of kq) {
      payload.logger.info(`RY-2: ${b.slug || b.rankyak_id} — ${b.loi ? `lỗi: ${b.loi}` : b.xuat_ban ? `xuất bản (${b.diem} điểm)` : `giữ nháp: ${b.ly_do ?? ''}`}`)
    }
    payload.logger.info(`RY-2: chấm lại ${kq.length} bài RankYak, xuất bản ${kq.filter((b) => b.xuat_ban).length}`)
  } catch (e) {
    payload.logger.error(`RY-2: chưa xử lý được — ${(e as Error)?.message ?? e}`)
  }
}

// Bài đã xuất bản không tự gỡ — dùng "Bỏ xuất bản" trong CMS nếu cần.
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('RY-2: không tự gỡ bài — dùng "Bỏ xuất bản" trong CMS nếu cần.')
}
