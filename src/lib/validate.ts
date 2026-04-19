export type ValidationIssue = { path: string; message: string };
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; issues: ValidationIssue[] };

type Rule = (value: unknown, path: string) => ValidationIssue[];

function ok(): ValidationIssue[] {
  return [];
}

export const v = {
  string(opts: { min?: number; max?: number; pattern?: RegExp; trim?: boolean } = {}): Rule {
    return (value, path) => {
      if (typeof value !== "string") return [{ path, message: "must be a string" }];
      const s = opts.trim ? value.trim() : value;
      if (opts.min !== undefined && s.length < opts.min) return [{ path, message: `min length ${opts.min}` }];
      if (opts.max !== undefined && s.length > opts.max) return [{ path, message: `max length ${opts.max}` }];
      if (opts.pattern && !opts.pattern.test(s)) return [{ path, message: "invalid format" }];
      return ok();
    };
  },
  number(opts: { min?: number; max?: number; int?: boolean } = {}): Rule {
    return (value, path) => {
      const n = typeof value === "string" ? Number(value) : value;
      if (typeof n !== "number" || Number.isNaN(n)) return [{ path, message: "must be a number" }];
      if (opts.int && !Number.isInteger(n)) return [{ path, message: "must be integer" }];
      if (opts.min !== undefined && n < opts.min) return [{ path, message: `min ${opts.min}` }];
      if (opts.max !== undefined && n > opts.max) return [{ path, message: `max ${opts.max}` }];
      return ok();
    };
  },
  boolean(): Rule {
    return (value, path) =>
      typeof value === "boolean" ? ok() : [{ path, message: "must be boolean" }];
  },
  enum<T extends string>(values: readonly T[]): Rule {
    return (value, path) =>
      typeof value === "string" && (values as readonly string[]).includes(value)
        ? ok()
        : [{ path, message: `must be one of: ${values.join(", ")}` }];
  },
  array(itemRule: Rule, opts: { min?: number; max?: number } = {}): Rule {
    return (value, path) => {
      if (!Array.isArray(value)) return [{ path, message: "must be an array" }];
      if (opts.min !== undefined && value.length < opts.min)
        return [{ path, message: `min items ${opts.min}` }];
      if (opts.max !== undefined && value.length > opts.max)
        return [{ path, message: `max items ${opts.max}` }];
      return value.flatMap((item, i) => itemRule(item, `${path}[${i}]`));
    };
  },
  optional(rule: Rule): Rule {
    return (value, path) => (value === undefined || value === null ? ok() : rule(value, path));
  },
  object(shape: Record<string, Rule>, opts: { strict?: boolean } = {}): Rule {
    return (value, path) => {
      if (!value || typeof value !== "object" || Array.isArray(value))
        return [{ path, message: "must be an object" }];
      const issues: ValidationIssue[] = [];
      const keys = Object.keys(shape);
      for (const k of keys) {
        const subPath = path ? `${path}.${k}` : k;
        issues.push(...shape[k]((value as Record<string, unknown>)[k], subPath));
      }
      if (opts.strict) {
        const extra = Object.keys(value).filter((k) => !keys.includes(k));
        if (extra.length > 0)
          issues.push({ path, message: `unexpected keys: ${extra.join(", ")}` });
      }
      return issues;
    };
  },
};

export function validate<T>(input: unknown, rule: Rule): ValidationResult<T> {
  const issues = rule(input, "");
  if (issues.length === 0) return { ok: true, data: input as T };
  return { ok: false, issues };
}

/** Parse JSON body from a Request; throws only if body is malformed JSON. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
