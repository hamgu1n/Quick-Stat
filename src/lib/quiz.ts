/**
 * Section Review quizzes.
 *
 * Each lesson has a quiz in src/content/quizzes/<lesson slug>.txt, written in
 * a simple plain-text format so questions are easy to add or edit:
 *
 *   ### What is the median of 2, 3, 5, 6, 8?
 *   @ the-median
 *   - 4.8
 *   + 5
 *   - 6
 *   - 3
 *   > The data are in order and n = 5, so the median is the 3rd value.
 *
 * - `###` starts a question; the text can continue on following lines.
 * - `@` is the id of the lesson heading to reread if the answer is wrong
 *   (the heading's text in lowercase with dashes; "The Median" -> the-median).
 * - `-` is a wrong choice and `+` the correct one (exactly one `+`).
 * - `>` lines are the explanation shown after checking.
 * - Math works anywhere with $...$, just like in the lessons.
 * - Lines before the first `###` are ignored, so they can hold notes.
 *
 * This file is also run directly by Node in the quiz check script, so it
 * can't use the `@/` path alias.
 */

export type QuizQuestion = {
  prompt: string;
  choices: string[];
  /** Index into `choices` of the correct answer. */
  answer: number;
  explanation: string;
  /** Heading id in the lesson to send the student to when they miss it. */
  section: string;
};

export function parseQuiz(source: string): QuizQuestion[] {
  const blocks = source.split(/^###\s+/m).slice(1);
  return blocks.map((block, i) => {
    const prompt: string[] = [];
    const choices: string[] = [];
    const explanation: string[] = [];
    let answer = -1;
    let section = "";

    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("@")) section = line.slice(1).trim();
      else if (line.startsWith("+ ")) {
        if (answer !== -1) throw new Error(`Question ${i + 1} has more than one correct (+) choice`);
        answer = choices.length;
        choices.push(line.slice(2));
      } else if (line.startsWith("- ")) choices.push(line.slice(2));
      else if (line.startsWith(">")) explanation.push(line.slice(1).trim());
      else if (choices.length === 0) prompt.push(line);
      else throw new Error(`Question ${i + 1}: unexpected line "${line}"`);
    }

    if (answer === -1) throw new Error(`Question ${i + 1} has no correct (+) choice`);
    if (choices.length < 2) throw new Error(`Question ${i + 1} needs at least two choices`);
    if (!section) throw new Error(`Question ${i + 1} has no @ section`);
    return {
      prompt: prompt.join(" "),
      choices,
      answer,
      explanation: explanation.join(" "),
      section,
    };
  });
}
