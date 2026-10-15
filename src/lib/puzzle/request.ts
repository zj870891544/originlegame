import { cache } from "react";
import { loadPuzzle, loadRecent, loadToday } from "./load";

/** Per-request copies, so a page and its metadata read the database once. */
export const getToday = cache(() => loadToday());
export const getPuzzleByNumber = cache((number: number) => loadPuzzle(number));
export const getRecent = cache((limit: number) => loadRecent(limit));
