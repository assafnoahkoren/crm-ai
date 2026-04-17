import { describe, test, expect } from "bun:test";
import { interpolateTemplate } from "./template";

describe("Template Interpolation", () => {
  test("interpolates lead variables", () => {
    const result = interpolateTemplate("Hello {{lead.name}}, welcome!", {
      lead: { name: "David" },
    });
    expect(result).toBe("Hello David, welcome!");
  });

  test("interpolates multiple variables", () => {
    const result = interpolateTemplate(
      "Hi {{lead.name}} from {{lead.company}}, welcome to {{org.name}}!",
      {
        lead: { name: "Sarah", company: "TechCo" },
        org: { name: "CRM-AI" },
      },
    );
    expect(result).toBe("Hi Sarah from TechCo, welcome to CRM-AI!");
  });

  test("keeps unresolved placeholders", () => {
    const result = interpolateTemplate("Hello {{lead.name}}, agent: {{agent.name}}", {
      lead: { name: "David" },
    });
    expect(result).toBe("Hello David, agent: {{agent.name}}");
  });

  test("handles empty context", () => {
    const result = interpolateTemplate("Hello {{lead.name}}!", {});
    expect(result).toBe("Hello {{lead.name}}!");
  });

  test("handles text without placeholders", () => {
    const result = interpolateTemplate("No variables here", { lead: { name: "Test" } });
    expect(result).toBe("No variables here");
  });
});
