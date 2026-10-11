import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as K from "./constants";

export type Screen = "title" | "howto" | "playing" | "won";
export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type PileKind = "stock" | "waste" | "foundation" | "tableau";
export interface CardState {
  readonly id: number;
  readonly suit: Suit;
  readonly rank: number;
  readonly faceUp: boolean;
}
export interface DragState {
  readonly cards: readonly CardState[];
  readonly fromPile: "waste" | "foundation" | "tableau";
  readonly fromIndex: number;
  readonly x: number;
  readonly y: number;
}
export interface DropTargetState {
  readonly pile: "foundation" | "tableau";
  readonly index: number;
}
export interface PointerState {
  readonly x: number;
  readonly y: number;
  readonly down: boolean;
}
export interface PressState {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}
export interface FlyerState {
  readonly id: number;
  readonly suit: Suit;
  readonly rank: number;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
}
interface Stamp {
  readonly suit: Suit;
  readonly rank: number;
  readonly x: number;
  readonly y: number;
}
export interface CascadeState {
  readonly screen: Screen;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly stock: readonly CardState[];
  readonly waste: readonly CardState[];
  readonly wasteSets: readonly number[];
  readonly foundations: readonly (readonly CardState[])[];
  readonly tableau: readonly (readonly CardState[])[];
  readonly drag: DragState | null;
  readonly dropTarget: DropTargetState | null;
  readonly pointer: PointerState;
  readonly lastPress: PressState | null;
  readonly autoFlip: boolean;
  readonly winDetect: boolean;
  readonly launching: boolean;
  readonly trailPainting: boolean;
  readonly launchClock: number;
  readonly launched: number;
  readonly flyers: readonly FlyerState[];
  readonly cascadeDone: boolean;
  readonly trailStamps: number;
  readonly nextId: number;
  readonly simTime: number;
  readonly muted: boolean;
  readonly trail: readonly Stamp[];
}
type R = DeepReadonly<CascadeState>;
type Rect = { x: number; y: number; w: number; h: number };
type CV = {
  id: number;
  suit: Suit;
  rank: number;
  color: "red" | "black";
  faceUp: boolean;
};
export interface CascadeDebugApi {
  readonly version: number;
  reset(s: R): CascadeState;
  snapshot(s: R): Record<string, unknown>;
  reconcile(s: R): CascadeState;
  menuItemRect(s: R, i: number): Rect | null;
  setScreen(s: R, v: Screen): CascadeState;
  setMenuIndex(s: R, v: number): CascadeState;
  setTitleIndex(s: R, v: number): CascadeState;
  addCard(
    s: R,
    p: PileKind,
    i: number,
    u: Suit,
    r: number,
    f: boolean,
  ): CascadeState;
  removeCard(s: R, id: number): CascadeState;
  setCardFaceUp(s: R, id: number, v: boolean): CascadeState;
  clearPile(s: R, p: PileKind, i: number): CascadeState;
  clearTable(s: R): CascadeState;
  addWasteSet(s: R, n: number): CascadeState;
  clearWasteSets(s: R): CascadeState;
  deal(s: R): CascadeState;
  turnStock(s: R): CascadeState;
  move(
    s: R,
    a: PileKind,
    ai: number,
    row: number,
    b: PileKind,
    bi: number,
  ): [CascadeState, boolean];
  autoMove(s: R, p: PileKind, i: number): [CascadeState, boolean];
  pointerDown(s: R, x: number, y: number): CascadeState;
  pointerMove(s: R, x: number, y: number): CascadeState;
  pointerUp(s: R, x: number, y: number): CascadeState;
  setAutoFlip(s: R, v: boolean): CascadeState;
  setWinDetect(s: R, v: boolean): CascadeState;
  setLaunching(s: R, v: boolean): CascadeState;
  setTrailPainting(s: R, v: boolean): CascadeState;
  addFlyer(
    s: R,
    u: Suit,
    r: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
  ): CascadeState;
  setFlyerPosition(s: R, id: number, x: number, y: number): CascadeState;
  setFlyerVelocity(s: R, id: number, vx: number, vy: number): CascadeState;
  removeFlyer(s: R, id: number): CascadeState;
  clearFlyers(s: R): CascadeState;
  setLaunchClock(s: R, v: number): CascadeState;
  clearTrail(s: R): CascadeState;
  drawLaunchVx(): number;
}
export const BACKGROUND = "#073936";
const empty = (n: number): readonly (readonly CardState[])[] =>
  Array.from({ length: n }, () => []);
function base(muted = false): CascadeState {
  return {
    screen: "title",
    menuIndex: 0,
    titleIndex: 0,
    stock: [],
    waste: [],
    wasteSets: [],
    foundations: empty(4),
    tableau: empty(7),
    drag: null,
    dropTarget: null,
    pointer: { x: 0, y: 0, down: false },
    lastPress: null,
    autoFlip: true,
    winDetect: true,
    launching: true,
    trailPainting: true,
    launchClock: 0,
    launched: 0,
    flyers: [],
    cascadeDone: false,
    trailStamps: 0,
    nextId: 1,
    simTime: 0,
    muted,
    trail: [],
  };
}
const own = (s: R) => s as CascadeState;
const red = (u: Suit) => u === "hearts" || u === "diamonds";
function valid(p: PileKind, i: number) {
  if (
    !Number.isInteger(i) ||
    i < 0 ||
    i > (p === "foundation" ? 3 : p === "tableau" ? 6 : 0)
  )
    throw new RangeError(`invalid ${p} index ${i}`);
}
function pile(
  s: R,
  p: PileKind,
  i: number,
): readonly DeepReadonly<CardState>[] {
  valid(p, i);
  return p === "stock"
    ? s.stock
    : p === "waste"
      ? s.waste
      : p === "foundation"
        ? s.foundations[i]!
        : s.tableau[i]!;
}
function put(
  s: R,
  p: PileKind,
  i: number,
  c: readonly CardState[],
  sets: readonly number[] = s.wasteSets as number[],
): CascadeState {
  valid(p, i);
  if (p === "stock") return { ...s, stock: c } as CascadeState;
  if (p === "waste") return { ...s, waste: c, wasteSets: sets } as CascadeState;
  if (p === "foundation")
    return {
      ...s,
      foundations: s.foundations.map((x, n) => (n === i ? c : x)),
    } as CascadeState;
  return {
    ...s,
    tableau: s.tableau.map((x, n) => (n === i ? c : x)),
  } as CascadeState;
}
function ys(c: readonly DeepReadonly<CardState>[]): number[] {
  if (!c.length) return [];
  const d = c.slice(0, -1).filter((x) => !x.faceUp).length,
    u = c.length - 1 - d,
    off = u
      ? Math.max(
          K.FACE_UP_OFFSET_MIN,
          Math.min(
            K.FACE_UP_OFFSET,
            (K.COLUMN_BOTTOM_LIMIT -
              K.TABLEAU_Y -
              K.CARD_H -
              d * K.FACE_DOWN_OFFSET) /
              u,
          ),
        )
      : K.FACE_UP_OFFSET,
    a = [K.TABLEAU_Y];
  for (let i = 1; i < c.length; i++)
    a.push(a[i - 1]! + (c[i - 1]!.faceUp ? off : K.FACE_DOWN_OFFSET));
  return a;
}
function rect(s: R, p: PileKind, i: number): Rect {
  valid(p, i);
  if (p === "stock")
    return { x: K.STOCK_X, y: K.TOP_ROW_Y, w: K.CARD_W, h: K.CARD_H };
  if (p === "waste")
    return { x: K.WASTE_X, y: K.TOP_ROW_Y, w: K.CARD_W, h: K.CARD_H };
  if (p === "foundation")
    return { x: K.FOUNDATION_X[i]!, y: K.TOP_ROW_Y, w: K.CARD_W, h: K.CARD_H };
  const y = ys(s.tableau[i]!);
  return {
    x: K.COLUMN_X[i]!,
    y: K.TABLEAU_Y,
    w: K.CARD_W,
    h: y.length ? y[y.length - 1]! + K.CARD_H - K.TABLEAU_Y : K.CARD_H,
  };
}
const hit = (x: number, y: number, r: Rect) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
function run(c: readonly DeepReadonly<CardState>[]): boolean {
  return c.every(
    (x, i) =>
      i === 0 ||
      (x.rank === c[i - 1]!.rank - 1 && red(x.suit) !== red(c[i - 1]!.suit)),
  );
}
function accepts(
  s: R,
  p: PileKind,
  i: number,
  c: readonly DeepReadonly<CardState>[],
): boolean {
  if (!c.length || !run(c)) return false;
  const t = pile(s, p, i),
    top = t[t.length - 1];
  if (p === "foundation")
    return (
      c.length === 1 &&
      (top
        ? top.suit === c[0]!.suit && c[0]!.rank === top.rank + 1
        : c[0]!.rank === 1)
    );
  if (p === "tableau")
    return top
      ? top.faceUp &&
          c[0]!.rank === top.rank - 1 &&
          red(c[0]!.suit) !== red(top.suit)
      : c[0]!.rank === 13;
  return false;
}
function dec(a: readonly number[]): number[] {
  const b = [...a];
  for (let i = b.length - 1; i >= 0; i--)
    if (b[i]! > 0) {
      b[i]!--;
      if (!b[i]) b.splice(i, 1);
      break;
    }
  return b;
}
function win(s: CascadeState): CascadeState {
  return s.winDetect && s.foundations.reduce((n, p) => n + p.length, 0) === 52
    ? {
        ...s,
        screen: "won",
        launchClock: K.LAUNCH_INTERVAL,
        launched: 0,
        cascadeDone: false,
      }
    : s;
}
function move(
  s: R,
  a: PileKind,
  ai: number,
  row: number,
  b: PileKind,
  bi: number,
): [CascadeState, boolean, boolean] {
  const q = pile(s, a, ai);
  valid(b, bi);
  if (
    !Number.isInteger(row) ||
    row < 0 ||
    row >= q.length ||
    a === "stock" ||
    (a !== "tableau" && row !== q.length - 1) ||
    (a === "waste" && !s.wasteSets.length)
  )
    return [own(s), false, false];
  const cards = q.slice(row) as CardState[];
  if (!cards[0]!.faceUp || !accepts(s, b, bi, cards))
    return [own(s), false, false];
  let n = put(
    s,
    a,
    ai,
    q.slice(0, row) as CardState[],
    a === "waste" ? dec(s.wasteSets) : (s.wasteSets as number[]),
  );
  n = put(n, b, bi, [...pile(n, b, bi), ...cards] as CardState[]);
  let flip = false;
  if (a === "tableau" && n.autoFlip) {
    const col = n.tableau[ai]!,
      top = col[col.length - 1];
    if (top && !top.faceUp) {
      flip = true;
      n = put(n, "tableau", ai, [
        ...col.slice(0, -1),
        { ...top, faceUp: true },
      ]);
    }
  }
  return [win(n), true, flip];
}
function auto(s: R, p: PileKind, i: number): [CascadeState, boolean, boolean] {
  const q = pile(s, p, i);
  if (
    (p !== "waste" && p !== "tableau") ||
    !q.length ||
    !q[q.length - 1]!.faceUp ||
    (p === "waste" && !s.wasteSets.length)
  )
    return [own(s), false, false];
  for (let f = 0; f < 4; f++) {
    const z = move(s, p, i, q.length - 1, "foundation", f);
    if (z[1]) return z;
  }
  return [own(s), false, false];
}
function deal(s: R): CascadeState {
  const d: CardState[] = [];
  let id = s.nextId;
  for (const suit of K.SUITS)
    for (let rank = 1; rank <= 13; rank++)
      d.push({ id: id++, suit, rank, faceUp: false });
  for (let i = 51; i; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j]!, d[i]!];
  }
  const t: CardState[][] = Array.from({ length: 7 }, () => []);
  let n = 0;
  for (let c = 0; c < 7; c++)
    for (let j = 0; j <= c; j++) {
      const x = d[n++]!;
      t[c]!.push({ ...x, faceUp: j === c });
    }
  return {
    ...s,
    stock: d.slice(n),
    waste: [],
    wasteSets: [],
    foundations: empty(4),
    tableau: t,
    drag: null,
    dropTarget: null,
    menuIndex: 0,
    launched: 0,
    launchClock: 0,
    flyers: [],
    cascadeDone: false,
    trailStamps: 0,
    trail: [],
    nextId: id,
  } as CascadeState;
}
function turn(s: R): CascadeState {
  if (s.stock.length) {
    const stock = [...s.stock],
      waste = [...s.waste],
      n = Math.min(3, stock.length);
    for (let i = 0; i < n; i++) waste.push({ ...stock.pop()!, faceUp: true });
    return {
      ...s,
      stock,
      waste,
      wasteSets: [...s.wasteSets, n],
    } as CascadeState;
  }
  return s.waste.length
    ? ({
        ...s,
        stock: [...s.waste].reverse().map((c) => ({ ...c, faceUp: false })),
        waste: [],
        wasteSets: [],
      } as CascadeState)
    : own(s);
}
function menus(s: Screen): Rect[] {
  return s === "title"
    ? [
        { x: 480, y: 410, w: 320, h: 54 },
        { x: 480, y: 478, w: 320, h: 54 },
      ]
    : s === "howto"
      ? [{ x: 500, y: 610, w: 280, h: 54 }]
      : s === "playing"
        ? [
            { x: 24, y: K.HUD_Y, w: 145, h: K.HUD_H },
            { x: 180, y: K.HUD_Y, w: 110, h: K.HUD_H },
            { x: 302, y: K.HUD_Y, w: 130, h: K.HUD_H },
          ]
        : [];
}
function target(s: R, d: DeepReadonly<DragState>): DropTargetState | null {
  for (const p of ["foundation", "tableau"] as const)
    for (let i = 0; i < (p === "foundation" ? 4 : 7); i++)
      if (hit(d.x + 50, d.y + 70, rect(s, p, i)) && accepts(s, p, i, d.cards))
        return { pile: p, index: i };
  return null;
}
function cardAt(
  s: R,
  x: number,
  y: number,
): {
  p: "waste" | "foundation" | "tableau";
  i: number;
  r: number;
  x: number;
  y: number;
} | null {
  for (let i = 6; i >= 0; i--) {
    const q = s.tableau[i]!,
      a = ys(q);
    for (let r = q.length - 1; r >= 0; r--)
      if (hit(x, y, { x: K.COLUMN_X[i]!, y: a[r]!, w: 100, h: 140 }))
        return { p: "tableau", i, r, x: K.COLUMN_X[i]!, y: a[r]! };
  }
  for (let i = 3; i >= 0; i--)
    if (s.foundations[i]!.length && hit(x, y, rect(s, "foundation", i)))
      return {
        p: "foundation",
        i,
        r: s.foundations[i]!.length - 1,
        x: K.FOUNDATION_X[i]!,
        y: K.TOP_ROW_Y,
      };
  if (s.waste.length && s.wasteSets.length) {
    const n = s.wasteSets[s.wasteSets.length - 1]!,
      a = s.waste.length - n;
    for (let r = s.waste.length - 1; r >= a; r--) {
      const px = K.WASTE_X + (r - a) * K.WASTE_FAN;
      if (hit(x, y, { x: px, y: K.TOP_ROW_Y, w: 100, h: 140 }))
        return { p: "waste", i: 0, r, x: px, y: K.TOP_ROW_Y };
    }
  }
  return null;
}
function activate(
  s: CascadeState,
  i: number,
  toggle?: () => void,
): CascadeState {
  if (s.screen === "title")
    return i
      ? { ...s, screen: "howto", titleIndex: 1, menuIndex: 0 }
      : { ...deal(s), screen: "playing", titleIndex: 0 };
  if (s.screen === "howto")
    return { ...s, screen: "title", menuIndex: s.titleIndex };
  if (s.screen === "playing") {
    if (i === 0) return { ...deal(s), screen: "playing" };
    if (i === 1) return { ...s, screen: "title", menuIndex: s.titleIndex };
    toggle?.();
  }
  return s;
}
type Emit = (c: keyof typeof K.CUES) => void;
function pointer(
  s0: R,
  type: "down" | "move" | "up",
  x: number,
  y: number,
  emit?: Emit,
  toggle?: () => void,
): CascadeState {
  const old = s0.pointer;
  let s = { ...s0, pointer: { x, y, down: type !== "up" } } as CascadeState;
  const mi = menus(s.screen).findIndex((r) => hit(x, y, r));
  if (mi >= 0) s = { ...s, menuIndex: mi };
  if (type === "down") {
    if (s.screen === "won") {
      emit?.("deal");
      return { ...deal(s), screen: "playing" };
    }
    const prev = s.lastPress;
    s = { ...s, lastPress: { x, y, at: s.simTime } };
    if (s.screen !== "playing") return s;
    const h = cardAt(s, x, y);
    if (!h) return s;
    const playable =
      h.p === "waste"
        ? h.r === s.waste.length - 1
        : h.p === "tableau" &&
          h.r === s.tableau[h.i]!.length - 1 &&
          s.tableau[h.i]![h.r]!.faceUp;
    if (
      playable &&
      prev &&
      s.simTime - prev.at <= K.DOUBLE_CLICK_WINDOW &&
      Math.hypot(x - prev.x, y - prev.y) <= K.DOUBLE_CLICK_SLOP
    ) {
      const [n, ok, fl] = auto(s, h.p, h.i);
      if (ok) {
        emit?.("home");
        if (fl) emit?.("flip");
      }
      return n;
    }
    const q = pile(s, h.p, h.i),
      cards = q.slice(h.r) as CardState[];
    if (
      !q[h.r]!.faceUp ||
      (h.p === "waste" && h.r !== q.length - 1) ||
      !run(cards)
    )
      return s;
    s = put(s, h.p, h.i, q.slice(0, h.r) as CardState[]);
    emit?.("lift");
    return {
      ...s,
      drag: { cards, fromPile: h.p, fromIndex: h.i, x: h.x, y: h.y },
    };
  }
  if (type === "move") {
    if (!s.drag) return s;
    const d = { ...s.drag, x: s.drag.x + x - old.x, y: s.drag.y + y - old.y };
    return { ...s, drag: d, dropTarget: target(s, d) };
  }
  const pr = s.lastPress;
  if (!pr) return s;
  const click = Math.hypot(x - pr.x, y - pr.y) <= K.DRAG_THRESHOLD;
  if (s.drag) {
    const d = s.drag;
    if (!click && s.dropTarget) {
      const drop = s.dropTarget;
      s = put(s, drop.pile, drop.index, [
        ...pile(s, drop.pile, drop.index),
        ...d.cards,
      ] as CardState[]);
      if (d.fromPile === "waste") s = { ...s, wasteSets: dec(s.wasteSets) };
      if (d.fromPile === "tableau" && s.autoFlip) {
        const c = s.tableau[d.fromIndex]!,
          top = c[c.length - 1];
        if (top && !top.faceUp) {
          s = put(s, "tableau", d.fromIndex, [
            ...c.slice(0, -1),
            { ...top, faceUp: true },
          ]);
          emit?.("flip");
        }
      }
      emit?.("drop");
      if (drop.pile === "foundation") emit?.("home");
      s = win(s);
    } else {
      s = put(s, d.fromPile, d.fromIndex, [
        ...pile(s, d.fromPile, d.fromIndex),
        ...d.cards,
      ] as CardState[]);
      if (!click) emit?.("reject");
    }
    s = { ...s, drag: null, dropTarget: null };
  }
  if (click && hit(pr.x, pr.y, rect(s, "stock", 0))) {
    const recycle = !s.stock.length && !!s.waste.length;
    s = turn(s);
    emit?.(recycle ? "recycle" : "turn");
  }
  const a = menus(s.screen),
    pi = a.findIndex((r) => hit(pr.x, pr.y, r)),
    ui = a.findIndex((r) => hit(x, y, r));
  if (pi >= 0 && pi === ui) {
    if (s.screen === "playing" && pi === 0) emit?.("deal");
    s = activate(s, pi, toggle);
  }
  return s;
}
function vx() {
  const v =
    K.LAUNCH_VX_MIN + Math.random() * (K.LAUNCH_VX_MAX - K.LAUNCH_VX_MIN);
  return Math.random() < 0.5 ? -v : v;
}
function cascade(s: CascadeState, dt: number, emit: Emit): CascadeState {
  if (s.screen !== "won") return s;
  const trail = [...s.trail];
  let st = s.trailStamps;
  const fly = s.flyers
    .map((f) => {
      let vy = f.vy + K.GRAVITY * dt;
      const x = f.x + f.vx * dt;
      let y = f.y + vy * dt;
      if (y >= K.FLOOR_Y && vy > 0) {
        y = K.FLOOR_Y;
        vy = -vy * K.BOUNCE_DAMP;
      }
      if (s.trailPainting) {
        trail.push({ suit: f.suit, rank: f.rank, x, y });
        st++;
      }
      return { ...f, x, y, vy };
    })
    .filter((f) => f.x + 100 >= 0 && f.x <= K.STAGE_W);
  const found = s.foundations.map((p) => [...p]);
  let clock = s.launchClock;
  let launched = s.launched;
  if (s.launching) {
    clock += dt;
    while (clock >= K.LAUNCH_INTERVAL && launched < 52) {
      let i = launched % 4,
        n = 0;
      while (!found[i]!.length && n++ < 4) i = (i + 1) % 4;
      const c = found[i]!.pop();
      if (!c) break;
      fly.push({
        id: c.id,
        suit: c.suit,
        rank: c.rank,
        x: K.FOUNDATION_X[i]!,
        y: K.TOP_ROW_Y,
        vx: vx(),
        vy: K.LAUNCH_VY,
      });
      launched++;
      clock -= K.LAUNCH_INTERVAL;
      emit("launch");
    }
  }
  return {
    ...s,
    trail,
    trailStamps: st,
    flyers: fly,
    foundations: found,
    launchClock: clock,
    launched,
    cascadeDone: launched === 52 && !fly.length,
  };
}
const cv = (c: DeepReadonly<CardState>): CV => ({
  id: c.id,
  suit: c.suit,
  rank: c.rank,
  color: red(c.suit) ? "red" : "black",
  faceUp: c.faceUp,
});
function snap(s: R): Record<string, unknown> {
  const mp = (p: readonly DeepReadonly<CardState>[]) => p.map(cv);
  return {
    version: 1,
    screen: s.screen,
    menuIndex: s.menuIndex,
    titleIndex: s.titleIndex,
    dealMode: K.DEAL_MODE,
    turnCount: K.TURN_COUNT,
    dealModeLabel: K.DEAL_MODE_LABEL,
    muted: s.muted,
    autoFlip: s.autoFlip,
    winDetect: s.winDetect,
    launching: s.launching,
    trailPainting: s.trailPainting,
    stock: mp(s.stock),
    waste: mp(s.waste),
    wasteSets: [...s.wasteSets],
    wasteVisibleCount: s.wasteSets[s.wasteSets.length - 1] ?? 0,
    foundations: s.foundations.map(mp),
    tableau: s.tableau.map(mp),
    drag: s.drag ? { ...s.drag, cards: s.drag.cards.map(cv) } : null,
    dropTarget: s.drag ? target(s, s.drag) : null,
    pointer: { ...s.pointer },
    lastPress: s.lastPress ? { ...s.lastPress } : null,
    launchClock: s.launchClock,
    launched: s.launched,
    flyers: s.flyers.map((f) => ({ ...f })),
    cascadeDone: s.cascadeDone,
    trailStamps: s.trailStamps,
    simTime: s.simTime,
  };
}
function find(s: R, id: number): [PileKind, number, number] | null {
  for (const p of ["stock", "waste", "foundation", "tableau"] as const)
    for (
      let i = 0;
      i < (p === "foundation" ? 4 : p === "tableau" ? 7 : 1);
      i++
    ) {
      const r = pile(s, p, i).findIndex((c) => c.id === id);
      if (r >= 0) return [p, i, r];
    }
  return null;
}
function debug(): CascadeDebugApi {
  const fidx = (s: R, id: number) => {
    const i = s.flyers.findIndex((f) => f.id === id);
    if (i < 0) throw new RangeError("unknown flyer");
    return i;
  };
  return {
    version: 1,
    reset: (s) => base(s.muted),
    snapshot: snap,
    reconcile: own,
    menuItemRect: (s, i) => menus(s.screen)[i] ?? null,
    setScreen: (s, screen) => ({ ...s, screen }) as CascadeState,
    setMenuIndex: (s, menuIndex) => ({ ...s, menuIndex }) as CascadeState,
    setTitleIndex: (s, titleIndex) => ({ ...s, titleIndex }) as CascadeState,
    addCard: (s, p, i, suit, rank, faceUp) => {
      valid(p, i);
      if (
        !K.SUITS.includes(suit) ||
        !Number.isInteger(rank) ||
        rank < 1 ||
        rank > 13
      )
        throw new RangeError("invalid card");
      return {
        ...put(s, p, i, [
          ...pile(s, p, i),
          { id: s.nextId, suit, rank, faceUp },
        ] as CardState[]),
        nextId: s.nextId + 1,
      };
    },
    removeCard: (s, id) => {
      const a = find(s, id);
      if (!a) throw new RangeError("unknown card");
      const [p, i, r] = a,
        q = pile(s, p, i);
      return put(
        s,
        p,
        i,
        [...q.slice(0, r), ...q.slice(r + 1)] as CardState[],
        p === "waste" ? dec(s.wasteSets) : (s.wasteSets as number[]),
      );
    },
    setCardFaceUp: (s, id, faceUp) => {
      const a = find(s, id);
      if (!a) throw new RangeError("unknown card");
      const [p, i, r] = a;
      return put(
        s,
        p,
        i,
        pile(s, p, i).map((c, n) =>
          n === r ? { ...c, faceUp } : c,
        ) as CardState[],
      );
    },
    clearPile: (s, p, i) =>
      put(s, p, i, [], p === "waste" ? [] : (s.wasteSets as number[])),
    clearTable: (s) =>
      ({
        ...s,
        stock: [],
        waste: [],
        wasteSets: [],
        foundations: empty(4),
        tableau: empty(7),
        drag: null,
        dropTarget: null,
      }) as CascadeState,
    addWasteSet: (s, n) => {
      if (!Number.isInteger(n) || n < 0)
        throw new RangeError("count must be a non-negative whole number");
      return { ...s, wasteSets: [...s.wasteSets, n] } as CascadeState;
    },
    clearWasteSets: (s) => ({ ...s, wasteSets: [] }) as CascadeState,
    deal,
    turnStock: turn,
    move: (s, a, ai, r, b, bi) => {
      const [n, ok] = move(s, a, ai, r, b, bi);
      return [n, ok];
    },
    autoMove: (s, p, i) => {
      const [n, ok] = auto(s, p, i);
      return [n, ok];
    },
    pointerDown: (s, x, y) => pointer(s, "down", x, y),
    pointerMove: (s, x, y) => pointer(s, "move", x, y),
    pointerUp: (s, x, y) => pointer(s, "up", x, y),
    setAutoFlip: (s, autoFlip) => ({ ...s, autoFlip }) as CascadeState,
    setWinDetect: (s, winDetect) => ({ ...s, winDetect }) as CascadeState,
    setLaunching: (s, launching) => ({ ...s, launching }) as CascadeState,
    setTrailPainting: (s, trailPainting) =>
      ({ ...s, trailPainting }) as CascadeState,
    addFlyer: (s, suit, rank, x, y, vxx, vy) =>
      ({
        ...s,
        flyers: [...s.flyers, { id: s.nextId, suit, rank, x, y, vx: vxx, vy }],
        nextId: s.nextId + 1,
      }) as CascadeState,
    setFlyerPosition: (s, id, x, y) => {
      const i = fidx(s, id);
      return {
        ...s,
        flyers: s.flyers.map((f, n) => (n === i ? { ...f, x, y } : f)),
      } as CascadeState;
    },
    setFlyerVelocity: (s, id, vxx, vy) => {
      const i = fidx(s, id);
      return {
        ...s,
        flyers: s.flyers.map((f, n) => (n === i ? { ...f, vx: vxx, vy } : f)),
      } as CascadeState;
    },
    removeFlyer: (s, id) => {
      const i = fidx(s, id);
      return {
        ...s,
        flyers: s.flyers.filter((_, n) => n !== i),
      } as CascadeState;
    },
    clearFlyers: (s) => ({ ...s, flyers: [] }) as CascadeState,
    setLaunchClock: (s, launchClock) => ({ ...s, launchClock }) as CascadeState,
    clearTrail: (s) => ({ ...s, trail: [], trailStamps: 0 }) as CascadeState,
    drawLaunchVx: vx,
  };
}
const rank = (r: number) =>
    r === 1
      ? "A"
      : r === 11
        ? "J"
        : r === 12
          ? "Q"
          : r === 13
            ? "K"
            : String(r),
  symbol = (s: Suit) =>
    ({ spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" })[s];
function rr(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 9,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}
function card(
  c: CanvasRenderingContext2D,
  a: { suit: Suit; rank: number },
  x: number,
  y: number,
  up = true,
  alpha = 1,
) {
  c.save();
  c.globalAlpha = alpha;
  rr(c, x, y, 100, 140);
  c.fillStyle = up ? "#fffdf5" : "#173d67";
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = up ? "#d8d1c3" : "#81c9d2";
  c.stroke();
  if (up) {
    c.fillStyle = red(a.suit) ? "#c83246" : "#17202b";
    c.font = "700 24px system-ui";
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(rank(a.rank), x + 9, y + 7);
    c.font = "25px serif";
    c.fillText(symbol(a.suit), x + 9, y + 35);
    c.font = "50px serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(symbol(a.suit), x + 50, y + 78);
  } else {
    c.fillStyle = "#2b6284";
    for (let yy = y + 10; yy < y + 132; yy += 14)
      for (let xx = x + 10; xx < x + 92; xx += 14) c.fillRect(xx, yy, 6, 6);
  }
  c.restore();
}
function slot(c: CanvasRenderingContext2D, x: number, y: number, hi = false) {
  rr(c, x, y, 100, 140);
  c.fillStyle = hi ? "rgba(246,205,92,.2)" : "rgba(255,255,255,.035)";
  c.fill();
  c.setLineDash([8, 7]);
  c.lineWidth = hi ? 4 : 2;
  c.strokeStyle = hi ? "#f6cd5c" : "rgba(220,245,232,.28)";
  c.stroke();
  c.setLineDash([]);
}
function text(
  c: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  n: number,
  color = "#effaf2",
  align: CanvasTextAlign = "center",
) {
  c.fillStyle = color;
  c.font = `700 ${n}px system-ui`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillText(t, x, y);
}
function control(c: CanvasRenderingContext2D, t: string, r: Rect, on: boolean) {
  rr(c, r.x, r.y + 3, r.w, r.h - 6);
  c.fillStyle = on ? "#f6cd5c" : "rgba(255,255,255,.1)";
  c.fill();
  text(c, t, r.x + r.w / 2, r.y + r.h / 2, 17, on ? "#12332f" : "#eef8f0");
}
function table(s: R, c: CanvasRenderingContext2D) {
  for (const t of s.trail) card(c, t, t.x, t.y, true, 0.8);
  slot(c, K.STOCK_X, K.TOP_ROW_Y);
  slot(c, K.WASTE_X, K.TOP_ROW_Y);
  for (let i = 0; i < 4; i++) {
    slot(
      c,
      K.FOUNDATION_X[i]!,
      K.TOP_ROW_Y,
      s.dropTarget?.pile === "foundation" && s.dropTarget.index === i,
    );
    const foundation = s.foundations[i]!;
    const x = foundation[foundation.length - 1];
    if (x) card(c, x, K.FOUNDATION_X[i]!, K.TOP_ROW_Y, x.faceUp);
  }
  const st = s.stock[s.stock.length - 1];
  if (st) card(c, st, K.STOCK_X, K.TOP_ROW_Y, false);
  if (s.wasteSets.length) {
    const n = s.wasteSets[s.wasteSets.length - 1]!,
      a = s.waste.length - n;
    for (let i = 0; i < s.waste.length; i++)
      card(
        c,
        s.waste[i]!,
        i < a ? K.WASTE_X : K.WASTE_X + (i - a) * K.WASTE_FAN,
        K.TOP_ROW_Y,
      );
  }
  for (let i = 0; i < 7; i++) {
    const q = s.tableau[i]!,
      a = ys(q);
    slot(
      c,
      K.COLUMN_X[i]!,
      K.TABLEAU_Y,
      s.dropTarget?.pile === "tableau" && s.dropTarget.index === i,
    );
    q.forEach((x, j) => card(c, x, K.COLUMN_X[i]!, a[j]!, x.faceUp));
  }
  if (s.drag) {
    let y = s.drag.y;
    for (const x of s.drag.cards) {
      card(c, x, s.drag.x, y);
      y += K.FACE_UP_OFFSET;
    }
  }
  for (const f of s.flyers) card(c, f, f.x, f.y);
}

export const game: Game<CascadeState, CascadeDebugApi> = {
  initialize(api: InitApi<CascadeState>) {
    for (const [n, keys] of Object.entries(K.MENU_BINDINGS))
      api.input.register(n, { keys: [...keys] });
    Object.values(K.CUES).forEach((q, i) =>
      api.audio.define(q, {
        wave: i % 2 ? "triangle" : "sine",
        freq: 220 + i * 57,
        freqTo: 300 + i * 71,
        gain: 0.12,
        durationMs: 80 + i * 8,
      }),
    );
    api.diagnostics.register("screen", (s) => `${s.screen} · ${K.DEAL_MODE}`);
    api.diagnostics.register(
      "draw",
      (s) => `stock ${s.stock.length} · waste ${s.waste.length}`,
    );
    api.diagnostics.register("foundations", (s) =>
      s.foundations.map((p) => p.length).join(" / "),
    );
    api.diagnostics.register("tableau", (s) =>
      s.tableau.map((p) => p.length).join(" / "),
    );
    api.diagnostics.register("hand", (s) =>
      s.drag ? `${s.drag.cards.length} cards` : "empty",
    );
    api.diagnostics.register(
      "cascade",
      (s) => `${s.launched} launched · ${s.flyers.length} flying`,
    );
    return [base(), debug()];
  },
  update(state, api: UpdateApi, dt) {
    const cues = new Set<keyof typeof K.CUES>(),
      emit: Emit = (x) => cues.add(x);
    let s = { ...state, simTime: state.simTime + dt } as CascadeState;
    const startedWon = state.screen === "won";
    const toggle = () => api.audio.setMuted(!api.audio.muted());
    for (const q of api.input.pointerSamples())
      if (q.primary && (q.button === "primary" || q.type === "move"))
        s = pointer(s, q.type, q.x, q.y, emit, toggle);
    if (s.screen !== "won") {
      const up = api.input.pressed(K.MENU_UP),
        down = api.input.pressed(K.MENU_DOWN),
        confirm = api.input.pressed(K.MENU_CONFIRM),
        back = api.input.pressed(K.MENU_BACK),
        n = menus(s.screen).length;
      if (n) {
        if (up) s = { ...s, menuIndex: (s.menuIndex + n - 1) % n };
        else if (down) s = { ...s, menuIndex: (s.menuIndex + 1) % n };
        else if (confirm || (back && s.screen === "howto")) {
          if (
            (s.screen === "playing" || s.screen === "title") &&
            s.menuIndex === 0
          )
            emit("deal");
          s = activate(s, s.menuIndex, toggle);
        }
      }
    }
    if (!startedWon && s.screen === "won") emit("win");
    s = cascade(s, dt, emit);
    for (const q of cues) api.audio.play(K.CUES[q]);
    return { ...s, muted: api.audio.muted() };
  },
  render(s, api: RenderApi) {
    const c = api.ctx;
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, K.STAGE_W, K.STAGE_H);
    const g = c.createRadialGradient(640, 300, 80, 640, 300, 720);
    g.addColorStop(0, "rgba(36,117,94,.35)");
    g.addColorStop(1, "rgba(0,22,25,.25)");
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
    if (s.screen === "playing" || s.screen === "won") table(s, c);
    if (s.screen === "title") {
      text(c, K.TITLE_TEXT, 640, 220, 92, "#f6cd5c");
      text(c, K.TAGLINE_TEXT, 640, 295, 22);
      text(c, K.DEAL_MODE_LABEL, 640, 345, 16, "#8ebeb2");
      menus("title").forEach((r, i) =>
        control(c, K.TITLE_ITEMS[i]!, r, s.menuIndex === i),
      );
    }
    if (s.screen === "howto") {
      text(c, "HOW TO PLAY", 640, 92, 48, "#f6cd5c");
      [
        "Build all four foundations from ACE to KING.",
        "Build columns down in alternating colors.",
        "Only a KING fills an empty column.",
        "Turn the STOCK; it recycles when empty.",
        "Drag cards and runs to move them.",
        "DOUBLE-CLICK a card to send it home.",
      ].forEach((x, i) => text(c, x, 640, 190 + i * 58, 24));
      control(c, K.HOWTO_BACK_LABEL, menus("howto")[0]!, true);
    }
    if (s.screen === "playing") {
      c.fillStyle = "rgba(0,20,22,.82)";
      c.fillRect(0, K.HUD_Y, 1280, K.HUD_H);
      menus("playing").forEach((r, i) =>
        control(
          c,
          i === 2
            ? `${K.HUD_ITEMS[i]} ${s.muted ? "OFF" : "ON"}`
            : K.HUD_ITEMS[i]!,
          r,
          s.menuIndex === i,
        ),
      );
      text(c, K.DEAL_MODE_LABEL, 1248, K.HUD_Y + 18, 15, "#9ecbc0", "right");
    }
    if (s.screen === "won" && s.cascadeDone) {
      c.fillStyle = "rgba(2,20,22,.48)";
      c.fillRect(0, 0, 1280, 720);
      text(c, K.WIN_TEXT, 640, 340, 88, "#f6cd5c");
      text(c, "PRESS ANYWHERE TO DEAL AGAIN", 640, 420, 18);
    }
  },
};
