import { z } from 'zod'

const FrontBackScoreSchema = z.object({
  color: z.number().min(0).max(10),
  scratches: z.number().min(0).max(10),
  colorWeight: z.number().min(0).max(1),
  scratchesWeight: z.number().min(0).max(1),
  totalWeight: z.number().min(0).max(1),
})

const SurfaceSchema = z.object({
  finalScore: z.number().min(0).max(10),
  bent: z.number().min(0).max(10),
  bentWeight: z.number().nullable(),
  front: FrontBackScoreSchema,
  back: FrontBackScoreSchema,
})

const EdgeCornerSideSchema = z.object({
  left: z.number().min(0).max(10),
  top: z.number().min(0).max(10),
  right: z.number().min(0).max(10),
  bottom: z.number().min(0).max(10),
})

const CornerSideSchema = z.object({
  topLeft: z.number().min(0).max(10),
  topRight: z.number().min(0).max(10),
  bottomLeft: z.number().min(0).max(10),
  bottomRight: z.number().min(0).max(10),
})

const EdgesSchema = z.object({
  finalScore: z.number().min(0).max(10),
  frontWeight: z.number().min(0).max(1),
  backWeight: z.number().min(0).max(1),
  front: EdgeCornerSideSchema,
  back: EdgeCornerSideSchema,
})

const CornersSchema = z.object({
  finalScore: z.number().min(0).max(10),
  frontWeight: z.number().min(0).max(1),
  backWeight: z.number().min(0).max(1),
  front: CornerSideSchema,
  back: CornerSideSchema,
})

const CenteringSideSchema = z.object({
  left: z.number().min(0).max(10),
  top: z.number().min(0).max(10),
})

const CenteringSchema = z.object({
  frontScore: z.number().min(0).max(10),
  backScore: z.number().min(0).max(10),
  finalScore: z.number().min(0).max(10),
  front: CenteringSideSchema,
  back: CenteringSideSchema,
})

export const CreateCardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  set: z.string().min(1, 'Set is required'),
  number: z.string().min(1, 'Number is required'),
  year: z.string().min(1, 'Year is required'),
  rarity: z.string().min(1, 'Rarity is required'),
  finalGrade: z.number().min(0).max(10),
  certificationNumber: z.number().int().positive('Certification number must be positive'),
  version: z.number().int().min(1),
  has3DScan: z.boolean(),
  surface: SurfaceSchema,
  edges: EdgesSchema,
  corners: CornersSchema,
  centering: CenteringSchema,
})

export const UpdateCardSchema = CreateCardSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
)