output "d1_database_id" {
  description = "D1 UUID to commit as the Wrangler binding identifier."
  value       = cloudflare_d1_database.edgeops.uuid
}

output "access_audience" {
  description = "Audience used by the application-level Access JWT verifier."
  value       = var.enable_access ? cloudflare_zero_trust_access_application.edgeops_admin[0].aud : null
  sensitive   = true
}

output "admin_url" {
  description = "Protected EdgeOps administration URL."
  value       = var.enable_access ? "https://${var.worker_hostname}/admin" : null
}
