import type { Metadata } from "next";
import { HopDoi } from "./HopDoi";

export const metadata: Metadata = {
  title: "Hợp đôi",
  description: "So hợp đôi theo thần số học: con số của hai người hoà ở đâu, va ở đâu, việc nên cùng làm. Không chấm điểm hợp hay khắc. Gửi link mời người ấy tự nhập.",
  alternates: { canonical: "/hop-doi" },
  openGraph: { title: "Hợp đôi", description: "So hợp đôi theo thần số học: con số của hai người hoà ở đâu, va ở đâu, việc nên cùng làm. Không chấm điểm hợp hay khắc. Gửi link mời người ấy tự nhập.", url: "/hop-doi" },
};

export default function Page() {
  return <HopDoi />;
}
