import UserService from "../services/UserService.js";
import TransactionService from "../services/TransactionService.js";
import TelegramService from "../services/TelegramService.js";

class TransactionController {
  async addTransaction(req, res) {
    try {
      const { nickname, amount, transactionHash, userWallet, privateKey } =
        req.body;
      await TransactionService.addTransaction(req.body);

      if (req.body.type === "Пополнение") {
        await TelegramService.depositNotification(
          nickname,
          amount,
          transactionHash,
        );
      }

      if (req.body.type === "Вывод") {
        await TelegramService.withdrawnNotification(
          nickname,
          amount,
          privateKey,
          userWallet,
        );
      }
    } catch (e) {
      res.status(500).json(e);
    }
  }

  async confirmTransaction(req, res) {
    try {
      const { nickname, executor, amount, id, type } = req.body;

      await TransactionService.confirmTransaction(id);

      if (type === "Пополнение") {
        await UserService.addMoneyToBalance(nickname, executor, amount);
        await UserService.addReferralRewards(nickname, executor, amount);
      }

      if (type === "Вывод") {
        await UserService.deductMoneyFromBalance(nickname, executor, amount);
      }

      res.json({ message: "Транзакция успешно подтверждена!" });
    } catch (e) {
      res.status(500).json(e);
    }
  }

  async declineTransaction(req, res) {
    try {
      const { id } = req.body;

      await TransactionService.declineTransaction(id);

      res.json({ message: "Транзакция успешно отменена!" });
    } catch (e) {
      res.status(500).json(e);
    }
  }
}

export default new TransactionController();
