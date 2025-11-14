/**
 * Convert FormData to a plain object, handling arrays properly
 * FormData with multiple values for the same key (e.g., from getAll) are preserved as arrays
 */
function formDataToObject(formData: FormData): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};
  const seenKeys = new Set<string>();

  for (const key of formData.keys()) {
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);

    const allValues = formData.getAll(key);
    obj[key] =
      allValues.length > 1 ? allValues.map((v) => v.toString()) : (allValues[0]?.toString() ?? '');
  }

  return obj;
}

/**
 * Get the effective HTTP method from a request
 * Supports method override via _method field in form data (for HTML form limitations)
 * HTML forms only support GET and POST, so we use _method to simulate DELETE/PATCH
 */
export async function getMethod(request: Request): Promise<string> {
  const method = request.method;

  // If POST, check for method override in form data (common pattern for HTML forms)
  if (method === 'POST') {
    try {
      const formData = await request.clone().formData();
      const override = formData.get('_method')?.toString();
      if (override) {
        return override.toUpperCase();
      }
    } catch {
      // If formData can't be read, fall back to original method
    }
  }

  return method;
}

/**
 * Parse form data to a typed object
 * Converts FormData to a plain object (handling arrays)
 * No validation - backend will validate
 */
export async function parseFormData<T extends Record<string, unknown>>(
  request: Request
): Promise<T> {
  const formData = await request.formData();
  const data = formDataToObject(formData);
  return data as T;
}
