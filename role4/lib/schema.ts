/** Small fail-closed JSON Schema subset. Unsupported keywords throw rather than silently pass. */
export type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[];
  additionalProperties?: boolean | Schema; items?: Schema; enum?: unknown[]; minLength?: number;
  minItems?: number; minimum?: number; maximum?: number; pattern?: string; $schema?: string; title?: string };
export function validate(schema: Schema, value: unknown, path = '$'): void {
  const supported = new Set(['type','properties','required','additionalProperties','items','enum','minLength','minItems','minimum','maximum','pattern','$schema','title']);
  for (const key of Object.keys(schema)) if (!supported.has(key)) throw new Error(`Unsupported schema keyword: ${key}`);
  const fail = (message: string): never => { throw new Error(`${path}: ${message}`); };
  if (schema.enum && !schema.enum.includes(value)) fail('value outside enum');
  if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('expected object');
    const object = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in object)) fail(`missing ${key}`);
    for (const [key, item] of Object.entries(object)) {
      const child = schema.properties?.[key];
      if (child) validate(child, item, `${path}.${key}`);
      else if (schema.additionalProperties === false) fail(`unexpected ${key}`);
      else if (typeof schema.additionalProperties === 'object') validate(schema.additionalProperties, item, `${path}.${key}`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) fail('expected array');
    const array = value as unknown[];
    if (array.length < (schema.minItems ?? 0)) fail('too few items');
    if (schema.items) array.forEach((item, i) => validate(schema.items!, item, `${path}[${i}]`));
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') fail('expected string');
    const string = value as string;
    if (string.trim().length < (schema.minLength ?? 0)) fail('string too short');
    if (schema.pattern && !new RegExp(schema.pattern).test(string)) fail('pattern mismatch');
  } else if (schema.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('expected finite number');
    const number = value as number;
    if (number < (schema.minimum ?? -Infinity) || number > (schema.maximum ?? Infinity)) fail('number outside range');
  } else if (schema.type === 'boolean' && typeof value !== 'boolean') fail('expected boolean');
  else if (schema.type && !['object','array','string','number','boolean'].includes(schema.type)) fail('unsupported schema type');
}
