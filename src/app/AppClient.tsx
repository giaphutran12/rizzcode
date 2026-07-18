"use client";

import dynamic from "next/dynamic";

const App = dynamic(
  () => import("../App").then((module) => module.App),
  { ssr: false },
);

export function AppClient() {
  return <App />;
}
