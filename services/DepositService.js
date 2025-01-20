import { db } from "../index.js";
import { v4 as uuidv4 } from "uuid";
import { addDaysToDate, calculateDaysSinceDate, generateDepositData, PLANS_IN_DAY } from "../helpers.js";
import { FieldValue } from "firebase-admin/firestore";

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
    const deposits = [];
    const depositsDoc = await db.collection("users").doc(nickname).collection("deposits").get();

    depositsDoc.forEach((depositDoc) => {
      deposits.push(depositDoc.data());
    });

    return deposits;
  }

  async processEverydayDeposits(nickname) {
    const userDoc = await db.collection("users").doc(nickname);
    const depositsDoc = userDoc.collection("deposits").where("isActive", "==", true);

    try {
      await db.runTransaction(async (t) => {
        const docs = await t.get(depositsDoc);
        docs.forEach((doc) => {
          const depositData = doc.data();
          const { amount, plan, variant, lastAccrual, days, charges, wallet } = depositData;

          const daysWithoutCharges = Math.min(calculateDaysSinceDate(lastAccrual), days - charges);

          // console.log(daysWithoutCharges, "daysWithoutCharges");
          const updatedLastAccrualTime = addDaysToDate(lastAccrual, daysWithoutCharges);
          const inDay = PLANS_IN_DAY[plan][variant];
          const received = ((amount * inDay) / 100) * daysWithoutCharges;
          const isDepositActive = charges + daysWithoutCharges < days;

          t.update(doc.ref, {
            charges: FieldValue.increment(daysWithoutCharges),
            lastAccrual: updatedLastAccrualTime,
            isActive: isDepositActive,
            received: FieldValue.increment(received),
          });

          t.update(userDoc, {
            earned: FieldValue.increment(received),
            [`wallets.${wallet}.available`]: FieldValue.increment(received),
          });

          if (!isDepositActive) {
            t.update(userDoc, {
              [`wallets.${wallet}.available`]: FieldValue.increment(amount),
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
