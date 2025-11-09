# Universal Char – Implementation Plan (Stage 1)

Status: Draft
Owner: Kilian / Agent Mode
Scope: Typing + early management loop (no automation yet)

## 1) Problem Statement
Build a React + TypeScript web game where players farm the currency “chars/signs” by accurately typing short texts. After completing a text, chars are awarded based on accuracy, speed, and bonuses from store items. A basic store unlocks items via achievements. The game displays key stats and logs progression events.

Constraints & principles
- TS strict, React function components + hooks, Tailwind for styling
- Dark mode first, “cozy book” theme palette
- English-only for MVP (no i18n scaffolding yet)
- Accessibility-first, robust error handling, error boundaries
- Optimistic UX for state updates where appropriate

## 2) Current State (repo)
```
C:.
│  README.md
```
README.md
> Initial repo setup.

No app scaffold yet.

## 3) High-level Architecture
- Frontend only for Stage 1 using Vite + React + TS (strict)
- State management: Zustand (lightweight, simple) + immer
- Data fetching/caching: simple services for now; React Query later if needed
- Persistence: localStorage for savegame (player, inventory, prices)
- Content: 20 seed texts (80–320 chars) in `public/data/texts.json` (acts as stand-in DB for now) ✓ confirmed
- Tailwind for UI + theme tokens for dark mode
- Testing: Vitest + React Testing Library

## 4) Domain Model (initial)
- Text: { id, title, genre, body, difficulty? }
- RunMetrics (per typing run): { startedAt, endedAt, elapsedMs, correct, wrong, accuracy, wpm }
- ScoreResult: { charsAwarded, breakdown }
- Player: { chars, money, inventory: { articles, books }, price: { article, book } }
- StoreItem: { id, name, desc, costMoney, costChars?, bonusType, bonusValue, owned, visible }
- Achievement: { id, name, condition, unlockedAt?, revealsItems?: string[] }

## 5) Game Flow (Stage 1)
0) First-run Welcome gate: blocking modal asks the player to type exactly “Welcome” (no hint). Uses per-char feedback. Not skippable. No currency awarded.
1) Player clicks Start on Scripttyper → random text loaded
2) As user types, per-character correctness is tracked and visually highlighted (black → green/red)
3) Timer tracks elapsed time; mistakes and corrects accumulated
4) On completion, compute `ScoreResult` → award chars to Player
5) Achievements engine evaluates events (completed text, accuracy, speed, milestones)
6) Store updates visibility of items based on achievements; purchase affects future scoring bonuses
7) Business panel shows money, inventory, price controls; initial production is manual (selling articles/books from inventory). Article/book creation requires chars (convert chars → articles/books), then sell for money. Stage 1 keeps these simple and manual
8) Progression log prints significant events
9) Skips: player starts with 5 free skips, gains +1 skip per completed text; later item unlocks “Endless Skips”
10) ALARM texts: timed bonus-only variants (no penalties) with extra time-bonus multiplier; rarity and multiplier configurable

## 6) Scoring (baseline; configurable) ✓ confirmed
- Base gain: `basePerChar * correct`
- Penalty: `wrongPenalty * wrong`
- Time factor: `timeScale * (targetTimeSec / max(elapsedSec, 1))` (reward faster typing)
- Bonus multiplier: from owned items (e.g., +X% chars)
- Final: `max(0, floor((baseGain - penalty) * (1 + bonusPct) + timeBonus))`
- Defaults: basePerChar=1, wrongPenalty=0.5, targetTimeSec = body.length / 4 (≈ 240 cpm), timeScale=0.25, min=0

## 7) Achievements & Store Gating
- Mixed currency: items can cost chars, money, or both (early game primarily chars)
- Visibility: unlocked by achievements; show up to 5 at once (priority by tier → impact → earliest defined)
- Early achievements (examples):
  - “100 in 60s”: type ≥100 correct chars in ≤60s → reveals “Better Keyboard” (+10% chars)
  - “Flawless x10”: complete 10 texts with 0 mistakes → reveals “Precision Caps” (+accuracy multiplier)
  - “3k Lifetime”: reach lifetime chars ≥ 3,000 → reveals “Endless Skips”
  - “First Chapter”: complete 5 texts total → reveals “Article Press” (discount on article cost)

Initial item set (MVP)
- Better Keyboard: +10% chars award; cost 800 chars
- Precision Caps: -20% wrong penalty (multiplies penalty); cost 400 chars + 10 money
- Time Coach: +15% time bonus; cost 600 chars
- Article Press: -15% article char cost; cost 500 chars + 25 money
- Pricing Advisor: +10% sell price for articles/books; cost 300 chars + 40 money
- Endless Skips: removes skip limits; cost 1,200 chars + 100 money (requires “3k Lifetime”)

## 8) UI/Components (Stage 1)
- App shell + routes: single-page with top panels and a footer
- WelcomeGate: first-run modal requiring typing “Welcome” to proceed; no hint; not skippable; uses Scripttyper-like per-char feedback
- Scoreboard: total chars; derived metrics: pages (1 page = 1,000 chars), books (1 book = 1,000,000 chars)
- Scripttyper: text display w/ per-char coloring, metrics (timer, correct, wrong, accuracy, WPM), Start/Skip
- Store: up to 5 visible items; buy with money/chars; disabled buttons with reasons; tooltips, a11y labels
- Business Panel: shows money, inventory (articles/books), price per article/book, buy/sell buttons; conversion: chars → articles/books; manual sell; price adjusters
- Manufacturing: Stage 1 read-only production rate (0 unless user converts manually). Paper cost field (placeholder for later loop). Keep UI minimal
- Progression Log: console-like feed of unlocks, milestones, purchases
- Footer: link to About page (static)

Balancing (initial; tuned to reach first Book ≈ ~10 minutes average)
Assumptions: baseline typing ≈ 220 cpm, moderate accuracy; 10 minutes yields ~2,000–2,500 effective chars.
- Article: craft cost 400 chars → sell price 25 money (affected by Pricing Advisor)
- Book: unlocks on “3k Lifetime”; craft cost 2,500 chars → sell price 220 money
- Prices adjustable by player (±5% per click, clamped 50%–200% of base)
Notes: crafting instantly converts chars; later stages can add time/queueing.

Accessibility
- Keyboard navigable controls; visible focus; semantic headings/regions
- Live region for log updates; color not sole indicator of correctness (also add icons/aria-labels)

## 9) Persistence & Save/Load
- Save on significant state changes (after score award, purchase, price change) to localStorage key `universal-char-save-v1`
- Versioned migration function to evolve saves later
- Track lifetime stats separately from spendable balances (for unlocks like “3k Lifetime”)

## 10) Files to Add (planned)
- package.json, tsconfig.json, vite.config.ts
- tailwind.config.ts, postcss.config.cjs, src/index.css
- public/data/texts.json (20 seed texts)
- src/main.tsx, src/App.tsx, src/routes/About.tsx
- src/components/
  - WelcomeGate.tsx
  - Scoreboard.tsx
  - Scripttyper.tsx
  - Store.tsx
  - BusinessPanel.tsx
  - Manufacturing.tsx
  - ProgressionLog.tsx
  - Footer.tsx
  - ErrorBoundary.tsx
- src/state/
  - store.ts (Zustand root store)
  - selectors.ts
- src/domain/
  - types.ts
  - scoring.ts
  - achievements.ts
  - inventory.ts (convert chars→articles/books)
  - pricing.ts (price adjust rules and clamps)
  - persistence.ts
  - texts.service.ts (load seed texts)
  - theme.ts (dark palette tokens)
- tests/ (key units + Scripttyper render)

## 11) Example Types (sketch)
```ts
export type Text = {
  id: string; title: string; genre: string; body: string; difficulty?: number;
};

export type RunMetrics = {
  startedAt: number; endedAt: number; elapsedMs: number;
  correct: number; wrong: number; accuracy: number; wpm: number;
};

export type ScoreResult = {
  charsAwarded: number;
  breakdown: { baseGain: number; penalty: number; timeBonus: number; bonusPct: number };
};

export type StoreItem = {
  id: string; name: string; desc: string;
  cost: { chars?: number; money?: number };
  requires?: string[]; // achievement ids
  effect: { type: 'chars_pct' | 'wrong_penalty_pct' | 'time_bonus_pct' | 'article_cost_pct' | 'price_pct' | 'skip_unlimited' ; value?: number };
};
```

## 12) Open Questions
- ALARM tuning: target frequency and bonus multiplier?
- Any genre preferences for the initial 20 texts?

## 13) MVP Acceptance Criteria (Stage 1)
- Can complete a text with per-char feedback and see metrics
- Score is computed and chars awarded; total updates and persists across reloads
- Skip rules implemented (5 starting, +1 per completed text) and Endless Skips item works
- Achievements unlock at least 5 sample items; store shows max 5; purchases apply bonuses; mixed currency costs respected
- Business panel supports converting chars→articles/books and selling; price adjustable with clamps; state persists
- Player can reach first Book around ~10 minutes with average play (without heavy early overspending)
- Progression log records unlocks/purchases/milestones
- A11y basics pass (keyboard navigation, landmarks, labels)
- Tests cover scoring and core typing correctness logic

## 14) Theme (Dark / Cozy Book)
Palette tokens (subject to tune):
- bg: #12100E, surface: #1B1714, surface-2: #241F1B
- text: #E9E5DF, muted: #C8C2BA
- accent: #D4A373, accent-2: #B08968
- success (correct): #34D399, danger (wrong): #EF4444, info: #60A5FA
Tailwind will expose these as CSS variables for easy theming.

## 15) Risks & Mitigations
- Overtuning early game: expose weights via config to iterate quickly
- Text quality/variety: seed wide genres and difficulties; tooling to add texts later
- Save corruption: versioned schema + defensive parsing

---

If you approve these updates, I’ll scaffold the project (Vite + Tailwind + Zustand), seed texts.json, and implement Scripttyper, Store, and Business Panel according to the above.
