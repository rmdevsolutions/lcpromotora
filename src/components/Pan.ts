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
  await driver.getPage().on("dialog", async (dialog) => {
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
      btnSelector: "#formulario > app-login-form  mahoe-button > button",
      usrSelector: `input[placeholder="Digite seu CPF"]`,
      pwdSelector: `input[placeholder="Digite sua senha"]`,
      partnerSelector: `#form-partner-value`,
      password: "82Alegria@@",
      user: "02275010394",
      partner: "",
      timeout: 60,
    };

    try {
      await driver.getPage().waitForSelector(Auth.usrSelector);
      await driver.getPage().type(Auth.usrSelector, Auth.user);
      await driver.getPage().select(Auth.partnerSelector, Auth.partner);

      await driver.getPage().click(Auth.btnSelector);
      await driver.getPage().type(Auth.pwdSelector, Auth.password);
      await driver.getPage().click(Auth.btnSelector);
      await driver.getPage().waitForNavigation();
      return true;
    } catch (error) {
      return false;
    }
  } catch (error: any) {
    return false;
  }
}

async function createUserPan(driver: Puppeteer) {
  const auth = await AuthLogin(driver);
  if (auth) {
    await driver.getPage().waitForSelector(`#btnConfirmar_txt`);

    await driver.getPage().type(``, "");
  }
}
