variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "store_name" {
  type    = string
  default = "Phin and Beans"
}

variable "store_domain" {
  type    = string
  default = ""
}

variable "db_name" {
  type    = string
  default = "phin_and_beans_dev"
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
