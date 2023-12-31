import { Request, Response, NextFunction } from "express";
import Puppeteer from "../models/Puppeteer";
import * as service from "../services/UsersTickets";
import UsersTickets, {
  IUsersTickets,
  IUsersTicketsOutput,
} from "../models/UsersTickets";

import imap from "../models/ReadMails";
import SendMail from "../models/SendMails";
import logger from "../logger";

interface IServiceMail {
  service: string | null;
  client: string | null;
  cpf: string | null;
  ticket: string | null;
}

const sendEmailsFromList = async () => {
  const unsetList = await service.getNotSended("0");
  for (const item of unsetList) {
  }
};

function getCurrentDate() {
  const date = new Date();
  let yesterday = date.toString();
  yesterday = date.toLocaleDateString("en-GB");
  yesterday = yesterday.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2$1$3");
  return yesterday;
}

function getThirtyDaysAgoDate() {
  const date = new Date();
  const daysOff = 5;
  let yesterday = date.setDate(date.getDate() - daysOff).toString();
  yesterday = date.toLocaleDateString("en-GB");
  yesterday = yesterday.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2$1$3");

  return yesterday;
}

const getAllUsersTickets = async () => {
  const UsersTicket = new Puppeteer();
  await UsersTicket.initialize();

  try {
    await UsersTicket.navigate(
      "https://app1.gerencialcredito.com.br/lcpromotora/default.asp"
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    const AuthInformation = {
      btnSelector: "#btnLogin",
      usrSelector: "#txtUsuario",
      pwdSelector: "#txtSenha",
      password: "A@7yaWpgL1",
      user: "Rmtec9",
      timeout: 60,
    };
    const payloadCreateUser: Array<IUsersTicketsOutput> = [];
    const TypesOfSearch = ["1", "2"];
    const tablesIds = ["#tableNovo", "#tableReinicializacao"];

    if (await UsersTicket.Auth(AuthInformation)) {
      logger.info("Autenticado!");

      for (const index of TypesOfSearch) {
        try {
          await UsersTicket.navigate(
            "https://app1.gerencialcredito.com.br/lcpromotora/Esteira_Chamado_Usuario.asp"
          );

          const dtoEnd = getCurrentDate();
          const dtoStart = getThirtyDaysAgoDate();

          await UsersTicket.selectOption("#ddlTipoChamado", index);
          await UsersTicket.getPage().type(`#txtDataInicial`, dtoStart);
          await UsersTicket.getPage().type(`#txtDataFinal`, dtoEnd);
          // await UsersTicket.selectOption("#status", "16");
          // await UsersTicket.selectOption("#servico", "19");
          await UsersTicket.getPage().click("#chkFinalizado");
          await UsersTicket.getPage().click(
            "#filtroChamado > div > div.card-body > div:nth-child(4) > div.col-md-1 > button"
          );

          await new Promise((resolve) => setTimeout(resolve, 500));
          await UsersTicket.getPage().waitForSelector(".loadingoverlay", {
            hidden: true,
          });

          // var screenshotBuffer = await UsersTicket.getPage().screenshot();
          // return screenshotBuffer;

          const selectorTableName = tablesIds[parseInt(index) - 1].replace(
            "#",
            ""
          );
          const selectorTable = tablesIds[parseInt(index) - 1];

          await UsersTicket.getPage().waitForSelector(selectorTable);

          const selectorLengthTable = `select[name="${selectorTableName}_length"]`;

          logger.info("primeiro estágio");
          let tableJSON: Record<string, string>[];

          await UsersTicket.getPage().$eval(
            `${selectorLengthTable} option:last-child`,
            (option) => {
              option.value = "1000000";
            }
          );

          tableJSON = await UsersTicket.extractTable(
            selectorTable,
            "1000000",
            selectorLengthTable
          );

          logger.info(`Quantidade de Registros: ${tableJSON.length}`);

          for (const column of tableJSON) {
            logger.info(`Cliente: ${column.col5}`);
            if (column.col1 !== undefined) {
              const linkVizalization = `https://app1.gerencialcredito.com.br/lcpromotora/Chamado_usuario_editar_new.asp?ChamadoID=${column.col1}`;
              await UsersTicket.navigate(linkVizalization);

              await UsersTicket.getPage().waitForSelector("#nascimento");
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const dateBorne = await UsersTicket.getPage().$eval(
                'input[name="nascimento"]',
                (el) => el.value
              );

              const payloadItem: IUsersTickets = {
                SYS_ID: column.col1,
                SYS_STATUS: column.col2,
                SYS_SERVICE: column.col3,
                SYS_CREATE_AT: column.col4,
                SYS_IDENTITY: column.col8,
                SYS_INFORMATION: column.col6,
                SYS_CLIENT: column.col5,
                SYS_CREATED_BY: column.col9,
                STATUS: "0",
                ID: null,
                USERNAME: null,
                PASSWORD: null,
                INFORMATIONS: null,
                SYS_DATE_BORN: dateBorne,
              };

              const response = await service.update(
                payloadItem.SYS_ID,
                payloadItem
              );
              payloadCreateUser.push(response);
            }
          }
        } catch (error) {
          logger.error(error);
        }
      }
    }

    logger.info("Finalizado Coleta de Dados");
    await UsersTicket.close();
    return payloadCreateUser;
  } catch (error: any) {
    // const screenshotBuffer = await UsersTicket.getPage().screenshot();
    await UsersTicket.close();
    logger.error(error);
    throw new Error(error);
  }
};

async function postCustomer(req: Request, res: Response, next: NextFunction) {
  res.json({});
}

async function insertInformationThowTechRequest(req: Request, res: Response) {
  const result = await insertInformationThowTech();
  res.json(result);
}

async function insertInformationThowTech(): Promise<void | []> {
  logger.info("Iniciado processo de Atualização");
  const UsersTicket = new Puppeteer();
  await UsersTicket.initialize();

  try {
    await UsersTicket.navigate(
      "https://app1.gerencialcredito.com.br/lcpromotora/default.asp"
    );

    const AuthInformation = {
      btnSelector: "#btnLogin",
      usrSelector: "#txtUsuario",
      pwdSelector: "#txtSenha",
      password: "A@7yaWpgL1",
      user: "Rmtec9",
      timeout: 60,
    };

    if (await UsersTicket.Auth(AuthInformation)) {
      const UsersTicketZero = await service.getAllStatusEnded();

      if (UsersTicketZero.length === 0) return [];
      for (const row of UsersTicketZero) {
        try {
          const url = `https://app1.gerencialcredito.com.br/lcpromotora/interacaoChamado.asp?chamadoId=${row.SYS_ID}&altera=1&VinculoId=undefined`;
          await UsersTicket.navigate(url);
          const status = row.STATUS;

          if (status === "finalizado com sucesso") {
            await UsersTicket.selectOption("#ddlStatusInteracao", "7");
            await UsersTicket.getPage().waitForSelector("#txtUsuario");

            await UsersTicket.getPage().type("#txtUsuario", row.USERNAME);
            await UsersTicket.getPage().type(
              "#txtObservacaoInteracao",
              `[AUT-LC]: Seguem dados da criação: Usuário: ${row.USERNAME} e Senha: ${row.PASSWORD}`
            );

            await UsersTicket.getPage().click(
              `#spanCamposInteracao > div:nth-child(5) > button`
            );

            await persistUserAndPassword(row);
          } else {
            await UsersTicket.selectOption("#ddlStatusInteracao", "13");
            await UsersTicket.getPage().type(
              "#txtObservacaoInteracao",
              `[AUT-LC]: Não foi possível prosseguir com sua criação: ${row.INFORMATIONS}`
            );

            await UsersTicket.getPage().click(
              `#spanCamposInteracao > div:nth-child(5) > button`
            );
            await persistUserAndPassword(row);
          }
        } catch (error) {
          logger.error(error);
        }
      }
    }
  } catch (error: any) {
    logger.error(error);
    throw Error(error);
  }

  logger.info("Finalizado processo de Atualização");
  await UsersTicket.close();
}

async function getUsers(req: Request, res: Response) {
  res.json({ message: "tudo ok" });
}

async function sendMail(Mail: IServiceMail) {
  const subject = `[#LC${Mail.ticket}#][${Mail.service}] - ${Mail.client} - ${Mail.cpf}`;
  const htmlBody = `<p>Olá, Solicito a execução dos serviços abaixo<p>
  <ul>
  <li><b>Serviço:</b>${Mail.service}</li>
  <li><b>Cliente:</b>${Mail.client}</li>
  <li><b>CPF:</b>${Mail.cpf}</li>
  </ul>
  <br>
  <p>Pedimos que não alterem o assunto deste e-mail!</b>
  `;
  const send = await SendMail(
    subject,
    "Olá Usuário",
    "rmtec9@gmail.com",
    htmlBody
  );

  logger.info(send);
}

async function getAllTicketsForNewUsers(req: Request, res: Response) {
  const result = await getAllUsersTickets();
  // res.json(result);
  // res.set("Content-Type", "image/png");
  res.send(result);
}

async function getById(req: Request, res: Response) {
  const dados = await service.getById(req.params.id);
  const MailBody: IServiceMail = {
    service: dados.SYS_SERVICE,
    client: dados.SYS_CLIENT,
    cpf: dados.SYS_IDENTITY,
    ticket: dados.SYS_ID,
  };

  await sendMail(MailBody);

  res.json(dados);
}

async function getEmails(req: Request, res: Response) {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  imap.connect();
}

async function persistUserAndPassword(
  row: IUsersTickets
): Promise<IUsersTicketsOutput> {
  const payloadItem: IUsersTickets = {
    ...row,
    STATUS: "1",
  };
  const response = await service.update(row.SYS_ID, payloadItem);
  return response;
}

export {
  postCustomer,
  getUsers,
  getAllTicketsForNewUsers,
  getAllUsersTickets,
  getById,
  getEmails,
  sendMail,
  insertInformationThowTech,
  insertInformationThowTechRequest,
};
