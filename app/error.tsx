"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/system/ErrorScreen";
import { RondoButton } from "@/components/rondo/primitives";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <ErrorScreen
      title="Something broke on this screen"
      body="The rest of Rondo still works. Try again, or head back to matches while we sort it out."
      digest={error.digest}
      primary={<RondoButton onClick={() => retry()}>Try again</RondoButton>}
    />
  );
}
