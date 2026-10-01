// Golden Huyền Không phi tinh — ORACLE @soul-atelier/xuankong 0.3.0 (MIT). Chỉ sinh golden, không chạy runtime.
import { buildChart } from "@soul-atelier/xuankong";
import { readFileSync } from "node:fs";

const VER = JSON.parse(readFileSync(new URL("./node_modules/@soul-atelier/xuankong/package.json", import.meta.url))).version;
const SON = ["壬","子","癸","丑","艮","寅","甲","卯","乙","辰","巽","巳","丙","午","丁","未","坤","申","庚","酉","辛","戌","乾","亥"];
const cases = [];
for (let v = 1; v <= 9; v++) {
  const year = 1864 + 20 * (v - 1) + 10;
  for (const s of SON) {
    const c = buildChart(year, s);
    cases.push({ nam: year, toa: s, van: c.period, huong: c.facing.name, cach: c.formation,
      cung: Object.fromEntries(c.palaces.map((p) => [p.key, [p.period, p.mountain, p.water]])),
      to_hop: c.combinations.map((x) => x.name).sort() });
  }
}
process.stdout.write(JSON.stringify({ _oracle: `@soul-atelier/xuankong ${VER} (MIT)`, cases }, null, 0) + "\n");
