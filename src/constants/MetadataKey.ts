const METADATA_KEY_PREFIX = 'luren-schema:'

const key = (metadataKey: string) => {
  return METADATA_KEY_PREFIX + metadataKey
}
export const MetadataKey = {
  SCHEMA: key('SCHEMA'),
  PROPS: key('PROPS'),
  SIMPLE_SCHEMA_RESOLVER: key('SIMPLE_SCHEMA_RESOLVER'),
  JSON_SCHEMA: key('JSON_SCHEMA')
}

export default MetadataKey
