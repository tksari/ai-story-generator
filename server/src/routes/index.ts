import { Express } from "express";
import { resolveController, BaseController } from "@/core/common/base.controller";
import fg from "fast-glob";
import path from "path";
import { resolveGlobContext } from "@/utils";
const pattern = "**/*.controller";

export async function registerRoutes(app: Express) {
  try {
    const { finalPattern, basePath } = resolveGlobContext(pattern, "domain");

    const files = await fg(finalPattern, {
      cwd: basePath,
      absolute: true,
    });

    const controllerModules = await Promise.all(
      files.map(async (file) => {
        const module = await import(file);
        const ControllerClass = Object.values(module)[0] as new (
          ...args: unknown[]
        ) => BaseController;

        if (
          typeof ControllerClass === "function" &&
          ControllerClass.prototype instanceof BaseController
        ) {
          return {
            name: path.basename(file).replace(/\.controller\.(ts|js)$/, ""),
            module: ControllerClass,
          };
        }

        throw new Error(`Invalid controller class in ${file}`);
      })
    );

    for (const { module } of controllerModules) {
      const router = resolveController(module);
      app.use("/api", router);
    }

    app.get("/api", (req, res) => {
      res.status(200).json({
        message: "AI Story API",
        version: process.env.npm_package_version || "1.0.0",
        docs: "/api-docs",
      });
    });
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
}
