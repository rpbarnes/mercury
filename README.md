# Getting Started with Unwrap Service

This package contains Infrastructure as Code, in the form of [AWS Cloud Development Kit](https://docs.aws.amazon.com/cdk/v2/guide/home.html) and [Serverless Stack](https://docs.serverless-stack.com/). This IaC deploys cloud resources to an AWS accound defined by your local aws-cli.

Along with the infrastructure this package also deploys all the application code running on that infrastructure. Currently this is just in the form of Lambda functions. However, in the future I'd like it to deploy our NLP code to SageMaker and Fargate.

This package currently deploys:

-   Scrapers (Lambda Python & Typescript) - defined in `src/scrapers`
-   GraphQL API (Lambda Typescript) - defined in `src/service`
-   RDS Cluster (Aurora MySql)
-   NLP jobs (containers on AWS Batch) - defined in `nlp/*`

All of the 'stacks' are defined in `stacks`. This is where the IaC lives. Check it out!

## Installation

### install npm packages

```bash
npm install
```

### setup python

You need to install a rust compiler....

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Select (1) and let it install. Then restart your shell.

```python
import nltk
nltk.download('punkt')
```

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Note for local development on lambda it's necessary to have a local python environment that has all the packages installed that you want to use. This is because when testing against the lambda function you're writing, traffic going to the lambda is actually being redirected to your local machine.

In future, Franco, it might make sense to use an AWS region closer to Argentina, probably Sau Paulo. Right now you're traffic is being routed all the way to Ohio and back multiple times not sure how slow that is.

### Setting up Credentials for AWS

When you deploy this stack it'll deploy all cloud resources that run our service, at least that's the goal. To do this with out making a huge mess each developer has their own aws account.

If you don't have an account setup yet ping Barnes, he'll setup an account up for you if it's not already.

Once you have an account you need to setup an IAM User for programatic access [directions](https://serverless-stack.com/chapters/create-an-iam-user.html)

Once you have an IAM User with programatic access, configure the aws-cli [directions](https://serverless-stack.com/chapters/configure-the-aws-cli.html).

### ENV File

For now you're going to need a local .env file to control what DB your application is pointed at. Contact Barnes for a copy of his. By default your application will point at your development DB. This stack will deploy a tiny RDS cluster with one instance to your development environment. You can copy the prod DB schema to your dev env DB if you wish (see below).

## Development

To start the debug / development stack

```bash
npm run start
```

-   the first time this is run you'll get prompted

```
Look like you’re running sst for the first time in this directory. Please enter a stage name you’d like to use locally. Or hit enter to use the one based on your AWS credentials (*-dev):
```

just hit enter. This will deploy a development stack to your own AWS account. This will take a while. Once it's done it'll show you outputs and also give you a console to test your stack with https://console.serverless-stack.com/unwrap-service/dev/local

When running this command, any request to your lambda functions gets routed from API GateWay -> Lambda -> your local dev maching -> Lambda -> API Gateway -> Client. If you're just trying to test / develop against frontend codes it's faster to setup the development stack without the local debug. To do that run

```bash
npm run deploy
```

This deploys all infrastructure in a 'production' configuration. All lambda traffic gets handled within the lambda it self.

## Copying Production DB data into your development DB

This is optional. For now you can also point your service to the production DB with an env file. If you want to use your dev db run these commands

This is going to move a bit of data. The commands below are for running on your local machine assuming you have the [ssh tunneling](https://docs.google.com/document/d/1IdMmIZ9HM25P66_Pos0d2SIiHGb6sRKccDOiVTU5KKY/edit) setup.

First pull down the sql file from the production db

```bash
mysqldump -h 127.0.0.1 -u admin -p --databases --set-gtid-purged=OFF unwrap_v2> sqldump.sql
```

This will require a password. The `ssh tunnel` doc above has instructions for how to find the password if you don't have it already.

Then upload the `sqldump.sql` file to your development db.

```bash
mysql -h <DEV_DB_URL> -u admin -p < sqldump.sql
```

You need to get your `DEV_DB_URL` and password from your development AWS account. It's the same instructions for the password you used above just different AWS account.

## Handling DB Changes

When a field on our DB changes, someone adds a column or new FK constraint or new table etc... We want those changes reflected in our codes. With [Prisma](https://www.prisma.io/docs/) we can do that through the [`db pull`](https://www.prisma.io/docs/reference/api-reference/command-reference#db-pull) command, this pulls in the schema of the DB we're using and compiles a file `prisma/schema.prisma` (check it out if your curious). This local schema file lets us write typescript against the db tables and if someone made a change that breaks our code typescript will tell us.

To rebuild the local schema file run

```bash
npm run regenerate
```

Then run to build sst
```bash
npm run build
```

Also Restart the TS Server on VSCode. <CMD><SHIFT><P> select 'Typescript: Restart TS Server'.

This is doing a lot more than pulling in the local schema. This is first clearing our our node modules, reinstalling all packages, pulling in the schema, building all typescript types off of the schema, and building the sst packages. ** Note, make sure you have docker running for this command **.

There's probably a lighter weight way to do this, I just haven't spent the time figuring it out. Why you have to do this is SST caches a bunch of stuff for the lambda functions, amoung those is the prisma types, and if you don't clear the caches the new types wont get used.

## Deployment

When you push to main on github this will deploy automatically on our deployment server https://console.seed.run/ - ping Ryan Barnes and he'll give you log in information.

## Documentation

### GraphQL API

-   Our GraphQL api is setup on [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
-   To aid in building the GraphQL queries & mutations we're using [Pothos](https://pothos-graphql.dev/) which allows you to write way less boiler plate.
-   Our GraphQL API is also hooked up to our DB library [Prisma](https://www.prisma.io/docs/) through the [Pothos-Prisma](https://pothos-graphql.dev/docs/plugins/prisma) plugin. This allows us to quickly expose fields and relationships on our db table through our GraphQL API.

### Serverless Stack

Learn more about the Serverless Stack.

-   [Docs](https://docs.serverless-stack.com)
-   [@serverless-stack/cli](https://docs.serverless-stack.com/packages/cli)
-   [@serverless-stack/resources](https://docs.serverless-stack.com/packages/resources)

## Community

[Follow us on Twitter](https://twitter.com/ServerlessStack) or [post on our forums](https://discourse.serverless-stack.com).
