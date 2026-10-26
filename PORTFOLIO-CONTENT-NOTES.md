# Portfolio content notes (read this first in any content session)

Working memory for improving the portfolio copy. Update it at the end of every portfolio work session: add decisions, change a project's status, never delete history.
Last updated: 2026-10-22 (deck-style page system built on App Review Platform, Installations and AI Credits, all LOCAL and not pushed)

> **START HERE for any new page: the section "DECK-STYLE PAGE SYSTEM" right below.** It overrides older parts of this file (the "Standard page structure" table, the goal-first numbered list rule, the Bottom line, Inter as body font, presentation decks). Older sections are kept as history.

## DECK-STYLE PAGE SYSTEM (2026-10-22): how to build the next page
Her Intuit portfolio deck ("Intuit Portfolio Presentation", Claude Slides artifact https://claude.ai/artifact/QAgonQkDu6qAyyNnAp5Fws, also a PDF in Drive) is the design reference. She wants every project page to read like the deck: same section titles, same layouts, same wording. Content still lives in Notion; the generator (`generate.js`) turns Notion shapes into components; the CSS is at the end of the project-page block in `style.css`.

### Page order (no Bottom line any more)
1. Italic subtitle, date mention, hero image (no caption, not clickable).
2. `TL;DR: sentence. sentence. sentence.` (one paragraph, three columns in a box).
3. `## The problem | <deck slide title>`
4. `## Approach | <deck slide title>` with `### Design principles` inside it as cards, plus an optional `### Exploration | ...` screen.
5. `## Solution | <deck slide title>` with the screens.
6. `## Delivery & challenges | Working with the team`
7. `## Impact & next steps | <deck results title>` (App Review, AI Credits) or `## Results & Impact | ...` followed by `## Next steps` (Installations).
The "Last updated" line, side menu and More work are generated. The side menu lists the labels only (text before the " | ").

### Notion shape -> what the generator builds
| In Notion | Result |
|---|---|
| `## Label \| Title` | small uppercase label above a large title (`.proj-h2`) |
| `### Label \| Title` | same, smaller (`.proj-h3`), used for deck sub-slides |
| Problem: columns, left = statement paragraphs (plus images), right = `### Rows heading` + bullets | `proj-prob`: statement 2/3 (body style), rows 1/3. Images placed in the left column sit side by side under the text |
| Approach: columns `### Research process` bullets \| `### Pain points` bullets | rows, 2/3 + 1/3 (`proj-dc-even`, App Review) |
| Approach: columns, left = statement + bullets, right = `### Heading` + images | rows 2/3 + images 1/3 (Installations) |
| Approach: columns, left = statement only, right = `### Heading` + bullets | statement 1/3 + rows 2/3 (`proj-dc-lead`, AI Credits) |
| `### Design principles`, a bridge line, then bullets `**Title** sentence \| Tag` | numbered cards, full width, 3 or 4 across (2x2 under 1100px, 1 column on phones) |
| `### Product areas`, bullets `**Title** what it is \| bold line` | 2x2 area cards (App Review) |
| Solution: columns, left = one image, right = bullets (optional `### The principle in action` + a paragraph) | screen 2/3 + text 1/3 (`proj-shot`) |
| Solution: columns, each = image then bullets | two screens with text under each (`proj-shot2`) |
| Columns of images with captions (2, 3 or 4) | equal 3:2 boxes, smaller screens sit on grey so captions line up |
| Delivery: columns `### Process` bullets \| `### Challenges` bullets | rows, half and half (`proj-dc`) |
| Impact: lead paragraph, bullets `**Label** sentence`, italic bullets = quotes, `### Next steps` (or a `## Next steps` after) | lead 1/3 + labelled rows 2/3, Next steps is the last row (`proj-results`) |
| Widget (AI Credits only) | injected by generate.js next to the Solution list, caption "Use the top selectors to see more wallet states" |
Row bullets: a bold lead then the sentence, `**Lead.** sentence`. Pipes in Notion text show as `\|` when fetched; that is normal.

### Look (tokens)
- Fonts: **Plus Jakarta Sans** for titles, card numbers and card titles; **Roboto** for everything else. The site loads only these two (older notes said Inter: wrong).
- Body 16px, `#555`; bold lead in rows `#0a0a0a` 600. Min font size 14px.
- Section label 14px uppercase, letter-spacing 0.07em, `#555`. h2 title 36px Jakarta 700 (28px on phones). h3 title 28px. Plain h3 20px 700.
- Cards and boxes: 0.5px `#ebebeb` border, 8px radius, white. Greys `#f5f5f5` (behind screens). Principle cards: number 48px/700, title 18px/600, text 15px, tag as a 14px uppercase pill. Area cards: title 20px/700.
- Space: one 12-column grid with a 32px gutter. Splits that line up: 6+6, 4+4+4, 3+3+3+3, 8+4, 4+8. Section headings have 96px above (64px on phones). The TL;DR box reaches 40px past the text column so its columns sit on the same lines.
- Spacing between stacked screens 32px.

### Screens and captions
- Every image except the hero has a caption: `Label - what it shows` (older captions use a bold label and a colon, also fine). No em dashes, no trailing period needed, lowercase after the hyphen. Write captions from what the screen shows, never invent features (the OLD review tool had no comments).
- Equal boxes for screens in a row; do not fight it with per-image CSS.
- Use deck screens (they are newer). Download from the deck artifact with the Artifact tool `read` + `path: <blob id>` (saved under the scratchpad), convert webp to png with `sips -s format png`, upload to Notion (below).
- Privacy: crop or blur customer names, emails and shop URLs. The workaround screenshots on Installations are cropped on purpose.
- No numbers or percentages in copy (a number inside a screenshot is fine). The deck's "5 major apps" and "21 apps" were left out.

### Content rules learned
- Titles come from the deck slide titles; labels stay the site's section names (Approach, Solution, Delivery & challenges), not the deck's ("Discovery", "The design").
- Use the deck's wording, fixing only grammar. Do not describe things the deck does not say (collaborator wallet stays out of Solution, "5 credits" left out).
- If the deck and the page disagree, ask her; she answers short ("saved views shipped by me", "upgrade rate improved").
- She prefers the deck layout every time she compares ("the deck is better"): when in doubt, copy the slide.

### Working method and pitfalls (read these)
- Notion tools: `update_content` can change text and image CAPTIONS (match the caption text), but cannot match or move image blocks and cannot match text containing the bar character reliably (`## Approach | ...` is auto-corrected, fine). Moving, adding, removing images = `replace_content` with the FULL page, every image ref exactly as fetched (`notion-file-block://...`) or `file-upload://<id>` for new uploads. NEVER send a partial page to `replace_content` (it wiped the Installations page once; recovered from the last full text and the image cache in `dist/images`). Fetch first, edit the fetched text, send all of it.
- New image: `notion-create-file-upload` -> POST the file to the returned URL with the returned `authorization` header (`curl -F file=@path`) within about 20 minutes -> reference `file-upload://<id>`. After it is attached the page shows a normal `notion-file-block` ref.
- Back up a page before restructuring one with images: duplicate, move the duplicate to the workspace root, title it BACKUP (backups from 2026-10-22 exist for AI Credits and Installations; App Review older ones from 10-13/14).
- Heading edits that match "## The problem" also match "### The problems ..." (substring). Use `## The problem\n\n<columns>` as the old string.
- Preview: serve a COPY of `dist/` with `scratchpad/nocache_server.py <port> <dir>` (Cache-Control: no-store). Plain `python3 -m http.server` let her Chrome show old pages. Give her the new port. Check at 1440px and 375px.
- Pasted chat images are only sometimes saved on disk (`.../images/N.png`); if missing, ask her to send the file again.
- generate.js: shared helper functions sit above `projectPage` (`splitRules`, `buildAreaCards`, `buildResults`, `buildRowColumns`/`buildDeliveryColumns`, `buildProblemColumns`, `markShotLayouts`); the AI Credits widget block is at the top of `projectPage`. A heading written `Label | Title` is turned into spans at the end of `projectPage`, AFTER the side menu is built; any regex that looks for a section heading must allow text after the label (`[^<]*`).
- Homepage: three featured cards (Developer Sale was un-featured on 2026-10-22).

### Where each page stands (all LOCAL, not pushed)
- App Review Platform: fully converted (problem with old-tool screens and flowchart, Approach rows, three principles, product area cards, delivery, results). 21 figures.
- Installations: converted (problem, Approach with workarounds and Exploration, Solution screens with captions, delivery, results). Saved views shipped by her, added to Process and Results. 15 figures.
- AI Credits Wallet: converted (problem, Approach rows, four principles, Solution with widget and two screens, delivery, results). Upgrade rate improved: CONFIRMED by her. 6 figures.
- The other 11 project pages: NOT converted. The new 12-column grid and equal screen boxes apply to them already, nobody has looked yet.
- TL;DR boxes: when the TL;DR has exactly three sentences, the generator adds the deck's labels THE PROBLEM, PROCESS, THE RESULT above them (`.proj-tldr-col-label`, 14px uppercase Roboto #555). Write the three sentences in that order (what was wrong, how it was worked, the outcome).
- 2026-10-22 late: she said "ok" to my recommendation, so the unshipped "Credit-flow mapping" screen was REMOVED from AI Credits (Behind the scenes now shows only the Implementation screen; it is in the Notion backups). Installations Next steps now use the deck: "Contacts, an account view and cancellation reasons." (the page's older roadmap list and the "not enough developers were exposed" line are gone). The other 11 project pages: she said LATER.
- 2026-10-26, Installations images (LOCAL, not pushed, Notion already changed): hero, Default view, Missing data and Full columns replaced with her newer screenshots (the new Missing data shows two tooltips, so its caption now says "tooltips explain an empty email cell and what the version column includes"); the "Empty columns" screen was removed from Edge & empty states (it duplicated Missing data), so that row has three screens. Page has 14 figures. Preview server now: `python3 nocache_server.py 8793 <copy of dist>` from the scratchpad.
- 2026-10-26, header scroll transition made more subtle (LOCAL, not pushed, style.css only): every part now eases over 0.45s (was 0.2 to 0.25s), the site header keeps more padding when condensed (22px, was 14px), the project title shrinks to 30px (was 22px) with no upward jump, and on wide screens the header, title bar and side menu cross-fade over 0.45s instead of switching. Change the single value `0.45s cubic-bezier(0.4, 0, 0.2, 1)` in those rules to tune it.
- (old open line follows) Open: the unshipped "Credit-flow mapping" screen on AI Credits; Installations next steps vs the deck's; a summary of what a push makes live (global rule: warn first, push only on her word).

## Goal
Make every project page more impressive for hiring managers and recruiters. Target role: full-time product design role, with AI and code involvement, not Figma-only.

## Hard rules (from CLAUDE.md and Avigail)
- No em dashes or en dashes in any copy, captions included. Use a comma, colon, period, or a plain " - " like the other captions on the page.
- No specific numbers, percentages, or dollar amounts in project content (legal). Use plain directional words. Years and dates are fine.
- No hype words ("amazing", "strong growth"). Say what happened.
- No line of copy ends on a single word (English widow rule).

- Subtitles and captions are short and do not repeat their title.
- Do not describe screens she did not design. Ask first.
- Never invent facts. If a claim needs data she has not given, mark it as an open question. Only claim what her sources support (the page, the CV, her Drive decks).
- She reverses decisions quickly. 
- She makes many small changes so you should make the change locally and ask if she wants to make more changes or push it. 
- pushing means she wants it to go live
- only change things when she asks for it. she may just ask a question

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
- Replies stay short (her request 2026-10-14): what changed, what is open, one next question.
- Layout taste: captions below images; sub-headings bold Plus Jakarta Sans; body text in the body font (Jakarta only for titles); plain bullets, no dividers or arrows; no toggles for her screens (she cuts screens herself); yellow boxes only for principles and the seven design points.
- "mm ok" means yes. "mm no" or "no no" means drop it and do not re-pitch variants.

## Workflow
1. Content lives in Notion (Avigail Bahat Portfolio CMS). Page IDs are in CLAUDE.md. ALL content edits go in Notion, never only in generated files.
2. Edit the Notion page with the smallest possible change (update_content, not replace).
3. Regenerate: `node generate.js <slug>`. NOTE: it rebuilds all of dist/ whatever the slug, so other files in git status change too. An image download can fail on a network blip: rerun it and check that `<img src>` points to `../images/...` and not an amazonaws URL.
4. ALWAYS show her a local preview of the real clickable page: copy dist/ into the session scratchpad, serve it with `python3 -m http.server <port> --directory <copy>`, verify it returns 200, open the page in the browser pane, and say the URL. Do this after every page edit, without being asked. Also check mobile (375px) for anything layout related.
5. NEVER commit or push without her explicit go, and warn her first (global rule): say what changes on the live site. Deploy runs on push only.
6. Before committing, `git diff` for edits that are not mine (Codex may edit the same repo). Stage only files for this work.
7. Backups: before restructuring a Notion page with images, duplicate it (notion-duplicate-page). A duplicate created inside the CMS parent would be published as a project, so MOVE it out immediately (notion-move-pages to the workspace) and title it BACKUP. App Review Platform backup (2026-10-13, before the sections were reordered): https://app.notion.com/p/3f835a9ccf7a815aba62d4a8bee5aae7
8. Notion image blocks cannot be duplicated by reusing the same `notion-file-block://` reference: Notion MOVES the image and leaves empty columns. To show an image twice, upload a copy (notion-create-file-upload, then POST the file with curl, then reference `file-upload://<id>`). Check the original place still has its image after any edit with images.
9. Text edits: `update_content` with an exact old_str (fetch first, text may have changed). It CANNOT match uploaded image blocks by their notion-file-block URL ("no matches found"). To move or remove image blocks, take a BACKUP duplicate, fetch the page, and use `replace_content` with the full fetched markdown (keep every notion-file-block source exactly), then compare the image list before and after.

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

### Principle cards and Results rows (built 2026-10-20, LOCAL, not committed; layout taken from her Intuit portfolio deck "Intuit Portfolio Presentation", Claude Slides artifact https://claude.ai/artifact/QAgonQkDu6qAyyNnAp5Fws)
- Design principles as numbered cards: in Notion, under `### Design principles`, an optional bridge line, then a list whose items read `**Title** sentence | Tag`. `splitRules()` in generate.js turns it into `.proj-rules` cards (number, title, sentence, tag pill). If the list sits in a two-column block with Research, the cards leave the column and run full width under it. 4 across on wide screens, 2x2 under 1100px, 1 column on phones. On AI Credits (text sits beside the widget) cards are one column.
- Results as a lead plus rows: in Notion, under the h2 "Results..." or "Impact...", a lead paragraph, then a list of `**Label** sentence` items (italic items become quotes), and the next steps either as `### Next steps` inside the section or as the `## Next steps` section right after it. `buildResults()` makes `.proj-results` (lead and quotes on the left, labelled rows on the right, Next steps as the last row). A section without bold-labelled list items is left alone, so other pages are unaffected.
- Applied to App Review Platform, Installations and AI Credits (Notion text edited, not the full shortened drafts). Titles on Installations and App Review stay in her page wording; tags are from the deck where it had them, otherwise one word chosen by me (Familiarity, Clarity, Relevance, Compliance, Flexibility), confirm.
- Open: AI Credits "Upgrade rate improved" row is in her deck, not confirmed for the site (item 4); AI Credits Bottom line still says "no support tickets" (item 1); App Review "Shorter cycles" row says fewer rounds and shorter rounds (deck wording); Installations next steps text unchanged from the page while the deck lists Contacts, an account view and cancellation reasons; saved views delivered or next step is unanswered. The deck's "5 major apps" is NOT used (no numbers). Decks on the site are not synced with these edits (App Review deck unchanged).
- Side menu: Installations no longer lists "Next steps" (absorbed into Results).
- 2026-10-22, AI Credits: the principle cards now run full width (4 across) under the widget row, and "Impact & next steps" sits last, after the screens and before Bottom line (her call: "impact should be last"). generate.js splits the widget grid at the Design principles heading. Screens still have no h2 of their own on this page (they sit under Process in the menu): ask before adding a "Solution" heading.

## Side menu on project pages (deployed 2026-10-13, commit 468739a)
- Left margin, fixed, wide screens only (min 1200px wide and 820px tall), hidden on mobile. Built from the page headings in generate.js (ANCHOR_NAV, every project page), styled in style.css (end of file), behaviour in script.js (end of file).
- Items copy the App Review deck side nav: number and label, grey #555, hover light grey background only (text stays grey), selected #0a0a0a weight 500, no radius, no transition. The site's "nav a" styles are reset for it.
- Top of the menu: Avigail Bahat with the role line (same style as the top bar, leads home), then the project name in Plus Jakarta Sans (hover shows "Back to top").
- Before scroll the menu is hidden. After about 104px the site header and the sticky title bar hide and the menu appears. Previous and next project links sit at the bottom of the margins.
- Pages with fewer than 3 h2 list their h3s instead (App Pricing Page: five numbered features plus Bottom line). Pages with fewer than 3 items get no menu.
- Tried and removed: sub-sections in the menu (Research, Design principles under Approach).
- Fixes that apply to every project page: the title's bottom line no longer flashes black, the subtitle no longer jumps left on scroll, the tags row hides on scroll, lightbox captions are white.
- Not checked in a real wide browser: AI Credits (custom layout) and the thin menus on the older pages.

## Presentation mode (deck) for App Review Platform
- A separate, hand-edited file: `dist/projects/internal-review-demo.html`. It is NOT generated from Notion; generate.js keeps it (`KEEP_PROJECT_FILES`). Edit it directly and keep it in sync with the Notion page.
- The "Presentation mode" button under the page subtitle links to it. She wants it.
- Current order (16 slides, same order as the page): 1 Cover (title on 3 lines), 2 TL;DR (3 bullets, body style), 3 The problem (plain bullets), 4 Research (plain bullets), 5 Principles (yellow boxes), 6 Redesigning the platform (seven yellow boxes, 3 columns, subtitle "The main things we solved in the new product."), 7 Product areas, 8 Apps directory and review queue, 9 App page, 10 and 11 Review workflow, 12 and 13 Publish flow (continued has a subtitle), 14 Team management, 15 Delivery & challenges ("Challenges" is a bold Jakarta sub-title), 16 Impact & next steps (plain Bottom line, tight paragraph spacing).
- Style: titles Plus Jakarta Sans, body Inter 17px (never Jakarta for body text), plain bullets (no dividers or arrows), yellow `research-card` boxes for principles and the seven points, captions below images, lightbox caption white.
- Side navigation ported from the Queuewe deck (dist/queuewe/index.html): 170px list, numbered from each slide's `data-label`, hidden on the cover, round menu button and drawer at 1100px and below. New slides need a `data-label`.
- Known differences from the page: the deck's TL;DR bullets use the earlier wording (page says "internal app review tool" and "the team has used the tool and added features to it since the 2022 launch"); the two removed screens (Existing comment, Publishing loading state) may still be on the deck's Review workflow and Publish flow slides; the deck has no Last updated line or side menu of the page; principle 4 wording should match the page ("Keep the account managers in control").

## Presentation mode (deck) for Installations Page (built 2026-10-15, LOCAL, not committed). SWITCHED OFF 2026-10-18: she does not want a presentation mode for Installations for now. The button is off (entry commented out in PROJECT_DECKS in generate.js) and the deck file is kept but must NOT be committed or pushed unless she asks. It holds unblurred third-party screenshots (customer emails, shop URLs) on the 'What developers used instead' slide.
- File: `dist/projects/installations-demo.html`. Hand-edited like the App Review deck: it is not generated from Notion, generate.js keeps it (`KEEP_PROJECT_FILES`), and the "Presentation mode" button comes from `PROJECT_DECKS` in generate.js (slug to deck file; both decks are listed there).
- Built by copying the App Review deck (internal-review-demo.html) so the CSS, side nav, dots, lightbox and keyboard behaviour are identical. Only the slides and the side-nav title changed. Do not restyle it on its own; change both decks together.
- 14 slides, in order: Cover (hero image, badges, title on two lines), TL;DR (3 bullets), The problem, Research, Principles (4 cards), Challenges (list plus the Server image), Design, The page (Default view, Column customization), Full columns and filters, Behind the scenes (Figma Make, Cursor), Edge and empty states (4 images), Delivery, Results & impact (with the two developer quotes), Next steps & bottom line.
- Copy is taken word for word from the Notion page. No numbers, no em dashes. When the page changes, change the deck in the same turn.
- Checked at 1440 x 900: no slide overflows and no caption overlaps an image. Not checked: 375px and the 1100px side-nav breakpoint (inherited from the App Review deck).
- To add another deck: copy an existing deck, replace the slides, add the file to KEEP_PROJECT_FILES and an entry to PROJECT_DECKS.

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

## Standard page structure (use this order on every project page; final on App Review Platform 2026-10-14)
All of it is written in Notion. Headings are plain `##` (section) and `###` (sub-heading). Old names: Process is now Approach plus Solution, Impact is now Impact & next steps, the old Screens section lives inside Solution.

| # | Heading | What goes in it |
|---|---|---|
| 0 | Title, italic subtitle line, hero image | Subtitle states the outcome in one line, no numbers. The hero image is not clickable (automatic). |
| 1 | `TL;DR:` (no heading) | Three sentences, one per column: what I did, how I got there, the outcome. Either one paragraph starting "TL;DR:" or a "TL;DR" line followed by three paragraphs (the generator handles both). |
| 2 | `## The problem` | First sentence names the problem. The cause (state loops as loops). The consequence as bullets. Ends on what we noticed that the outcome answers. |
| 3 | `## Approach` | A two-column block: `### Research` (what you did, then the pain points as bullets) next to `### Design principles` (one bridge line, then the principles in her words). Text only in the columns. |
| 4 | `## Solution` | Everything visual, in this order: `### Redesigning the platform` (numbered goal-first list, then ONE image, caption says a second tab shows the previous report); `### Deciding on the product areas` (one line, the four area images, "Click any image to see it bigger."); then the full screens grouped under `###` with short captions. Long groups may be toggles (Publish flow and Team management are). She does NOT want more toggles: she removes screens herself. |
| 5 | `## Delivery & challenges` | One paragraph for delivery (syncs, bug hunt and its finding), then `### Challenges` with two or three bullets. |
| 6 | `## Impact & next steps` | Bold first sentence, then what changed (directional, no numbers). Then `### Next steps`: one or two sentences, only facts she gives. |
| 7 | `## Bottom line` | One or two sentences, personal voice. Plain paragraph, not styled as a quote. |
| auto | Last updated line, More work, side menu | Generated. Do not write them. |

Why this order: the story and the result come first, then the long visual section; headings are grouped so the end of the page is not four tiny sections.

Rules for whoever builds a page:
- Use only facts from the page, her CV, her Drive decks, or what she says. If a section has no source, ask one question; do not invent. (Role and team: she declined a role strip.)
- Keep her wording when she writes it herself. After two "no" answers to proposals, ask for her exact line.
- Write "Wix App Market" in full on first mention so the tooltip appears.
- Captions: `Label - what it shows or lets you do`, lowercase after the hyphen, no trailing period, shown BELOW the image (page and deck).
- Check the page in the local preview at 1440px and 375px. Do not push without her explicit go, and say what the deploy will make live.
- Keep replies short: what changed, what is open, one next question.
- If the project has a presentation deck, keep it in sync in the same turn, and END EVERY PAGE EDIT REPORT with a line saying whether the deck is in sync and what differs.
- Notion image blocks: see Workflow items 7 and 8.

## Case study checklist (Product Design Case Study Cheatsheet, saved 2026-10-13)
Use it as a final check on every project page. It is generic advice, so the "Our rules" column wins where they conflict.

**Structure (in order)**
| Section | What it should answer | On our pages |
|---|---|---|
| Summary | Quick overview of what you achieved, summarize the impact | TL;DR card |
| Problem framing | What is the problem, why does it matter, what data supports it | The problem |
| Role and team | Your role, what the team looked like | Skip the role strip (declined on App Review). Name the PM, engineering, writers in the text |
| Approach | Your strategy, any research | Process: Research, Design principles |
| Challenges | Unexpected challenges with your team | Principles and Delivery. Installations removed its constraints section on purpose |
| Solution | What you came up with, shown with mockups | Screens |
| Results and impact | What the results were, actual change in KPIs if you have them | Impact. Directional only |
| Next steps | What you plan to do next, and why | Often missing. One sentence is enough |

**Ground rules:** create a story. Optimize for scanning. Clear headings. Just enough process. Keep it polished. Quality over quantity.

**Avoid:** design thinking diagrams, many sketches or wireframes, lorem ipsum placeholders, angled device mockups.

**Scan test:** a hiring manager will skim it quickly. Does it pass the scan test?

**Our rules over the cheatsheet**
- No numbers, percentages or dollar amounts (legal). Ignore "show KPIs".
- No marketing tone. Plain, factual, first person. Do not copy the "Helping [company] achieve X by Y" headline format.
- Never delete screens. Too many screens: put them in a toggle, like "Publish flow" on App Review Platform.
- Format: our site is the high-effort version. Ignore the format ranking.

**Per-page status against the checklist (2026-10-13)**
- App Review Platform: all sections present as headings (2026-10-13, local): The problem, Approach (Research, Design principles), Delivery, Challenges, Results and impact, Next steps, Solution (decisions, redesign list, and all screens), Bottom line. The deck has Challenges (tagged Delivery) and Next steps too, and keeps results at the end. Generator: a plain "Solution" or "Screens" h2 stops the auto-injected "Screens" heading.
- Installations: Summary, Problem, Approach, Solution, Impact present. Next steps removed (roadmap lines dropped as duplicates), Challenges only in principles, 13 screens (consider a toggle for edge and empty states).
- Other pages: not audited yet.

## Site reference by page type (moved here from CLAUDE.md on 2026-10-14; this file is now the single place for structure)
Verified against the generated site on 2026-10-14. Where CLAUDE.md was out of date, this section wins.

### How the site is built
- Content is written in Notion (parent "Avigail Bahat Portfolio (CMS)"). `node generate.js` (or `node generate.js <slug>`, which still rebuilds everything) fetches it and writes `dist/`. Pushing to `main` runs GitHub Actions, which rebuilds from Notion and deploys to GitHub Pages (avigailba.com).
- Files: `dist/index.html` (homepage), `dist/about.html` (About, CV and contact), `dist/contact.html` (redirect to About), `dist/design-system.html` (password-gated), `dist/projects/<slug>.html` (one per project), `dist/queuewe/` (separate take-home deck), `style.css` and `script.js` (shared, single files), `generate.js` (generator), `prompts/` (reference).
- The presentation deck `dist/projects/internal-review-demo.html` is hand-edited and kept by the generator (see "Presentation mode" above).

### Every page
- Header: sticky, condenses on scroll past 40px (`overflow: hidden` must be on the base `.avail-dot-wrap`, not only on `.scrolled`). Name and title on the left, nav on the right: "Projects" and "About & Contact" (there is no separate contact page; `contact.html` redirects).
- Footer: black, "Open to new work.", tags, email, LinkedIn, Design system link, "Built using Notion & Claude".
- Tab titles: `<Page name> | Avigail Bahat` (home: `Avigail Bahat | Senior Product Designer`).
- Mobile: hamburger opens a slide-in panel; filters become a dropdown.

### Homepage (index.html)
1. Header.
2. `.home-band` (80vw band, resets to full width with clamp padding at 960px and below) containing, in order:
   - Lede (Plus Jakarta Sans 28px / 500). Current text: "I'm a senior product designer with 10+ years at Wix, working across a large B2B platform: App Market, developer tools, and monetization flows for third-party developers." Open: it has no AI or code signal.
   - Featured work: 4 cards as one-column horizontal rows (title, subtitle directly below, arrow on the right). Order and titles come from `FEAT_ORDER` and `PROJECT_META` in generate.js. Subtitles come from the Notion subtitle line. When a Notion page is renamed, also change its title in `PROJECT_META`.
   - All work: header with filter buttons (All, Developer, Monetisation, Internal, CMS; a dropdown on mobile), then project rows (number, title, subtitle on hover, every category badge, year, "View"). Rows are an accordion that opens via script.js.
3. Footer.

### About page (about.html)
Built by `aboutPage()` from the Notion page "About & Contact" (ID in the table below). Current order: CV head (name, email, LinkedIn, CV download) then Summary, Key Achievements (4 items that mirror the featured projects), Experience (6 entries, year column plus content), Education, Tools. CLAUDE.md's old order (bio, Contact, Education, Experience, Skills) is obsolete. Known stale text: Key Achievements still says "Internal Reviews system" (now "App Review Platform"); the CV title is "Senior Product Designer".
- Experience uses Notion column layout (year in the first column, content in the rest). The generator turns year lines (`2025→2026`) into `notion-years`, `<strong>Company</strong>` plus a short role into `Company · Role`, and `col-layout` columns into the `.cv-row` / `.cv-col-year` / `.cv-col-content` grid (100px + 1fr, 32px gap).
- Standalone link paragraphs become contact links (`.about-contact-inline`, 14px / 500, blue, ↗ external or ↓ for Google Docs).
- Content width 720px (`.about-notion`).

### Project pages (projects/<slug>.html)
- Content structure: see "Standard page structure" above. Page chrome (generated): title block with year and category tags, subtitle, optional Presentation mode button, left side menu (numbered sections, wide screens), prev/next project links, then content, Last updated line, "More work" (4 other projects as rows).
- Lightbox: every content image except the hero opens full screen. Mobile: swipe left/right (40px threshold) and tap left/right half to navigate; the bare overlay closes on desktop.
- Row tokens (`.row`, `.row-wrap`, `.num`, `.row-title`, `.rsub`, `.row-year`, `.row-arr`, `.cat-tag`, `.feat-tag`) are defined once in style.css and shared by the homepage list and the More work rows. Never redefine them per page. `.row-wrap` starts at `max-height: 120px` on project pages and `0` on the homepage.
- Project page CSS essentials: `.proj-main` padding `0 clamp(40px, 20%, 240px)`; `.proj-content` no max-width; sub-headings (h3) Plus Jakarta Sans 20px / 700; captions below images; hero image not clickable.

### Design system page (design-system.html)
- Password-gated page generated from arrays in generate.js (`swatches`, `typeRows`, `spacings`, `changelog`, plus hand-written component blocks).
- Sections in order: Colours, Typography (numbered type scale), Spacing, Components (Desktop and Mobile tabs: Work item row, Filter buttons, Nav links, Project nav buttons, More work CTA, TL;DR box, Lightbox controls, Footer tags, Section label, Hamburger, Slide-in menu, Work row mobile, View buttons, Filter pill and dropdown, Featured card mobile), CSS variable reference, Changelog (newest first).
- When you add or change a component or style: add the component block, add or edit its type-scale row, add a changelog entry (date, what changed). The same TL;DR component is also specified in her Claude Design system "Avigail Bahat Site" (https://claude.ai/artifact/Wbabefj5U36if6bVvuyfP9, TldrBox, one to three sentences); update both.

### Global design rules (layout, colors, type, writing)

#### Layout
- **Horizontal padding: `clamp(40px, 20%, 240px)`** on header, footer, inner pages, project pages, more-work section.
- Homepage uses `.home-band`: `width: 80vw; max-width: 80vw; margin: 0 auto` — contains lede, feat-grid, work-header, and list. At ≤960px resets to `width: 100%` with clamp padding.
- `.feat-grid` also has `width: 80vw; max-width: 80vw; margin: 0 auto; overflow: hidden` — both the band and grid are 80vw so they share the same left edge. Featured cards are one-column horizontal rows, with the subtitle directly below the title.
- Inner pages (about, contact): `.inner-content` has `max-width: 720px`. Project pages: `.proj-content` has no max-width (wide layout is intentional).

#### Colors
- `--ac: #0a0a0a` — primary/accent (text, hover backgrounds)
- `--border: #ebebeb` — all borders
- `#555` — **single gray token** for all muted/secondary text: labels, numbers, subtitles, nav links, badges, years, arrows, captions, body copy. Do not use #444, #222, #bbb, #999, #767676, or #888 for text.
- White: `#fff`

#### Typography
- **Titles** (`.feat-title`, `.proj-title`, `.lede`, `.footer-statement`): `Plus Jakarta Sans` — weights 300–800
- **Body/UI** (everything else): `Inter` — weights 300–700
- Loaded from Google Fonts: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap`
- `-webkit-font-smoothing: antialiased` always on body

#### Writing rules
- **No em dashes (—)** anywhere in generated copy. Use commas, colons, or periods instead.
- **No specific numbers, percentages, or dollar amounts** in project content — legal constraint. Use directional language ("grew significantly", "majority of users") instead.

### CSS and script reference (kept verbatim from the old CLAUDE.md)

#### Shared CSS tokens (defined once in style.css)

Row tokens are shared between the homepage list and all project page "More work" sections. Define them **once** in style.css — never redefine per page.

##### Type scale
- Lede (homepage): `28px`, `font-weight: 500`
- Logo name: `16px`
- Nav links: `14px`
- Section labels: `15px`, uppercase, `color: #555`
- Featured card title (`.feat-title`): `clamp(24px, 2.5vw, 40px)`, `font-weight: 700`
- Featured card subtitle (`.feat-sub`): `15px`
- Row title (`.row-title`): `20px`, `font-weight: 500`
- Row number (`.num`): `14px`
- Row year (`.row-year`): `14px`
- Tags (`.cat-tag`, `.feat-tag`): `15px`, padding `4px 10px`
- Minimum font size anywhere: `14px`

##### Featured cards grid
- `.feat-grid`: one column, `width: 80vw; margin: 0 auto;`
- `.feat-card`: full-width row with the subtitle below the title and an arrow on the right; `padding: 48px clamp(40px, 20vw, 240px)` so its content aligns with the site gutter
- Mobile: title and subtitle stack vertically

##### All work rows
- `.row`: `padding: 28px 0`
- `.row-wrap.open`: `max-height: 120px`
- `#more-list .row-wrap` (project pages, always open): `max-height: 120px`

```css
:root { --ac: #0a0a0a; --border: #ebebeb; }

/* Row tokens */
.row-wrap { overflow: hidden; max-height: 0; transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1); }
.row-wrap.open { max-height: 120px; }
.row-wrap.hidden { display: none; }
.row { display: flex; align-items: center; gap: 10px; padding: 28px 0; border-bottom: 0.5px solid #ebebeb; cursor: pointer; transition: background 0.2s ease, padding 0.2s ease; }
.row-wrap:first-of-type .row { border-top: 0.5px solid #ebebeb; }
.row:hover { background: #f7f7f7; padding-left: 8px; padding-right: 8px; }
.row:hover .rsub { max-height: 40px; opacity: 1; }
.row:hover .row-arr { opacity: 1; }
.num { font-size: 14px; font-weight: 500; color: #555; min-width: 22px; flex-shrink: 0; }
.rmain { flex: 1; min-width: 0; }
.row-title { font-size: 20px; font-weight: 500; color: #0a0a0a; }
.rsub { font-size: 14px; color: #555; max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.2s ease, opacity 0.2s ease; margin-top: 1px; white-space: nowrap; text-overflow: ellipsis; }
.row-year { font-size: 14px; color: #555; flex-shrink: 0; min-width: 36px; text-align: right; }
.row-arr { font-size: 14px; color: #555; opacity: 0; transition: opacity 0.2s ease; flex-shrink: 0; }
.cat-tag { font-size: 15px; color: #555; border: 0.5px solid #e0e0e0; border-radius: 3px; padding: 4px 10px; white-space: nowrap; flex-shrink: 0; }
.feat-tag { font-size: 15px; color: #555; border: 0.5px solid #e0e0e0; border-radius: 3px; padding: 4px 10px; white-space: nowrap; flex-shrink: 0; }
.section-label { font-size: 15px; color: #555; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 16px; }
```

Note: on project pages `.row-wrap` starts at `max-height: 120px` (open by default). On the homepage it starts at `0` and opens via the accordion JS.

#### Header script (all pages)
Sticky, condenses on scroll past 40px. `overflow: hidden` must be on the **base** `.avail-dot-wrap` state (not only on `.scrolled`) to prevent content peeking during transition.

```js
(function() {
  var hdr = document.getElementById('site-header');
  if (!hdr) return;
  window.addEventListener('scroll', function() {
    hdr.classList.toggle('scrolled', window.scrollY > 40);
  });
})();
```

#### Project page CSS
```css
.proj-main { padding: 0 clamp(40px, 20%, 240px); }
.proj-content { padding: 56px 0 80px; }
.proj-title { font-size: 42px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 16px; }
.proj-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
.proj-meta-item { font-size: 14px; color: #555; }
.proj-meta-sep { font-size: 14px; color: #ccc; }
.proj-intro { font-size: 17px; font-weight: 500; color: #0a0a0a; line-height: 1.6; letter-spacing: -0.01em; margin-bottom: 48px; padding-bottom: 48px; border-bottom: 0.5px solid #ebebeb; }
.proj-body { font-size: 15px; color: #444; line-height: 1.75; }
.proj-body + .proj-body { margin-top: 16px; }
.proj-img { width: 100%; border-radius: 8px; margin: 32px 0; overflow: hidden; background: #f5f5f5; }
.proj-img img { width: 100%; height: auto; display: block; border-radius: 8px; }
```

#### Lightbox
Images in `.proj-content` are clickable and open a full-screen lightbox.

Key CSS values:
- `.lb-overlay`: `padding: 48px 16px 24px`
- `.lb-img`: `max-width: 100%; max-height: calc(100vh - 120px); width: auto; height: auto; object-fit: contain;`
- Mobile (≤600px): `.lb-handle { display: none; }`

Mobile interaction (in script.js):
- **Swipe**: `touchstart`/`touchend` on `.lb-overlay` — threshold 40px, swipe left = next, swipe right = prev
- **Tap zones**: when `window.innerWidth < 600`, overlay click uses left/right half of screen to navigate (left half = prev, right half = next) instead of closing
- Desktop: clicking the bare overlay (`.lb-overlay` itself as target) still closes

#### About page CSS classes
```css
.about-notion { max-width: 720px; padding: 56px 0 80px; }
.about-notion h2 { /* section labels: uppercase, #555 */ }
.about-notion > p:first-child { /* bio: 18px/500 */ }
.about-notion .notion-years { font-size: 14px; color: #555; }
.about-notion p:has(> strong:only-child) { /* company·role line: 16px/600/#0a0a0a */ }
.about-notion p:has(> em:only-child) { /* project list: 14px/#555 */ }
/* CV columns */
.about-notion .cv-row { display: grid; grid-template-columns: 100px 1fr; gap: 0 32px; margin-bottom: 32px; }
.about-notion .cv-col-year { padding-top: 3px; }
/* Contact links */
.about-contact-inline { font-size: 14px; font-weight: 500; color: #2b6cff; text-decoration: none; border: none; padding: 0; }
```

### Notion page IDs

| Page | ID |
|------|----|
| AI Credits Wallet | 31135a9ccf7a804caf72da07638205bc |
| App Installation View | 31135a9ccf7a80358e3cead5465c89f8 |
| App Reviews Revamp | 31135a9ccf7a80bdad92eff1f90e6ecf |
| Developer Sale | 17d35a9ccf7a80c69ceafb3f7973485a |
| App Collections | da073f156b004fbb87d927849587a28c |
| Internal App Review System | 71024356b51b4ce8b46c21fa3a442020 |
| Payouts Page | 0f54649479514c65bc990b4b594d0cb1 |
| Refund Flow | b103bffdedd247569c67b422c90cfcd3 |
| App Pricing Page | 17d35a9ccf7a8021b6ebcccd15c1d39d |
| Submit & Publish Widget | c4b2bd7033384f7792fb167115baac33 |
| App Coupons | ad5fdda62b7344068e537404e15ee8ad |
| Custom Element Settings | 9053adab5f3144159fc991711d4e82f7 |
| API Keys Page | af4b341536b44d5495d067982a1b358c |
| Development Site Creation | 84911e6052cd480c807e6591b58833a9 |
| About | 36e35a9ccf7a81f6953dcab2aebb27fc |
| Contact | 36e35a9ccf7a8188a447fd3e36ee88cd |
| Homepage (tagline) | 37135a9ccf7a81b2a7a7c0a2702d8c98 |

### Project slugs and categories

| Slug | Category | Year | Featured |
|------|----------|------|---------|
| ai-credits-wallet | developer | 2026 | yes |
| app-installation-view | developer | 2025 | yes |
| app-reviews-revamp | developer | 2024 | no |
| developer-sale | developer monetisation | 2024 | yes |
| app-collections | developer internal | 2024 | no |
| payouts-page | monetisation | 2023 | no |
| refund-flow | monetisation | 2023 | no |
| app-pricing-page | developer monetisation | 2023 | no |
| internal-app-review | internal | 2022 | yes |
| submit-publish-widget | developer | 2022 | no |
| custom-element-settings | cms | 2022 | no |
| api-keys-page | developer | 2022 | no |
| development-site-creation | developer | 2021 | no |
| app-coupons | monetisation | 2021 | no |

### Prompt files (in prompts/, reference only)
- `homepage-prompt.md` — homepage layout, featured cards, filter, row tokens
- `project-page-prompt.md` — project page layout, lightbox, more-work section
- `sitewide-components-prompt.md` — header + footer used on all pages
- `inner-pages-prompt.md` — About and Contact page layouts

## Project status

Status key: TODO, PROPOSED (lines shown, waiting for her word), DONE LOCAL (in Notion and regenerated, not committed), DEPLOYED.

### App Review Platform (slug internal-app-review-system, Notion 71024356b51b4ce8b46c21fa3a442020): DEPLOYED 2026-10-14 (latest push dfe52db; earlier b2b601b, 235f23a, c755bd1)
Renamed from "Internal Reviews System" (clashed with "Reviews Revamp"). Slug unchanged. Backups (private, outside the CMS): several BACKUP pages at the Notion workspace root, latest 2026-10-14 before the screens were removed.
- Subtitle: "Ground-up rebuild of Wix App Market’s internal review platform that shortened review cycles."
- Page order: TL;DR, The problem, Approach (Research | Design principles), Solution (Redesigning the platform + one image, product areas, screens), Delivery & challenges, Impact & next steps, Bottom line.
- Screens: 23 images. Removed on purpose at her request: "Existing comment" and "Publishing - loading state". Do not delete screens otherwise.
- Done and decided: captions rewritten (25, pattern above), principle 4 "Keep the account managers in control" (her wording), challenges and next steps from her sources, bold Jakarta sub-headings, bottom line as plain text.
- Open: (a) the diff finding appears in both the Delivery paragraph and a Challenges bullet, decide which to drop; (b) TL;DR title in Jakarta bold was previewed, not applied; (c) deck card titles bold Jakarta? not answered; (d) remove the two screens from the deck; (e) she mentioned "c2c" for the columns and never explained it.
- Pattern to reuse on the other pages: the standard structure above.

### AI Credits Wallet (slug ai-credits-wallet, Notion 31135a9ccf7a804caf72da07638205bc): DONE LOCAL 2026-10-22 (restructured from her Intuit deck, not committed)
- Restructured to the standard: subtitle (her handoff draft), TL;DR (three sentences, no upgrade-rate claim), The problem, Approach (Research, Design principles as cards), Solution (numbered list, Where users see their credits, all screens), Delivery & challenges, Impact & next steps (lead plus rows), Bottom line. Text from her deck slides (problem, discovery, principles, users, environment, tiers, states, delivery) and her handoff draft (Challenges shortened to four). Old Process section removed; its points were folded into Solution and Delivery.
- BACKUP before the restructure: Notion workspace root, "BACKUP AI Credits Wallet 2026-10-22 (before restructure)" (https://app.notion.com/p/40135a9ccf7a81eab82ffaa2cb178ddd).
- All 11 images kept in their groups; every caption rewritten to `Label - text` with no em dashes. Added "Click any image to see it bigger."
- Left out on purpose: the deck's "5 credits" low-credits number, "Cursor" (the Implementation caption still says Claude Code & Superset: pick one), the collaborator wallet as a Solution item (it stays in Next steps).
- Open: Bottom line still says "no support tickets, no confusion" (she was unsure it is true); "Upgrade rate improved" row not confirmed; homepage card subtitle in PROJECT_META is older than the page subtitle; the screens group has no h2 of its own (they sit inside Solution now, so this is fixed).
- 2026-10-22 later: screens swapped for the more recent ones from her deck (uploaded to Notion): In context (Business Manager, Wixel mobile), One component two tiers (free, premium, premium with top-up), Embedded in a page (free, premium), Wallet states (low credits, error, loading). The 7 older screens they replace (Free and Subscription wallet BM, Free wallet Wixel, the four "all surfaces" composites) are only in the BACKUP pages now; Paywall modal, Out-of-credits notification, Implementation and Credit-flow mapping stay (the deck has no newer version). The interactive widget now sits next to the Solution section (generate.js, ai-credits-wallet block), not at the top. Notion is the source: structure, captions and images are all in the Notion page.
- 2026-10-22 evening, AI Credits: "One component, two tiers" and "Embedded in a page" screens removed (the interactive widget beside Solution shows the tiers), "Wallet states" renamed "Edge cases" with small cards, In context pair aligned with a grey box for the phone shot. The collaborator screen question ("Credit-flow mapping", not shipped) is OPEN: recommended removing it, waiting for her word. Top hero: she wants the Business Manager "Welcome back, Carol" dashboard with the profile menu open; the hero is now that image (she re-sent it and it was saved, uploaded to Notion 2026-10-22). Pasted chat images are only saved to disk sometimes: if one is missing, ask her to send it again.
- 2026-10-22 evening, new components (generate.js + style.css, Notion shapes in comments above each function): `buildProblemColumns` (The problem: statement and quotes left, "### ..." rows right; italic paragraph plus plain text on the same line = quote with attribution) used on AI Credits and Installations; `buildDeliveryColumns` (Delivery & challenges: two-column block, "### Process" and "### Challenges", bullets become bordered rows) used on all three pages. App Review's problem section is NOT converted yet (asked).
- 2026-10-22, Installations: restructured to the standard order (Delivery & challenges now after Solution, the Server image sits under it, the old Challenges section and the Delivery sub-section are gone). Duplicate screens removed: the small Default view and the second Column customization (the big Default view and the one with Full columns stay under "The page"). The hero is the framed crop again (re-uploaded from the site cache). Backup: BACKUP Installations Page 2026-10-22 at the Notion workspace root. Deck facts used: partners, handoffs, export rollout, quotes with attribution (no "21 apps" number).
- 2026-10-22, App Review: Delivery & challenges now the two-column rows from the deck (partners, weekly syncs, working in parallel, bug hunt; three challenges). The bug-hunt diff finding is gone from the page.
- 2026-10-22, ALL project pages: one 12-column grid with a 32px gutter for every column layout (image columns, cards, results, problem, delivery, TL;DR) so edges line up; splits are 6+6, 4+4+4, 3+3+3+3, problem 8+4, results 4+8. The TL;DR box reaches 40px past the text so its columns sit on the same lines. Check other project pages with columns before pushing (not checked yet).
- 2026-10-22 night, AI Credits: Edge cases (low credits, error, loading) and Paywall & notifications (paywall modal, out-of-credits notification) screens REMOVED at her request (they are in the Notion backups and in her deck); Behind the scenes is now two images side by side; the interactive widget has the caption "Use the top selectors to see more wallet states" (hard-coded in generate.js, ai-credits-wallet block). Solution list item 5 still lists the states in words. The collaborator screen question is still open (Credit-flow mapping is still on the page).
- 2026-10-22 night, App Review: The problem is in the deck layout (loop explanation kept on the left, six rows on the right: the deck's four plus "No shared history" and "No visibility into what changed between submissions").
- 2026-10-22 night, deck-style section headings (TRIAL on AI Credits only): a Notion h2 written `## Label | Title` renders as a small uppercase label above a large title (`.proj-h2`, generate.js at the end of projectPage). The side menu and anchors use the label only. AI Credits headings: The problem | Explaining a new AI credits model; Approach | Mapping the credits model with each team; Solution | One wallet skeleton, two tiers, three platforms; Delivery & challenges | Working with the team; Impact & next steps | What happened after launch (all from her deck slide titles). Other pages unchanged until she asks. The deck's "Discovery" label was kept as "Approach" (site standard).
- 2026-10-22 late: deck-style `Label | Title` headings now on all three pages (titles = her deck slide titles). Installations: Developers couldn't see who installed their apps / Most of the work was scoping the table / A default view developers can customize / Working with the team / Developers adopted the top requested page. App Review: Reviews couldn't keep up with submissions / Watching how reviewers work / Divided the tool to four product areas / Working with the team / From a stale tool to the new platform. BOTTOM LINE REMOVED from all three pages at her request (text kept in the Notion backups; the standard structure above no longer ends with Bottom line on these pages). Section spacing increased (h2 top margin 96px). Delivery & challenges is now 1/3 (Process) + 2/3 (Challenges) so it lines up with Results; The problem statement paragraphs are body style (Inter 16px #555), not large. AI Credits: "Where users see their credits" bullets now sit directly above the two In context images (the "In context" sub-heading is gone). The deck does the opposite on that slide: images in a grey panel on the left, the bullets on the right with "The principle in action: One wallet everywhere".
- 2026-10-22 late night: Results lead sentence is body style too. Installations: the Server screen now sits with Figma Make and Cursor under Design (three in a row). App Review: Publish flow shows three screens per row (second row has an empty third cell). Developer Sale is NO LONGER FEATURED on the homepage (FEAT_ORDER and PROJECT_META in generate.js), it stays in All work; the homepage shows three featured cards now (App Review Platform, AI Credits Wallet, Installations Page). Put it back by restoring both entries.
- 2026-10-22 end of day: Installations: the "Inline data-limit tooltip" screen moved from under Design principles into the Design images (four in a row with Figma Make, Cursor, Server); the identical copy in Edge & empty states was removed (Edge now has three in a row). PREVIEW CACHE LESSON: her Chrome kept showing an old copy of the local preview (plain `python3 -m http.server` sends no cache headers). Serve the preview with scratchpad/nocache_server.py (adds Cache-Control: no-store) on a fresh port, e.g. `python3 nocache_server.py 8792 <copy of dist>`, and give her the new port.
- 2026-10-22 end of day, App Review Approach now follows the deck's discovery slide: a two-column block "### Research process" (Walkthroughs, Shadowing, Audit, Analytics) and "### Pain points" (the deck's four), equal halves (`proj-dc proj-dc-even`, generate.js `buildRowColumns`), then "### Design principles" cards flat underneath. The older four pain points (confusing UI, hard to write a consistent review, weak information architecture, no integrated workflow) are replaced by the deck's wording; Solution item 7 still says "answering the confusing UI complaint from research". Installations and AI Credits Approach are NOT converted yet (asked).
- 2026-10-22 end of day, App Review Solution: the numbered "Redesigning the platform" list (Order, Continuity, Consistency, Faster, Scale, New status, Familiar) was REMOVED at her request ("the deck is better") and replaced by the deck's four product area cards (`### Product areas` list in Notion, items `**Title** text | bold fix line`, generate.js `buildAreaCards`, `.proj-areas`). The goal-first list rule in "How she wants copy written" no longer applies to App Review. Text of the old list is in the Notion backups. The "Review report" screen now sits right under the cards, then "Deciding on the product areas" (four screens) and the other screen groups as before.
- 2026-10-22 end of day, App Review: (1) the "Review report" screen under the product area cards was removed (the same kind of screen stays in Review workflow); (2) "Deciding on the product areas" and its four screens (All apps, App page, New review workspace, Account Managers team) REMOVED at her request, the cards replace them (the "Click any image to see it bigger" line moved to the Apps directory intro); (3) Design principles now match the deck: three rules (Make every step traceable, Highlight app changes, Still keep the account manager in control), deck wording, tags Accountability, Velocity, Control, bridge line "We decided on three rules." "Fit the existing workflow" is gone. The page now has 18 images (was 23). The removed screens remain in the Notion backups.
- 2026-10-22 end of day, App Review: Approach columns are now 2/3 (Research process) + 1/3 (Pain points) (`proj-dc-even` is 8+4). Two screenshots of the OLD tool (App Manager: app page with version history, and the diffs view) from the deck's "The review tool was too basic" slide were added under The problem, side by side, captions written by me from what the screens show ("Old tool, app page - ..." and "Old tool, diffs - ..."). The page has 20 images. The deck's sentence for that slide ("account managers could only approve or decline an app, the review happened in Google Docs and Sheets") is NOT on the page.
- 2026-10-22 end of day, App Review: the two old-tool screenshots now sit INSIDE the left column of The problem, under the two paragraphs, side by side (CSS `.proj-prob > .col:first-child` is a 2-column grid; any images placed in that column show side by side). Still 20 images.
- 2026-10-22 end of day: the two old-tool screenshots in App Review's The problem share one square box (`aspect-ratio: 1 / 1`, `object-fit: contain`, top aligned) so their captions line up; the grey placeholder block under the second one is gone.
- 2026-10-22 end of day: old-tool captions on App Review corrected, the old tool had NO comments feature (so never say it did): "Old tool, app page - team members and a version history" and "Old tool, diffs - comparing two versions". Do not describe the old tool as having comments anywhere on the page.
- 2026-10-22 night, Installations restructured like the deck (she said "I like this structure better"): Approach = deck discovery slide (statement + five rows on the left, "Examples of workarounds" with two screenshots on the right; the 2nd screenshot is CROPPED to remove a faint customer name and "Hey Ivona" line; both come from her deck and are already blurred). Solution = deck design slides with new sub-heading style `### Label | Title` (`proj-h3`) and screen-plus-text layouts: `proj-shot` (image 2/3 + bullets and "The principle in action" 1/3: Exploration, Default view, Missing data) and `proj-shot2` (two screens with bullets under each: Columns and filters), generate.js `markShotLayouts`. The old page images the deck versions replace were REMOVED: Default view (big), Column customization, Filtered view, Inline data-limit tooltip; kept: Figma Make, Cursor, Server (Behind the scenes row) and Full columns, Private apps, Empty state, Empty columns (Edge & empty states row). 15 images on the page. The old "Design" bullet list and the old Research paragraph are gone. MISTAKE TO AVOID: a replace_content call with placeholder image refs wiped the Notion page once (restored the same session from the last full text and re-uploaded images from dist/images). Never send a partial page to replace_content.
- 2026-10-22 night, Installations order changed at her request: the Exploration section (Figma Make mock) now sits at the end of Approach (after Design principles); Solution (title "A default view developers can customize") starts with Default view, then Columns and filters, then Missing data, Behind the scenes, Edge & empty states. 15 images still.
- 2026-10-22 night, all project pages: screens in the same row share one 3:2 box (object-fit contain on grey #f5f5f5) so captions line up even when the screens have different shapes (CSS `.col-layout:not(.proj-shot):not(.proj-shot2):not(.proj-prob) .col > figure img`); stacked screens have a 32px gap; Delivery & challenges is now 1/2 + 1/2 on ALL three pages (was 1/3 + 2/3; Approach on App Review stays 2/3 + 1/3, Results 1/3 + 2/3).
- 2026-10-22 night, Installations: the "Examples of workarounds" and "Default view" headings are now image captions; EVERY image on the page has a caption (workarounds, prototype, default view, columns panel, filters panel, missing data tooltip, plus the existing ones); all "The principle in action" notes were removed. App Review: the submission flowchart under The problem was replaced with a clean version (frame and "Section 1" label cropped off the deck's original; her own pasted version was not saved to disk, so this is my crop). App Review has 21 figures.
- Old notes below are kept for history.
- Opening is third person, run-on with a stray colon.
- Process lists tasks, not decisions (why two tiers, why collaborator wallet scoped out). Try the goal-first decision list.
- Impact and Bottom line repeat the same "silence" idea.
- Proposed opening: "Wix was rolling out AI features that consumed credits, and users had no clear way to see what they had or what happened when it ran out. I designed the credits wallet: one component for free and premium users, shipped across Business Manager, Wixel, and AI vertical pages."
- Add: "Shipped bug and design fixes directly in code with Claude Code and Superset."
- Pick one of "three products", "three surfaces", "three platforms" and use it everywhere.
- Add a TL;DR. Search Drive for an interview deck first.
- Caution: this page has a custom layout (credits widget iframe), so check it after the TL;DR is added.

### Installations (slug app-installation-page-for-developers, Notion 31135a9ccf7a80358e3cead5465c89f8): DEPLOYED 2026-10-13 (commits d9efad1 and 468739a)
Restructured to the standard. Current structure, in order:
- Subtitle: "Designed and shipped installation analytics that gave developers site-level visibility into how their apps were used" (her original line, verb added, "actually" dropped; she rejected every invented alternative).
- TL;DR card, three sentences: the page developers needed and the support emails; mapped the gap with the PM, worked through permission levels and PII limits with engineering, shipped part of it in code; developers who found it used it, feedback positive.
- The problem. Approach (Research, Design principles: Explain don't hide, Start from what developers asked for, Legal sets the boundaries, Let developers shape the view). Challenges (4 bullets from the page, plus the Server image). Solution (Design, Delivery, The page, Edge and empty states, all 13 screens). Results & Impact (with the two developer quotes as a list). Next steps (from the old roadmap lines). Bottom line (her own sentences about the complaint, deciding fields and the default view, and shipping features with AI tools).
- Removed on purpose: "co-built end-to-end", "two user types", the Working within constraints section, the old roadmap paragraph in Impact.
- Screens: Default view and Column customization sit in the first row under Design, and appear again in Screens as uploaded copies. Figma Make and Cursor are the second row. Server sits under Challenges. Nothing was deleted.
- Sources for the Installations story (read 2026-10-18, text only, Google Drive folder "Wix/Projects/Site list - app installation"): Account Level MGMT - 2024.pptx.pdf (152 pages: the bigger account-level plan, user voice, Shopify, Apple and Google Play research), Sites List.pptx.pdf (45 pages: problem, user voice, Shopify research, custom dashboards, early User List mock), Site List Product Spec.docx.pdf (phase one fields, actions, API ideas), Site List - Filter, Sorting & Search.xlsx - Sheet1.pdf (columns by phase, mostly blank). Extracted images are in the session scratchpad only.
- Used on the page (vague, no numbers or names): developers could not tell which customer was contacting them and kept their own installation records; the three documented uses (growth, support by instance ID, audience); next steps now also name tags and notes for developers and revenue per user; the Contacts connection challenge.
- Do NOT use: install or app counts, named developers or companies, Hebrew quotes, internal tickets and tools, the $ example, anything marked with a question mark in the spec (Updated date, Send email through inbox).
- Decided 2026-10-18: no "bigger effort / account level management" context sentence on the page (she said no).
- Dashboard images in Sites List.pptx.pdf (competitor and custom dashboards, Shopify partners stores list, a third-party admin table, a support chat panel, the early Wix User List mock): they show real customer names, emails and shop URLs and company brands. Not for the public site unless cropped or redrawn.
- Open: nothing else. Homepage card subtitle matches the Notion subtitle.

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
- 2026-10-14: Page and deck use the same grouped headings at the end: "Delivery & challenges" (Challenges as a sub-heading) and "Impact & next steps" (Next steps as a sub-heading), then Bottom line. Two screens removed at her request (Existing comment, Publishing loading state); 23 images left.
- 2026-10-14: Solution order on the page and in the deck: Redesigning the platform first (the seven points plus ONE image, the default Review report view, caption mentions the second tab with the previous report), then Deciding on the product areas, then the full screens. Notion lesson: update_content cannot match uploaded image blocks by their notion-file-block URL ("no matches"); to move or remove image blocks use replace_content with the full fetched markdown, after a BACKUP duplicate.
- 2026-10-14: Project page sub-headings (h3: Research, Design principles, Deciding on the product areas, and so on) are Plus Jakarta Sans 20px bold (700), like the section headings. Body text stays in the body font. Design system page row updated.
- 2026-10-14: Research and Design principles sit side by side in a two-column Notion block under Approach (text only, no images). Principle 4 reads "Keep the account managers in control" (her wording, kept). Columns stack on phones. The deck keeps them as two separate slides.
- 2026-10-14: Image captions rewritten on App Review Platform (25, page and deck): pattern `Label - what it shows or lets you do`, lowercase after the hyphen, no trailing period on the page, one term per concept (reviewer, developer, report). Draft and reasons: the-system/O-output/app-review-platform-captions/_process/02-copywriter-draft.md. Use the same pattern on the other pages. In the deck the product-area cards keep the bold label plus sentence form.
- 2026-10-14: Page order changed again: Solution (with all screens) now comes before Delivery and Challenges; Results and impact, Next steps and Bottom line are last. The deck follows the same order, with Delivery and challenges as one slide and Results, impact and next steps as one slide.
- 2026-10-13: Side menu rolled out to ALL project pages (consistency, her call), AI Credits included. Pages with fewer than 3 h2 list their h3s (App Pricing Page: its 5 numbered features + Bottom line). Prev/next project links sit at the bottom of the margins when the menu is present. Sub-sections in the menu were tried and removed. Pushed 2026-10-13.
- 2026-10-13: Anchor nav trial v2 (Installations only, wide screens): menu hidden before scroll. After scroll (about 104px) the site header and the sticky title bar hide and the project name (Plus Jakarta Sans) sits at the top of the left menu, click returns to top. Menu items copy the App Review deck side nav exactly (hover grey background only, text stays #555, active #0a0a0a 500, no radius, no transition); the site's top-menu nav a styles are reset for it. Previous-project link is left-aligned with the menu text. Top menu style (Projects, About & Contact) deliberately NOT changed.
- 2026-10-13: Side anchor navigation TRIAL on Installations only (local, not pushed). Left margin, numbered "01 TL;DR, 02 The problem..." in the App Review deck side-nav style, active item dark and 500. Wide screens only (min 1200px wide, 820px tall), hidden on mobile, appears once the sticky title condenses (so the title's bottom line never crosses it). Page list is ANCHOR_NAV in generate.js; code in style.css (end) and script.js (end).
- 2026-10-13: Installations headings follow the cheatsheet: The problem, Approach, Delivery, Results & Impact, Next steps, Solution, Bottom line. She likes Approach, Solution, Results & Impact, Next steps. App Review Platform still uses Process, Impact, Screens: ask before aligning it. generate.js renames a Solution h2 to Screens, so Installations is in SKIP_SCREENS to keep "Solution". Next steps text comes from the roadmap lines removed earlier (cancellation reasons, deeper filtering, inbox and email tools, discoverability).
- 2026-10-13: RULE, never delete or lose screens. Every image on a project page must still be on the page after an edit. In Notion, reusing an image's notion-file-block link MOVES the block, it does not copy it, so putting a screen in a new spot empties its old spot. Before and after any image edit, list every caption on the page and confirm none is missing. Do not replace an image to "swap" it without putting the old one back somewhere.
- 2026-10-13: Voice rule: she does not like marketing-like text. Write plain, factual sentences about what happened and what she did. No sales framing, no hype verbs, no "turned X into Y" style lines unless she picks them herself. Applies to subtitles, openings, Impact and Bottom line on every page.
- 2026-10-13: Installations: no "first page" wording in the subtitle or opening. She wants it stated that she shipped code.
- 2026-10-13: Installations restructured to the App Review Platform pattern (see its entry). She rejected every invented subtitle; her own original line with a verb added won. Lesson: start from her wording, not new copy.
- 2026-10-13: Local preview: port 8765 may be a stale server from an old session serving an old snapshot. Serve dist/ on a fresh port to check changes.
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

- 2026-10-26: Installations screen-plus-bullets layouts (proj-shot) now put the bullet text on the LEFT (cols 1-4) and the screen on the RIGHT (cols 5-12) on desktop; mobile stays screen then text. Selector: `.proj-content .col-layout.proj-shot > .col`. Local only, not pushed.
- 2026-10-26: Header scroll animation reverted to the pushed version (the softer and no-fade tries were dropped). Text beside screens (proj-shot) is top-aligned so bullets sit right under the section title.
- 2026-10-26: TL;DR box no longer bleeds past the page margins on desktop (margin -40px removed); its edges match the hero image.
