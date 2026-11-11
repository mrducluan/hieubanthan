// GET /og/tom-tat?kieu=…&nam=…[&ns=…][&thang=…][&ngay=…] — SEO-O: ảnh tóm tắt dọc 1080×1350 cho trang năm / lịch âm /
// tuổi / ngày tốt. Ý chính dựng bằng `tomTatAnh` (lib/tom-tat-anh.ts) — CÙNG hàm trang dùng cho alt + chú thích, nên chữ
// trong ảnh khớp alt. Chỉ dữ liệu công khai (năm, ngày, năm sinh) — không dữ liệu cá nhân. Nền giấy sáng (đọc rõ ở
// Google Hình ảnh), mã QR + đường dẫn trang + hieuban.com (docs/THE-CHIA-SE.md).
import { ImageResponse } from "next/og";
import { bam, ChanQr, CO_ANH, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, TEN_MIEN } from "@/lib/the-chia-se";
import { thamSoTuUrl, tomTatAnh } from "@/lib/tom-tat-anh";

export const runtime = "nodejs";

const M = { nen: "linear-gradient(180deg, #fbf7ee 0%, #f4ecda 62%, #ece0c6 100%)", chu: "#241f38", mo2: "#5f5878", vang: "#9a6f1c" };

export async function GET(req: Request) {
  const ts = thamSoTuUrl(new URL(req.url).searchParams);
  const t = ts ? await tomTatAnh(ts) : null;
  const { width: W, height: H } = CO_ANH.doc;
  const fonts = await napPhong();
  const duong = t?.duong ?? "/nam";
  const tieuDe = t?.tieuDe ?? "Lịch & tuổi theo năm — Hiểu Bản Thân";
  const dong = t?.dong.length ? t.dong : ["Năm con gì, mệnh gì", "Tuổi làm nhà, cưới hỏi, xông đất", "Ngày tốt, giờ hoàng đạo"];
  const sao = saoRai(bam(`tt${duong}`), 60, W, 420);
  const coChu = dong.length > 5 || dong.some((s) => s.length > 58) ? 33 : 36;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative",
        background: M.nen, color: M.chu, fontFamily: "Sans", padding: "72px 72px 56px" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={M.vang} fillOpacity={o * 0.35} />)}
        </svg>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: M.vang, textTransform: "uppercase" }}>{t?.nhan ?? "Lịch & tuổi"}</div>
        <div style={{ display: "flex", fontSize: tieuDe.length > 40 ? 58 : 66, marginTop: 18, fontFamily: "Serif", lineHeight: 1.12 }}>{tieuDe}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44, gap: 24 }}>
          {dong.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", fontSize: coChu, lineHeight: 1.3 }}>
              <div style={{ display: "flex", width: 46, height: 46, borderRadius: 23, background: M.vang, color: MAU.giay, fontSize: 26,
                alignItems: "center", justifyContent: "center", marginRight: 22, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
              <div style={{ display: "flex", flex: 1 }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", position: "absolute", left: 72, right: 72, bottom: 56, justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <div style={{ display: "flex", fontSize: 24, color: M.mo2 }}>Xem đầy đủ tại</div>
            <div style={{ display: "flex", fontSize: 26, color: M.chu, marginTop: 6 }}>{`${TEN_MIEN}${duong}`.slice(0, 70)}</div>
          </div>
          <ChanQr url={`${GOC_QR}${duong}`} canh={190} loiMoi="Quét để xem" doc mauChu={M.chu} mauMo={M.mo2} />
        </div>
      </div>
    ),
    {
      width: W, height: H, ...(fonts.length ? { fonts } : {}),
      // Ảnh dự phòng (engine lỗi / tham số lạ) không giữ lâu.
      headers: { "cache-control": t ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" : "no-store" },
    },
  );
}
