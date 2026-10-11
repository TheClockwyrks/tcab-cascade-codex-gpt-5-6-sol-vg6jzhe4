import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import { STAGE_H, STAGE_W } from "./constants";
import { game } from "./game";

async function setup() {
  const events = new EventTarget();
  const engine = createEngine({
    canvas: createCanvas(STAGE_W, STAGE_H) as unknown as HTMLCanvasElement,
    width: STAGE_W,
    height: STAGE_H,
    game,
    clock: new ConstantClock(100),
    surface: {
      cssWidth: () => STAGE_W,
      cssHeight: () => STAGE_H,
      dpr: () => 1,
      events: () => events,
    },
  });
  await engine.initialize();
  return engine;
}

describe("Cascade rules", () => {
  it("deals the required tableau and stock", async () => {
    const e = await setup();
    e.apply((s) => e.debug.deal(s));
    const x = e.debug.snapshot(e.state);
    expect((x.stock as unknown[]).length).toBe(24);
    expect((x.tableau as unknown[][]).map((p) => p.length)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    e.destroy();
  });
  it("turns three and recycles in the same order", async () => {
    const e = await setup();
    e.apply((s) => e.debug.clearTable(s));
    for (const rank of [1, 2, 3])
      e.apply((s) => e.debug.addCard(s, "stock", 0, "spades", rank, false));
    e.apply((s) => e.debug.turnStock(s));
    expect(e.debug.snapshot(e.state).wasteSets).toEqual([3]);
    e.apply((s) => e.debug.turnStock(s));
    expect(
      (e.debug.snapshot(e.state).stock as { rank: number }[]).map(
        (c) => c.rank,
      ),
    ).toEqual([1, 2, 3]);
    e.destroy();
  });
  it("enforces tableau and foundation rules", async () => {
    const e = await setup();
    e.apply((s) => e.debug.clearTable(s));
    e.apply((s) => e.debug.addCard(s, "tableau", 0, "spades", 8, true));
    e.apply((s) => e.debug.addCard(s, "tableau", 1, "hearts", 7, true));
    const moved = e.debug.move(e.state, "tableau", 1, 0, "tableau", 0);
    expect(moved[1]).toBe(true);
    e.apply(() => moved[0]);
    e.apply((s) => e.debug.addCard(s, "waste", 0, "hearts", 1, true));
    e.apply((s) => e.debug.addWasteSet(s, 1));
    expect(e.debug.autoMove(e.state, "waste", 0)[1]).toBe(true);
    e.destroy();
  });
  it("integrates flyer movement from delta time", async () => {
    const e = await setup();
    e.apply((s) => e.debug.setScreen(s, "won"));
    e.apply((s) => e.debug.setLaunching(s, false));
    e.apply((s) => e.debug.addFlyer(s, "clubs", 13, 100, 100, 200, 0));
    await e.advance(1);
    expect((e.debug.snapshot(e.state).flyers as { x: number }[])[0]!.x).toBe(
      120,
    );
    e.destroy();
  });
});
