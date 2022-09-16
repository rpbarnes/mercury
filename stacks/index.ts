import * as sst from '@serverless-stack/resources';
import DbStack from './DbStack';
import ScraperStack from './ScraperStack';

export default function main(app: sst.App): void {
    // Set default runtime for all functions
    app.setDefaultFunctionProps({
        runtime: 'nodejs14.x',
    });

    const db = new DbStack(app, 'db', {});
    const scraper = new ScraperStack(app, 'scraper', { dbStack: db });
}
