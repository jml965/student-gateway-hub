import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import chatRouter from "./chat";
import adminRouter from "./admin";
import universitiesRouter from "./universities";
import documentsRouter from "./documents";
import storageRouter from "./storage";
import universityPortalRouter from "./university-portal";
import applicationsRouter from "./applications";
import notificationsRouter from "./notifications";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/chat", chatRouter);
router.use("/admin", adminRouter);
router.use("/universities", universitiesRouter);
router.use("/documents", documentsRouter);
router.use(storageRouter);
router.use("/university-portal", universityPortalRouter);
router.use("/applications", applicationsRouter);
router.use("/notifications", notificationsRouter);
router.use("/payments", paymentsRouter);

export default router;
