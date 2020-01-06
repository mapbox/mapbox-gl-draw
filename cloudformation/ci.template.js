const cf = require('@mapbox/cloudfriend');

module.exports = {
  Resources: {
    User: {
      Type: 'AWS::IAM::User',
      Properties: {
        Policies: [
          {
            "PolicyName": "list",
            "PolicyDocument": {
              "Statement": [
                {
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Effect": "Allow",
                  "Resource": [
                    "arn:aws:s3:::mapbox-gl-js"
                  ]
                }
              ]
            }
          },
          {
            PolicyName: 'main',
            PolicyDocument: {
              Statement: [
                {
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectAcl",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Effect": "Allow",
                  "Resource": [
                    "arn:aws:s3:::mapbox-gl-js/plugins/mapbox-gl-draw/*"
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    AccessKey: {
      Type: 'AWS::IAM::AccessKey',
      Properties: {
        UserName: cf.ref('User')
      }
    }
  },
  Outputs: {
    AccessKeyId: { Value: cf.ref('AccessKey') },
    SecretAccessKey: { Value: cf.getAtt('AccessKey', 'SecretAccessKey') }
  }
};
