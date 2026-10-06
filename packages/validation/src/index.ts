import path from 'node:path';
import { z } from 'zod';

const safeText = (max: number) => z.string().min(1).max(max).refine((v) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(v), 'Control characters are forbidden');
export const EmptyInputSchema = z.object({}).strict();
export const SequenceNameSchema = safeText(120);
export const MarkerInputSchema = z.object({ name: safeText(120), comments: z.union([safeText(1000),z.literal('')]).default(''), timeSeconds: z.number().finite().nonnegative().max(86400), durationSeconds: z.number().finite().nonnegative().max(86400).default(0) }).strict();
export const TrackInputSchema = z.object({ mediaType: z.enum(['video','audio']), trackIndex: z.number().int().min(0).max(999) }).strict();
export const SequenceIdSchema = z.object({ sequenceId: z.string().uuid() }).strict();
export const CreateSequenceSchema = z.object({ name: SequenceNameSchema, mediaItemIds: z.array(z.string().min(1).max(256)).min(1).max(100) }).strict();
export const PathInputSchema = z.object({ path: safeText(1024) }).strict();
export const ImportMediaSchema = z.object({ paths: z.array(safeText(1024)).min(1).max(100), targetBinId: z.string().max(256).optional() }).strict();
export const ExportRequestSchema = z.object({ destination: safeText(1024), presetPath: safeText(1024), overwrite: z.boolean().default(false), queueToAme: z.boolean().default(true) }).strict();
export const ConfirmationSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{32,256}$/) }).strict();
export const PreviewSchema = z.object({ operation: z.string().regex(/^premiere_[a-z0-9_]+$/), arguments: z.record(z.string(),z.unknown()) }).strict();
export const SafeModeSchema = z.object({ enabled: z.boolean() }).strict();
export const IdSchema = z.object({ id: z.string().min(1).max(256) }).strict();
export const RenameSequenceSchema = z.object({ sequenceId: z.string().min(1).max(256), name: SequenceNameSchema }).strict();
export const PlayheadSchema = z.object({ timeSeconds: z.number().finite().nonnegative().max(86400) }).strict();
const TimelineRefSchema = z.object({ mediaType:z.enum(['video','audio']), trackIndex:z.number().int().min(0).max(999), itemIndex:z.number().int().min(0).max(99999) }).strict();
const EditOperationBaseSchema = z.object({ id:z.string().regex(/^[A-Za-z0-9_-]{1,64}$/) });
export const EditOperationSchema = z.discriminatedUnion('type', [
  EditOperationBaseSchema.extend({ type:z.literal('insert_project_item'), projectItemId:safeText(256), timeSeconds:z.number().nonnegative().max(86400), videoTrackIndex:z.number().int().min(0).max(999), audioTrackIndex:z.number().int().min(0).max(999), mode:z.enum(['insert','overwrite']).default('insert') }).strict(),
  EditOperationBaseSchema.extend({ type:z.literal('move_clip'), target:TimelineRefSchema, offsetSeconds:z.number().finite().min(-86400).max(86400) }).strict(),
  EditOperationBaseSchema.extend({ type:z.literal('trim_clip'), target:TimelineRefSchema, startSeconds:z.number().nonnegative().max(86400), endSeconds:z.number().positive().max(86400) }).strict().refine((v)=>v.endSeconds>v.startSeconds,{message:'endSeconds must be greater than startSeconds'}),
  EditOperationBaseSchema.extend({ type:z.literal('remove_clip'), target:TimelineRefSchema, ripple:z.boolean().default(true) }).strict(),
  EditOperationBaseSchema.extend({ type:z.literal('set_clip_enabled'), target:TimelineRefSchema, enabled:z.boolean() }).strict(),
  EditOperationBaseSchema.extend({ type:z.literal('add_marker'), name:safeText(120), comments:z.union([safeText(1000),z.literal('')]).default(''), timeSeconds:z.number().nonnegative().max(86400), durationSeconds:z.number().nonnegative().max(86400).default(0) }).strict(),
  EditOperationBaseSchema.extend({ type:z.literal('set_playhead'), timeSeconds:z.number().nonnegative().max(86400) }).strict(),
  EditOperationBaseSchema.extend({ type:z.literal('apply_mogrt'), templatePath:safeText(1024), timeSeconds:z.number().nonnegative().max(86400), videoTrackIndex:z.number().int().min(0).max(999), audioTrackIndex:z.number().int().min(0).max(999) }).strict(),
]);
export const EditPlanSchema = z.object({ version:z.literal('1.0'), name:safeText(120), objective:safeText(1000), sequenceId:safeText(256).optional(), operations:z.array(EditOperationSchema).min(1).max(500), createBackup:z.boolean().default(true) }).strict();
export const EditPlanInputSchema = z.object({ plan:EditPlanSchema }).strict();
export const EditPlanConfirmationSchema = z.object({ token:z.string().min(32).max(256) }).strict();
export type EditPlan = z.infer<typeof EditPlanSchema>;
export type EditOperation = z.infer<typeof EditOperationSchema>;

export function canonicalAllowedPath(input: string, roots: readonly string[]): string {
  if (input.includes('\0')) throw new Error('NUL byte is forbidden');
  const resolved = path.resolve(input);
  const allowed = roots.some((root) => { const r = path.resolve(root); const rel = path.relative(r, resolved); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); });
  if (!allowed) throw new Error('Path is outside configured allowlisted directories');
  return resolved;
}
export const MEDIA_EXTENSIONS = new Set(['.mp4','.mov','.mxf','.avi','.wav','.mp3','.aif','.aiff','.png','.jpg','.jpeg','.tif','.tiff','.psd']);
export function validateMediaPath(input: string, roots: readonly string[]): string { const p = canonicalAllowedPath(input, roots); if (!MEDIA_EXTENSIONS.has(path.extname(p).toLowerCase())) throw new Error('Unsupported media extension'); return p; }
