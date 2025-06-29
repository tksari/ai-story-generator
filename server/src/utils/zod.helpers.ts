import { z } from "zod";

export const zodFromOptions = <T extends readonly { value: string | number }[]>(options: T) => {
  if (options.length === 0) {
    throw new Error("zodFromOptions requires at least one option");
  }
  return z.enum(options.map((opt) => String(opt.value)) as [string, ...string[]]);
};

export const zodFromOptionsNumberOrString = <T extends readonly { value: string | number }[]>(
  options: T
) => {
  const values = options.map((opt) => opt.value);

  return z.union([
    z.number().refine((v) => values.includes(v)),
    z.enum(values.map((v) => String(v)) as [string, ...string[]]),
  ]);
};
