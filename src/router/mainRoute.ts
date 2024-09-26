import express from 'express';
import authRouter from './authRoute';
import profileRouter from './profileRoute';
import newsRouter from './newsRoute';
import commentRouter from './commentRoute';
import categoryRouter from './categoryRouter';


const mainRouter = express.Router();

// Mount the routers on their respective paths
mainRouter.use('/auth', authRouter);
mainRouter.use('/profile',profileRouter);
mainRouter.use('/news',newsRouter);

mainRouter.use("/news",commentRouter)


mainRouter.use("/categories",categoryRouter)

export default mainRouter;
