variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "store_domain" {
  type    = string
  default = "phindrips.com"
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}

variable "square_access_token" {
  type      = string
  sensitive = true
}

variable "square_location_id" {
  type      = string
  sensitive = true
}

variable "domain_aliases" {
  type    = list(string)
  default = ["phindrips.com", "www.phindrips.com"]
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
}

variable "backend_image" {
  type        = string
  description = "Full ECR image URL including tag"
}

variable "menu_s3_bucket" {
  type        = string
  default     = ""
  description = "S3 bucket holding per-store menu CSVs. Empty = local CSV only."
}
