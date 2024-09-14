import express from 'express';
import authRouter from './authRoute';
import profileRouter from './profileRoute';


const mainRouter = express.Router();

// Mount the routers on their respective paths
mainRouter.use('/auth', authRouter);
mainRouter.use('/profile',profileRouter)

export default mainRouter;
