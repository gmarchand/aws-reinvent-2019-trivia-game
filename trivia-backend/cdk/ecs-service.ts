#!/usr/bin/env node
import { CertificateRef } from '@aws-cdk/aws-certificatemanager';
import { VpcNetwork } from '@aws-cdk/aws-ec2';
import { Cluster, ContainerImage, LoadBalancedFargateService} from '@aws-cdk/aws-ecs';
import { HostedZoneNameRef } from '@aws-cdk/aws-route53';
import cdk = require('@aws-cdk/cdk');

interface TriviaBackendStackProps extends cdk.StackProps {
  domainName: string;
  domainZone: string;
}

class TriviaBackendStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: TriviaBackendStackProps) {
    super(parent, name, props);

    const vpc = new VpcNetwork(this, 'VPC', { maxAZs: 2 });
    const cluster = new Cluster(this, 'Cluster', { vpc });

    const cert = new cdk.SSMParameterProvider(this, { parameterName: 'CertificateArn-' + props.domainName });

    new LoadBalancedFargateService(this, 'Service', {
      cluster: cluster,
      image: ContainerImage.fromAsset(this, 'Image', { directory: '../' }),
      desiredCount: 3,
      domainName: props.domainName,
      domainZone: HostedZoneNameRef.fromName(this, 'Domain', props.domainZone),
      certificate: CertificateRef.import(this, 'Cert', { certificateArn: cert.parameterValue() })
    });
  }
}

const app = new cdk.App();
new TriviaBackendStack(app, 'TriviaBackendTest', {
    domainName: 'api-test.reinvent-trivia.com',
    domainZone: 'reinvent-trivia.com'
});
new TriviaBackendStack(app, 'TriviaBackendProd', {
  domainName: 'api.reinvent-trivia.com',
  domainZone: 'reinvent-trivia.com'
});
app.run();