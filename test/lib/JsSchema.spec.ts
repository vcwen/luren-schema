import { IJsSchema } from '../../src/lib/JsSchema'
import { includeSchemaProps, normalizeProps, normalizeStringProp } from '../../src/lib/utils'

describe('JsSchema', () => {
  describe('include', () => {
    // for primitive type
    it('should throw an error if include in primitive types', () => {
      const schema: IJsSchema = { type: 'string' }
      expect(() => includeSchemaProps(schema, 'name')).toThrowError()
    })
    it('should include prop via string for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      }
      expect(includeSchemaProps(schema, 'name')).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      })
    })

    it('should include prop via string array for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        required: ['name', 'age', 'address'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          address: { type: 'string' }
        }
      }
      expect(includeSchemaProps(schema, ['name', 'address'])).toEqual({
        type: 'object',
        required: ['name', 'address'],
        properties: {
          name: { type: 'string' },
          address: { type: 'string' }
        }
      })
    })
    it('should include prop via object for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          address: { type: 'object', properties: { city: { type: 'string' }, detail: { type: 'string' } } }
        }
      }
      expect(includeSchemaProps(schema, { address: 'city' })).toEqual({
        type: 'object',
        properties: {
          address: { type: 'object', properties: { city: { type: 'string' } } }
        }
      })
    })
    it('should include prop via object with required props for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          address: {
            type: 'object',
            required: ['city', 'detail'],
            properties: { city: { type: 'string' }, detail: { type: 'string' } }
          }
        }
      }
      expect(includeSchemaProps(schema, { address: 'city' })).toEqual({
        type: 'object',
        properties: {
          address: { type: 'object', required: ['city'], properties: { city: { type: 'string' } } }
        }
      })
    })

    it('should include prop via string for array type', () => {
      const schema: IJsSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          }
        }
      }
      expect(includeSchemaProps(schema, 'name')).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        }
      })
    })

    it('should include prop via string array for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        required: ['name', 'age', 'address'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          address: { type: 'string' }
        }
      }
      expect(includeSchemaProps(schema, ['name', 'address'])).toEqual({
        type: 'object',
        required: ['name', 'address'],
        properties: {
          name: { type: 'string' },
          address: { type: 'string' }
        }
      })
    })
    it('should include prop via object for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          address: { type: 'object', properties: { city: { type: 'string' }, detail: { type: 'string' } } }
        }
      }
      expect(includeSchemaProps(schema, { address: 'city' })).toEqual({
        type: 'object',
        properties: {
          address: { type: 'object', properties: { city: { type: 'string' } } }
        }
      })
    })
    it('should include prop via object with required props for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          address: {
            type: 'object',
            required: ['city', 'detail'],
            properties: { city: { type: 'string' }, detail: { type: 'string' } }
          }
        }
      }
      expect(includeSchemaProps(schema, { address: 'city' })).toEqual({
        type: 'object',
        properties: {
          address: { type: 'object', required: ['city'], properties: { city: { type: 'string' } } }
        }
      })
    })
    it('should include prop via array and object mixed with required props for object type', () => {
      const schema: IJsSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          address: {
            type: 'object',
            required: ['city', 'detail'],
            properties: { city: { type: 'string' }, detail: { type: 'string' } }
          }
        },
        required: ['age', 'address']
      }
      expect(includeSchemaProps(schema, ['name', { address: 'city' }])).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'object', required: ['city'], properties: { city: { type: 'string' } } }
        },
        required: ['address']
      })
    })
    it('should throw an error if invoke include for plain object type', () => {
      const schema: IJsSchema = {
        type: 'object'
      }
      expect(() => includeSchemaProps(schema, ['name', { address: 'city' }])).toThrowError()
    })
    // include for array type
    it('should throw an error if invoke include for plain array type', () => {
      const schema: IJsSchema = {
        type: 'array'
      }
      expect(() => includeSchemaProps(schema, ['name', { address: 'city' }])).toThrowError()
    })
    it('should include prop via array for array type', () => {
      const schema: IJsSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            address: {
              type: 'object',
              required: ['city', 'detail'],
              properties: { city: { type: 'string' }, detail: { type: 'string' } }
            }
          },
          required: ['age', 'address']
        }
      }
      expect(includeSchemaProps(schema, ['name', { address: 'city' }])).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: { type: 'object', required: ['city'], properties: { city: { type: 'string' } } }
          },
          required: ['address']
        }
      })
    })
    it('should include tuple', () => {
      const schema: IJsSchema = {
        type: 'array',
        items: [
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              address: {
                type: 'object',
                required: ['city', 'detail'],
                properties: { city: { type: 'string' }, detail: { type: 'string' } }
              }
            },
            required: ['age', 'address']
          },
          {
            type: 'string'
          },
          { type: 'number' }
        ]
      }
      expect(includeSchemaProps(schema, [{ address: 'city' }, 2])).toEqual({
        type: 'array',
        items: [
          {
            type: 'object',
            properties: {
              address: {
                type: 'object',
                required: ['city'],
                properties: { city: { type: 'string' } }
              }
            },
            required: ['address']
          },
          {
            type: 'number'
          }
        ]
      })
    })
  })
  describe('normalizeProps', () => {
    it('should normalize string props', () => {
      const props = normalizeProps('a.b.0')
      expect(props).toEqual({ a: { b: '0' } })
    })
    it('should normalize  array props', () => {
      const props = normalizeProps(['a.b.0', 'b.c[1]', { d: { e: 'f' } }])
      // const props = normalizeProps('b.c[0]')
      expect(props).toEqual([{ a: { b: '0' } }, { b: { c: '1' } }, { d: { e: 'f' } }])
    })
    it('should normalize object props', () => {
      const props = normalizeProps({ d: { 'e.k': 'f' } })
      // const props = normalizeProps('b.c[0]')
      expect(props).toEqual({ d: { e: { k: 'f' } } })
    })
  })
})
