# Leveraged Outdoor Strategy (上山籌碼評估)

Pre-trip assessment for hiking and mountaineering groups: match **capability (leverage)** to **route demand**, with hard floors (“red lines”), compensating strengths, and leader review.

**Live demo:** https://shainyhsu.github.io/Leveraged-Outdoor-Strategy/

## Ideas in brief

- Plot **capability** against **demand** (route and conditions)
- **Red lines are non-negotiable:** minimum thresholds; leverage only reduces demand, never the red line
- **Strength covers weakness:** each leverage item can lower demand on a given axis (capped per axis)
- **Leverage must come in pairs:** backup person or redundant gear
- Self-rating plus leader rating; two or more “marginal” axes → strongly consider not going

## Workflow

1. Leader sets trip demand (pick a template, then fine-tune)
2. The leader shares a Google Form link; each member rates themselves there, and the page pulls the responses in by a trip code the link fills in (or the leader enters members by hand)
3. The leader rates themselves (leader rating only) and reviews each member; a member's leader rating follows their self rating until the leader changes it. Then check plan/team gear and leverage items
4. The program sets the green, amber or red verdict; note the trip's weak points, then share an A4 JPG summary or copy the text summary

## Layout and display

- **Two columns on wide screens** (1000 px and up): the five steps on the left, the verdict pinned on the right as you scroll. Phones get a single column with the verdict first.
- **Top bar:** the verdict (amber or red jumps to the first flagged item and opens the list), Save, New assessment, an English/Chinese switch and a light/dark toggle.
- **Save** as a link (the whole assessment packed into the URL, so it opens on another device) or as a small .json file; it also autosaves in the browser.
- Only the two radar charts start open; every other section starts collapsed and remembers what you opened. A collapsed section shows its icon, a status stripe on the left and its key facts as badges (solid red needs fixing, solid amber is a heads-up, green is fine, grey is information). Collapse all keeps the two radar charts open. The open/close arrow is a solid blue round button; Trip needs, Ratings and each member card also have a Collapse button at the bottom.
- **Light/dark toggle** in the top-right corner. Dark is the default; your choice is remembered in the browser.

Time estimates pair well with the [Hiking Time Estimator](https://shainyhsu.github.io/class-hiking-calculator/).

## Method notes (summary)

Draws on the Adventure Experience Paradigm, FEMA THIRA/SPR, performance profiling, Munter’s risk reduction, FAA personal minimums, GAR, and pre-mortem thinking. Details are on the page under “methods and sources.”

## Tech

Single HTML page on GitHub Pages (interface in Traditional Chinese or English). Ratings stay in the browser; member self-assessments go to the leader's Google Form responses sheet. The page includes a search description, canonical URL, Open Graph tags and JSON-LD structured data for search engines and link previews.

## Version history

Newest first. Times are Taiwan time (UTC+8). Also kept in [CHANGELOG.md](CHANGELOG.md).

- V25 | 2026-11-13 16:58 | Bigger, brighter open/close arrows: a solid blue round button on every section and member card. Trip needs, Ratings and each member card get a Collapse button at the bottom, so you do not have to scroll back up after filling them in. Blocks inside an open section are spaced apart again.
- V24 | 2026-11-13 15:48 | Only the two radar charts start open; every other section starts collapsed and the page remembers what you open. A collapsed section shows its own icon, a status stripe on the left and solid red or amber badges, so it can be told apart at a glance. The verdict link and the jump bar open what they jump to; Collapse all keeps the radar charts open.
- V23 | 2026-11-13 12:50 | Sections ① to ⑥ start collapsed (the page remembers what you opened), with Collapse all and Expand all buttons. A collapsed section shows its key facts in a colored badge: red needs fixing, amber is a heads-up, green is fine.
- V22 | 2026-11-13 12:00 | Fixed the route need +/− buttons doing nothing after the template or conditions changed: each press now moves the need you see by 0.5. The Plan & backups and Team kit rows now say in one line what they measure.
- V21 | 2026-11-13 11:50 | The Share section now shows a live preview of every A4 page. Everything is printed on the pages, nothing says "see the page": Health details always in full. When page 2 runs a little over, it tightens first (shorter rows and gaps, smaller text, extra items in two columns); only what still does not fit continues on extra pages.
- V20 | 2026-11-13 11:27 | "Allergy history" now also needs a written details box when ticked.
- V19 | 2026-11-13 11:05 | Ticking "Ill / injured" or "Other medical history" now opens a required details box, on the member form and on the leader page; a tick with no details is a red issue.
- V18 | 2026-11-13 09:36 | Added a classic favicon.ico tab icon for older browsers and search tools.
- V17 | 2026-11-13 09:20 | Added a tab icon and an "All tools" link in the footer; the verdict area has a heading for screen readers and the file box has a label.
- V16 | 2026-11-11 11:45 | Pasting a save link into a tab that already has the page open now loads it too (before, only a fresh open did)
- V15 | 2026-11-11 11:40 | Save links are now short (about 90 characters): the assessment is encrypted in your browser, only the scrambled copy is stored online, and the key stays in the link, so whoever has the link can open it without signing in; the full link is used if the short one can't be made. The four save buttons sit in one row
- V14 | 2026-11-11 10:07 | New license terms: free to use in a browser for personal, work, school or club use, and the results you make are yours to share; copying, paid services built on it, and AI training need written permission. A License link sits at the bottom of the page
- V13 | 2026-11-10 00:18 | Added link-preview images (1200×630) for the main page and the member self-rating page, so shared links show a picture in LINE, Facebook and other apps.
- V12 | 2026-11-09 21:45 | A4 share images are now exported at 2x (4960×7016, 600 dpi A4) with JPEG quality 0.95, so text and lines stay sharp when zoomed or printed.
- V11 | 2026-11-09 21:00 | A4 share is now two balanced pages: page 1 summary with team roles and mitigations, page 2 details (route and conditions, member score table with primary and backup, checklists, weak points, member notes, overflow items, how to read); blocks are measured and spare space is spread between them.
- V10 | 2026-11-09 20:30 | New member self-rating page (member.html) replaces the Google Form screens: sliders with each score's description, follows the phone's light or dark mode, Chinese or English, and the trip code stays hidden. Replies still land in the same response sheet.
- V9 | 2026-11-09 20:00 | Sliders are back, half width on the right with a thin touch area, and vertical swipes scroll the page instead of moving them.
- V8 | 2026-11-09 19:50 | Scores are picked from right-aligned dropdowns instead of sliders, so scrolling can no longer change a score by accident; 踩踏與地形 renamed 技術與地形 (Technical terrain), old form column still read.
- V7 | 2026-11-09 13:50 | Fix: English term change had renamed internal ids, which stopped the page from drawing; "Add member" button renamed 新增隊員.
- V6 | 2026-11-09 13:30 | English version switch using common US outdoor terms (hard minimum, mitigation, backup, emergency contact); Save (link or .json file) and New assessment moved to the top bar; amber or red verdict in the top bar jumps to the first flagged item; overlay picker with a checkbox per member (on by default); notes no longer folded; night and fog travel split into two conditions; trip code hidden from the page and moved to the last question of the form; leader has leader ratings only and cannot be deleted; delete button on each member card header; leader ratings follow self ratings until changed, and self ratings may be blank; new condition options (sleep under 5 h or fatigue, ill or injured, digestion, allergy, altitude sickness and other medical history); weak points and text summary open as expandable sections; every section collapsible, open by default.
- V5 | 2026-11-09 11:40 | Redesigned layout: verdict, both radar charts side by side, then items to handle and margins at the top; option to overlay all members; members self-assess through a Google Form whose responses are pulled in by trip code (share codes removed); verdict is computed only by the program (leader override removed); “Weak points” review folded by default; new A4 high-resolution JPG share image.
- V4 | 2026-11-09 09:23 | Added a light/dark toggle in the top-right corner, with dark as the default and your choice remembered.
- V3 | 2026-11-08 20:28 | Added a fuller page title, search description, canonical link, social-share preview tags and structured data so the tool shows up better in search and link previews.
- V2 | 2026-10-23 14:46 | Tidied the page's underlying HTML structure and language setting, and shortened the time-estimator link label.
- V1 | 2026-10-23 13:40 | First public release: pre-trip assessment that weighs each member's capability against route demand, with route templates, red lines, leverage items, member share codes, leader review and a pre-mortem.

## License

Copyright (c) 2026 Shainy Hsu. All rights reserved. See [LICENSE](LICENSE).
