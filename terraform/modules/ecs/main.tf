# --- Security Groups ---

resource "aws_security_group" "alb" {
  name   = "${var.name}-alb-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name}-alb-sg" }
}

resource "aws_security_group" "ecs" {
  name   = "${var.name}-ecs-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name}-ecs-sg" }
}

# --- ALB ---

resource "aws_lb" "main" {
  name               = "${var.name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids
  tags               = { Name = "${var.name}-alb" }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.name}-api-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = { Name = "${var.name}-api-tg" }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# --- CloudWatch Logs ---

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.name}-api"
  retention_in_days = var.log_retention_days
}

# --- IAM ---

data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${var.name}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "secrets_access" {
  name = "${var.name}-secrets-access"
  role = aws_iam_role.task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [var.secret_arn]
    }]
  })
}

resource "aws_iam_role" "task" {
  name               = "${var.name}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
}

resource "aws_iam_role_policy" "task_dynamodb" {
  name = "${var.name}-dynamodb-access"
  role = aws_iam_role.task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
        "dynamodb:DeleteItem", "dynamodb:Scan", "dynamodb:Query"
      ]
      Resource = ["arn:aws:dynamodb:*:*:table/${var.store_slug}-*"]
    }]
  })
}

resource "aws_iam_role_policy" "task_menu_s3" {
  count = var.menu_s3_bucket != "" ? 1 : 0
  name  = "${var.name}-menu-s3-access"
  role  = aws_iam_role.task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["arn:aws:s3:::${var.menu_s3_bucket}/${var.store_slug}/menu.csv"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = ["arn:aws:s3:::${var.menu_s3_bucket}"]
        Condition = {
          StringLike = { "s3:prefix" = ["${var.store_slug}/"] }
        }
      }
    ]
  })
}

# --- ECS ---

resource "aws_ecs_cluster" "main" {
  name = "${var.name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name      = "coffee-tea-api"
    image     = var.backend_image
    essential = true
    portMappings = [{ containerPort = 8000, protocol = "tcp" }]
    secrets = [
      { name = "SECRET_KEY",            valueFrom = "${var.secret_arn}:SECRET_KEY::" },
      { name = "STRIPE_SECRET_KEY",     valueFrom = "${var.secret_arn}:STRIPE_SECRET_KEY::" },
      { name = "STRIPE_WEBHOOK_SECRET", valueFrom = "${var.secret_arn}:STRIPE_WEBHOOK_SECRET::" },
      { name = "SQUARE_ACCESS_TOKEN",   valueFrom = "${var.secret_arn}:SQUARE_ACCESS_TOKEN::" },
      { name = "SQUARE_LOCATION_ID",    valueFrom = "${var.secret_arn}:SQUARE_LOCATION_ID::" },
      { name = "DATABASE_URL",          valueFrom = "${var.secret_arn}:DATABASE_URL::" },
    ]
    environment = [
      { name = "STORE_NAME",          value = var.store_name },
      { name = "STORE_SLUG",          value = var.store_slug },
      { name = "STORE_DOMAIN",        value = var.store_domain },
      { name = "ENVIRONMENT",         value = var.app_environment },
      { name = "AWS_REGION",          value = var.aws_region },
      { name = "MENU_S3_BUCKET",       value = var.menu_s3_bucket },
      { name = "DYNAMODB_TABLE_MENU", value = var.dynamodb_table_menu },
      { name = "DYNAMODB_TABLE_DEALS",value = var.dynamodb_table_deals },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "coffee-tea-api"
      }
    }
  }])
}

resource "aws_ecs_service" "backend" {
  name            = "${var.name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "coffee-tea-api"
    container_port   = 8000
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  lifecycle {
    ignore_changes = [task_definition]
  }
}
