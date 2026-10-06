import { EditPlanSchema, type EditPlan } from '@premiere-mcp/validation';
import { PremiereMcpError } from '@premiere-mcp/protocol';

export interface EditPlanSummary {
  name: string;
  objective: string;
  operationCount: number;
  destructiveCount: number;
  estimatedAffectedItems: number;
  operationTypes: Record<string, number>;
  warnings: string[];
}

export function validateEditPlan(input: unknown): { plan: EditPlan; summary: EditPlanSummary } {
  const parsed = EditPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new PremiereMcpError('INVALID_ARGUMENT', 'Invalid edit plan', {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  const types: Record<string, number> = {};
  let destructiveCount = 0;
  for (const operation of parsed.data.operations) {
    types[operation.type] = (types[operation.type] ?? 0) + 1;
    if (operation.type === 'remove_clip' || operation.type === 'trim_clip') destructiveCount += 1;
  }
  const warnings: string[] = [];
  if (parsed.data.operations.length > 100) warnings.push('Large edit plan: review every operation before confirmation.');
  if (!parsed.data.createBackup && destructiveCount > 0) warnings.push('Destructive plan does not request a backup.');
  return { plan: parsed.data, summary: { name: parsed.data.name, objective: parsed.data.objective, operationCount: parsed.data.operations.length, destructiveCount, estimatedAffectedItems: parsed.data.operations.length, operationTypes: types, warnings } };
}
