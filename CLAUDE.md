# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (choose platform)
npm start           # Interactive menu
npm run android     # Android
npm run ios         # iOS
npm run web         # Web browser

# No build, lint, or test commands are configured
```

## Architecture

**Stack:** TypeScript + React Native + Expo (~52) with Expo Router (file-based routing) and React Context for state.

**Routing:** `app/` directory maps to routes — `index.tsx` (home scorepad), `enter-hand.tsx` (hand entry wizard), `history.tsx` (past rubbers). `_layout.tsx` wraps everything in `RubberProvider`.

**State:** `context/RubberContext.tsx` uses `useReducer` with three actions: `ADD_HAND`, `UNDO_LAST_HAND`, `NEW_RUBBER`. State auto-persists to AsyncStorage (`utils/storage.ts`, key: `rubber_bridge_v1`) on every change and loads on mount.

**Scoring engine:** `utils/scoring.ts` is the core logic layer — read this before touching any scoring behavior.
- `calculateHandScores()` — computes above/below line points for a single hand
- `computeRubberState()` — derives full game state (games won, vulnerability, totals, rubber winner) from the full hand history
- All state is derived from the raw hand log; nothing is stored as computed state

**Data flow:** User completes the 3-step `enter-hand` wizard → `ADD_HAND` dispatched → context runs `calculateHandScores()` → persisted → home screen calls `computeRubberState()` for rendering.

**UI conventions:**
- NS (North-South) = `#2563eb` (blue), EW (East-West) = `#dc2626` (red)
- Background: `#fdfbf7` (cream), Surface: `#ffffff`
- Styling via React Native `StyleSheet` — no external UI library

**Types** (`utils/scoring.ts`): `Suit` ('C'|'D'|'H'|'S'|'NT'), `Level` (1–7), `Seat` ('N'|'S'|'E'|'W'), `Doubled` ('none'|'doubled'|'redoubled'), `Side` ('NS'|'EW').

**`components/HandInputSheet.tsx`** exists but is **not currently used** — superseded by the `enter-hand` screen.

## Environment

Copy `.env.example` to `.env` before first run. `EXPO_PUBLIC_*` vars are inlined at build time by Expo.
