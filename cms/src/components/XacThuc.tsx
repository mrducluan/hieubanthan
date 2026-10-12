// CMS-2 — màn xác thực 2 bước (/admin/xac-thuc-2-buoc). Payload đưa tài khoản đã đăng nhập nhưng chưa đủ quyền vào
// đây (routes.unauthorized). Server component bọc phần client — không chuyền props của Payload xuống trình duyệt.
import { XacThucForm } from "./XacThucForm";

export function XacThuc() {
  return (
    <div style={{ maxWidth: 460, margin: "64px auto", padding: "0 16px" }}>
      <XacThucForm />
    </div>
  );
}
