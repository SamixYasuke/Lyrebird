import { Injectable } from '@nestjs/common';
import { AgentTool } from '@/agents/agent-tool';
import { ToolExecutionResult } from '@/agents/agent.types';

export interface ExecutorContext {
  baseUrl: string;
  authHeaderName?: string | null;
  authHeaderValue?: string | null;
}

@Injectable()
export class ToolExecutorService {
  async execute(
    tool: AgentTool,
    args: Record<string, unknown>,
    context: ExecutorContext,
  ): Promise<ToolExecutionResult> {
    const url = this.buildUrl(tool, args, context.baseUrl);
    const body = this.buildBody(tool, args);
    const headers: Record<string, string> = {};

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    for (const headerName of tool.metadata.params.header) {
      const value = args[headerName];
      if (typeof value === 'string') headers[headerName] = value;
    }

    if (tool.metadata.security.length > 0) {
      if (context.authHeaderName && context.authHeaderValue) {
        headers[context.authHeaderName] = context.authHeaderValue;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: tool.metadata.method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      return { ok: false, status: 0, data: { error: 'Network error' } };
    }

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return { ok: response.ok, status: response.status, data };
  }

  private buildUrl(
    tool: AgentTool,
    args: Record<string, unknown>,
    baseUrl: string,
  ): string {
    let path = tool.metadata.path;
    for (const paramName of tool.metadata.params.path) {
      const value = args[paramName];
      if (value === undefined || value === null) {
        throw new Error(`Missing required path parameter: ${paramName}`);
      }
      const encoded = encodeURIComponent(value as string);
      path = path.replace(`{${paramName}}`, encoded);
    }

    const url = new URL(`${baseUrl.replace(/\/+$/, '')}${path}`);

    const queryNames = tool.metadata.params.query.filter(
      (name) => args[name] !== undefined && args[name] !== null,
    );
    for (const name of queryNames) {
      url.searchParams.append(name, String(args[name]));
    }

    return url.toString();
  }

  private buildBody(
    tool: AgentTool,
    args: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    const bodyNames = tool.metadata.params.body;
    if (bodyNames.length === 0) return undefined;

    const body: Record<string, unknown> = {};
    for (const name of bodyNames) {
      if (args[name] !== undefined) body[name] = args[name];
    }
    return Object.keys(body).length > 0 ? body : undefined;
  }
}
