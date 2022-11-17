# KSI PDF Verifier
Guardtime's KSI Blockchain is an industrial scale blockchain platform that cryptographically ensures data integrity and proves time of existence. The KSI signatures, based on hash chains, link data to this global calendar blockchain. The checkpoints of the blockchain, published in newspapers and electronic media, enable long term integrity of any digital asset without the need to trust any system. There are many applications for KSI, a classical example is signing of any type of logs - system logs, financial transactions, call records, etc. For more, see https://guardtime.com

The KSI PDF Verifier is a component that provides verification for KSI signatures in PDF documents. It comes with its own UI elements to display the verification data in a user-friendly way.

# Install dependencies
Install using the [npm](http://npmjs.org) package manager:

```npm install```

## Usage

In Node.js:

```js
import { webViewerLoad } from "ksi-pdf-verifier/src/web_viewer_load";

webViewerLoad();

const file = getPDFAsByteArray();

await window.PDFViewerApplication.open(file);
const page = await window.PDFViewerApplication.pdfViewer.pdfDocument.getPage(1);
const annotations = await page.getAnnotations();

const isKsiSigned = annotations.filter(annotation => {
            return annotation.fieldType === "KSI";
          }).length !== 0;
```

# Test
To run the unit tests in node:

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


## Dependencies

See [package.json](package.json) file.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) file.

## License

See [LICENSE](LICENSE) file.