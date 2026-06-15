export type NodeId = string;

export interface EmojiRef { name: string; id?: string; animated?: boolean }

export interface TextNode    { _id: NodeId; type: 10; content: string }
export interface DividerNode { _id: NodeId; type: 14; divider: boolean; spacing: 1 | 2 }

export interface ThumbnailNode {
  _id: NodeId; type: 11;
  media: { url: string }; description: string | null; spoiler: boolean
}

export interface ButtonNode {
  _id: NodeId; type: 2;
  style: 1 | 2 | 3 | 4 | 5;
  label: string;
  custom_id?: string; url?: string;
  disabled?: boolean; emoji?: EmojiRef
}

export interface SelectOption { label: string; value: string; description?: string; emoji?: EmojiRef }
export interface SelectMenuNode {
  _id: NodeId; type: 3;
  custom_id: string; placeholder?: string;
  min_values?: number; max_values?: number;
  options: SelectOption[]
}

export interface ActionRowNode { _id: NodeId; type: 1; components: Array<ButtonNode | SelectMenuNode> }

export interface SectionNode {
  _id: NodeId; type: 9;
  components: [TextNode];
  accessory?: ThumbnailNode | ButtonNode
}

export interface GalleryItem { media: { url: string }; description?: string; spoiler: boolean }
export interface GalleryNode { _id: NodeId; type: 12; items: GalleryItem[] }

export type ContainerChild = TextNode | DividerNode | SectionNode | ActionRowNode | GalleryNode

export interface ContainerNode {
  _id: NodeId; type: 17;
  accent_color: number | null; spoiler: boolean;
  components: ContainerChild[]
}

export type RootNode = ContainerNode | ActionRowNode | TextNode | DividerNode | SectionNode | GalleryNode

export interface BuilderState {
  messages: RootNode[][];  // one array per message
  allowedMentions: boolean; // true = pings ON, false = pings OFF (parse: [])
}
