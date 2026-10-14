output "alb_dns_name" {
  description = "Point your domain here if DNS is not in Route 53."
  value       = aws_lb.main.dns_name
}

output "media_cdn_domain" {
  value = aws_cloudfront_distribution.media.domain_name
}

output "ecr_app_repository" {
  value = aws_ecr_repository.app["app"].repository_url
}

output "ecr_migrate_repository" {
  value = aws_ecr_repository.app["migrate"].repository_url
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "migrate_task_definition" {
  value = aws_ecs_task_definition.migrate.family
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "task_security_group_id" {
  value = aws_security_group.tasks.id
}

output "certificate_validation_records" {
  description = "Create these CNAMEs at your DNS provider when route53_zone_id is empty."
  value       = var.certificate_arn == "" && var.route53_zone_id == "" ? aws_acm_certificate.site[0].domain_validation_options : []
}

output "ses_dkim_tokens" {
  description = "When DNS is not in Route 53, create <token>._domainkey CNAME records pointing to <token>.dkim.amazonses.com."
  value       = aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens
}

output "app_secret_arn" {
  value = aws_secretsmanager_secret.app.arn
}
