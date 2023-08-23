import { Injectable } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import { loginWithFacebook } from './facebook.utils';
import { getBrowser } from './puppeteer.utils';
import { of } from 'rxjs';

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
  initialized = false;

  async initialize() {
    // this.browser = this.options?.browser || (await getBrowser());
    this.initialized = false;
    this.browser = await getBrowser();
    this.page = await this.browser.newPage();

    // Disable timeout for slower devices
    this.page.setDefaultNavigationTimeout(0);
    this.page.setDefaultTimeout(0);

    const loggedIn = await this.login();
    if (loggedIn) {
      for (let i = 0; i < this.options.scrollChatsCount; i++) {
        await this.scrollToChatsBottom();
      }

      this.initialized = true;

      console.log('Facebook initialized.');
      return;
    }

    this.reinitialize();
  }

  getData() {
    if (this.initialized) {
      return this.getChats();
    } else {
      return of({
        data: [{ message: 'Facebook feed not initialized', icon: ICON_PATH }],
      });
    }
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

          await this.page.goto('https://facebook.com/messages/new', {
            waitUntil: ['load', 'networkidle2'],
          });

          await this.page.waitForSelector('[aria-valuetext="Loading..."]', {
            hidden: true,
          });

          await this.page.waitForTimeout(5000);

          resolve(true);
        })();
      } catch (e) {
        console.error(e);
        this.reinitialize();
        reject(false);
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
          console.error(e);
          this.reinitialize();
          resolve({
            data: [
              {
                message: 'Critical error occurred. Reinitializing...',
                icon: ICON_PATH,
              },
            ],
          });
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

  reinitialize() {
    this.initialized = false;
    this.browser?.close();
    console.log('Reinitializing in 30 seconds...');
    setTimeout(() => this.initialize(), 30000);
  }
}
