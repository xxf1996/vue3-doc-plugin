export interface DocumentPropInfo {
  name: string;
  type: string;
  desc?: string;
  options?: string;
  default?: string;
}

export interface DocumentInfo {
  props: DocumentPropInfo[];
  name: string;
  desc: string;
  emits: Record<string, string>;
  slots: Record<string, string>;
}
