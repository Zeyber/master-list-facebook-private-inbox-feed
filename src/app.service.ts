import { Injectable } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import { loginWithFacebook } from './facebook.utils';
import { getBrowser } from './puppeteer.utils';

export interface FacebookOptions {
  email: string;
  password: string;
  /**
   * Scroll message threads this number of times to load more threads.
   */
  scrollChatsCount?: number;
  /**
   *  Puppeteer Browser instance to be used. Creates a new Browser if empty.
   */
  browser?: Browser;
}

export const defaultOptions: FacebookOptions = {
  email: process.env.FACEBOOK_EMAIL,
  password: process.env.FACEBOOK_PASSWORD,
  scrollChatsCount: 10,
};

const ICON_PATH = '/assets/icon.png';

@Injectable()
export class AppService {
  options = {
    email: process.env.FACEBOOK_EMAIL,
    password: process.env.FACEBOOK_PASSWORD,
    scrollChatsCount: 10,
  };
  browser: Browser;
  page: Page;

  async initialize() {
    // this.browser = this.options?.browser || (await getBrowser());
    this.browser = await getBrowser();
    this.page = await this.browser.newPage();

    // Disable timeout for slower devices
    this.page.setDefaultNavigationTimeout(0);
    this.page.setDefaultTimeout(0);
    await this.login();

    for (let i = 0; i < this.options.scrollChatsCount; i++) {
      await this.scrollToChatsBottom();
    }

    console.log('Facebook initialized.');
  }

  getData() {
    return this.getChats();
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

          await this.page.goto('https://facebook.com/messages/t/', {
            waitUntil: ['load', 'networkidle2'],
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

  async getChats(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await (async () => {
        try {
          const threadList = await this.page.waitForSelector(
            '[aria-label="Chats"]',
          );
          const threads = await threadList.$$('[role="row"]');
          if (threads.length) {
            const items = [];
            for (const thread of threads) {
              const unread = await thread.$('[aria-label="Mark as read"]');
              if (unread) {
                const threadText: string = await this.page.evaluate(
                  (el) => el.innerText,
                  thread,
                );
                const name = threadText.split('\n')[0];
                items.push({ message: name, icon: ICON_PATH });
              }
            }
            resolve({ data: items });
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
          '[aria-label="Chats"]',
        );
        const threads = await threadList.$$('[role="row"]');
        if (threads.length) {
          await this.page.evaluate(
            (el) => el.scrollIntoView(),
            threads[threads.length - 1],
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
