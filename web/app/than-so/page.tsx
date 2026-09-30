import type { Metadata } from "next";
import { ThanSo } from "./ThanSo";

export const metadata: Metadata = {
  title: "Thần số học — chiều sâu",
  description: "Thần số học Pythagoras theo họ tên và ngày sinh: 4 con số cốt lõi có cách tính từng bước, dải đời, năm và tháng cá nhân, biểu đồ ngày sinh, hỏi đáp có nguồn.",
  alternates: { canonical: "/than-so" },
  openGraph: { title: "Thần số học — chiều sâu", description: "Thần số học Pythagoras theo họ tên và ngày sinh: 4 con số cốt lõi có cách tính từng bước, dải đời, năm và tháng cá nhân, biểu đồ ngày sinh, hỏi đáp có nguồn.", url: "/than-so" },
};

export default function Page() {
  return <ThanSo />;
}
