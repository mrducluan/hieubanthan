// GET /og?ma=…[&kieu=moi][&khung=doc] — ảnh thẻ chia sẻ (OG + tải về). Dữ liệu CHỈ từ mã đã ký.
// TCS-1: mỗi loại một concept, mọi ảnh có mã QR + chữ hieuban.com (docs/THE-CHIA-SE.md):
//   · thẻ hồ sơ   — "vòng số": chín điểm 1–9 trên vòng, bốn con số của bạn nối thành chòm sao riêng;
//   · lời mời     — "hai quỹ đạo": quỹ đạo người mời (có số) đan với quỹ đạo còn dấu "?";
//   · kiến thức   — ?tieu_de=…: "trang sách dưới trời sao" (chữ công khai, không dữ liệu cá nhân).
// Font Be Vietnam Pro / Newsreader (OFL, assets/fonts) để có đủ dấu tiếng Việt.
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { docMa, tuTuMa, type NoiDungMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";

export const runtime = "nodejs";

const TEN = ["Đường đời", "Sứ mệnh", "Linh hồn", "Nhân cách"];
const goc = (s: number) => (s > 9 ? String(s).split("").reduce((a, c) => a + Number(c), 0) : s);   // 11→2, 22→4, 33→6 (vị trí trên vòng)

/** Vòng chín số + chòm sao nối bốn con số (theo thứ tự Đường đời → Sứ mệnh → Linh hồn → Nhân cách). */
function VongSo({ cx, cy, r, so }: { cx: number; cy: number; r: number; so: number[] }) {
  const diem = (n: number) => {
    const g = -Math.PI / 2 + (2 * Math.PI * (n - 1)) / 9;
    return [cx + r * Math.cos(g), cy + r * Math.sin(g)] as const;
  };
  const co = new Set(so.map(goc));
  const p = so.map((s) => diem(goc(s)));
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={MAU.vang} strokeOpacity="0.22" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r + 44} fill="none" stroke={MAU.trang} strokeOpacity="0.14" strokeWidth="2" strokeDasharray="4 14" />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={MAU.trang} strokeOpacity="0.1" strokeWidth="1.5" />
      {p.length > 1 && <polygon points={p.map(([x, y]) => `${x},${y}`).join(" ")} fill={MAU.vang} fillOpacity="0.07" stroke={MAU.vang} strokeOpacity="0.8" strokeWidth="2.5" strokeLinejoin="round" />}
      {Array.from({ length: 9 }, (_, i) => {
        const [x, y] = diem(i + 1);
        const sang = co.has(i + 1);
        return <circle key={i} cx={x} cy={y} r={sang ? 13 : 6} fill={sang ? MAU.vang : MAU.chu} fillOpacity={sang ? 1 : 0.5} />;
      })}
    </g>
  );
}

function NhanVong({ cx, cy, r, co }: { cx: number; cy: number; r: number; co: number }) {
  return Array.from({ length: 9 }, (_, i) => {
    const g = -Math.PI / 2 + (2 * Math.PI * i) / 9;
    const x = cx + (r + co * 1.25) * Math.cos(g), y = cy + (r + co * 1.25) * Math.sin(g);
    return (
      <div key={i} style={{ display: "flex", position: "absolute", left: x - co, top: y - co * 0.7, width: co * 2, justifyContent: "center", fontSize: co, color: MAU.mo2, fontFamily: "Serif" }}>
        {String(i + 1)}
      </div>
    );
  });
}

function TheHoSo({ nd, doc, qr, W, H }: { nd: NoiDungMa; doc: boolean; qr: string; W: number; H: number }) {
  const sao = saoRai(bam(nd.t + nd.so.join()), doc ? 80 : 60, W, H);
  const v = doc ? { cx: 540, cy: 505, r: 232 } : { cx: 900, cy: 262, r: 168 };
  const chips = (
    <div style={{ display: "flex", gap: doc ? 22 : 16 }}>
      {nd.so.map((s, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: doc ? "14px 26px" : "10px 18px", borderRadius: 18, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(233,196,106,0.18)" }}>
          <div style={{ display: "flex", fontSize: doc ? 50 : 38, color: MAU.vang, fontFamily: "Serif", lineHeight: 1.1 }}>{String(s)}</div>
          <div style={{ display: "flex", fontSize: doc ? 20 : 15, color: MAU.mo }}>{TEN[i]}</div>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: `radial-gradient(circle at ${Math.round((v.cx / W) * 100)}% ${Math.round((v.cy / H) * 100)}%, #2a2350 0%, ${MAU.nen} 60%)`, color: MAU.chu, fontFamily: "Sans" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
        {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
        {VongSo({ cx: v.cx, cy: v.cy, r: v.r, so: nd.so })}
      </svg>
      {NhanVong({ cx: v.cx, cy: v.cy, r: v.r, co: doc ? 30 : 22 })}
      {doc ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", top: 0, left: 0, width: W, height: H }}>
          <div style={{ display: "flex", marginTop: 64, fontSize: 28, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Hồ sơ bản thân</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 52, fontFamily: "Serif" }}>{nd.t}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", top: v.cy - 120, left: 0, width: W }}>
            <div style={{ display: "flex", fontSize: 190, lineHeight: 1, color: MAU.vang, fontFamily: "Serif" }}>{String(nd.so[0])}</div>
            <div style={{ display: "flex", fontSize: 24, color: MAU.mo2 }}>Đường đời</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", top: 832, left: 0, width: W }}>
            {nd.k && <div style={{ display: "flex", fontSize: 44, fontFamily: "Serif", marginBottom: 26, maxWidth: 940, textAlign: "center" }}>{nd.k}</div>}
            {chips}
          </div>
          <div style={{ display: "flex", position: "absolute", top: 1050, left: 0, width: W, justifyContent: "center" }}>
            <ChanQr url={qr} canh={190} loiMoi="Quét để xem con số của bạn" doc />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", top: 54, left: 70, width: 600 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Hồ sơ bản thân</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 46, fontFamily: "Serif" }}>{nd.t}</div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 6 }}>
            <div style={{ display: "flex", fontSize: 168, lineHeight: 1, color: MAU.vang, fontFamily: "Serif" }}>{String(nd.so[0])}</div>
            <div style={{ display: "flex", fontSize: 22, color: MAU.mo2, marginLeft: 16, marginBottom: 26 }}>Đường đời</div>
          </div>
          {nd.k && <div style={{ display: "flex", fontSize: 32, fontFamily: "Serif", marginTop: 2, marginBottom: 22 }}>{nd.k}</div>}
          {chips}
        </div>
      )}
      {!doc && (
        <div style={{ display: "flex", position: "absolute", top: H - 24 - 128, left: 70, width: W - 70 - 32, justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 18, color: MAU.mo }}>Hiểu Bản Thân · thần số học</div>
          <ChanQr url={qr} canh={128} loiMoi="Quét để xem con số của bạn" />
        </div>
      )}
    </div>
  );
}

/** Lời mời hợp đôi: hai quỹ đạo đan nhau — một có con số người mời, một còn dấu "?". */
function TheMoi({ nd, qr, W, H }: { nd: NoiDungMa; qr: string; W: number; H: number }) {
  const sao = saoRai(bam(`moi${nd.t}`), 60, W, H);
  const cx = 900, cy = 280;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: `radial-gradient(circle at 72% 44%, #2b2152 0%, ${MAU.nen} 60%)`, color: MAU.chu, fontFamily: "Sans" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
        {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
        <ellipse cx={cx - 70} cy={cy} rx="180" ry="104" fill="none" stroke={MAU.vang} strokeOpacity="0.7" strokeWidth="2.5" transform={`rotate(-18 ${cx - 70} ${cy})`} />
        <ellipse cx={cx + 70} cy={cy} rx="180" ry="104" fill="none" stroke={MAU.trang} strokeOpacity="0.7" strokeWidth="2.5" strokeDasharray="6 10" transform={`rotate(18 ${cx + 70} ${cy})`} />
        <circle cx={cx} cy={cy} r="10" fill={MAU.chu} fillOpacity="0.9" />
        <circle cx={cx - 215} cy={cy + 60} r="46" fill="#3a2f12" stroke={MAU.vang} strokeWidth="3" />
        <circle cx={cx + 215} cy={cy + 60} r="46" fill="#241d4a" stroke={MAU.trang} strokeWidth="3" />
      </svg>
      <div style={{ display: "flex", position: "absolute", left: cx - 215 - 46, top: cy + 60 - 34, width: 92, justifyContent: "center", fontSize: 52, fontFamily: "Serif", color: MAU.vang }}>{String(nd.so[0])}</div>
      <div style={{ display: "flex", position: "absolute", left: cx + 215 - 46, top: cy + 60 - 34, width: 92, justifyContent: "center", fontSize: 52, fontFamily: "Serif", color: MAU.trang }}>?</div>
      <div style={{ display: "flex", flexDirection: "column", position: "absolute", top: 70, left: 70, width: 520 }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Lời mời hợp đôi</div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 52, lineHeight: 1.15, fontFamily: "Serif" }}>{`${nd.t} mời bạn xem hai người`}</div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 26, color: MAU.mo2 }}>{`Đường đời của ${nd.t}: ${nd.so[0]}${nd.k ? ` — ${nd.k}` : ""}`}</div>
        <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: MAU.vang, fontFamily: "Serif" }}>Con số của bạn hoà ở đâu, khác ở đâu?</div>
      </div>
      <div style={{ display: "flex", position: "absolute", top: H - 24 - 128, left: 70, width: W - 70 - 32, justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", fontSize: 18, color: MAU.mo }}>Hiểu Bản Thân · hợp đôi thần số, không chấm điểm</div>
        <ChanQr url={qr} canh={128} loiMoi="Quét để nhận lời mời" />
      </div>
    </div>
  );
}

/** Trang kiến thức / mặc định: trang sách mở dưới trời sao. */
function TheKienThuc({ tieuDe, qr, W, H }: { tieuDe: string; qr: string; W: number; H: number }) {
  const sao = saoRai(bam(tieuDe || "hbt"), 70, W, H);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: `radial-gradient(circle at 50% 0%, #2a2350 0%, ${MAU.nen} 60%)`, color: MAU.chu, fontFamily: "Sans" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
        {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
        {/* trang sách mở */}
        <path d="M600 350 C 500 310, 330 310, 210 342 L 210 440 C 330 408, 500 408, 600 448 Z" fill="rgba(233,196,106,0.06)" stroke={MAU.vang} strokeOpacity="0.45" strokeWidth="2" />
        <path d="M600 350 C 700 310, 870 310, 990 342 L 990 440 C 870 408, 700 408, 600 448 Z" fill="rgba(185,167,255,0.05)" stroke={MAU.trang} strokeOpacity="0.4" strokeWidth="2" />
        <line x1="600" y1="350" x2="600" y2="448" stroke={MAU.vang} strokeOpacity="0.5" strokeWidth="2" />
        <circle cx="600" cy="320" r="5" fill={MAU.vang} />
        <circle cx="520" cy="282" r="3" fill={MAU.chu} fillOpacity="0.8" />
        <circle cx="690" cy="276" r="3.5" fill={MAU.chu} fillOpacity="0.8" />
        <polyline points="520,282 600,320 690,276" fill="none" stroke={MAU.vang} strokeOpacity="0.5" strokeWidth="1.5" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", top: 70, left: 100, width: W - 200 }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>{tieuDe ? "Thư viện kiến thức" : "Hiểu Bản Thân"}</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: tieuDe.length > 60 ? 50 : 60, fontFamily: "Serif", textAlign: "center", lineHeight: 1.2, justifyContent: "center" }}>
          {tieuDe || "Bạn là số mấy?"}
        </div>
      </div>
      <div style={{ display: "flex", position: "absolute", top: H - 24 - 112, left: 40, width: W - 40 - 32, justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", fontSize: 18, color: MAU.mo }}>Thần số học · Tử vi · Bát tự · Kinh Dịch · Phong thuỷ</div>
        <ChanQr url={qr} canh={112} loiMoi="Quét để đọc tiếp" />
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMa(ma);
  const moi = url.searchParams.get("kieu") === "moi";
  // Trang kiến thức: ảnh chia sẻ mang tiêu đề bài (chữ công khai, không có dữ liệu cá nhân).
  const tieuDe = (url.searchParams.get("tieu_de") ?? "").slice(0, 110);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const fonts = await napPhong();

  let anh: ReactElement;
  let co = CO_ANH.ngang;
  if (nd && moi) {
    // Mã lời mời dài (tên + từ khoá) → QR thường không vừa; dự phòng: trang hợp đôi + ?tu= (vẫn gán nguồn).
    const tu = tuTuMa("hd", ma);
    anh = <TheMoi nd={nd} qr={urlQr(`${GOC_QR}/hop-doi/${ma}?tu=${tu}`, `${GOC_QR}/hop-doi?tu=${tu}`)} W={co.width} H={co.height} />;
  } else if (nd) {
    co = CO_ANH[khung];
    const tu = tuTuMa("th", ma);
    // Người quét đã thấy thẻ trên ảnh → dẫn thẳng tới bước kế tiếp (tự xem con số) khi mã thẻ quá dài cho QR thưa.
    anh = <TheHoSo nd={nd} doc={khung === "doc"} qr={urlQr(`${GOC_QR}/the/${ma}?tu=${tu}`, `${GOC_QR}/?tu=${tu}`)} W={co.width} H={co.height} />;
  } else {
    anh = <TheKienThuc tieuDe={tieuDe} qr={GOC_QR} W={co.width} H={co.height} />;
  }
  return new ImageResponse(anh, { ...co, ...(fonts.length ? { fonts } : {}) });
}
