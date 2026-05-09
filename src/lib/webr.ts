import { WebR } from "webr";

export const webr = new WebR();
export const initWebRPromise = webr.init();

export async function runR(code: string): Promise<string> {
  await initWebRPromise;
  const result = await webr.evalR(code);
  return (await result.toJs()).values.toString();
}
