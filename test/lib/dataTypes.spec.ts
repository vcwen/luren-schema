import jsonDataType from '../../src/lib/JsonDataType'
import { IJsonOptions } from '../../src'

describe('StringJsonProcessor', () => {
  it('should have string type', () => {
    const stringProcessor = jsonDataType.get('string') as IJsonOptions
    expect(stringProcessor.type).toBe('string')
  })
})
