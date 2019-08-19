import { JsDataTypes } from '../../src'

describe('DataTypes', () => {
  describe('get', () => {
    it('should have string type', () => {
      const stringType = JsDataTypes.get('string')
      expect(stringType.type).toBe('string')
    })
    it('should throw error if i', () => {
      expect(() => {
        JsDataTypes.get('no_type')
      }).toThrowError()
    })
  })
  describe('register', () => {
    it('should register new type', () => {
      JsDataTypes.register('new_type', { type: 'new' } as any)
      const newType = JsDataTypes.get('new_type')
      expect(newType.type).toBe('new')
    })
    it('should throw error if the type already exists', () => {
      expect(() => {
        JsDataTypes.register('string', { type: 'new' } as any)
      }).toThrowError()
    })
  })
  describe('update', () => {
    it('should override the existing type', () => {
      JsDataTypes.update('string', { type: 'new_string' } as any)
      const newType = JsDataTypes.get('string')
      expect(newType.type).toBe('new_string')
    })
  })
})
