export interface IValidationError {
  prop?: string
  message?: string
  toString(): string
}

export class ValidationError implements IValidationError {
  public prop?: string
  public message: string
  constructor(message: string)
  // tslint:disable-next-line: unified-signatures
  constructor(prop: string, message: string)
  constructor(...args: string[]) {
    if (args.length === 1) {
      this.message = args[0]
    } else {
      this.prop = args[0]
      this.message = args[1]
    }
  }
  public toString() {
    return `${this.prop}: ${this.message}`
  }
}

export default ValidationError
