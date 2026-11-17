/**
 * A pragmatic JSON Schema type + the loader that turns the backend's Zod
 * contracts into JSON Schema. We only model the subset of Draft-07 that
 * `zod-to-json-schema` emits for our contracts — enough for the emitters.
 */

export interface JSONSchema {
  $ref?: string;
  type?: string | string[];
  enum?: (string | number | boolean | null)[];
  const?: string | number | boolean;
  format?: string;
  description?: string;
  default?: unknown;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  items?: JSONSchema;
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
  /** Our own marker: a hand-mirrored backend interface, pending Zod migration. */
  "x-approximate"?: boolean;
  // tolerate extra keywords without choking
  [k: string]: unknown;
}

/** A named schema set: the OpenAPI `components.schemas` map. */
export type SchemaMap = Record<string, JSONSchema>;

/**
 * Import the backend Zod exports listed in the registry and convert each to JSON
 * Schema, fully inlined (`$refStrategy: "none"`) so the emitters never chase
 * cross-schema refs from Zod. Supplemental schemas (which DO use $ref by name)
 * are merged on top.
 *
 * `contractsDir` must point at the backend `src/shared` directory; we import its
 * `index.ts` barrel through tsx's loader (the caller runs us via tsx).
 */
export async function loadSchemas(contractsIndexUrl: string): Promise<{
  schemas: SchemaMap;
  approximate: string[];
  missing: string[];
}> {
  const { zodToJsonSchema } = await import("zod-to-json-schema");
  const { ZOD_SCHEMAS, SUPPLEMENTAL } = await import("./registry.js");

  const mod: Record<string, unknown> = await import(contractsIndexUrl);

  const schemas: SchemaMap = {};
  const missing: string[] = [];

  for (const { export: exp, name } of ZOD_SCHEMAS) {
    const zodSchema = mod[exp];
    if (!zodSchema || typeof (zodSchema as { safeParse?: unknown }).safeParse !== "function") {
      missing.push(`${exp} (expected Zod schema → ${name})`);
      continue;
    }
    const js = zodToJsonSchema(zodSchema as never, {
      $refStrategy: "none",
      target: "jsonSchema7",
    }) as JSONSchema;
    delete (js as Record<string, unknown>).$schema;
    schemas[name] = js;
  }

  // Supplemental (hand-written) schemas override/extend; they reference others
  // by `#/components/schemas/<Name>`.
  for (const [name, schema] of Object.entries(SUPPLEMENTAL)) {
    schemas[name] = schema;
  }

  const approximate = Object.entries(schemas)
    .filter(([, s]) => s["x-approximate"] === true)
    .map(([n]) => n)
    .sort();

  return { schemas, approximate, missing };
}

/** Resolve a `#/components/schemas/Name` ref to its bare type name. */
export function refName(ref: string): string {
  const m = /#\/components\/schemas\/(.+)$/.exec(ref);
  if (!m) throw new Error(`Unsupported $ref: ${ref}`);
  return m[1]!;
}
