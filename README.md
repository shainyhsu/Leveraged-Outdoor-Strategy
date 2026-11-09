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
2. The leader shares a Google Form link; each member rates themselves there, and the page pulls the responses in by trip code (or the leader enters members by hand)
3. Leader adds their own ratings, checks plan/team gear and leverage items
4. The program sets the green, amber or red verdict; note the trip's weak points, then share an A4 JPG summary or copy the text summary

## Layout and display

- **Two columns on wide screens** (1000 px and up): the five steps on the left, the verdict pinned on the right as you scroll. Phones get a single column with the verdict first.
- **Light/dark toggle** in the top-right corner. Dark is the default; your choice is remembered in the browser.

Time estimates pair well with the [Hiking Time Estimator](https://shainyhsu.github.io/class-hiking-calculator/).

## Method notes (summary)

Draws on the Adventure Experience Paradigm, FEMA THIRA/SPR, performance profiling, Munter’s risk reduction, FAA personal minimums, GAR, and pre-mortem thinking. Details are on the page under “methods and sources.”

## Tech

Single HTML page on GitHub Pages (interface in Traditional Chinese). Ratings stay in the browser; member self-assessments go to the leader's Google Form responses sheet. The page includes a search description, canonical URL, Open Graph tags and JSON-LD structured data for search engines and link previews.

## Version history

- V5 | 2026-11-09 11:40 | Redesigned layout: verdict, both radar charts side by side, then items to handle and margins at the top; option to overlay all members; members self-assess through a Google Form whose responses are pulled in by trip code (share codes removed); verdict is computed only by the program (leader override removed); “Weak points” review folded by default; new A4 high-resolution JPG share image.
- V4 | 2026-11-09 09:23 | Added a light/dark toggle in the top-right corner, with dark as the default and your choice remembered.
- V3 | 2026-11-08 20:28 | Added a fuller page title, search description, canonical link, social-share preview tags and structured data so the tool shows up better in search and link previews.
- V2 | 2026-10-23 14:46 | Tidied the page's underlying HTML structure and language setting, and shortened the time-estimator link label.
- V1 | 2026-10-23 13:40 | First public release: pre-trip assessment that weighs each member's capability against route demand, with route templates, red lines, leverage items, member share codes, leader review and a pre-mortem.

## License

All rights reserved. See [LICENSE](LICENSE). You may use the published page in your browser for personal use, but copying, reproducing, scraping, or using any part of this work for AI or machine-learning training is not permitted without the author's prior written permission.
