// 충남에듀있슈 '주요 언론기사' 게시판 중계 (Cloudflare Pages Functions)
// 브라우저는 다른 사이트(news.cne.go.kr)의 파일을 직접 가져올 수 없어서,
// 이 코드가 대신 목록·첨부파일을 가져와 같은 주소(/api/...)로 전달합니다.
// 허용된 주소(게시판 1004번의 목록·보기·파일받기)만 읽도록 제한되어 있습니다.

const BASE = "http://news.cne.go.kr";
const BOARD = "1004";
const M = "0402";
const VERSION = "web-1";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CNE-Press-Dashboard)" };

const memo = new Map();                       // 같은 서버 인스턴스 안에서만 잠깐 기억
const remember = (key, ttlMs, value) => memo.set(key, { until: Date.now() + ttlMs, value });
const recall = key => { const h = memo.get(key); return h && h.until > Date.now() ? h.value : undefined; };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

const unescapeHtml = t => t.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

async function upstream(url, fresh) {
  const u = fresh ? url + (url.includes("?") ? "&" : "?") + "_t=" + Date.now() : url;
  const r = await fetch(u, { headers: UA, cf: { cacheTtl: fresh ? 0 : 60, cacheEverything: !fresh } });
  if (!r.ok) throw new Error("upstream " + r.status);
  return r;
}

// ── 게시판 목록
async function listPage(page, fresh) {
  const key = "p" + page;
  if (!fresh) { const hit = recall(key); if (hit) return hit; }
  const res = await upstream(`${BASE}/boardCnts/list.do?boardID=${BOARD}&m=${M}&s=news&page=${page}`, fresh);
  const text = await res.text();
  const rows = [], seen = new Set();
  for (const tr of text.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []) {
    const m = tr.match(new RegExp(`title="([^"]*)"[^>]*goView\\('${BOARD}','(\\d+)'`));
    const d = tr.match(/(\d{4}-\d{2}-\d{2})/);
    if (!m || !d || seen.has(m[2])) continue;
    seen.add(m[2]);
    rows.push({ seq: m[2], title: unescapeHtml(m[1]).trim(), date: d[1] });
  }
  remember(key, 60 * 1000, rows);
  return rows;
}

// date 이전(포함) 글이 나올 때까지 페이지를 읽는다 (4쪽씩 동시에, 요청 수 제한 때문에 최대 44쪽)
async function collectUntil(date, fresh, maxPages = 44) {
  const all = [];
  for (let p = 1; p <= maxPages; p += 4) {
    const pages = await Promise.all([0, 1, 2, 3].map(i => listPage(p + i, fresh && p === 1)));
    for (const rows of pages) {
      if (!rows.length) return all;
      all.push(...rows);
      if (rows[rows.length - 1].date < date) return all;
    }
  }
  return all;
}

async function findPosts(date, mode, fresh) {
  const rows = await collectUntil(date, fresh);
  if (mode === "prev") return rows.filter(r => r.date < date).slice(0, 1);
  if (mode === "next") return rows.filter(r => r.date > date).slice(-1);
  return rows.filter(r => r.date === date);
}

async function nearby(date) {
  const rows = await collectUntil(date, false);
  const older = rows.filter(r => r.date < date)[0] || null;
  const newer = rows.filter(r => r.date > date).slice(-1)[0] || null;
  return { older, newer };
}

async function monthDates(ym, fresh) {
  const hit = fresh ? undefined : recall("m" + ym);
  if (hit) return hit;
  const rows = await collectUntil(ym + "-01", fresh);
  const dates = [...new Set(rows.filter(r => r.date.startsWith(ym)).map(r => r.date))].sort();
  const now = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 7);    // 한국 시간 기준 이번 달
  remember("m" + ym, ym < now ? 6 * 3600 * 1000 : 60 * 1000, dates);              // 지난 달은 오래 기억
  return dates;
}

// ── 글 보기(첨부파일)
async function postFiles(seq) {
  const res = await upstream(`${BASE}/boardCnts/view.do?boardID=${BOARD}&boardSeq=${seq}&lev=0&searchType=null&statusYN=W&page=1&s=news&m=${M}&opType=N`, false);
  const text = await res.text();
  const files = [];
  const re = /<a href=['"](\/boardCnts\/fileDown\.do\?[^'"]*?fileSeq=([0-9a-zA-Z]+))['"][^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(text))) files.push({ fileSeq: m[2], name: unescapeHtml(m[3]).trim() });
  return files;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams;
  const path = url.pathname.replace(/\/+$/, "");
  try {
    if (path === "/api/ping") return json({ app: "cne-press-dashboard", cne: true, version: VERSION });

    if (path === "/api/recent") {
      const n = Math.max(1, Math.min(parseInt(q.get("limit") || "30", 10) || 30, 100));
      const fresh = !!q.get("fresh");
      let rows = [];
      for (let p = 1; p <= 11 && rows.length < n; p++) rows = rows.concat(await listPage(p, fresh && p === 1));
      return json({ posts: rows.slice(0, n) });
    }

    if (path === "/api/find") {
      const date = q.get("date") || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "날짜 형식이 올바르지 않습니다." }, 400);
      const mode = ["prev", "next"].includes(q.get("dir")) ? q.get("dir") : "exact";
      let posts = await findPosts(date, mode, false);
      if (!posts.length && mode === "exact") posts = await findPosts(date, mode, true);   // 방금 올라온 글일 수 있음
      const out = { posts };
      if (!posts.length) out.near = await nearby(date);
      return json(out);
    }

    if (path === "/api/month") {
      const ym = q.get("ym") || "";
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) return json({ error: "월 형식이 올바르지 않습니다." }, 400);
      return json({ dates: await monthDates(ym, !!q.get("fresh")) });
    }

    if (path === "/api/post") {
      const seq = q.get("seq") || "";
      if (!/^\d{3,12}$/.test(seq)) return json({ error: "글 번호가 올바르지 않습니다." }, 400);
      return json({ files: await postFiles(seq) });
    }

    if (path === "/api/file") {
      const fs = q.get("fileSeq") || "";
      if (!/^[0-9a-zA-Z]{8,64}$/.test(fs)) return json({ error: "파일 번호가 올바르지 않습니다." }, 400);
      const r = await upstream(`${BASE}/boardCnts/fileDown.do?m=${M}&s=news&fileSeq=${fs}`, false);
      return new Response(r.body, { status: 200, headers: { "Content-Type": "application/octet-stream", "Cache-Control": "no-store" } });
    }

    return json({ error: "not found" }, 404);
  } catch (e) {
    return json({ error: "충남에듀있슈에서 정보를 가져오지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, 502);
  }
}
