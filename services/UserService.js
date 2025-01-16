import { db } from "../index.js";
import { FieldValue } from "firebase-admin/firestore";
import { generateUserData } from "../helpers.js";

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

  async updateBalanceAfterOpenDeposit(username, wallet, amount) {
    try {
      const userRef = db.collection("users").doc(username);

      await userRef.update({
        [`wallets.${wallet}.available`]: FieldValue.increment(-amount),
        invested: FieldValue.increment(amount),
      });
    } catch (error) {
      throw new Error("Failed to update user balance.");
    }
  }

  async getUserReferrals(username) {
    try {
      const userDocRef = db.collection("users").doc(username);
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
