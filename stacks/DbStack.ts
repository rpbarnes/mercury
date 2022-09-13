import { App, RDS, Stack, StackProps } from "@serverless-stack/resources";
import { InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Key } from "aws-cdk-lib/aws-kms";
import { AuroraMysqlEngineVersion, DatabaseCluster, DatabaseClusterEngine, DatabaseInstance, DatabaseInstanceEngine } from "aws-cdk-lib/aws-rds";

export default class DbStack extends Stack {
  public readonly cluster: DatabaseCluster;
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "vpc", { natGateways: 0 });

    const dbSecurityGroup = new SecurityGroup(this, "DbSecurityGroup", {
      vpc: vpc,
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(3306), "Db connection from anything");

    this.cluster = new DatabaseCluster(this, "Database", {
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_01_0,
      }),
      storageEncrypted: true,
      storageEncryptionKey: new Key(this, "encryptionKey"),
      iamAuthentication: true,
      deletionProtection: true,

      instanceProps: {
        securityGroups: [dbSecurityGroup],
        publiclyAccessible: true,
        vpc: vpc,
        vpcSubnets: {
          subnetType: SubnetType.PUBLIC,
        },
        instanceType: InstanceType.of(
          //@ts-ignore
          InstanceClass.BURSTABLE4_GRAVITON,
          InstanceSize.MEDIUM
        ),
      },
      instances: 1,
    });

    this.addOutputs({
      Endpoint: this.cluster.clusterEndpoint.hostname,
      Port: this.cluster.clusterEndpoint.port.toString(),
      SecretARN: this.cluster.secret?.secretArn!,
    });
  }
}
