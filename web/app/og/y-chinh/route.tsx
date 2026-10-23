// GET /og/y-chinh?loai=…&slug=… — SEO-M: ảnh tóm tắt (infographic dọc 1080×1350) của một trang kiến thức.
// Vẽ từ `y_chinh` engine trả (KB bo_sung_<loai>.json) + tiêu đề trang; mọi ảnh có mã QR + đường dẫn trang + hieuban.com
// (docs/THE-CHIA-SE.md). Chỉ nội dung công khai của trang, không dữ liệu cá nhân. Trang không có ý chính → ảnh mời chung.
import { ImageResponse } from "next/og";
import { bam, ChanQr, CO_ANH, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, TEN_MIEN } from "@/lib/the-chia-se";
import { CHU_DE, CHU_DE_THEO_LOAI, duongTrang, TEN_MANG_SILO, trang, truCua, type LoaiTrang, type TrangKienThuc } from "@/lib/kien-thuc";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const loai = url.searchParams.get("loai") as LoaiTrang | null;
  const slug = url.searchParams.get("slug") ?? "";
  let t: TrangKienThuc | null = null;
  if (loai && loai in CHU_DE_THEO_LOAI && /^[a-z0-9-]{1,80}$/.test(slug)) {
    try { t = await trang(loai, slug); } catch { t = null; }
  }
  const { width: W, height: H } = CO_ANH.doc;
  const fonts = await napPhong();
  const duong = t ? duongTrang(t.loai, t.slug) : "/kien-thuc";
  const qr = `${GOC_QR}${duong}`;
  const cum = t ? CHU_DE[CHU_DE_THEO_LOAI[t.loai]] : undefined;
  const mang = cum ? (TEN_MANG_SILO[truCua(cum.duong)] ?? "Kiến thức") : "Kiến thức";
  const y = (t?.y_chinh ?? []).slice(0, 5);
  const tieuDe = (t?.tieu_de ?? "Thư viện kiến thức Hiểu Bản Thân").split(" — ")[0] ?? "";
  const sao = saoRai(bam(`yc${duong}`), 70, W, 420);

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative",
        background: "linear-gradient(180deg, #0a0a17 0%, #15132e 60%, #1f1838 100%)", color: MAU.chu, fontFamily: "Sans",
        padding: "72px 72px 56px",
      }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, yy, r, o], i) => <circle key={i} cx={x} cy={yy} r={r} fill={MAU.chu} fillOpacity={o * 0.7} />)}
        </svg>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: MAU.vang, textTransform: "uppercase" }}>{mang}</div>
        <div style={{ display: "flex", fontSize: tieuDe.length > 48 ? 58 : 68, marginTop: 18, fontFamily: "Serif", lineHeight: 1.12 }}>{tieuDe}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44, gap: 26 }}>
          {(y.length ? y : ["Ý nghĩa, cách tính và ví dụ đọc", "Bảng tra nhanh", "Câu hỏi thường gặp"]).map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", fontSize: 36, lineHeight: 1.3, color: MAU.chu }}>
              <div style={{ display: "flex", width: 46, height: 46, borderRadius: 23, background: MAU.vang, color: MAU.nen, fontSize: 26,
                alignItems: "center", justifyContent: "center", marginRight: 22, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
              <div style={{ display: "flex", flex: 1 }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", position: "absolute", left: 72, right: 72, bottom: 56, justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <div style={{ display: "flex", fontSize: 24, color: MAU.mo2 }}>Đọc đầy đủ tại</div>
            <div style={{ display: "flex", fontSize: 26, color: MAU.chu, marginTop: 6 }}>{`${TEN_MIEN}${duong}`.slice(0, 70)}</div>
          </div>
          <ChanQr url={qr} canh={190} loiMoi="Quét để đọc bài" doc />
        </div>
      </div>
    ),
    {
      width: W, height: H, ...(fonts.length ? { fonts } : {}),
      // Mặc định ImageResponse cache 1 năm "immutable" — ảnh dự phòng (engine lỗi / lệch deploy) không được giữ lâu.
      headers: { "cache-control": t ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" : "no-store" },
    },
  );
}
