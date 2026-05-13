import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT) || 8080;

app.listen(port, "0.0.0.0", () => {
  logger.info(`Server listening on port ${port} (0.0.0.0)`);
});
