// /goi-xem — bảng giá + lối vào các "gói xem" theo NHU CẦU (GIA-99, docs/GOI-XEM-VA-GIA-2026-11.md; khâu NẠP).
// Phương án B: gói nằm ngay trong trang công cụ của từng mảng (cổng Sao tại chỗ), trang này là MỘT nơi đặt lẻ ↔ gói ↔ hội
// viên cạnh nhau. Mọi con số đọc từ đúng nguồn máy chủ dùng khi trừ Sao / tạo đơn (cau_hinh, goi_sao). Báo cáo nào chưa thu
// Sao thì ghi "Đang miễn phí", không bày giá (UX-NM). Không gạch giá, không đếm ngược, không so với đơn vị khác (Luật QC).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { ArrowRight, Check, Gift, Sparkles } from "lucide-react";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { JsonLd } from "@/components/seo/JsonLd";
import { layCauHinh } from "@/lib/cau-hinh";
import { GOI_XEM, baCachTra, mocHoiVien } from "@/lib/goi-xem";
import { dangThuSao, giaLuanGiaiSao } from "@/lib/luan-giai-sao";
import { soBanCanMoi } from "@/lib/loi-sao";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb } from "@/lib/seo";
import { congDangBat, dsGoiSao } from "@/lib/thanh-toan/cong";
import { tietKiemPhanTram } from "@/lib/thanh-toan/nap-dau";

const DUONG = "/goi-xem";
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const so = <T,>(k: string, md: T) => layCauHinh<T>(k).catch(() => md);
  const [nd, goi, giaChung, mienPhi, chaoMung, moiBan, duocMoi, giaCau, hvBat, hvGia, hvSao, hvCau, ...theoGoi] = await Promise.all([
    layNoiDungTrang(DUONG), dsGoiSao(), giaLuanGiaiSao().catch(() => 99), so<number>("luan_giai.chuong_mien_phi", 1),
    so<number>("sao.thuong.chao_mung", 10), so<number>("sao.thuong.moi_ban", 20), so<number>("sao.thuong.duoc_moi", 20),
    so<number>("sao.hoi.gia", 5), so<boolean>("sao.hoi_vien.bat", false), so<number>("sao.hoi_vien.gia_vnd", 399000),
    so<number>("sao.hoi_vien.sao_thang", 15), so<number>("sao.hoi_vien.cau_hoi_nam", 1),
    ...GOI_XEM.map(async (g) => g.maGia
      ? { thu: await dangThuSao(g.maGia).catch(() => false), gia: await giaLuanGiaiSao(g.maGia).catch(() => 99) }
      : { thu: false, gia: 0 }),
  ]);
  const cong = congDangBat();
  const dangThu = theoGoi.some((x) => x.thu);
  const hoiVienMo = Boolean(hvBat) && cong !== null;
  const { le, dich } = baCachTra(goi, giaChung);
  const moc = hoiVienMo ? mocHoiVien(hvGia, giaChung, goi) : null;
  const banMoi = soBanCanMoi(giaChung - chaoMung, moiBan);
  const h1 = nd.dau.h1 ?? "Gói xem luận giải: chọn theo điều bạn đang cần biết";
  const hoiDap = [
    { hoi: "Xem ở Hiểu Bản Thân có mất tiền không?", dap: `Lá số, quẻ, hướng nhà, lịch, kiến thức và chương đầu của mọi luận giải luôn miễn phí, không cần tài khoản. ${dangThu ? "Các chương sau của Luận giải toàn bộ mở bằng Sao." : "Hiện các chương sau cũng đang miễn phí."}` },
    { hoi: "Sao là gì, mua rồi có hết hạn không?", dap: "Sao là điểm dùng trong Hiểu Bản Thân để mở Luận giải toàn bộ và hỏi thêm câu khi hết lượt miễn phí. Sao bạn mua không hết hạn. Sao không đổi ra tiền và không chuyển cho người khác." },
    { hoi: "Mở một luận giải rồi có xem lại được không?", dap: "Trong ngày bạn xem lại bao nhiêu lần cũng không trừ thêm. Bạn có thể bấm Lưu để giữ bài trong tài khoản và đọc lại về sau." },
    { hoi: "Tôi nên mua lẻ, mua gói hay hội viên?", dap: "Chỉ muốn đọc một báo cáo của mình: gói một lần xem là đủ. Muốn đọc hai, ba mảng hoặc xem cho người thân: gói nhiều lần xem rẻ hơn mỗi lần. Đọc nhiều báo cáo trong năm cho cả nhà: hội viên năm mở mọi luận giải trong 365 ngày." },
    { hoi: "Trả tiền bằng cách nào, có tự gia hạn không?", dap: "Quét mã QR bằng app ngân hàng hoặc ví có VietQR. Mỗi lần là một lần trả, không lưu thẻ, không tự gia hạn. Nạp nhầm và chưa dùng Sao thì liên hệ trong 7 ngày để hoàn tiền." },
  ];
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: h1, tomTat: "Các gói xem luận giải theo nhu cầu và cách trả: từng lần, gói nhiều lần, hội viên năm." }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Gói xem", duong: DUONG }]),
        ldHoiDap(hoiDap),
      )} />
      <p className="eyebrow">Gói xem · bảng giá</p>
      <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">{h1}</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        {nd.dau.loiDan ?? "Mỗi gói là một bài luận giải viết riêng từ ngày giờ sinh của bạn. Lá số và chương đầu luôn miễn phí: đọc thử, thấy đúng với mình rồi mới mở phần còn lại."}
      </p>
      {!dangThu && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-jade/40 bg-jade/10 px-4 py-3 text-fg" data-testid="goi-xem-mien-phi">
          <Check className="mt-0.5 size-5 shrink-0 text-jade" aria-hidden />
          <span>Hiện mọi luận giải đang miễn phí — bạn chưa cần nạp Sao.</span>
        </p>
      )}
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />

      <section className="mt-10" aria-labelledby="theo-nhu-cau">
        <h2 id="theo-nhu-cau" className="font-serif text-2xl">Bạn đang muốn biết điều gì?</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="ds-goi-xem">
          {GOI_XEM.map((g, i) => {
            const p = theoGoi[i] ?? { thu: false, gia: 0 };
            return (
              <li key={g.ma} className="glass flex flex-col rounded-2xl border border-line/70 p-5" data-testid={`goi-xem-${g.ma}`}>
                <span className="text-xs uppercase tracking-wide text-fg-faint">{g.mang}</span>
                <h3 className="mt-1 font-serif text-xl text-fg">{g.ten}</h3>
                <p className="mt-1 text-sm italic text-fg-muted">“{g.hoi}”</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-fg-muted">
                  {g.nhan.map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{x}</li>)}
                </ul>
                <p className="mt-3 text-xs text-fg-faint">Cần: {g.can}</p>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-2" data-testid="gia-goi-xem">
                  {p.thu ? <>
                    <span className="inline-flex items-center gap-1 font-serif text-2xl text-gold"><Sparkles className="size-4" aria-hidden />{p.gia} Sao</span>
                    <span className="text-xs text-fg-muted">{g.chuong ? `${g.chuong} chương · ${mienPhi > 0 ? `${mienPhi} chương đầu miễn phí` : "xem trước tiêu đề"}` : ""}</span>
                  </> : <span className="rounded-full bg-jade/15 px-2.5 py-0.5 text-sm font-medium text-jade">{g.maGia ? "Đang miễn phí" : "Miễn phí"}</span>}
                </p>
                <Link href={g.duong} className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-gold/60 px-4 text-sm font-medium text-gold hover:bg-gold/10">
                  {g.nut} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {dangThu && cong && le && (
        <section className="mt-12" aria-labelledby="ba-cach-tra" data-testid="ba-cach-tra">
          <h2 id="ba-cach-tra" className="font-serif text-2xl">Ba cách trả</h2>
          <p className="mt-1 text-sm text-fg-muted">Một Luận giải toàn bộ là {giaChung} Sao. Chọn cách hợp với số lần bạn định xem.</p>
          <div className={`mt-4 grid gap-4 ${dich && hoiVienMo ? "lg:grid-cols-3" : dich || hoiVienMo ? "sm:grid-cols-2" : ""}`}>
            <div className="glass flex flex-col rounded-2xl border border-line/70 p-5" data-testid="cot-le">
              <h3 className="text-sm text-fg-muted">Từng lần · {le.goi.ten}</h3>
              <p className="mt-1 font-serif text-3xl text-fg">{vnd(le.goi.gia_vnd)}</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm text-fg-muted">
                <li>{le.goi.sao} Sao{le.baoCao > 0 ? ` · ${le.baoCao} luận giải` : ""}</li>
                <li>Hợp khi bạn chỉ cần một báo cáo của chính mình</li>
                <li>Sao mua không hết hạn</li>
              </ul>
              <Link href="/nap-sao" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm text-fg hover:border-gold/60">Nạp gói này</Link>
            </div>
            {dich && (
              <div className="glass relative flex flex-col rounded-2xl border border-gold p-5" data-testid="cot-dich">
                {dich.goi.nhan && <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-semibold text-bg">{dich.goi.nhan}</span>}
                <h3 className="text-sm text-fg-muted">Nhiều lần · {dich.goi.ten}</h3>
                <p className="mt-1 font-serif text-3xl text-gold">{vnd(dich.goi.gia_vnd)}</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-fg-muted">
                  <li>{dich.goi.sao} Sao · {dich.baoCao} luận giải{dich.moiLan ? ` (≈ ${vnd(dich.moiLan)} mỗi lần)` : ""}</li>
                  {tietKiemPhanTram(dich.goi, goi) > 0 && <li className="text-fg">Rẻ hơn {tietKiemPhanTram(dich.goi, goi)}% mỗi lần so với mua từng lần</li>}
                  <li>Hợp khi xem vài mảng, hoặc xem cho người thân</li>
                  <li>Sao mua không hết hạn</li>
                </ul>
                <Link href="/nap-sao" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:opacity-90">Nạp gói này</Link>
              </div>
            )}
            {hoiVienMo && (
              <div className="glass flex flex-col rounded-2xl border border-line/70 p-5" data-testid="cot-hoi-vien">
                <h3 className="text-sm text-fg-muted">Cả năm · Hội viên năm</h3>
                <p className="mt-1 font-serif text-3xl text-fg">{vnd(hvGia)}</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-fg-muted">
                  <li>Mở mọi luận giải trong 365 ngày, của bạn và hồ sơ bạn nhập</li>
                  {hvSao > 0 && <li>{hvSao} Sao tặng mỗi tháng để hỏi thêm</li>}
                  {hvCau > 0 && <li>{hvCau} câu hỏi chuyên gia trong năm</li>}
                  {moc && <li className="text-fg">Đọc từ {moc} luận giải trong năm là rẻ hơn mua từng lần</li>}
                  <li>Trả một lần, không tự gia hạn</li>
                </ul>
                <Link href="/hoi-vien" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm text-fg hover:border-gold/60">Xem hội viên năm</Link>
              </div>
            )}
          </div>
          {goi.length > 2 && (
            <p className="mt-3 text-sm text-fg-muted" data-testid="moi-goi">
              Đủ các gói: {goi.map((x) => `${x.ten} ${vnd(x.gia_vnd)} / ${x.sao} Sao`).join(" · ")}. Câu hỏi thêm khi hết lượt miễn phí: {giaCau} Sao mỗi câu.
            </p>
          )}
        </section>
      )}

      {dangThu && (chaoMung > 0 || moiBan > 0) && (
        <section className="mt-10 flex items-start gap-3 rounded-2xl border border-line/70 p-5" aria-label="Lối miễn phí" data-testid="loi-mien-phi">
          <Gift className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden />
          <div className="text-sm text-fg-muted">
            <h2 className="font-serif text-lg text-fg">Chưa muốn nạp? Vẫn có lối miễn phí</h2>
            <p className="mt-1">
              {chaoMung > 0 && <>Lưu hồ sơ vào tài khoản: nhận {chaoMung} Sao chào mừng. </>}
              {moiBan > 0 && <>Mỗi người bạn nhận lời mời, đăng nhập và lưu hồ sơ: bạn nhận {moiBan} Sao, bạn ấy nhận {duocMoi} Sao. </>}
              {banMoi ? <>Mời {banMoi} bạn là đủ mở một Luận giải toàn bộ.</> : null}
            </p>
            <Link href="/hop-doi" className="mt-2 inline-block text-gold hover:underline">Mời bạn xem hợp đôi</Link>
          </div>
        </section>
      )}

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-10" />
      <section className="mt-12" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="font-serif text-2xl">Câu hỏi thường gặp</h2>
        <div className="mt-3 divide-y divide-line/60">
          {hoiDap.map((h) => (
            <details key={h.hoi} className="group py-3">
              <summary className="cursor-pointer list-none font-medium text-fg">{h.hoi}</summary>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{h.dap}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-sm text-fg-muted">
          Luận giải là tham khảo văn hoá để tự soi, không thay lời khuyên y tế, pháp lý hay đầu tư. Chi tiết về Sao và hoàn tiền ở{" "}
          <Link href="/dieu-khoan#sao" className="text-gold hover:underline">Điều khoản</Link>.
        </p>
      </section>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
