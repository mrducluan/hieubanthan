"use client";
// BLOG-7 — đầu danh sách "Bài viết": khung "Chuẩn hoá SEO / GEO bài NotFair" LUÔN hiện với Quản trị/Chủ biên (không phụ
// thuộc việc CMS đọc được NotFair). Đọc bài nguồn NotFair đang có trong CMS:
//  · "Audit — xem trước": máy chấm từng bài, liệt kê sẽ sửa gì + điểm dự kiến, KHÔNG ghi gì.
//  · "Chuẩn hoá": ghi thành BẢN NHÁP "Gửi duyệt" (bản đang trên web không đổi tới khi bấm Xuất bản).
// Mỗi bài một lượt gọi (tuần tự) để không vượt thời gian chạy của hàm máy chủ khi phải vẽ ảnh.
import { useCallback, useEffect, useState } from "react";

type Bai = { id: number | string; tieu_de: string; slug: string; trang_thai: string; duyet: string; diem: number };
type KetQua = { id: number | string; tieu_de: string; slug: string; thay_doi: string[]; diem_truoc: number; diem_sau: number;
  con_lai: string[]; da_ghi: boolean; loi?: string };

const suaUrl = (id: number | string) => `/admin/collections/bai-viet/${id}`;
const NHAN_DUYET: Record<string, string> = { dang_viet: "Đang viết", cho_duyet: "Gửi duyệt", can_sua: "Cần sửa", da_duyet: "Đã duyệt" };

async function goi(id: number | string, ghi: boolean): Promise<KetQua> {
  const r = await fetch("/api/bai-viet/chuan-hoa-notfair", {
    method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ghi }),
  }).catch(() => null);
  const d = (await r?.json().catch(() => null)) as { ok?: boolean; ds?: KetQua[]; loi?: string } | null;
  return d?.ok && d.ds?.[0] ? d.ds[0]
    : { id, tieu_de: "", slug: "", thay_doi: [], diem_truoc: 0, diem_sau: 0, con_lai: [], da_ghi: false, loi: d?.loi ?? "Không kết nối được CMS." };
}

export function ChuanHoaNotFair() {
  const [ds, setDs] = useState<Bai[] | null>(null);
  const [quyen, setQuyen] = useState(true);
  const [kq, setKq] = useState<Record<string, KetQua>>({});
  const [dang, setDang] = useState<string | null>(null);
  const [tb, setTb] = useState<string | null>(null);

  const tai = useCallback(() => {
    void fetch("/api/bai-viet/chuan-hoa-notfair", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 403) { setQuyen(false); return; }
        const d = (await r.json().catch(() => null)) as { ds?: Bai[] } | null;
        setDs(d?.ds ?? []);
      })
      .catch(() => setDs([]));
  }, []);
  useEffect(tai, [tai]);

  async function chay(ghi: boolean, chi?: Bai) {
    const ds_ = chi ? [chi] : (ds ?? []);
    if (!ds_.length) return;
    if (ghi && !chi && !window.confirm(`Chuẩn hoá SEO ${ds_.length} bài NotFair thành BẢN NHÁP "Gửi duyệt"? `
      + "Bản đang hiện trên web không đổi cho tới khi anh/chị đọc lại và bấm Xuất bản từng bài.")) return;
    setTb(null);
    let doi = 0, loi = 0;
    for (const [i, b] of ds_.entries()) {
      setDang(String(b.id));
      setTb(`${ghi ? "Đang chuẩn hoá" : "Đang audit"} ${i + 1}/${ds_.length}: ${b.tieu_de}${ghi ? " (vẽ ảnh có thể mất ~10 giây/bài)" : ""}`);
      const k = await goi(b.id, ghi);
      if (k.loi) loi++; else if (k.thay_doi.length) doi++;
      setKq((cu) => ({ ...cu, [String(b.id)]: k }));
    }
    setDang(null);
    setTb(ghi
      ? `Xong: ${doi} bài có bản nháp chuẩn hoá ("Gửi duyệt"), ${ds_.length - doi - loi} bài đã chuẩn từ trước${loi ? `, ${loi} bài lỗi` : ""}. `
        + "Mở từng bài, đọc \"Ghi chú của Chủ biên\" rồi bấm Xuất bản."
      : `Audit xong: ${doi} bài cần sửa, ${ds_.length - doi - loi} bài đã chuẩn${loi ? `, ${loi} bài lỗi` : ""}. Chưa ghi gì — bấm "Chuẩn hoá" để áp dụng.`);
    if (ghi) tai();
  }

  if (!quyen) return null;
  const nut = "btn btn--size-small";
  return (
    <div data-testid="chuan-hoa-notfair-khung"
      style={{ margin: "0 0 16px", border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: "12px 14px", fontSize: 13 }}>
      <strong style={{ fontSize: 14 }}>Chuẩn hoá SEO / GEO bài NotFair</strong>
      <p style={{ margin: "6px 0 10px", opacity: 0.8, lineHeight: 1.5 }}>
        Máy tự chấm bài nguồn NotFair theo bộ kiểm định (SEO · AI SEO/GEO · E-E-A-T) rồi <b>điền chỗ còn thiếu</b>: đường dẫn
        không dấu (đường dẫn cũ tự chuyển 308), tiêu đề + mô tả SEO, sapo, "Trả lời nhanh" (đoạn AI hay trích), từ khoá,
        mảng, hỏi đáp FAQ, ảnh bìa + ảnh tóm tắt nền sáng, liên kết nội bộ. Không viết lại câu chữ, không xoá link đối tác.
        Kết quả là <b>bản nháp</b> — đọc lại rồi bấm Xuất bản.
      </p>
      {ds === null ? <p>Đang tải…</p> : !ds.length ? (
        <p data-testid="chuan-hoa-trong">Chưa có bài NotFair nào trong CMS — bấm <b>Nhập vào CMS</b> ở khung "Bài trao đổi NotFair" bên dưới trước.</p>
      ) : (
        <>
          <p style={{ margin: "0 0 10px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className={`${nut} btn--style-secondary`} style={{ margin: 0 }} disabled={dang !== null}
              onClick={() => void chay(false)} data-testid="audit-notfair">Audit {ds.length} bài — xem trước, chưa sửa</button>
            <button type="button" className={`${nut} btn--style-primary`} style={{ margin: 0 }} disabled={dang !== null}
              onClick={() => void chay(true)} data-testid="chuan-hoa-notfair">Chuẩn hoá SEO tất cả {ds.length} bài</button>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ textAlign: "left" }}><th>Bài</th><th>Điểm</th><th>Kết quả</th><th /></tr></thead>
            <tbody>
              {ds.map((b) => {
                const k = kq[String(b.id)];
                return (
                  <tr key={String(b.id)} data-testid="chuan-hoa-dong" style={{ borderTop: "1px solid var(--theme-elevation-100)", verticalAlign: "top" }}>
                    <td style={{ padding: "6px 8px 6px 0", maxWidth: 320 }}>
                      <a href={suaUrl(b.id)}>{b.tieu_de || "(chưa có tiêu đề)"}</a>
                      <div style={{ opacity: 0.6 }}>/blog/{k?.slug || b.slug} · {b.trang_thai === "published" ? "đã xuất bản" : "nháp"} · {NHAN_DUYET[b.duyet] ?? b.duyet}</div>
                    </td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }} data-testid="chuan-hoa-diem">
                      {k && !k.loi && k.thay_doi.length ? `${k.diem_truoc} → ${k.diem_sau}${k.da_ghi ? "" : " (dự kiến)"}` : b.diem}
                    </td>
                    <td style={{ padding: "6px 8px" }} data-testid="chuan-hoa-ket-qua">
                      {dang === String(b.id) ? "Đang chạy…" : !k ? <span style={{ opacity: 0.6 }}>Chưa audit</span>
                        : k.loi ? <span role="alert">Lỗi: {k.loi}</span>
                        : (
                          <>
                            <b>{k.thay_doi.length ? (k.da_ghi ? "Đã sửa thành bản nháp:" : "Sẽ sửa:") : "Đã chuẩn — không cần sửa."}</b>
                            {k.thay_doi.length > 0 && <ul style={{ margin: "2px 0 4px 16px" }}>{k.thay_doi.map((t, i) => <li key={i}>{t}</li>)}</ul>}
                            {k.con_lai.length > 0 && (
                              <details><summary>Còn {k.con_lai.length} việc máy không tự làm được</summary>
                                <ul style={{ margin: "2px 0 0 16px" }}>{k.con_lai.map((t, i) => <li key={i}>{t}</li>)}</ul></details>
                            )}
                          </>
                        )}
                    </td>
                    <td style={{ padding: "6px 0", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button type="button" className={`${nut} btn--style-secondary`} style={{ margin: "0 4px 0 0" }} disabled={dang !== null}
                        onClick={() => void chay(false, b)}>Audit</button>
                      <button type="button" className={`${nut} btn--style-primary`} style={{ margin: 0 }} disabled={dang !== null}
                        onClick={() => void chay(true, b)}>Chuẩn hoá</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      {tb && <p role="status" data-testid="chuan-hoa-thong-bao" style={{ marginTop: 8 }}>{tb}</p>}
    </div>
  );
}
