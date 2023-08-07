import puppeteer, { Browser, Page } from "puppeteer";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
const userPreferences = require("puppeteer-extra-plugin-user-preferences");

puppeteerExtra.use(StealthPlugin());

interface IAuth {
  pwdSelector: string;
  usrSelector: string;
  btnSelector: string;
  timeout: Number;
  user: string;
  password: string;
}

class Puppeteer {
  private browser: Browser | null;
  private page: Page | null;

  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize(): Promise<void> {
    puppeteerExtra.use(
      userPreferences({
        directory_upgrade: true,
        prompt_for_download: false,
        default_directory: "../downloads",
      })
    );

    this.browser = await puppeteerExtra.launch({
      args: ["--no-sandbox"],
      protocolTimeout: 0,
      headless: "new",
      // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    });

    this.page = await this.browser.newPage();

    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36"
    );
  }

  async say(id: string, text: string): Promise<void> {
    // Limpar o campo de entrada
    try {
      await this.page.click(id, { clickCount: 3 });
      await this.page.keyboard.press("Backspace");

      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.page.type(id, text);
    } catch (error) {
      console.log("Erro: ", error);
    }
  }

  async navigate(url: string): Promise<void> {
    if (!this.page)
      throw new Error("Page is not initialized. Call initialize() first.");

    await this.page.goto(url);
  }

  async WaitForNavigation(): Promise<void> {
    await this.page?.waitForNavigation();
  }

  getPage(): Page | null {
    return this.page;
  }

  async Auth(selectors: IAuth): Promise<boolean> {
    try {
      await this.erroPage();
      await this.page.waitForSelector(selectors.usrSelector);
      await this.page.type(selectors.usrSelector, selectors.user);
      await this.page.type(selectors.pwdSelector, selectors.password);
      await this.page.keyboard.press("Enter");
      await this.page.waitForNavigation();
      return true;
    } catch (error) {
      return false;
    }
  }

  async AuthClickButton(selectors: IAuth, delay?: boolean): Promise<boolean> {
    try {
      await this.erroPage();
      await this.page.waitForSelector(selectors.usrSelector);
      await this.page.type(selectors.usrSelector, selectors.user);
      await this.page.type(selectors.pwdSelector, selectors.password);

      if (delay) await new Promise((resolve) => setTimeout(resolve, 2000));

      await this.page.click(selectors.btnSelector);
      await this.page.waitForNavigation();
      return true;
    } catch (error) {
      return false;
    }
  }

  async extractTable(
    selector: string,
    length: string,
    selectorLenght: string
  ): Promise<Record<string, string>[]> {
    await this.page.waitForSelector(selectorLenght);
    await this.page.select(selectorLenght, length);

    await this.page.waitForSelector(selector);

    const tabelaData = await this.page.$$eval(`${selector} tr`, (linhas) => {
      const tabelaData: Record<string, string>[] = [];

      linhas.forEach((linha) => {
        const celulas = Array.from(linha.querySelectorAll("td"));

        const rowData: Record<string, string> = {};

        celulas.forEach((celula, indice) => {
          rowData[`col${indice + 1}`] = celula.innerText;
        });

        tabelaData.push(rowData);
      });

      return tabelaData;
    });

    return tabelaData;
  }

  async selectOption(element: string, option: string): Promise<void> {
    await this.page.waitForSelector(element);
    await this.page.select(`select${element}`, option);
  }

  async screenshot(path: string): Promise<void> {
    this.erroPage();
    await this.page.waitForNavigation();
    await this.page.screenshot({ path });
  }

  async erroPage(): Promise<void> {
    if (!this.page)
      throw new Error("Page is not initialized. Call initialize() first.");
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export default Puppeteer;
