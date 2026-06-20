variable "name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "backend_image" {
  type = string
}

variable "secret_arn" {
  type = string
}

variable "store_name" {
  type = string
}

variable "store_domain" {
  type    = string
  default = ""
}

variable "store_slug" {
  type = string
}

variable "app_environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "dynamodb_table_menu" {
  type = string
}

variable "dynamodb_table_deals" {
  type = string
}

variable "task_cpu" {
  type    = number
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "log_retention_days" {
  type    = number
  default = 14
}
