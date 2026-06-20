terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "coffee-tea-app-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "coffee-tea-app-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = "prod"
      Project     = "coffee-tea-app"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name       = "coffee-tea-prod"
  store_slug = "phin-and-beans"
}

module "vpc" {
  source               = "../../modules/vpc"
  name                 = local.name
  cidr                 = "10.1.0.0/16"
  azs                  = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
}

module "ecr" {
  source = "../../modules/ecr"
  name   = local.name
}

module "secrets" {
  source  = "../../modules/secrets"
  name    = local.name
  recovery_window = 7
  secrets = {
    SECRET_KEY            = var.secret_key
    DATABASE_URL          = "postgresql://${var.db_username}:${var.db_password}@${module.rds.endpoint}/${var.db_name}"
    STRIPE_SECRET_KEY     = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET = var.stripe_webhook_secret
    SQUARE_ACCESS_TOKEN   = var.square_access_token
    SQUARE_LOCATION_ID    = var.square_location_id
  }
}

module "ecs" {
  source             = "../../modules/ecs"
  name               = local.name
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  backend_image      = "${module.ecr.backend_repo_url}:latest"
  secret_arn         = module.secrets.secret_arn
  store_name         = var.store_name
  store_domain       = var.store_domain
  store_slug         = local.store_slug
  app_environment    = "production"
  aws_region         = var.aws_region
  dynamodb_table_menu  = "${local.store_slug}-menu"
  dynamodb_table_deals = "${local.store_slug}-deals"
  task_cpu           = 512
  task_memory        = 1024
  desired_count      = 2
  log_retention_days = 30
}

module "rds" {
  source                  = "../../modules/rds"
  name                    = local.name
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  ecs_security_group_id   = module.ecs.ecs_security_group_id
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  instance_class          = "db.t3.small"
  skip_final_snapshot     = false
  deletion_protection     = true
  backup_retention_period = 14
  multi_az                = true
}

module "frontend" {
  source               = "../../modules/frontend"
  name                 = local.name
  bucket_name          = "${local.name}-frontend"
  force_destroy        = false
  domain_aliases       = var.domain_aliases
  acm_certificate_arn  = var.acm_certificate_arn
}
