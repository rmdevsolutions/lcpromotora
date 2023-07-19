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
  await page.waitForSelector(selectors.PAN_LOADING, {
    hidden: true,
  });
  return true;
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
    await page.waitForSelector(selectors.PAN_PROPOSTA_ID);
    await page.click(selectors.PAN_PROPOSTA_ID);

    await page.click(selectors.PAN_CONTRATO_OPERACOES);
    await page.waitForSelector(selectors.PAN_CADASTRO);

    await driver.navigate(selectors.PAN_MANUTENCAO_USUARIO_LINK);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // até aqui ok.
    //await waitLoading();

    await page.waitForSelector(selectors.PAN_CAD_CPF);
    console.log("localizou o campo");

    await driver.say(selectors.PAN_CAD_CPF, CreateProcessInformation.identity);
    await driver.say(selectors.PAN_CAD_NAME, CreateProcessInformation.name);
    await driver.say(selectors.PAN_CAD_EMAIL, CreateProcessInformation.email);
    await driver.say(
      selectors.PAN_CAD_NASCIMENTO,
      CreateProcessInformation.birth
    );
    await driver.say(selectors.PAN_CAD_CEP, CreateProcessInformation.cep); // colocar espera por loading
    //falta perfil de acesso
    //regime só aparece após clicar em perfil de acesso
    await driver.say(selectors.PAN_CAD_NUM, CreateProcessInformation.number);
    await driver.say(selectors.PAN_CAD_DDD, CreateProcessInformation.ddd);
    await driver.say(selectors.PAN_CAD_TEL, CreateProcessInformation.telphone);
    await driver.say(selectors.PAN_CAD_MAE, CreateProcessInformation.mother);
    await driver.say(
      selectors.PAN_CAD_PERFIL_ACESSO,
      CreateProcessInformation.accessProfile
    );
    await driver.say(
      selectors.PAN_CAD_PROMOTORA,
      CreateProcessInformation.prosecutor
    );
    await driver.say(
      selectors.PAN_CAD_REGIME_CLT,
      CreateProcessInformation.hiring
    );

    const termUpload = (await page.$(
      selectors.PAN_UPLOAD_TERMO
    )) as ElementHandle<HTMLInputElement>;
    await termUpload.uploadFile("caminho");

    const docUpload = (await page.$(
      selectors.PAN_UPLOAD_DOC
    )) as ElementHandle<HTMLInputElement>;
    await docUpload.uploadFile("caminho");

    await page.click(selectors.PAN_CONFIRMAR);
  } catch (error) {
    console.log(error);
    return error;
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

export { initPan, insertTokenRequest, createUserPanRequest };
