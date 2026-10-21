// TC-HOOK — dòng "điểm mù" chạy ở hero: mỗi câu rút gọn từ `diem_mu` của kho chân dung (thanso_chan_dung.json),
// để người xem tự nhận ra mình/người quen trong 3 giây rồi muốn biết số của mình. Chỉ CSS (globals.css), không JS.
const DIEM_MU: [number, string][] = [
  [2, "Nói “có” khi trong lòng muốn nói “không”."],
  [7, "Nghĩ rất nhiều, chia sẻ rất ít."],
  [9, "Miệng nói đã buông, lòng thì chưa."],
  [1, "Ôm hết việc vì ngại nhờ người khác."],
  [6, "Lo thay, quyết thay cho người mình thương."],
  [3, "Bắt đầu thì nhiều, làm xong thì ít."],
  [8, "Đo giá trị bản thân bằng thành tích."],
  [5, "Hễ chán là muốn đổi."],
  [4, "Nghĩ nghỉ ngơi là lười."],
];

export function DiemMuLuot({ className }: { className?: string }) {
  return (
    <div className={className} data-testid="diem-mu-luot">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-full border border-cinnabar/40 bg-cinnabar/10 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-cinnabar">
          Điểm mù
        </span>
        <ul className="diem-mu-luot relative h-[3.25rem] flex-1 sm:h-7" aria-label="Ví dụ điểm mù theo con số">
          {DIEM_MU.map(([so, cau], i) => (
            <li key={so} className="flex items-baseline gap-2 text-base text-fg sm:text-lg" style={{ animationDelay: `${i * 3}s` }}>
              <span className="shrink-0 font-serif text-gold">Số {so}</span>
              <span className="leading-snug">{cau}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
