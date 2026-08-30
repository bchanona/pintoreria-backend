import {Router} from 'express';
import {createUserController} from '../controllers/user.controller';

const authRouter = Router();

authRouter.post("/register", createUserController);

export default authRouter;