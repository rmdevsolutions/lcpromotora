import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";

interface Email {
  assunto: string | null;
  body: string | null;
  remetente: string | null;
}

const imap = new Imap({
  user: "usuarios@lcpromotora.com.br",
  password: "L&C@2021",
  host: "mail.lcpromotora.com.br",
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false,
  },
});

const fetchEmails = async (): Promise<Email[]> => {
  return new Promise((resolve, reject) => {
    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, mailbox) => {
        if (err) {
          reject(err);
          return;
        }

        const fromFilter = "thayanne.santos@lcpromotora.com.br"; // Remetente que deseja filtrar

        const fetchOptions = {
          markSeen: false,
          searchCriteria: ["FROM", fromFilter],
        };

        const fetch = imap.seq.fetch("1:3", fetchOptions);
        const emails: Email[] = [];

        fetch.on("message", (msg, seqno) => {
          msg.on("body", (stream, info) => {
            simpleParser(stream, (parseErr, parsedMail: ParsedMail) => {
              if (parseErr) {
                console.error("Erro ao analisar email:", parseErr);
                return;
              }

              const email: Email = {
                assunto: parsedMail.subject || null,
                body: parsedMail.text || null,
                remetente: parsedMail.from?.text || null,
              };
              emails.push(email);
            });
          });

          msg.once("end", () => {
            console.log("Email processado");
          });
        });

        fetch.once("error", (fetchErr) => {
          reject(fetchErr);
        });

        fetch.once("end", () => {
          console.log("Busca de emails concluída");
          resolve(emails);
          imap.end();
        });
      });
    });

    imap.once("error", (err: any) => {
      reject(err);
    });

    // imap.connect();
  });
};

// Utilização:
fetchEmails()
  .then((emails) => {
    console.log("Lista de emails:");
    console.log(emails);
  })
  .catch((err) => {
    console.error("Erro ao buscar emails:", err);
  });

export default imap;

// const f = imap.seq.fetch("1:3", {
//   bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
//   struct: true,
// });

// f.on("message", function (msg: Imap.ImapMessage, seqno: number) {
//   console.log("Message #%d", seqno);
//   const prefix = "(#" + seqno + ") ";

//   msg.on("body", function (stream, info) {
//     let buffer = "";
//     stream.on("data", function (chunk) {
//       buffer += chunk.toString("utf8");
//     });

//     stream.once("end", function () {
//       console.log(
//         prefix + "Parsed header: %s",
//         inspect(Imap.parseHeader(buffer))
//       );
//     });
//   });

//   msg.once("attributes", function (attrs) {
//     console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
//   });

//   msg.once("end", function () {
//     console.log(prefix + "Finished");
//   });
// });

// f.once("error", function (err) {
//   console.log("Fetch error: " + err);
// });

// f.once("end", function () {
//   console.log("Done fetching all messages!");
//   imap.end();
// });
