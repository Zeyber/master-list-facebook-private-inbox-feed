import { Page } from "puppeteer";

import fs = require("fs");

export interface FacebookLoginOptions {
  page: Page;
  email: string;
  password: string;
  preserveCookies?: boolean;
}

export async function loginWithFacebook(options: FacebookLoginOptions) {
  await options.page.goto("https://facebook.com/login", {
    waitUntil: ["load", "networkidle2"],
  });

  const cookieBanner = await options.page.waitForSelector(
    '[data-cookiebanner="accept_only_essential_button"]'
  );
  await cookieBanner.click();

  const emailField = await options.page.waitForSelector('[name="email"]');
  await emailField.type(options.email, { delay: 100 });

  const passwordField = await options.page.waitForSelector('[name="pass"]');
  await passwordField.type(options.password, {
    delay: 100,
  });

  const submitButton = await options.page.waitForSelector('[name="login"]');
  await submitButton.click();

  await options.page.waitForNavigation().then(async (response) => {
    if (options.preserveCookies) {
      // to get the correct cookies you need to pass the url to the cookies() method
      // use await or .then() the promise return an object with all the needed info
      const cookies = await this.page.cookies(response.url());
      // save your cookies to a file or use them in your code using fs.writeFileSync(...)

      cookies.forEach((cookie) => {
        delete Object.assign(cookie, { ["key"]: cookie["name"] })["name"];
      });

      // State is not actually used but might be nice to have handy in future.
      fs.writeFileSync(
        ".credentials/facebook-state.json",
        JSON.stringify(cookies)
      );
    }
  });
}
