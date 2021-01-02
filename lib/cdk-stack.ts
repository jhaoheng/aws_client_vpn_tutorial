import { CfnEC2Fleet } from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'
import { CfnOutput } from '@aws-cdk/core';
import * as dotenv from "dotenv";

/*
server cert - 
generate acmArn, refer : https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/client-authentication.html#mutual
 */
dotenv.config();
export const acmArn = process.env.acmArn!;

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE, // Subnet that routes to the internet, but not vice versa.
        },
        {
          cidrMask: 27,
          name: 'cvpn',
          subnetType: ec2.SubnetType.ISOLATED, // Isolated Subnets do not route traffic to the Internet (in this VPC).
        }
      ]
    })

    // create vpn endpoint
    const vpnEndpoint = new ec2.CfnClientVpnEndpoint(this, 'Endpoint', {
      authenticationOptions: [
        {
          type: 'certificate-authentication',
          mutualAuthentication: {
            clientRootCertificateChainArn: acmArn
          }
        }
      ],
      clientCidrBlock: '10.0.252.0/22',
      connectionLogOptions: {
        enabled: false
      },
      serverCertificateArn: acmArn,
      splitTunnel: true // for do not want all user traffic to route through the Client VPN endpoint.
    })

    // build VpnEndpoint association, for connection between Vpc Subnet and ClientVpnEndpoint
    const vpnAssociation = new ec2.CfnClientVpnTargetNetworkAssociation(this, 'VpnEndpointAssoc', {
      clientVpnEndpointId: vpnEndpoint.ref,
      subnetId: vpc.selectSubnets({
        subnetGroupName: 'cvpn'
      }).subnetIds[0]
    })

    // build VpnEndpoint authorization
    const vpnAuthorization = new ec2.CfnClientVpnAuthorizationRule(this, 'vpnAuthorization', {
      clientVpnEndpointId: vpnEndpoint.ref,
      targetNetworkCidr: vpc.vpcCidrBlock,
      authorizeAllGroups: true
    })
    //
    new CfnOutput(this, 'vpnEndpointID', {value: vpnEndpoint.ref})

    /* 
    Build EC2 for test
    */
    // build EC2
    const ec2Instance = new ec2.Instance(this, 'PingMe', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      vpc
    })
    // build EC2 security
    ec2Instance.connections.allowFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.icmpPing())
    // output EC2 ip
    new CfnOutput(this, 'PingMeIP', {value: ec2Instance.instancePrivateIp})
  }
}
