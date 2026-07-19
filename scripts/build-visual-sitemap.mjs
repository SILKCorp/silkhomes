#!/usr/bin/env node

/**
 * Build the compact SILK Homes visual sitemap.
 *
 * The script captures the complete rendered height of every public HTML page,
 * converts the captures to AVIF, and writes a clickable visual-sitemap.html
 * plus a single AVIF contact sheet. It intentionally uses the rendered pages
 * as the source of truth, so the map also works as a lightweight visual QA
 * pass.
 *
 * Usage:
 *   node scripts/build-visual-sitemap.mjs
 *   node scripts/build-visual-sitemap.mjs --base-url http://127.0.0.1:8765
 *
 * A local server must already be serving the repository. Playwright can be
 * supplied through PLAYWRIGHT_PATH when it is not installed in this repo.
 */

import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFile = promisify(execFileCallback);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_BASE_URL = "http://127.0.0.1:8765";
const CAPTURE_WIDTH = 1440;
const CAPTURE_VIEWPORT_HEIGHT = 900;
const AVIF_QUALITY = 76;
const OUTPUT_HTML = path.join(ROOT, "visual-sitemap.html");
const OUTPUT_MANIFEST = path.join(ROOT, "sitemap", "manifest.json");
const OUTPUT_CONTACT_SHEET = path.join(ROOT, "sitemap", "visual-sitemap.avif");
const OUTPUT_THUMBS = path.join(ROOT, "sitemap", "thumbs");

const GROUP_ORDER = [
    "Root",
    "Locations",
    "Pages",
    "Crew",
    "Crew · Locations",
];

function argumentValue(name, fallback) {
    const index = process.argv.indexOf(name);
    return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function getBaseUrl() {
    return (argumentValue("--base-url", process.env.SILK_BASE_URL || DEFAULT_BASE_URL)).replace(/\/$/, "");
}

function hasFlag(name) {
    return process.argv.includes(name);
}

async function loadPlaywright() {
    const candidates = [
        process.env.PLAYWRIGHT_PATH,
        "playwright",
        "/home/mrh/repos/focuschef/Emmy/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.mjs",
    ].filter(Boolean);

    const failures = [];
    for (const candidate of candidates) {
        try {
            return await import(candidate.startsWith("/") ? pathToFileURL(candidate).href : candidate);
        } catch (error) {
            failures.push(`${candidate}: ${error.message}`);
        }
    }

    throw new Error(`Could not load Playwright. Set PLAYWRIGHT_PATH to its entry point.\n${failures.join("\n")}`);
}

async function walkHtml(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.name.startsWith(".")) continue;
        const absolutePath = path.join(directory, entry.name);
        const relativePath = path.posix.join(relativeDirectory, entry.name);

        if (entry.isDirectory()) {
            files.push(...await walkHtml(absolutePath, relativePath));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
            files.push(relativePath);
        }
    }

    return files;
}

function groupFor(relativePath) {
    if (relativePath.startsWith("locations/")) return "Locations";
    if (relativePath.startsWith("pages/crew/landscaping/")) return "Crew · Locations";
    if (relativePath.startsWith("pages/crew/")) return "Crew";
    if (relativePath.startsWith("pages/")) return "Pages";
    return "Root";
}

function slugFor(relativePath) {
    return relativePath
        .replace(/\.html$/i, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "home";
}

function displayPath(relativePath) {
    return relativePath === "index.html" ? "/" : `/${relativePath}`;
}

function cleanTitle(title, relativePath) {
    const fallback = relativePath === "index.html" ? "Home" : path.basename(relativePath, ".html");
    const value = (title || fallback).replace(/\s+/g, " ").trim();
    const cleaned = value
        .replace(/^SILK Homes\s*[-–—|:]\s*/i, "")
        .replace(/\s*[-–—|:]\s*SILK Homes$/i, "")
        .trim();

    return cleaned || fallback;
}

function prettyPath(relativePath) {
    return displayPath(relativePath)
        .replace(/\.html$/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function encodePagePath(relativePath) {
    return relativePath.split("/").map(encodeURIComponent).join("/");
}

async function convertToAvif(source, destination) {
    await execFile("magick", [
        source,
        "-strip",
        "-quality",
        String(AVIF_QUALITY),
        destination,
    ]);
}

async function readImageDimensions(source) {
    const { stdout } = await execFile("magick", ["identify", "-format", "%w %h", source]);
    const [width, height] = stdout.trim().split(/\s+/).map(Number);
    return { width, height };
}

async function waitForPageToSettle(page) {
    await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;

        document.querySelectorAll("img").forEach((image) => {
            image.loading = "eager";
        });

        const step = Math.max(window.innerHeight - 120, 160);
        for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 90));
        }
        window.scrollTo(0, 0);

        const imageLoads = [...document.images].map((image) => {
            if (image.complete && image.naturalWidth > 0) return Promise.resolve();
            return new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
                setTimeout(resolve, 1200);
            });
        });

        await Promise.all(imageLoads);
    });
    await page.waitForTimeout(350);
}

function renderVisualSitemap(pages, generatedAt) {
    const groups = GROUP_ORDER
        .map((name) => ({ name, pages: pages.filter((page) => page.group === name) }))
        .filter((group) => group.pages.length);

    const sections = groups.map((group) => `
        <section class="map-section" aria-labelledby="group-${slugFor(group.name)}">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">${escapeHtml(group.name)}</p>
                    <h2 id="group-${slugFor(group.name)}">${group.pages.length} ${group.pages.length === 1 ? "page" : "pages"}</h2>
                </div>
                <span class="section-rule" aria-hidden="true"></span>
            </div>
            <div class="page-grid">
                ${group.pages.map((page) => `
                    <a class="page-card" data-page-card data-search="${escapeHtml(`${page.title} ${page.relativePath} ${page.group}`.toLowerCase())}" href="${escapeHtml(encodePagePath(page.relativePath))}">
                        <div class="thumb-frame">
                            <img src="sitemap/thumbs/${escapeHtml(page.thumbnail)}" alt="Full-page rendered thumbnail of ${escapeHtml(page.title)}" width="${page.width || CAPTURE_WIDTH}" height="${page.height || CAPTURE_VIEWPORT_HEIGHT}" loading="eager" decoding="async">
                            <span class="page-number">${String(page.number).padStart(2, "0")}</span>
                        </div>
                        <div class="card-copy">
                            <h3>${escapeHtml(page.title)}</h3>
                            <span class="card-path">${escapeHtml(prettyPath(page.relativePath))}</span>
                        </div>
                    </a>`).join("")}
            </div>
        </section>`).join("\n");

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="description" content="Compact visual sitemap for the SILK Homes website.">
    <title>SILK Homes — Visual Sitemap</title>
    <style>
        :root {
            color-scheme: light;
            --ink: #18382a;
            --muted: #67746b;
            --paper: #f7f2e9;
            --panel: #fffdf8;
            --line: #d9d0c1;
            --gold: #b58a3c;
            --green-soft: #e4ece2;
            --shadow: 0 16px 38px rgba(24, 56, 42, 0.1);
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
            margin: 0;
            background:
                radial-gradient(circle at 94% 0%, rgba(181, 138, 60, 0.16), transparent 28rem),
                linear-gradient(180deg, #f1eadf 0, var(--paper) 22rem, #fbfaf5 100%);
            color: var(--ink);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            min-height: 100vh;
        }

        a { color: inherit; }
        .shell { width: min(1680px, calc(100% - 48px)); margin: 0 auto; padding: 42px 0 76px; }
        .masthead { display: flex; justify-content: space-between; align-items: end; gap: 24px; padding-bottom: 30px; border-bottom: 1px solid var(--line); }
        .brandline { display: flex; align-items: center; gap: 12px; color: var(--gold); font-weight: 800; letter-spacing: .22em; font-size: .78rem; }
        .mark { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--gold); border-radius: 50% 50% 50% 0; transform: rotate(-18deg); font-size: 1rem; }
        h1, h2, h3, p { margin: 0; }
        h1 { max-width: 760px; margin-top: 16px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(2.4rem, 5vw, 5.5rem); font-weight: 400; letter-spacing: -.045em; line-height: .96; }
        .intro { max-width: 650px; margin-top: 18px; color: var(--muted); font-size: 1rem; line-height: 1.7; }
        .meta { min-width: 285px; padding: 18px; border: 1px solid var(--line); background: rgba(255,253,248,.72); box-shadow: var(--shadow); }
        .meta strong { display: block; font-size: 1.6rem; font-weight: 700; }
        .meta span { display: block; margin-top: 5px; color: var(--muted); font-size: .82rem; line-height: 1.45; }
        .toolbar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 22px 0 36px; padding: 12px; border: 1px solid rgba(217,208,193,.9); background: rgba(247,242,233,.92); backdrop-filter: blur(14px); }
        .search { flex: 1 1 320px; min-height: 42px; border: 1px solid var(--line); border-radius: 2px; padding: 0 14px; background: var(--panel); color: var(--ink); font: inherit; }
        .search:focus { outline: 2px solid rgba(181, 138, 60, .45); outline-offset: 2px; }
        .toolbar-note { color: var(--muted); font-size: .82rem; }
        .contact-link { color: var(--gold); font-size: .82rem; font-weight: 700; text-decoration: none; }
        .contact-link:hover { text-decoration: underline; }
        .map-section { margin-top: 36px; }
        .section-heading { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
        .eyebrow { color: var(--gold); font-size: .72rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
        .section-heading h2 { margin-top: 4px; font-family: Georgia, "Times New Roman", serif; font-size: 1.55rem; font-weight: 400; }
        .section-rule { flex: 1; height: 1px; background: var(--line); }
        .page-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
        .page-card { min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 3px; background: var(--panel); text-decoration: none; box-shadow: 0 4px 14px rgba(24,56,42,.045); transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .page-card:hover, .page-card:focus-visible { border-color: var(--gold); box-shadow: var(--shadow); transform: translateY(-4px); }
        .page-card:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
        .thumb-frame { position: relative; display: flex; align-items: flex-start; justify-content: center; height: clamp(300px, 34vw, 440px); overflow: hidden; padding: 10px 14px; background: var(--green-soft); }
        .thumb-frame::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
        .thumb-frame img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: top center; transition: transform .35s ease; }
        .page-card:hover .thumb-frame img { transform: scale(1.015); }
        .page-number { position: absolute; top: 8px; left: 8px; display: grid; place-items: center; min-width: 27px; height: 24px; padding: 0 6px; border-radius: 2px; background: rgba(24,56,42,.88); color: #fffdf8; font-size: .68rem; font-weight: 800; letter-spacing: .06em; }
        .card-copy { padding: 11px 12px 13px; }
        .card-copy h3 { overflow: hidden; font-family: Georgia, "Times New Roman", serif; font-size: 1rem; font-weight: 400; line-height: 1.18; text-overflow: ellipsis; white-space: nowrap; }
        .card-path { display: block; overflow: hidden; margin-top: 5px; color: var(--muted); font-size: .7rem; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
        .empty { display: none; padding: 24px; border: 1px dashed var(--line); color: var(--muted); text-align: center; }
        .footer-note { margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: .78rem; line-height: 1.6; }
        .footer-note code { color: var(--ink); }

        @media (max-width: 1280px) { .page-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
        @media (max-width: 1020px) { .masthead { align-items: start; flex-direction: column; } .meta { min-width: 0; width: 100%; } .page-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 720px) { .shell { width: min(100% - 28px, 560px); padding-top: 26px; } .page-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .toolbar { margin-bottom: 24px; } .section-heading { margin-top: 28px; } .card-copy { padding: 9px 10px 11px; } .card-copy h3 { font-size: .92rem; } }
        @media (max-width: 390px) { .page-grid { grid-template-columns: 1fr; } }
        @media print { .toolbar { position: static; } .page-card { break-inside: avoid; box-shadow: none; } .page-card:hover { transform: none; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
    </style>
</head>
<body>
    <main class="shell">
        <header class="masthead">
            <div>
                <div class="brandline"><span class="mark" aria-hidden="true">✦</span><span>SILK HOMES</span></div>
                <h1>Visual sitemap</h1>
                <p class="intro">A compact, rendered map of every current HTML page. Each thumbnail contains the complete page height, scaled to fit for comparison, and each card opens the corresponding page for review.</p>
            </div>
            <div class="meta" aria-label="Sitemap details">
                <strong>${pages.length} pages</strong>
                <span>${groups.length} page groups · full-page AVIF thumbnails</span>
                <span>Generated ${escapeHtml(generatedAt)}</span>
            </div>
        </header>

        <div class="toolbar" role="search">
            <label class="visually-hidden" for="page-search">Filter pages</label>
            <input class="search" id="page-search" type="search" placeholder="Filter by page title or path…" autocomplete="off">
            <span class="toolbar-note" id="result-count">Showing ${pages.length} pages</span>
            <a class="contact-link" href="sitemap/visual-sitemap.avif" target="_blank" rel="noopener">Open compact AVIF sheet ↗</a>
        </div>

        <div id="page-map">
            ${sections}
            <p class="empty" id="empty-state">No pages match that filter.</p>
        </div>

        <p class="footer-note">Generated from the repository’s public <code>.html</code> files by <code>scripts/build-visual-sitemap.mjs</code>. The sitemap page itself is excluded to avoid a recursive thumbnail.</p>
    </main>
    <script>
        (() => {
            const input = document.querySelector('#page-search');
            const cards = [...document.querySelectorAll('[data-page-card]')];
            const sections = [...document.querySelectorAll('.map-section')];
            const count = document.querySelector('#result-count');
            const empty = document.querySelector('#empty-state');
            const update = () => {
                const term = input.value.trim().toLowerCase();
                let visible = 0;
                cards.forEach((card) => {
                    const matches = !term || card.dataset.search.includes(term);
                    card.hidden = !matches;
                    if (matches) visible += 1;
                });
                sections.forEach((section) => {
                    section.hidden = !section.querySelector('[data-page-card]:not([hidden])');
                });
                empty.style.display = visible ? 'none' : 'block';
                count.textContent = \`Showing \${visible} \${visible === 1 ? 'page' : 'pages'}\`;
            };
            input.addEventListener('input', update);
        })();
    </script>
</body>
</html>
`.replace(/[ \t]+$/gm, "");
}

async function main() {
    const baseUrl = getBaseUrl();
    const includeContactSheet = !hasFlag("--no-contact-sheet");
    const pagePaths = (await walkHtml(ROOT)).filter((relativePath) => relativePath !== "visual-sitemap.html");
    const temporaryDirectory = await mkdtemp(path.join("/tmp", "silk-visual-sitemap-"));
    const { chromium } = await loadPlaywright();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: CAPTURE_WIDTH, height: CAPTURE_VIEWPORT_HEIGHT },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: "reduce",
    });

    await mkdir(OUTPUT_THUMBS, { recursive: true });
    const pages = [];

    try {
        for (const [index, relativePath] of pagePaths.entries()) {
            const browserPage = await context.newPage();
            const errors = [];
            browserPage.on("pageerror", (error) => errors.push(error.message));
            browserPage.on("console", (message) => {
                if (message.type() === "error") errors.push(message.text());
            });

            const url = `${baseUrl}/${encodePagePath(relativePath)}`;
            const temporaryPng = path.join(temporaryDirectory, `${String(index).padStart(3, "0")}.png`);
            const thumbnail = `${slugFor(relativePath)}.avif`;
            const destination = path.join(OUTPUT_THUMBS, thumbnail);
            let status = 0;
            let title = "";
            let captureError = "";
            let dimensions = { width: CAPTURE_WIDTH, height: CAPTURE_VIEWPORT_HEIGHT };

            try {
                const response = await browserPage.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
                status = response?.status() || 0;
                await waitForPageToSettle(browserPage);
                title = await browserPage.title();
                await browserPage.screenshot({ path: temporaryPng, type: "png", fullPage: true });
                dimensions = await readImageDimensions(temporaryPng);
                await convertToAvif(temporaryPng, destination);
            } catch (error) {
                captureError = error.message;
            }

            pages.push({
                number: index + 1,
                relativePath,
                title: cleanTitle(title, relativePath),
                group: groupFor(relativePath),
                thumbnail,
                width: dimensions.width,
                height: dimensions.height,
                status,
                ok: Boolean(!captureError && status >= 200 && status < 400),
                errorCount: errors.length,
                error: captureError,
            });

            await browserPage.close();
            const statusLabel = captureError ? `capture failed: ${captureError}` : `${status || "?"}${errors.length ? `, ${errors.length} console errors` : ""}`;
            console.log(`[${String(index + 1).padStart(2, "0")}/${pagePaths.length}] ${relativePath} — ${statusLabel}`);
        }

        pages.sort((a, b) => {
            const groupDifference = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
            return groupDifference || a.relativePath.localeCompare(b.relativePath);
        });
        pages.forEach((page, index) => {
            page.number = index + 1;
        });

        const generatedAt = new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "America/New_York",
        }).format(new Date());
        const publicPages = pages.map(({ error, ...page }) => page);
        await writeFile(OUTPUT_MANIFEST, `${JSON.stringify({ generatedAt, baseUrl, pages: publicPages }, null, 2)}\n`);
        await writeFile(OUTPUT_HTML, renderVisualSitemap(pages, generatedAt));

        if (includeContactSheet) {
            const sheetPage = await context.newPage({ viewport: { width: 1680, height: 1000 } });
            const sheetUrl = `${baseUrl}/visual-sitemap.html`;
            await sheetPage.goto(sheetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
            await sheetPage.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 30000 });
            await sheetPage.evaluate(async () => {
                await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
            });
            const cardScreenshots = [];
            const cards = sheetPage.locator("[data-page-card]");
            for (let index = 0; index < pages.length; index += 1) {
                const cardScreenshot = path.join(temporaryDirectory, `card-${String(index).padStart(3, "0")}.png`);
                await cards.nth(index).locator("img").evaluate((image) => image.decode().catch(() => undefined));
                await cards.nth(index).screenshot({ path: cardScreenshot, animations: "disabled" });
                cardScreenshots.push(cardScreenshot);
            }
            const temporarySheet = path.join(temporaryDirectory, "visual-sitemap.png");
            await execFile("magick", [
                "montage",
                ...cardScreenshots,
                "-tile",
                "6x",
                "-geometry",
                "+12+12",
                "-background",
                "#f7f2e9",
                temporarySheet,
            ]);
            await convertToAvif(temporarySheet, OUTPUT_CONTACT_SHEET);
            await sheetPage.close();
        }

        const failures = pages.filter((page) => !page.ok);
        console.log(`\nBuilt ${pages.length} page thumbnails at ${path.relative(ROOT, OUTPUT_THUMBS)}/`);
        console.log(`Wrote ${path.relative(ROOT, OUTPUT_HTML)} and ${path.relative(ROOT, OUTPUT_MANIFEST)}`);
        if (includeContactSheet) console.log(`Wrote ${path.relative(ROOT, OUTPUT_CONTACT_SHEET)}`);
        if (failures.length) {
            console.error(`\n${failures.length} page capture(s) need attention:`);
            failures.forEach((page) => console.error(`- ${page.relativePath}: ${page.error || `HTTP ${page.status}`}`));
            process.exitCode = 1;
        }
    } finally {
        await browser.close();
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
});
