// Codegen is the single source of truth for every generated client (TS types,
// Python models, OpenAPI spec). These tests pin: registry + route-manifest
// integrity, the $ref helper, and the three pure emitters against a synthetic
// SchemaMap — so a regression in the generator is caught before it fans out to
// all downstream packages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { refName, type SchemaMap } from "../src/jsonschema.js";
import { emitTypeScript } from "../src/emit-ts.js";
import { emitPython } from "../src/emit-py.js";
import { emitOpenApi } from "../src/emit-openapi.js";
import { ZOD_SCHEMAS, SUPPLEMENTAL } from "../src/registry.js";
import { ALL_OPERATIONS } from "../../../spec/manifest.js";

// A representative schema set: an object with required + optional + documented
// props, an array, a cross-schema $ref, and a top-level string enum.
const SCHEMAS: SchemaMap = {
  Widget: {
    type: "object",
    properties: {
      id: { type: "string" },
      count: { type: "number" },
      label: { type: "string", description: "the label" },
      tags: { type: "array", items: { type: "string" } },
      kind: { $ref: "#/components/schemas/Kind" },
    },
    required: ["id", "count"],
    additionalProperties: false,
  },
  Kind: { type: "string", enum: ["a", "b", "c"] },
};

test("registry: ZOD_SCHEMAS entries are complete and unique", () => {
  assert.ok(ZOD_SCHEMAS.length > 0);
  const exps = new Set<string>();
  const names = new Set<string>();
  for (const r of ZOD_SCHEMAS) {
    assert.ok(r.export && r.export.length > 0, `empty export: ${JSON.stringify(r)}`);
    assert.ok(r.name && /^[A-Z]/.test(r.name), `bad type name: ${r.name}`);
    assert.ok(!exps.has(r.export), `duplicate export symbol: ${r.export}`);
    assert.ok(!names.has(r.name), `duplicate emitted name: ${r.name}`);
    exps.add(r.export);
    names.add(r.name);
  }
});

test("registry: SUPPLEMENTAL schemas are named objects", () => {
  for (const [name, schema] of Object.entries(SUPPLEMENTAL)) {
    assert.ok(name.length > 0 && /^[A-Z]/.test(name), `bad supplemental name: ${name}`);
    assert.equal(typeof schema, "object");
    assert.ok(schema && !Array.isArray(schema));
  }
});

test("manifest: every operation is well-formed with a unique operationId", () => {
  assert.ok(ALL_OPERATIONS.length > 0);
  const ids = new Set<string>();
  const methods = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);
  for (const op of ALL_OPERATIONS) {
    assert.ok(op.id && op.resource, `missing id/resource: ${JSON.stringify(op)}`);
    assert.ok(methods.has(op.method), `bad method: ${op.method}`);
    assert.ok(op.path.startsWith("/"), `path must be absolute: ${op.path}`);
    assert.ok(["live", "planned"].includes(op.status), `bad status: ${op.status}`);
    const opId = `${op.resource}_${op.id}`;
    assert.ok(!ids.has(opId), `duplicate operationId: ${opId}`);
    ids.add(opId);
  }
});

test("refName: resolves component refs and rejects anything else", () => {
  assert.equal(refName("#/components/schemas/AgentView"), "AgentView");
  assert.throws(() => refName("AgentView"), /Unsupported \$ref/);
  assert.throws(() => refName("#/definitions/AgentView"), /Unsupported \$ref/);
});

test("emitTypeScript: objects → interfaces, optionality, enums, arrays, refs", () => {
  const out = emitTypeScript(SCHEMAS);
  assert.match(out, /export interface Widget/);
  assert.match(out, /\bid: string/, "required prop has no ?");
  assert.match(out, /\bcount: number/);
  assert.match(out, /label\?: string/, "optional prop gets ?");
  assert.match(out, /tags\?: Array<string>/, "array maps to Array<>");
  assert.match(out, /kind\?: Kind/, "ref inlines to the bare type name");
  assert.match(out, /\/\*\* the label \*\//, "descriptions become doc comments");
  // Top-level string enum → union type alias, not an interface.
  assert.match(out, /export type Kind = "a" \| "b" \| "c";/);
});

test("emitPython: models → BaseModel classes, enums → Literal aliases, rebuild", () => {
  const out = emitPython(SCHEMAS);
  assert.match(out, /from pydantic import BaseModel/);
  assert.match(out, /class Widget\(BaseModel\):/);
  assert.match(out, /\bid: str\b/, "required str field");
  assert.match(out, /count: (float|int|Union)/);
  assert.match(out, /label: Optional\[str\] = None/, "optional field is Optional + None default");
  assert.match(out, /Kind = Literal\["a", "b", "c"\]/, "top-level enum → Literal alias");
  assert.match(out, /model_rebuild\(\)/, "forward refs resolved");
  assert.match(out, /__all__ = \[/);
  assert.ok(out.includes('"Widget",') && out.includes('"Kind",'), "both names exported");
});

test("emitOpenApi: valid 3.1 doc, version threaded, schemas + paths present", () => {
  const doc = emitOpenApi(SCHEMAS, "9.9.9") as {
    openapi: string;
    info: { version: string };
    components: { schemas: SchemaMap };
    paths: Record<string, unknown>;
  };
  assert.equal(doc.openapi, "3.1.0");
  assert.equal(doc.info.version, "9.9.9", "version is threaded through");
  assert.ok("Widget" in doc.components.schemas && "Kind" in doc.components.schemas);
  assert.ok(Object.keys(doc.paths).length > 0, "operations produced paths");
  // Must be JSON-serializable (this is what gets written to spec/openapi.json).
  assert.doesNotThrow(() => JSON.stringify(doc));
  const round = JSON.parse(JSON.stringify(doc));
  assert.equal(round.info.title, "Silvanexum API");
});
