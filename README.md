# Cascade

Cascade is a polished browser implementation of Draw Three Klondike solitaire. Build descending, alternating-color runs across seven tableau columns, turn three cards at a time from the stock, and send every suit home from Ace through King. Completing the foundations unleashes a bouncing card cascade across the felt.

## Run locally

```sh
npm ci
npm run dev
```

Open the address Vite prints. Run `npm run build` to create the self-contained static site in `dist/`; it can be served from any static host.

## Controls

- Drag a face-up card or ordered run onto a legal tableau column or foundation.
- Click the stock to turn three cards; click it empty to recycle the waste.
- Double-click a playable tableau or waste card to send it to a foundation.
- Use Arrow keys or W/S to select menu items, Enter or Space to confirm, and Escape to leave How to Play.
- The HUD starts a new game, returns to the title, or toggles sound. All controls work with mouse or touch.
- Press backtick to toggle the read-only debug overlay.

## Quality checks

Run `npm run typecheck`, `npm run lint`, `npm run format`, and `npm test`.
