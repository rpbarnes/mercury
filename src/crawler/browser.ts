import { Browser } from 'puppeteer-core';
const chromium = require('chrome-aws-lambda');

export const getBrowser = async (): Promise<Browser> => {
    let browser = null;
    try {
        browser = await chromium.puppeteer.launch({
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true,
            ignoreHTTPSErrors: true,
            args: [...chromium.args],
        });
    } catch {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            // args: ['--proxy-server=200.73.128.156:3128'],
        });
    }

    return browser;
};
