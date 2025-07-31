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
  surface: Surface;
  edges: Edges;
  corners: Corners;
  centering: Centering;
  images?: string[];
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
  surface: Surface;
  edges: Edges;
  corners: Corners;
  centering: Centering;
}