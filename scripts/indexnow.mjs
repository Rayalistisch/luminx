/**
 * IndexNow — notify Bing of all URLs after a production build.
 * Run with: node scripts/indexnow.mjs
 */

const KEY = "6fc4a3c06d2c444aa371db2f55a450c8";
const HOST = "luminx.nl";
const SITEMAP_URL = `https://${HOST}/sitemap-index.xml`;
const INDEXNOW_URL = "https://api.indexnow.org/indexnow";

async function fetchSitemapUrls() {
  const res = await fetch(SITEMAP_URL);
  const xml = await res.text();

  // Collect all <loc> values from sitemap index and child sitemaps
  const childSitemaps = [...xml.matchAll(/<loc>(https?[^<]+)<\/loc>/g)].map(
    (m) => m[1].trim()
  );

  const urls = [];
  for (const sitemapUrl of childSitemaps) {
    if (sitemapUrl.endsWith(".xml")) {
      const childRes = await fetch(sitemapUrl);
      const childXml = await childRes.text();
      const locs = [...childXml.matchAll(/<loc>(https?[^<]+)<\/loc>/g)].map(
        (m) => m[1].trim()
      );
      urls.push(...locs);
    } else {
      urls.push(sitemapUrl);
    }
  }

  return [...new Set(urls)];
}

async function main() {
  console.log("Fetching sitemap from", SITEMAP_URL);
  const urls = await fetchSitemapUrls();
  console.log(`Found ${urls.length} URL(s) to submit`);

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch(INDEXNOW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  console.log(`IndexNow response: ${res.status} ${res.statusText}`);

  if (res.status === 200 || res.status === 202) {
    console.log("URLs submitted successfully.");
  } else {
    const text = await res.text().catch(() => "");
    console.error("Submission failed:", text);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
