import { App, Stack, StackProps, Function } from '@serverless-stack/resources';
import { Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import DbStack from './DbStack';
import path from 'path';
import fs from 'fs-extra';

export type ScraperStackProps = StackProps & {
    dbStack: DbStack;
};

export default class ScraperStack extends Stack {
    constructor(scope: App, id: string, props: ScraperStackProps) {
        super(scope, id, props);

        const layer = createLambdaLayerForPrisma(this, scope.local);

        const crawler = new Function(this, 'crawler', {
            handler: './src/crawler/instagram.handler',
            srcPath: './',
            layers: layer
                ? ['arn:aws:lambda:us-west-2:764866452798:layer:chrome-aws-lambda:22', layer]
                : ['arn:aws:lambda:us-west-2:764866452798:layer:chrome-aws-lambda:22'],
            bundle: {
                externalModules: ['chrome-aws-lambda', '@prisma/client', '.prisma'],
            },
            timeout: 60,
            environment: {
                DATABASE_URL: props.dbStack.cluster.clusterEndpoint.hostname,
                DB_SECRET: props.dbStack.cluster.secret?.secretValue.toString()!,
            },
        });
    }
}

export const createLambdaLayerForPrisma = (stack: Stack, isLocal: boolean): LayerVersion | undefined => {
    if (!isLocal) {
        // Create a layer for production
        // This saves shipping Prisma binaries once per function
        const layerPath = '.sst/layers/test/prisma';

        // Clear out the layer path
        fs.rmSync(layerPath, { force: true, recursive: true });
        fs.mkdirSync(layerPath, { recursive: true });

        // Copy files to the layer
        const toCopy = ['node_modules/.prisma', 'node_modules/@prisma/client', 'node_modules/prisma/build'];
        for (const file of toCopy) {
            fs.copySync(file, path.join(layerPath, 'nodejs', file), {
                // Do not include binary files that aren't for AWS to save space
                filter: (src: string) => !src.endsWith('so.node') || src.includes('rhel'),
            });
        }
        const prismaLayer = new LayerVersion(stack, `PrismaLayer-${getRandomNumber()}`, {
            code: Code.fromAsset(path.resolve(layerPath)),
        });

        return prismaLayer;
    }
    return undefined;
};

/**
 * I want this to redeploy on every push. This is a HACK to make that work correctly.
 * @returns
 */
const getRandomNumber = (): number => {
    return Math.floor(Math.random() * (1000000 - 0) + 0);
};
