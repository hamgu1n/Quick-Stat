import { create } from "zustand";
import { type Dataset } from "@/types/dataset";

type DatasetState = {
  dataset: Dataset | null;
  setDataset: (dataset: Dataset) => void;
};

export const useDatasetStore = create<DatasetState>((set) => ({
  dataset: null,
  setDataset: (dataset) => set({ dataset }),
}));
