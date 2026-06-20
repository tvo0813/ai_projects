output "alb_dns_name"          { value = aws_lb.main.dns_name }
output "alb_arn"               { value = aws_lb.main.arn }
output "ecs_cluster_name"      { value = aws_ecs_cluster.main.name }
output "ecs_service_name"      { value = aws_ecs_service.backend.name }
output "ecs_security_group_id" { value = aws_security_group.ecs.id }
output "task_definition_arn"   { value = aws_ecs_task_definition.backend.arn }
