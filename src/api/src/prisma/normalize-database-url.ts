import type { PoolConfig } from 'mariadb';

/**
 * Chuẩn hoá cấu hình kết nối MariaDB / MySQL cho Prisma:
 * - Hỗ trợ cả chuỗi URL và PoolConfig object
 * - Tự động kích hoạt SSL an toàn khi kết nối tới Cloud (TiDB Cloud, Aiven...)
 * - Tự động ép localhost về 127.0.0.1 để tránh lỗi IPv6 trên Windows
 */
export function getMariaDbPoolConfig(databaseUrl: string): PoolConfig | string {
  try {
    const parsed = new URL(databaseUrl.replace(/^mariadb:/, 'mysql:'));
    const isCloudOrSsl =
      parsed.searchParams.has('sslaccept') ||
      parsed.searchParams.has('ssl') ||
      parsed.hostname.includes('tidbcloud') ||
      parsed.hostname.includes('aivencloud');

    let host = parsed.hostname;
    if (host === 'localhost') {
      host = '127.0.0.1';
    }

    const config: PoolConfig = {
      host,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname.replace(/^\//, '') || 'tour_booking',
      allowPublicKeyRetrieval: true,
    };

    if (isCloudOrSsl) {
      config.ssl = { rejectUnauthorized: true };
    }

    return config;
  } catch {
    let url = databaseUrl.replace(/@localhost(?=[:/])/i, '@127.0.0.1');
    if (!url.includes('allowPublicKeyRetrieval=')) {
      url += url.includes('?') ? '&allowPublicKeyRetrieval=true' : '?allowPublicKeyRetrieval=true';
    }
    return url;
  }
}

export function preferIpv4Localhost(databaseUrl: string): string {
  let url = databaseUrl.replace(/@localhost(?=[:/])/i, '@127.0.0.1');
  if (!url.includes('allowPublicKeyRetrieval=')) {
    url += url.includes('?') ? '&allowPublicKeyRetrieval=true' : '?allowPublicKeyRetrieval=true';
  }
  return url;
}
