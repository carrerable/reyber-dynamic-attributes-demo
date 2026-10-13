export type AttrType = 'text' | 'number' | 'enum' | 'list';
export interface AttrSchema {
  key: string;
  label: { en: string; es: string };
  type: AttrType;
  required: boolean;
  searchable: boolean;
  options?: string[];
}
export type LineId = 'auto' | 'pet' | 'boat';

const L = (en: string, es: string) => ({ en, es });

// Fictional product lines. Each line's risk attributes are data, not code.
export const SCHEMAS: Record<LineId, AttrSchema[]> = {
  auto: [
    { key: 'make', label: L('Make', 'Marca'), type: 'text', required: true, searchable: true },
    { key: 'model', label: L('Model', 'Modelo'), type: 'text', required: true, searchable: false },
    { key: 'year', label: L('Year', 'Año'), type: 'number', required: true, searchable: true },
    { key: 'usage', label: L('Usage', 'Uso'), type: 'enum', required: false, searchable: false, options: ['private', 'commercial', 'rideshare'] },
    { key: 'extra_drivers', label: L('Additional drivers', 'Conductores adicionales'), type: 'list', required: false, searchable: true },
  ],
  pet: [
    { key: 'species', label: L('Species', 'Especie'), type: 'enum', required: true, searchable: true, options: ['dog', 'cat', 'other'] },
    { key: 'breed', label: L('Breed', 'Raza'), type: 'text', required: false, searchable: false },
    { key: 'age', label: L('Age (years)', 'Edad (años)'), type: 'number', required: true, searchable: false },
    { key: 'preexisting', label: L('Pre-existing conditions', 'Condiciones previas'), type: 'list', required: false, searchable: true },
  ],
  boat: [
    { key: 'length_m', label: L('Length (m)', 'Eslora (m)'), type: 'number', required: true, searchable: true },
    { key: 'registration', label: L('Registration', 'Matrícula'), type: 'text', required: true, searchable: false },
    { key: 'engine', label: L('Engine', 'Motor'), type: 'enum', required: false, searchable: false, options: ['outboard', 'inboard', 'electric'] },
  ],
};

/** Prototype R1, measured 2026-09-22 on 10M synthetic policies with RLS enabled. G' = hybrid (chosen), C = projection table for everything. */
export interface BenchRow { id: string; unit: string; hybrid: number; projection: number; en: string; es: string }
export const BENCH: BenchRow[] = [
  { id: 'index', unit: 'MB', hybrid: 492, projection: 3030, en: 'Index size', es: 'Tamaño de índice' },
  { id: 'q3', unit: 'ms', hybrid: 1.2, projection: 118, en: 'Two-attribute filter (Q3)', es: 'Filtro de dos atributos (Q3)' },
  { id: 'small', unit: 'x', hybrid: 1.27, projection: 1.91, en: 'Small-tenant degradation', es: 'Degradación del tenant chico' },
  { id: 'add', unit: 's', hybrid: 233, projection: 113, en: 'Add a searchable attribute (online vs portfolio locked)', es: 'Agregar atributo buscable (en línea vs cartera bloqueada)' },
];
