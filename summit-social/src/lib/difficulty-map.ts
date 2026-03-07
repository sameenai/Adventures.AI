import { DIFFICULTIES } from "./constants";

export const DIFFICULTY_MAP = new Map(DIFFICULTIES.map((d) => [d.value, d]));
