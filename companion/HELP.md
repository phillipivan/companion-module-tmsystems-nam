## Open Control Architecture: AES-70

Connect via TCP, UDP or WebSockets

Set or get properties of control objects.

Each control class the device exposes will result in one action and one value feedback, so long as the class has at least one property of a data type the module can handle.

Within that action or feedback there are dropdown selections for the `Control Object` and `Property`, actions also have a `Value` input option to set the selected property. Feedbacks have a `Use Property Sync` option which can force the module to use the `async` getter from the library when disabled - sometimes this returns different, more complex, data structures.

### Caveats:

Compatibility with custom control classes is untested.

Connection via UDP and WebSockets is untested.

Actions only support setting properties that accept simple data types `( string | number | boolean )`.

Enum properties are only handled numerically.
