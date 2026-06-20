#!/usr/bin/env bash
# Run once to create the S3 bucket + DynamoDB table used for Terraform remote state.
# Usage: AWS_PROFILE=your-profile bash terraform/bootstrap.sh
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
BUCKET="coffee-tea-app-tfstate"
TABLE="coffee-tea-app-tfstate-lock"

echo "Creating S3 state bucket: $BUCKET"
aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
  $( [ "$REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=$REGION" )

aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Creating DynamoDB lock table: $TABLE"
aws dynamodb create-table \
  --table-name "$TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION"

echo "Bootstrap complete."
