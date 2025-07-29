import { z } from "zod";

export const coerceStringArray = z.preprocess(
  (input) =>
    typeof input === "string" ? input.split(",").map((s) => s.trim()) : input,
  z.string().array()
);
