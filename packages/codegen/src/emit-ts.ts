/** JSON Schema → TypeScript type declarations. */
import type { JSONSchema, SchemaMap } from "./jsonschema.js";
import { refName } from "./jsonschema.js";

const BANNER = `/**
 * GENERATED — DO NOT EDIT BY HAND.
 *
 * Emitted from the backend's src/shared/* Zod contracts by packages/codegen.
 * Regenerate with \`pnpm generate\`. Editing this file will be overwritten and
 * will fail \`pnpm generate:check\` in CI.
 */
/* eslint-disable */
`;

function isNullType(s: JSONSchema): boolean {
  return s.type === "null";
}

/** Render a schema as an inline TS type expression. */
function tsExpr(s: JSONSchema): string {
  if (s.$ref) return refName(s.$ref);

  if (s.anyOf || s.oneOf) {
    const variants = (s.anyOf ?? s.oneOf)!;
    return variants.map(tsExpr).join(" | ") || "unknown";
  }
  if (s.allOf) {
    return s.allOf.map(tsExpr).join(" & ") || "unknown";
  }

  if (s.const !== undefined) return JSON.stringify(s.const);

  if (Array.isArray(s.type)) {
    return s.type.map((t) => tsExpr({ ...s, type: t })).join(" | ");
  }

  if (s.enum && (s.type === "string" || s.type === undefined)) {
    return s.enum.map((v) => JSON.stringify(v)).join(" | ");
  }

  switch (s.type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array":
      return `Array<${s.items ? tsExpr(s.items) : "unknown"}>`;
    case "object":
      return tsObject(s);
    default:
      return "unknown";
  }
}

function tsObject(s: JSONSchema): string {
  const props = s.properties ?? {};
  const required = new Set(s.required ?? []);
  const keys = Object.keys(props);

  if (keys.length === 0) {
    if (s.additionalProperties && typeof s.additionalProperties === "object") {
      return `{ [key: string]: ${tsExpr(s.additionalProperties)} }`;
    }
    if (s.additionalProperties === true) return "{ [key: string]: unknown }";
    return "Record<string, never>";
  }

  const lines = keys.map((k) => {
    const opt = required.has(k) ? "" : "?";
    const child = props[k]!;
    const doc = child.description ? `  /** ${child.description} */\n` : "";
    return `${doc}  ${safeKey(k)}${opt}: ${tsExpr(child)};`;
  });
  let extra = "";
  if (s.additionalProperties && typeof s.additionalProperties === "object") {
    extra = `\n  [key: string]: ${tsExpr(s.additionalProperties)};`;
  }
  return `{\n${lines.join("\n")}${extra}\n}`;
}

function safeKey(k: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
}

function declare(name: string, s: JSONSchema): string {
  const doc = s.description ? `/** ${s.description} */\n` : "";
  // Plain object → interface (nicer hover/extends); everything else → type alias.
  if (s.type === "object" && s.properties && !s.anyOf && !s.oneOf && !s.allOf) {
    return `${doc}export interface ${name} ${tsObject(s)}\n`;
  }
  return `${doc}export type ${name} = ${tsExpr(s)};\n`;
}

export function emitTypeScript(schemas: SchemaMap): string {
  const names = Object.keys(schemas).sort();
  const body = names.map((n) => declare(n, schemas[n]!)).join("\n");
  return `${BANNER}\n${body}`;
}
