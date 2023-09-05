import nodemailer from "nodemailer";
import Mailgen from "mailgen";

import ENV from "../config.js";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: ENV.USERNAME,
    pass: ENV.PASS,
  },
});

let MailGenrator = new Mailgen({
  theme: "default",
  product: {
    name: "Mailgen",
    link: "http://mailgen.js/",
  },
});

export const registerMail = async (req, res) => {
  const { username, userEmail, text, subject } = req.body;

  var email = {
    body: {
      name: username,
      intro: text || "Welcome to new world...",
      outro: "Need help, or have questions? Just reply to this email",
    },
  };

  var emailBody = MailGenrator.generate(email);
  let message = {
    from: ENV.USERNAME,
    to: userEmail,
    subject: subject || "Signup Successful",
    html: emailBody,
  };

  transporter
    .sendMail(message)
    .then(() => {
      return res
        .status(200)
        .send({ msg: "You should receive an email from us." });
    })
    .catch((error) => res.status(500).send({ error }));
};
