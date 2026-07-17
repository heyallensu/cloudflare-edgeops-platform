variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the Worker and D1 database."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cloudflare_account_id))
    error_message = "cloudflare_account_id must be a 32-character hexadecimal account ID."
  }
}

variable "d1_database_name" {
  description = "Stable D1 database name used by Wrangler migrations and the Worker binding."
  type        = string
  default     = "edgeops-dashboard-db"
}
