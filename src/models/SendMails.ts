import * as nodemailer from "nodemailer";

// Configurações do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: "smtp",
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "lcpromotora@rmdevsolutions.com.br",
    pass: "061415Ma@",
  },
});

export default async function SendMail(
  subject: string,
  text: string,
  to: string,
  html: string
) {
  // Configurações do e-mail a ser enviado
  const mailOptions: nodemailer.SendMailOptions = {
    from: "lcpromotora@rmdevsolutions.com.br",
    to,
    subject,
    text,
    html,
  };

  const retornoEnvio = transporter.sendMail(
    mailOptions,
    function (error: Error | null, info: nodemailer.SentMessageInfo) {
      if (error) {
        console.error("Erro ao enviar o e-mail:", error);
        return error;
      } else {
        console.log("E-mail enviado com sucesso:", info.response);
        return "enviado com sucesso";
      }
    }
  );

  console.log(retornoEnvio);
}
