import { db } from "../index.js";
import { v4 as uuidv4 } from "uuid";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

class DepositService {
  async addDeposit(data) {
    try {
      const {
        amount,
        wallet,
        variant,
        willReceived,
        plan,
        days,
        username,
        accruals,
      } = data;
      const id = uuidv4();
      const depositID = `${amount}-${id}`;
      const userDoc = await db.collection("users").doc(username);
      const depositDocRef = userDoc.collection("deposits").doc(depositID);

      const depositData = {
        amount,
        days: days,
        wallet,
        variant,
        openDate: FieldValue.serverTimestamp(),
        closeDate: Timestamp.fromMillis(
          Date.now() + days * 24 * 60 * 60 * 1000,
        ),
        received: 0,
        lastAccrual: FieldValue.serverTimestamp(),
        willReceived,
        charges: 0,
        isActive: true,
        plan,
        accruals,
      };

      await depositDocRef.set(depositData);

      return depositData;
    } catch (e) {
      console.log(e, "error");
    }
  }
}

export default new DepositService();
