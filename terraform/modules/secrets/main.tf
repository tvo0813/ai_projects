resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.name}/coffee-tea-secrets"
  recovery_window_in_days = var.recovery_window
  tags                    = { Name = "${var.name}-coffee-tea-secrets" }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode(var.secrets)
}
