import { render, screen, fireEvent } from '@testing-library/react';
import { BENCH, SCHEMAS } from '../data/schemas';
import { buildZod, materialization, parseForm } from '../lib/attrs';
import { Demo } from '../Demo';

test('falta un campo requerido', () => {
  const r = parseForm(SCHEMAS.auto, { make: 'Acme', year: '2020' });
  expect(r.ok).toBe(false);
  expect(Object.keys(r.errors)).toEqual(['model']);
});

test('year "2020" se convierte a numero y la lista se separa', () => {
  const r = buildZod(SCHEMAS.auto).safeParse({ make: 'Acme', model: 'X1', year: '2020', extra_drivers: 'Ana, Luis' });
  expect(r.success).toBe(true);
  if (r.success) {
    expect(r.data.year).toBe(2020);
    expect(r.data.extra_drivers).toEqual(['Ana', 'Luis']);
  }
});

test('un enum fuera de las opciones se rechaza', () => {
  expect(parseForm(SCHEMAS.pet, { species: 'dragon', age: '3' }).ok).toBe(false);
  expect(parseForm(SCHEMAS.pet, { species: 'dog', age: '3' }).ok).toBe(true);
});

test('materializacion correcta en los 3 tipos', () => {
  const find = (line: keyof typeof SCHEMAS, key: string) => SCHEMAS[line].find((a) => a.key === key)!;
  expect(materialization(find('auto', 'year'))).toBe('column'); // numero buscable
  expect(materialization(find('pet', 'species'))).toBe('column'); // enum buscable
  expect(materialization(find('auto', 'extra_drivers'))).toBe('projection'); // lista buscable
  expect(materialization(find('pet', 'preexisting'))).toBe('projection');
  expect(materialization(find('auto', 'model'))).toBe('jsonb-only'); // no buscable
});

test('las graficas coinciden con las cifras medidas (metricas-verificadas)', () => {
  const get = (id: string) => BENCH.find((b) => b.id === id)!;
  expect([get('index').hybrid, get('index').projection]).toEqual([492, 3030]);
  expect([get('q3').hybrid, get('q3').projection]).toEqual([1.2, 118]);
  expect([get('small').hybrid, get('small').projection]).toEqual([1.27, 1.91]);
  expect([get('add').hybrid, get('add').projection]).toEqual([233, 113]);
});

test('la interfaz genera JSON al llenar el formulario', () => {
  render(<Demo lang="en" />);
  fireEvent.change(screen.getByLabelText(/Make/), { target: { value: 'Acme' } });
  fireEvent.change(screen.getByLabelText(/Model/), { target: { value: 'X1' } });
  fireEvent.change(screen.getByLabelText(/Year/), { target: { value: '2021' } });
  expect(screen.getByTestId('json')).toHaveTextContent('"year": 2021');
  expect(screen.getByText(/Measured 2026-09-22 on 10M synthetic policies with RLS enabled/)).toBeInTheDocument();
});
