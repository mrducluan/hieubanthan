import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DieuHuongQT } from "@/components/quan-tri/DieuHuongQT";

// QT-0: không bao giờ index (proxy.ts còn gắn X-Robots-Tag + no-store cho cả /quan-tri).
export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s · Quản trị" },
  robots: { index: false, follow: false, nocache: true },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl"><DieuHuongQT />{children}</div>;
}
