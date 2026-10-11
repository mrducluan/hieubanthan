// Đầu bảng điều khiển: số bài theo trạng thái, điểm kiểm định trung bình, bài cần sửa — để biết hôm nay làm gì trước.
import type { Payload } from "payload";
import { webUrl } from "../lib/web";

type Bai = { id: number | string; tieu_de?: string; diem_kiem_dinh?: number | null; _status?: string; slug?: string };

export async function TongQuan({ payload }: { payload: Payload }) {
  const [xb, nhap, thap] = await Promise.all([
    payload.count({ collection: "bai-viet", where: { _status: { equals: "published" } }, overrideAccess: true }),
    payload.count({ collection: "bai-viet", where: { _status: { equals: "draft" } }, overrideAccess: true }),
    payload.find({
      collection: "bai-viet", overrideAccess: true, limit: 6, depth: 0, sort: "diem_kiem_dinh",
      where: { diem_kiem_dinh: { less_than: 70 } },
      select: { tieu_de: true, diem_kiem_dinh: true, _status: true, slug: true },
    }),
  ]);
  const tb = await payload.find({
    collection: "bai-viet", overrideAccess: true, limit: 200, depth: 0, pagination: false,
    select: { diem_kiem_dinh: true },
  });
  const diem = tb.docs.map((d) => (d as Bai).diem_kiem_dinh).filter((d): d is number => typeof d === "number");
  const trungBinh = diem.length ? Math.round(diem.reduce((a, b) => a + b, 0) / diem.length) : null;

  const o = (nhan: string, so: string | number, href?: string) => (
    <a className="hbt-tq-o" href={href ?? "#"} data-testid={`tq-${nhan}`}>
      <span className="hbt-tq-so">{so}</span><span>{nhan}</span>
    </a>
  );
  return (
    <section className="hbt-tq" aria-label="Tổng quan phòng biên tập">
      <h2 className="hbt-tq-tieu-de">Phòng biên tập</h2>
      <p className="hbt-tq-phu">
        Bài xuất bản hiện ở <a href={`${webUrl()}/blog`} target="_blank" rel="noreferrer">{webUrl().replace(/^https?:\/\//, "")}/blog</a>.
        Biên tập viên lưu nháp → Chủ biên bấm <b>Xuất bản</b>. Khung <b>Kiểm định</b> bên phải mỗi bài chấm SEO, GEO, E-E-A-T khi gõ.
      </p>
      <div className="hbt-tq-luoi">
        {o("đã xuất bản", xb.totalDocs, "/admin/collections/bai-viet?where[_status][equals]=published")}
        {o("bản nháp", nhap.totalDocs, "/admin/collections/bai-viet?where[_status][equals]=draft")}
        {o("điểm trung bình", trungBinh ?? "—")}
        <a className="hbt-tq-o hbt-tq-moi" href="/admin/collections/bai-viet/create" data-testid="tq-viet-moi">
          <span className="hbt-tq-so">+</span><span>Viết bài mới</span>
        </a>
      </div>
      {thap.docs.length > 0 && (
        <div className="hbt-tq-can-sua">
          <p><b>Nên sửa trước</b> (điểm kiểm định dưới 70):</p>
          <ul>
            {(thap.docs as Bai[]).map((b) => (
              <li key={b.id}>
                <a href={`/admin/collections/bai-viet/${b.id}`}>{b.tieu_de || "(chưa có tiêu đề)"}</a>
                <span> — {b.diem_kiem_dinh}/100 · {b._status === "published" ? "đang xuất bản" : "nháp"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
