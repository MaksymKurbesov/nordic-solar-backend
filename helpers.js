import fs from "fs";
import mustache from "mustache";
import { FieldValue } from "firebase-admin/firestore";

export function loadTemplate(filePath, data) {
  const template = fs.readFileSync(filePath, "utf8"); // Читаем файл
  return mustache.render(template, data); // Заменяем переменные
}

export const generateUserData = (nickname, email, referredBy) => {
  return {
    settings: {
      name: "",
      surname: "",
      phone: "",
      social: "",
      country: "",
    },
    earned: 0,
    invested: 0,
    withdrawn: 0,
    referrals: 0,
    wallets: {
      bitcoin: {
        available: 0,
        deposited: 0,
        referrals: 0,
        withdrawn: 0,
        number: "",
      },
      ton: {
        available: 0,
        deposited: 0,
        referrals: 0,
        withdrawn: 0,
        number: "",
      },
      trc20: {
        available: 0,
        deposited: 0,
        referrals: 0,
        withdrawn: 0,
        number: "",
      },
      ethereum: {
        available: 0,
        deposited: 0,
        referrals: 0,
        withdrawn: 0,
        number: "",
      },
      solana: {
        available: 0,
        deposited: 0,
        referrals: 0,
        withdrawn: 0,
        number: "",
      },
    },
    referredBy: referredBy || "",
    privateKey: "",
    nickname,
    email,
    restrictions: {
      isCheaterInReferral: false,
      isFinancialGateway: false,
      isMultiAcc: {
        isActive: false,
        users: [],
      },
      isPrivateKey: false,
      isPrivateKeyInvalid: false,
      isReferralCheater: {
        isActive: false,
        users: [],
      },
      isWithdrawnLimit: false,
    },
    registrationDate: FieldValue.serverTimestamp(),
  };
};
