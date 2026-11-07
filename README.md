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
2. Each member rates themselves and generates a share code for the leader
3. Leader imports codes, adds their ratings, checks plan/team gear and leverage items
4. Review (optional override with a written reason), pre-mortem, then copy summary or export the full team data code

Time estimates pair well with the [Hiking Time Estimator](https://shainyhsu.github.io/class-hiking-calculator/).

## Method notes (summary)

Draws on the Adventure Experience Paradigm, FEMA THIRA/SPR, performance profiling, Munter’s risk reduction, FAA personal minimums, GAR, SORTS-style commander review, and pre-mortem thinking. Details are on the page under “methods and sources.”

## Tech

Single HTML page on GitHub Pages. Ratings and share codes stay in the browser.
