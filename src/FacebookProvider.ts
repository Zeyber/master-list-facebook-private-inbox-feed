import { ProviderOptions, PuppeteerProvider } from "@master-list/core";
import { loginWithFacebook } from "./facebook.utils";

export interface FacebookOptions extends ProviderOptions {
  email: string;
  password: string;
  /**
   * Scroll message threads this number of times to load more threads.
   */
  scrollChatsCount?: number;
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

      for (let i = 0; i < this.options.scrollChatsCount; i++) {
        await this.scrollToChatsBottom();
      }
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

          await this.page.waitForSelector('[aria-valuetext="Loading..."]', {
            hidden: true,
          });

          await this.page.waitForTimeout(5000);

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

  /**
   * Scoll to bottom of threads list in DOM to load more threads.
   */
  async scrollToChatsBottom(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const threadList = await this.page.waitForSelector(
          '[aria-label="Chats"]'
        );
        const threads = await threadList.$$('[role="row"]');
        if (threads.length) {
          await this.page.evaluate(
            (el) => el.scrollIntoView(),
            threads[threads.length - 1]
          );

          await this.page.waitForSelector('[aria-valuetext="Loading..."]', {
            timeout: 10000,
          });

          await this.page.waitForTimeout(1000);

          await this.page.waitForSelector('[aria-valuetext="Loading..."]', {
            hidden: true,
          });

          await this.page.waitForTimeout(1000);
        }
      } catch (e) {
        reject(e);
      }

      resolve();
    });
  }
}
