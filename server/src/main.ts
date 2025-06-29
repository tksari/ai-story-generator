import "reflect-metadata";
import { initializeContainer } from "./di-container";
import { App } from "./index";

async function bootstrap() {
  await initializeContainer();
  const app = new App();
  await app.initialize();
  app.start();
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
