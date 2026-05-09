import { useContext, useEffect } from "react";
import React from "react";
import type { WebR } from "webr";
import { webr, initWebRPromise } from "@/lib/webr";

type WebRContextType = {
  status: "loading" | "ready" | "error";
  error?: Error;
  webR?: WebR;
};

const WebRContext = React.createContext<WebRContextType>({
  status: "loading",
});

export const useWebR = () => {
  const context = useContext(WebRContext);
  if (context.status === "error") {
    context.error ??= new Error("Failed to initialize WebR");
    throw context.error;
  }
  if (context.status === "loading") {
    throw new Promise(() => {});
  }
  return context.webR!;
};

export function WebRProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<WebRContextType>({
    status: "loading",
  });

  useEffect(() => {
    initWebRPromise
      .then(() => setState({ status: "ready", webR: webr }))
      .catch((error) => setState({ status: "error", error }));
  }, []);

  return <WebRContext.Provider value={state}>{children}</WebRContext.Provider>;
}
