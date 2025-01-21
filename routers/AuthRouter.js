import Router from "express";
import AuthController from "../controllers/AuthController.js";

const authRouter = new Router();

authRouter.post("/register", AuthController.registerUser);

export default authRouter;
