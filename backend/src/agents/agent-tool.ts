export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  description?: string;
  enum?: unknown[];
  [key: string]: unknown;
}

export interface SecurityRequirement {
  [schemeName: string]: string[];
}

export interface AgentTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JsonSchema;
  };
  metadata: {
    method: string;
    path: string;
    operationId?: string;
    isMutation: boolean;
    security: SecurityRequirement[];
    params: {
      path: string[];
      query: string[];
      header: string[];
      body: string[];
    };
  };
}
