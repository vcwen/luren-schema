import { IJsSchema, ITypeOptions } from '../types'
import { Map } from 'immutable'
import _ from 'lodash'

export class DataType {
  private _types = Map<string, ITypeOptions>()
  public add(type: string, options: ITypeOptions) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, options)
  }
  public get(type: string) {
    return this._types.get(type)
  }
}

export const dataType = new DataType()
dataType.add('string', {
  validate: (_1: IJsSchema, data: any): [boolean, string] => {
    if (typeof data === 'string') {
      return [true, '']
    } else {
      return [false, `Invalid string value:${data}`]
    }
  }
})
dataType.add('boolean', {
  validate: (_1: IJsSchema, data: any): [boolean, string] => {
    if (typeof data === 'boolean') {
      return [true, '']
    } else {
      return [false, `Invalid boolean value:${data}`]
    }
  }
})
dataType.add('number', {
  validate: (_1: IJsSchema, data: any): [boolean, string] => {
    if (typeof data === 'number') {
      return [true, '']
    } else {
      return [false, `Invalid number value:${data}`]
    }
  }
})
dataType.add('array', {
  validate: (_1: IJsSchema, data: any): [boolean, string] => {
    if (Array.isArray(data)) {
      return [true, '']
    } else {
      return [false, `Invalid array value:${data}`]
    }
  }
})
dataType.add('object', {
  validate: (schema: IJsSchema, data: any): [boolean, string] => {
    if (typeof data !== 'object') {
      return [false, `Invalid boolean value:${data}`]
    } else {
      const properties = schema.properties
      if (!properties || _.isEmpty(properties)) {
        return [true, '']
      } else {
        const props = Object.getOwnPropertyNames(properties)
        for (const prop of props) {
          const propSchema = properties[prop]
          let validate = propSchema.validate
          if (!validate) {
            const options = dataType.get(propSchema.type)
            if (options) {
              validate = options.validate
            } else {
              // return true if the type is not set
              validate = () => [true, '']
            }
          }
          const [valid, msg] = validate(propSchema, Reflect.get(data, prop))
          if (!valid) {
            return [false, msg]
          }
        }
        return [true, '']
      }
    }
  }
})
export default dataType
