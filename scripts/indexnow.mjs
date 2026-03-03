/**
 * IndexNow — notify Bing of all URLs after a production build.
 * Run with: node scripts/indexnow.mjs
 */

const KEY = "6fc4a3c06d2c444aa371db2f55a450c8";
const HOST = "luminx.nl";
const INDEXNOW_URL = "https://api.indexnow.org/indexnow";

async function fetchSitemapUrls() {
  // Try sitemap-index.xml first, fall back to sitemap.xml
  const candidates = [
    `https://${HOST}/sitemap-index.xml`,
    `https://${HOST}/sitemap.xml`,
  ];

  for (const sitemapUrl of candidates) {
    console.log("Trying sitemap:", sitemapUrl);
    const res = await fetch(sitemapUrl);
    if (!res.ok) {
      console.log(`  → ${res.status} ${res.statusText}, skipping`);
      continue;
    }

    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>(https?[^<]+)<\/loc>/g)].map(
      (m) => m[1].trim()
    );
    console.log(`  → Found ${locs.length} <loc> entries`);

    // If the first <loc> values are .xml files, this is an index — fetch children
    const childXmlUrls = locs.filter((u) => u.endsWith(".xml"));
    if (childXmlUrls.length > 0) {
      const pageUrls = [];
      for (const childUrl of childXmlUrls) {
        console.log("Fetching child sitemap:", childUrl);
        const childRes = await fetch(childUrl);
        if (!childRes.ok) {
          console.warn(`  → ${childRes.status} ${childRes.statusText}, skipping`);
          continue;
        }
        const childXml = await childRes.text();
        const childLocs = [...childXml.matchAll(/<loc>(https?[^<]+)<\/loc>/g)].map(
          (m) => m[1].trim()
        );
        console.log(`  → ${childLocs.length} URLs`);
        pageUrls.push(...childLocs);
      }
      return [...new Set(pageUrls)];
    }

    // Plain sitemap — all <loc> values are page URLs
    return [...new Set(locs)];
  }

  throw new Error("Could not fetch any sitemap");
}

async function main() {
  const urls = await fetchSitemapUrls();
  console.log(`\nTotal URLs to submit: ${urls.length}`);
  urls.forEach((u) => console.log(" ", u));

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  };

  console.log("\nPOSTing to IndexNow...");
  const res = await fetch(INDEXNOW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  const responseText = await res.text().catch(() => "");
  console.log(`IndexNow response: ${res.status} ${res.statusText}`);
  if (responseText) console.log("Response body:", responseText);

  if (res.status === 200 || res.status === 202) {
    console.log("URLs submitted successfully.");
  } else if (res.status === 429) {
    console.warn("Rate limited by IndexNow — will retry on next deploy.");
  } else if (res.status === 403) {
    console.warn("403 Forbidden — site not yet verified in Bing Webmaster Tools.");
    console.warn("Verify luminx.nl at https://www.bing.com/webmasters and retry.");
    // Don't fail the workflow — site verification is a one-time manual step
  } else {
    console.error(`Unexpected status ${res.status} — check key file and host.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
