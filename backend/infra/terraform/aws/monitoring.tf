resource "aws_sns_topic" "alarms" {
  name = "${local.name}-alarms"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

locals {
  alarms = {
    alb-5xx = {
      namespace   = "AWS/ApplicationELB"
      metric      = "HTTPCode_Target_5XX_Count"
      statistic   = "Sum"
      extended    = null
      threshold   = 20
      period      = 300
      comparison  = "GreaterThanThreshold"
      dimensions  = { LoadBalancer = aws_lb.main.arn_suffix }
      description = "More than 20 server errors in 5 minutes"
    }
    alb-latency = {
      namespace   = "AWS/ApplicationELB"
      metric      = "TargetResponseTime"
      statistic   = null
      extended    = "p95"
      threshold   = 2
      period      = 300
      comparison  = "GreaterThanThreshold"
      dimensions  = { LoadBalancer = aws_lb.main.arn_suffix }
      description = "p95 response time above 2 seconds"
    }
    unhealthy-targets = {
      namespace   = "AWS/ApplicationELB"
      metric      = "UnHealthyHostCount"
      statistic   = "Maximum"
      extended    = null
      threshold   = 0
      period      = 60
      comparison  = "GreaterThanThreshold"
      dimensions  = { LoadBalancer = aws_lb.main.arn_suffix, TargetGroup = aws_lb_target_group.app.arn_suffix }
      description = "An app task is failing health checks"
    }
    db-cpu = {
      namespace   = "AWS/RDS"
      metric      = "CPUUtilization"
      statistic   = "Average"
      extended    = null
      threshold   = 80
      period      = 300
      comparison  = "GreaterThanThreshold"
      dimensions  = { DBInstanceIdentifier = aws_db_instance.main.identifier }
      description = "Database CPU above 80%"
    }
    db-storage = {
      namespace   = "AWS/RDS"
      metric      = "FreeStorageSpace"
      statistic   = "Minimum"
      extended    = null
      threshold   = 5368709120
      period      = 300
      comparison  = "LessThanThreshold"
      dimensions  = { DBInstanceIdentifier = aws_db_instance.main.identifier }
      description = "Less than 5 GB of database storage left"
    }
    redis-memory = {
      namespace   = "AWS/ElastiCache"
      metric      = "DatabaseMemoryUsagePercentage"
      statistic   = "Maximum"
      extended    = null
      threshold   = 80
      period      = 300
      comparison  = "GreaterThanThreshold"
      dimensions  = { ReplicationGroupId = aws_elasticache_replication_group.main.id }
      description = "Redis memory above 80% (job queues never evict keys)"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "this" {
  for_each            = local.alarms
  alarm_name          = "${local.name}-${each.key}"
  alarm_description   = each.value.description
  namespace           = each.value.namespace
  metric_name         = each.value.metric
  statistic           = each.value.statistic
  extended_statistic  = each.value.extended
  period              = each.value.period
  evaluation_periods  = 2
  threshold           = each.value.threshold
  comparison_operator = each.value.comparison
  dimensions          = each.value.dimensions
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
}
