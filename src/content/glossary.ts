/**
 * Glossary content: vocabulary terms and math symbols.
 *
 * Each entry links to where it's introduced: `lesson` is the lesson's slug
 * and `at` is the id of the heading it falls under (the heading's text in
 * lowercase with dashes, e.g. "The Median" -> "the-median"). The Glossary
 * page works out the section number from those, so renumbering sections
 * never breaks this file.
 *
 * Definitions and meanings can use $...$ math. Mark entries that belong to
 * hidden "beyond the course" material with `advanced: true`.
 */

export type GlossaryLink = { lesson: string; at: string; advanced?: boolean };
export type VocabEntry = GlossaryLink & { term: string; definition: string };
export type SymbolEntry = GlossaryLink & { tex: string; say: string; meaning: string };

// Lesson slugs, so the entries below stay readable.
const SAMPLING = "01-1-populations-and-samples";
const DESIGN = "02-1-experimental-design";
const CENTER = "03-1-measures-of-central-tendency";
const SPREAD = "03-2-measures-of-dispersion";
const POSITION = "03-3-measures-of-position";
const SUMMARY = "03-4-summary-statistics";
const BARS = "04-1-bar-charts-and-pie-charts";
const HIST = "04-2-histograms";
const BOX = "04-3-boxplots-and-stem-leaf";
const SCATTER = "04-4-scatterplots";
const PROB = "05-1-probability-rules";
const COND = "05-2-conditional-probability";
const COUNT = "05-3-counting-techniques";
const NORMAL = "05-4-normal-distribution";
const BINOM = "05-5-binomial-distribution";
const SAMPDIST = "06-1-sampling-distributions";
const CLT = "06-2-clt-approximations";
const POINT = "07-1-point-estimates";
const CI = "07-2-confidence-intervals";
const ZTEST = "08-1-z-tests";
const PROP = "08-2-tests-for-a-proportion";
const TWOPROP = "08-3-difference-of-two-proportions";
const CHISQ = "08-4-chi-square-tests";
const TTEST = "08-5-t-tests";
const ANOVA = "09-1-one-way-anova";
const POSTHOC = "09-2-interpreting-anova";
const NONPAR = "09-3-nonparametric-alternatives";
const CORR = "10-1-pearson-spearman";
const INTERP = "10-2-interpreting-correlation";
const LSQ = "11-1-least-squares";
const R2 = "11-2-coefficient-of-determination";
const DIAG = "11-3-assumptions-diagnostics";

export const VOCABULARY: VocabEntry[] = [
  // Unit 1
  { term: "Population", definition: "The entire group we want to learn about, such as all students at a college.", lesson: SAMPLING, at: "section-1-1-populations-and-samples" },
  { term: "Sample", definition: "The smaller part of the population that we actually observe and collect data from.", lesson: SAMPLING, at: "section-1-1-populations-and-samples" },
  { term: "Biased sample", definition: "A sample that favors some part of the population over others, so it doesn't represent the whole population.", lesson: SAMPLING, at: "section-1-2-biased-sampling" },
  { term: "Convenience sample", definition: "A sample of whoever is easiest to reach, like friends or the first people through a door. Usually biased.", lesson: SAMPLING, at: "section-1-2-biased-sampling" },
  { term: "Voluntary response sample", definition: "A sample made up of people who choose to respond, such as an online review. It tends to over-represent strong opinions.", lesson: SAMPLING, at: "section-1-2-biased-sampling" },
  { term: "Simple random sample (SRS)", definition: "A sample in which every member, and every group of members, of the population has the same chance of being chosen, like drawing names from a hat.", lesson: SAMPLING, at: "section-1-3-unbiased-sampling" },
  { term: "Systematic sample", definition: "A sample chosen by a fixed rule, such as every 10th person on a list, starting from a random point.", lesson: SAMPLING, at: "section-1-3-unbiased-sampling" },
  { term: "Stratified sample", definition: "A sample made by dividing the population into groups that share a characteristic (strata) and randomly sampling from every group.", lesson: SAMPLING, at: "section-1-3-unbiased-sampling" },
  { term: "Strata (singular: stratum)", definition: "The groups a population is divided into for stratified sampling, such as class years.", lesson: SAMPLING, at: "section-1-3-unbiased-sampling" },
  { term: "Cluster sample", definition: "A sample made by randomly choosing whole groups (clusters), such as entire schools, and including everyone in them.", lesson: SAMPLING, at: "section-1-3-unbiased-sampling" },
  { term: "Experimental study", definition: "A study in which researchers deliberately assign a treatment and measure the response. Well-designed experiments can show cause and effect.", lesson: DESIGN, at: "section-1-4-observational-vs-experimental-studies" },
  { term: "Observational study", definition: "A study in which researchers only observe and record, without assigning treatments. It can show association but not cause and effect.", lesson: DESIGN, at: "section-1-4-observational-vs-experimental-studies" },
  { term: "Randomization", definition: "Assigning subjects to treatment groups by chance, which balances hidden differences between the groups.", lesson: DESIGN, at: "section-1-5-randomization-control-and-blinding" },
  { term: "Control", definition: "Keeping other variables the same for all groups, so any difference can be traced to the treatment.", lesson: DESIGN, at: "section-1-5-randomization-control-and-blinding" },
  { term: "Control group", definition: "The group that doesn't receive the treatment (or gets a placebo), giving a baseline for comparison.", lesson: DESIGN, at: "section-1-5-randomization-control-and-blinding" },
  { term: "Blinding", definition: "Keeping people from knowing which treatment a participant received, so expectations can't affect the results.", lesson: DESIGN, at: "section-1-5-randomization-control-and-blinding" },
  { term: "Single-blind study", definition: "A study in which the participants don't know which treatment they received.", lesson: DESIGN, at: "section-1-5-randomization-control-and-blinding" },
  { term: "Double-blind study", definition: "A study in which neither the participants nor the researchers know who received which treatment.", lesson: DESIGN, at: "section-1-5-randomization-control-and-blinding" },
  { term: "Confounding variable", definition: "An outside variable that affects the results and makes it hard to tell what caused an effect. Also called a lurking variable.", lesson: DESIGN, at: "section-1-5-randomization-control-and-blinding" },

  // Unit 2
  { term: "Mean", definition: "The average: the sum of the observations divided by how many there are. Sensitive to outliers.", lesson: CENTER, at: "the-mean" },
  { term: "Median", definition: "The middle value of the ordered data (the average of the two middle values when $n$ is even). Robust to outliers.", lesson: CENTER, at: "the-median" },
  { term: "Mode", definition: "The most frequent value. The only measure of center that works for categorical data.", lesson: CENTER, at: "the-mode" },
  { term: "Robust", definition: "Not strongly affected by outliers or skew. The median and IQR are robust; the mean and standard deviation are not.", lesson: CENTER, at: "comparing-the-mean-and-median" },
  { term: "Range", definition: "Maximum minus minimum: the total width of the data.", lesson: SPREAD, at: "range" },
  { term: "Variance", definition: "The average squared distance of the observations from the mean ($s^2$ for a sample, $\\sigma^2$ for a population).", lesson: SPREAD, at: "variance-and-standard-deviation" },
  { term: "Standard deviation", definition: "The square root of the variance: the typical distance of the observations from the mean, in the data's own units.", lesson: SPREAD, at: "variance-and-standard-deviation" },
  { term: "Interquartile range (IQR)", definition: "$Q_3 - Q_1$: the spread of the middle 50% of the data. Robust to outliers.", lesson: SPREAD, at: "interquartile-range-iqr" },
  { term: "Percentile", definition: "The percentage of observations at or below a value. Scoring at the 80th percentile means scoring at or above about 80% of the data.", lesson: POSITION, at: "percentiles-and-quartiles" },
  { term: "Quartiles", definition: "The three values that split ordered data into four equal parts: $Q_1$ (25th percentile), $Q_2$ (the median), and $Q_3$ (75th percentile).", lesson: POSITION, at: "percentiles-and-quartiles" },
  { term: "z-score", definition: "How many standard deviations a value is above (positive) or below (negative) the mean.", lesson: POSITION, at: "z-scores" },
  { term: "Outlier", definition: "A value that is unusually far from the rest of the data.", lesson: POSITION, at: "outlier-detection-using-the-iqr-rule" },
  { term: "IQR rule", definition: "Flags a value as a potential outlier if it's below $Q_1 - 1.5 \\times \\text{IQR}$ (the lower fence) or above $Q_3 + 1.5 \\times \\text{IQR}$ (the upper fence).", lesson: POSITION, at: "outlier-detection-using-the-iqr-rule" },
  { term: "Five-number summary", definition: "Minimum, $Q_1$, median, $Q_3$, and maximum.", lesson: SUMMARY, at: "the-five-number-summary" },
  { term: "Symmetric distribution", definition: "A distribution whose left and right sides are roughly mirror images. The mean and median are close together.", lesson: SUMMARY, at: "combining-center-and-spread" },
  { term: "Skewed distribution", definition: "A distribution with a long tail on one side. The mean is pulled toward the tail.", lesson: SUMMARY, at: "combining-center-and-spread" },
  { term: "Categorical (qualitative) data", definition: "Data that place observations into groups, like favorite sport or major.", lesson: BARS, at: "section-2-5-bar-charts-and-pie-charts" },
  { term: "Numerical (quantitative) data", definition: "Data that are measured numbers, like height or test score.", lesson: HIST, at: "section-2-6-histograms" },
  { term: "Bar chart", definition: "A graph of categorical data with a separate bar for each category; bar height shows the count or proportion.", lesson: BARS, at: "bar-charts" },
  { term: "Relative frequency", definition: "A category's count divided by the total: the proportion of observations in that category.", lesson: BARS, at: "bar-charts" },
  { term: "Pareto chart", definition: "A bar chart with the bars sorted from tallest to shortest.", lesson: BARS, at: "bar-charts" },
  { term: "Pie chart", definition: "A circle divided into slices showing each category's share of the whole.", lesson: BARS, at: "pie-charts" },
  { term: "Histogram", definition: "A graph of numerical data that groups values into equal-width bins; the bars touch.", lesson: HIST, at: "what-is-a-histogram" },
  { term: "Bins", definition: "The equal-width intervals a histogram groups values into.", lesson: HIST, at: "what-is-a-histogram" },
  { term: "Skewed right", definition: "A distribution with a long tail stretching to the right (toward large values).", lesson: HIST, at: "describing-the-shape-of-a-distribution" },
  { term: "Skewed left", definition: "A distribution with a long tail stretching to the left (toward small values).", lesson: HIST, at: "describing-the-shape-of-a-distribution" },
  { term: "Unimodal / bimodal", definition: "Having one peak / two peaks. A bimodal shape often means two groups are mixed together.", lesson: HIST, at: "describing-the-shape-of-a-distribution" },
  { term: "Boxplot", definition: "A graph of the five-number summary: a box from $Q_1$ to $Q_3$, a line at the median, whiskers, and dots for outliers.", lesson: BOX, at: "boxplots" },
  { term: "Whiskers", definition: "The lines on a boxplot reaching out to the smallest and largest values that aren't outliers.", lesson: BOX, at: "boxplots" },
  { term: "Stem-and-leaf plot", definition: "A display that splits each value into a stem (leading digits) and a leaf (last digit), showing the shape while keeping every value.", lesson: BOX, at: "stem-and-leaf-plots" },
  { term: "Scatterplot", definition: "A graph of two numerical variables, with one point for each observation.", lesson: SCATTER, at: "what-is-a-scatterplot" },
  { term: "Explanatory variable", definition: "The variable that may explain or predict changes in another; it goes on the x-axis.", lesson: SCATTER, at: "what-is-a-scatterplot" },
  { term: "Response variable", definition: "The variable being explained or predicted; it goes on the y-axis.", lesson: SCATTER, at: "what-is-a-scatterplot" },
  { term: "Positive / negative association", definition: "When two variables tend to rise together (positive) or one tends to fall as the other rises (negative).", lesson: SCATTER, at: "what-is-a-scatterplot" },
  { term: "Influential point", definition: "A point that, if removed, would noticeably change a line fitted through the data.", lesson: SCATTER, at: "outliers-in-scatterplots" },

  // Unit 3
  { term: "Probability", definition: "A number from 0 (impossible) to 1 (certain) measuring how likely an event is.", lesson: PROB, at: "basic-probability" },
  { term: "Sample space", definition: "The set of all possible outcomes of a random experiment.", lesson: PROB, at: "basic-probability" },
  { term: "Complement", definition: "Everything that is not in an event. $P(A^c) = 1 - P(A)$.", lesson: PROB, at: "complement-union-and-intersection" },
  { term: "Union", definition: "Outcomes in $A$, in $B$, or in both (\"A or B\").", lesson: PROB, at: "complement-union-and-intersection" },
  { term: "Intersection", definition: "Outcomes in both $A$ and $B$ (\"A and B\").", lesson: PROB, at: "complement-union-and-intersection" },
  { term: "Addition rule", definition: "$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.", lesson: PROB, at: "complement-union-and-intersection" },
  { term: "Mutually exclusive (disjoint)", definition: "Events that can't happen at the same time.", lesson: PROB, at: "complement-union-and-intersection" },
  { term: "Independent events", definition: "Events where one happening doesn't change the probability of the other. Then $P(A \\cap B) = P(A) \\times P(B)$.", lesson: PROB, at: "independent-events" },
  { term: "Conditional probability", definition: "The probability of one event given that another has happened, $P(A \\mid B)$.", lesson: COND, at: "definition" },
  { term: "Bayes' Theorem", definition: "A formula for reversing a conditional probability: finding $P(B \\mid A)$ from $P(A \\mid B)$.", lesson: COND, at: "bayes-theorem" },
  { term: "Multiplication rule of counting", definition: "If one step can happen in $m$ ways and another in $n$ ways, together they can happen in $m \\times n$ ways.", lesson: COUNT, at: "the-multiplication-rule-of-counting" },
  { term: "Permutation", definition: "An arrangement where order matters, like choosing a president and a vice-president.", lesson: COUNT, at: "permutations" },
  { term: "Combination", definition: "A selection where order doesn't matter, like choosing a committee.", lesson: COUNT, at: "combinations" },
  { term: "Normal distribution", definition: "A symmetric, bell-shaped distribution described completely by its mean $\\mu$ and standard deviation $\\sigma$.", lesson: NORMAL, at: "the-normal-curve" },
  { term: "Empirical Rule (68-95-99.7 Rule)", definition: "In a normal distribution, about 68%, 95%, and 99.7% of values fall within 1, 2, and 3 standard deviations of the mean.", lesson: NORMAL, at: "the-empirical-rule" },
  { term: "Standard normal distribution", definition: "The normal distribution with mean 0 and standard deviation 1, $N(0, 1)$.", lesson: NORMAL, at: "the-standard-normal-distribution" },
  { term: "Normal probability plot (Q-Q plot)", definition: "A plot that checks normality: if the data are normal, the points fall close to a straight line.", lesson: NORMAL, at: "is-the-normal-model-appropriate" },
  { term: "Bernoulli trial", definition: "A random experiment with exactly two outcomes, called success and failure.", lesson: BINOM, at: "bernoulli-trials" },
  { term: "Binomial distribution", definition: "The distribution of the number of successes in $n$ independent trials, each with the same probability of success $p$.", lesson: BINOM, at: "the-binomial-setting" },
  { term: "Expected value", definition: "The long-run average value of a random variable. For a binomial, $np$.", lesson: BINOM, at: "mean-and-standard-deviation-of-a-binomial" },
  { term: "Success-failure condition", definition: "At least 10 expected successes and 10 expected failures. Needed to use the normal approximation for proportions.", lesson: BINOM, at: "the-normal-approximation-to-the-binomial" },
  { term: "Parameter", definition: "A number that describes a population. It's fixed but usually unknown.", lesson: SAMPDIST, at: "parameters-vs-statistics" },
  { term: "Statistic", definition: "A number calculated from a sample. It changes from sample to sample.", lesson: SAMPDIST, at: "parameters-vs-statistics" },
  { term: "Sampling distribution", definition: "The distribution of a statistic (like $\\bar{x}$) across all possible samples of the same size.", lesson: SAMPDIST, at: "the-sampling-distribution-of-the-mean" },
  { term: "Standard error", definition: "The standard deviation of a sampling distribution. For the sample mean, $\\sigma / \\sqrt{n}$.", lesson: SAMPDIST, at: "the-sampling-distribution-of-the-mean" },
  { term: "Unbiased estimator", definition: "A statistic whose average across all possible samples equals the parameter it estimates.", lesson: SAMPDIST, at: "the-sampling-distribution-of-the-mean" },
  { term: "Central Limit Theorem (CLT)", definition: "For large enough samples, the sampling distribution of $\\bar{x}$ is approximately normal, whatever the population's shape.", lesson: CLT, at: "the-central-limit-theorem" },

  // Unit 4
  { term: "Statistical inference", definition: "Using a sample to draw conclusions about a population.", lesson: POINT, at: "section-4-1-point-estimates" },
  { term: "Point estimate", definition: "A single number from a sample used as the best guess for a parameter, like $\\bar{x}$ for $\\mu$.", lesson: POINT, at: "what-is-a-point-estimate" },
  { term: "Efficiency", definition: "Among unbiased estimators, the one with the smallest variance is the most efficient.", lesson: POINT, at: "properties-of-good-estimators", advanced: true },
  { term: "Confidence interval", definition: "A range of plausible values for a parameter: point estimate ± margin of error.", lesson: CI, at: "what-is-a-confidence-interval" },
  { term: "Margin of error", definition: "How far an estimate might reasonably be from the true parameter; half the width of a confidence interval.", lesson: CI, at: "what-is-a-confidence-interval" },
  { term: "Confidence level", definition: "The long-run percentage of intervals, built the same way, that would capture the true parameter (e.g. 95%).", lesson: CI, at: "what-is-a-confidence-interval" },
  { term: "Critical value", definition: "The number of standard errors used in a margin of error, like $z^* = 1.96$ for 95% confidence.", lesson: CI, at: "confidence-interval-for-a-population-mean-known-sigma" },
  { term: "t-distribution", definition: "A symmetric, bell-shaped distribution with heavier tails than the normal, used when $\\sigma$ is estimated by $s$.", lesson: CI, at: "confidence-interval-for-a-population-mean-unknown-sigma" },
  { term: "Hypothesis test", definition: "A method for using data to decide whether there's enough evidence against a claim (the null hypothesis).", lesson: ZTEST, at: "the-hypothesis-testing-framework" },
  { term: "Null hypothesis", definition: "The default claim, usually \"no effect\" or \"no difference.\" We assume it's true unless the data give strong evidence against it.", lesson: ZTEST, at: "the-hypothesis-testing-framework" },
  { term: "Alternative hypothesis", definition: "The claim we're looking for evidence for.", lesson: ZTEST, at: "the-hypothesis-testing-framework" },
  { term: "Test statistic", definition: "A number measuring how far the data are from what the null hypothesis predicts, like a z or t value.", lesson: ZTEST, at: "the-hypothesis-testing-framework" },
  { term: "p-value", definition: "The probability of getting a result at least as extreme as the one observed, if the null hypothesis is true. Small p-values are evidence against $H_0$.", lesson: ZTEST, at: "the-p-value" },
  { term: "Significance level", definition: "The cutoff $\\alpha$ (often 0.05) for deciding whether to reject $H_0$.", lesson: ZTEST, at: "the-p-value" },
  { term: "Type I error", definition: "Rejecting $H_0$ when it's actually true (a false positive). Its probability is $\\alpha$.", lesson: ZTEST, at: "type-i-and-type-ii-errors" },
  { term: "Type II error", definition: "Failing to reject $H_0$ when it's actually false (a false negative). Its probability is $\\beta$.", lesson: ZTEST, at: "type-i-and-type-ii-errors" },
  { term: "Power", definition: "The probability of correctly rejecting a false null hypothesis, $1 - \\beta$.", lesson: ZTEST, at: "type-i-and-type-ii-errors" },
  { term: "One-tailed / two-tailed test", definition: "A test that looks for a difference in one direction ($<$ or $>$) versus either direction ($\\neq$).", lesson: PROP, at: "the-one-proportion-z-test" },
  { term: "Statistical significance", definition: "A result unlikely to be due to chance alone (p-value below $\\alpha$).", lesson: PROP, at: "statistical-vs-practical-significance" },
  { term: "Practical significance", definition: "A result large enough to matter in the real world. Very large samples can be statistically significant without being practically significant.", lesson: PROP, at: "statistical-vs-practical-significance" },
  { term: "A/B test", definition: "A randomized experiment comparing two versions (A and B) of something, like a web page.", lesson: TWOPROP, at: "a-b-testing" },
  { term: "Pooled proportion", definition: "The combined proportion of successes from both groups, used when testing whether two proportions are equal.", lesson: TWOPROP, at: "hypothesis-test-for-p-1-p-2" },
  { term: "Chi-square test", definition: "A test for categorical data that compares observed counts to the counts expected under the null hypothesis.", lesson: CHISQ, at: "the-chi-square-distribution" },
  { term: "Degrees of freedom", definition: "A number that sets the exact shape of a t, chi-square, or F distribution, based on the sample size or number of categories.", lesson: CHISQ, at: "the-chi-square-distribution" },
  { term: "Goodness-of-fit test", definition: "A chi-square test of whether one categorical variable follows a claimed distribution.", lesson: CHISQ, at: "chi-square-test-for-goodness-of-fit" },
  { term: "Test for independence", definition: "A chi-square test of whether two categorical variables are related.", lesson: CHISQ, at: "chi-square-test-for-independence" },
  { term: "Contingency table", definition: "A two-way table of counts for two categorical variables.", lesson: CHISQ, at: "chi-square-test-for-independence" },
  { term: "One-sample t-test", definition: "A test comparing one sample's mean to a claimed value when $\\sigma$ is unknown.", lesson: TTEST, at: "one-sample-t-test" },
  { term: "Two-sample t-test", definition: "A test comparing the means of two independent groups.", lesson: TTEST, at: "two-sample-t-test" },
  { term: "Paired t-test", definition: "A test for matched data, like before-and-after measurements, done on the differences within each pair.", lesson: TTEST, at: "paired-t-test" },
  { term: "One-way ANOVA", definition: "A test of whether three or more group means are all equal.", lesson: ANOVA, at: "the-anova-idea" },
  { term: "F-statistic", definition: "In ANOVA, between-group variability divided by within-group variability. Large values suggest the means differ.", lesson: ANOVA, at: "the-f-statistic" },
  { term: "Post-hoc test", definition: "A follow-up test after a significant ANOVA that finds which groups differ, while controlling the overall error rate.", lesson: POSTHOC, at: "the-problem-of-multiple-comparisons" },
  { term: "Tukey's HSD", definition: "The most common post-hoc test; it compares every pair of group means.", lesson: POSTHOC, at: "the-problem-of-multiple-comparisons" },
  { term: "Bonferroni correction", definition: "Dividing $\\alpha$ by the number of comparisons so that running many tests doesn't inflate false positives.", lesson: POSTHOC, at: "the-problem-of-multiple-comparisons" },
  { term: "Effect size (eta-squared)", definition: "In ANOVA, the share of the total variation explained by the groups, $\\eta^2 = \\text{SSB}/\\text{SST}$.", lesson: POSTHOC, at: "reading-the-anova-output", advanced: true },
  { term: "Nonparametric test", definition: "A test that makes few assumptions about the population's shape, usually by working with ranks.", lesson: NONPAR, at: "the-idea-behind-nonparametric-tests" },
  { term: "Sign test", definition: "A nonparametric test about a median that only uses whether each value is above or below the claimed median.", lesson: NONPAR, at: "the-sign-test" },
  { term: "Wilcoxon signed-rank test", definition: "The nonparametric alternative to the paired t-test.", lesson: NONPAR, at: "the-wilcoxon-signed-rank-test" },
  { term: "Mann-Whitney U test", definition: "The nonparametric alternative to the two-sample t-test. Also called the Wilcoxon rank-sum test.", lesson: NONPAR, at: "the-mann-whitney-u-test" },
  { term: "Kruskal-Wallis test", definition: "The nonparametric alternative to one-way ANOVA.", lesson: NONPAR, at: "the-kruskal-wallis-test" },

  // Unit 5
  { term: "Correlation coefficient", definition: "A number from $-1$ to $1$ describing the direction and strength of a relationship between two variables.", lesson: CORR, at: "section-5-1-pearson-and-spearman-correlation" },
  { term: "Pearson's correlation", definition: "$r$: measures the strength and direction of a linear relationship.", lesson: CORR, at: "pearson-s-correlation-coefficient" },
  { term: "Spearman's rank correlation", definition: "$r_s$: Pearson's correlation computed on ranks. Measures monotonic relationships and resists outliers.", lesson: CORR, at: "spearman-s-rank-correlation" },
  { term: "Lurking variable", definition: "A variable not included in the study that affects both variables being compared, creating a misleading association.", lesson: INTERP, at: "correlation-does-not-imply-causation" },
  { term: "Simple linear regression", definition: "Modeling the relationship between one explanatory and one response variable with a straight line.", lesson: LSQ, at: "the-simple-linear-regression-model" },
  { term: "Slope", definition: "The predicted change in $y$ for a one-unit increase in $x$.", lesson: LSQ, at: "the-simple-linear-regression-model" },
  { term: "y-intercept", definition: "The predicted value of $y$ when $x = 0$.", lesson: LSQ, at: "the-simple-linear-regression-model" },
  { term: "Residual", definition: "Observed value minus predicted value, $y - \\hat{y}$. Positive residuals lie above the line.", lesson: LSQ, at: "finding-the-least-squares-line" },
  { term: "Least squares line", definition: "The line that makes the sum of the squared residuals as small as possible.", lesson: LSQ, at: "finding-the-least-squares-line" },
  { term: "Extrapolation", definition: "Predicting far outside the range of the observed $x$ values. Unreliable.", lesson: LSQ, at: "extrapolation" },
  { term: "Coefficient of determination", definition: "$R^2$: the proportion of the variation in $y$ explained by the regression line.", lesson: R2, at: "what-is-r-2" },
  { term: "LINE assumptions", definition: "The conditions for regression: Linearity, Independence, Normality of residuals, and Equal variance.", lesson: DIAG, at: "the-assumptions-of-simple-linear-regression" },
  { term: "Heteroscedasticity", definition: "When the spread of the residuals changes across $x$ (often a \"megaphone\" shape), violating equal variance.", lesson: DIAG, at: "the-assumptions-of-simple-linear-regression" },
  { term: "Residual plot", definition: "A plot of residuals against fitted values, used to check linearity and equal variance.", lesson: DIAG, at: "checking-assumptions-with-residual-plots" },
  { term: "Leverage", definition: "How unusual a point's $x$-value is. High-leverage points can pull the regression line toward them.", lesson: DIAG, at: "influential-points-and-leverage", advanced: true },
];

export const SYMBOLS: SymbolEntry[] = [
  { tex: "n", say: "n", meaning: "The sample size: how many observations there are.", lesson: CENTER, at: "the-mean" },
  { tex: "\\bar{x}", say: "x-bar", meaning: "The sample mean.", lesson: CENTER, at: "the-mean" },
  { tex: "x_i", say: "x sub i", meaning: "The $i$-th observation in a dataset.", lesson: CENTER, at: "the-mean" },
  { tex: "\\sum", say: "sigma (the sum of)", meaning: "Add up everything that follows.", lesson: CENTER, at: "the-mean" },
  { tex: "s", say: "s", meaning: "The sample standard deviation.", lesson: SPREAD, at: "variance-and-standard-deviation" },
  { tex: "s^2", say: "s squared", meaning: "The sample variance.", lesson: SPREAD, at: "variance-and-standard-deviation" },
  { tex: "\\mu", say: "mu (myoo)", meaning: "The population mean.", lesson: SPREAD, at: "variance-and-standard-deviation" },
  { tex: "\\sigma", say: "sigma", meaning: "The population standard deviation.", lesson: SPREAD, at: "variance-and-standard-deviation" },
  { tex: "\\sigma^2", say: "sigma squared", meaning: "The population variance.", lesson: SPREAD, at: "variance-and-standard-deviation" },
  { tex: "Q_1,\\ Q_2,\\ Q_3", say: "Q-one, Q-two, Q-three", meaning: "The first quartile, median, and third quartile.", lesson: POSITION, at: "percentiles-and-quartiles" },
  { tex: "z", say: "z", meaning: "A z-score: how many standard deviations a value is from the mean.", lesson: POSITION, at: "z-scores" },
  { tex: "P(A)", say: "P of A", meaning: "The probability that event $A$ happens.", lesson: PROB, at: "basic-probability" },
  { tex: "S", say: "S", meaning: "The sample space: all possible outcomes.", lesson: PROB, at: "basic-probability" },
  { tex: "A^c", say: "A complement", meaning: "Event $A$ does not happen. Also written $\\bar{A}$.", lesson: PROB, at: "complement-union-and-intersection" },
  { tex: "A \\cup B", say: "A union B", meaning: "$A$ or $B$ (or both) happens.", lesson: PROB, at: "complement-union-and-intersection" },
  { tex: "A \\cap B", say: "A intersect B", meaning: "Both $A$ and $B$ happen.", lesson: PROB, at: "complement-union-and-intersection" },
  { tex: "P(A \\mid B)", say: "P of A given B", meaning: "The probability of $A$, given that $B$ happened.", lesson: COND, at: "definition" },
  { tex: "n!", say: "n factorial", meaning: "$n \\times (n-1) \\times \\cdots \\times 1$. By convention, $0! = 1$.", lesson: COUNT, at: "permutations" },
  { tex: "P(n, r)", say: "P of n, r", meaning: "The number of permutations (ordered arrangements) of $r$ items from $n$.", lesson: COUNT, at: "permutations" },
  { tex: "\\binom{n}{r}", say: "n choose r", meaning: "The number of combinations (unordered selections) of $r$ items from $n$. Also written $C(n, r)$.", lesson: COUNT, at: "combinations" },
  { tex: "N(\\mu, \\sigma)", say: "normal with mean mu and standard deviation sigma", meaning: "A normal distribution.", lesson: NORMAL, at: "the-normal-curve" },
  { tex: "\\sim", say: "follows (is distributed as)", meaning: "Says which distribution a variable follows, as in $X \\sim N(0, 1)$.", lesson: NORMAL, at: "the-normal-curve" },
  { tex: "Z", say: "Z", meaning: "A variable with the standard normal distribution, $N(0, 1)$.", lesson: NORMAL, at: "the-standard-normal-distribution" },
  { tex: "p", say: "p", meaning: "A probability of success, or a population proportion.", lesson: BINOM, at: "bernoulli-trials" },
  { tex: "\\text{Binomial}(n, p)", say: "binomial with n trials and success probability p", meaning: "A binomial distribution.", lesson: BINOM, at: "the-binomial-setting" },
  { tex: "\\mu_{\\bar{x}}", say: "mu sub x-bar", meaning: "The mean of the sampling distribution of $\\bar{x}$. It equals $\\mu$.", lesson: SAMPDIST, at: "the-sampling-distribution-of-the-mean" },
  { tex: "\\sigma_{\\bar{x}}", say: "sigma sub x-bar", meaning: "The standard error of $\\bar{x}$, equal to $\\sigma / \\sqrt{n}$.", lesson: SAMPDIST, at: "the-sampling-distribution-of-the-mean" },
  { tex: "\\hat{p}", say: "p-hat", meaning: "The sample proportion.", lesson: POINT, at: "what-is-a-point-estimate" },
  { tex: "\\pm", say: "plus or minus", meaning: "Used to write an interval, as in point estimate ± margin of error.", lesson: CI, at: "what-is-a-confidence-interval" },
  { tex: "z^*", say: "z-star", meaning: "The critical value from the standard normal distribution.", lesson: CI, at: "confidence-interval-for-a-population-mean-known-sigma" },
  { tex: "t^*", say: "t-star", meaning: "The critical value from a t-distribution.", lesson: CI, at: "confidence-interval-for-a-population-mean-unknown-sigma" },
  { tex: "H_0", say: "H-naught", meaning: "The null hypothesis.", lesson: ZTEST, at: "the-hypothesis-testing-framework" },
  { tex: "H_a", say: "H-A", meaning: "The alternative hypothesis. Also written $H_1$.", lesson: ZTEST, at: "the-hypothesis-testing-framework" },
  { tex: "\\mu_0", say: "mu-naught", meaning: "The value of the mean claimed by $H_0$.", lesson: ZTEST, at: "the-z-test-for-a-mean" },
  { tex: "\\alpha", say: "alpha", meaning: "The significance level; also the probability of a Type I error.", lesson: ZTEST, at: "the-p-value" },
  { tex: "\\beta", say: "beta (BAY-tuh)", meaning: "The probability of a Type II error. Power is $1 - \\beta$.", lesson: ZTEST, at: "type-i-and-type-ii-errors" },
  { tex: "p_0", say: "p-naught", meaning: "The value of the proportion claimed by $H_0$.", lesson: PROP, at: "setting-up-the-test" },
  { tex: "p_1 - p_2", say: "p-one minus p-two", meaning: "The difference between two population proportions.", lesson: TWOPROP, at: "section-4-5-difference-of-two-proportions" },
  { tex: "\\hat{p}_{pool}", say: "p-hat pool", meaning: "The pooled proportion of both groups combined.", lesson: TWOPROP, at: "hypothesis-test-for-p-1-p-2" },
  { tex: "\\chi^2", say: "chi-square (ky-square)", meaning: "The chi-square test statistic or distribution.", lesson: CHISQ, at: "section-4-6-chi-square-tests" },
  { tex: "O,\\ E", say: "O, E", meaning: "Observed and expected counts in a chi-square test.", lesson: CHISQ, at: "chi-square-test-for-goodness-of-fit" },
  { tex: "df", say: "d-f (degrees of freedom)", meaning: "The degrees of freedom of a t, chi-square, or F distribution.", lesson: CHISQ, at: "the-chi-square-distribution" },
  { tex: "t", say: "t", meaning: "A t test statistic.", lesson: TTEST, at: "one-sample-t-test" },
  { tex: "\\mu_d", say: "mu sub d", meaning: "The mean of the paired differences.", lesson: TTEST, at: "paired-t-test" },
  { tex: "F", say: "F", meaning: "The ANOVA F-statistic, MSB / MSW.", lesson: ANOVA, at: "the-f-statistic" },
  { tex: "k,\\ N", say: "k, N", meaning: "In ANOVA, the number of groups and the total number of observations.", lesson: ANOVA, at: "the-f-statistic" },
  { tex: "M_0", say: "M-naught", meaning: "The median claimed by $H_0$ in a sign test.", lesson: NONPAR, at: "the-sign-test" },
  { tex: "W^+,\\ W^-", say: "W-plus, W-minus", meaning: "The sums of the positive and negative ranks in a Wilcoxon signed-rank test.", lesson: NONPAR, at: "the-wilcoxon-signed-rank-test" },
  { tex: "r", say: "r", meaning: "Pearson's correlation coefficient.", lesson: CORR, at: "pearson-s-correlation-coefficient" },
  { tex: "r_s", say: "r sub s", meaning: "Spearman's rank correlation coefficient.", lesson: CORR, at: "spearman-s-rank-correlation" },
  { tex: "\\rho", say: "rho (row)", meaning: "The population correlation.", lesson: INTERP, at: "testing-whether-a-correlation-is-significant", advanced: true },
  { tex: "\\hat{y}", say: "y-hat", meaning: "The predicted value of $y$ from a regression line.", lesson: LSQ, at: "the-simple-linear-regression-model" },
  { tex: "b_0", say: "b-naught", meaning: "The y-intercept of the regression line.", lesson: LSQ, at: "the-simple-linear-regression-model" },
  { tex: "b_1", say: "b-one", meaning: "The slope of the regression line.", lesson: LSQ, at: "the-simple-linear-regression-model" },
  { tex: "e_i", say: "e sub i", meaning: "The residual for observation $i$, $y_i - \\hat{y}_i$.", lesson: LSQ, at: "finding-the-least-squares-line" },
  { tex: "R^2", say: "R-squared", meaning: "The coefficient of determination.", lesson: R2, at: "what-is-r-2" },
  { tex: "\\eta^2", say: "eta-squared (AY-tuh squared)", meaning: "The ANOVA effect size, SSB / SST.", lesson: POSTHOC, at: "reading-the-anova-output", advanced: true },
];
