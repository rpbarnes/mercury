import { Api, App, Stack, StackProps, Function } from '@serverless-stack/resources';
import { Duration } from 'aws-cdk-lib';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';

export type ScraperStackProps = StackProps & {
    // dbStack: DbStack;
};

export default class ScraperStack extends Stack {
    constructor(scope: App, id: string, props: ScraperStackProps) {
        super(scope, id, props);

        const crawler = new Function(this, 'crawler', {
            handler: './src/crawler/instagram.handler',
            srcPath: './',
            layers: ['arn:aws:lambda:us-west-2:764866452798:layer:chrome-aws-lambda:22'],
            bundle: {
                externalModules: ['chrome-aws-lambda'],
            },
        });
    }
}
