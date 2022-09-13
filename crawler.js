/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const chromium = require('chrome-aws-lambda');

const pageURL = process.env.TARGET_URL;
const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

exports.handler = async (event, context) => {
    let result = null;
    let browser = null;

    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        let page = await browser.newPage();
        await page.setUserAgent(agent);

        console.log('Navigating to page: ', pageURL);

        await page.goto(pageURL);
        const buffer = await page.screenshot();
        result = await page.title();

        // upload the image using the current timestamp as filename

        await page.close();
        await browser.close();
    } catch (error) {
        console.log(error);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }

    return result;
};
