# ─── Container registry ───

resource "aws_ecr_repository" "app" {
  for_each             = toset(["app", "migrate"])
  name                 = "${local.name}-${each.key}"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 30 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }
      action       = { type = "expire" }
    }]
  })
}

# ─── Email (SES) ───

resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.domain_name
}

resource "aws_route53_record" "ses_dkim" {
  count   = var.route53_zone_id == "" ? 0 : 3
  zone_id = var.route53_zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

# SMTP credentials for nodemailer (SES derives the SMTP password from an IAM key).
resource "aws_iam_user" "ses_smtp" {
  name = "${local.name}-ses-smtp"
}

resource "aws_iam_user_policy" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["ses:SendRawEmail", "ses:SendEmail"], Resource = "*" }]
  })
}

resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}

# ─── Application secrets (one JSON secret, injected key-by-key into tasks) ───

resource "random_password" "auth_secret" {
  length  = 48
  special = false
}

locals {
  generated_secrets = {
    DATABASE_URL       = "postgresql://ncs:${random_password.db.result}@${aws_db_proxy.main.endpoint}:5432/ncs?sslmode=require"
    REDIS_URL          = "rediss://:${random_password.redis.result}@${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
    BETTER_AUTH_SECRET = random_password.auth_secret.result
    SMTP_USER          = aws_iam_access_key.ses_smtp.id
    SMTP_PASS          = aws_iam_access_key.ses_smtp.ses_smtp_password_v4
  }
  third_party_keys = [
    "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET",
    "MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_OTP_TEMPLATE_ID", "MSG91_ORDER_TEMPLATE_ID",
    "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SENTRY_DSN", "ADMIN_EMAILS",
  ]
  app_secret_values = merge(
    { for k in local.third_party_keys : k => lookup(var.app_secrets, k, "") },
    local.generated_secrets,
  )

  app_environment = {
    NODE_ENV            = "production"
    APP_URL             = "https://${var.domain_name}"
    LOG_LEVEL           = "info"
    DATABASE_POOL_MAX   = "8"
    S3_REGION           = var.region
    S3_BUCKET           = aws_s3_bucket.media.id
    S3_PRIVATE_BUCKET   = aws_s3_bucket.private.id
    S3_FORCE_PATH_STYLE = "false"
    S3_PUBLIC_URL       = "https://${aws_cloudfront_distribution.media.domain_name}"
    SMTP_HOST           = "email-smtp.${var.region}.amazonaws.com"
    SMTP_PORT           = "587"
    SMTP_SECURE         = "false"
    EMAIL_FROM          = var.email_from
    SMS_PROVIDER        = "msg91"
  }
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "${local.name}/app"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id     = aws_secretsmanager_secret.app.id
  secret_string = jsonencode(local.app_secret_values)
}

# ─── IAM for ECS tasks ───

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${local.name}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = aws_secretsmanager_secret.app.arn }]
  })
}

# What the application itself may do: read/write its two buckets.
resource "aws_iam_role" "task" {
  name               = "${local.name}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy" "task_s3" {
  role = aws_iam_role.task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.media.arn}/*", "${aws_s3_bucket.private.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.media.arn, aws_s3_bucket.private.arn]
      },
    ]
  })
}
