import Router from "express";
import TransactionController from "../controllers/TransactionController.js";

const transactionRouter = new Router();

transactionRouter.post(
  "/add-transaction",
  TransactionController.addTransaction,
);

transactionRouter.post(
  "/confirm-transaction",
  TransactionController.confirmTransaction,
);

transactionRouter.post(
  "/decline-transaction",
  TransactionController.declineTransaction,
);

export default transactionRouter;
