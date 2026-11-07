---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent with a fresh context window to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## Riêng cho HieuBanThan

- Hỏi và trả lời bằng tiếng Việt, xưng "em", gọi chủ dự án là "anh".
- Trước vòng hỏi đầu, đọc `CLAUDE.md`: quyết định trong bảng "Quyết định đã chốt" là nút đã giải trên cây — không hỏi lại trừ khi có lý do mới (nêu rõ lý do đó).
- Mỗi kế hoạch phải có một nút "đẩy khâu nào của vòng tăng trưởng (thu hút → quay lại → mời → nạp Sao), đo bằng chỉ số nào" (`docs/MUC-TIEU-TANG-TRUONG.md`).
- Câu đụng ranh giới cứng (thêm dependency, đổi schema DB, đổi stack, riêng tư dữ liệu, tầng CALC/LLM) luôn là câu hỏi riêng, không gộp vào khuyến nghị.

---
Nguồn: [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, © 2026 Matt Pocock), bản `4ae2317` (31/10/2026). `grill-me` chỉ gọi `grilling`; cập nhật = chép lại hai tệp SKILL.md từ upstream rồi giữ mục "Riêng cho HieuBanThan".
