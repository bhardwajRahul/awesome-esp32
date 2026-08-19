/**
 * Harvest X (Twitter) bookmarks into data/bookmarks.json.
 *
 * Opens a real Chrome window on a dedicated persistent profile
 * (%LOCALAPPDATA%\awesome-esp32-x-profile, NOT your daily Chrome profile).
 * First run: log into x.com in that window, the script waits and resumes
 * alone. It then scrolls the bookmarks timeline and captures the GraphQL
 * responses the page itself makes, so no API keys or query IDs are needed.
 *
 * Run: npm run harvest   (from this directory; tsx, per repo convention)
 */
import { chromium } from "patchright";
import type { Page, Response } from "patchright";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const PROFILE_DIR = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
  "awesome-esp32-x-profile",
);
const OUT_DIR = path.join(import.meta.dirname, "data");
const OUT_FILE = path.join(OUT_DIR, "bookmarks.json");
const BOOKMARKS_URL = "https://x.com/i/bookmarks";
const LOGIN_WAIT_MS = 45 * 60 * 1000; // generous: one manual login allowed
const STALL_ROUNDS = 8; // consecutive scrolls with nothing new = end of list

interface Bookmark {
  id: string;
  url: string;
  author: string;
  authorName: string;
  date: string;
  text: string;
  links: string[];
  quotedUrl?: string;
}

const seen = new Map<string, Bookmark>();

function extractTweet(result: any): Bookmark | null {
  const tweet = result?.__typename === "TweetWithVisibilityResults" ? result.tweet : result;
  const legacy = tweet?.legacy;
  const user =
    tweet?.core?.user_results?.result?.legacy ??
    tweet?.core?.user_results?.result?.core;
  if (!legacy?.id_str || !user) return null;
  const screenName = user.screen_name ?? user.screen_name_lowercase ?? "unknown";
  const links: string[] = (legacy.entities?.urls ?? [])
    .map((u: any) => u.expanded_url)
    .filter(Boolean);
  const noteText =
    tweet?.note_tweet?.note_tweet_results?.result?.text ?? legacy.full_text ?? "";
  const quoted = tweet?.quoted_status_result?.result;
  const quotedTweet = quoted ? extractTweet(quoted) : null;
  return {
    id: legacy.id_str,
    url: `https://x.com/${screenName}/status/${legacy.id_str}`,
    author: screenName,
    authorName: user.name ?? screenName,
    date: legacy.created_at ?? "",
    text: noteText,
    links,
    ...(quotedTweet ? { quotedUrl: quotedTweet.url } : {}),
  };
}

function ingestResponse(json: any): number {
  const instructions =
    json?.data?.bookmark_timeline_v2?.timeline?.instructions ?? [];
  let added = 0;
  for (const inst of instructions) {
    for (const entry of inst.entries ?? []) {
      const result = entry?.content?.itemContent?.tweet_results?.result;
      const bm = result ? extractTweet(result) : null;
      if (bm && !seen.has(bm.id)) {
        seen.set(bm.id, bm);
        added++;
      }
    }
  }
  return added;
}

async function onResponse(res: Response) {
  if (!/\/i\/api\/graphql\/[^/]+\/Bookmark/.test(res.url())) return;
  try {
    const added = ingestResponse(await res.json());
    if (added) console.log(`captured ${added} new (total ${seen.size})`);
  } catch {
    /* non-JSON or aborted response, ignore */
  }
}

async function waitForTimeline(page: Page): Promise<void> {
  const deadline = Date.now() + LOGIN_WAIT_MS;
  let lastLogged = "";
  while (Date.now() < deadline) {
    if (seen.size > 0) return;
    const url = page.url();
    if (url !== lastLogged) {
      console.log(`at ${url}`);
      lastLogged = url;
    }
    // Never navigate while a login flow is on screen.
    const inLogin = /login|flow|logout|signup/.test(url);
    const onBookmarks = url.startsWith(BOOKMARKS_URL);
    if (!inLogin && !onBookmarks) {
      // Logged in but landed elsewhere (e.g. /home after auth): steer back.
      await page.goto(BOOKMARKS_URL).catch(() => {});
    } else if (onBookmarks) {
      // On the page but nothing captured yet: nudge a refresh every ~30s in
      // case the timeline request fired before we were listening.
      await page.waitForTimeout(27000);
      if (seen.size === 0) await page.reload().catch(() => {});
    }
    await page.waitForTimeout(3000);
  }
  throw new Error("Timed out waiting for login / bookmarks timeline.");
}

async function scrollToEnd(page: Page): Promise<void> {
  let stalled = 0;
  let last = seen.size;
  while (stalled < STALL_ROUNDS) {
    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(1200);
    if (seen.size === last) stalled++;
    else {
      stalled = 0;
      last = seen.size;
    }
  }
}

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: "chrome",
  headless: false,
  viewport: null,
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
page.on("response", onResponse);

await page.goto(BOOKMARKS_URL).catch(() => {});
await waitForTimeline(page);
console.log("Timeline live, scrolling...");
await scrollToEnd(page);

fs.mkdirSync(OUT_DIR, { recursive: true });
const all = [...seen.values()];
fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2));
console.log(`Saved ${all.length} bookmarks to ${OUT_FILE}`);
await ctx.close();
