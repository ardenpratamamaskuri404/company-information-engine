export interface DomainInfo {
  domain: string;
  registrar: string;
  registered_at: string;
  expired_at: string;
  last_updated: string;
  status: string[];
  nameservers: string[];
}
