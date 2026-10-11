// Logo + biểu tượng trong admin (SVG nội dòng, không tải ảnh ngoài).
const Sao = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <circle cx="16" cy="16" r="15" fill="#141226" stroke="#c9a45c" strokeWidth="1.5" />
    <path d="M16 6l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L16 20.4 10.1 24l1.7-6.7-5.3-4.4 6.9-.5z" fill="#e8c77e" />
  </svg>
);

export function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Sao size={40} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.2 }}>Hiểu Bản Thân</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Phòng biên tập · CMS</div>
      </div>
    </div>
  );
}

export function Icon() {
  return <Sao size={24} />;
}
