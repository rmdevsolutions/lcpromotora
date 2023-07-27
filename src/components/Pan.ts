import { html, load } from "cheerio";
import { Request, Response, NextFunction } from "express";
import Puppeteer from "../models/Puppeteer";
import * as service from "../services/UsersTickets";
import UsersTickets, {
  IUsersTickets,
  IUsersTicketsOutput,
} from "../models/UsersTickets";
import { ElementHandle, Frame, Page } from "puppeteer";
import logger from "../logger";
const dotenv = require("dotenv");
dotenv.config();

const selectors = process.env;
let driver: Puppeteer = null;
let page: Page = null;

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

async function AuthLogin(driver: Puppeteer) {
  await page.on("dialog", async (dialog) => {
    const msgUserConected = `Usuário já autenticado em outra estação. Deseja desconectar-se da estação e conectar-se através desta?`;
    if (dialog.message() !== msgUserConected) {
      AuthCreate.messageDialog.push(dialog.message());
    }
    await dialog.accept();
  });

  try {
    await driver.navigate(
      "https://panconsig.pansolucoes.com.br/FIMENU/Login/AC.UI.LOGIN.aspx"
    );

    const Auth = {
      btnSelector:
        "#formulario > app-login-form > form > div.formulario__botoes > div > mahoe-button",
      usrSelector: `input[placeholder="Digite seu CPF"]`,
      pwdSelector: `input[placeholder="Digite sua senha"]`,
      partnerSelector: `#form-partner-value`,
      password: "82Alegria@@",
      user: "02275010394",
      partner: "",
      timeout: 60,
    };

    try {
      await page.waitForSelector(Auth.usrSelector);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await page.click(`button[id="onetrust-accept-btn-handler"]`);
      } catch (error) {}
      await page.type(Auth.usrSelector, Auth.user);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.waitForSelector(`mahoe-loader.hydrated`, {
        hidden: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.evaluate((inputSelector) => {
        const input = document.querySelector(inputSelector) as HTMLElement;
        input.click();
      }, selectors.PAN_PARTNER_VALUE);

      //   await page.waitForSelector(selectors.PAN_PARTNER_VALUE);
      //   await page.click(selectors.PAN_PARTNER_VALUE);

      await page.click(Auth.btnSelector);

      await page.waitForSelector(Auth.pwdSelector);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.type(Auth.pwdSelector, Auth.password);
      await page.click(Auth.btnSelector);
      await page.waitForNavigation();
      return true;
    } catch (error) {
      return false;
    }
  } catch (error: any) {
    return false;
  }
}

async function createInstancePan() {
  driver = new Puppeteer();
  await driver.initialize();
  page = driver.getPage();
  const auth = await AuthLogin(driver);
  if (auth) {
    await page.waitForSelector(selectors.PAN_CONFIRM_TOKEN);
    return { message: "success", listening: true };
  }
  return { message: "Driver não iniciado", listening: false };
}

async function insertTokenAndValid(token: string) {
  if (driver === null)
    return { message: "Driver não iniciado", listening: false };

  try {
    await page.waitForSelector(selectors.PAN_TOKEN);
    await page.type(selectors.PAN_TOKEN, token);
    await page.click(selectors.PAN_CONFIRM_TOKEN);

    await page.waitForSelector(selectors.PAN_PROPOSTA_ID);
    return { message: "success", listening: true };
  } catch (error) {
    return { message: error, listening: false };
  }
}

async function waitLoading() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.waitForFunction(
    (selector) => {
      const element = document.querySelector(selector);
      return !element || window.getComputedStyle(element).display === "none";
    },
    {},
    selectors.PAN_LOADING
  );
  return true;
}

async function getScreen(req: Request, res: Response) {
  const screenshotBase64 = await driver
    .getPage()
    .screenshot({ encoding: "base64" });

  // res.set("Content-Type", "image/png");
  res.send(screenshotBase64);
}

async function startCreationProcess() {
  let CreateProcessInformation = {
    identity: "04517654354",
    name: "USUARIO TESTE",
    email: "usuarios@lcpromotora.com.br",
    birth: "19/01/1993",
    cep: "65051210,",
    number: "1",
    ddd: "98",
    telphone: "987436947",
    mother: "MAE USUARIO TESTE",
    accessProfile: selectors.PAN_CAD_PERFIL_ACESSO_VALUE,
    prosecutor: selectors.PAN_CAD_PROMOTORA_VALUE,
    hiring: selectors.PAN_CAD_REGIME_CLT_VALUE,
    termUpload: "",
    docUpload: "",
  };

  if (driver === null)
    return { message: "Driver não iniciado", listening: false };

  try {
    const docDownload = await getContractClickSign(
      `${CreateProcessInformation.name} - PAN`
    );
    if (!docDownload)
      return { message: "Cliente não possui Termo Assinado", listening: false };
  } catch (error) {}

  try {
    await page.waitForSelector(selectors.PAN_PROPOSTA_ID);
    await page.click(selectors.PAN_PROPOSTA_ID);

    await new Promise((resolve) => setTimeout(resolve, 500)); // até aqui ok.
    await page.click(selectors.PAN_CONTRATO_OPERACOES);
    await page.waitForSelector(selectors.PAN_CADASTRO);

    await driver.navigate(selectors.PAN_MANUTENCAO_USUARIO_LINK);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // até aqui ok.
    //await waitLoading();

    await page.waitForSelector(selectors.PAN_CAD_CPF);
    console.log("localizou o campo");

    await driver.say(selectors.PAN_CAD_CPF, CreateProcessInformation.identity);
    await page.click(selectors.PAN_CAD_NAME);
    await waitLoading();
    await driver.say(selectors.PAN_CAD_NAME, CreateProcessInformation.name);
    await waitLoading();
    await driver.say(selectors.PAN_CAD_EMAIL, CreateProcessInformation.email);
    await waitLoading();
    await driver.say(
      selectors.PAN_CAD_NASCIMENTO,
      CreateProcessInformation.birth
    );
    await driver.say(selectors.PAN_CAD_CEP, CreateProcessInformation.cep); // colocar espera por loading
    await page.click(selectors.PAN_CAD_NUM);
    await waitLoading();
    //falta perfil de acesso
    //regime só aparece após clicar em perfil de acesso
    await driver.say(selectors.PAN_CAD_NUM, CreateProcessInformation.number);
    await driver.say(selectors.PAN_CAD_DDD, CreateProcessInformation.ddd);
    await driver.say(selectors.PAN_CAD_TEL, CreateProcessInformation.telphone);
    await driver.say(selectors.PAN_CAD_MAE, CreateProcessInformation.mother);
    await waitLoading();

    await driver.selectOption(
      selectors.PAN_CAD_PERFIL_ACESSO,
      CreateProcessInformation.accessProfile
    );
    await waitLoading();
    await driver.selectOption(
      selectors.PAN_CAD_PROMOTORA,
      CreateProcessInformation.prosecutor
    );
    await waitLoading();
    await driver.selectOption(
      selectors.PAN_CAD_REGIME_CLT,
      CreateProcessInformation.hiring
    );
    await waitLoading();

    const termUpload = (await page.$(
      selectors.PAN_UPLOAD_TERMO
    )) as ElementHandle<HTMLInputElement>;
    await termUpload.uploadFile(
      "C:\\Users\\u11001\\Pictures\\tarde natalina.png"
    );

    await waitLoading();
    await driver.selectOption(selectors.PAN_DOC, "1");

    const docUpload = (await page.$(
      selectors.PAN_UPLOAD_DOC
    )) as ElementHandle<HTMLInputElement>;
    await docUpload.uploadFile(
      "C:\\Users\\u11001\\Pictures\\tarde natalina.png"
    );

    // await page.click(selectors.PAN_CONFIRMAR);
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getContractClickSign(name: string) {
  const driver = new Puppeteer();
  await driver.initialize();

  await driver.navigate(selectors.CLICK_URL);

  try {
    await driver.getPage().waitForSelector(selectors.CLICK_EMAIL);
    await driver.say(selectors.CLICK_EMAIL, "rmtec9@gmail.com");
    await driver.say(selectors.CLICK_SENHA, "061415Ma@");
    await driver.getPage().click(selectors.CLICK_ENTRAR_BTN);
    await driver.getPage().waitForSelector(selectors.CLICK_DASH_WAIT);
    await driver.navigate(selectors.CLICK_URL_CLOSED);
    await driver.getPage().waitForSelector(selectors.CLICK_CLOSED_PESQUISAR);
    await driver.say(selectors.CLICK_CLOSED_PESQUISAR, name);
    await driver.getPage().click(selectors.CLICK_CLOSED_PESQUISAR_BTN);
    await driver.getPage().waitForSelector(selectors.CLICK_DOWNLOAD_ASSINADO);

    const quantidade = await driver.getPage().evaluate((seletor) => {
      const element = document.querySelector(seletor);
      return element ? element.textContent : null;
    }, selectors.CLICK_CONTADOR_ASSINATURA);

    if (quantidade.toString().trim() === "4/4 Assinaturas") {
      await driver.getPage().click(selectors.CLICK_ENTRAR_CONTRATOS);
      await driver.getPage().waitForSelector(selectors.CLICK_BTN_DOWNLOAD);

      const linkElement = await driver
        .getPage()
        .$(selectors.CLICK_BTN_DOWNLOAD_URL);
      const href = await linkElement.evaluate((el) => el.getAttribute("href"));
      console.log(selectors.CLICK_URL + href);
      await driver.navigate(selectors.CLICK_URL + href);
    } else {
      await driver.close();
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 15000));

    await driver.close();
    return true;
  } catch (error) {
    console.log(error);
    await driver.close();
    return false;
  }
}

async function startResetProcess() {
  let CreateProcessInformation = {
    identity: "04517654354",
    name: "USUARIO TESTE",
    email: "usuarios@lcpromotora.com.br",
    birth: "19/01/1993",
    cep: "65051210,",
    number: "1",
    ddd: "98",
    telphone: "987436947",
    mother: "MAE USUARIO TESTE",
    accessProfile: selectors.PAN_CAD_PERFIL_ACESSO_VALUE,
    prosecutor: selectors.PAN_CAD_PROMOTORA_VALUE,
    hiring: selectors.PAN_CAD_REGIME_CLT_VALUE,
    termUpload: "",
    docUpload: "",
  };

  if (driver === null)
    return { message: "Driver não iniciado", listening: false };
  try {
    await page.waitForSelector(selectors.PAN_PROPOSTA_ID);
    await page.click(selectors.PAN_PROPOSTA_ID);

    await new Promise((resolve) => setTimeout(resolve, 500)); // até aqui ok.
    await page.click(selectors.PAN_CONTRATO_OPERACOES);
    await page.waitForSelector(selectors.PAN_CADASTRO);

    await driver.navigate(selectors.PAN_MANUTENCAO_USUARIO_LINK);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // até aqui ok.
    //await waitLoading();

    await page.waitForSelector(selectors.PAN_CAD_CPF);
    console.log("localizou o campo");

    await driver.say(
      selectors.PAN_RESET_CPF,
      CreateProcessInformation.identity.replace(/[.-]/g, "")
    );
    await page.click(selectors.PAN_RESET_PESQUISAR);

    try {
      await page.waitForFunction(
        (cssSelector) => {
          const resultSearch = document.querySelector(cssSelector).textContent;
          return resultSearch !== "Nenhum Usuário para visualização.";
        },
        { timeout: 10000 },
        selectors.PAN_RESET_GRID_TABLE
      );

      const statusUserSelector = selectors.PAN_RESET_USER_SELECTED;

      const optionsTagA = (await page.$$(
        statusUserSelector
      )) as ElementHandle<HTMLAnchorElement>[];
      const statusUser = await optionsTagA[1].evaluate((el) => el.textContent);

      if (statusUser !== "Inativar") {
        logger.info("entrou no reset reativando");
        await optionsTagA[1].evaluate((el) => el.click());
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await page.waitForSelector(selectors.PAN_RESET_STATUS_PESQUISA);
        await page.select(selectors.PAN_RESET_STATUS_PESQUISA, "Ativo");

        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await waitLoading();

          await driver.say(
            selectors.PAN_CAD_EMAIL,
            CreateProcessInformation.email
          );

          await driver.say(selectors.PAN_CAD_DDD, CreateProcessInformation.ddd);

          await driver.say(
            selectors.PAN_CAD_TEL,
            CreateProcessInformation.telphone
          );

          await driver.say(
            selectors.PAN_CAD_NASCIMENTO,
            CreateProcessInformation.birth
          );

          await new Promise((resolve) => setTimeout(resolve, 500));
          await page.click(selectors.PAN_CONFIRMAR);
          try {
            const framePopConfirm = await waitFrameAndGetInformation(
              selectors.PAN_POPUP_AJUDA,
              driver
            );

            if (framePopConfirm !== null) {
              logger.info("modo frame localizado");
              await new Promise((resolve) => setTimeout(resolve, 500));
              await framePopConfirm.waitForSelector(selectors.PAN_RETURN_BTN);
              await framePopConfirm.click(selectors.PAN_RETURN_BTN);
            }

            await page.waitForSelector(selectors.PAN_RESET_PESQUISAR);
            await page.click(selectors.PAN_RESET_PESQUISAR);

            // await resetAndGetInformation(driver);
            // const result: IUsersTicketsOutput = await persistUserAndPassword(
            //   row,
            //   AuthCreate
            // );
            // outputResult.push(result);
          } catch (ex) {
            logger.error(ex);
          }
        } catch (error) {}
      } else {
        logger.info("Entrou no reset sem ativar");
        await resetAndGetInformation(driver);
        // const result: IUsersTicketsOutput = await persistUserAndPassword(
        //   row,
        //   AuthCreate
        // );
        // outputResult.push(result);
      }
    } catch (error) {}
  } catch (error) {}
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

async function initPan(req: Request, res: Response) {
  const result = await createInstancePan();
  res.status(200).send(result);
}

async function insertTokenRequest(req: Request, res: Response) {
  const token = req.params.token;
  const result = await insertTokenAndValid(token);
  res.send(result);
}

async function createUserPanRequest(req: Request, res: Response) {
  const result = await startCreationProcess();
  res.send(result);
}

export {
  initPan,
  insertTokenRequest,
  createUserPanRequest,
  getContractClickSign,
  getScreen,
};
