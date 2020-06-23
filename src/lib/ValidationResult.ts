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
  public static error(error: string | IValidationError) {
    return new ValidationResult(
      false,
      typeof error === 'string' ? new ValidationError(error) : error
    )
  }
  public valid: boolean
  public error?: IValidationError
  constructor(valid: boolean, error?: IValidationError | string) {
    this.valid = valid
    this.error = typeof error === 'string' ? new ValidationError(error) : error
  }
}

export default ValidationResult
