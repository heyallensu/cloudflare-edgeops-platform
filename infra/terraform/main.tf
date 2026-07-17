resource "cloudflare_d1_database" "edgeops" {
  account_id = var.cloudflare_account_id
  name       = var.d1_database_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_zero_trust_access_policy" "edgeops_admin" {
  count = var.enable_access ? 1 : 0

  account_id = var.cloudflare_account_id
  name       = "EdgeOps admin allowlist"
  decision   = "allow"

  include = [{
    email = {
      email = var.access_allowed_email
    }
  }]
}

resource "cloudflare_zero_trust_access_application" "edgeops_admin" {
  count = var.enable_access ? 1 : 0

  account_id = var.cloudflare_account_id
  name       = "EdgeOps protected administration"
  type       = "self_hosted"
  domain     = "${var.worker_hostname}/admin*"

  destinations = [
    {
      type = "public"
      uri  = "${var.worker_hostname}/admin*"
    },
    {
      type = "public"
      uri  = "${var.worker_hostname}/api/admin*"
    },
  ]

  policies = [{
    id         = cloudflare_zero_trust_access_policy.edgeops_admin[0].id
    precedence = 1
  }]

  app_launcher_visible       = false
  enable_binding_cookie      = true
  http_only_cookie_attribute = true
  path_cookie_attribute      = false
  same_site_cookie_attribute = "lax"
  session_duration           = "8h"
}
