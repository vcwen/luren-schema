import ValidationError, { IValidationError } from './ValidationError'

export interface IValidationResult {
  valid: boolean
  error?: IValidationError
}

// tslint:disable-next-line: max-classes-per-file
export class ValidationResult implements IValidationResult {
  public static ok() {
    return new ValidationResult(true)
  }
  public static invalid(error?: string | ValidationError) {
    return new ValidationResult(
      false,
      typeof error === 'string' ? new ValidationError(error) : error
    )
  }
  public static error(error: string | ValidationError) {
    return this.invalid(error)
  }
  public valid: boolean
  public error?: ValidationError
  constructor(valid: boolean, error?: ValidationError | string) {
    this.valid = valid
    this.error = typeof error === 'string' ? new ValidationError(error) : error
  }
}
