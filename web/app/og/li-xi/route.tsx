// GET /og/li-xi?khung=ngang|vuong|doc&mau=…&hoa=…&gam=0|1&ma=…&tai=1 — Social Share Studio LÌ XÌ TẾT 2027.
// 3 khổ ảnh PNG chuẩn Social Việt Nam:
//   - ngang: 1200×630 (link preview Facebook / Zalo / Messenger)
//   - vuong: 1080×1080 (bài đăng Facebook / Zalo Feed)
//   - doc:   1080×1920 (Story 9:16 Instagram / Facebook / TikTok / Zalo)
// Nhúng trực tiếp bộ Artwork Tết Đinh Mùi 2027 (3 mẫu Linh Vật Đinh Mùi · Hoa Mai Vàng · Hoa Đào Bích · Nền Gấm Ép Kim 24K)
// nạp sẵn từ đĩa ở module scope (base64 Data URI → tốc độ render cực nhanh, không phụ thuộc mạng ngoài).
// Chống lạm dụng: KHÔNG nhận tên / lời chúc tự do từ query string — mọi chữ cá nhân hoá đọc từ DB theo mã `ma` hợp lệ.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { napPhong } from "@/lib/og-chung";
import { docLiXi } from "@/lib/li-xi-may-chu";
import {
  ANH_NEN_GAM_EP_KIM,
  hoaTietTheoMa,
  hoaTietTuMaBao,
  MA_LI_XI_RE,
  mauThiepTheoMa,
  thongTinHoaTiet,
  type KhungSocial,
} from "@/lib/li-xi-tet";

export const runtime = "nodejs";

const KICH_THUOC: Record<KhungSocial, { width: number; height: number }> = {
  ngang: { width: 1200, height: 630 },
  vuong: { width: 1080, height: 1080 },
  doc: { width: 1080, height: 1920 },
};

/** Cache Data URI cấp module để không đọc lại đĩa ở các request tiếp theo. */
const CACHE_ANH = new Map<string, string>();
function docAnhDataUri(relPublicPath: string | null): string | null {
  if (!relPublicPath) return null;
  const daCo = CACHE_ANH.get(relPublicPath);
  if (daCo) return daCo;
  try {
    const abs = path.join(process.cwd(), "public", relPublicPath.replace(/^\//, ""));
    const buf = readFileSync(abs);
    const uri = `data:image/jpeg;base64,${buf.toString("base64")}`;
    CACHE_ANH.set(relPublicPath, uri);
    return uri;
  } catch {
    return null;
  }
}

function SvgPhaoHoa({ color, size }: { color: string; size: number }) {
  const tia = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {tia.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 60 + Math.cos(rad) * 18;
        const y1 = 60 + Math.sin(rad) * 18;
        const x2 = 60 + Math.cos(rad) * 44;
        const y2 = 60 + Math.sin(rad) * 44;
        const cx = 60 + Math.cos(rad) * 51;
        const cy = 60 + Math.sin(rad) * 51;
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="2.8" fill="#fef08a" />
          </g>
        );
      })}
      <circle cx="60" cy="60" r="6" fill={color} />
    </svg>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const khungRaw = url.searchParams.get("khung") ?? "ngang";
  const khung: KhungSocial = khungRaw === "doc" || khungRaw === "vuong" ? khungRaw : "ngang";
  const tai = url.searchParams.get("tai") === "1";
  const coNenGam = url.searchParams.get("gam") !== "0";

  const d = MA_LI_XI_RE.test(ma) ? await docLiXi(ma) : { co: false };
  const thiep = mauThiepTheoMa(d.co ? d.mau_thiep : url.searchParams.get("mau"));
  const hoaParam = url.searchParams.get("hoa");
  const hoa = hoaParam
    ? hoaTietTheoMa(hoaParam, thiep.ma)
    : d.co
      ? hoaTietTuMaBao(ma, thiep.ma)
      : thiep.hoaMacDinh;
  const ttHoa = thongTinHoaTiet(hoa, thiep.ma);
  const anhHoaUri = docAnhDataUri(ttHoa.anh);
  const anhNenGamUri = coNenGam ? docAnhDataUri(ANH_NEN_GAM_EP_KIM) : null;

  const ten = d.co && d.ten_nguoi_tang ? d.ten_nguoi_tang.trim().slice(0, 40) : "";
  const chuc = (d.co && d.loi_chuc ? d.loi_chuc.trim().slice(0, 140) : "") ||
    "Chúc năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.";

  const { width, height } = KICH_THUOC[khung];
  const doc = khung === "doc";
  const vuong = khung === "vuong";
  const fonts = await napPhong();

  const img = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Sans",
          color: thiep.chu,
          background: `radial-gradient(circle at 22% 24%, ${thiep.nenChinh} 0%, ${thiep.nenPhu} 82%)`,
          padding: doc ? 52 : 40,
        }}
      >
        {/* Lớp nền Gấm Đỏ Son Ép Kim 24K phủ mờ sang trọng */}
        {anhNenGamUri && (
          <img
            src={anhNenGamUri}
            alt=""
            width={width}
            height={height}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.24,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            border: `2.5px solid ${thiep.vien}`,
            borderRadius: 28,
            padding: doc ? "58px 52px" : vuong ? "48px 50px" : "36px 46px",
            position: "relative",
            overflow: "hidden",
            background: "rgba(12, 4, 6, 0.22)",
          }}
        >
          {/* Hàng trên: Nhãn thương hiệu + Con dấu triện ĐINH MÙI 2027 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", fontSize: doc ? 26 : 20, letterSpacing: 6, color: thiep.nhan, fontWeight: 700 }}>
                LÌ XÌ TẾT 2027
              </div>
              <div style={{ display: "flex", fontSize: doc ? 20 : 16, color: thiep.chu, opacity: 0.82 }}>
                Đinh Mùi · Thiên Hà Thuỷ · hieuban.com
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#991b1b",
                border: `2px solid ${thiep.vien}`,
                borderRadius: 12,
                padding: doc ? "12px 20px" : "8px 16px",
                color: "#fef2f2",
              }}
            >
              <div style={{ display: "flex", fontSize: doc ? 20 : 15, fontWeight: 700, letterSpacing: 3 }}>ĐINH MÙI</div>
              <div style={{ display: "flex", fontSize: doc ? 18 : 14, color: "#fde68a", letterSpacing: 4 }}>2027</div>
            </div>
          </div>

          {/* Giữa: Artwork Medallion (Linh Vật Đinh Mùi / Hoa Mai / Hoa Đào / Pháo Hoa) + Lời chúc */}
          <div
            style={{
              display: "flex",
              flexDirection: doc ? "column" : "row",
              alignItems: "center",
              justifyContent: doc ? "center" : "space-between",
              gap: doc ? 44 : 34,
              width: "100%",
            }}
          >
            {doc && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  padding: 20,
                  borderRadius: 32,
                  border: `2.5px solid ${thiep.vien}`,
                  background: "rgba(0,0,0,0.34)",
                }}
              >
                {anhHoaUri ? (
                  <img
                    src={anhHoaUri}
                    alt=""
                    width={420}
                    height={420}
                    style={{ width: 420, height: 420, borderRadius: 22, objectFit: "cover" }}
                  />
                ) : (
                  <SvgPhaoHoa color={thiep.nhan} size={320} />
                )}
                <div style={{ display: "flex", fontSize: 21, color: thiep.nhan, letterSpacing: 3, fontWeight: 700 }}>
                  {ttHoa.nhanSocial}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: doc ? "center" : "flex-start",
                gap: doc ? 26 : 18,
                width: doc ? "100%" : vuong ? 520 : 710,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Serif",
                  fontSize: doc ? 64 : vuong ? 52 : 48,
                  lineHeight: 1.18,
                  color: thiep.chu,
                  textAlign: doc ? "center" : "left",
                }}
              >
                {ten ? `${ten} gửi bạn Bao Lì Xì Tết 2027` : "Mở Bao LÌ XÌ TẾT 2027 của bạn"}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: doc ? 32 : vuong ? 26 : 23,
                  lineHeight: 1.48,
                  color: thiep.chu,
                  opacity: 0.94,
                  textAlign: doc ? "center" : "left",
                }}
              >
                “{chuc}”
              </div>
            </div>

            {!doc && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: vuong ? 18 : 14,
                  borderRadius: 26,
                  border: `2px solid ${thiep.vien}`,
                  background: "rgba(0,0,0,0.34)",
                  width: vuong ? 330 : 276,
                }}
              >
                {anhHoaUri ? (
                  <img
                    src={anhHoaUri}
                    alt=""
                    width={vuong ? 280 : 228}
                    height={vuong ? 280 : 228}
                    style={{
                      width: vuong ? 280 : 228,
                      height: vuong ? 280 : 228,
                      borderRadius: 18,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <SvgPhaoHoa color={thiep.nhan} size={vuong ? 220 : 176} />
                )}
                <div style={{ display: "flex", fontSize: 13, color: thiep.nhan, letterSpacing: 2, fontWeight: 700, textAlign: "center" }}>
                  {ttHoa.nhanSocial}
                </div>
              </div>
            )}
          </div>

          {/* Hàng dưới: Điểm nhấn Báo cáo 2027 + CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: doc ? "column" : "row",
              justifyContent: "space-between",
              alignItems: doc ? "flex-start" : "center",
              gap: doc ? 22 : 16,
              borderTop: `1.5px solid ${thiep.vien}`,
              paddingTop: doc ? 28 : 18,
            }}
          >
            <div style={{ display: "flex", fontSize: doc ? 25 : 19, color: thiep.nhan, lineHeight: 1.4 }}>
              Mở trọn Báo cáo Năm 2027 · Công việc · Tiền bạc · Gia đình · Sức khoẻ · 12 Tháng
            </div>
            <div
              style={{
                display: "flex",
                background: thiep.vien,
                color: thiep.nenPhu,
                fontWeight: 700,
                fontSize: doc ? 27 : 20,
                padding: doc ? "16px 32px" : "11px 24px",
                borderRadius: 999,
              }}
            >
              Mở Lì Xì 2027 →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts,
      headers: {
        "cache-control": d.co
          ? "private, max-age=300"
          : "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        ...(tai ? { "content-disposition": `attachment; filename="li-xi-tet-2027-${khung}.png"` } : {}),
      },
    },
  );
  return img;
}
