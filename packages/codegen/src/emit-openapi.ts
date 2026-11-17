/** Manifest + schema set → OpenAPI 3.1 document. */
import type { SchemaMap } from "./jsonschema.js";
import { ALL_OPERATIONS, type OperationSpec } from "../../../spec/manifest.js";

/** Envelope keys whose payload is an array (vs a single object). */
const ARRAY_ENVELOPES = new Set([
  "agents",
  "versions",
  "executions",
  "connectors",
  "results",
  "installs",
  "payouts",
  "suites",
  "keys",
  "templates",
  "projects",
  "models",
]);

function schemaRef(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function responseSchema(op: OperationSpec): object | null {
  if ("status" in op.response) return null; // 204
  const { type, envelope } = op.response;
  const inner = schemaRef(type);
  if (!envelope) return inner;
  const payload = ARRAY_ENVELOPES.has(envelope) ? { type: "array", items: inner } : inner;
  return {
    type: "object",
    properties: { [envelope]: payload },
    required: [envelope],
  };
}

export function emitOpenApi(schemas: SchemaMap, version: string): object {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const op of ALL_OPERATIONS) {
    const oapiPath = op.path; // already uses {param} templating
    paths[oapiPath] ??= {};

    const parameters = [
      ...(op.pathParams ?? []).map((p) => ({
        name: p.name,
        in: "path",
        required: true,
        description: p.description,
        schema: p.enum ? { type: p.type, enum: p.enum } : { type: p.type },
      })),
      ...(op.query ?? []).map((p) => ({
        name: p.name,
        in: "query",
        required: !!p.required,
        description: p.description,
        schema: p.enum ? { type: p.type, enum: p.enum } : { type: p.type },
      })),
      ...(op.headers ?? []).map((h) => ({
        name: h.name,
        in: "header",
        required: !!h.required,
        description: h.description,
        schema: { type: "string" },
      })),
    ];

    const respSchema = responseSchema(op);
    const responses =
      respSchema === null
        ? { "204": { description: "No content." } }
        : {
            "200": {
              description: op.summary,
              content: { "application/json": { schema: respSchema } },
            },
          };

    const operation: Record<string, unknown> = {
      operationId: `${op.resource}_${op.id}`,
      summary: op.summary,
      tags: [op.resource],
      "x-scope": op.scope,
      "x-status": op.status,
      parameters,
      responses,
      // Public run view is the only unauthenticated endpoint.
      security: op.path === "/executions/public/{id}" ? [] : [{ bearerAuth: [] }],
    };

    if (op.body) {
      operation.requestBody = {
        required: true,
        content: { "application/json": { schema: schemaRef(op.body) } },
      };
    }

    paths[oapiPath][op.method.toLowerCase()] = operation;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Silvanexum API",
      version,
      description:
        "Proof-ranked agent platform API. Generated from src/shared/* Zod contracts. " +
        "Operations tagged `x-status: planned` are specified (M11 P0) but not yet live.",
    },
    servers: [{ url: "https://api.silvanexum.com", description: "Production" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "A Silvanexum API key: `Authorization: Bearer sx_live_...`",
        },
      },
      schemas,
    },
    security: [{ bearerAuth: [] }],
    paths,
  };
}
