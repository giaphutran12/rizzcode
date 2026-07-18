import type {
  JudgeApiResponse,
  PersonaApiResponse,
} from "../../../domain/types";
import {
  createPersonaService,
  selectJudgeProvider,
} from "../../../../server/runtime";
import { JudgeRequestSchema } from "../../../../server/judge/schema";
import { judgeAttempt } from "../../../../server/judge/service";
import { PersonaRequestSchema } from "../../../../server/persona/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const personaService = createPersonaService();
const maxRequestBytes = 24 * 1024;

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

async function parseBody(request: Request): Promise<unknown> {
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxRequestBytes) {
    throw new Error("request_too_large");
  }
  return JSON.parse(body);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const path = (await context.params).path ?? [];
  let body: unknown;
  try {
    body = await parseBody(request);
  } catch {
    const judging = path.length === 1 && path[0] === "judge";
    return json(
      {
        ok: false,
        retryable: false,
        code: judging ? "judge_invalid_output" : "persona_invalid_request",
        message: "The request body was invalid.",
      },
      400,
    );
  }

  if (path[0] === "persona" && path.length <= 2) {
    const parsed = PersonaRequestSchema.safeParse(body);
    if (!parsed.success) {
      const result: PersonaApiResponse = {
        ok: false,
        retryable: false,
        code: "persona_invalid_request",
        message:
          "The persona request was invalid. Your conversation did not advance.",
      };
      return json(result, 400);
    }

    const preparing = path[1] === "prepare";
    if (path.length === 2 && !preparing) {
      return json({ ok: false, message: "Not found." }, 404);
    }
    const result = preparing
      ? await personaService.prepare(parsed.data)
      : await personaService.respond(parsed.data);
    const publicResult =
      preparing && result.ok
        ? {
            ok: true as const,
            attemptId: result.attemptId,
            scenarioId: result.scenarioId,
            turn: result.turn,
            prepared: true as const,
          }
        : result;
    return json(publicResult, result.ok ? 200 : result.retryable ? 503 : 409);
  }

  if (path.length === 1 && path[0] === "judge") {
    const parsed = JudgeRequestSchema.safeParse(body);
    if (!parsed.success) {
      const result: JudgeApiResponse = {
        ok: false,
        retryable: false,
        code: "judge_invalid_output",
        message:
          "The judge request was invalid. Only canonical scenario responses are accepted.",
      };
      return json(result, 400);
    }
    const result = await judgeAttempt(
      parsed.data,
      selectJudgeProvider(undefined),
    );
    return json(result, result.ok ? 200 : result.retryable ? 503 : 409);
  }

  return json({ ok: false, message: "Not found." }, 404);
}
