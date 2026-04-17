export class ApiValidationError extends Error {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];

  constructor(message: string, options?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  }) {
    super(message);
    this.name = "ApiValidationError";
    this.fieldErrors = options?.fieldErrors;
    this.formErrors = options?.formErrors;
  }
}
