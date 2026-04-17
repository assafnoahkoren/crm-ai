export interface TemplateContext {
  lead?: { name?: string; phone?: string; company?: string; status?: string };
  agent?: { name?: string };
  org?: { name?: string };
}

/**
 * Interpolate {{variable}} placeholders in a template string.
 * Supports: {{lead.name}}, {{lead.phone}}, {{lead.company}}, {{lead.status}},
 *           {{agent.name}}, {{org.name}}
 */
export function interpolateTemplate(template: string, ctx: TemplateContext): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj: string, field: string) => {
    const source = ctx[obj as keyof TemplateContext];
    if (source && field in source) {
      return String((source as Record<string, unknown>)[field] || "");
    }
    return match; // Keep original if not found
  });
}
