import { Router, type IRouter } from "express";
import healthRouter    from "./health";
import doabSearchRouter from "./doabSearch";

const router: IRouter = Router();

router.use(healthRouter);

// DOAB book search proxy — avoids browser CORS restrictions on the DOAB API.
// Clients call GET /api/doab-search?q=QUERY&limit=N&offset=N
router.use(doabSearchRouter);

export default router;
