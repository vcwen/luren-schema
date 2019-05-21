import { Map } from 'immutable'
import _ from 'lodash'
import { IJsSchema, IJsTypeOptions, ITypeOptions } from '../types'
import { getDeserialize, getSerialize, getValidate } from './utils'

export abstract class DataTypes<T extends ITypeOptions> {
  private _types = Map<string, T>()
  public add(type: string, options: T) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, options)
  }
  public get(type: string) {
    return this._types.get(type)
  }
}

// tslint:disable-next-line: max-classes-per-file
export class JsDataTypes extends DataTypes<IJsTypeOptions> {}

export const jsDataTypes = new JsDataTypes()

// tslint:disable-next-line: max-classes-per-file
class StringTypeOptions implements IJsTypeOptions {
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'string') {
      return [true, '']
    } else {
      return [false, `Invalid string:${val}`]
    }
  }
  public serialize(_1: IJsSchema, val?: string) {
    return val
  }
  public deserialize(schema: IJsSchema, val?: any) {
    if (val === undefined) {
      return schema.default
    } else {
      return typeof val === 'string' ? val : JSON.stringify(val)
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
class BooleanTypeOptions implements IJsTypeOptions {
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'boolean') {
      return [true, '']
    } else {
      return [false, `Invalid boolean: ${val}`]
    }
  }
  public serialize(_1: IJsSchema, val?: boolean) {
    return val
  }
  public deserialize(schema: IJsSchema, val?: any) {
    if (val === undefined) {
      return schema.default
    } else {
      return typeof val === 'boolean' ? val : val ? true : false
    }
  }
}
// tslint:disable-next-line: max-classes-per-file
class NumberTypeOptions implements IJsTypeOptions {
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'number') {
      return [true, '']
    } else {
      return [false, `invalid number: ${val}`]
    }
  }
  public serialize(_1: IJsSchema, val?: number) {
    return val
  }
  public deserialize(schema: IJsSchema, val?: any) {
    if (val === undefined) {
      return schema.default
    } else {
      return typeof val === 'number' ? val : Number.parseFloat(val)
    }
  }
}
// tslint:disable-next-line: max-classes-per-file
class ArrayTypeOptions implements IJsTypeOptions {
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
class ObjectTypeOptions implements IJsTypeOptions {
  public type: string = 'object'
  public validate(schema: IJsSchema, data: any): [boolean, string] {
    if (typeof data !== 'object') {
      return [false, 'Invalid object']
    }
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
          if (propSchema.private) {
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
      const properties = schema.properties
      if (properties && !_.isEmpty(properties)) {
        const obj = schema.classConstructor ? new schema.classConstructor() : {}
        const propNames = Object.getOwnPropertyNames(properties)
        for (const prop of propNames) {
          const propSchema = properties[prop]
          if (propSchema.private) {
            continue
          }
          const deserialize = getDeserialize(propSchema)
          let value = Reflect.get(data, prop)
          if (deserialize) {
            value = deserialize(propSchema, value)
          }
          Reflect.set(obj, prop, value)
        }
        return obj
      } else {
        return data
      }
    }
  }
}

jsDataTypes.add('string', new StringTypeOptions())
jsDataTypes.add('boolean', new BooleanTypeOptions())
jsDataTypes.add('number', new NumberTypeOptions())
jsDataTypes.add('array', new ArrayTypeOptions())
jsDataTypes.add('object', new ObjectTypeOptions())
