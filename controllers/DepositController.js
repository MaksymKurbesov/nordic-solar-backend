import DepositService from "../services/DepositService.js";
import TransactionService from "../services/TransactionService.js";
import UserService from "../services/UserService.js";

class DepositController {
  async openDeposit(req, res) {
    try {
      const { amount, wallet, username } = req.body;
      const transactionData = {
        amount,
        executor: wallet,
        type: "Депозит",
        nickname: username,
        status: "Выполнено",
      };

      const deposit = await DepositService.addDeposit(req.body);
      await TransactionService.addTransaction(transactionData);
      await UserService.updateBalanceAfterOpenDeposit(username, wallet, amount);

      res.json(deposit);
    } catch (e) {
      res.status(500).json(e);
    }
  }
}

export default new DepositController();
