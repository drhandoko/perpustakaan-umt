import { Router, type IRouter } from "express";
import healthRouter      from "./health.js";
import doabSearchRouter  from "./doabSearch.js";   // legacy /api/doab-search (keep for compat)
import booksSearchRouter from "./booksSearch.js";  // /api/books-search (aggregator)

const router: IRouter = Router();

router.use(healthRouter);

// Legacy single-source DOAB proxy (kept for backwards compatibility)
router.use(doabSearchRouter);

// Multi-source books aggregator: DOAB + OAPEN, deduplicated
router.use(booksSearchRouter);

export default router;
