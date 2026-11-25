# AGENTS.md

Instructions for coding agents (Claude, Codex, Gemini, Cursor and others) working on this repo: Leverage Check (上山籌碼評估), one of Shainy Hsu's outdoor tools. The shared state of the outdoor tools lives in the hub repo shainyhsu/shainyhsu.github.io, folder `.ai/`.

## Read first

1. 00_INTERFACE_CONTRACT.md: function index for this repo, data contract
   https://raw.githubusercontent.com/shainyhsu/shainyhsu.github.io/main/.ai/00_INTERFACE_CONTRACT.md
2. 01_CURRENT_STATE.md: the one task in progress and its done criteria
   https://raw.githubusercontent.com/shainyhsu/shainyhsu.github.io/main/.ai/01_CURRENT_STATE.md
3. 02_DECISION_LOG.md: decisions to keep and dead ends not to retry
   https://raw.githubusercontent.com/shainyhsu/shainyhsu.github.io/main/.ai/02_DECISION_LOG.md
4. 03_HANDOFF_PROMPT.md: the same rules as a prompt for chat-based LLMs

If you cannot fetch them, ask Shainy to paste them. Don't change code before you have read 01 and 02.

## Rules (SSSM short-context protocol)

1. One atomic task per session: the one named in 01. Make the smallest change (a diff or the whole target function). Never rewrite a whole file. Keep the pages (index.html, member.html) and apps-script/Code.gs, their structure and names.
2. Read selectively. Find a function with `grep -n`, then read at most 150 lines or 6,000 characters at a time. Never load the whole of index.html (about 2,320 lines).
3. Keep facts and ideas apart. Nothing in 01 section 3 is implemented. Mark any new algorithm or structure [Unverified] until Shainy has tested it.
4. Check the dead ends in 02 before proposing anything.
5. Modern Web Guidance 1.0. This project's Baseline target is "Baseline Widely available". Prefer native APIs (`<dialog>`, CSS Grid/Subgrid, IndexedDB/OPFS) over polyfills and libraries. The Popover API is only Baseline Newly available (since 2025-01-27, Widely available from 2027-07-27): use it only with the fallback its guide gives.
6. End every reply with this status brief, 180 characters or fewer, instead of a recap:

```
【SSSM 狀態更新簡報】
- Applied（已改動）：
- Status（事實狀態）：Verified／Unverified；Done Criteria 達成與否
- Dead Ends（新增踩坑）：無
- Next Action（下一步唯一動作）：
```

## Repo conventions

- Talk to Shainy in Traditional Chinese (Taiwan usage). Page text and commit messages follow this repo.
- Each update of the page is one version: add a line to the README "Version history" and to CHANGELOG.md (`V<n> | YYYY-MM-DD HH:MM | one short line`, Taiwan time, UTC+8).
- Work on a branch and open a pull request; merge it only when Shainy asks.
- After a change, update this repo's line numbers in the hub's .ai/00 and the applied changes in .ai/01, through a pull request on shainyhsu/shainyhsu.github.io.
