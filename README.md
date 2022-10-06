# Install dependencies

```npm install```

# Local start

```npm run start``` and go to http://localhost:8080 in your browser.

# Build

```npm run build```

# Test

```npm run test```

# Configuration
Use custom configuration from console: 
```sh
PDF_CONFIG="static/readonly_configuration.json" npm run start
```

## IntelliJ configuration
* This enables ES6 support: 
  * In IntelliJ Preferences | Languages & Frameworks | JavaScript, choose "ECMAScript 6" as Javascript Language version
* This enables code completion support for Jest-specific functionality in test files (*.spec.j.s):
  * In IntelliJ Preferences | Languages & Frameworks | JavaScript | Libraries, press Download..., select 'jest' from the list of available stubs, press Download and Install
