import { IJsSchema, JsTypes, Prop, Schema, StringType, utils } from '../../src'

describe('JsTypes', () => {
  describe('get', () => {
    it('should have string type', () => {
      const stringType = JsTypes.get('string')
      expect(stringType.type).toBe('string')
    })
    it('should throw error if i', () => {
      expect(() => {
        JsTypes.get('no_type')
      }).toThrowError()
    })
  })
  describe('register', () => {
    it('should register new type', () => {
      JsTypes.register('new_type', { type: 'new' } as any)
      const newType = JsTypes.get('new_type')
      expect(newType.type).toBe('new')
    })
    it('should throw error if the type already exists', () => {
      expect(() => {
        JsTypes.register('string', { type: 'new' } as any)
      }).toThrowError()
    })
  })
  describe('update', () => {
    it('should override the existing type', () => {
      JsTypes.update('string', { type: 'new_string' } as any)
      const newType = JsTypes.get('string')
      expect(newType.type).toBe('new_string')
      JsTypes.update('string', new StringType(JsTypes))
    })
  })
  describe('validate', () => {
    it('validate the data', () => {
      const res = JsTypes.validate('string', { type: 'string' })
      expect(res.valid).toBeTruthy()
    })
  })
  describe('serialize', () => {
    it('should return serialized data', () => {
      const json = JsTypes.serialize({ name: 'my_name', foo: 'bar' }, { type: 'object' })
      expect(json).toEqual({ name: 'my_name', foo: 'bar' })
    })
  })
  describe('deserialize', () => {
    it('should  deserialize data', () => {
      @Schema()
      class Person {
        @Prop()
        public name!: string
        @Prop({ type: 'number?' })
        public foo?: number
        @Prop({ type: 'boolean' })
        public bar!: boolean
      }
      const obj = JsTypes.deserialize({ name: 'my_name', foo: 2, bar: true }, utils.getJsSchema(Person) as IJsSchema)
      expect(obj).toBeInstanceOf(Person)
      expect(obj).toEqual({ name: 'my_name', foo: 2, bar: true })
    })
  })
  describe('toJsonSchema', () => {
    it('should define JsSchema on class', () => {
      const jsonSchema = JsTypes.toJsonSchema({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          createAt: { type: 'date' },
          birthday: { type: 'date', format: 'date' },
          isVip: { type: 'boolean' },
          parents: { type: 'array', items: { type: 'string' }, maxItems: 2 },
          job: { type: 'object', properties: { tittle: { type: 'string' } } }
        },
        required: ['age', 'email']
      })
      expect(jsonSchema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          createAt: { type: 'string', format: 'date-time' },
          birthday: { type: 'string', format: 'date' },
          isVip: { type: 'boolean' },
          parents: { type: 'array', items: { type: 'string' }, maxItems: 2 },
          job: { type: 'object', properties: { tittle: { type: 'string' } } }
        },
        required: ['age', 'email']
      })
    })
  })
})
