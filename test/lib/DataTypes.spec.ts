import { DataTypes } from '../../src'

describe('DataTypes', () => {
  describe('get', () => {
    it('should have string type', () => {
      const stringType = DataTypes.get('string')
      expect(stringType.type).toBe('string')
    })
    it('should throw error if i', () => {
      expect(() => {
        DataTypes.get('no_type')
      }).toThrowError()
    })
  })
  describe('register', () => {
    it('should register new type', () => {
      DataTypes.register('new_type', { type: 'new' } as any)
      const newType = DataTypes.get('new_type')
      expect(newType.type).toBe('new')
    })
    it('should throw error if the type already exists', () => {
      expect(() => {
        DataTypes.register('string', { type: 'new' } as any)
      }).toThrowError()
    })
  })
  describe('update', () => {
    it('should override the existing type', () => {
      DataTypes.update('string', { type: 'new_string' } as any)
      const newType = DataTypes.get('string')
      expect(newType.type).toBe('new_string')
    })
  })
})
