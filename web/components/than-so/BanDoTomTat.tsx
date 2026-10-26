"use client";
// QH-BT — tóm tắt "Bản đồ con số" trên trang của tôi (/ban-than): câu mở của chương Tổng quan + từng chương còn lại
// (mở hay còn khoá, điểm nhấn đã tính). Chỉ gọi bản xem trước — không gửi x-mo-khoa nên không bao giờ trừ Sao, không
// ghi paywall_viewed (phễu đo ở bài đọc /than-so). Đọc đầy đủ / mở khoá ở /than-so#ban-do-con-so.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Map as BanDo, BookOpenCheck } from "lucide-react";
import { postJson } from "@/lib/goi-api";
import { hoTenList, type HoSo } from "@/lib/hoso";
import type { QuyUocDD } from "@/lib/quy-uoc-dd";
import type { MoiXem } from "@/lib/sao-xem-truoc";

type Chuong = { ma: string; tieu_de: string; doan?: string[]; khoa?: boolean; moi_xem?: MoiXem };

export function BanDoTomTat({ hoSo, quyUoc }: { hoSo: HoSo; quyUoc: QuyUocDD }) {
  const [ds, setDs] = useState<Chuong[] | null>(null);
  const khoa = JSON.stringify([hoTenList(hoSo), hoSo.ngay, hoSo.thang, hoSo.nam, quyUoc]);
  useEffect(() => {
    let huy = false;
    postJson<{ chuong: Chuong[] }>("/api/thanso/ban-do-con-so",
      { ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, quy_uoc_duong_doi: quyUoc })
      .then((d) => { if (!huy) setDs(d.chuong); })
      .catch(() => { if (!huy) setDs([]); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho hồ sơ + cách tính
  }, [khoa]);
  if (ds === null || !ds.length) return null;
  const [dau, ...sau] = ds;
  const soKhoa = sau.filter((c) => c.khoa).length;
  return (
    <section aria-labelledby="muc-ban-do" className="glass rounded-2xl p-5 sm:p-6" data-testid="ban-do-tom-tat">
      <p className="eyebrow flex items-center gap-2"><BanDo className="size-4" aria-hidden /> Bản đồ con số của bạn</p>
      <h2 id="muc-ban-do" className="mt-2 text-2xl">{dau?.tieu_de}</h2>
      {dau?.doan?.[0] && <p className="mt-2 text-sm text-fg-muted">{dau.doan[0]}</p>}
      <ul className="mt-4 space-y-2">
        {sau.map((c) => (
          <li key={c.ma} className="flex items-start gap-3 rounded-xl border border-line/70 bg-bg/40 px-4 py-3" data-testid={`ban-do-chuong-${c.ma}`}>
            {c.khoa ? <LockKeyhole className="mt-0.5 size-4 shrink-0 text-gold" aria-label="Còn khoá" />
              : <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-jade" aria-label="Đọc được" />}
            <span>
              <span className="block font-medium">{c.tieu_de}</span>
              {c.khoa && c.moi_xem?.diem_nhan && <span className="block text-sm text-fg-muted">{c.moi_xem.diem_nhan}</span>}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/than-so#ban-do-con-so" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline">
        {soKhoa ? `Đọc Tổng quan và mở ${soKhoa} chương còn lại` : "Đọc toàn bộ bản đồ"} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
