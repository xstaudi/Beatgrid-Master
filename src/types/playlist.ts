import { z } from 'zod/v4'

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  trackIds: z.array(z.string()),
  parentId: z.string().nullable(),
  isFolder: z.boolean(),
})

export type Playlist = z.infer<typeof PlaylistSchema>
