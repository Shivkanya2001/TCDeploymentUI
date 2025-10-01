import client from "prom-client";

client.collectDefaultMetrics(); // Node process metrics

export const httpLatency = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

export function metricsMiddleware(req, res, next) {
  const start = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const seconds = diff[0] + diff[1] / 1e9;
    const route = req.route?.path || req.path;
    httpLatency
      .labels(req.method, route, String(res.statusCode))
      .observe(seconds);
  });
  next();
}

export function mountMetrics(app) {
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  });
}
