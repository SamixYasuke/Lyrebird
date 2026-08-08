import { Injectable, Logger } from '@nestjs/common';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse as parseYaml } from 'yaml';
import {
  AgentTool,
  JsonSchema,
  SecurityRequirement,
} from '@/agents/agent-tool';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

type OpenApiDocument = {
  paths: Record<string, Record<string, OpenApiOperation>>;
  security?: SecurityRequirement[];
};

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: JsonSchema }>;
  };
  security?: SecurityRequirement[];
};

type OpenApiParameter = {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
  type?: string;
};

@Injectable()
export class OpenApiParserService {
  private readonly logger = new Logger(OpenApiParserService.name);

  async parse(spec: string): Promise<AgentTool[]> {
    const document = parseYaml(spec) as OpenApiDocument;
    if (!document.paths) {
      throw new Error('Invalid OpenAPI spec: missing "paths"');
    }

    const resolved = (await SwaggerParser.dereference(
      document,
    )) as OpenApiDocument;

    const tools: AgentTool[] = [];

    for (const [path, pathItem] of Object.entries(resolved.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = pathItem?.[method];
        if (!operation) continue;

        const tool = this.buildTool(path, method, operation, resolved);
        if (tool) tools.push(tool);
      }
    }

    if (tools.length === 0) {
      throw new Error('No operations found in OpenAPI spec');
    }

    return tools;
  }

  private buildTool(
    path: string,
    method: (typeof HTTP_METHODS)[number],
    operation: OpenApiOperation,
    document: OpenApiDocument,
  ): AgentTool {
    const name = this.buildToolName(operation.operationId, method, path);
    const description = this.buildDescription(operation, path, method);
    const { schema, params } = this.buildParameters(operation);
    const security = operation.security ?? document.security ?? [];

    return {
      type: 'function',
      function: { name, description, parameters: schema },
      metadata: {
        method: method.toUpperCase(),
        path,
        operationId: operation.operationId,
        isMutation: this.isMutation(method),
        security,
        params,
      },
    };
  }

  private buildToolName(
    operationId: string | undefined,
    method: string,
    path: string,
  ): string {
    const source = operationId ?? `${method} ${path}`;
    const name = source
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    return name || `${method}_endpoint`;
  }

  private buildDescription(
    operation: OpenApiOperation,
    path: string,
    method: string,
  ): string {
    const parts: string[] = [];
    const summary = operation.summary ?? operation.description;
    if (summary) parts.push(summary);
    parts.push(`HTTP ${method.toUpperCase()} ${path}`);
    return parts.join('\n');
  }

  private buildParameters(operation: OpenApiOperation): {
    schema: JsonSchema;
    params: {
      path: string[];
      query: string[];
      header: string[];
      body: string[];
    };
  } {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    const params: {
      path: string[];
      query: string[];
      header: string[];
      body: string[];
    } = { path: [], query: [], header: [], body: [] };

    for (const param of operation.parameters ?? []) {
      const schema: JsonSchema = {
        ...(param.schema ?? { type: param.type ?? 'string' }),
      };
      if (param.description) schema.description = param.description;
      properties[param.name] = schema;
      if (param.required) required.push(param.name);
      const location = param.in as keyof typeof params;
      if (location in params) params[location].push(param.name);
    }

    const bodySchema = this.extractRequestBodySchema(operation);
    if (bodySchema) {
      if (bodySchema.type === 'object' && bodySchema.properties) {
        for (const name of Object.keys(bodySchema.properties)) {
          if (!properties[name]) {
            properties[name] = bodySchema.properties[name];
            params.body.push(name);
          }
        }
        for (const name of bodySchema.required ?? []) required.push(name);
      } else {
        properties['body'] = bodySchema;
        params.body.push('body');
        if (operation.requestBody?.required) required.push('body');
      }
    }

    return {
      schema: {
        type: 'object',
        properties,
        required: [...new Set(required)],
      },
      params,
    };
  }

  private extractRequestBodySchema(
    operation: OpenApiOperation,
  ): JsonSchema | undefined {
    const content = operation.requestBody?.content;
    if (!content) return undefined;
    return (
      content['application/json']?.schema ?? Object.values(content)[0]?.schema
    );
  }

  private isMutation(method: string): boolean {
    return (
      method === 'post' ||
      method === 'put' ||
      method === 'patch' ||
      method === 'delete'
    );
  }
}
