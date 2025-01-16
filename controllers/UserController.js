import UserService from "../services/UserService.js";
import geoip from "geoip-lite";

class UserController {
  async getUser(req, res) {
    try {
      const { username } = req.body;
      const userData = await UserService.getUser(username);

      res.json(userData);
    } catch (e) {
      res.status(500).json(e);
    }
  }

  async getReferrals(req, res) {
    try {
      const { nickname } = req.body;
      console.log(req.body, "req.body");

      const referrals = await UserService.getUserReferrals(nickname);
      res.json(referrals);
    } catch (e) {
      res.status(500).json(e);
    }
  }

  async checkIP(req, res) {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).send("Username is required");
      }

      const ip = (
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        ""
      ).replace("::ffff:", "");

      const geoByIp = geoip.lookup(ip);

      if (!geoByIp) {
        return res.status(400).send("Invalid IP address");
      }

      const newIpInfo = {
        ip,
        geo: {
          country: geoByIp.country || "Unknown",
          city: geoByIp.city || "Unknown",
        },
      };

      await UserService.addIPToUser(username, newIpInfo);

      res.send("IP address logged successfully");
    } catch (error) {
      console.error("Error logging IP address:", error);
      res.status(500).send("Internal server error");
    }
  }
}

export default new UserController();
