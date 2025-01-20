import nodemailer from "nodemailer";
import express from "express";
import bodyParser from "body-parser";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import depositRouter from "./routers/DepositRouter.js";
import userRouter from "./routers/UserRouter.js";
import authRouter from "./routers/AuthRouter.js";
import cookieParser from "cookie-parser";
import transactionRouter from "./routers/TransactionRouter.js";

const app = express();
const PORT = 3010;
export const JWT_SECRET = "your_secret_key";

initializeApp();
export const db = getFirestore();
export const auth = getAuth();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.use("/deposits", depositRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/transaction", transactionRouter);

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
