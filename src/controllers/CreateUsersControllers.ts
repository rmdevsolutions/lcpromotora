import { html, load } from "cheerio";
import { Request, Response, NextFunction } from "express";
import Puppeteer from "../models/Puppeteer";
import * as service from "../services/UsersTickets";
import UsersTickets, {
  IUsersTickets,
  IUsersTicketsOutput,
} from "../models/UsersTickets";
import { ElementHandle, Frame } from "puppeteer";
import logger from "../logger";

interface IServiceMail {
  service: string | null;
  client: string | null;
  cpf: string | null;
  ticket: string | null;
}

interface IAuthCreate {
  user: string;
  pwd: string;
  partner: string;
  messageDialog: string[];
  created: boolean;
}

let AuthCreate: IAuthCreate = {
  user: "",
  pwd: "",
  partner: "",
  messageDialog: [],
  created: false,
};

interface IUsersTicketsUpdateUsrPwd {
  STATUS: string;
  USERNAME: string;
  PASSWORD: string;
  INFORMATIONS: string;
}

async function authLoginC6Bank(C6Bank: Puppeteer) {
  await C6Bank.getPage().setViewport({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
  });

  await C6Bank.getPage().on("dialog", async (dialog) => {
    const msgUserConected = `Usuário já autenticado em outra estação. Deseja desconectar-se da estação e conectar-se através desta?`;
    if (dialog.message() !== msgUserConected) {
      AuthCreate.messageDialog.push(dialog.message());
    }

    await dialog.accept();
  });

  try {
    await C6Bank.navigate(
      "https://c6.c6consig.com.br/WebAutorizador/Login/AC.UI.LOGIN.aspx"
    );

    const AuthInformation = {
      btnSelector: "#lnkEntrar",
      usrSelector: "#EUsuario_CAMPO",
      pwdSelector: "#ESenha_CAMPO",
      password: "85Alegria@",
      user: "05037473357_000128",
      timeout: 60,
    };

    if (await C6Bank.AuthClickButton(AuthInformation)) return true;
    return false;
  } catch (error: any) {
    return false;
  }
}

async function createUserC6BankRequest(req: Request, res: Response) {
  const result = await createUserC6Bank();
  res.json(result);
}

async function createUserC6Bank(): Promise<IUsersTicketsOutput[] | []> {
  logger.info("Iniciado processo de Criação");
  const UsersTicketZero = await service.getAllStatusZero(
    "NOVO USUÁRIO - C6 BANK",
    "NOVO"
  );

  if (UsersTicketZero.length === 0) return [];

  const C6Bank = new Puppeteer();
  await C6Bank.initialize();

  await C6Bank.getPage().on("dialog", async (dialog) => {
    const msgUserConected = `Usuário já autenticado em outra estação. Deseja desconectar-se da estação e conectar-se através desta?`;
    if (dialog.message() !== msgUserConected) {
      AuthCreate.messageDialog.push(dialog.message());
    }

    await dialog.accept();
  });

  await C6Bank.getPage().setViewport({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
  });

  let AuthCreate: IAuthCreate = {
    user: "",
    pwd: "",
    partner: "",
    messageDialog: [],
    created: false,
  };

  const outputResult: Array<IUsersTicketsOutput> = [];

  try {
    await C6Bank.navigate(
      "https://c6.c6consig.com.br/WebAutorizador/Login/AC.UI.LOGIN.aspx"
    );

    const AuthInformation = {
      btnSelector: "#lnkEntrar",
      usrSelector: "#EUsuario_CAMPO",
      pwdSelector: "#ESenha_CAMPO",
      password: "85Alegria@",
      user: "05037473357_000128",
      timeout: 60,
    };

    if (await C6Bank.AuthClickButton(AuthInformation)) {
      await C6Bank.getPage().waitForSelector(
        `#navbar-collapse-funcao > ul > li:nth-child(1) > a`
      );

      try {
        for (const row of UsersTicketZero) {
          AuthCreate.created = false;
          AuthCreate.messageDialog = [];
          AuthCreate.partner = null;
          AuthCreate.pwd = null;
          AuthCreate.user = null;

          await C6Bank.navigate(
            `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Cadastro/Operador/UI.CD.CadOperadores.aspx`
          );

          await C6Bank.getPage().waitForSelector(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCpf_CAMPO`
          );
          await C6Bank.getPage().waitForSelector(`#btnConfirmar_txt`);

          //Dados do Login
          await C6Bank.getPage().type(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCpf_CAMPO`,
            row.SYS_IDENTITY?.replace(/[.-]/g, "")
          );

          await C6Bank.getPage().click(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtNomeUsu_CAMPO`
          );

          await new Promise((resolve) => setTimeout(resolve, 2000));
          await C6Bank.getPage().click(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtNomeUsu_CAMPO`
          );
          await C6Bank.getPage().type(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtNomeUsu_CAMPO`,
            row.SYS_CLIENT?.trim()
          );

          await C6Bank.getPage().type(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtEmail_CAMPO`,
            `usuarios@lcpromotora.com.br`
          );

          await C6Bank.getPage().type(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDDDCel_CAMPO`,
            `98`
          );

          await C6Bank.getPage().type(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCel_CAMPO`,
            `987436947`
          );

          await C6Bank.getPage().type(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtDtNasc_CAMPO`,
            row.SYS_DATE_BORN.length > 0 ? row.SYS_DATE_BORN : "19/01/1993"
          );

          await C6Bank.selectOption(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbGrupoAcesso1_CAMPO`,
            `1`
          );

          await new Promise((resolve) => setTimeout(resolve, 500));

          await C6Bank.selectOption(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbRegimeContratacao_CAMPO`,
            `3`
          );

          await new Promise((resolve) => setTimeout(resolve, 500));
          await C6Bank.selectOption(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbOrigem3_CAMPO`,
            `000128`
          );

          await new Promise((resolve) => setTimeout(resolve, 500));
          await C6Bank.selectOption(
            `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_cmbUsuRestrito_CAMPO`,
            `S`
          );

          await new Promise((resolve) => setTimeout(resolve, 2000));
          await C6Bank.getPage().click(`#btnConfirmar_txt`);
          await new Promise((resolve) => setTimeout(resolve, 500));

          const iframeSelector = `#ctl00_Cph_popConfirmacao_frameAjuda`;

          // Wait for the frame with the specified ID
          try {
            const frame = await C6Bank.getPage().waitForFunction(
              (id) => {
                const frames = Array.from(window.frames);
                return frames.find((f) => f.frameElement?.id === id);
              },
              { timeout: 10000 },
              `ctl00_Cph_popConfirmacao_frameAjuda`
            );

            logger.info(frame);

            const iframeElementHandle = await C6Bank.getPage().$(
              iframeSelector
            );

            const iframeContent = await iframeElementHandle.contentFrame();

            await iframeContent.waitForSelector(`#btnImprimir_txt`);

            const newUserSelector = `input[name="ctl00$cph$FIJN1$jnDadosLogin$txtLoginUsu$CAMPO"]`;
            const newPartnerSelector = `input[name="ctl00$cph$FIJN1$jnDadosLogin$txtPromotoraPrincipal$CAMPO"]`;
            const newPasswordSelector = `input[name="ctl00$cph$FIJN1$jnDadosLogin$txtSenha$CAMPO"]`;

            AuthCreate.user = await iframeContent.$eval(
              newUserSelector,
              (el) => el.value
            );

            AuthCreate.partner = await iframeContent.$eval(
              newPartnerSelector,
              (el) => el.value
            );

            AuthCreate.pwd = await iframeContent.$eval(
              newPasswordSelector,
              (el) => el.value
            );

            AuthCreate.created = true;
          } catch (error) {
            logger.error(error);
            AuthCreate.created = false;
          }

          const result: IUsersTicketsOutput = await persistUserAndPassword(
            row,
            AuthCreate
          );
          outputResult.push(result);
        }
      } catch (error: any) {
        logger.error(error);
      }
    } else {
      AuthCreate.created = false;
    }
  } catch (error: any) {
    // await C6Bank.close();
    logger.error(error);
  }

  logger.info("Finalizado processo de Criação");
  await C6Bank.close();
  return outputResult;
}

async function waitFrameAndGetInformation(
  frame: string,
  driver: Puppeteer
): Promise<Frame | null> {
  try {
    const iframeSelector = `#${frame}`;
    await driver.getPage().waitForFunction(
      (id) => {
        const frames = Array.from(window.frames);
        return frames.find((f) => f.frameElement?.id === id);
      },
      { timeout: 10000 },
      frame
    );

    const iframeElementHandle = await driver.getPage().$(iframeSelector);

    const iframeContent = await iframeElementHandle.contentFrame();
    return iframeContent;
  } catch (error) {
    logger.error(error);
    return null;
  }
}

async function resetAndGetInformation(C6Bank: Puppeteer) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await C6Bank.getPage().waitForFunction(
      (cssSelector) => {
        const resultSearch = document.querySelector(cssSelector).textContent;
        return resultSearch !== "Nenhum Usuário para visualização.";
      },
      { timeout: 10000 },
      `#ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios > tbody > tr:nth-child(2) > td`
    );

    const selectorCss = `#ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios > tbody > tr.normal > td:nth-child(9) > input[type=image]`;
    await C6Bank.getPage().waitForSelector(selectorCss);
    await C6Bank.getPage().click(selectorCss);
    const framePop = await waitFrameAndGetInformation(
      "ctl00_Cph_popBoleana_frameAjuda",
      C6Bank
    );

    if (framePop !== null) {
      await framePop.waitForSelector(`#btnOpTrue_txt`);

      await framePop.click(`#btnOpTrue_txt`);
    }

    const frame = await waitFrameAndGetInformation(
      "ctl00_Cph_popConfirmacao_frameAjuda",
      C6Bank
    );

    if (frame !== null) {
      await frame.waitForSelector(`#btnImprimir_txt`);

      const newUserSelector = `input[name="ctl00$cph$FIJN1$jnDadosLogin$txtLoginUsu$CAMPO"]`;
      const newPartnerSelector = `input[name="ctl00$cph$FIJN1$jnDadosLogin$txtPromotoraPrincipal$CAMPO"]`;
      const newPasswordSelector = `input[name="ctl00$cph$FIJN1$jnDadosLogin$txtSenha$CAMPO"]`;

      AuthCreate.user = await frame.$eval(newUserSelector, (el) => el.value);

      AuthCreate.partner = await frame.$eval(
        newPartnerSelector,
        (el) => el.value
      );

      AuthCreate.pwd = await frame.$eval(newPasswordSelector, (el) => el.value);

      AuthCreate.created = true;
    } else {
      AuthCreate.created = false;
    }
  } catch (error) {
    logger.error(error);
    AuthCreate.messageDialog = ["Usuário não localizado."];
    AuthCreate.created = false;
  }
}

async function resetUserC6BankRequest(req: Request, res: Response) {
  const result = await resetUserC6Bank();
  res.json(result);
}

async function resetUserC6Bank(): Promise<IUsersTicketsOutput[] | []> {
  logger.info("Iniciado processo de Reinicialização");
  const UsersTicketZero = await service.getAllStatusZero(
    "REINICIALIZAÇÃO - C6 BANK",
    "NOVO"
  );

  if (UsersTicketZero.length === 0) return [];

  const C6Bank = new Puppeteer();
  await C6Bank.initialize();
  const AuthC6Bank = await authLoginC6Bank(C6Bank);

  const outputResult: Array<IUsersTicketsOutput> = [];
  if (AuthC6Bank) {
    await C6Bank.getPage().waitForSelector(
      `#navbar-collapse-funcao > ul > li:nth-child(1) > a`
    );

    for (const row of UsersTicketZero) {
      try {
        AuthCreate.created = false;
        AuthCreate.messageDialog = [];
        AuthCreate.partner = null;
        AuthCreate.pwd = null;
        AuthCreate.user = null;

        await C6Bank.navigate(
          `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Cadastro/Operador/UI.CD.CadOperadores.aspx`
        );

        await C6Bank.getPage().waitForSelector(
          `#ctl00_Cph_FIJN1_jnDadosLogin_UcDUsu_txtCpf_CAMPO`
        );
        await C6Bank.getPage().waitForSelector(`#btnConfirmar_txt`);

        const selectorCPF = `input[name="ctl00$Cph$FIJN1$jnGridManutencao$UcGridManUsu$txtCampoPesq$CAMPO"]`;
        await C6Bank.getPage().type(
          selectorCPF,
          row.SYS_IDENTITY?.replace(/[.-]/g, "")
        );

        await C6Bank.getPage().click(`#btnPesquisar_txt`);

        try {
          await C6Bank.getPage().waitForFunction(
            (cssSelector) => {
              const resultSearch =
                document.querySelector(cssSelector).textContent;
              return resultSearch !== "Nenhum Usuário para visualização.";
            },
            { timeout: 10000 },
            `#ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios > tbody > tr:nth-child(2) > td`
          );

          const statusUserSelector = `#ctl00_Cph_FIJN1_jnGridManutencao_UcGridManUsu_gdvUsuarios  a`;

          const optionsTagA = await C6Bank.getPage().$$(statusUserSelector);
          const statusUser = await optionsTagA[1].evaluate(
            (el) => el.textContent
          );

          if (statusUser !== "Inativar") {
            logger.info("entrou no reset reativando");
            await optionsTagA[1].evaluate((el) => el.click());

            await new Promise((resolve) => setTimeout(resolve, 500));

            const selectorStats = `select[name="ctl00$Cph$FIJN1$jnDadosLogin$UcDUsu$cmbStatus$CAMPO"]`;
            await C6Bank.getPage().waitForSelector(selectorStats);
            await C6Bank.getPage().select(selectorStats, "Ativo");

            await new Promise((resolve) => setTimeout(resolve, 500));
            await C6Bank.getPage().click(`#btnConfirmar_txt`);

            try {
              const framePopConfirm = await waitFrameAndGetInformation(
                "ctl00_Cph_popConfirmacao_frameAjuda",
                C6Bank
              );

              if (framePopConfirm !== null) {
                logger.info("modo frame localizado");
                await new Promise((resolve) => setTimeout(resolve, 500));
                await framePopConfirm.waitForSelector(`#btnVoltar_txt`);
                await framePopConfirm.click(`#btnVoltar_txt`);
              }

              await C6Bank.getPage().waitForSelector(`#btnPesquisar_txt`);
              await C6Bank.getPage().click(`#btnPesquisar_txt`);

              await resetAndGetInformation(C6Bank);
              const result: IUsersTicketsOutput = await persistUserAndPassword(
                row,
                AuthCreate
              );
              outputResult.push(result);
            } catch (ex) {
              logger.error(ex);
            }
          } else {
            logger.info("Entrou no reset sem ativar");
            await resetAndGetInformation(C6Bank);
            const result: IUsersTicketsOutput = await persistUserAndPassword(
              row,
              AuthCreate
            );
            outputResult.push(result);
          }
        } catch (error) {
          AuthCreate.messageDialog = ["Usuário não localizado"];
          AuthCreate.created = false;
          const result: IUsersTicketsOutput = await persistUserAndPassword(
            row,
            AuthCreate
          );
          outputResult.push(result);
        }
      } catch (error: any) {
        logger.error(error);
      }
    }
  }

  logger.info("Finalizado processo de Reinicialização");
  await C6Bank.close();
  return outputResult;
}

async function persistUserAndPassword(
  row: IUsersTickets,
  data: IAuthCreate
): Promise<IUsersTicketsOutput> {
  const payloadItem: IUsersTickets = {
    ...row,
    USERNAME: data.user,
    PASSWORD: data.pwd,
    INFORMATIONS: data.messageDialog[0],
    STATUS: data.created ? "finalizado com sucesso" : "finalizado sem sucesso",
  };
  const response = await service.update(row.SYS_ID, payloadItem);
  return response;
}

export {
  createUserC6BankRequest,
  resetUserC6BankRequest,
  resetUserC6Bank,
  createUserC6Bank,
};
