import fs from "fs";
import mustache from "mustache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const REFERRAL_REWARDS_BY_LEVEL = {
  1: 8,
  2: 6,
  3: 4,
  4: 2,
};

export const PLANS_IN_DAY = {
  solar: {
    beginner: 1.1,
    available: 1.8,
    optimal: 2.5,
    maximum: null,
  },
  wind: {
    beginner: 0.6,
    available: 0.9,
    optimal: 1.1,
    maximum: null,
  },
  hydro: {
    beginner: 0.7,
    available: 1,
    optimal: 2,
    maximum: 1.2,
  },
  hydrogen: {
    beginner: 1.5,
    available: 2.1,
    optimal: 3,
    maximum: null,
  },
  mining: {
    beginner: 0.45,
    available: 0.23,
  },
};

export function loadTemplate(filePath, data) {
  const template = fs.readFileSync(filePath, "utf8"); // Читаем файл
  return mustache.render(template, data); // Заменяем переменные
}

export const calculateDaysSinceDate = (date) => {
  const now = new Date(Timestamp.now().seconds * 1000);
  const updatedSomeDate = new Date(date.seconds * 1000);
  const oneDayMilliseconds = 24 * 60 * 60 * 1000;
  const difference = now.getTime() - updatedSomeDate.getTime();
  return Math.floor(difference / oneDayMilliseconds);
};

export const addDaysToDate = (date, days) => {
  const result = new Date(date.seconds * 1000);
  result.setDate(result.getDate() + days);

  return new Date(result.getTime());
};

export function generateDepositData(data) {
  const { amount, wallet, variant, willReceived, plan, days, accruals } = data;

  return {
    amount,
    days: days,
    wallet,
    variant,
    openDate: FieldValue.serverTimestamp(),
    closeDate: Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000),
    received: 0,
    lastAccrual: FieldValue.serverTimestamp(),
    willReceived,
    charges: 0,
    isActive: true,
    plan,
    accruals,
  };
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
