import { db } from "../index.js";
import { FieldValue } from "firebase-admin/firestore";
import { generateUserData, REFERRAL_REWARDS_BY_LEVEL } from "../helpers.js";
import TransactionService from "./TransactionService.js";

class UserService {
  async addUser(userData) {
    const { nickname, email, referredBy } = userData;
    console.log(userData, "userData");
    const generatedUserData = generateUserData(nickname, email, referredBy);
    await db.collection("users").doc(nickname).set(generatedUserData);
  }

  async getUser(nickname) {
    const userRef = db.collection("users").doc(nickname);
    const userDoc = await userRef.get();
    return userDoc.data();
  }

  async updateBalanceAfterOpenDeposit(nickname, wallet, amount) {
    try {
      const userRef = db.collection("users").doc(nickname);

      await userRef.update({
        [`wallets.${wallet}.available`]: FieldValue.increment(-amount),
        invested: FieldValue.increment(amount),
      });
    } catch (error) {
      throw new Error("Failed to update user balance.");
    }
  }

  async addMoneyToBalance(nickname, wallet, amount) {
     try {
       const userRef = await db.collection("users").doc(nickname);
       await userRef.update({
         [`wallets.${wallet}.available`]: FieldValue.increment(amount),
         [`wallets.${wallet}.deposited`]: FieldValue.increment(amount),
       });
     } catch (err) {
       console.error('Ошибка в addMoneyToBalance:', err); // Логируем для отладки
       throw new Error(`Ошибка в addMoneyToBalance: ${err.message}`); // Передаем ошибку дальше
     }
  }

  async deductMoneyFromBalance(nickname, wallet, amount) {
    try {
      const userRef = db.collection("users").doc(nickname);
      await userRef.update({
        [`wallets.${wallet}.available`]: FieldValue.increment(-amount),
        [`wallets.${wallet}.withdrawn`]: FieldValue.increment(amount),
        withdrawn: FieldValue.increment(amount),
      });
    } catch (err) {
      console.error('Ошибка в deductMoneyFromBalance:', err); // Логируем для отладки
      throw new Error(`Ошибка в deductMoneyFromBalance: ${err.message}`); // Передаем ошибку дальше
    }
  }

  async getUserReferrals(nickname) {
    try {
      const userDocRef = db.collection("users").doc(nickname);
      const userDocSnapshot = await userDocRef.get();

      if (!userDocSnapshot.exists) {
        console.log("Документ пользователя не найден");
        return null;
      }

      const userData = userDocSnapshot.data();
      const referrals = userData.referredTo || {}; // Проверяем наличие поля referredTo

      const referralData = {
        1: [],
        2: [],
        3: [],
        4: [],
      }; // Для хранения данных рефералов

      // Обрабатываем рефералов по уровням
      const referralPromises = Object.keys(referrals).map(async (level) => {
        const referralIds = referrals[level];

        if (!Array.isArray(referralIds)) return;

        // Получаем данные каждого реферала на уровне
        const userPromises = referralIds.map(async (referralId) => {
          const referralDocSnapshot = await referralId.get();

          if (referralDocSnapshot.exists) {
            return referralDocSnapshot.data(); // Возвращаем данные о реферале
          }
          return null; // Если документ не найден
        });

        // Ожидаем завершения всех запросов для текущего уровня
        referralData[level] = (await Promise.all(userPromises)).filter(Boolean); // Исключаем null значения
      });

      await Promise.all(referralPromises);

      return referralData; // Возвращаем данные рефералов
    } catch (error) {
      console.error("Ошибка получения данных рефералов:", error);
      return null;
    }
  }

  async addReferralRewards(nickname, wallet, amount) {
    const referralLength = 4;
    let currentReferralLevel = 1;

    const addReward = async (referredBy, amount, wallet) => {
      if (!referredBy || currentReferralLevel > referralLength) return;

      const referredByDoc = db.collection("users").doc(referredBy);
      const referredBySnap = await referredByDoc.get();

      if (!referredBySnap.exists) return;

      const referralReward =
        (amount / 100) * REFERRAL_REWARDS_BY_LEVEL[currentReferralLevel];

      await referredByDoc.update({
        referrals: FieldValue.increment(referralReward),
        [`wallets.${wallet}.referrals`]: FieldValue.increment(referralReward),
        [`wallets.${wallet}.available`]: FieldValue.increment(referralReward),
      });

      const transactionData = {
        amount: referralReward,
        executor: nickname,
        nickname: referredBySnap.data().nickname,
        status: "Выполнено",
        type: "Реферальные",
      };

      await TransactionService.addTransaction(transactionData);

      currentReferralLevel++;

      await addReward(referredBySnap.data().referredBy, amount, wallet);
    };

    try {
      const userRef = db.collection("users").doc(nickname);
      const userSnap = await userRef.get();

      if (!userSnap.exists) return;

      const userData = userSnap.data();
      await addReward(userData.referredBy, amount, wallet);
    } catch (error) {
      console.error("Error adding referral rewards:", error);
    }
  }

  async addReferralToAllLevels(referredBy, signedUpUser) {
    if (!referredBy) {
      return;
    }

    try {
      let currentReferralLevel = 1;
      const referralLength = 4;

      const signedUpUserDocRef = db.collection("users").doc(signedUpUser);

      // Update the signed-up user's referredBy field
      await signedUpUserDocRef.update({
        referredBy,
      });

      const addReferral = async (currentReferredBy) => {
        if (currentReferralLevel > referralLength || !currentReferredBy) {
          return;
        }

        const referredByDocRef = db.collection("users").doc(currentReferredBy);
        const referredByDocSnapshot = await referredByDocRef.get();

        if (!referredByDocSnapshot.exists) {
          return;
        }

        const nextReferredBy = referredByDocSnapshot.data().referredBy;

        // Update referredTo array for the current referredBy user
        await referredByDocRef.update({
          [`referredTo.${currentReferralLevel}`]:
            FieldValue.arrayUnion(signedUpUserDocRef),
        });

        currentReferralLevel++;

        // Recursive call for the next referredBy
        await addReferral(nextReferredBy);
      };

      await addReferral(referredBy);
    } catch (error) {
      console.error("Error adding referral:", error);
    }
  }

  async addIPToUser(nickname, ip) {
    try {
      const userDoc = db.collection("users").doc(nickname);
      const userSnap = await userDoc.get();
      const userData = userSnap.data();

      const userBackendInfo = userData.backendInfo || [];

      const userHasIp = userBackendInfo.some((info) => info.ip === ip);

      if (userHasIp) {
        return;
      }

      await userDoc.update({
        backendInfo: FieldValue.arrayUnion(ip),
      });
    } catch (e) {
      throw new Error("Failed to add ip user");
    }
  }
}

export default new UserService();
