import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 3000;

if (Number.isNaN(port) || port <= 0) {
  logger.error({ rawPort }, "Invalid PORT value — must be a positive integer");
  process.exit(1);
}

if (!rawPort) {
  logger.warn(
    { port },
    "PORT environment variable not set — defaulting to port 3000. " +
      "Set PORT explicitly in production (e.g. PORT=3000 node ...).",
  );
}

app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, host: "0.0.0.0" }, "Server listening");
});
