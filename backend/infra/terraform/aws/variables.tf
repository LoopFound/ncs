variable "project" {
  type    = string
  default = "ncs"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "region" {
  type    = string
  default = "ap-south-1" # Mumbai
}

variable "domain_name" {
  description = "Storefront domain, e.g. ncsanthanam.in"
  type        = string
}

variable "route53_zone_id" {
  description = "Hosted zone for domain_name. Leave empty if DNS is managed elsewhere (then set certificate_arn)."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "Existing ACM certificate (same region) for the ALB. Empty = create and DNS-validate one in route53_zone_id."
  type        = string
  default     = ""
}

variable "alarm_email" {
  description = "Email that receives CloudWatch alarms."
  type        = string
}

variable "email_from" {
  type    = string
  default = "NCS Santhanam <orders@ncsanthanam.in>"
}

variable "app_image_tag" {
  description = "Image tag pushed to ECR by CI (e.g. the git SHA)."
  type        = string
  default     = "latest"
}

variable "app_cpu" {
  type    = number
  default = 512
}

variable "app_memory" {
  type    = number
  default = 1024
}

variable "app_min_tasks" {
  type    = number
  default = 2
}

variable "app_max_tasks" {
  type    = number
  default = 10
}

variable "worker_min_tasks" {
  type    = number
  default = 1
}

variable "worker_max_tasks" {
  type    = number
  default = 4
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.medium"
}

variable "db_allocated_storage" {
  type    = number
  default = 50
}

variable "db_multi_az" {
  type    = bool
  default = true
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.small"
}

variable "app_secrets" {
  description = <<-EOT
    Third-party secrets injected into the app, e.g.
    { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
      MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_OTP_TEMPLATE_ID, MSG91_ORDER_TEMPLATE_ID,
      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SENTRY_DSN }
    Pass via a git-ignored *.auto.tfvars file or TF_VAR_app_secrets.
  EOT
  type        = map(string)
  sensitive   = true
  default     = {}
}
