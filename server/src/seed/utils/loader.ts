import { readFileSync } from "fs";

export const loadJsonFile = <T>(absolutePath: string): T => {
  try {
    const fileContent = readFileSync(absolutePath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Error loading JSON file at ${absolutePath}:`, error);
    throw error;
  }
};
