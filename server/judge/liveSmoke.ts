import dotenv from "dotenv";
import { aiSdkJudgeProvider } from "./provider";
import { judgeAttempt } from "./service";

dotenv.config({
  path: process.env.RIZZCODE_ENV_FILE || ".env.local",
  quiet: true,
});

if (!process.env.OPENAI_API_KEY) {
  console.error(
    "Live judge smoke skipped: OPENAI_API_KEY is not configured server-side.",
  );
  process.exit(1);
}

const result = await judgeAttempt(
  {
    schemaVersion: "1.0",
    attemptId: `live-smoke-${Date.now()}`,
    scenarioId: "spark-bus-stop",
    responses: [
      {
        turn: 1,
        body: "That ramen tote is elite. Is it a recommendation or a warning?",
      },
      {
        turn: 2,
        body: "Spicy miso is my answer, but I respect a strong competing case. What is yours?",
      },
      {
        turn: 3,
        body: "This was fun. Want to swap numbers and continue the ramen tribunal sometime?",
      },
    ],
  },
  aiSdkJudgeProvider,
);

if (!result.ok) {
  console.error(`Live judge smoke failed: ${result.code}`);
  process.exit(1);
}

console.log(
  `Live judge smoke passed with five rubric criteria and verdict ${result.result.verdict}.`,
);
