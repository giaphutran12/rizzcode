/**
 * Wires the server-side judge endpoint into the Vite dev and preview servers.
 *
 * The browser contract is `POST /api/judge` with a JSON JudgeRequest body.
 * Provider credentials are loaded from .env.local into the server process
 * only — never into the client bundle.
 */
import { loadEnv, type Connect, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleJudgeRequest } from "./route";

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      // Bound request bodies at 32 KB; the contract is three short texts.
      if (Buffer.concat(chunks).length > 32 * 1024) {
        reject(new Error("request too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

const judgeHandler: Connect.NextHandleFunction = async (request, response, next) => {
  if (!request.url?.startsWith("/api/judge")) {
    next();
    return;
  }

  const reply = (status: number, payload: unknown) => {
    response.statusCode = status;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(payload));
  };

  if (request.method !== "POST") {
    reply(405, {
      ok: false,
      retryable: false,
      code: "judge_unavailable",
      message: "Use POST for judgment requests.",
    });
    return;
  }

  try {
    const raw = await readBody(request);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      reply(400, {
        ok: false,
        retryable: false,
        code: "judge_invalid_output",
        message: "Request body must be JSON.",
      });
      return;
    }
    const result = await handleJudgeRequest(parsed);
    reply(result.status, result.body);
  } catch {
    reply(500, {
      ok: false,
      retryable: true,
      code: "judge_unavailable",
      message: "The judge hit an unexpected error. Retry judgment.",
    });
  }
};

export function rizzcodeJudgePlugin(): Plugin {
  return {
    name: "rizzcode-judge",
    configResolved(config) {
      // Load server-only variables from .env.local into the Node process.
      // Never print, diff, or forward these values to the client.
      const env = loadEnv(config.mode, config.root, "");
      for (const name of ["OPENAI_API_KEY", "RIZZCODE_JUDGE_MODEL"] as const) {
        if (!process.env[name] && env[name]) {
          process.env[name] = env[name];
        }
      }
    },
    configureServer(server) {
      server.middlewares.use(judgeHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(judgeHandler);
    },
  };
}
