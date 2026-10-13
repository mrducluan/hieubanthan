// Cổng 54321 giống Supabase (e2e-that): /auth/v1 → GoTrue :9999, /rest/v1 → PostgREST :3002, CORS như Kong.
import http from "node:http";
const dich = (u) => u.startsWith("/auth/v1") ? [9999, u.slice(8) || "/"] : u.startsWith("/rest/v1") ? [3002, u.slice(8) || "/"] : null;
http.createServer((req, res) => {
  // CORS như Kong của Supabase
  const cors = { "access-control-allow-origin": req.headers.origin || "*", "access-control-allow-credentials": "true",
    "access-control-allow-headers": req.headers["access-control-request-headers"] || "*", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-expose-headers": "content-range, x-supabase-api-version" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const d = dich(req.url);
  if (!d) { res.writeHead(404); return res.end(); }
  const p = http.request({ host: "127.0.0.1", port: d[0], path: d[1], method: req.method, headers: req.headers }, (r) => {
    res.writeHead(r.statusCode, { ...r.headers, ...cors }); r.pipe(res);
  });
  p.on("error", (e) => { res.writeHead(502); res.end(String(e)); });
  req.pipe(p);
}).listen(54321, "127.0.0.1");
