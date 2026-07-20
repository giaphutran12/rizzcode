import { afterEach, describe, expect, it, vi } from "vitest";
import type { JudgeResult } from "../../src/domain/types";
import { judgmentStoreForRuntime, MemoryJudgmentStore } from "./store";

const key = {
  attemptId: "attempt-idempotent",
  scenarioId: "RC-001",
  transcriptHash: "hash-one",
};

const result = {
  schemaVersion: "1.0",
  attemptId: key.attemptId,
  mode: "llm",
} as JudgeResult;

describe("judgment idempotency store", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("claims once, exposes pending, then reuses the completed result", async () => {
    const store = new MemoryJudgmentStore();
    const claim = await store.claim(key);
    expect(claim).toMatchObject({ kind: "claimed" });
    await expect(store.claim(key)).resolves.toEqual({ kind: "pending" });
    if (claim.kind !== "claimed") throw new Error("Expected claim");
    await store.complete(key, claim.claimToken, result);
    await expect(store.claim(key)).resolves.toEqual({
      kind: "completed",
      result,
    });
  });

  it("rejects attempt-id reuse with a different transcript", async () => {
    const store = new MemoryJudgmentStore();
    await store.claim(key);
    await expect(
      store.claim({ ...key, transcriptHash: "hash-two" }),
    ).resolves.toEqual({ kind: "conflict" });
  });

  it("releases a failed claim so explicit retry can start again", async () => {
    const store = new MemoryJudgmentStore();
    const first = await store.claim(key);
    if (first.kind !== "claimed") throw new Error("Expected claim");
    await store.release(key, first.claimToken);
    await expect(store.claim(key)).resolves.toMatchObject({ kind: "claimed" });
  });

  it("does not let an expired lease complete or release a newer claim", async () => {
    const store = new MemoryJudgmentStore();
    const claim = await store.claim(key);
    if (claim.kind !== "claimed") throw new Error("Expected claim");
    await expect(
      store.complete(key, "stale-lease", result),
    ).rejects.toThrow(/claim was lost/i);
    await store.release(key, "stale-lease");
    await expect(store.claim(key)).resolves.toEqual({ kind: "pending" });
  });

  it("fails closed instead of using process memory in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");

    await expect(judgmentStoreForRuntime().claim(key)).rejects.toThrow(
      /not configured in production/i,
    );
  });
});
