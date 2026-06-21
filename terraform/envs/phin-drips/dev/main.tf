terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "coffee-tea-app-tfstate"
    key            = "phin-drips/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "coffee-tea-app-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = "dev"
      Store       = "phin-drips"
      Project     = "coffee-tea-app"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name       = "phin-drips-dev"
  store_slug = "phin-drips"
  store_name = "Phin Drips"
}

module "vpc" {
  source               = "../../../modules/vpc"
  name                 = local.name
  cidr                 = "10.2.0.0/16"
  azs                  = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
}

module "secrets" {
  source = "../../../modules/secrets"
  name   = local.name
  secrets = {
    SECRET_KEY            = var.secret_key
    STRIPE_SECRET_KEY     = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET = var.stripe_webhook_secret
    SQUARE_ACCESS_TOKEN   = var.square_access_token
    SQUARE_LOCATION_ID    = var.square_location_id
  }
}

module "ecs" {
  source               = "../../../modules/ecs"
  name                 = local.name
  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids
  backend_image        = var.backend_image
  secret_arn           = module.secrets.secret_arn
  store_name           = local.store_name
  store_domain         = var.store_domain
  store_slug           = local.store_slug
  app_environment      = "development"
  aws_region           = var.aws_region
  menu_s3_bucket       = var.menu_s3_bucket
  dynamodb_table_menu  = "${local.store_slug}-menu"
  dynamodb_table_deals = "${local.store_slug}-deals"
  google_maps_api_key  = var.google_maps_api_key
  ollama_base_url      = var.ollama_base_url
  ollama_model         = var.ollama_model
  desired_count        = 1
}

module "frontend" {
  source        = "../../../modules/frontend"
  name          = local.name
  bucket_name   = "${local.name}-frontend"
  force_destroy = true
}
