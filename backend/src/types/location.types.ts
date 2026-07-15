export interface LocationInfo {
  display_name: string;
  latitude: string;
  longitude: string;
  importance: number | string;
  osm_type: string;
  address: Record<string, any>;
}
