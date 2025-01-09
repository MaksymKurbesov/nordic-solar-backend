import nodemailer from "nodemailer";
import fs from "fs";
import mustache from "mustache";
import express from "express";
import bodyParser from "body-parser";
import DeviceDetector from "node-device-detector";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import geoip from "geoip-lite";

const app = express();
const PORT = 3000;

const firestoreApp = initializeApp();
const db = getFirestore();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});

const transporter = nodemailer.createTransport({
  service: "gmail", // Gmail используется как SMTP-сервис
  auth: {
    user: "support@apatecyprusestate.com", // Ваш email
    pass: "hyhx harv imyi mxun", // Сгенерированный пароль приложения
  },
});

app.post("/ip", async (req, res) => {
  try {
    const { username } = req.body;
    const userDoc = await db.collection("users").doc(username);
    const userSnap = await userDoc.get();
    // const userAgent = req.useragent;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const parsedIP = ip.replace("::ffff:", "");
    // const result = detector.detect(userAgent?.source);

    if (userSnap.exists) {
      const userData = await userSnap.data();
      const geoByIp = geoip.lookup(parsedIP);
      const userBackendInfo = userData.backendInfo;

      if (userBackendInfo) {
        const userHasIp = userBackendInfo.some((info) => info.ip === parsedIP);

        if (userHasIp) {
          res.send("the user has already logged in from this IP address");
          return;
        }

        await userDoc.update({
          backendInfo: FieldValue.arrayUnion({
            ip: parsedIP,
            country: geoByIp.country,
            city: geoByIp.city,
            // ...result,
          }),
        });
      } else {
        await userDoc.update({
          backendInfo: [
            {
              ip: parsedIP,
              geo: geoByIp,
              // ...result,
            },
          ],
        });
      }
    }

    res.send(ip);
  } catch (e) {
    console.log(e, "error");
  }
});

app.post("/send-welcome-email", async (req, res) => {
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
