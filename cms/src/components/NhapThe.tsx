"use client";
// Ô nhập Thẻ / Từ khoá phụ (text hasMany). Ô mặc định của Payload ghi "Select a value", chỉ thêm khi bấm Enter, gõ xong
// bấm ra ngoài thì MẤT chữ không báo, bộ gõ tiếng Việt có gạch chân (Telex của Windows/macOS) phải Enter hai lần,
// dấu phẩy không tách. Ô này thêm khi: Enter · dấu phẩy · chấm phẩy · Tab · bấm ra ngoài · dán nhiều từ; Enter lúc đang
// gõ dấu thì chốt chữ rồi thêm luôn; Backspace ở ô trống xoá thẻ cuối. Giá trị lưu y như cũ: mảng chuỗi.
import { FieldDescription, FieldError, FieldLabel, useField } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";
import { useRef, useState } from "react";
import { gopThe, tachThe } from "../lib/the";

const chip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 4px 2px 8px", borderRadius: 4,
  background: "var(--theme-elevation-100)", fontSize: 13, lineHeight: "20px",
};

export const NhapThe: TextFieldClientComponent = ({ field, path: pathProp, readOnly: chiDocProp }) => {
  const path = pathProp ?? field.name;
  const { value, setValue, showError, disabled } = useField<string[] | null>({ path });
  const [chu, setChu] = useState("");
  const [bao, setBao] = useState("");
  const choChot = useRef(false);
  const o = useRef<HTMLInputElement>(null);
  const ds = Array.isArray(value) ? value : [];
  const toiDa = field.maxRows;
  const chiDoc = Boolean(chiDocProp || field.admin?.readOnly || disabled);
  const id = `field-${path.replace(/\./g, "__")}`;

  const them = (s: string) => {
    const moi = tachThe(s);
    setChu("");
    if (!moi.length) return;
    const kq = gopThe(ds, moi, toiDa);
    if (kq.ds.length !== ds.length) setValue(kq.ds);
    setBao([kq.trung.length ? `Đã có: ${kq.trung.join(", ")}.` : "",
      kq.vuot.length ? `Tối đa ${toiDa} mục — chưa thêm: ${kq.vuot.join(", ")}.` : ""].filter(Boolean).join(" "));
  };
  const xoa = (i: number) => { setValue(ds.filter((_, j) => j !== i)); setBao(""); };

  const phim = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Đang gõ dấu (IME): Enter chỉ chốt chữ — đánh dấu để thêm ngay khi chốt xong (onCompositionEnd, Chrome/Edge).
    if (e.nativeEvent.isComposing) {
      if (e.key === "Enter") choChot.current = true;
      return;
    }
    // Safari chốt chữ TRƯỚC rồi mới phát Enter với keyCode 229 → thêm luôn chữ đã chốt.
    if (e.keyCode === 229) {
      if (e.key === "Enter") { e.preventDefault(); them(e.currentTarget.value); }
      return;
    }
    if (e.key === "Enter" || e.key === "," || e.key === ";") { e.preventDefault(); them(chu); }
    else if (e.key === "Tab" && chu.trim()) them(chu);
    else if (e.key === "Backspace" && !chu && ds.length) xoa(ds.length - 1);
  };
  const doi = (v: string) => {
    // Bàn phím điện thoại không phát keydown cho dấu phẩy → bắt ở đây: phần trước dấu phẩy thành thẻ.
    if (/[,;\n]/.test(v)) {
      const cuoi = v.split(/[,;\n]/).pop() ?? "";
      them(v.slice(0, v.length - cuoi.length));
      setChu(cuoi);
    } else setChu(v);
  };

  return (
    <div className={`field-type text has-many ${id}`} data-testid={`nhap-the-${path}`} style={{ marginBottom: "var(--spacing-field, 24px)" }}>
      <FieldLabel htmlFor={id} label={field.label} path={path} required={field.required} />
      <div
        onClick={() => o.current?.focus()}
        style={{
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 40, padding: "6px 8px",
          border: `1px solid ${showError ? "var(--theme-error-500)" : "var(--theme-elevation-150)"}`,
          borderRadius: "var(--style-radius-s, 4px)", background: "var(--theme-input-bg, var(--theme-elevation-0))", cursor: "text",
        }}
      >
        {ds.map((t, i) => (
          <span key={`${t}-${i}`} style={chip} data-testid="the-muc">
            {t}
            {!chiDoc && (
              <button type="button" aria-label={`Xoá "${t}"`} onClick={(e) => { e.stopPropagation(); xoa(i); }}
                style={{ border: 0, background: "none", cursor: "pointer", padding: "0 4px", color: "inherit", fontSize: 15 }}>×</button>
            )}
          </span>
        ))}
        {!chiDoc && (
          <input
            id={id} ref={o} value={chu} autoComplete="off"
            placeholder={ds.length ? "Thêm…" : "Gõ rồi bấm Enter hoặc dấu phẩy"}
            onChange={(e) => doi(e.target.value)}
            onKeyDown={phim}
            onCompositionEnd={(e) => {
              if (!choChot.current) return;
              choChot.current = false;
              them((e.target as HTMLInputElement).value);
            }}
            onBlur={() => { choChot.current = false; if (chu.trim()) them(chu); }}
            style={{ flex: "1 1 140px", minWidth: 120, border: 0, outline: 0, background: "transparent", color: "inherit", font: "inherit", padding: "2px 0" }}
          />
        )}
      </div>
      <FieldError path={path} showError={showError} />
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
        {toiDa ? `${ds.length}/${toiDa} · ` : ""}Thêm bằng Enter, dấu phẩy hoặc bấm ra ngoài. Dán nhiều từ cách nhau bằng dấu phẩy cũng được. Bấm × để xoá.
      </div>
      {bao && <div role="status" style={{ fontSize: 12, color: "var(--theme-warning-500, inherit)", marginTop: 2 }}>{bao}</div>}
      <FieldDescription description={field.admin?.description} path={path} />
    </div>
  );
};
