## Open Control Architecture: AES-70

Connect via TCP, UDP or WebSockets

Set or get properties of control objects.

Each control class the device exposes will result in one action and one value feedback, so long as the class has at least one property of a data type the module can handle.

Within that action or feedback there are dropdown selections for the control object and property, actions also have a value input to set the selected property.

### Caveats:

Compatibility with custom control classes is untested.

Connection via UDP and WebSockets is untested.

Actions only support setting properties that accept simple data types ( string | number | boolean ).
