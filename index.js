const nodemailer = require("nodemailer");
const fs = require("fs");
const mustache = require("mustache");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  service: "gmail", // Gmail используется как SMTP-сервис
  auth: {
    user: "support@apatecyprusestate.com", // Ваш email
    pass: "hyhx harv imyi mxun", // Сгенерированный пароль приложения
  },
});

app.post("/nordic-solar//send-welcome-email", async (req, res) => {
  try {
    const { to, subject, name, email, password, action_url } = req.body;

    const templateData = {
      name,
      email,
      password,
      action_url,
    };

    const welcomeEmail = loadTemplate("./templates/welcome.html", templateData);

    const mailOptions = {
      to,
      subject,
      text: "Ваше устройство не поддерживает HTML",
      html: welcomeEmail,
    };

    const info = await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Ошибка при отправке:", error);
      } else {
        console.log("Письмо успешно отправлено:", info.response);
      }
    });

    res.status(200).json({ message: "Письмо отправлено успешно!", info });
  } catch (error) {
    console.error("Ошибка при отправке письма:", error);
    res
      .status(500)
      .json({ error: "Ошибка при отправке письма", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

function loadTemplate(filePath, data) {
  const template = fs.readFileSync(filePath, "utf8"); // Читаем файл
  return mustache.render(template, data); // Заменяем переменные
}
