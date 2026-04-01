import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/integrations/alibaba/callback", (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  console.log("Alibaba callback received", {
    code,
    state: state || null,
    query: req.query
  });

  // Next step:
  // Exchange the authorization code for Alibaba access/refresh tokens here.

  res.status(200).type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Alibaba Callback</title>
  </head>
  <body>
    <h1>Alibaba authorization received</h1>
    <p>The callback request reached the service successfully.</p>
  </body>
</html>`);
});

app.listen(port, () => {
  console.log(`Alibaba callback service listening on port ${port}`);
});
