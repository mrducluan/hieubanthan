// KH-BL P0 (2026-10-29, docs/KE-HOACH-BACKLINK-VA-KHO-TRI-THUC.md) — tư liệu cho báo chí: ai là Hiểu Bản Thân, ghi nguồn
// thế nào, dữ kiện mùa Tết (engine tính — web chỉ hiển thị), chuyên gia nhận lời bình luận, ảnh dùng lại, liên hệ.
// BM-1: không nêu thuật toán, thư viện, bộ đối chiếu, nhà cung cấp — chỉ nói "âm lịch Việt Nam, giờ UTC+7".
import type { Metadata } from "next";
import Link from "next/link";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldTrangWeb } from "@/lib/seo";
import { gopMucCms, LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { vanHanh } from "@/lib/van-hanh";
import { lichNamCongKhai, duongLichAm, type LichNam } from "@/lib/lich-am";
import { homNayVN } from "@/lib/hoang-lich";

const META: Metadata = {
  title: "Tư liệu báo chí",
  description: "Dành cho nhà báo: Hiểu Bản Thân (hieuban.com) là ai, cách ghi nguồn, dữ kiện lịch âm và phong tục mùa Tết tra được, chuyên gia nhận lời bình luận.",
  alternates: { canonical: "/bao-chi" },
};
const DUONG = "/bao-chi";
const lk = "text-gold underline decoration-gold/40 underline-offset-2";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

/** Tết sắp tới: năm âm có ngày Tết chưa qua (so theo ngày Việt Nam). */
async function tetSapToi(): Promise<LichNam | null> {
  const homNay = homNayVN(), y = Number(homNay.slice(0, 4));
  for (const n of [y, y + 1]) {
    const d = await lichNamCongKhai(n);
    if (d && d.tet >= homNay) return d;
  }
  return null;
}

export default async function BaoChi() {
  const vh = vanHanh(), nd = await layNoiDungTrang(DUONG), tet = await tetSapToi();
  const n = tet?.nam;
  const muc: Muc[] = [
    {
      id: "la-ai", tieuDe: "Hiểu Bản Thân là ai",
      noiDung: (
        <>
          <p><strong>Hiểu Bản Thân (hieuban.com)</strong> là website tiếng Việt{vh.chuSoHuu ? ` do ${vh.chuSoHuu} vận hành` : ""},
            tính thần số học, lá số Tử vi, Bát tự, quẻ Kinh Dịch, phong thuỷ và lịch âm theo âm lịch Việt Nam. Mọi con số do
            một bộ tính cố định đưa ra: cùng ngày giờ sinh luôn ra cùng kết quả, và trang nào cũng hiện cách tính.</p>
          <p>Chúng tôi trình bày các hệ thống này như <strong>văn hoá và phong tục để tham khảo</strong>, không phán tương lai,
            không bán vật phẩm giải hạn. Xem thêm <Link href="/gioi-thieu" className={lk}>Giới thiệu &amp; phương pháp</Link>.</p>
        </>
      ),
    },
    {
      id: "ghi-nguon", tieuDe: "Cách ghi nguồn",
      noiDung: (
        <ul className="list-disc space-y-1 pl-5">
          <li>Ghi tên: <strong>Hiểu Bản Thân (hieuban.com)</strong>. Tên &ldquo;Hiểu Bản Thân&rdquo; trùng với vài trang trắc nghiệm
            tính cách khác, nên xin luôn kèm tên miền.</li>
          <li>Nếu đăng bản điện tử, xin dẫn link về đúng trang dữ kiện bạn dùng (danh sách bên dưới) để độc giả tự tra tuổi của mình.</li>
          <li>Ảnh tóm tắt và thẻ chia sẻ trên site (có mã QR, chữ hieuban.com) được dùng lại khi ghi nguồn như trên.</li>
          <li>Khi trích các nội dung tục lệ (tuổi xông đất, tuổi làm nhà, sao hạn), xin giữ chữ &ldquo;theo tục lệ dân gian, để tham khảo&rdquo;.</li>
        </ul>
      ),
    },
    {
      id: "du-kien-tet", tieuDe: n ? `Dữ kiện mùa Tết ${n}` : "Dữ kiện mùa Tết",
      noiDung: (
        <>
          {tet && (
            <p data-testid="du-kien-tet">{tet.tra_loi_nhanh}</p>
          )}
          <p className="mt-3">Các bảng tra được, cập nhật theo năm (mọi con số do bộ tính đưa ra, lịch âm theo giờ Việt Nam UTC+7):</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {n && <li><Link href={duongLichAm(n)} className={lk}>Lịch âm {n}</Link>: Tết, tháng đủ/thiếu, mùng 1 và rằm từng tháng.</li>}
            {n && <li><Link href={`/tuoi-xong-dat/${n}`} className={lk}>Tuổi xông đất {n}</Link>: bảng 46 tuổi sinh 1960–2005, kèm lý do theo tam hợp, lục hợp.</li>}
            {n && <li><Link href={`/xem-tuoi-lam-nha/${n}`} className={lk}>Tuổi làm nhà {n}</Link>: Kim lâu, Hoang ốc, Tam tai theo tuổi mụ âm lịch Việt.</li>}
            {n && <li><Link href={`/phong-thuy/huong-xau-nam/${n}`} className={lk}>Hướng xấu năm {n}</Link>: Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc (năm phong thuỷ tính theo Lập xuân).</li>}
            {n && <li><Link href={`/xem-sao-han/${n}`} className={lk}>Sao hạn năm {n}</Link>: bảng tục lệ Cửu Diệu theo tuổi và giới.</li>}
            <li><Link href="/xem-ngay-tot" className={lk}>Xem ngày tốt</Link>: hoàng lịch từng ngày, ngày tốt theo việc (cưới hỏi, khai trương, về nhà mới…) theo tháng.</li>
            <li><Link href="/xem-ngay-tot/gio-hoang-dao" className={lk}>Giờ hoàng đạo</Link> và <Link href="/bat-tu/tiet-khi" className={lk}>24 tiết khí</Link> giờ Việt Nam.</li>
          </ul>
        </>
      ),
    },
    {
      id: "goc-du-lieu", tieuDe: "Những điều ít bài viết nói rõ",
      noiDung: (
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Lịch âm Việt Nam có năm khác lịch Trung Quốc.</strong> Việt Nam tính theo giờ UTC+7, Trung Quốc UTC+8, nên
            có tháng bắt đầu lệch một ngày, kéo theo ngày Tết hoặc tháng nhuận khác nhau. Đổi ngày tại <Link href="/doi-lich-am-duong" className={lk}>Đổi lịch âm dương</Link>.</li>
          <li><strong>Năm theo Tết và năm theo Lập xuân khác nhau.</strong> Tuổi, mệnh nạp âm tính theo Tết; Bát tự và phong thuỷ
            Bát trạch tính theo Lập xuân (khoảng 4/2). Người sinh giữa hai mốc này có thể mang hai con giáp tuỳ hệ thống.</li>
          <li><strong>Thần số học có hai cách cộng con số đường đời.</strong> Ví dụ ngày sinh 24/10/1988 cho ra 33 nếu cộng hết các
            chữ số, ra 6 nếu rút gọn ngày, tháng, năm trước rồi mới cộng. Không cách nào là &ldquo;đúng duy nhất&rdquo;; Hiểu Bản Thân cho người dùng chọn
            và luôn báo khi hai cách lệch nhau.</li>
          <li><strong>Mỗi sách đếm tục lệ một kiểu.</strong> Hoang ốc, sao hạn có nhiều bảng khác nhau; chúng tôi ghi rõ bảng đang dùng
            ở phần &ldquo;Cách tính&rdquo; từng trang.</li>
        </ul>
      ),
    },
    {
      id: "chuyen-gia", tieuDe: "Chuyên gia nhận lời bình luận",
      noiDung: (
        <p><Link href="/tac-gia/duc-luan" className={lk}>Đức Luân</Link>, chủ biên Hiểu Bản Thân, nhận phỏng vấn và bình luận về thần
          số học, Tử vi, Bát tự, Kinh Dịch, phong thuỷ, lịch âm và phong tục Tết dưới góc nhìn văn hoá, tự soi bản thân.
          Chúng tôi không đưa ra lời phán vận hạn cho cá nhân, ngày sống chết, chẩn đoán bệnh hay con số may rủi.</p>
      ),
    },
    {
      id: "lien-he", tieuDe: "Liên hệ",
      noiDung: vh.email
        ? <p>Email: <a href={`mailto:${vh.email}`} className={lk}>{vh.email}</a> (tiêu đề bắt đầu bằng &ldquo;[Báo chí]&rdquo; để được trả lời trước).
          Thông tin khác ở <Link href="/lien-he" className={lk}>Liên hệ</Link>.</p>
        : <p>Xem <Link href="/lien-he" className={lk}>trang Liên hệ</Link>.</p>,
    },
  ];
  return (
    <>
    <JsonLd data={goiLd(ldTrangWeb({ duong: DUONG, ten: "Tư liệu báo chí — Hiểu Bản Thân (hieuban.com)",
      tomTat: tet?.tra_loi_nhanh, about: ["Hiểu Bản Thân (hieuban.com)", "Âm lịch Việt Nam", "Phong tục Tết"] }))} />
    <TrangPhapLy nhan="Báo chí" tieuDe={nd.dau.h1 ?? "Tư liệu báo chí"} duongDan={DUONG} muc={gopMucCms(muc, nd)} hieuLuc={false}
      khoiCuoi={<KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />}
      moDau={<LoiDanCms nd={nd}>Dành cho nhà báo, biên tập viên và người viết: dữ kiện tra được, cách ghi nguồn và người có thể
        trả lời câu hỏi của bạn.</LoiDanCms>} />
    </>
  );
}
