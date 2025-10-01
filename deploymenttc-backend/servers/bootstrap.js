import rateLimit from "express-rate-limit";
import rTracer from "cls-rtracer";

export function bootstrap(app) {
  // Correlate every request
  app.use(rTracer.expressMiddleware());
  app.use((req, _res, next) => {
    req.requestId = rTracer.id(); // use req.requestId in logs/metrics
    next();
  });

  // Basic rate limit (tune later)
  const limiter = rateLimit({
    windowMs: 60_000,
    max: 600, // 600 req/min/IP
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}
