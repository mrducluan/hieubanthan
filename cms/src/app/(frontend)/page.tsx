import { redirect } from "next/navigation";

// cms.hieuban.com chỉ có phòng biên tập — trang gốc chuyển thẳng vào /admin.
export default function Page() {
  redirect("/admin");
}
