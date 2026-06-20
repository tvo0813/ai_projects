output "backend_url"         { value = "http://${module.ecs.alb_dns_name}" }
output "frontend_url"        { value = "https://${module.frontend.cloudfront_domain}" }
output "ecr_repo_url"        { value = module.ecr.backend_repo_url }
output "ecs_cluster_name"    { value = module.ecs.ecs_cluster_name }
output "ecs_service_name"    { value = module.ecs.ecs_service_name }
output "cf_distribution_id"  { value = module.frontend.cloudfront_distribution_id }
output "frontend_bucket"     { value = module.frontend.bucket_name }
