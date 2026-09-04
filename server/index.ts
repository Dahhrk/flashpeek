import express from "express";

import { matchesRouter } from "./routes/matches.js";

const PORT = parseInt(process.env.PORT ?? "3100", 10);

const app = express();
app.use(express.json());
app.use(matchesRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`flashpeek-api listening on :${PORT}`);
});

export { app };
