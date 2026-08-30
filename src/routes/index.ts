import authRouter from "../modules/auth/routes"
import {Router} from 'express';

const router = Router();

router.use('/auth', authRouter);

export default router;