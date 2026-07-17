variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the Worker, D1 database, and Access application."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cloudflare_account_id))
    error_message = "cloudflare_account_id must be a 32-character hexadecimal account ID."
  }
}

variable "worker_hostname" {
  description = "Public workers.dev hostname without a scheme or trailing slash."
  type        = string

  validation {
    condition = can(regex(
      "^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.workers\\.dev$",
      var.worker_hostname,
    ))
    error_message = "worker_hostname must be a valid <worker>.<account>.workers.dev hostname."
  }
}

variable "access_allowed_email" {
  description = "Single identity allowed to authenticate to the EdgeOps admin surface."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$", var.access_allowed_email))
    error_message = "access_allowed_email must be a valid email address."
  }
}

variable "enable_access" {
  description = "Create the reusable Access policy and protected application after the public Worker is online."
  type        = bool
  default     = false
}

variable "d1_database_name" {
  description = "Stable D1 database name used by Wrangler migrations and the Worker binding."
  type        = string
  default     = "edgeops-dashboard-db"
}
