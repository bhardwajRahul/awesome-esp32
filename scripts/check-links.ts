/**
 * Verify every link in README.md still resolves; flag archived GitHub repos.
 * Exits 1 with a markdown report on stdout when anything is broken, so CI
 * can open an issue from the output. Run: bun scripts/check-links.ts
 */
const readme = await Bun.file(new URL("../README.md", import.meta.url)).text();
const urls = [...new Set([...readme.matchAll(/\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]))];

const token = process.env.GITHUB_TOKEN;
const problems: string[] = [];

async function checkGithubRepo(owner: string, repo: string, url: string): Promise<void> {
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 3000 * attempt));
    res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        "User-Agent": "awesome-esp32-linkcheck",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.status < 500 && res.status !== 429) break;
  }
  if (!res) return;
  if (res.status === 404) problems.push(`- ${url} : repository not found (404)`);
  else if (res.status === 403 || res.status === 429)
    // API rate limit (a genuinely forbidden repo reads as 404), not a dead link.
    console.error(`warning: rate-limited checking ${url}, skipped`);
  else if (!res.ok) problems.push(`- ${url} : GitHub API returned ${res.status}`);
  else if ((await res.json()).archived) problems.push(`- ${url} : repository is archived`);
}

async function checkPlain(url: string): Promise<void> {
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 403) res = await fetch(url, { redirect: "follow" });
    if (!res.ok) problems.push(`- ${url} : HTTP ${res.status}`);
  } catch (e) {
    problems.push(`- ${url} : ${(e as Error).message}`);
  }
}

await Promise.all(
  urls.map((url) => {
    const gh = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/);
    // Repo root links get the API treatment (existence + archived); deep
    // links (tree/blob) and non-GitHub links get a plain fetch.
    return gh && !/\/(tree|blob|releases|wiki)\//.test(url)
      ? checkGithubRepo(gh[1], gh[2], url)
      : checkPlain(url);
  }),
);

if (problems.length) {
  console.log(`${problems.length} broken link(s) in README.md:\n\n${problems.sort().join("\n")}`);
  process.exit(1);
}
console.log(`All ${urls.length} links OK.`);
