import { transporter } from "../index.js";
import { loadTemplate } from "../helpers.js";

class EmailService {
  async sendWelcomeEmail(data) {
    const { nickname, email, password } = data;

    const templateData = {
      nickname,
      email,
      password,
      action_url: "https://nordic-solar.tech/sign-in",
    };

    const htmlWelcomeEmail = loadTemplate("./templates/welcome.html", templateData);

    const mailOptions = {
      to: email,
      subject: `Вы с нами! Спасибо за регистрацию на Nordic Solar!`,
      text: "Ваше устройство не поддерживает HTML",
      html: htmlWelcomeEmail,
    };

    return await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Ошибка при отправке:", error);
      } else {
        console.log("Письмо успешно отправлено:", info.response);
      }
    });
  }

  async sendPrivateKeyEmail(data) {
    const { email } = data;

    const htmlPrivateKeyEmail = loadTemplate("./templates/privateKey.html", data);

    const mailOptions = {
      to: email,
      subject: `Ваш приватный финансовый ключ от Nordic Solar`,
      text: "Ваше устройство не поддерживает HTML",
      html: htmlPrivateKeyEmail,
    };

    return await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Ошибка при отправке письма с приватным ключом:", error);
      } else {
        console.log("Письмо успешно отправлено:", info.response);
      }
    });
  }
}

export default new EmailService();
