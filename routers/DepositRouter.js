import Router from "express";
import DepositController from "../controllers/DepositController.js";

const depositRouter = new Router();

depositRouter.post("/open-deposit", DepositController.openDeposit);
depositRouter.post("/get-deposits", DepositController.getDeposits);

export default depositRouter;
