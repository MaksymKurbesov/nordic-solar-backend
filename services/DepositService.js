import { db } from "../index.js";
import { v4 as uuidv4 } from "uuid";
import { addDaysToDate, calculateDaysSinceDate, generateDepositData, PLANS_IN_DAY } from "../helpers.js";
import { FieldValue } from "firebase-admin/firestore";
import TransactionService from "./TransactionService.js";

class DepositService {
  async addDeposit(data) {
    try {
      const { amount, username } = data;
      const id = uuidv4();
      const depositID = `${amount}-${id}`;
      const userDoc = await db.collection("users").doc(username);
      const depositDocRef = userDoc.collection("deposits").doc(depositID);

      const depositData = generateDepositData(data);

      await depositDocRef.set(depositData);

      return depositData;
    } catch (e) {
      console.log(e, "error");
    }
  }

  async getDeposits(nickname) {
    await this.processEverydayDeposits(nickname);
    await this.processOneTimeDeposits(nickname);
    const deposits = [];
    const depositsDoc = await db.collection("users").doc(nickname).collection("deposits").get();

    depositsDoc.forEach((depositDoc) => {
      deposits.push(depositDoc.data());
    });

    return deposits;
  }

  async processOneTimeDeposits(nickname) {
    const userDoc = await db.collection("users").doc(nickname);
    const oneTimeDeposits = userDoc
      .collection("deposits")
      .where("isActive", "==", true)
      .where("accruals", "==", "one_time");

    await db.runTransaction(async (t) => {
      const docs = await t.get(oneTimeDeposits);
      docs.forEach((doc) => {
        const depositData = doc.data();
        const { amount, plan, variant, lastAccrual, days, charges, wallet } = depositData;
        const inDay = PLANS_IN_DAY[plan][variant];

        const currentDate = new Date();
        const closeDate = depositData.closeDate.toDate();

        const isExpired = currentDate >= closeDate;

        if (isExpired) {
          TransactionService.addTransaction({
            type: "Начисления",
            amount: amount,
            executor: wallet,
            status: "Выполнено",
            nickname,
            date: depositData.closeDate,
          });

          const receivedInDay = (amount * inDay) / 100;
          const totalReceived = receivedInDay * days;

          t.update(doc.ref, {
            charges: FieldValue.increment(1),
            lastAccrual: depositData.closeDate,
            isActive: false,
            received: FieldValue.increment(totalReceived),
          });

          t.update(userDoc, {
            earned: FieldValue.increment(totalReceived),
            [`wallets.${wallet}.available`]: FieldValue.increment(totalReceived + amount),
          });
        }

        console.log(isExpired, "isExpired");
      });
    });
  }

  async processEverydayDeposits(nickname) {
    const userDoc = await db.collection("users").doc(nickname);
    const depositsDoc = userDoc.collection("deposits").where("isActive", "==", true);

    const everydayDeposits = userDoc
      .collection("deposits")
      .where("isActive", "==", true)
      .where("accruals", "!=", "one_time");

    try {
      await db.runTransaction(async (t) => {
        const docs = await t.get(everydayDeposits);
        docs.forEach((doc) => {
          const depositData = doc.data();
          const { amount, plan, variant, lastAccrual, days, charges, wallet, accruals } = depositData;

          // if (accruals === 'one_time' || )

          const daysWithoutCharges = Math.min(calculateDaysSinceDate(lastAccrual), days - charges);

          const updatedLastAccrualTime = addDaysToDate(lastAccrual, daysWithoutCharges);
          const inDay = PLANS_IN_DAY[plan][variant];
          const receivedInDay = (amount * inDay) / 100;
          const totalReceived = receivedInDay * daysWithoutCharges;
          const isDepositActive = charges + daysWithoutCharges < days;

          const transactionPromises = [];

          for (let i = 0; i < daysWithoutCharges; i++) {
            transactionPromises.push(
              TransactionService.addTransaction({
                type: "Начисления",
                amount: receivedInDay,
                executor: wallet,
                status: "Выполнено",
                nickname,
                date: addDaysToDate(lastAccrual, i),
              }),
            );
          }

          Promise.all(transactionPromises);

          t.update(doc.ref, {
            charges: FieldValue.increment(daysWithoutCharges),
            lastAccrual: updatedLastAccrualTime,
            isActive: isDepositActive,
            received: FieldValue.increment(totalReceived),
          });

          t.update(userDoc, {
            earned: FieldValue.increment(totalReceived),
            [`wallets.${wallet}.available`]: FieldValue.increment(totalReceived),
          });

          if (!isDepositActive) {
            t.update(userDoc, {
              [`wallets.${wallet}.available`]: FieldValue.increment(+amount),
            });
          }
        });
      });
    } catch (e) {
      console.log("Transaction failure:", e);
    }
  }
}

export default new DepositService();
