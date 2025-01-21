import AuthService from "../services/AuthService.js";
import UserService from "../services/UserService.js";
import { auth } from "../index.js";
import EmailService from "../services/EmailService.js";

class AuthController {
  async registerUser(req, res) {
    try {
      const { referredBy, nickname } = req.body;

      const userRecord = await AuthService.registerUser(req.body);
      await UserService.addUser(req.body);
      await UserService.addReferralToAllLevels(referredBy, nickname);
      await EmailService.sendWelcomeEmail(req.body);

      const customToken = auth.createCustomToken(userRecord.uid);

      res.json({
        uid: customToken,
        ...req.body,
      });
    } catch (e) {
      res.status(500).json(e);
    }
  }
}

export default new AuthController();
