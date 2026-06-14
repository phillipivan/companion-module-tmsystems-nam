## Open Control Architecture: AES70

[OCA Alliance](https://ocaalliance.com)

Connect to AES70/OCA-compatible devices via TCP, UDP, or WebSockets. Get or set properties on the device's control objects.

#### How it works

When the module connects, it loads the device's role map and discovers every control class it exposes. For each control class that has at least one property of a supported data type, the module automatically generates one action and one value feedback for that class.

#### Actions

| Option           | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `Control Object` | Dropdown listing the available objects of that class on the device |
| `Property`       | Dropdown listing the supported properties for that class           |
| `Value`          | The value to set on the selected property                          |

#### Feedbacks

| Option              | Description                                                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Control Object`    | Dropdown listing the available objects of that class on the device                                                                                                                                                                                                         |
| `Property`          | Dropdown listing the supported properties for that class                                                                                                                                                                                                                   |
| `Use Property Sync` | Enabled by default - uses the library's property-tracking ("sync") mechanism to keep the feedback value up to date. When disabled, the module instead uses the library's `async` getter directly, which can return different (and sometimes more complex) data structures. |

For more detail on how properties, getters, and sync work, see the [AES70.js documentation](https://docs.deuso.de/AES70.js/introduction.html).

#### Caveats

- This module has not yet reached a stable `1.0` release - breaking changes may occur without notice.
- Compatibility with custom (vendor-specific) control classes is untested.
- Connections via UDP and WebSockets are untested.
- Actions only support setting properties with simple data types (`string | number | boolean`).
- Enum properties are only handled numerically.
