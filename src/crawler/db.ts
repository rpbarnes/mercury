import { PrismaClient } from '@prisma/client';
const secretJson = JSON.parse(process.env.DB_SECRET ?? '');

// const connString = `mysql://${secretJson.username || 'admin'}:${secretJson.password}@${process.env.DATABASE_URL}:3306/creator`;
const connString =
    'mysql://admin:8wVc^cSkJvm_NW0_dhC9um.sNQxPg-@dev-mercury-db-databaseinstance1844f58fd-mtmij5jqeezt.c6xjpykgtcfx.us-west-2.rds.amazonaws.com:3306/creator';

export const db = new PrismaClient({
    datasources: {
        db: {
            url: connString,
        },
    },
    // log: ['query', 'info'],
});

//@ts-ignore
// // db.$on('query', (e) => {
// //     //@ts-ignore
// //     console.log('Query: ' + e.query);
// //     //@ts-ignore
// //     console.log('Params: ' + e.params);
// //     //@ts-ignore
// //     console.log('Duration: ' + e.duration + 'ms');
// });
