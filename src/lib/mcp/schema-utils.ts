import { z } from 'zod';

type JsonSchemaType = {
  type: string;
  properties?: Record<string, JsonSchemaType>;
  items?: JsonSchemaType;
  required?: string[];
  description?: string;
};

export function convertJsonSchemaToZod(schema: JsonSchemaType): any {
  switch (schema.type) {
    case 'string':
      return z.string().describe(schema.description || '');
    case 'number':
      return z.number().describe(schema.description || '');
    case 'boolean':
      return z.boolean().describe(schema.description || '');
    case 'object':
      if (!schema.properties) {
        return z.record(z.any());
      }
      const shape: Record<string, any> = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        shape[key] = convertJsonSchemaToZod(value);
      }
      const baseSchema = z.object(shape);
      if (schema.required) {
        return baseSchema.required();
      }
      return baseSchema;
    case 'array':
      if (!schema.items) {
        return z.array(z.any());
      }
      return z.array(convertJsonSchemaToZod(schema.items));
    default:
      return z.any();
  }
}
