import { Map } from 'immutable'
import _ from 'lodash'
import { IJsSchema, ITypeOptions } from '../types'
import { getDeserialize, getSerialize, getValidate } from './utils'

export class DataType {
  public static add(type: string, options: ITypeOptions) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, options)
  }
  public static get(type: string) {
    return this._types.get(type)
  }
  private static _types = Map<string, ITypeOptions>()
}

// tslint:disable-next-line: max-classes-per-file
class StringTypeOptions implements ITypeOptions {
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'string') {
      return [true, '']
    } else {
      return [false, `Invalid string:${val}`]
    }
  }
  public serialize(_1: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      return typeof val === 'string' ? val : JSON.stringify(val)
    }
  }
  public deserialize(schema: IJsSchema, val?: string) {
    if (val === undefined) {
      return schema.defaultVal
    } else {
      return val
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
class BooleanTypeOptions implements ITypeOptions {
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'boolean') {
      return [true, '']
    } else {
      return [false, `Invalid boolean: ${val}`]
    }
  }
  public serialize(_1: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      return val ? true : false
    }
  }
  public deserialize(schema: IJsSchema, val?: boolean) {
    if (val === undefined) {
      return schema.default
    } else {
      return val
    }
  }
}
// tslint:disable-next-line: max-classes-per-file
class NumberTypeOptions implements ITypeOptions {
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'number') {
      return [true, '']
    } else {
      return [false, `invalid number: ${val}`]
    }
  }
  public serialize(_1: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      return Number.parseFloat(val)
    }
  }
  public deserialize(schema: IJsSchema, val?: number) {
    if (val === undefined) {
      return schema.default
    } else {
      return val
    }
  }
}
// tslint:disable-next-line: max-classes-per-file
class ArrayTypeOptions implements ITypeOptions {
  public type: string = 'array'
  public validate(schema: IJsSchema, val: any): [boolean, string] {
    if (Array.isArray(val)) {
      const itemSchema = schema.items
      if (itemSchema) {
        const validate = getValidate(itemSchema)
        for (let i = 0; i < val.length; i++) {
          if (validate) {
            const [valid, msg] = validate(itemSchema, val[i])
            if (!valid) {
              return [valid, `[${i}]${msg}`]
            }
          }
        }
      }
      return [true, '']
    } else {
      return [false, 'Invalid array']
    }
  }
  public serialize(schema: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      if (Array.isArray(val)) {
        const itemSchema = schema.items
        if (itemSchema) {
          const serialize = getSerialize(itemSchema)
          if (serialize) {
            return val.map((item) => serialize(itemSchema, item))
          } else {
            return val
          }
        } else {
          return val
        }
      } else {
        throw new Error('Data must be an array')
      }
    }
  }
  public deserialize(schema: IJsSchema, val?: any[]) {
    if (val === undefined) {
      return schema.default
    } else {
      if (Array.isArray(val)) {
        const itemSchema = schema.items
        if (itemSchema) {
          const deserialize = getDeserialize(itemSchema)
          if (deserialize) {
            return val.map((item) => deserialize(itemSchema, item))
          } else {
            return val
          }
        } else {
          return val
        }
      }
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
class ObjectTypeOptions implements ITypeOptions {
  public type: string = 'object'
  public validate(schema: IJsSchema, data: any): [boolean, string] {
    if (typeof data !== 'object') {
      return [false, 'Invalid object']
    } else {
      const properties = schema.properties || {}
      const requiredProps = schema.required
      if (requiredProps) {
        for (const prop of requiredProps) {
          if (Reflect.get(data, prop) === undefined) {
            return [false, `${prop} is required`]
          }
        }
      }

      const propNames = Object.getOwnPropertyNames(properties)
      for (const prop of propNames) {
        const propSchema = properties[prop]
        const validate = getValidate(propSchema)
        const value = Reflect.get(data, prop)
        if (validate) {
          const [valid, msg] = validate(propSchema, value)
          if (!valid) {
            return [valid, msg]
          }
        }
      }
      return [true, '']
    }
  }
  public serialize(schema: IJsSchema, data?: object) {
    if (data === undefined) {
      return undefined
    } else {
      const properties = schema.properties
      const json: any = {}
      if (properties) {
        const propNames = Object.getOwnPropertyNames(properties)
        for (const prop of propNames) {
          const propSchema = properties[prop]
          if (propSchema.json && propSchema.json.disabled) {
            continue
          }
          const serialize = getSerialize(propSchema)
          let value = Reflect.get(data, prop)
          if (serialize) {
            value = serialize(propSchema, value)
          }
          Reflect.set(json, prop, value)
        }
      } else {
        Object.assign(json, data)
      }
      return json
    }
  }
  public deserialize(schema: IJsSchema, data?: object) {
    if (data === undefined) {
      return schema.default
    } else {
      const obj = schema.classConstructor ? new schema.classConstructor() : {}
      const properties = schema.properties
      if (properties) {
        const propNames = Object.getOwnPropertyNames(properties)
        for (const prop of propNames) {
          const propSchema = properties[prop]
          if (propSchema.json && propSchema.json.disabled) {
            continue
          }
          const deserialize = getDeserialize(propSchema)
          let value = Reflect.get(data, prop)
          if (deserialize) {
            value = deserialize(propSchema, value)
          }
          Reflect.set(obj, prop, value)
        }
      } else {
        Object.assign(obj, data)
      }
      return obj
    }
  }
}

DataType.add('string', new StringTypeOptions())
DataType.add('boolean', new BooleanTypeOptions())
DataType.add('number', new NumberTypeOptions())
DataType.add('array', new ArrayTypeOptions())
DataType.add('object', new ObjectTypeOptions())
