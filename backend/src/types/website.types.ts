export interface OpenGraphData {
  title: string;
  description: string;
  image: string;
}

export interface WebsiteMetadata {
  url: string;
  title: string;
  description: string;
  canonical: string;
  favicon: string;
  emails: string[];
  phones: string[];
  social_media: string[];
  open_graph: OpenGraphData;
}
