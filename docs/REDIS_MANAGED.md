# Managed Redis guidance

Use a managed Redis service (AWS ElastiCache, Redis Enterprise, Upstash, Azure Cache) for production. Key recommendations:

- Enable automatic backups (RDB + AOF depending on provider) and configure snapshots retention.
- Use replicas and automatic failover where supported.
- Use secure connections (TLS) and rotate access credentials.
- Monitor key metrics (memory, eviction, persistence, replication lag) and set alerts.

Quick operations
- For a running standalone Redis: `redis-cli BGSAVE` to create an RDB snapshot (provider-specific instructions vary).

Notes
- If you use Redis for session or cache, ensure your app degrades gracefully when Redis is unavailable.
