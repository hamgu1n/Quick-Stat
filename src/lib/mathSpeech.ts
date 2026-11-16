/**
 * Math pronunciation tooltips.
 *
 * Before KaTeX draws a formula, `annotateTex` wraps each symbol a student
 * might not know how to say in KaTeX's `\htmlData{say=...}{...}`. KaTeX turns
 * that into a `data-say="..."` attribute on the symbol, and the MathTooltip
 * component shows that text when the symbol is hovered or tapped:
 *
 *   \bar{x}      -> "x-bar"          \hat{p}_1   -> "p-hat one"
 *   H_0          -> "H-naught"       z^*         -> "z-star"
 *   \sigma^2     -> "sigma squared"  \mu_{\bar{x}} -> "mu sub x-bar"
 *   \pm          -> "plus or minus"  \sqrt{...}  -> "square root of"
 *
 * Used at build time by the remark plugin below (lessons) and in the
 * browser by MathText (quiz questions), so it can't use the `@/` alias.
 */

const GREEK: Record<string, string> = {
  alpha: "alpha", beta: "beta (BAY-tuh)", gamma: "gamma", delta: "delta",
  epsilon: "epsilon", eta: "eta (AY-tuh)", theta: "theta", lambda: "lambda",
  mu: "mu (myoo)", pi: "pi", rho: "rho (row)", sigma: "sigma", tau: "tau",
  phi: "phi (fy)", chi: "chi (ky)", Sigma: "capital sigma", Delta: "capital delta",
};

// Short Greek names used when the letter is part of a longer phrase
// ("mu-naught", not "mu (myoo)-naught").
const GREEK_SHORT: Record<string, string> = {
  alpha: "alpha", beta: "beta", gamma: "gamma", delta: "delta", epsilon: "epsilon",
  eta: "eta", theta: "theta", lambda: "lambda", mu: "mu", pi: "pi", rho: "rho",
  sigma: "sigma", tau: "tau", phi: "phi", chi: "chi", Sigma: "capital sigma", Delta: "capital delta",
};

// Operators and relations: [spoken form, KaTeX class to keep their spacing].
const OPERATORS: Record<string, [string, "mathbin" | "mathrel" | "mathord"]> = {
  pm: ["plus or minus", "mathbin"],
  times: ["times", "mathbin"],
  cdot: ["times", "mathbin"],
  cup: ["union (or)", "mathbin"],
  cap: ["intersection (and)", "mathbin"],
  mid: ["given", "mathrel"],
  geq: ["is greater than or equal to", "mathrel"],
  ge: ["is greater than or equal to", "mathrel"],
  leq: ["is less than or equal to", "mathrel"],
  le: ["is less than or equal to", "mathrel"],
  neq: ["is not equal to", "mathrel"],
  ne: ["is not equal to", "mathrel"],
  approx: ["is approximately equal to", "mathrel"],
  sim: ["follows the distribution (is distributed as)", "mathrel"],
  Rightarrow: ["which means", "mathrel"],
  infty: ["infinity", "mathord"],
  cdots: ["and so on", "mathord"],
  ldots: ["and so on", "mathord"],
};

// Commands whose argument is text, not math: copied through untouched.
const TEXT_COMMANDS = new Set(["text", "textbf", "textit", "mathrm", "mathbf", "operatorname", "mathit"]);

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

/** Strips characters KaTeX's key=value syntax can't hold. */
function clean(say: string) {
  return say.replace(/[{}=,\\%#$&]/g, " ").replace(/\s+/g, " ").trim();
}

function wrap(say: string, body: string, cls?: "mathbin" | "mathrel" | "mathord") {
  const tagged = `\\htmlData{say=${clean(say)}}{${body}}`;
  return cls && cls !== "mathord" ? `\\${cls}{${tagged}}` : tagged;
}

/** Index just past the brace group that starts at `open` (which must be "{"). */
function matchBrace(tex: string, open: number) {
  let depth = 0;
  for (let i = open; i < tex.length; i++) {
    if (tex[i] === "\\") { i++; continue; }
    if (tex[i] === "{") depth++;
    else if (tex[i] === "}" && --depth === 0) return i + 1;
  }
  return tex.length;
}

/** Reads one sub/superscript argument: "{...}", "\cmd", or a single character. */
function readArg(tex: string, i: number): [string, number] {
  if (tex[i] === "{") {
    const end = matchBrace(tex, i);
    return [tex.slice(i + 1, end - 1), end];
  }
  if (tex[i] === "\\") {
    const m = /^\\[a-zA-Z]+/.exec(tex.slice(i));
    if (m) return [m[0], i + m[0].length];
  }
  return [tex[i] ?? "", i + 1];
}

/** A rough spoken version of a small piece of TeX, for subscripts and the like. */
function speakPlain(tex: string): string {
  return tex
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\(bar|hat)\{([^}]*)\}/g, (_, a, b) => `${b}-${a}`)
    .replace(/\\([a-zA-Z]+)/g, (_, c) => GREEK_SHORT[c] ?? c)
    .replace(/[{}]/g, "")
    .trim();
}

function speakSub(sub: string) {
  if (sub === "0") return "-naught";
  if (/^\d$/.test(sub)) return " " + NUMBER_WORDS[Number(sub)];
  if (sub === "pool" || sub === "\\text{pool}") return " pool";
  if (/^[A-Z]$/.test(sub)) return " " + sub;
  return " sub " + speakPlain(sub);
}

function speakSup(sup: string) {
  if (sup === "2") return " squared";
  if (sup === "*") return "-star";
  if (sup === "c") return " complement";
  if (sup === "+") return "-plus";
  if (sup === "-") return "-minus";
  return " to the " + speakPlain(sup);
}

/** Adds pronunciation labels to a TeX string. Safe to run on any formula. */
export function annotateTex(tex: string): string {
  let out = "";
  let i = 0;
  while (i < tex.length) {
    const rest = tex.slice(i);
    const prev = i > 0 ? tex[i - 1] : "";

    // --- An "atom" that may carry a pronunciation: \bar{x}, \hat{p}, a Greek
    //     letter, or a lone letter with a subscript/superscript.
    let base = "";        // spoken base, e.g. "x-bar"
    let fancy = false;    // true if the base alone deserves a tooltip
    let shortName = "";   // base name used inside longer phrases
    let end = i;
    const accent = /^\\(bar|hat)\{([a-zA-Z])\}/.exec(rest);
    const cmd = /^\\([a-zA-Z]+)/.exec(rest);
    if (accent) {
      base = shortName = `${accent[2]}-${accent[1]}`;
      fancy = true;
      end = i + accent[0].length;
    } else if (cmd && GREEK[cmd[1]]) {
      base = GREEK[cmd[1]];
      shortName = GREEK_SHORT[cmd[1]];
      fancy = true;
      end = i + cmd[0].length;
    } else if (/^[a-zA-Z](?![a-zA-Z])/.test(rest) && !/[a-zA-Z\\]/.test(prev)) {
      base = shortName = rest[0];
      end = i + 1;
    }

    if (base) {
      let say = "";
      let j = end;
      let sub = "";
      let sup = "";
      if (tex[j] === "_") [sub, j] = readArg(tex, j + 1);
      const beforeSup = j;
      if (tex[j] === "^") [sup, j] = readArg(tex, j + 1);
      // Only a few superscripts have a spoken name (squared, star, ...).
      // Others, like ^k, stay outside the label and are read as written.
      if (sup && !/^(2|\*|c|\+|-)$/.test(sup)) {
        sup = "";
        j = beforeSup;
      }
      if (!sub && tex[j] === "!" && !fancy) {
        say = `${base} factorial`;
        j += 1;
      } else if (sub || sup) {
        // Special readings first, then the general pattern.
        if (shortName === "H" && sub === "0") say = "H-naught (the null hypothesis)";
        else if (shortName === "H" && sub === "a") say = "H-A (the alternative hypothesis)";
        else if (shortName === "chi" && sup === "2") say = "chi-square (ky-square)";
        else say = shortName + (sub ? speakSub(sub) : "") + (sup ? speakSup(sup) : "");
      } else if (fancy) {
        say = base;
        j = end;
      }
      if (say) {
        // Annotate inside the subscript too, e.g. \mu_{\bar{x}}.
        out += wrap(say, tex.slice(i, j));
        i = j;
        continue;
      }
    }

    // --- "df" (degrees of freedom), optionally with a subscript like df_1.
    const df = /^df(?![a-zA-Z])(_\{?\d\}?)?/.exec(rest);
    if (df && !/[a-zA-Z\\]/.test(prev)) {
      const n = df[1]?.replace(/\D/g, "");
      out += wrap(`degrees of freedom${n ? " " + NUMBER_WORDS[Number(n)] : ""}`, df[0]);
      i += df[0].length;
      continue;
    }

    // --- Numbers followed by "!" (factorials like 5! and 0!).
    const fact = /^(\d+)!/.exec(rest);
    if (fact && !/[\d.]/.test(prev)) {
      out += wrap(`${fact[1]} factorial`, fact[0]);
      i += fact[0].length;
      continue;
    }

    if (cmd) {
      const name = cmd[1];
      const after = i + cmd[0].length;
      // Text commands: copy the argument untouched.
      if (TEXT_COMMANDS.has(name) && tex[after] === "{") {
        const close = matchBrace(tex, after);
        out += tex.slice(i, close);
        i = close;
        continue;
      }
      if (OPERATORS[name] && !/^[a-zA-Z]/.test(tex.slice(after))) {
        const [say, cls] = OPERATORS[name];
        out += wrap(say, cmd[0], cls);
        i = after;
        continue;
      }
      if (name === "sqrt" && tex[after] === "{") {
        const close = matchBrace(tex, after);
        out += wrap("square root of", `\\sqrt{${annotateTex(tex.slice(after + 1, close - 1))}}`);
        i = close;
        continue;
      }
      if ((name === "binom" || name === "dbinom") && tex[after] === "{") {
        const [n, j1] = readArg(tex, after);
        const [k, j2] = readArg(tex, j1);
        out += wrap(`${speakPlain(n)} choose ${speakPlain(k)}`, tex.slice(i, j2));
        i = j2;
        continue;
      }
      if (name === "sum") {
        let j = after;
        let lo = "";
        let hi = "";
        if (tex[j] === "_") [lo, j] = readArg(tex, j + 1);
        if (tex[j] === "^") [hi, j] = readArg(tex, j + 1);
        const say = lo && hi ? `the sum from ${speakPlain(lo).replace("=", " equals ")} to ${speakPlain(hi)} of` : "the sum of";
        out += wrap(say, tex.slice(i, j));
        i = j;
        continue;
      }
      if (name === "lvert") {
        const close = tex.indexOf("\\rvert", after);
        if (close > 0) {
          const inner = tex.slice(after, close);
          out += wrap(`the absolute value of ${speakPlain(inner)}`, `\\lvert ${annotateTex(inner)} \\rvert`);
          i = close + "\\rvert".length;
          continue;
        }
      }
      // Any other command: copy its name whole so its letters aren't read as variables.
      out += cmd[0];
      i = after;
      continue;
    }

    // A backslash followed by a symbol (\, \; \! \{ \$): copy both characters.
    if (tex[i] === "\\") {
      out += tex.slice(i, i + 2);
      i += 2;
      continue;
    }

    out += tex[i];
    i += 1;
  }
  return out;
}

/** KaTeX options that allow the \htmlData labels annotateTex adds. */
export const KATEX_SPEECH_OPTIONS = {
  trust: (context: { command: string }) => context.command === "\\htmlData",
  strict: (code: string) => (code === "htmlExtension" ? "ignore" : "warn"),
};

// Just enough of the Markdown syntax tree shape for what we need here.
type HNode = { type: string; value?: string; children?: HNode[] };
type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hChildren?: HNode[] };
};

/** Replaces the text inside remark-math's stored HTML copy of the TeX. */
function setStoredTex(nodes: HNode[] | undefined, value: string) {
  for (const n of nodes ?? []) {
    if (n.type === "text") n.value = value;
    else setStoredTex(n.children, value);
  }
}

/** Remark plugin: adds pronunciation labels to every $...$ and $$...$$ in a lesson. */
export function remarkMathSpeech() {
  return (tree: MdNode) => {
    const visit = (node: MdNode) => {
      if ((node.type === "math" || node.type === "inlineMath") && typeof node.value === "string") {
        node.value = annotateTex(node.value);
        // remark-math also stores a copy of the TeX for the HTML step:
        // directly for $inline$ math, one level down (<pre><code>) for $$block$$.
        setStoredTex(node.data?.hChildren, node.value);
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
