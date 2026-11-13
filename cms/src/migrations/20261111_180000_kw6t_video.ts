import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { ganVideoKw6t } from '../bai-khoi-tao/video-kw6t'

// KW-6T ý 3 (chủ dự án gửi 8 link Shorts 2026-11-11) — chỉ DỮ LIỆU, không đổi bảng: gắn khối "Video YouTube" vào 8 bài
// tuần 1–2, ngay sau đoạn mở đầu, rồi xuất bản lại (bài đang có bản nháp mới hơn → chỉ gắn vào nháp). Lỗi chỉ ghi log.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const kq = await ganVideoKw6t(payload, req)
    payload.logger.info(`KW-6T video: gắn ${kq.gan.length} bài${kq.gan.length ? `: ${kq.gan.join(', ')}` : ''}${kq.bo_qua.length ? ` · bỏ qua: ${kq.bo_qua.join(', ')}` : ''}`)
  } catch (e) {
    payload.logger.error(`KW-6T video: chưa gắn được — ${(e as Error)?.message ?? e}`)
  }
}

// Down: không gỡ — video là nội dung bài đã xuất bản (Chủ biên gỡ tay trong CMS nếu cần).
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('KW-6T video: down không gỡ khối video (gỡ tay trong CMS nếu cần).')
}
