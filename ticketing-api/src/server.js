import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function startServer() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`Ticketing API listening on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start ticketing API", error);
  process.exit(1);
});
