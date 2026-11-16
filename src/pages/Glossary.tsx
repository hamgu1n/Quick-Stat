import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import lessonHeadings from "virtual:lesson-headings";
import { SYMBOLS, VOCABULARY, type GlossaryLink } from "@/content/glossary";
import { MathText } from "@/components/MathText";
import { useSettingsStore } from "@/store/settingsStore";

type Tab = "vocabulary" | "symbols";

/**
 * Finds the "Section X.Y" a heading belongs to: the heading itself if it's
 * a section heading, or the closest section heading above it.
 */
function sectionFor({ lesson, at }: GlossaryLink): string {
  const headings = lessonHeadings[lesson] ?? [];
  const index = headings.findIndex((h) => h.id === at);
  for (let i = index; i >= 0; i--) {
    const m = /^Section (\d+\.\d+)/.exec(headings[i].title);
    if (m) return m[1];
  }
  return "";
}

/** Text used for searching, without LaTeX backslashes and braces. */
function plain(text: string) {
  return text.replace(/\\[a-zA-Z]+/g, " ").replace(/[{}$^_\\]/g, "").toLowerCase();
}

function SectionLink(link: GlossaryLink) {
  const section = sectionFor(link);
  return (
    <Link to={`/textbook/${link.lesson}?at=${link.at}`} className="glossary-section">
      {section ? `Section ${section}` : "See lesson"} →
    </Link>
  );
}

/**
 * The Glossary (/textbook/glossary): vocabulary terms and math symbols.
 * Rendered by the Textbook page inside its layout, next to the chapter list.
 */
export default function Glossary() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "symbols" ? "symbols" : "vocabulary";
  const [query, setQuery] = useState("");
  const showAdvanced = useSettingsStore((s) => s.showAdvanced);
  const q = query.trim().toLowerCase();

  // Vocabulary, alphabetized and grouped by first letter.
  const vocabByLetter = useMemo(() => {
    const visible = VOCABULARY.filter((v) => showAdvanced || !v.advanced)
      .filter((v) => !q || v.term.toLowerCase().includes(q) || plain(v.definition).includes(q))
      .sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));
    const groups = new Map<string, typeof visible>();
    for (const v of visible) {
      const letter = /[a-z]/i.test(v.term[0]) ? v.term[0].toUpperCase() : "#";
      groups.set(letter, [...(groups.get(letter) ?? []), v]);
    }
    return [...groups.entries()];
  }, [q, showAdvanced]);

  // Symbols, in the order they appear in the textbook.
  const symbols = useMemo(
    () =>
      SYMBOLS.filter((s) => showAdvanced || !s.advanced).filter(
        (s) => !q || s.say.toLowerCase().includes(q) || plain(s.meaning).includes(q) || plain(s.tex).includes(q),
      ),
    [q, showAdvanced],
  );


  return (
    <div className="glossary">
      <h1>Glossary</h1>
      <p className="glossary-intro">
        Every key term and math symbol in the textbook, with a link to the
        section where it's introduced.
      </p>

      <div className="glossary-tabs" role="tablist">
        {(["vocabulary", "symbols"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`glossary-tab${tab === t ? " glossary-tab--active" : ""}`}
            onClick={() => setParams(t === "symbols" ? { tab: "symbols" } : {}, { replace: true })}
          >
            {t === "vocabulary" ? "Vocabulary" : "Math Symbols"}
          </button>
        ))}
      </div>

      <label className="glossary-search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search the glossary</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "vocabulary" ? "Search terms (e.g. “p-value”)" : "Search symbols (e.g. “sigma”, “mean”)"}
        />
      </label>

      {tab === "vocabulary" ? (
        <>
          {vocabByLetter.length > 0 && !q && (
            <nav className="glossary-letters" aria-label="Jump to letter">
              {vocabByLetter.map(([letter]) => (
                <a key={letter} href={`#letter-${letter}`} onClick={(e) => {
                  // HashRouter owns the URL hash, so scroll manually.
                  e.preventDefault();
                  document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: "smooth" });
                }}>
                  {letter}
                </a>
              ))}
            </nav>
          )}
          {vocabByLetter.map(([letter, entries]) => (
            <section key={letter} className="glossary-group" id={`letter-${letter}`}>
              <h2>{letter}</h2>
              <dl>
                {entries.map((v) => (
                  <div key={v.term} className="glossary-entry">
                    <dt>
                      {v.term}
                      {v.advanced && <span className="toc-advanced-tag">Advanced</span>}
                    </dt>
                    <dd>
                      <MathText text={v.definition} /> <SectionLink {...v} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </>
      ) : (
        <div className="glossary-symbols" role="table" aria-label="Math symbols">
          <div className="glossary-symbol glossary-symbol--head" role="row">
            <span role="columnheader">Symbol</span>
            <span role="columnheader">How to say it</span>
            <span role="columnheader">Meaning</span>
          </div>
          {symbols.map((s) => (
            <div key={s.tex} className="glossary-symbol" role="row">
              <span role="cell" className="glossary-symbol__tex">
                <MathText text={`$${s.tex}$`} />
              </span>
              <span role="cell" className="glossary-symbol__say">
                “{s.say}”
                {s.advanced && <span className="toc-advanced-tag">Advanced</span>}
              </span>
              <span role="cell">
                <MathText text={s.meaning} /> <SectionLink {...s} />
              </span>
            </div>
          ))}
        </div>
      )}

      {((tab === "vocabulary" && vocabByLetter.length === 0) || (tab === "symbols" && symbols.length === 0)) && (
        <p className="glossary-empty">Nothing matches “{query}”.</p>
      )}

    </div>
  );
}
