variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "store_domain" {
  type    = string
  default = "daboba.com"
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
  default = ["daboba.com", "www.daboba.com"]
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

variable "google_maps_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "ollama_base_url" {
  type    = string
  default = ""
}

variable "ollama_model" {
  type    = string
  default = "llama3.2:1b"
}
