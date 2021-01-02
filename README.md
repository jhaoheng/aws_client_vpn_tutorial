![architecture](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/images/architecture.png)

```bash
.
├── lib/                       <-- Main architecture
│   ├── .env.tmp               <-- Environment
│   └── cdk-stack.ts           <-- Define `vpc`, `vpnEndpoint`, `vpnAssociation`, `vpnAuthorization`, `EC2 instance`
└── bin/                       
```

- ref resource : `https://www.youtube.com/watch?v=s5u_HuUXRZ4&t=1062s`
    - Thanks AWS
    - Thanks [Pahud](https://github.com/pahud)

# build step
## 1. Mutual authentication
> https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/client-authentication.html#mutual

1. Follow the link's step
2. Only need to **Upload the server certificate**, and then get **AcmArn**
3. Change the `./lib/.env.tmp` to `.env` and fill up the **AcmArn**

## 2. CDK Deploy
1. `cdk deploy`
2. deploy done will get 
    - CdkStack.PingMeIP
    - CdkStack.vpnEndpoint

## 3. AWS VPN CLIENT
1. Download client from `https://aws.amazon.com/vpn/client-vpn-download/`
2. `aws ec2 export-client-vpn-client-configuration --client-vpn-endpoint-id $Endpoint_ID --output text > vpn_config_filename.ovpn`
    - replace **$Endpoint_ID**
3. Update the `vpn_config_filename.ovpn`, To add the client certificate and key information (mutual authentication)
    - refer link : `https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/cvpn-working-endpoints.html#cvpn-working-endpoint-export`
4. Connect using an OpenVPN client
    - `https://docs.aws.amazon.com/vpn/latest/clientvpn-user/client-vpn-connect-macos.html`
5. Test PING EC2 Private IP

## Note
- AWS Client VPN, **The self-service portal** is not available for clients that authenticate using mutual authentication.
- If VPC **maxAzs: 1**, it will get fail to ping EC2
- The price : 
    - AWS Client VPN endpoint association
    - AWS Client VPN connection