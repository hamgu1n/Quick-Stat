// Metadata for the "try a sample dataset" option on the empty Analyzer
// screen. The actual CSV files live in public/sample-data/ so they're
// fetchable at runtime (same reason the base URL is /Quick-Stat/ in
// production) rather than bundled through import.meta.glob.

export type SampleDataset = {
  id: string;
  name: string;
  file: string;
  description: string;
};

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "exam-scores",
    name: "Exam Scores",
    file: "exam-scores.csv",
    description: "Score by teaching Method (Lecture vs. Flipped) - try a two-sample t-test.",
  },
  {
    id: "plant-growth",
    name: "Plant Growth",
    file: "plant-growth.csv",
    description: "Height by Fertilizer (3 groups) - try a one-way ANOVA.",
  },
  {
    id: "study-hours-gpa",
    name: "Study Hours & GPA",
    file: "study-hours-gpa.csv",
    description: "Two numeric columns - try correlation or simple linear regression.",
  },
  {
    id: "survey-satisfaction",
    name: "Survey Satisfaction",
    file: "survey-satisfaction.csv",
    description: "Department by Satisfaction (both categorical) - try a chi-square test of independence.",
  },
  {
    id: "commute-times",
    name: "Commute Times",
    file: "commute-times.csv",
    description: "A single numeric column - try a one-sample t-test.",
  },
  {
    id: "employee-performance",
    name: "Employee Performance",
    file: "employee-performance.csv",
    description: "56 rows, 4 departments, 2 numeric predictors + a 3-level Satisfaction column - try ANOVA, a grouped boxplot, and a regression together.",
  },
  {
    id: "clinical-trial",
    name: "Clinical Trial",
    file: "clinical-trial.csv",
    description: "Before/after blood pressure by treatment Group, with a few missing values (NA) mixed in - try a two-sample t-test and see the missing-value handling.",
  },
  {
    id: "housing-prices",
    name: "Housing Prices",
    file: "housing-prices.csv",
    description: "5 numeric columns plus Neighborhood - try correlation/regression on a few different variable pairs, or a grouped boxplot of Price by Neighborhood.",
  },
];
