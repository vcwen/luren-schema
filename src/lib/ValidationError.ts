export interface IValidationError extends Error {
  prop?: string
  chainProp(prop: string): IValidationError
}

export class ValidationError extends Error implements IValidationError {
  public prop?: string
  constructor(message: string)
  // tslint:disable-next-line: unified-signatures
  constructor(prop: string, message: string)
  constructor(...args: string[]) {
    let prop: string | undefined
    let message: string
    if (args.length === 1) {
      message = args[0]
    } else {
      prop = args[0]
      message = args[1]
      message = prop ? `${prop}: ${message}` : message
    }
    super(message)
    this.prop = prop
  }
  public chainProp(prop: string) {
    if (this.prop) {
      this.prop = `${prop}.${this.prop}`
      this.message = `${prop}.${this.message}`
    } else {
      this.prop = prop
      this.message = `${prop}: ${this.message}`
    }
    return this
  }
}

export default ValidationError
