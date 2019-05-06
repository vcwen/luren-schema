import { Schema } from '../decorators/schema'
import { Prop } from '../decorators/Prop'

@Schema()
export default class IncomingFile {
  @Prop()
  public size: number
  public path: string
  public name: string
  public type: string
  public hash?: string
  constructor(name: string, path: string, type: string, size: number) {
    this.name = name
    this.path = path
    this.type = type
    this.size = size
  }
}
