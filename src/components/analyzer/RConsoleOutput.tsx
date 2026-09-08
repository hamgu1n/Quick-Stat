// Renders text styled like R console output. The text itself is produced
// by JS (see src/lib/testRunners.ts) formatted to look like what R would
// print -- no real R runs here.
export function RConsoleOutput({ code, output }: { code?: string; output: string }) {
  return (
    <div className="r-console">
      {code && (
        <div className="r-console-input">
          <span className="r-console-prompt">&gt;</span> {code}
        </div>
      )}
      <pre className="r-console-output">{output}</pre>
    </div>
  );
}
