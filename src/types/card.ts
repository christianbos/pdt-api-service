export interface FrontBackScore {
  color: number;
  scratches: number;
  colorWeight: number;
  scratchesWeight: number;
  totalWeight: number;
}

export interface Surface {
  finalScore: number;
  bent: number;
  bentWeight: number | null;
  front: FrontBackScore;
  back: FrontBackScore;
}

export interface EdgeCornerSide {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CornerSide {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

export interface Edges {
  finalScore: number;
  frontWeight: number;
  backWeight: number;
  front: EdgeCornerSide;
  back: EdgeCornerSide;
}

export interface Corners {
  finalScore: number;
  frontWeight: number;
  backWeight: number;
  front: CornerSide;
  back: CornerSide;
}

export interface CenteringSide {
  left: number;
  top: number;
}

export interface Centering {
  frontScore: number;
  backScore: number;
  finalScore: number;
  front: CenteringSide;
  back: CenteringSide;
}

export interface Card {
  documentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  locale: string | null;
  set: string;
  number: string;
  year: string;
  rarity: string;
  finalGrade: number;
  certificationNumber: number;
  version: number;
  has3DScan: boolean;
  tcg?: string;
  gradeText?: string;
  notes?: string | null;
  gradeDate?: string;
  customerId?: string;  // Reference to the customer who owns this card
  orderId?: string;     // Reference to the order that created this card
  surface: Surface;
  edges: Edges;
  corners: Corners;
  centering: Centering;
  images?: CardImages;
}

export type ImageType = 
  | 'front' 
  | 'back' 
  | 'front_corners' 
  | 'back_corners'
  | 'front_corner_topLeft'
  | 'front_corner_topRight'
  | 'front_corner_bottomLeft'
  | 'front_corner_bottomRight'
  | 'back_corner_topLeft'
  | 'back_corner_topRight'
  | 'back_corner_bottomLeft'
  | 'back_corner_bottomRight'
  | 'front_edges' 
  | 'back_edges' 
  | 'front_surface' 
  | 'back_surface'

export interface ImageMetadata {
  publicId: string
  url: string
  width: number
  height: number
  format: string
  size: number
  uploadedAt: string
}

export interface CardImages {
  main?: {
    front?: ImageMetadata
    back?: ImageMetadata
  }
  specialized?: {
    front_corners?: ImageMetadata
    back_corners?: ImageMetadata
    front_corner_topLeft?: ImageMetadata
    front_corner_topRight?: ImageMetadata
    front_corner_bottomLeft?: ImageMetadata
    front_corner_bottomRight?: ImageMetadata
    back_corner_topLeft?: ImageMetadata
    back_corner_topRight?: ImageMetadata
    back_corner_bottomLeft?: ImageMetadata
    back_corner_bottomRight?: ImageMetadata
    front_edges?: ImageMetadata
    back_edges?: ImageMetadata
    front_surface?: ImageMetadata
    back_surface?: ImageMetadata
  }
}

export interface CloudinaryWebhookPayload {
  notification_type: string
  resource_type: string
  public_id: string
  version: number
  width: number
  height: number
  format: string
  bytes: number
  url: string
  secure_url: string
  created_at: string
  folder?: string
  tags?: string[]
}

export interface CreateCardRequest {
  name: string;
  set: string;
  number: string;
  year: string;
  rarity: string;
  finalGrade: number;
  certificationNumber: number;
  version: number;
  has3DScan: boolean;
  tcg?: string;
  gradeText?: string;
  notes?: string | null;
  gradeDate?: string;
  customerId?: string;  // Reference to the customer who owns this card
  orderId?: string;     // Reference to the order that created this card
  surface: Surface;
  edges: Edges;
  corners: Corners;
  centering: Centering;
}