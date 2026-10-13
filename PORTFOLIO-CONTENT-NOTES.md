# Portfolio content notes (read this first in any content session)

Working memory for improving the portfolio copy. Update it at the end of every session: add decisions, change a project's status, never delete history.
Last updated: 2026-10-12 (end of the App Review Platform session)

## Goal
Make every project page more impressive for hiring managers and recruiters. Target role: full-time product design role, with AI and code involvement, not Figma-only.

## Hard rules (from CLAUDE.md and Avigail)
- No em dashes or en dashes in any copy, captions included. Use a comma, colon, period, or a plain " - " like the other captions on the page.
- No specific numbers, percentages, or dollar amounts in project content (legal). Use plain directional words. Years and dates are fine.
- No hype words ("amazing", "strong growth"). Say what happened.
- No line of copy ends on a single word (English widow rule).
- First sentence of the opening names the problem. First person.
- Subtitles and captions are short and do not repeat their title.
- Do not describe screens she did not design. Ask first.
- Never invent facts. If a claim needs data she has not given, mark it as an open question. Only claim what her sources support (the page, the CV, her Drive decks).
- She reverses decisions quickly. Do not argue the reversal.

## How she wants copy written (learned on App Review Platform)
- Plain and exact beats "important-sounding". She rejected a version with ownership verbs ("Made two structural calls", "I started with the people doing the work") as AI slop. Specific facts (shadowing, Docs audit, weekly syncs, bug hunt) carry the weight.
- Avoid: parallel bullets that all open the same way, self-narrating lines, canned closers.
- Say causes accurately. "It was no longer updated, so no one used it, and with no one using it, nothing got fixed" (a loop), not "because".
- Name real tools and facts she gives (Docs and Sheets, who used which).
- Lists that explain decisions: start each item with a one-word goal in bold (Order, Continuity, Consistency, Faster, Scale, New status, Familiar), then what was done. Numbered, in priority order. Goal order follows the pain points from Research. The UI system bullet goes last.
- Drop what the images already say (the numbered list of four areas was replaced by one line, because the captions name the areas).
- Put a short "Click any image to see it bigger." line before the first image group.
- Put screens that prove a claim next to the claim (two review screens under the Redesigning list), and duplicates are fine.
- Tagline: only what her sources support. Trimmed "and time to publish" because her deck only supports "review cycles".
- Wix App Market: write the full name on first mention so the tooltip appears.
- For a "wdyt" question: recommendation, then wait. Apply only on her word.
- A pasted line with no instruction: ask one short question.

## Workflow
1. Content lives in Notion (Avigail Bahat Portfolio CMS). Page IDs are in CLAUDE.md. ALL content edits go in Notion, never only in generated files.
2. Edit the Notion page with the smallest possible change (update_content, not replace).
3. Regenerate: `node generate.js <slug>`. NOTE: it rebuilds all of dist/ whatever the slug, so other files in git status change too. An image download can fail on a network blip: rerun it and check that `<img src>` points to `../images/...` and not an amazonaws URL.
4. ALWAYS show her a local preview of the real clickable page: copy dist/ into the session scratchpad, serve it with `python3 -m http.server <port> --directory <copy>`, verify it returns 200, open the page in the browser pane, and say the URL. Do this after every page edit, without being asked. Also check mobile (375px) for anything layout related.
5. NEVER commit or push without her explicit go, and warn her first (global rule): say what changes on the live site. Deploy runs on push only.
6. Before committing, `git diff` for edits that are not mine (Codex may edit the same repo). Stage only files for this work.
7. Notion image blocks cannot be duplicated by reusing the same `notion-file-block://` reference: Notion MOVES the image and leaves empty columns. To show an image twice, upload a copy (notion-create-file-upload, then POST the file with curl, then reference `file-upload://<id>`). Check the original place still has its image after any edit with images.
8. Add a numbered list item or sentence into Notion with exact old_str. Fetch the page first if the text may have changed.

## Site features built (all local, not committed unless noted in the decisions log)
### "Last updated" line
- Under the Bottom line on the 12 project pages. Not on the homepage, not on About.
- Date = the page's last edited time in Notion, per page (generate.js, `lastEdited`). Format "Last updated 12 October 2026". Style: `.proj-updated`, 14px, #555.
- Any edit to a Notion page moves its date to that day. Dates are not set by hand.

### TL;DR box
- In Notion: a paragraph that starts with "TL;DR:" right above "The problem". The generator turns it into a box, one column per sentence (up to three; more than three are grouped into the first column). Stacks on mobile below 768px.
- Design comes from her Claude Design canvas "TLDR Box", variant F (https://claude.ai/artifact/X2mu6Bduiss86nDbkyXrwL). Label 14px uppercase #555, text Plus Jakarta Sans 500 (20px, 18px in 3 columns), 0.5px #ebebeb border, 8px radius, 40px padding.
- Three sentences is the default (decided 2026-10-12): what was done, how it was reached, the outcome. Two sentences render as a narrower centered block (760px max).
- Documented in the site design system page (Components, Typography, changelog) and in her Claude Design system "Avigail Bahat Site" (https://claude.ai/artifact/Wbabefj5U36if6bVvuyfP9, TldrBox spec updated to one to three sentences, version 6).
- Used so far: App Review Platform only. Add one to each project page as it is worked on.

### Headings and tab titles
- Project page section headings (h2) use Plus Jakarta Sans, site-wide (style.css `.proj-content h2`).
- Browser tab titles use " | " instead of an em dash (homepage, project pages, design system page).

### Tooltips on key terms
- Defined in `TERM_TIPS` in generate.js and injected by `injectTooltips()` on project pages: Wix App Market, Business Manager, Wix Blocks, Wixel, Wix.
- Matching is on the exact phrase, so "App Market's" alone gets no tooltip: write "Wix App Market".
- Only the first occurrence of each term per page gets the tooltip.
- To add a term, add a key to `TERM_TIPS`. It applies to every page where the phrase appears, so check the other pages.

## Presentation mode (deck) for App Review Platform
- A separate, hand-edited file: `dist/projects/internal-review-demo.html` (14 slides). It is NOT generated from Notion and generate.js keeps it (`KEEP_PROJECT_FILES`). Edit the file directly and keep it in sync with the Notion page.
- The "Presentation mode" button under the subtitle links to it (removed and put back on 2026-10-13, she wants it).
- Order: 1 Cover (title on 3 lines: App / Review / Platform), 2 TL;DR (3 bullets in the deck body style, 17px Inter; the page keeps the 3-column box), 3 The problem, 4 Research (stacked like Principles: text above, 2x2 cards max 760px), 5 Design principles (cards max 760px wide), 6 Scope, 7 to 13 Solution slides, 14 Impact.
- Synced 2026-10-13: name, subtitle, TL;DR, The problem (with the loop and the long review cycles), Research, principles, Scope intro, Impact. Solution slides were left as they were.
- Side navigation (2026-10-13), ported from the Queuewe deck (dist/queuewe/index.html): a 170px list on the left, numbered 01 to 13 from each slide's data-label, hidden on the cover, a round menu button and drawer at 1100px and below. New slides get a data-label so they appear in it automatically.
- When the page changes (Impact, problem, principles, TL;DR), update the deck in the same session.

## Source of truth for claims
- CV file: /Users/avigailb/Library/CloudStorage/GoogleDrive-avigailba@gmail.com/My Drive/01 Avigail/Avigail Bahat CV.pdf
- Interview deck for this project (Hebrew): Google Slides "App Review System - Melio" in her Drive. More decks like it may exist per project: search Drive before writing impact.
- CV facts: Title Senior Product Designer (site notes say Senior UX Designer: confirm which). Developer Center: sole designer for 5 years, owned the monetization experience (pricing, free trials, payouts, refunds). AI Credits Wallet: designed for free and premium users, shipped across three platforms. Internal Reviews: rebuilt from the ground up, review cycles faster, still in use. App installation data: owned the first installation data page from concept and design to shipped code. Summary: hands-on with code through AI tools.
- No numbers exist for time to publish anywhere (repo, git history, Notion, Drive). Do not invent them.

## Cross-site findings (open)
- 66 em dashes were live across the four featured pages, almost all in image captions (`**Title** — text`). Fixed only on App Review Platform (in Notion). The generator does NOT strip them. Options: fix every caption in Notion, or change the caption separator once in generate.js.
- Featured order on the homepage differs from the list order. Names inconsistent (Internal Review System now "App Review Platform"; AI Credits / AI Credits Balance; casing of Page/page).
- Homepage lede is generic and has no AI or code signal. Proposed: "I'm a senior product designer with 10+ years at Wix, designing developer platforms, monetization experiences, and AI products. I work hands-on with code through AI tools, close to product and engineering." Not approved yet.
- Impact sections across pages stack vague intensifiers (significant, strong, rapidly). Rewrite in plain words.
- Only 12 of 14 known projects are on the homepage (Development Site Creation and Custom Element Settings missing). Ask if intentional.
- CV claims missing from pages: "sole designer for 5 years" (Installations, Developer Sale, Internal Reviews), "concept and design to shipped code" (Installations, buried), "shipped across three platforms" (AI Credits, buried, and tagline says "three products"), AI/code (AI Credits only in a caption).
- The header year on project pages is the project date (App Review Platform shows 2022), not the Notion date. Leave it.

## Project status

Status key: TODO, PROPOSED (lines shown, waiting for her word), DONE LOCAL (in Notion and regenerated, not committed), DEPLOYED.

### App Review Platform (slug internal-app-review-system, Notion 71024356b51b4ce8b46c21fa3a442020): DEPLOYED 2026-10-13 (page, principles, deck and side nav live; live check passed; commit b2b601b)
Renamed from "Internal Reviews System" to avoid the clash with "Reviews Revamp". Slug unchanged.
- Subtitle: "Ground-up rebuild of Wix App Market’s internal review platform that shortened review cycles."
- TL;DR (3 columns): "I planned and rebuilt a stale internal review tool with a clearer structure and the features reviewers were missing. I started with interviews and by shadowing Account Managers as they ran reviews, then tested the redesign with them in a bug hunt before launch. Review cycles got shorter, and the tool has been in use since the 2022 launch."
- The problem: Account Managers wrote reviews in different tools (some Docs, some Sheets); the tool was stuck in a loop (not updated, so no one used it, and with no one using it, it never got updated); no shared history, no visibility between submissions, no consistent handoff; it ends with "As more and more apps were submitted, we noticed that review cycles were long." so the outcome answers the problem. Use "loop" there, not "cycle", because "review cycles" is the next idea.
- Process: Research (as bullets of four pain points), one line for the four areas + "Click any image to see it bigger.", 7 goal-first numbered points, two review screens.
- Delivery: weekly syncs; bug hunt with the finding about the diff in the second review (one bullet).
- Impact: "Review cycles got shorter." first, then Docs exit, in use since 2022 launch even after AI entered the process, the team added features themselves (filters, marking an app premium).
- Removed: duplicate four-areas bullet, "Cactus", the review-start bullet and rev share bullet.
- Impact layout as a large statement: skipped, the TL;DR already carries it.
- Design principles (added 2026-10-13, deployed): four principles in her own words, as a subsection right after Research and before "Deciding on the product areas". Her wording kept, including "publishing is always deliberate" (she confirmed it is true). Overlap with the goal-first list is accepted: principles are the why, the list is the how.
- Pattern to reuse on the other pages: TL;DR box, goal-first decision list, problem named in the first sentence, claims only from sources.

### AI Credits (slug ai-credits-wallet, Notion 31135a9ccf7a804caf72da07638205bc): TODO (next, only when she says)
- Opening is third person, run-on with a stray colon.
- Process lists tasks, not decisions (why two tiers, why collaborator wallet scoped out). Try the goal-first decision list.
- Impact and Bottom line repeat the same "silence" idea.
- Proposed opening: "Wix was rolling out AI features that consumed credits, and users had no clear way to see what they had or what happened when it ran out. I designed the credits wallet: one component for free and premium users, shipped across Business Manager, Wixel, and AI vertical pages."
- Add: "Shipped bug and design fixes directly in code with Claude Code and Superset."
- Pick one of "three products", "three surfaces", "three platforms" and use it everywhere.
- Add a TL;DR. Search Drive for an interview deck first.
- Caution: this page has a custom layout (credits widget iframe), so check it after the TL;DR is added.

### Installations (slug app-installation-page-for-developers, Notion 31135a9ccf7a80358e3cead5465c89f8): IN PROGRESS (subtitle DONE LOCAL, rest PROPOSED)
- Opening leads with "I designed and shipped", the problem comes a section later.
- Roadmap and discoverability lines at the end of Impact duplicate the Bottom line.
- Fix stray bold space ("apps. **"), "for ex.,", and the filler "actually" in the tagline.
- Subtitle (DONE LOCAL 2026-10-13, in Notion and page regenerated, not committed): "Designed and shipped installation analytics that gave developers site-level visibility into how their apps were used". Her own original line with a verb added and "actually" dropped. She rejected all invented alternatives.
- Homepage card subtitle is separate: PROJECT_META in generate.js still says "Redesigned the app installation experience end-to-end". Not changed, ask first.
- Proposed opening (not applied): "Developers on the Wix App Market had no way to see who installed their apps, so they emailed support for basic usage data. I designed the installation data page and shipped part of it in code, using Cursor and Claude Code to add features and fix bugs, working end to end with engineering through permission levels, PII limits, and API constraints."
- Code claim is sourced from the page itself: "Joined the implementation team using Cursor and Claude Code to add features and fix bugs" and "Contributed a year selector to the Wix Design System in code". Wording "shipped part of it in code" is deliberate, the page does not show she built all of it.
- Resolved by dropping both "co-built" and "owned": say what she did.

### Developer Sale (slug developer-sale, Notion 17d35a9ccf7a80c69ceafb3f7973485a): TODO
- Subtitle "drove strong growth" is vague.
- Impact has seven stacked intensifiers and "MoM" jargon. Bold line uses a spaced hyphen as a dash.
- Split the four-decision design bullet into four short bullets (yearly vs sale discount, two sales at once, monthly better than yearly, sale badge).
- Proposed subtitle: "A sales framework that made market-wide promotions possible for the Wix App Market and gave developers their own."
- Proposed Impact: "The first Wix Sale ran in November and December 2024. Many eligible apps joined and most chose the maximum discount. The sale lifted App Market visits, new subscriptions, and upgrade revenue month over month. Pricing pages with a sale converted better than pages without one, consistently across most apps tested. Developer-run sales kept growing after launch."
- Open: page says "I led the end-to-end UX", CV says "sole designer". Which is public?

### Remaining projects (batch 2): TODO, same audit
Reviews Revamp, Collections Manager, Payouts Page, Refund Flow, Pricing Page Projects, Submit & Publish Widget, API Keys page, Coupons Page. Also check Development Site Creation and Custom Element Settings.

## Decisions log
- 2026-10-13: Voice rule: she does not like marketing-like text. Write plain, factual sentences about what happened and what she did. No sales framing, no hype verbs, no "turned X into Y" style lines unless she picks them herself. Applies to subtitles, openings, Impact and Bottom line on every page.
- 2026-10-13: Installations: no "first page" wording in the subtitle or opening. She wants it stated that she shipped code.
- 2026-10-13: Presentation mode button restored and the deck content synced to the page (13 slides, principles slide added).
- 2026-10-13: Design principles section added to App Review Platform under Research (Staff-level interview prep). Role strip declined ("no"). Weaving the principles into the list declined ("no no"). Principles stay as a separate subsection in her wording.
- 2026-10-12: Deployed. Lesson: the project title is also hardcoded in PROJECT_META in generate.js (feeds the homepage featured card and the More work lists). When a Notion page is renamed, change PROJECT_META title too and grep the generated site for the old name.
- 2026-10-12: One session per batch is the default. A single project gets its own session only for deep work. Shared files (generate.js, dist/) make parallel sessions risky.
- 2026-10-12: Internal Review System renamed "App Review Platform".
- 2026-10-12: No numbers for time to publish exist. Impact stays directional. Tagline trimmed to "review cycles".
- 2026-10-12: TL;DR box built from her Claude Design canvas, variant F, three sentences. Design system spec updated.
- 2026-10-12: Section headings use Plus Jakarta Sans on all project pages.
- 2026-10-12: Last updated line from the Notion edit date, on project pages only.
- 2026-10-12: "Click any image to see it bigger" line added before the first image group.
- 2026-10-12: Widow rule enforced in CSS, not by tuning copy: `text-wrap: balance` on subtitles, `text-wrap: pretty` on project body paragraphs and list items (checked at 375, 477 and 1440px: no single word on a last line).
- 2026-10-12: "Presentation mode" button removed from App Review Platform (it was the only page with it). The deck page internal-review-demo.html still exists but nothing links to it.
- 2026-10-12: The hero image (first image, before the first heading) is not clickable on project pages; all other images open the lightbox. AI Credits has no hero image (widget layout).
- 2026-10-12: Her request to deploy the page. Deploy only after she confirms the warning about what else changes on the live site.
- 2026-10-12: AI Credits is NOT started automatically. She starts it.
