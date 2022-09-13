import { Browser } from 'puppeteer-core';
const chromium = require('chrome-aws-lambda');

export const getBrowser = async (): Promise<Browser> => {
    let browser = null;
    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
    } catch {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        });
    }

    return browser;
};
