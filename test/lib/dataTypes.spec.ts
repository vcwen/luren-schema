import jsonDataType from '../../src/lib/JsonDataType'
import { IJsonProcessor } from '../../src'

describe('StringJsonProcessor', () => {
  it('should have string type', () => {
    const stringProcessor = jsonDataType.get('string') as IJsonProcessor
    expect(stringProcessor.type).toBe('string')
  })
})
