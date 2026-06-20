resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.name}/app-secrets"
  recovery_window_in_days = var.recovery_window
  tags                    = { Name = "${var.name}-app-secrets" }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode(var.secrets)
}
