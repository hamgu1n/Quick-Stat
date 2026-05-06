import { WebR } from "webr";

const webr = new WebR();
const initPromise = webr.init();

export async function runR(code: string): Promise<string> {
  await initPromise;
  const result = await webr.evalR(code);
  return (await result.toJs()).values.toString();
}
