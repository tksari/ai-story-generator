import path from "path";

export function resolveGlobContext(pattern: string, baseDir?: string) {
  const isProd = process.env.NODE_ENV === "production";
  const ext = isProd ? "js" : "ts";

  const basePath = baseDir ? path.resolve(__dirname, "..", baseDir) : path.resolve(__dirname, "..");

  const finalPattern = `${pattern}.${ext}`;

  return { basePath, finalPattern };
}
