import type { PropertySync, Properties, OcaRootProperties } from './aes70.js'

declare module 'aes70/src/controller/object_base.js' {
	interface ObjectBase {
		GetPropertySync(): PropertySync<OcaRootProperties>
		get_properties(): Properties
	}
}

declare module 'aes70/src/controller/udp_connection.js' {
	interface IUDPConnectionOptions {
		/**
		 * Aborts the connect attempt. AbstractUDPConnection.connect() honours it, but
		 * aes70's typings only declare it on IAbstractUDPConnectionOptions.
		 */
		connectSignal?: AbortSignal
	}
}
