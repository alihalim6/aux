export interface MyAuxContent {
  key: string;
  label: string;
  data: any[];
  total?: number;
  limit?: number;
  offset?: number; 
  carousel?: boolean;
  hideLikes?: boolean;
  api?: string;
  fetchPending?: boolean;
}

export interface UserItem {
  track?: any;
  album?: any;
  played_at?: string;
  added_at?: string;
  context?: any;
}