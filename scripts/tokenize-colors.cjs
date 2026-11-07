// Replace hard-coded Tailwind palette colours with ClaimGuard X theme tokens.
//   node scripts/tokenize-colors.cjs <file.tsx> [...]
// Mapping follows DESIGN.md: neutrals → background/card/muted/border, indigo-like → beam/primary,
// red → critical, orange → high, amber/yellow → medium, blue/sky → low, green/emerald → ok.
const fs = require("fs");

const SEV = { red: "critical", rose: "critical", orange: "high", amber: "medium", yellow: "medium", blue: "low", sky: "low" };
const OK = new Set(["emerald", "green", "teal"]);
const ACCENT = new Set(["indigo", "violet", "purple", "cyan", "pink", "fuchsia"]);
const NEUTRAL = new Set(["slate", "gray", "zinc", "neutral", "stone"]);

function map(prop, fam, shade, op) {
  const n = Number(shade);
  const hasOp = !!op;
  if (NEUTRAL.has(fam)) {
    if (prop === "bg") return n >= 950 ? "bg-background" : n >= 900 ? "bg-card" : n >= 800 ? "bg-muted" : "bg-secondary";
    if (prop === "text") return n <= 200 ? "text-foreground" : "text-muted-foreground";
    if (["border", "divide", "ring", "outline"].includes(prop)) return n >= 800 ? `${prop}-border` : `${prop}-border-strong`;
    return null;
  }
  if (ACCENT.has(fam)) {
    if (prop === "bg") return !hasOp && n >= 500 && n <= 700 ? "bg-primary" : "bg-accent";
    if (prop === "text") return "text-beam-fg";
    if (["border", "ring", "outline"].includes(prop)) return `${prop}-beam/40`;
    return null;
  }
  if (OK.has(fam)) {
    if (prop === "bg") return !hasOp && n >= 400 && n <= 700 ? "bg-ok" : "bg-ok/10";
    if (prop === "text") return "text-ok-fg";
    if (["border", "ring", "outline"].includes(prop)) return `${prop}-ok/40`;
    return null;
  }
  const s = SEV[fam];
  if (s) {
    if (prop === "bg") return !hasOp && n >= 400 && n <= 700 ? `bg-sev-${s}` : `bg-sev-${s}-bg`;
    if (prop === "text") return `text-sev-${s}-fg`;
    if (["border", "ring", "outline"].includes(prop)) return `${prop}-sev-${s}/40`;
    if (prop === "decoration") return `decoration-sev-${s}`;
  }
  return null;
}

const RE = /(?<=^|[\s"'`{(])((?:[a-z0-9-]+:)*)(bg|text|border|ring|outline|divide|decoration)-(slate|gray|zinc|neutral|stone|indigo|violet|purple|cyan|pink|fuchsia|red|rose|orange|amber|yellow|blue|sky|emerald|green|teal)-(\d{2,3})(\/\d+)?(?=$|[\s"'`})])/g;

for (const file of process.argv.slice(2)) {
  let src = fs.readFileSync(file, "utf8");
  let count = 0;
  src = src.replace(RE, (m, variants, prop, fam, shade, op) => {
    const r = map(prop, fam, shade, op);
    if (!r) return m;
    count++;
    return variants + r;
  });
  src = src.replace(/(?<=^|[\s"'`{(])((?:[a-z0-9-]+:)*)text-white(?=$|[\s"'`})])/g, (m, v) => {
    count++;
    return v + "text-foreground";
  });
  // Text on a filled primary/severity surface needs the matching foreground, not the page foreground.
  src = src.replace(/(["'`])([^"'`]*\bbg-primary\b[^"'`]*)\1/g, (m, q, cls) => q + cls.replace(/\btext-foreground\b/g, "text-primary-foreground") + q);
  src = src.replace(/(["'`])([^"'`]*\bbg-(?:sev-(?:critical|high|medium|low)|ok)\b(?!-|\/)[^"'`]*)\1/g, (m, q, cls) => q + cls.replace(/\btext-foreground\b/g, "text-background") + q);
  fs.writeFileSync(file, src);
  const left = src.match(/\b(?:bg|text|border)-(?:slate|gray|zinc|indigo|red|orange|amber|blue|emerald|green|pink|purple|violet|yellow|sky)-\d{2,3}/g) ?? [];
  console.log(`${file}: ${count} replaced, ${left.length} left${left.length ? " → " + [...new Set(left)].join(" ") : ""}`);
}
