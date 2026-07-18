import {
  fixtureJudgeProvider,
  type JudgeProvider,
} from "./judge/provider";
import {
  fixturePersonaProvider,
  type PersonaProvider,
} from "./persona/provider";
import { PersonaService } from "./persona/service";
import { personaConversationStore } from "./persona/store";

export function selectPersonaProvider(
  provider: PersonaProvider | undefined,
  environment: NodeJS.ProcessEnv = process.env,
): PersonaProvider | undefined {
  if (provider) return provider;
  if (
    environment.NODE_ENV !== "production" &&
    environment.RIZZCODE_MOCK_PERSONA === "1"
  ) {
    return fixturePersonaProvider;
  }
  return undefined;
}

export function selectJudgeProvider(
  provider: JudgeProvider | undefined,
  environment: NodeJS.ProcessEnv = process.env,
): JudgeProvider | undefined {
  if (provider) return provider;
  if (
    environment.NODE_ENV !== "production" &&
    environment.RIZZCODE_MOCK_JUDGE === "1"
  ) {
    return fixtureJudgeProvider;
  }
  return undefined;
}

export function createPersonaService(provider?: PersonaProvider) {
  return new PersonaService(
    personaConversationStore,
    selectPersonaProvider(provider),
  );
}
