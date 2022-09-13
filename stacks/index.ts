import * as sst from '@serverless-stack/resources';
import DbStack from './DbStack';
import ScraperStack from './ScraperStack';

export default function main(app: sst.App): void {
    // Set default runtime for all functions
    app.setDefaultFunctionProps({
        runtime: 'nodejs12.x',
    });

    // const dbStack = new DbStack(app, 'db', {});
    const scraper = new ScraperStack(app, 'scraper', {});
}
