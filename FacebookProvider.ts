import { ProviderOptions, PuppeteerProvider } from "master-list";
import fs = require("fs");
import { loginWithFacebook } from "./facebook.utils";

export interface FacebookOptions extends ProviderOptions {
  email: string;
  password: string;
}

export const defaultOptions: ProviderOptions = {
  providerName: "Facebook",
};

export class FacebookProvider extends PuppeteerProvider {
  constructor(public options: FacebookOptions) {
    super({
      ...defaultOptions,
      ...options,
    });
  }

  initialize(): Promise<boolean> {
    return super.initialize(async () => {
      await this.login();
    });
  }

  reload() {
    return super.reload(async () => {
      return await this.getChats();
    });
  }

  async login() {
    return new Promise(async (resolve, reject) => {
      try {
        await (async () => {
          await loginWithFacebook({
            page: this.page,
            email: this.options.email,
            password: this.options.password,
          });

          await this.page.goto("https://facebook.com/messages/t/", {
            waitUntil: ["load", "networkidle2"],
          });

          resolve(true);
        })();
      } catch (e) {
        reject(e);
      }
    });
  }

  async getChats(): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      await (async () => {
        try {
          const threadList = await this.page.waitForSelector(
            '[aria-label="Chats"]'
          );
          const threads = await threadList.$$('[role="row"]');
          if (threads.length) {
            const items = [];
            for (const thread of threads) {
              const unread = await thread.$('[aria-label="Mark as read"]');
              if (unread) {
                const threadText: string = await this.page.evaluate(
                  (el) => el.innerText,
                  thread
                );
                const name = threadText.split("\n")[0];
                items.push(name);
              }
            }
            resolve(items);
          }
        } catch (e) {
          reject(e);
        }
      })();
    });
  }
}
