# Publishing playbook (one run = one article)

Run from the project folder. Roles are separate agents so nobody checks their own work. If any gate fails, stop, leave the article as a draft (see "Draft rule") and report why. Never lower a gate to get something published.

## 0. Preflight
- `git pull`, `git status` must be clean. Check the last GitHub Actions run for `nsorlop/budget-home-fixes` via `curl -s "https://api.github.com/repos/nsorlop/budget-home-fixes/actions/runs?per_page=1"`; if it failed, stop and report.
- Skip the run if an article was already published in the last 36 hours (`git log -1 --format=%cd -- src/content/blog`), unless the user asked for a run.

## 1. Planner (you, the lead)
Take the first `todo` row of `automation/backlog.md`. Check the slug does not exist in `src/content/blog`. Mark it `in-progress`.

## 2. Writer (subagent, general-purpose)
Prompt: "Project folder <path>. Read `automation/writer-brief.md` completely and follow it exactly. Assignment: file `src/content/blog/<slug>.mdx`, category <cat>, today's date <date>. Topic: <angle>. Closest sibling to read: <sibling>. Do not run build or git."

## 3. Verifier (a different subagent, fresh context, never sees the writer's reasoning)
Give it only the file path and this task: open the Sources section, fetch each source (WebFetch or `curl -sL -m 25 -A "Mozilla/5.0"`), and check every number, price range, date, rule and quote-like claim in the article against those pages. Report a table: claim, where in the article, source page, match / mismatch / unsupported / label-as-estimate. Also flag: invented first-hand claims, unlabelled own arithmetic, wrong sums, internal links to missing slugs, images that do not exist or do not match their alt text (open them), FAQ answers outside 40-90 words, body under 1,500 words, sources that were not readable. Output a verdict: PASS or FAIL with the list of required fixes.

## 4. Fix loop (max 2 rounds)
The lead applies the fixes to wording or numbers using only what the sources say (delete the claim if no source supports it). Re-run the verifier on the changed parts. If still FAIL after 2 rounds, use the draft rule.

## 5. Editor / QA (lead)
- `npm run build` must pass (34+ pages) and `node scripts/qa-site.mjs` must report 0 broken links/assets.
- Title <= 60 chars, description 140-160 chars, unique title and slug, category valid, hero differs from inline photos.
- No emojis, no filler phrases, no "we tested". Skim for repetition with the sibling article.

## 6. Pins
`node scripts/make-pins-batch2.mjs --only <slug> --csv pins-<slug>.csv --start <YYYY-MM-DD, 2 days after the last scheduled pin>`; check the CSV rows (title not starting with a pronoun) and the two generated jpgs.

## 7. Publish
- Update `automation/backlog.md` row to `done`.
- Commit with a message that names the article, ending with the Co-Authored-By trailer, then `git push`.
- Poll the GitHub Actions API until `completed`; require `success`, then `curl` the live URL for HTTP 200 and the new slug in `sitemap-0.xml`. If the deploy fails, fix the cause before anything else.

## 8. Report to the user (Spanish, short)
Title, URL, word count, what the verifier corrected, the pin CSV path to upload to Pinterest, how many `todo` topics remain. Remind them every ~10 articles to upload new pin CSVs.

## Draft rule
If a gate fails, set `draft: true` is NOT supported by the schema: instead move the file to `automation/drafts/<slug>.mdx` (not under `src/content`), mark the backlog row `blocked: <reason>`, do not commit the article, and report the failure and the unresolved claims to the user.

## Hard limits
- At most one article per run and three per week.
- Never edit existing published articles in an automated run except to add one internal link to the new article from a sibling.
- Never touch AdSense settings, ads.txt, the privacy policy, DNS or any account.
- Never invent a number, source, quote, author or test result. When in doubt, cut it.
