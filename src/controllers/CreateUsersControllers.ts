import { Request, Response } from "express";
import Puppeteer from "../models/Puppeteer";
import * as service from "../services/UsersTickets";
import UsersTickets, {
  IUsersTickets,
  IUsersTicketsOutput,
} from "../models/UsersTickets";
import { Frame } from "puppeteer";
import logger from "../logger";

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

async function authLoginC6Bank(C6Bank: Puppeteer) {
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
    messageDialog: null,
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

      for (const row of UsersTicketZero) {
        try {
          AuthCreate.created = false;
          AuthCreate.messageDialog = [];
          AuthCreate.partner = null;
          AuthCreate.pwd = null;
          AuthCreate.user = null;

          await C6Bank.navigate(
            `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Cadastro/Operador/UI.CD.ManutencaoUsuarios.aspx`
          );

          await C6Bank.getPage().waitForSelector(
            `#ctl00_Cph_FIJN1_jnInserir_txtCpf_CAMPO`
          );

          await C6Bank.say(
            `#ctl00_Cph_FIJN1_jnInserir_txtCpf_CAMPO`,
            row.SYS_IDENTITY?.replace(/[.-]/g, "")
          );

          await C6Bank.say(
            `#ctl00_Cph_FIJN1_jnInserir_txtNomeUsu_CAMPO`,
            row.SYS_CLIENT?.trim()
          );

          await C6Bank.selectOption(
            `#ctl00_Cph_FIJN1_jnInserir_cmbOrigem3_CAMPO`,
            `000128`
          );

          await C6Bank.getPage().click("#btnIncluir_txt");

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

          const iframeSelector = `#ctl00_Cph_popBoleana_frameAjuda`;

          // Wait for the frame with the specified ID
          try {
            const frame = await C6Bank.getPage().waitForFunction(
              (id) => {
                const frames = Array.from(window.frames);
                return frames.find((f) => f.frameElement?.id === id);
              },
              { timeout: 10000 },
              `ctl00_Cph_popBoleana_frameAjuda`
            );

            logger.info(frame);

            const iframeElementHandle = await C6Bank.getPage().$(
              iframeSelector
            );

            const iframeContent = await iframeElementHandle.contentFrame();

            await iframeContent.waitForSelector(`#btnOpTrue_txt`);
            await iframeContent.click(`#btnOpTrue_txt`);

            AuthCreate.user = "enviado por email";
            AuthCreate.pwd = "enviado por email";
            AuthCreate.partner = null;
            AuthCreate.messageDialog = [
              "Usuário criado com sucesso, necessário realizar biometria facial.",
            ];
            AuthCreate.created = true;
          } catch (error) {
            logger.error(error);
            AuthCreate.created = false;
          }
        } catch (error) {
          AuthCreate.created = false;
        }
        const result: IUsersTicketsOutput = await persistUserAndPassword(
          row,
          AuthCreate
        );
        outputResult.push(result);
      }
    } else {
      AuthCreate.created = false;
    }
  } catch (error: any) {
    await C6Bank.close();
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
    await new Promise((resolve) => setTimeout(resolve, 2000));
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

      const userInf = await frame.$eval(newUserSelector, (el) => el.value);
      AuthCreate.user = userInf;

      AuthCreate.partner = await frame.$eval(
        newPartnerSelector,
        (el) => el.value
      );

      const pwdInf = await frame.$eval(newPasswordSelector, (el) => el.value);

      AuthCreate.pwd = pwdInf;

      const C6BankReset = new Puppeteer();
      await C6BankReset.initialize();
      try {
        await C6BankReset.getPage().on("dialog", async (dialog) => {
          const msgUserConected = `Usuário já autenticado em outra estação. Deseja desconectar-se da estação e conectar-se através desta?`;
          if (dialog.message() !== msgUserConected) {
            AuthCreate.messageDialog.push(dialog.message());
          }

          await dialog.accept();
        });

        await C6BankReset.navigate(
          "https://c6.c6consig.com.br/WebAcesso/Login/AC.UI.LOGIN.aspx"
        );

        const AuthInformation = {
          btnSelector: "#lnkEntrar",
          usrSelector: "#EUsuario_CAMPO",
          pwdSelector: "#ESenha_CAMPO",
          password: pwdInf,
          user: userInf,
          timeout: 60,
        };

        console.log({ pwd: pwdInf, user: userInf });

        let logged: boolean = false;

        try {
          logged = await C6BankReset.AuthClickButton(AuthInformation);
          await C6BankReset.getPage().waitForSelector(`#ButtonConfirmar_txt`);
        } catch (error) {
          logged = await C6BankReset.AuthClickButton(AuthInformation);
        }

        if (logged) {
          await C6BankReset.getPage().waitForSelector(`#ButtonConfirmar_txt`);

          await C6BankReset.getPage().type(
            `input[name="AltSen1$SenhaAtual$CAMPO"]`,
            pwdInf
          );
          const newPwd = userInf?.substring(0, 6) + "Lc@2023";

          await C6BankReset.getPage().type(
            `input[name="AltSen1$NovaSenha$CAMPO"]`,
            newPwd
          );
          await C6BankReset.getPage().type(
            `input[name="AltSen1$ConfNovaSenha$CAMPO"]`,
            newPwd
          );
          await C6BankReset.getPage().click(`#ButtonConfirmar_txt`);
          await C6BankReset.close();
          AuthCreate.pwd = newPwd;
          AuthCreate.created = true;
        }
      } catch (error) {
        await C6BankReset.close();
        logger.error(error);
      }

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
          `https://c6.c6consig.com.br/WebAutorizador/MenuWeb/Cadastro/Operador/UI.CD.ManutencaoUsuarios.aspx`
        );

        await C6Bank.getPage().waitForSelector(
          `#ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_txtCampoPesq_CAMPO`
        );

        await C6Bank.getPage().waitForSelector(`#btnVoltar_txt`);

        const selectorCPF = `input[name="ctl00$Cph$FIJN1$jnAlterar$UcGridManUsu$txtCampoPesq$CAMPO"]`;
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
            `#ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_gdvUsuarios> tbody > tr:nth-child(2) > td`
          );

          const statusUserSelector = `#ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_gdvUsuarios a`;

          const optionsTagA = await C6Bank.getPage().$$(statusUserSelector);
          const statusUser = await optionsTagA[0].evaluate(
            (el) => el.textContent
          );

          if (statusUser !== "Inativar") {
            logger.info("entrou no reset reativando");
            await optionsTagA[0].evaluate((el) => el.click());
            await new Promise((resolve) => setTimeout(resolve, 1000));

            let iframeSelector = `#ctl00_Cph_popBoleana_frameAjuda`;

            let frame = await C6Bank.getPage().waitForFunction(
              (id) => {
                const frames = Array.from(window.frames);
                return frames.find((f) => f.frameElement?.id === id);
              },
              { timeout: 10000 },
              `ctl00_Cph_popBoleana_frameAjuda`
            );

            logger.info(frame);

            let iframeElementHandle = await C6Bank.getPage().$(iframeSelector);

            let iframeContent = await iframeElementHandle.contentFrame();

            await iframeContent.waitForSelector(`#btnOpTrue_txt`);
            await iframeContent.click(`#btnOpTrue_txt`);

            await new Promise((resolve) => setTimeout(resolve, 1000));

            await new Promise((resolve) => setTimeout(resolve, 1000));
            await C6Bank.getPage().waitForSelector("#ctl00_UpdPrs", {
              hidden: true,
            });

            await C6Bank.getPage().waitForSelector(
              `#ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_gdvUsuarios > tbody > tr.normal > td:nth-child(9) > input[type=image]`
            );
            await C6Bank.getPage().click(
              `#ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_gdvUsuarios > tbody > tr.normal > td:nth-child(9) > input[type=image]`
            );

            iframeSelector = `#ctl00_Cph_popBoleana_frameAjuda`;

            frame = await C6Bank.getPage().waitForFunction(
              (id) => {
                const frames = Array.from(window.frames);
                return frames.find((f) => f.frameElement?.id === id);
              },
              { timeout: 10000 },
              `ctl00_Cph_popBoleana_frameAjuda`
            );

            logger.info(frame);

            iframeElementHandle = await C6Bank.getPage().$(iframeSelector);

            iframeContent = await iframeElementHandle.contentFrame();

            await iframeContent.waitForSelector(`#btnOpTrue_txt`);
            await iframeContent.click(`#btnOpTrue_txt`);
            AuthCreate.user = "enviado por email";
            AuthCreate.pwd = "enviado por email";
            AuthCreate.created = true;
            const result: IUsersTicketsOutput = await persistUserAndPassword(
              row,
              AuthCreate
            );
            outputResult.push(result);
          } else {
            logger.info("Entrou no reset sem ativar");
            await C6Bank.getPage().waitForSelector(
              `#ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_gdvUsuarios > tbody > tr.normal > td:nth-child(9) > input[type=image]`
            );
            await C6Bank.getPage().click(
              `#ctl00_Cph_FIJN1_jnAlterar_UcGridManUsu_gdvUsuarios > tbody > tr.normal > td:nth-child(9) > input[type=image]`
            );

            const iframeSelector = `#ctl00_Cph_popBoleana_frameAjuda`;

            const frame = await C6Bank.getPage().waitForFunction(
              (id) => {
                const frames = Array.from(window.frames);
                return frames.find((f) => f.frameElement?.id === id);
              },
              { timeout: 10000 },
              `ctl00_Cph_popBoleana_frameAjuda`
            );

            logger.info(frame);

            const iframeElementHandle = await C6Bank.getPage().$(
              iframeSelector
            );

            const iframeContent = await iframeElementHandle.contentFrame();

            await iframeContent.waitForSelector(`#btnOpTrue_txt`);
            await iframeContent.click(`#btnOpTrue_txt`);

            AuthCreate.created = true;

            const result: IUsersTicketsOutput = await persistUserAndPassword(
              row,
              AuthCreate
            );
            outputResult.push(result);
          }
        } catch (error) {
          if (
            AuthCreate.messageDialog.indexOf(
              "Já existe uma solicitação em andamento para o"
            )
          ) {
            AuthCreate.created = true;
          } else {
            AuthCreate.created = false;
            AuthCreate.messageDialog = ["Usuário não localizado"];
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
    }
  }

  logger.info("Finalizado processo de Reinicialização");
  await C6Bank.close();
  return outputResult;
}

async function alterPasswordBeforeResetAndCreated(
  data: IAuthCreate
): Promise<IAuthCreate> {
  logger.info("Iniciado processo de Criação");

  const C6Bank = new Puppeteer();
  await C6Bank.initialize();

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
      password: data.pwd,
      user: data.user,
      timeout: 60,
    };

    if (await C6Bank.AuthClickButton(AuthInformation)) {
      await C6Bank.getPage().waitForSelector(`#ButtonConfirmar_txt`);

      await C6Bank.getPage().type(
        `input[name="AltSen1$SenhaAtual$CAMPO"]`,
        data.pwd
      );
      const newPwd = data.pwd?.substring(0, 6) + "Lc@2023";

      await C6Bank.getPage().type(
        `input[name="AltSen1$NovaSenha$CAMPO"]`,
        newPwd
      );
      await C6Bank.getPage().type(
        `input[name="AltSen1$ConfNovaSenha$CAMPO"]`,
        newPwd
      );
      await C6Bank.getPage().click(`#ButtonConfirmar_txt`);
      data.pwd = newPwd;

      return data;
    } else {
      return data;
    }
  } catch (error) {
    logger.error(error);
    return data;
  }
}

async function persistUserAndPassword(
  row: IUsersTickets,
  data: IAuthCreate
): Promise<IUsersTicketsOutput> {
  // const newData = await alterPasswordBeforeResetAndCreated(data);
  const payloadItem: IUsersTickets = {
    ...row,
    USERNAME: data.user,
    PASSWORD: data.pwd,
    INFORMATIONS: data.messageDialog.pop(),
    STATUS:
      data.pwd !== null && data.pwd !== ""
        ? "finalizado com sucesso"
        : "finalizado sem sucesso",
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
