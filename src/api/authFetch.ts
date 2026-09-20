import { getSupabaseBrowserClient } from "../lib/auth";
import { MYTHOS_PASS_HEADER, getMythosPass } from "../lib/mythos";

function withMythosPass(init: RequestInit): RequestInit {
  const pass = getMythosPass();
  if (!pass) return init;
  const headers = new Headers(init.headers);
  headers.set(MYTHOS_PASS_HEADER, pass);
  return { ...init, headers };
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_RIZZCODE_MOCK_AUTH === "1"
  ) {
    return fetch(input, withMythosPass(init));
  }
  const client = getSupabaseBrowserClient();
  const {
    data: { session },
  } = client
    ? await client.auth.getSession()
    : { data: { session: null } };
  const headers = new Headers(withMythosPass(init).headers);
  if (session?.access_token) {
    headers.set("authorization", `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
