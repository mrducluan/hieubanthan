"use client";
import { NhipCaNhan } from "@/components/than-so/NhipCaNhan";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Compass, HeartHandshake, MessageCircle, Pencil, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { NghiThuc } from "@/components/than-so/NghiThuc";
import { SoLon } from "@/components/than-so/SoLon";
import { TheDanhTinh } from "@/components/than-so/TheDanhTinh";
import { TheBaLop } from "@/components/than-so/TheBaLop";
import { ChuThichLop } from "@/components/than-so/LopNoiDung";
import { NhipHienTai } from "@/components/than-so/NhipHienTai";
import { ChanDung } from "@/components/than-so/ChanDung";
import { useBaiDoc } from "@/lib/bai-doc";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { docXong } from "@/lib/do-luong";
import { useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { GopY } from "@/components/khung/GopY";
import { NhiemVuSao } from "@/components/sao/NhiemVuSao";

export function BanThan() {
  const hoSo = useHoSo();
  const router = useRouter();
  const params = useSearchParams();
  const [daXongNghiThuc, setDaXong] = useState(params.get("moi") !== "1");
  const [suaMo, setSuaMo] = useState(false);
  const { kq, loi, thuLai } = useBaiDoc(hoSo);
  const cuoiBai = useRef<HTMLElement>(null);

  // Gate 1: bắt đầu = bài đọc hiện ra (sau nghi thức); đọc xong = cuộn tới "Nhịp hiện tại" (sau 4 thẻ cốt lõi).
  useBatDauDoc("thanso", Boolean(kq && daXongNghiThuc));
  useEffect(() => {
    const el = cuoiBai.current;
    if (!el || !kq || !daXongNghiThuc) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        docXong("thanso", { so_duong_doi: kq.cac_vi_tri[0]?.gia_tri });
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [kq, daXongNghiThuc]);
  const xongNghiThuc = useCallback(() => {
    setDaXong(true);
    router.replace("/ban-than", { scroll: false });
  }, [router]);

  if (hoSo === undefined) return <KhungTai />;

  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TieuDeMuc cap={1} nho="Hồ sơ bản thân" lon="Bắt đầu bằng tên và ngày sinh"
          mo_ta="Nhập một lần — dùng cho thần số, hợp đôi và cả bốn mảng huyền học." />
        <Card><NhapHoSo onXong={() => router.push("/ban-than?moi=1")} /></Card>
      </div>
    );
  }

  if (loi) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="text-cinnabar">{loi}</p>
        <Button className="mt-4" variant="secondary" onClick={thuLai}>Thử lại</Button>
      </Card>
    );
  }

  if (!daXongNghiThuc || !kq) {
    return daXongNghiThuc ? <KhungTai /> : <NghiThuc daCoKetQua={Boolean(kq)} onXong={xongNghiThuc} />;
  }

  const dd = kq.cac_vi_tri.find((v) => v.vi_tri === "duong_doi") ?? kq.cac_vi_tri[0];
  return (
    <div className="space-y-14">
      {dd && <SoLon vt={dd} tenGoi={tenGoi(hoSo)} />}

      <section aria-labelledby="muc-id" className="mx-auto grid max-w-4xl items-start gap-6 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 id="muc-id" className="sr-only">Hồ sơ bản thân</h2>
          <TheDanhTinh kq={kq} tenHienThi={hoSo.ho_ten} />
        </div>
        <div className="space-y-3">
          <p className="text-fg-muted">
            Đây là bốn con số tạo nên hồ sơ của bạn. Mỗi số có ba lớp — bấm để xem <b className="text-jade">cách tính</b>,{" "}
            <b className="text-gold">ý nghĩa</b> và <b className="text-moon">câu hỏi tự soi</b>.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild><Link href="/hop-doi"><HeartHandshake aria-hidden /> Xem hợp đôi</Link></Button>
            <Button variant="secondary" asChild><Link href="/chia-se"><Share2 aria-hidden /> Chia sẻ thẻ</Link></Button>
            <Button variant="ghost" onClick={() => setSuaMo(true)}><Pencil aria-hidden /> Sửa hồ sơ</Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="muc-bon-so">
        <TieuDeMuc id="muc-bon-so" nho="Bốn con số cốt lõi" lon="Mỗi con số, ba lớp" />
        <ChuThichLop />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {kq.cac_vi_tri.map((vt) => <TheBaLop key={vt.vi_tri} vt={vt} />)}
        </div>
      </section>

      {kq.chan_dung && (
        <section aria-labelledby="muc-chan-dung">
          <TieuDeMuc id="muc-chan-dung" nho="Chân dung" lon="Con người bạn, bốn mặt"
            mo_ta="Tổng quan, tình cảm, công việc và những bước ngoặt — trục là số Đường đời, thêm lớp riêng từ các con số khác của bạn." />
          <ChanDung cd={kq.chan_dung} />
        </section>
      )}

      <section aria-labelledby="muc-nhip" ref={cuoiBai}>
        <TieuDeMuc id="muc-nhip" nho="Nhịp hiện tại" lon="Giai đoạn này của bạn"
          mo_ta="Chủ đề của năm và tháng cá nhân — không phải dự báo sự kiện, mà là gợi ý để bạn đặt trọng tâm." />
        <NhipHienTai kq={kq} />
        {/* NHIP-1: tháng tới, năm cá nhân còn bao nhiêu ngày, năm tới — lý do quay lại mỗi tháng. */}
        <NhipCaNhan hoSo={hoSo} className="mt-4" />
        <Link href="/hom-nay" className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/5 px-5 py-4 hover:border-gold"
          data-testid="lien-ket-hom-nay">
          <span><span className="block font-medium text-fg">Hôm nay của bạn</span>
            <span className="text-sm text-fg-muted">Ngày cá nhân, âm lịch và một câu hỏi tự soi — mỗi ngày một thẻ mới</span></span>
          <ArrowRight className="size-5 shrink-0 text-gold" aria-hidden />
        </Link>
      </section>

      <section aria-labelledby="muc-tiep" className="grid gap-3 sm:grid-cols-3">
        <h2 id="muc-tiep" className="sr-only">Đi tiếp</h2>
        {[
          { href: "/than-so", Icon: BookOpen, ten: "Đọc chiều sâu", mo: "Dải đời 4 giai đoạn, thử thách, biểu đồ ngày sinh" },
          { href: "/than-so#hoi", Icon: MessageCircle, ten: "Hỏi điều bạn băn khoăn", mo: "Nghề nghiệp, tình cảm, giai đoạn này nên tập trung gì" },
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

      {/* SAO-3: Lưu hồ sơ · Hỏi 3 câu · Mời 1 bạn → nhận Sao (tự ẩn khi chưa bật tài khoản / công tắc tắt với khách). */}
      <NhiemVuSao />

      <GopY />

      <p className="text-center text-xs text-fg-faint">{kq.trich_nguon_chung}</p>

      <Sheet open={suaMo} onOpenChange={setSuaMo}>
        <SheetContent title="Sửa hồ sơ" description="Thay đổi được lưu trên máy của bạn.">
          <NhapHoSo macDinh={hoSo} nutGui="Lưu hồ sơ" onXong={() => setSuaMo(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
