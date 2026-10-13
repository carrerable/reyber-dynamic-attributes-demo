import { useMemo, useState } from 'react';
import type { Lang } from './i18n';
import { Shell } from './ui/Shell';
import { Frame } from './ui/Frame';
import { BENCH, SCHEMAS, type LineId } from './data/schemas';
import { materialization, parseForm } from './lib/attrs';

const T = {
  en: {
    eyebrow: 'Case study / dynamic attributes', title: 'REYBER: dynamic insurance attributes at 10M policies',
    lead: 'Each product line declares its risk attributes as data. The form, the validator and the storage strategy are all generated from that schema.',
    line: 'Product line', lines: { auto: 'Auto', pet: 'Pet', boat: 'Boat' }, form: 'Generated form', result: 'Resulting JSON', mat: 'Materialization',
    attr: 'Attribute', type: 'Type', search: 'Searchable', where: 'Stored as', errorsH: 'Validation errors', yes: 'yes', no: 'no',
    bench: 'Benchmark R1', note: 'Measured 2026-09-22 on 10M synthetic policies with RLS enabled', hybrid: 'Hybrid (chosen)', proj: 'Projection table for everything',
    list: 'comma-separated', required: 'required', pick: 'select...', fill: 'Fill the form to see the JSON.',
  },
  es: {
    eyebrow: 'Caso de estudio / atributos dinámicos', title: 'REYBER: atributos dinámicos de seguros con 10M de pólizas',
    lead: 'Cada línea de producto declara sus atributos de riesgo como datos. El formulario, el validador y la estrategia de almacenamiento se generan de ese esquema.',
    line: 'Línea de producto', lines: { auto: 'Auto', pet: 'Mascota', boat: 'Embarcación' }, form: 'Formulario generado', result: 'JSON resultante', mat: 'Materialización',
    attr: 'Atributo', type: 'Tipo', search: 'Buscable', where: 'Se guarda como', errorsH: 'Errores de validación', yes: 'sí', no: 'no',
    bench: 'Benchmark R1', note: 'Medido el 2026-09-22 con 10M de pólizas sintéticas y RLS activo', hybrid: 'Híbrido (elegido)', proj: 'Tabla de proyección para todo',
    list: 'separado por comas', required: 'obligatorio', pick: 'elige...', fill: 'Llena el formulario para ver el JSON.',
  },
};

const WHERE = { column: 'plain column', projection: 'projection table', 'jsonb-only': 'JSONB only' } as const;

export function Demo({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [line, setLine] = useState<LineId>('auto');
  const [values, setValues] = useState<Record<string, string>>({});
  const schema = SCHEMAS[line];
  const res = useMemo(() => parseForm(schema, values), [schema, values]);
  const touched = Object.keys(values).length > 0;
  const max = (id: string) => { const b = BENCH.find((x) => x.id === id)!; return Math.max(b.hybrid, b.projection); };

  return (
    <Shell lang={lang} eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <Frame tl="SCHEMA" tr={t.line}>
        <div className="row">
          {(Object.keys(SCHEMAS) as LineId[]).map((l) => (
            <button key={l} className="toggle" aria-pressed={line === l} onClick={() => { setLine(l); setValues({}); }}>{t.lines[l]}</button>
          ))}
        </div>
      </Frame>

      <Frame tl="FORM">
        <h2>{t.form}</h2>
        <div className="grid">
          {schema.map((a) => (
            <label key={a.key}>
              {a.label[lang]}{a.required ? ` *` : ''}
              {a.type === 'enum' ? (
                <select value={values[a.key] ?? ''} onChange={(e) => setValues({ ...values, [a.key]: e.target.value })}>
                  <option value="">{t.pick}</option>
                  {a.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input value={values[a.key] ?? ''} placeholder={a.type === 'list' ? t.list : ''} inputMode={a.type === 'number' ? 'decimal' : undefined}
                  onChange={(e) => setValues({ ...values, [a.key]: e.target.value })} aria-invalid={!!res.errors[a.key] && touched} />
              )}
              <span className="note">{a.key} / {a.type}{a.required ? ` / ${t.required}` : ''}</span>
            </label>
          ))}
        </div>
        {touched && !res.ok && (
          <div style={{ marginTop: 'var(--s-3)' }} data-testid="errors">
            <h3>{t.errorsH}</h3>
            <p className="note">{Object.entries(res.errors).map(([k, m]) => `${k}: ${m}`).join(' | ')}</p>
          </div>
        )}
        <h3 style={{ marginTop: 'var(--s-4)' }}>{t.result}</h3>
        <pre data-testid="json">{res.ok ? JSON.stringify(res.data, null, 2) : t.fill}</pre>
      </Frame>

      <Frame tl="STORE">
        <h2>{t.mat}</h2>
        <div className="tablewrap"><table>
          <thead><tr><th>{t.attr}</th><th>{t.type}</th><th>{t.search}</th><th>{t.where}</th></tr></thead>
          <tbody>{schema.map((a) => (
            <tr key={a.key}><td>{a.key}</td><td>{a.type}</td><td>{a.searchable ? t.yes : t.no}</td><td><span className={`chip ${materialization(a) === 'jsonb-only' ? '' : 'accent'}`}>{WHERE[materialization(a)]}</span></td></tr>
          ))}</tbody>
        </table></div>
      </Frame>

      <Frame tl="R1" tr="10M">
        <h2>{t.bench}</h2>
        <p className="note">{t.note}</p>
        <div className="grid">
          {BENCH.map((b) => (
            <figure key={b.id} className="card" style={{ margin: 0 }}>
              <figcaption className="label">{lang === 'en' ? b.en : b.es}</figcaption>
              <svg viewBox="0 0 240 70" role="img" aria-label={`${b.en}: hybrid ${b.hybrid} ${b.unit}, projection ${b.projection} ${b.unit}`} style={{ width: '100%', marginTop: 8 }}>
                <rect x="0" y="6" width={Math.max(2, (b.hybrid / max(b.id)) * 150)} height="20" fill="var(--c-coral)" />
                <text x={Math.max(2, (b.hybrid / max(b.id)) * 150) + 6} y="21" fontSize="12" fill="var(--fg)" fontFamily="var(--f-mono)">{b.hybrid} {b.unit}</text>
                <rect x="0" y="40" width={Math.max(2, (b.projection / max(b.id)) * 150)} height="20" fill="var(--mut)" opacity="0.55" />
                <text x={Math.max(2, (b.projection / max(b.id)) * 150) + 6} y="55" fontSize="12" fill="var(--fg)" fontFamily="var(--f-mono)">{b.projection} {b.unit}</text>
              </svg>
              <div className="note"><span style={{ color: 'var(--acc)' }}>■</span> {t.hybrid} &nbsp; <span>■</span> {t.proj}</div>
            </figure>
          ))}
        </div>
      </Frame>
    </Shell>
  );
}
