# Brief: write one NEW article for Budget Home Fixes (thebudgethomefixes.com)

## Context
Astro static blog in the current project folder. Audience: US renters and budget-minded homeowners searching "how much does X cost" or "X vs Y". English only. The site earns from ads, so every page must be genuinely useful and trustworthy: Google and AdSense penalise thin, generic, recycled content. Target length: 1,600-2,200 words of body. Quality bar and structure: read `src/content/blog/cost-to-paint-a-bedroom.mdx` first (and one closer sibling listed in your task). Match that standard but adapt the headings to your topic; do not copy its wording or numbers.

## Research (do this properly)
1. Load web tools if deferred: `ToolSearch` with `select:WebSearch,WebFetch`. If WebFetch cannot be loaded, read pages with Bash instead: `curl -sL -m 25 -A "Mozilla/5.0" "<url>" | sed -e 's/<script[^>]*>.*<\/script>//g' -e 's/<[^>]*>/ /g' | tr -s ' \n' | head -c 30000` (some sites will block you; skip those). If you can neither search nor read pages, STOP and report that; do not write from memory.
2. `WebSearch` the main keyword and 2-3 variants. Pick the 6-10 best or most authoritative pages (cost guides, manufacturer and retailer pages, reputable home publications, government pages for rules).
3. Actually read at least 6 of them. For each note: structure, concrete numbers with units and dates, where sources disagree, and what the top pages fail to cover (gaps we can fill: worked examples, decision rules, renter angle, honest caveats, calculators).
4. Prefer primary sources for specs/rules; use cost guides and retailer listings for prices.

## Honesty and originality rules (non-negotiable)
- Every number, price, date or rule must come from a page you actually read (not only a search snippet), or be clearly labelled "our estimate" / "our arithmetic". Never invent statistics, studies, quotes, test results or ratings. Never claim we tested anything or have first-hand experience. No fake author.
- If sources disagree, show the spread; say sources differ and only give a reason if a source gives one; otherwise label your explanation "our inference".
- State the date/year of data when a source gives it. Put "2026" in the title only if the price sources are 2025-2026.
- Original wording; paraphrase. No long quotes. Credit sources by linking in the Sources section.
- No filler ("in today's fast-paced world", "let's dive in", "it's important to note"), no emojis, no hype, plain concrete English. Use em dashes sparingly.
- Legal/safety-adjacent content: cite official sources, say rules vary, add a short "not legal advice" line. Do not give electrical/structural DIY instructions beyond what sources state.

## Structure (adapt)
Intro of two short paragraphs with the direct answer and numbers up front; a `Callout type="takeaway"` with 3-5 bullets; H2 sections with tables where numbers exist; a `CostRange` chart when you have 3+ comparable ranges; what changes the price; DIY vs pro or option A vs B with "choose X if..." rules; common mistakes; ways to save; renter angle when relevant (link the deposit guide); 2-4 inline `ArticleFigure` photos from the image bank with truthful alt text and modest captions (no photo reused twice in one article; hero must differ from inline photos); an FAQ H2 whose title contains the word FAQ, with 4-6 H3 questions that are self-contained (never start with "they", "it", "these"), each answered in 40-90 words; at least 3 internal links using `/blog/<slug>`; final `## Sources` list `- [Title](URL): what we used it for`, "checked in November 2026", only pages you actually read.

## File and format rules
- Create ONLY your assigned `.mdx` file in `src/content/blog/`. Do not run npm, astro, git or any build; other agents work in parallel and the lead builds. Do not touch other files.
- Frontmatter exactly:
```
---
title: "..."            # 60 characters or fewer, no site name
description: "..."      # 140-160 characters, includes the key number or answer
pubDate: <TODAY as YYYY-MM-DD, given in your task>
updatedDate: <same date>
category: <Painting|Wallpaper|Kitchen|Storage|Guides>
image: /images/<file>.jpg
imageAlt: "..."
---
```
- Right after the frontmatter, import only what you use:
```
import Callout from '../../components/Callout.astro';
import CostRange from '../../components/CostRange.astro';
import ArticleFigure from '../../components/ArticleFigure.astro';
import PaintCostCalculator from '../../components/PaintCostCalculator.astro';
```
- Components: `<Callout type="takeaway|tip|warning|note" title="optional">markdown</Callout>`; `<CostRange title="..." items={[{ label: '...', low: 50, high: 160, note: 'optional' }]} max={1000} caption="..." />` (plain dollar numbers); `<ArticleFigure src="/images/x.jpg" alt="..." caption="..." />`; `<PaintCostCalculator length={12} width={12} height={8} doors={1} windows={2} />` (room-painting articles only).
- MDX gotchas: never write a raw `<` or curly braces in prose ("under $25", not "<$25"); blank line before and after every component; no HTML comments; standard markdown tables; straight quotes in frontmatter.
- Image bank with descriptions: `automation/image-bank.md` (photos live in `public/images`; if the bank has no fitting photo, say so in your report instead of inventing a path).

## Existing slugs (for internal links)
Run `ls src/content/blog` to list every published slug; link only to slugs that exist there (format `/blog/<slug>`). Link at least one article from the same category.

## Final report (your last message, under 150 words)
File path; approximate body words; the source URLs you actually read; any claims you are unsure about and numbers where sources conflict.
