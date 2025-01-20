import { db } from "../index.js";
import { v4 as uuidv4 } from "uuid";
import { FieldValue } from "firebase-admin/firestore";

class TransactionService {
  async addTransaction(data) {
    try {
      const { type, amount, executor, status, nickname } = data;
      const id = uuidv4();

      const transactionDoc = await db.collection("transactions").doc(id);
      await transactionDoc.set({
        id,
        type,
        amount,
        executor,
        status,
        nickname,
        date: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.log(e, "error");
    }
  }

  async confirmTransaction(id) {
    const transactionDoc = await db.collection("transactions").doc(id);

    await transactionDoc.update({
      status: "Выполнено",
    });
  }

  async declineTransaction(id) {
    const transactionDoc = await db.collection("transactions").doc(id);

    await transactionDoc.update({
      status: "Отмена",
    });
  }
}

export default new TransactionService();
