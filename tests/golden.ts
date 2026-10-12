import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Golden-file helper for later phases. Layout:
 *   tests/fixtures/<area>/<case>/input.(html|txt|eml)
 *   tests/fixtures/<area>/<case>/expected.json
 */
export interface GoldenCase { name: string; input: string; expected: unknown }

export function loadGolden(area: string): GoldenCase[] {
  const dir = join(__dirname, 'fixtures', area);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const base = join(dir, d.name);
      const inputFile = readdirSync(base).find((f) => f.startsWith('input.'));
      if (!inputFile) throw new Error(`${base}: missing input.* file`);
      return {
        name: d.name,
        input: readFileSync(join(base, inputFile), 'utf8'),
        expected: JSON.parse(readFileSync(join(base, 'expected.json'), 'utf8')),
      };
    });
}
