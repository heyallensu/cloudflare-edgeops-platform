output "d1_database_id" {
  description = "D1 UUID to commit as the Wrangler binding identifier."
  value       = cloudflare_d1_database.edgeops.uuid
}
