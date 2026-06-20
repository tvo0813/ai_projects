variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "store_domain" {
  type    = string
  default = ""
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
  default   = ""
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "square_access_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "square_location_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "backend_image" {
  type        = string
  description = "Full ECR image URL including tag"
}
