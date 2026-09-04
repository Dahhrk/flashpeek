import express from "express";

import { faceitRouter } from "./routes/faceit.js";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);
const app = express();

app.use("/api/faceit", faceitRouter);

app.listen(PORT, () => {
  console.log(`flashpeek server listening on http://localhost:${PORT}`);
});
