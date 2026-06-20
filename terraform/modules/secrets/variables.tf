variable "name" {
  type = string
}

variable "recovery_window" {
  type    = number
  default = 0
}

variable "secrets" {
  type      = map(string)
  sensitive = true
}
