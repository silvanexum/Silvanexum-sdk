/** JSON Schema → Python (pydantic v2) models. */
import type { JSONSchema, SchemaMap } from "./jsonschema.js";
import { refName } from "./jsonschema.js";

const BANNER = `"""
GENERATED — DO NOT EDIT BY HAND.

Emitted from the backend's src/shared/* Zod contracts by packages/codegen.
Regenerate with \`pnpm generate\`. Editing this file will be overwritten and
will fail \`pnpm generate:check\` in CI.
"""
# fmt: off
# ruff: noqa
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field
`;

/**
 * Python reserved words (keywords + soft keywords) that cannot be used as a
 * field name. A contract field like \`from\` (M06 AuditLogQuery, M08
 * FleetMetricsQuery) is legal JSON but illegal Python — emitting it verbatim
 * makes \`import silvanexum\` raise SyntaxError. We alias such fields to a
 * trailing-underscore name and pin the wire name with a pydantic \`Field(alias=...)\`.
 */
const PY_RESERVED = new Set<string>([
  // hard keywords
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally", "for",
  "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or",
  "pass", "raise", "return", "try", "while", "with", "yield",
  // soft keywords / dunder-collision avoidance
  "match", "case", "type", "print", "exec",
]);

/** Is `name` a legal Python identifier that we can safely use as a field name? */
function isLegalPyIdent(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !PY_RESERVED.has(name);
}

/**
 * The Python attribute name for a wire field. Reserved words and otherwise
 * illegal identifiers (e.g. leading digit, hyphen) get a safe alias; the
 * original wire name is preserved via `Field(alias=...)`.
 */
function pySafeFieldName(wire: string): string {
  if (isLegalPyIdent(wire)) return wire;
  if (PY_RESERVED.has(wire)) return `${wire}_`;
  // Sanitize anything else (e.g. "x-trace") into a valid identifier.
  let ident = wire.replace(/[^A-Za-z0-9_]/g, "_");
  if (/^[0-9]/.test(ident)) ident = `_${ident}`;
  if (!isLegalPyIdent(ident)) ident = `${ident}_`;
  return ident;
}

/** Is this schema `anyOf: [X, {type:null}]` (i.e. a nullable wrapper)? */
function splitNullable(s: JSONSchema): { inner: JSONSchema; nullable: boolean } {
  const variants = s.anyOf ?? s.oneOf;
  if (variants && variants.length === 2) {
    const nullIdx = variants.findIndex((v) => v.type === "null");
    if (nullIdx !== -1) {
      const inner = variants[nullIdx === 0 ? 1 : 0]!;
      return { inner, nullable: true };
    }
  }
  return { inner: s, nullable: false };
}

/** Python type expression for an inline schema. */
function pyType(s: JSONSchema): string {
  if (s.$ref) return refName(s.$ref);

  const { inner, nullable } = splitNullable(s);
  if (nullable) return `Optional[${pyType(inner)}]`;

  if (s.anyOf || s.oneOf) {
    const variants = (s.anyOf ?? s.oneOf)!;
    const parts = variants.map(pyType);
    return parts.length > 1 ? `Union[${parts.join(", ")}]` : (parts[0] ?? "Any");
  }
  if (s.allOf) return "Dict[str, Any]"; // intersections are rare; keep loose

  if (s.const !== undefined) return `Literal[${pyLiteral(s.const)}]`;

  if (Array.isArray(s.type)) {
    const parts = s.type.map((t) => pyType({ ...s, type: t }));
    return parts.length > 1 ? `Union[${parts.join(", ")}]` : (parts[0] ?? "Any");
  }

  if (s.enum && (s.type === "string" || s.type === undefined)) {
    return `Literal[${s.enum.map(pyLiteral).join(", ")}]`;
  }

  switch (s.type) {
    case "string":
      return "str";
    case "number":
      return "float";
    case "integer":
      return "int";
    case "boolean":
      return "bool";
    case "null":
      return "None";
    case "array":
      return `List[${s.items ? pyType(s.items) : "Any"}]`;
    case "object":
      if (s.additionalProperties && typeof s.additionalProperties === "object") {
        return `Dict[str, ${pyType(s.additionalProperties)}]`;
      }
      if (s.properties) return "Dict[str, Any]"; // inline anonymous object
      return "Dict[str, Any]";
    default:
      return "Any";
  }
}

function pyLiteral(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? "True" : "False";
  if (v === null) return "None";
  return String(v);
}

function emitEnumAlias(name: string, s: JSONSchema): string {
  return `${name} = Literal[${(s.enum ?? []).map(pyLiteral).join(", ")}]\n`;
}

function emitModel(name: string, s: JSONSchema): string {
  const props = s.properties ?? {};
  const required = new Set(s.required ?? []);
  const doc = s.description ? `    """${s.description}"""\n` : "";
  let aliased = false;
  const fields = Object.keys(props).map((k) => {
    const child = props[k]!;
    const { nullable } = splitNullable(child);
    const optional = !required.has(k);
    let t = pyType(child);
    if (optional && !nullable && !t.startsWith("Optional[")) t = `Optional[${t}]`;

    const safe = pySafeFieldName(k);
    const needsAlias = safe !== k;
    if (needsAlias) aliased = true;

    let def: string;
    if (needsAlias) {
      // Pin the JSON wire name via a pydantic alias; keep the legal Python attr.
      def = optional
        ? ` = Field(default=None, alias=${JSON.stringify(k)})`
        : ` = Field(alias=${JSON.stringify(k)})`;
    } else {
      def = optional ? " = None" : "";
    }
    return `    ${safe}: ${t}${def}`;
  });
  const bodyFields = fields.length ? fields.join("\n") : "    pass";
  // When any field is aliased, allow construction by the Python attr name too,
  // so callers aren't forced to use the wire name (e.g. `from`).
  const config = aliased
    ? `    model_config = ConfigDict(extra="ignore", populate_by_name=True)\n\n`
    : `    model_config = ConfigDict(extra="ignore")\n\n`;
  return `class ${name}(BaseModel):\n` + doc + config + `${bodyFields}\n`;
}

export function emitPython(schemas: SchemaMap): string {
  const names = Object.keys(schemas).sort();
  const aliases: string[] = [];
  const models: string[] = [];

  for (const name of names) {
    const s = schemas[name]!;
    const isStringEnum = !!s.enum && (s.type === "string" || s.type === undefined);
    const isObject = s.type === "object" && !!s.properties && !s.anyOf && !s.oneOf && !s.allOf;
    if (isStringEnum) aliases.push(emitEnumAlias(name, s));
    else if (isObject) models.push(emitModel(name, s));
    else aliases.push(`${name} = ${pyType(s)}\n`);
  }

  const rebuild = `\n# Resolve forward references across all generated models.\nfor _m in list(globals().values()):\n    if isinstance(_m, type) and issubclass(_m, BaseModel) and _m is not BaseModel:\n        _m.model_rebuild()\n`;

  const exportNames = names.map((n) => `    "${n}",`).join("\n");
  const dunderAll = `\n__all__ = [\n${exportNames}\n]\n`;

  return `${BANNER}\n${aliases.join("")}\n${models.join("\n")}${rebuild}${dunderAll}`;
}
