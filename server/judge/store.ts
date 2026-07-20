import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { JudgeResult } from "../../src/domain/types";

export type JudgmentClaim =
  | { kind: "claimed"; claimToken: string }
  | { kind: "completed"; result: unknown }
  | { kind: "pending" }
  | { kind: "conflict" };

export type JudgmentStoreKey = {
  attemptId: string;
  scenarioId: string;
  transcriptHash: string;
  userId?: string;
};

export interface JudgmentStore {
  claim(key: JudgmentStoreKey): Promise<JudgmentClaim>;
  complete(
    key: JudgmentStoreKey,
    claimToken: string,
    result: JudgeResult,
  ): Promise<void>;
  release(key: JudgmentStoreKey, claimToken: string): Promise<void>;
  invalidateCompleted(key: JudgmentStoreKey): Promise<void>;
}

type MemoryRecord = JudgmentStoreKey & {
  status: "pending" | "completed";
  result?: JudgeResult;
  claimToken: string;
};

export class MemoryJudgmentStore implements JudgmentStore {
  private readonly records = new Map<string, MemoryRecord>();

  async claim(key: JudgmentStoreKey): Promise<JudgmentClaim> {
    const existing = this.records.get(key.attemptId);
    if (!existing) {
      const claimToken = randomUUID();
      this.records.set(key.attemptId, {
        ...key,
        status: "pending",
        claimToken,
      });
      return { kind: "claimed", claimToken };
    }
    if (
      existing.scenarioId !== key.scenarioId ||
      existing.transcriptHash !== key.transcriptHash
    ) {
      return { kind: "conflict" };
    }
    if (existing.status === "completed" && existing.result) {
      return { kind: "completed", result: structuredClone(existing.result) };
    }
    return { kind: "pending" };
  }

  async complete(
    key: JudgmentStoreKey,
    claimToken: string,
    result: JudgeResult,
  ): Promise<void> {
    const existing = this.records.get(key.attemptId);
    if (
      !existing ||
      existing.scenarioId !== key.scenarioId ||
      existing.transcriptHash !== key.transcriptHash ||
      existing.claimToken !== claimToken ||
      existing.status !== "pending"
    ) {
      throw new Error("Judgment claim was lost before completion.");
    }
    this.records.set(key.attemptId, {
      ...existing,
      userId: existing.userId ?? key.userId,
      status: "completed",
      result: structuredClone(result),
    });
  }

  async release(key: JudgmentStoreKey, claimToken: string): Promise<void> {
    const existing = this.records.get(key.attemptId);
    if (
      existing?.status === "pending" &&
      existing.scenarioId === key.scenarioId &&
      existing.transcriptHash === key.transcriptHash &&
      existing.claimToken === claimToken
    ) {
      this.records.delete(key.attemptId);
    }
  }

  async invalidateCompleted(key: JudgmentStoreKey): Promise<void> {
    const existing = this.records.get(key.attemptId);
    if (
      existing?.status === "completed" &&
      existing.scenarioId === key.scenarioId &&
      existing.transcriptHash === key.transcriptHash
    ) {
      this.records.delete(key.attemptId);
    }
  }

  clear(): void {
    this.records.clear();
  }
}

class SupabaseJudgmentStore implements JudgmentStore {
  constructor(private readonly client: SupabaseClient) {}

  async claim(key: JudgmentStoreKey): Promise<JudgmentClaim> {
    const { data, error } = await this.client.rpc(
      "claim_rizzcode_judgment",
      {
        p_attempt_id: key.attemptId,
        p_scenario_id: key.scenarioId,
        p_transcript_hash: key.transcriptHash,
        p_user_id: key.userId ?? null,
      },
    );
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    const status = (row as { claim_status?: unknown } | null)?.claim_status;
    if (status === "claimed") {
      const claimToken = (row as { lease_token?: unknown }).lease_token;
      if (typeof claimToken !== "string") {
        throw new Error("Judgment claim did not include its lease token.");
      }
      return { kind: "claimed", claimToken };
    }
    if (status === "pending") return { kind: "pending" };
    if (status === "conflict") return { kind: "conflict" };
    if (status === "completed") {
      return {
        kind: "completed",
        result: (row as { stored_result?: unknown }).stored_result,
      };
    }
    throw new Error("Judgment claim returned an unsupported state.");
  }

  async complete(
    key: JudgmentStoreKey,
    claimToken: string,
    result: JudgeResult,
  ): Promise<void> {
    const { data, error } = await this.client
      .from("rizzcode_judgments")
      .update({
        status: "completed",
        result,
        user_id: key.userId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("attempt_id", key.attemptId)
      .eq("scenario_id", key.scenarioId)
      .eq("transcript_hash", key.transcriptHash)
      .eq("claim_token", claimToken)
      .eq("status", "pending")
      .select("attempt_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Judgment claim was lost before completion.");
  }

  async release(key: JudgmentStoreKey, claimToken: string): Promise<void> {
    const { error } = await this.client
      .from("rizzcode_judgments")
      .delete()
      .eq("attempt_id", key.attemptId)
      .eq("scenario_id", key.scenarioId)
      .eq("transcript_hash", key.transcriptHash)
      .eq("claim_token", claimToken)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
  }

  async invalidateCompleted(key: JudgmentStoreKey): Promise<void> {
    const { error } = await this.client
      .from("rizzcode_judgments")
      .delete()
      .eq("attempt_id", key.attemptId)
      .eq("scenario_id", key.scenarioId)
      .eq("transcript_hash", key.transcriptHash)
      .eq("status", "completed");
    if (error) throw new Error(error.message);
  }
}

class UnavailableJudgmentStore implements JudgmentStore {
  private fail(): never {
    throw new Error(
      "Persistent judgment idempotency is not configured in production.",
    );
  }

  async claim(): Promise<JudgmentClaim> {
    return this.fail();
  }

  async complete(): Promise<void> {
    return this.fail();
  }

  async release(): Promise<void> {
    return this.fail();
  }

  async invalidateCompleted(): Promise<void> {
    return this.fail();
  }
}

const memoryStore = new MemoryJudgmentStore();
const unavailableStore = new UnavailableJudgmentStore();
let cachedSupabaseStore: JudgmentStore | undefined;

export function judgmentStoreForRuntime(): JudgmentStore {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) {
    return process.env.NODE_ENV === "production"
      ? unavailableStore
      : memoryStore;
  }
  cachedSupabaseStore ??= new SupabaseJudgmentStore(
    createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  );
  return cachedSupabaseStore;
}
