/**
 * Harvest X (Twitter) bookmarks into data/bookmarks.json.
 *
 * Opens a real Chrome window on a dedicated persistent profile
 * (%LOCALAPPDATA%\awesome-esp32-x-profile, NOT your daily Chrome profile).
 * First run: log into x.com in that window, the script waits and resumes
 * alone. It then scrolls the bookmarks timeline and captures the GraphQL
 * responses the page itself makes, so no API keys or query IDs are needed.
 *
 * The window is self-healing: close it by accident and it reopens within
 * seconds, keeping whatever was already captured. Captures are saved even
 * if the run ends early.
 *
 * Run: npm run harvest   (from this directory; tsx, per repo convention)
 */
import { chromium } from "patchright";
import type { BrowserContext, Page, Response } from "patchright";
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
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

function save(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify([...seen.values()], null, 2));
  console.log(`Saved ${seen.size} bookmarks to ${OUT_FILE}`);
}

let ctx: BrowserContext | null = null;
let page: Page | null = null;

async function openBrowser(): Promise<void> {
  ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: false,
    viewport: null,
  });
  ctx.on("close", () => {
    ctx = null;
    page = null;
  });
  page = ctx.pages()[0] ?? (await ctx.newPage());
  page.on("response", onResponse);
  await page.goto(BOOKMARKS_URL).catch(() => {});
  console.log("Chrome window open.");
}

/** Ensure a live page exists, relaunching the browser if it was closed. */
async function ensurePage(): Promise<Page | null> {
  try {
    if (!ctx) {
      console.log("Browser was closed, reopening...");
      await openBrowser();
      return page;
    }
    if (!page || page.isClosed()) {
      const other = ctx.pages().find((p) => !p.isClosed());
      page = other ?? (await ctx.newPage());
      page.on("response", onResponse);
      await page.goto(BOOKMARKS_URL).catch(() => {});
    }
    return page;
  } catch {
    ctx = null;
    page = null;
    return null;
  }
}

async function waitForTimeline(): Promise<void> {
  const deadline = Date.now() + LOGIN_WAIT_MS;
  let lastLogged = "";
  let ticks = 0;
  while (Date.now() < deadline) {
    if (seen.size > 0) return;
    try {
      const p = await ensurePage();
      if (!p) continue;
      const url = p.url();
      if (url !== lastLogged) {
        console.log(`at ${url}`);
        lastLogged = url;
      }
      // Never navigate while a login flow is on screen.
      const inLogin = /login|flow|logout|signup/.test(url);
      const onBookmarks = url.startsWith(BOOKMARKS_URL);
      if (!inLogin && !onBookmarks) {
        // Logged in but landed elsewhere (e.g. /home after auth): steer back.
        await p.goto(BOOKMARKS_URL).catch(() => {});
      } else if (onBookmarks && ++ticks % 10 === 0) {
        // On the page but nothing captured after ~30s: the timeline request
        // may have fired before we listened. Refresh.
        await p.reload().catch(() => {});
      }
    } catch {
      /* page died between checks; next ensurePage() recovers */
    }
    await sleep(3000);
  }
  throw new Error("Timed out waiting for login / bookmarks timeline.");
}

async function scrollToEnd(): Promise<void> {
  let stalled = 0;
  let last = seen.size;
  while (stalled < STALL_ROUNDS) {
    try {
      const p = await ensurePage();
      await p?.mouse.wheel(0, 2400);
    } catch {
      /* recovered next round */
    }
    await sleep(1200);
    if (seen.size === last) stalled++;
    else {
      stalled = 0;
      last = seen.size;
    }
  }
}

try {
  await openBrowser();
  await waitForTimeline();
  console.log("Timeline live, scrolling...");
  await scrollToEnd();
} finally {
  if (seen.size > 0) save();
  await ctx?.close().catch(() => {});
}
if (seen.size === 0) {
  console.error("Nothing captured.");
  process.exit(2);
}
