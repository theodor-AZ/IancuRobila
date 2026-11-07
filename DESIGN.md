---
name: ClaimGuard X
description: "Find the flaws. Prove the risks. Fix the campaign."
colors:
  console-ground: "oklch(0.155 0.02 252)"
  console-panel: "oklch(0.195 0.022 252)"
  console-popover: "oklch(0.235 0.025 252)"
  console-muted: "oklch(0.23 0.022 252)"
  console-secondary: "oklch(0.25 0.025 252)"
  beam-wash: "oklch(0.27 0.035 230)"
  hairline: "oklch(0.3 0.025 252)"
  hairline-strong: "oklch(0.4 0.03 250)"
  input-stroke: "oklch(0.34 0.028 252)"
  readout: "oklch(0.94 0.01 245)"
  readout-muted: "oklch(0.73 0.022 248)"
  beam: "oklch(0.82 0.12 205)"
  beam-fg: "oklch(0.85 0.11 205)"
  on-beam: "oklch(0.18 0.03 240)"
  clear: "oklch(0.78 0.15 155)"
  clear-fg: "oklch(0.82 0.13 155)"
  destructive: "oklch(0.7 0.19 25)"
  sev-critical: "oklch(0.67 0.21 25)"
  sev-critical-fg: "oklch(0.76 0.16 25)"
  sev-critical-bg: "oklch(0.67 0.21 25 / 0.16)"
  sev-high: "oklch(0.76 0.16 55)"
  sev-high-fg: "oklch(0.82 0.13 60)"
  sev-high-bg: "oklch(0.76 0.16 55 / 0.15)"
  sev-medium: "oklch(0.87 0.15 95)"
  sev-medium-fg: "oklch(0.89 0.13 95)"
  sev-medium-bg: "oklch(0.87 0.15 95 / 0.13)"
  sev-low: "oklch(0.74 0.1 240)"
  sev-low-fg: "oklch(0.8 0.08 240)"
  sev-low-bg: "oklch(0.74 0.1 240 / 0.15)"
  scan-grid: "oklch(0.82 0.12 205 / 0.06)"
typography:
  display:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\", \"zero\""
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: "2.375rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.375rem"
  body-small:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
    letterSpacing: "0.06em"
  measurement:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\", \"zero\""
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.beam}"
    textColor: "{colors.on-beam}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  button-outline:
    backgroundColor: "{colors.console-ground}"
    textColor: "{colors.readout}"
    rounded: "{rounded.lg}"
    height: "28px"
    padding: "0 10px"
  input:
    backgroundColor: "{colors.console-ground}"
    textColor: "{colors.readout}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
  severity-badge-critical:
    backgroundColor: "{colors.sev-critical-bg}"
    textColor: "{colors.sev-critical-fg}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "24px"
    padding: "0 8px"
  frame-number-active:
    backgroundColor: "{colors.sev-critical}"
    textColor: "{colors.console-ground}"
    rounded: "{rounded.xs}"
    height: "20px"
    width: "24px"
  filter-tab-selected:
    backgroundColor: "{colors.console-secondary}"
    textColor: "{colors.readout}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 10px"
  report-panel:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.readout}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  nav-link-active:
    backgroundColor: "{colors.console-secondary}"
    textColor: "{colors.readout}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
---

# Design System: ClaimGuard X

## Overview

**Creative North Star: "The Screening Console"**

ClaimGuard X looks like an airport X-ray screening console that writes a pentest report. The campaign goes through the scanner, and what comes out is an audit: a deep blue-black ground, neutrals tinted toward the scanner's blue, hairline 1px frames, small instrument corners, and one cyan beam that marks what you can touch and what is being scanned. Severity colours are the threat palette. They only appear where a threat is being reported.

Density is report density, not dashboard density. Screens are built from bordered sections and a findings register, not from score tiles or same-size cards. The only big number is the campaign score on its tick-marked dial. Everything that is a measurement (scores, IDs, timings, URLs, counts) is set in tabular Geist Mono, and everything else is Geist Sans.

Dark is the default theme (`<html class="dark">`). Light is the same system tuned for daylight and print, not a separate brand. Both themes are held to WCAG 2.2 AA contrast, and severity is never shown by colour alone.

**Key Characteristics:**
- Blue-black console ground, blue-tinted neutrals, one cyan beam accent.
- Four-step threat palette (critical, high, medium, low), each in solid, text and tint roles.
- Numbered threat frames with corner brackets drawn on the evidence captures, linked to matching rows in the findings table.
- Tabular mono for every measurement; sans for everything else.
- Hairline 1px borders and 2 to 8px radii; depth comes from tone, not shadows.

## Colors

A restrained console palette: tinted blue-black neutrals, one cyan beam, and a threat palette that only appears when it carries meaning. All values are OKLCH; the frontmatter records the dark (default) theme, and the light theme values live in the sidecar.

### Primary
- **Scanner Beam** (`beam`): the only accent. Primary buttons, focus rings, the running scan step, the selected radio option, the sweeping scan beam, text selection (35% mix), and the beam stroke of the logo's X. `beam-fg` is the text-safe version (the "X" in the wordmark, running step label).

### Secondary
- **All Clear Green** (`clear`, `clear-fg`): good results only. Done scan steps, the "good" score band, "No critical vulnerabilities found", the proposed-fix row (8% tint), the clear empty state.

### Tertiary (the threat palette)
- **Critical Red** (`sev-critical`), **High Amber** (`sev-high`), **Medium Yellow** (`sev-medium`), **Low Steel Blue** (`sev-low`). Each level has three roles: the solid colour for threat frame strokes, frame number tags, severity dots and gauge arcs; `-fg` for text on the page ground; `-bg` as a translucent tint behind severity labels and risk matrix cells. Critical Red also strikes through the original claim in a remediation (70%).

### Neutral
- **Console Ground** (`console-ground`): the page background, and the text colour on solid frame tags.
- **Console Panel** (`console-panel`): finding cards, evidence figures, form fieldsets.
- **Console Popover** (`console-popover`): menus and select popups.
- **Muted Console** (`console-muted`): table header band (50%), hovered rows (40 to 60%), evidence well behind the scan grid (30%), gauge track.
- **Console Secondary** (`console-secondary`): selected filter tab and active nav link.
- **Beam Wash** (`beam-wash`): the selected findings row, the running scan step, the selected radio card.
- **Hairline** (`hairline`) and **Strong Hairline** (`hairline-strong`): all 1px dividers; the strong one is for gauge ticks, inactive frame numbers, hovered dashed drop zones and the scrollbar thumb.
- **Readout** (`readout`) and **Muted Readout** (`readout-muted`): primary and secondary text.
- **Scan Grid** (`scan-grid`): the faint 24px grid behind evidence captures, the scan thumbnail and the OG image.

### Named Rules
**The One Beam Rule.** Cyan means "interactive or scanning". It is never decoration, never a severity, and never a second brand colour.

**The Threat Palette Rule.** Severity colours appear only on findings, frames, counts and score bands. A severity colour on anything else reads as an alarm.

**The Never Colour Alone Rule.** Every severity label prints the word and a distinct icon shape (octagon, triangle, circle, info). Frames carry a number; empty matrix cells print a dot.

## Typography

**Display Font:** Geist Mono (for the score numeral only)
**Body Font:** Geist (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono, with `tabular-nums slashed-zero` and -0.01em tracking

**Character:** An engineering pairing. Geist Sans carries the report prose plainly; Geist Mono turns every number into a readout, so the eye can tell measurement from language at a glance.

### Hierarchy
The scale is fixed at 12 / 13 / 14 / 16 / 20 / 24 / 32 / 44 px.
- **Display** (600, 44px mono, line-height 1): the score numeral on the dial. On the dial itself the numeral scales with the gauge (27% of its size).
- **Headline** (600, 32px or 24px, -0.02em): screen titles. Report and list titles use 32px; the scan progress title uses 24px.
- **Title** (600, 20px / 16px): the "Findings" section heading (20px) and the finding title inside a card (16px).
- **Body** (400, 14px, 22px leading): report prose, table cells, form text. Long prose is capped at 60 to 75ch.
- **Body small** (400, 13px): category labels, risk matrix, captions, hints and errors.
- **Label** (600, 12px, 0.06em, uppercase): table column headers, finding field labels (Claim, Evidence, Impact, Rule, Remediation), severity badges and score band names. Uppercase is reserved for these structural labels.
- **Measurement** (400 to 600, 12px mono, tabular): scan IDs, timestamps, durations, URLs, frame counts, confidence.

### Named Rules
**The Readout Rule.** If it is measured, counted or identified (score, count, ID, URL, time, percentage), it is set in tabular Geist Mono. Prose never is.

**The Small Uppercase Rule.** Uppercase with 0.06em tracking is only for column headers, field labels and severity/band names. It never sits above a heading as decoration.

## Layout

Report screens sit in a 1400px container (style guide 1200px, new scan 768px, scan progress 896px), with 16px side padding stepping up to 24px from `sm`. The sticky 56px header blurs the ground at 90% opacity.

The report reads top to bottom like a pentest deliverable, with each block separated by a hairline rule rather than boxed: header (mono meta line, title, Export PDF), executive summary (dial, summary text with severity counts, risk matrix in a three-column grid from `lg`), scope (four columns from `lg`), findings (filter tabs, evidence pair, then register and detail side by side from `lg` with the detail sticky at 80px), and methodology. The evidence pair shows the ad and the landing page at the same height in a 0.68 : 1 split. Below `lg`, everything stacks; below `md`, the "Found in" column hides.

Spacing follows Tailwind's 4px base: 4, 8, 12, 16, 24 and 32px for gaps and section rhythm (24px between report blocks, 16px between findings blocks). Controls and table cells use a 10px inline inset, and form fieldsets use 20px padding.

## Elevation & Depth

The console is flat. Depth comes from tonal steps of the same blue (ground, panel, popover) and from 1px hairlines. There are only two shadows, and both belong to the scanner: a soft drop under the evidence captures so the ad and page sit on the scan grid like items on the belt, and a 3px severity-coloured halo around an active threat frame.

### Shadow Vocabulary
- **Capture lift** (`box-shadow: 0 8px 24px -12px rgb(0 0 0 / 0.5)`): only under ad and page captures inside an evidence well.
- **Frame lock** (`box-shadow: 0 0 0 3px color-mix(in oklch, currentColor 30%, transparent)`): an active threat frame, tinted by its severity.

### Named Rules
**The Tone Not Shadow Rule.** Panels separate from the ground by one tonal step and a hairline. A new surface gets a shadow only if it is a capture on the scan grid or a locked frame.

## Shapes

Hairline instrument corners. Radii run 2px (frames, number chips, matrix cells, captures), 4px (severity badges, filter tabs, nav links, evidence snippets), 6px (scan steps, drop zones, empty state icon), 8px (panels, tables, buttons, inputs, figures) and stop at 12px. Borders are 1px everywhere except threat frames (1.5px stroke with 2px corner brackets). Dashed borders mean "drop something here" or "nothing here yet". Circles appear only as scan step status markers and progress bars.

The recurring geometry is the viewfinder bracket: four corner brackets around the logo's X, and around every threat frame.

## Components

### Buttons
Compact and quiet; the beam fill is saved for the action that starts or changes a scan.
- **Shape:** gently squared (8px); 32px default height, 28px small, with 6px icon gap.
- **Primary:** beam fill with dark on-beam text, 14px medium. Used for "New scan" and "Run scan". Hover drops to 80% fill.
- **Outline:** ground fill with a hairline (input-stroke at 30% in dark), for Export PDF and Copy fix. Hover fills with muted.
- **Ghost / Secondary:** muted hover only; secondary mixes 5% foreground on hover.
- **Focus:** beam border plus a 3px beam ring at 50%; press nudges down 1px.

### Chips (filter tabs)
- **Style:** 28px, 4px radius, 13px label with a mono count.
- **State:** selected has a strong hairline and console-secondary fill; unselected is borderless muted text that brightens on hover.

### Cards / Containers (report panels)
- **Corner Style:** 8px.
- **Background:** console panel on the ground; header strip divided by a hairline.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px hairline.
- **Internal Padding:** 12px by 16px headers, 16px bodies, 20px for form fieldsets.

### Inputs / Fields
- **Style:** 32px, 8px radius, input-stroke border, transparent fill (30% input tint in dark). URLs are typed in mono.
- **Focus:** beam border and 3px beam ring at 50%.
- **Error:** destructive border and ring; error text in critical-fg at 13px below the field.

### Navigation
- **Style:** Geist 14px links, 4px radius, 6px by 10px padding in the sticky header. Active link gets console-secondary fill and readout text; inactive is muted and brightens on hover. Hidden below `sm`, where the logo and "New scan" remain.

### Severity Badge
Uppercase 12px label (11px in table rows), 600 weight, 0.06em tracking, 4px radius, severity tint fill with severity text, and a severity-specific icon at 2.25 stroke.

### Threat Frame (signature)
A numbered box drawn over a capture at % coordinates: 1.5px severity stroke, 5% current-colour fill, 2px corner brackets, and a solid severity tag carrying a two-digit mono number above the top-left corner. Hovering, focusing or selecting a frame or its table row lights both: the frame fills to 12% and gains the frame lock halo, other frames dim to 35%, the row takes the beam wash, and its number chip turns solid. Transitions run 200ms on the expo-out curve.

### Findings Register
A bordered 8px table: muted header band with uppercase labels, hairline rows with 10px cell padding, and columns for frame number, severity, title with category, and source icons.

### Score Dial
A 240° gauge open at the bottom, with 21 tick marks (every fifth longer), a 5px muted track and a butt-capped arc in the score band colour (critical, high, medium or clear). It sweeps up over 1.1s with expo-out easing on mount, and holds still under reduced motion.

### Scan Beam
While a scan runs, a beam gradient sweeps down the ad thumbnail over the scan grid (2.2s, ease-in-out, looping) and the image sits at 40% greyscale; under reduced motion the beam parks at 45%.

## Do's and Don'ts

### Do:
- **Do** keep cyan for interaction and scan state only (The One Beam Rule).
- **Do** print the severity word and its icon every time a severity is shown.
- **Do** set every score, count, ID, URL, timing and percentage in tabular Geist Mono.
- **Do** separate report blocks with 1px hairlines and tonal steps before reaching for a box or a shadow.
- **Do** number located findings with two-digit tags and repeat the same number on the table row.
- **Do** keep radii between 2px and 8px for new surfaces; 12px is the ceiling.
- **Do** hold AA contrast in both themes, using the `-fg` severity tokens for text.

### Don't:
- **Don't** build screens from score tiles or rows of same-size cards; the report is a register, not a dashboard.
- **Don't** use severity colours for decoration, branding or emphasis outside findings.
- **Don't** add shadows to panels, buttons or popovers beyond the two in the shadow vocabulary.
- **Don't** put uppercase tracked labels above headings as decoration.
- **Don't** introduce a second accent hue or a display typeface; the scale stops at 44px.
