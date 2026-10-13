import { z, type ZodTypeAny } from 'zod';
import type { AttrSchema } from '../data/schemas';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

function one(a: AttrSchema): ZodTypeAny {
  let t: ZodTypeAny;
  switch (a.type) {
    case 'text': t = z.string().trim().min(1); break;
    case 'number': t = z.coerce.number().finite(); break;
    case 'enum': t = z.enum((a.options ?? ['']) as [string, ...string[]]); break;
    case 'list': t = z.preprocess((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v), z.array(z.string())); break;
  }
  return z.preprocess(emptyToUndefined, a.required ? t : t.optional());
}

/** Builds a validator from the attribute schema of a product line. */
export function buildZod(schema: AttrSchema[]) {
  return z.object(Object.fromEntries(schema.map((a) => [a.key, one(a)])));
}

export type Materialization = 'column' | 'projection' | 'jsonb-only';

/**
 * Hybrid strategy: scalar searchable attributes are copied to a plain column,
 * searchable list attributes go to a projection table, everything else stays in JSONB only.
 */
export function materialization(a: AttrSchema): Materialization {
  if (!a.searchable) return 'jsonb-only';
  return a.type === 'list' ? 'projection' : 'column';
}

export function parseForm(schema: AttrSchema[], values: Record<string, string>) {
  const r = buildZod(schema).safeParse(values);
  if (r.success) return { ok: true as const, data: r.data as Record<string, unknown>, errors: {} as Record<string, string> };
  const errors: Record<string, string> = {};
  for (const i of r.error.issues) errors[String(i.path[0])] = i.message;
  return { ok: false as const, data: null, errors };
}
