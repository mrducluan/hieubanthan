"use client";
// QH-BT — /ban-than là TRANG CỦA TÔI để quay lại mỗi ngày (khâu QUAY LẠI + MỜI): danh tính gọn, nhịp hôm nay → năm,
// tóm tắt Bản đồ con số (chương nào còn khoá), ký ức, nhiệm vụ Sao, lối tắt. KHÔNG lặp bài đọc — bốn thẻ số, chân dung,
// chiều sâu, hỏi đáp nằm ở /than-so (cửa vào + bài đọc). Người chưa có hồ sơ nhập ở đây rồi sang /than-so xem hé lộ.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Compass, HeartHandshake, History, Pencil, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChuChung } from "@/components/cms/ChuChung";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { TheDanhTinh } from "@/components/than-so/TheDanhTinh";
import { NhipHienTai } from "@/components/than-so/NhipHienTai";
import { NhipCaNhan } from "@/components/than-so/NhipCaNhan";
import { BanDoTomTat } from "@/components/than-so/BanDoTomTat";
import { useBaiDoc } from "@/lib/bai-doc";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { useKyUc } from "@/lib/ky-uc";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";
import { ghi } from "@/lib/do-luong";
import { NhiemVuSao } from "@/components/sao/NhiemVuSao";

const KHOA_LAN_GHE = "hbt.ban_than_lan_ghe";

/** Đo khâu QUAY LẠI: lần đầu / quay lại sau bao nhiêu ngày — chỉ ngày ghé gần nhất lưu trên máy, không gửi ngày. */
function useDoLanGhe(sanSang: boolean) {
  useEffect(() => {
    if (!sanSang) return;
    const homNay = new Date(); homNay.setHours(0, 0, 0, 0);
    let truoc: number | null = null;
    try { const v = Number(localStorage.getItem(KHOA_LAN_GHE)); truoc = v > 0 ? v : null; localStorage.setItem(KHOA_LAN_GHE, String(homNay.getTime())); } catch { /* riêng tư */ }
    if (truoc === null) ghi("hub_viewed", { kind: "lan_dau" });
    else ghi("hub_viewed", { kind: "quay_lai", so_ngay: Math.max(0, Math.round((homNay.getTime() - truoc) / 86_400_000)) });
  }, [sanSang]);
}

export function BanThan() {
  const hoSo = useHoSo();
  const router = useRouter();
  const [suaMo, setSuaMo] = useState(false);
  const { kq, loi, thuLai } = useBaiDoc(hoSo);
  const quyUoc = useQuyUocDD();
  const kyUc = useKyUc();
  const cc = useChuChung();
  useDoLanGhe(Boolean(kq));

  if (hoSo === undefined) return <KhungTai />;

  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TieuDeMuc cap={1} nho="Hồ sơ bản thân" lon="Bắt đầu bằng tên và ngày sinh"
          mo_ta="Nhập một lần — dùng cho thần số, hợp đôi và cả bốn mảng huyền học." />
        <Card><NhapHoSo onXong={() => router.push("/than-so?moi=1")} /></Card>
      </div>
    );
  }

  if (loi) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="text-cinnabar">{loi}</p>
        <Button className="mt-4" variant="secondary" onClick={thuLai}>{cc("loi.thu_lai")}</Button>
      </Card>
    );
  }
  if (!kq) return <KhungTai />;

  return (
    <div className="space-y-12">
      <section aria-labelledby="muc-chao" className="mx-auto grid max-w-4xl items-start gap-6 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow">Bản thân</p>
          <h1 id="muc-chao" className="mt-2 text-4xl">Chào {tenGoi(hoSo)}</h1>
          <p className="mt-2 text-fg-muted">Nhịp của bạn hôm nay, tháng này và năm nay — mỗi lần quay lại có điều mới để đặt trọng tâm.</p>
          <div className="mt-5"><TheDanhTinh kq={kq} tenHienThi={hoSo.ho_ten} /></div>
        </div>
        <div className="space-y-3 md:pt-16">
          <Link href="/than-so" className="glass group flex items-center justify-between gap-3 rounded-2xl p-5 hover:border-gold/50" data-testid="mo-bai-doc">
            <span>
              <span className="flex items-center gap-2 font-serif text-lg"><BookOpen className="size-5 text-gold" aria-hidden /> Bài đọc đầy đủ</span>
              <span className="mt-1 block text-sm text-fg-muted">Ý nghĩa và kiểm chứng từng số, chân dung bốn mặt, dải đời, biểu đồ ngày sinh, hỏi đáp</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-gold transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild><Link href="/hop-doi"><HeartHandshake aria-hidden /> Xem hợp đôi</Link></Button>
            <Button variant="secondary" asChild><Link href="/chia-se"><Share2 aria-hidden /> Chia sẻ thẻ</Link></Button>
            <Button variant="ghost" onClick={() => setSuaMo(true)}><Pencil aria-hidden /> Sửa hồ sơ</Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="muc-nhip">
        <TieuDeMuc id="muc-nhip" nho="Nhịp hiện tại" lon="Giai đoạn này của bạn"
          mo_ta="Chủ đề của ngày, tháng và năm cá nhân — không phải dự báo sự kiện, mà là gợi ý để bạn đặt trọng tâm." />
        {/* NHIP-1: ngày, tháng tới, năm cá nhân còn bao nhiêu ngày, năm tới — lý do quay lại mỗi ngày/tháng. */}
        <NhipCaNhan hoSo={hoSo} />
        <div className="mt-4"><NhipHienTai kq={kq} /></div>
        <Link href="/hom-nay" className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/5 px-5 py-4 hover:border-gold"
          data-testid="lien-ket-hom-nay">
          <span><span className="block font-medium text-fg">Hôm nay của bạn</span>
            <span className="text-sm text-fg-muted">Ngày cá nhân, âm lịch, giờ tốt và điều bạn định làm hôm nay — mỗi ngày một thẻ mới</span></span>
          <ArrowRight className="size-5 shrink-0 text-gold" aria-hidden />
        </Link>
      </section>

      <BanDoTomTat hoSo={hoSo} quyUoc={quyUoc} />

      {kyUc.dangNhap && kyUc.ds.length > 0 && (
        <Link href="/than-so#hoi" className="glass flex items-center justify-between gap-3 rounded-2xl p-5 hover:border-gold/50" data-testid="ban-than-ky-uc">
          <span className="flex items-center gap-3">
            <History className="size-5 text-gold" aria-hidden />
            <span><span className="block font-medium">Lần trước bạn băn khoăn {kyUc.ds.length} điều</span>
              <span className="text-sm text-fg-muted">Xem lại và hỏi tiếp trong bài đọc</span></span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-gold" aria-hidden />
        </Link>
      )}

      {/* SAO-3: Lưu hồ sơ · Hỏi 3 câu · Mời 1 bạn → nhận Sao (tự ẩn khi chưa bật tài khoản / công tắc tắt với khách). */}
      <NhiemVuSao />

      <section aria-labelledby="muc-tiep" className="grid gap-3 sm:grid-cols-3">
        <h2 id="muc-tiep" className="sr-only">Đi tiếp</h2>
        {[
          { href: "/hop-doi", Icon: HeartHandshake, ten: "Hợp đôi", mo: "Người yêu, bạn bè, đồng nghiệp — gửi link mời để người kia tự nhập" },
          { href: "/than-so#hoi", Icon: BookOpen, ten: "Hỏi điều bạn băn khoăn", mo: "Nghề nghiệp, tình cảm, giai đoạn này nên tập trung gì" },
          { href: "/kham-pha", Icon: Compass, ten: "Khám phá huyền học", mo: "Tử vi, Kinh Dịch, Bát tự, Phong thuỷ — dùng luôn hồ sơ này" },
        ].map(({ href, Icon, ten, mo }) => (
          <Link key={href} href={href} className="glass group rounded-2xl p-5 transition-colors hover:border-gold/50">
            <Icon className="size-5 text-gold" aria-hidden />
            <p className="mt-3 font-serif text-lg">{ten}</p>
            <p className="mt-1 text-sm text-fg-muted">{mo}</p>
            <ArrowRight className="mt-3 size-4 text-fg-faint transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden />
          </Link>
        ))}
        <p className="text-sm sm:col-span-3">
          <Link href="/ban-than/bai-da-luu" className="text-fg-muted underline-offset-4 hover:text-gold hover:underline" data-testid="lien-ket-bai-da-luu">
            Bài luận đã lưu trong tài khoản →
          </Link>
        </p>
      </section>

      <Sheet open={suaMo} onOpenChange={setSuaMo}>
        <SheetContent title="Sửa hồ sơ" description="Thay đổi được lưu trên máy của bạn.">
          <NhapHoSo macDinh={hoSo} nutGui="Lưu hồ sơ" onXong={() => setSuaMo(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
