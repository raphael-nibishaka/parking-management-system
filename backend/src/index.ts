import { createApp } from "./app.js";
import { config } from "./lib/config.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
  console.log(`Swagger UI: http://localhost:${config.port}/api/docs`);
});
