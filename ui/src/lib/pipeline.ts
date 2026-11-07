import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkAccessibility } from "./checks/checkAccessibility";
import { checkLinks } from "./checks/checkLinks";
import { checkPerformance } from "./checks/checkPerformance";
import { capturePage } from "./checks/capturePage";
import { extractOffer, type OfferData } from "./checks/extractOffer";
import { launchBrowser, newContext, openPage, errorMessage } from "./checks/browser";
import { runClaimRules } from "./rules";
import { fileUrl, loadScan, scanDir, updateScan } from "./store";
import type { Finding, Frame } from "./types";

/**
 * The scan pipeline. Steps match SCAN_STEPS in the progress screen:
 *   0 claims (documents) · 1 landing page · 2 links + speed · 3 accessibility · 4 cross-check + evidence frames
 * Each check is isolated: a failing check becomes a warning, a blocked page stops the scan with status "blocked".
 */
export async function runScan(id: string): Promise<void> {
  const scan = await loadScan(id);
  if (!scan) return;
  const dir = scanDir(id);
  const t0 = Date.now();
  const warnings: string[] = [];
  const findings: Finding[] = [];
  const url = scan.landingUrl;
  const browser = await launchBrowser();

  try {
    // 0 · claims: read the product documents
    await updateScan(id, { step: 0 });
    let docsText = "";
    for (const name of scan.documents) {
      try {
        docsText += "\n" + (await pdfText(path.join(dir, "docs", name)));
      } catch (e) {
        warnings.push(`Could not read ${name}: ${errorMessage(e)}`);
      }
    }

    // 1 · landing page: capture + offer extraction
    await updateScan(id, { step: 1 });
    const cap = await capturePage(url, { browser, outDir: path.join(dir, "capture") });
    if (!cap.ok) {
      const blocked = /bot wall|captcha|blocked|HTTP 40[13]|HTTP 429/i.test(cap.error ?? "");
      await updateScan(id, {
        status: blocked ? "blocked" : "failed",
        error: blocked
          ? `${new URL(url).hostname} blocks automated visits (${cap.error}). Ask the web team to allowlist ClaimGuard X, or scan a staging URL.`
          : `We could not open the landing page: ${cap.error}. Check the URL and try again.`,
        durationMs: Date.now() - t0,
      });
      return;
    }
    const pageText = cap.data?.visibleText ?? "";
    const offerRes = await extractOffer(url, { browser });
    const offer: OfferData | null = offerRes.data ?? null;
    if (!offerRes.ok) warnings.push(`Offer extraction: ${offerRes.error}`);
    await writeFile(path.join(dir, "offer.json"), JSON.stringify(offer, null, 2));
    // Name the report after the product on the page when the page says what it is.
    if (offer?.product.brand || offer?.product.name) {
      await updateScan(id, {
        brand: offer.product.brand ?? scan.brand,
        campaign: stripPrefix(offer.product.name, offer.product.brand) || scan.campaign,
      });
    }

    // 2 · links + mobile speed
    await updateScan(id, { step: 2 });
    const [links, perf] = await Promise.all([checkLinks(url, { browser }), checkPerformance(url, { browser })]);
    for (const [name, r] of [["Links", links], ["Speed", perf]] as const) {
      if (r.ok) findings.push(...r.findings);
      else warnings.push(`${name} check: ${r.error}`);
    }

    // 3 · accessibility
    await updateScan(id, { step: 3 });
    const a11y = await checkAccessibility(url, { browser, device: "desktop" });
    if (a11y.ok) findings.push(...a11y.findings);
    else warnings.push(`Accessibility check: ${a11y.error}`);

    // 4 · cross-check ad ↔ page ↔ documents, then draw evidence frames
    await updateScan(id, { step: 4 });
    findings.push(
      ...runClaimRules({
        adText: scan.adText,
        pageText,
        offer,
        docsText,
        hasDocs: scan.documents.length > 0,
        productCategory: scan.productCategory,
        landingUrl: url,
      }),
    );
    for (const f of findings) f.evidence.source ??= "page";

    const shot = await captureAndLocate(browser, url, findings, path.join(dir, "page.png"));

    await updateScan(id, {
      status: "done",
      step: 5,
      findings,
      warnings,
      pageCapture: shot ? fileUrl(id, "page.png") : "",
      pageCaptureSize: shot ?? undefined,
      durationMs: Date.now() - t0,
    });
  } catch (e) {
    await updateScan(id, { status: "failed", error: `The scan stopped: ${errorMessage(e)}`, warnings, durationMs: Date.now() - t0 });
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Full-page desktop screenshot plus a % box for every finding we can locate on it. */
async function captureAndLocate(
  browser: import("playwright").Browser,
  url: string,
  findings: Finding[],
  out: string,
): Promise<{ w: number; h: number } | null> {
  const ctx = await newContext(browser, "desktop");
  try {
    const { page } = await openPage(ctx, url);
    await page.evaluate(() => window.scrollTo(0, 0));
    const W = page.viewportSize()?.width ?? 1366;
    const H = Math.min(12000, await page.evaluate(() => document.documentElement.scrollHeight));
    await mkdir(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, fullPage: true, clip: { x: 0, y: 0, width: W, height: H } });

    for (const f of findings) {
      const locate = f.evidence.details?.locate;
      const selector = f.evidence.selector?.split(",")[0]?.trim();
      let box: { x: number; y: number; width: number; height: number } | null = null;
      try {
        if (selector) box = await page.locator(selector).first().boundingBox({ timeout: 1500 });
        if (!box && typeof locate === "string" && locate.trim()) box = await locateText(page, locate.trim());
      } catch {
        box = null;
      }
      if (f.evidence.details && "locate" in f.evidence.details) delete f.evidence.details.locate;
      // Skip boxes that are missing, tiny, off the capture, or cover most of the page (e.g. <html>).
      if (!box || box.width < 2 || box.height < 2 || box.y > H || box.width * box.height > 0.5 * W * H) continue;
      const pad = 4;
      const frame: Frame = {
        target: "page",
        x: round(((box.x - pad) / W) * 100),
        y: round(((box.y - pad) / H) * 100),
        w: round(((box.width + pad * 2) / W) * 100),
        h: round(((box.height + pad * 2) / H) * 100),
      };
      f.evidence.frames = [...(f.evidence.frames ?? []), frame];
    }
    return { w: W, h: H };
  } catch {
    return null;
  } finally {
    await ctx.close();
  }
}

/** Box of the exact words on the page (not the whole paragraph), in page coordinates. */
async function locateText(page: import("playwright").Page, text: string) {
  return page.evaluate((needle) => {
    // Match case-insensitively; offsets stay valid because only case changes (no whitespace collapsing).
    const n = needle.toLowerCase();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const t = (node.textContent ?? "").toLowerCase();
      const i = t.indexOf(n);
      if (i < 0) continue;
      const el = node.parentElement;
      if (!el || !el.getClientRects().length) continue;
      const range = document.createRange();
      const len = (node.textContent ?? "").length;
      range.setStart(node, Math.min(i, len));
      range.setEnd(node, Math.min(i + n.length, len));
      const r = range.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
    }
    return null;
  }, text);
}

/** "GlowPure Hydra Cream 50 ml" minus brand "GlowPure" → "Hydra Cream 50 ml". */
function stripPrefix(name: string | null, brand: string | null): string | null {
  if (!name) return null;
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) return name.slice(brand.length).trim() || name;
  return name;
}

const round = (n: number) => Math.max(0, Math.round(n * 100) / 100);

async function pdfText(file: string): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await readFile(file)));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}
