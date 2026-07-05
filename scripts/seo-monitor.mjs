#!/usr/bin/env node
// Weekly SEO recovery monitor for tavadiena.lv.
//
// Always runs public checks (live pages, sitemap, robots, GSC verification
// file). When a Search Console service-account key is present it also talks
// to the GSC API: submits the sitemap, inspects key URLs' index state, and
// pulls impressions/clicks trend. Pure Node — no npm dependencies.
//
//   node scripts/seo-monitor.mjs            # human summary to stdout
//   node scripts/seo-monitor.mjs --json     # machine-readable JSON
//
// Key file (see docs/GSC-API-SETUP.md): ~/.config/tavadiena/gsc-sa.json
// or override with GSC_KEY=/path/to/key.json
import { readFileSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";

const SITE = "https://tavadiena.lv";
const GSC_PROPERTY = "sc-domain:tavadiena.lv"; // Domain property (per sites.list)
const KEY_PATH =
  process.env.GSC_KEY || `${homedir()}/.config/tavadiena/gsc-sa.json`;
const KEY_URLS = [
  `${SITE}/`,
  `${SITE}/varda-dienas`,
  `${SITE}/algu-kalkulators`,
  `${SITE}/darba-dienu-kalendars`,
];
const SAMPLE_PAGES = [
  "/",
  "/varda-dienas",
  "/varda-dienas/uldis",
  "/svetku-dienas/ligo-diena",
  "/aktualitates/ka-aprekinat-neto-algu-latvija-2025",
  "/temas/economy",
];

const out = { checkedAt: new Date().toISOString(), public: {}, gsc: null, problems: [] };

// ---------- public checks (no credentials) ----------
async function publicChecks() {
  const pages = [];
  for (const p of SAMPLE_PAGES) {
    const res = await fetch(SITE + p, { redirect: "manual" });
    const html = res.ok ? await res.text() : "";
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    const entry = {
      path: p,
      status: res.status,
      cacheControl: res.headers.get("cache-control") || "",
      title,
    };
    pages.push(entry);
    if (res.status !== 200) out.problems.push(`${p} returned ${res.status}`);
    if (/no-store/.test(entry.cacheControl))
      out.problems.push(`${p} is uncacheable again (no-store) — ISR regression?`);
  }

  const sm = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const locs = (sm.match(/<loc>/g) || []).length;
  const rawDiacritics = (sm.match(/<loc>[^<]*[āčēģīķļņšūž]/g) || []).length;
  if (rawDiacritics > 0)
    out.problems.push(`sitemap has ${rawDiacritics} un-encoded diacritic URLs`);

  const robots = await (await fetch(`${SITE}/robots.txt`)).text();
  if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`))
    out.problems.push("robots.txt missing/incorrect Sitemap line");

  const gscFile = await fetch(`${SITE}/google0dd71493e879703b.html`);
  if (gscFile.status !== 200)
    out.problems.push("GSC verification file no longer serves 200 — property may unverify!");

  out.public = { pages, sitemapUrls: locs, rawDiacriticUrls: rawDiacritics, gscFileOk: gscFile.status === 200 };
}

// ---------- GSC API (service account JWT flow) ----------
async function gscToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const jwt = `${unsigned}.${signer.sign(key.private_key, "base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function gscChecks() {
  if (!existsSync(KEY_PATH)) {
    out.gsc = { skipped: `no key at ${KEY_PATH} — see docs/GSC-API-SETUP.md` };
    return;
  }
  const key = JSON.parse(readFileSync(KEY_PATH, "utf8"));
  const token = await gscToken(key);
  const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const prop = encodeURIComponent(GSC_PROPERTY);

  // 1. (Re)submit the sitemap — idempotent.
  const feed = encodeURIComponent(`${SITE}/sitemap.xml`);
  const submit = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${prop}/sitemaps/${feed}`,
    { method: "PUT", headers: auth }
  );

  // 2. Sitemap status as Google sees it.
  const smStatus = await (
    await fetch(`https://www.googleapis.com/webmasters/v3/sites/${prop}/sitemaps/${feed}`, { headers: auth })
  ).json();

  // 3. Search analytics: last 28 full days, split into two 14-day halves for trend.
  const day = (offset) => new Date(Date.now() - offset * 86400e3).toISOString().slice(0, 10);
  const query = async (startDate, endDate) => {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${prop}/searchAnalytics/query`,
      { method: "POST", headers: auth, body: JSON.stringify({ startDate, endDate }) }
    );
    const body = await res.json();
    if (!res.ok) throw new Error(`searchAnalytics ${res.status}: ${body.error?.message}`);
    return body.rows?.[0] ?? { clicks: 0, impressions: 0 };
  };
  const prev = await query(day(30), day(17));
  const last = await query(day(16), day(3));

  // 4. Index state of the key pages.
  const inspections = [];
  for (const url of KEY_URLS) {
    const resp = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ inspectionUrl: url, siteUrl: GSC_PROPERTY }),
    });
    const res = await resp.json();
    if (!resp.ok) {
      inspections.push({ url, error: `${resp.status}: ${res.error?.message}` });
      continue;
    }
    const r = res.inspectionResult?.indexStatusResult ?? {};
    inspections.push({
      url,
      verdict: r.verdict,
      coverageState: r.coverageState,
      lastCrawlTime: r.lastCrawlTime,
    });
  }

  out.gsc = {
    sitemapResubmitted: submit.ok,
    sitemapStatus: {
      lastSubmitted: smStatus.lastSubmitted,
      lastDownloaded: smStatus.lastDownloaded,
      isPending: smStatus.isPending,
      errors: smStatus.errors,
      warnings: smStatus.warnings,
    },
    traffic: {
      previous14d: prev,
      last14d: last,
      impressionsTrend: prev.impressions
        ? `${(((last.impressions - prev.impressions) / prev.impressions) * 100).toFixed(1)}%`
        : "n/a (no baseline)",
    },
    inspections,
  };
  for (const i of inspections)
    if (i.verdict && i.verdict !== "PASS")
      out.problems.push(`${i.url}: ${i.coverageState ?? i.verdict}`);
}

await publicChecks();
try {
  await gscChecks();
} catch (e) {
  out.gsc = { error: String(e.message ?? e) };
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`SEO monitor — ${out.checkedAt}`);
  console.log(`Sitemap URLs: ${out.public.sitemapUrls}, GSC file OK: ${out.public.gscFileOk}`);
  for (const p of out.public.pages)
    console.log(`  ${p.status} ${p.path} [${p.cacheControl.split(",")[0]}] ${p.title.slice(0, 60)}`);
  if (out.gsc?.skipped) console.log(`GSC: ${out.gsc.skipped}`);
  else if (out.gsc?.error) console.log(`GSC error: ${out.gsc.error}`);
  else if (out.gsc) {
    console.log(`GSC sitemap: submitted=${out.gsc.sitemapResubmitted}, lastDownloaded=${out.gsc.sitemapStatus.lastDownloaded ?? "never"}`);
    console.log(`Traffic 14d: ${JSON.stringify(out.gsc.traffic.last14d)} (impressions trend ${out.gsc.traffic.impressionsTrend})`);
    for (const i of out.gsc.inspections)
      console.log(`  ${i.coverageState ?? i.verdict ?? "?"} — ${i.url} (crawled ${i.lastCrawlTime ?? "never"})`);
  }
  console.log(out.problems.length ? `PROBLEMS:\n  - ${out.problems.join("\n  - ")}` : "No problems detected.");
}
process.exitCode = out.problems.length ? 1 : 0;
