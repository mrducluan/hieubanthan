// GN — Từ điển thuật ngữ dễ hiểu (trang công khai, SEO): giải nghĩa đời thường cho mọi thuật ngữ 5 mảng.
// Nội dung từ KB của engine (nháp AI, luôn gắn nhãn); render phía server để máy tìm kiếm và AI đọc được.
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { tuDien } from "@/lib/kien-thuc";
import { TimTuDien } from "./TimTuDien";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Từ điển thuật ngữ Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Thần số — giải nghĩa dễ hiểu",
  description: "Hơn 200 thuật ngữ huyền học giải nghĩa bằng ngôn ngữ đời thường: cung Mệnh, Hoá Kỵ, nhật chủ, dụng thần, hào động, quẻ biến, sơn tinh, hướng tinh, số đường đời…",
  alternates: { canonical: "/tu-dien" },
};

const TEN_MANG: Record<string, string> = {
  tuvi: "Tử vi", battu: "Bát tự", kinhdich: "Kinh Dịch", phongthuy: "Phong thuỷ", thanso: "Thần số học",
};

export default async function Trang() {
  const d = await tuDien();
  const muc = d?.muc ?? [];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="space-y-3">
        <p className="eyebrow flex items-center gap-2"><BookOpen className="size-4" aria-hidden /> Từ điển</p>
        <h1 className="text-4xl">Từ điển thuật ngữ — nói cho dễ hiểu</h1>
        <p className="text-fg-muted">
          Mỗi thuật ngữ trong lá số và lời luận giải đều có lời giải nghĩa bằng ngôn ngữ đời thường. Trong câu trả lời, chữ
          gạch chân chấm là thuật ngữ — bấm vào để xem nhanh.
        </p>
        <p className="text-xs text-fg-faint">Bản nháp đang được chuyên gia duyệt dần · {d?.nguon}</p>
      </header>
      {muc.length === 0 ? (
        <p className="mt-8 text-fg-muted">Từ điển đang tải, vui lòng quay lại sau ít phút.</p>
      ) : (
        <TimTuDien muc={muc} tenMang={TEN_MANG} />
      )}
    </div>
  );
}
