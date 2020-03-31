import { IValidationError } from './ValidationError'

export interface IValidationResult {
  valid: boolean
  error?: IValidationError
}

// tslint:disable-next-line: max-classes-per-file
export class ValidationResult implements IValidationResult {
  public static OK = new ValidationResult(true)
  public valid: boolean
  public error?: IValidationError
  constructor(valid: boolean, error?: IValidationError) {
    this.valid = valid
    this.error = error
  }
}

export default ValidationResult
