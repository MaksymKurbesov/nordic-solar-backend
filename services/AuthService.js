import { auth } from "../index.js";

class AuthService {
  async registerUser({ email, nickname, password }) {
    return await auth.createUser({
      email,
      emailVerified: false,
      password,
      displayName: nickname,
      disabled: false,
    });
  }

  async loginUser() {}
}

export default new AuthService();
