export type ContentBlockType = 'text' | 'image' | 'video';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // text content, image URL, or YouTube URL
}

export interface Blog {
  id: string;
  title: string;
  content: ContentBlock[];
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  is_verified: boolean;
  subscribed_at: string;
}
