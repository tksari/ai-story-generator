import { container } from "tsyringe";
import fg from "fast-glob";
import { resolveGlobContext } from "@/utils";

const registeredKeys = new Set<string>();

export async function registerAll(pattern: string) {
  const { finalPattern, basePath } = resolveGlobContext(pattern);

  const files = await fg(finalPattern, {
    cwd: basePath,
    absolute: true,
  });

  const settledImports = await Promise.allSettled(
    files.map(async (file) => {
      const module = await import(file);
      return { file, module };
    })
  );

  for (const result of settledImports) {
    if (result.status === "rejected") {
      console.error(`[DI ERROR] Failed to import module: ${result.reason}`);
      continue;
    }

    const { file, module } = result.value;

    for (const key in module) {
      const exported = module[key];

      if (typeof exported === "function" && exported.prototype) {
        const name = exported.name;
        const metadata = Reflect.getMetadata("tsyringe:token", exported);
        const token = metadata || name;

        if (registeredKeys.has(token)) {
          console.warn(
            `[DI WARNING] '${token}' is already registered! Skipping duplicate from: ${file}`
          );
          continue;
        }

        container.registerSingleton(token, exported);
        registeredKeys.add(token);
      }
    }
  }
}
