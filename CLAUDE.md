# Avigail Bahat Portfolio: Claude Code context

A static portfolio site for Avigail Bahat, Senior Product Designer. Content is written in Notion, `node generate.js` builds `dist/`, and GitHub Actions deploys to GitHub Pages on push to `main`.

## Read this first
**`PORTFOLIO-CONTENT-NOTES.md` is the single source of truth** for this project: the standard page structure, the structure of every page type (homepage, About, project pages, design system), the design tokens, the writing and style rules, the workflow, the Notion page IDs and slugs, per-project status and the decisions log. Read it before any content, layout or deploy work, and update it at the end of the session.

## Hard rules (the short list)
- No em dashes (—) or en dashes in any copy. Use a comma, colon or period.
- No specific numbers, percentages or dollar amounts in project content (legal). Use directional words.
- One muted gray for secondary text: `#555`. Borders `#ebebeb`. Accent `#0a0a0a`.
- Titles in Plus Jakarta Sans, body and UI in Roboto (the site loads only these two; project sub-headings are Jakarta bold). Minimum font size 14px.
- Project pages follow the deck-style system: see "DECK-STYLE PAGE SYSTEM" at the top of `PORTFOLIO-CONTENT-NOTES.md` before building or changing a page (layout shapes, Notion pitfalls, preview server).
- Content edits live in Notion, never only in the generated files.
- Show a local preview and wait for her go before any commit or push. Say what a deploy will make live.
- Never delete screens unless she asks. Back up a Notion page before restructuring one with images.

## How to generate
```
node generate.js            # all pages
node generate.js <slug>     # still rebuilds everything, prints only that page
```
