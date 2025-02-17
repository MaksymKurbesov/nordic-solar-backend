import Router from "express";
import UserController from "../controllers/UserController.js";

const userRouter = new Router();

userRouter.post("/get-user", UserController.getUser);
userRouter.post("/get-referrals", UserController.getReferrals);
userRouter.post("/ip", UserController.checkIP);
userRouter.post("/sendPrivateKey", UserController.sendPrivateKey);

export default userRouter;
