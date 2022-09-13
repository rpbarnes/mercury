import { getBrowser } from './browser';

const pageURL = 'https://www.instagram.com/therock/?hl=en';
const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

export const handler = async (event: any) => {
    let result = null;
    console.log('before');
    let browser = await getBrowser();
    console.log('here');

    try {
        let page = await browser.newPage();
        await page.setUserAgent(agent);

        console.log('Navigating to page: ', pageURL);

        page.on('response', async (response) => {
            // console.log(JSON.stringify(response, null, 2));
            try {
                const url: string = response.url();
                const headers = response.headers();
                if (url.startsWith('https://i.instagram.com/api/v1/users/web_profile_info/?username=')) {
                    // console.log(headers);
                    console.log(response.url());
                    // console.log(response);
                    console.log(JSON.stringify(await response.json(), null, 4));
                    console.log('\n\n');
                }
            } catch (err) {
                console.error(err, 'something here');
            }
        });

        const response = await page.goto(pageURL, { waitUntil: 'networkidle0' });
        // console.log(await response?.text(), 'html response from page');
        // let bodyHTML = await page.evaluate((document) =>  document.documentElement.outerHTML);
        // console.log(await page.content());
        const buffer = await page.screenshot();
        result = await page.title();
        console.log(result);

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
