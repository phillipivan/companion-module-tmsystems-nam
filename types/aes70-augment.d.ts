import type { PropertySync, Properties, OcaRootProperties } from './aes70.js'

declare module 'aes70/src/controller/object_base.js' {
	interface ObjectBase {
		GetPropertySync(): PropertySync<OcaRootProperties>
		get_properties(): Properties
	}
}
