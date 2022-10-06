/*

 * Copyright 2019-2020 Guardtime, Inc.

 *

 * Licensed under the Apache License, Version 2.0 (the "License").

 * You may not use this file except in compliance with the License.

 * You may obtain a copy of the License at

 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software

 * distributed under the License is distributed on an "AS IS" BASIS,

 * WITHOUT WARRANTIES, CONDITIONS, OR OTHER LICENSES OF ANY KIND, either

 * express or implied. See the License for the specific language governing

 * permissions and limitations under the License.

 * "Guardtime" and "KSI" are registered trademarks of

 * Guardtime, Inc., and no license to trademarks is granted; Guardtime

 * reserves and retains all trademark rights.

 */
import * as pako from 'pako';
import { DataHasher, HashAlgorithm, HexCoder, Utf8Converter } from '@guardtime/common';
import { PDFDocument } from 'pdfjs-dist/lib/core/document';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { XRefParseException } from 'pdfjs-dist/lib/core/core_utils';

export class KsiPdfSigner {
  constructor(ksiService, ksiErrorManager, ksiConfiguration) {
    this.ksiErrorManager = ksiErrorManager;
    this.ksiService = ksiService;
    this.ksiConfiguration = ksiConfiguration;
  }

  // Heavily modified https://github.com/Communication-Systems-Group/pdfsign.js
  calcFlow(i, last, xrefEntries) {
    if (last + 1 === i) {
      return '';
    }
    let count = 1;
    while (typeof xrefEntries[i + count] !== 'undefined' && typeof xrefEntries[i + count].offset !== 'undefined') {
      count++;
    }
    return i + ' ' + count + '\n';
  }

  createTrailer(trailer, startxref, sha256Hex, size, prev, stream) {
    let retVal = 'trailer <<\n';
    retVal += '  /Size ' + size + '\n';
    const refRoot = trailer.getRaw('Root');
    if (typeof refRoot !== 'undefined') {
      retVal += '  /Root ' + refRoot.num + ' ' + refRoot.gen + ' R\n';
    }
    const refInfo = trailer.getRaw('Info');
    if (typeof refInfo !== 'undefined') {
      retVal += '  /Info ' + refInfo.num + ' ' + refInfo.gen + ' R\n';
    }
    retVal += '  /ID [<' + sha256Hex.substring(0, 32) + '><' + sha256Hex.substring(32, 64) + '>]\n';
    if (typeof prev !== 'undefined') {
      retVal += '  /Prev ' + prev + '\n';
    }

    if (typeof stream !== 'undefined') {
      retVal += '  /XRefStm ' + stream + '\n';
    }
    retVal += '>>\n';
    retVal += 'startxref\n';
    retVal += startxref + '\n';
    retVal += '%%EOF\n';
    return retVal;
  }

  createXrefTableAppend(xrefEntries) {
    xrefEntries = this.sortOnKeys(xrefEntries);

    let retVal = 'xref\n';
    let last = -2;
    for (let i in xrefEntries) {
      i = parseInt(i);
      if (typeof xrefEntries[i].offset === 'undefined') {
        continue;
      }
      retVal += this.calcFlow(i, last, xrefEntries);
      const offset = xrefEntries[i].offset;
      retVal +=
        this.pad10(offset) + ' ' + this.pad5(xrefEntries[i].gen) + ' ' + (xrefEntries[i].free ? 'f' : 'n') + ' \n';
      last = i;
    }
    return retVal;
  }

  // http://stackoverflow.com/questions/10946880/sort-a-dictionary-or-whatever-key-value-data-structure-in-js-on-word-number-ke
  sortOnKeys(dict) {
    const sorted = [];
    for (const key in dict) {
      sorted[sorted.length] = key;
    }
    sorted.sort();

    const tempDict = {};
    for (let i = 0; i < sorted.length; i++) {
      tempDict[sorted[i]] = dict[sorted[i]];
    }

    return tempDict;
  }

  pad10(num) {
    const s = '000000000' + num;
    return s.substr(s.length - 10);
  }

  pad5(num) {
    const s = '0000' + num;
    return s.substr(s.length - 5);
  }

  updateArray(array, pos, str) {
    const upd = KsiPdfSigner.stringToUint8Array(str);
    for (let i = 0, len = upd.length; i < len; i++) {
      array[i + pos] = upd[i];
    }
    return array;
  }

  insertIntoArray(array, pos, str) {
    const ins = KsiPdfSigner.stringToUint8Array(str);
    return this.insertBytesIntoArray(array, pos, ins);
  }

  insertBytesIntoArray(array, pos, ins) {
    const buf = new Uint8Array(array.length + ins.length);
    for (let i = 0; i < pos; i++) {
      buf[i] = array[i];
    }
    for (let i = 0; i < ins.length; i++) {
      buf[pos + i] = ins[i];
    }
    for (let i = pos; i < array.length; i++) {
      buf[ins.length + i] = array[i];
    }
    return buf;
  }

  static stringToUint8Array(str) {
    const buf = new Uint8Array(str.length);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      buf[i] = str.charCodeAt(i);
    }
    return buf;
  }

  static find(uint8, needle, start, limit) {
    start = typeof start !== 'undefined' ? start : 0;
    limit = typeof limit !== 'undefined' ? limit : Number.MAX_SAFE_INTEGER;

    const search = KsiPdfSigner.stringToUint8Array(needle);
    let match = 0;

    for (let i = start; i < uint8.length && i < limit; i++) {
      if (uint8[i] === search[match]) {
        match++;
      } else {
        match = 0;
        if (uint8[i] === search[match]) {
          match++;
        }
      }

      if (match === search.length) {
        return i + 1 - match;
      }
    }
    return -1;
  }

  isString(value) {
    return typeof value === 'string' || value instanceof String;
  }

  isNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  isArray(value) {
    return value && typeof value === 'object' && value.constructor === Array;
  }

  isObject(value) {
    return value && typeof value === 'object' && value.constructor === Object;
  }

  isUndefined(value) {
    return typeof value === 'undefined';
  }

  isNull(value) {
    return value === null;
  }

  isHex(h) {
    return h.substring(0, 2) === '0x';
  }

  pdfObjToString(object) {
    let result = '';

    if (!this.isUndefined(object.name)) {
      result = '/' + object.name;
    } else if (!this.isUndefined(object.num)) {
      result = result + `${object.num} ${object.gen} R`;
    } else {
      if (!this.isUndefined(object.objId) && !this.isNull(object.objId)) {
        result = object.objId.substring(0, object.objId.length - 1) + ' 0 obj\n<<';
      } else {
        result = result + '<<';
      }

      Object.keys(object._map).forEach(key => {
        const elem = object._map[key];
        if (this.isString(elem)) {
          if (this.isHex(elem)) {
            result = result + '/' + key + '<' + elem.substring(2, elem.length) + '>';
          } else {
            result = result + `/${key}(${elem})`;
          }
        } else if (this.isNumber(elem)) {
          result = result + `/${key} ${elem}`;
        } else if (this.isArray(elem)) {
          result = result + `/${key}${this.pdfArrayToString(elem)}`;
        } else if (this.isObject(elem)) {
          result = result + `/${key} ${this.pdfObjToString(elem)}`;
        }
      });

      if (!this.isUndefined(object.objId) && !this.isNull(object.objId)) {
        if (object._map['stream']) {
          result = result + '>>stream\n' + this.bin2string(object._map['stream']) + '\nendstream\nendobj';
        } else {
          result = result + '>>\nendobj\n';
        }
      } else {
        result = result + '>>';
      }
    }
    return result;
  }

  bin2string(array) {
    let result = '';
    for (let i = 0; i < array.length; ++i) {
      result += String.fromCharCode(array[i]);
    }
    return result;
  }

  pdfArrayToString(array) {
    let result = '[';

    array.forEach(elem => {
      if (this.isString(elem)) {
        if (this.isHex(elem)) {
          result = result + '<' + elem.substring(2, elem.length) + '> ';
        } else {
          result = result + `/(${elem}) `;
        }
      } else if (this.isNumber(elem)) {
        result = result + `${elem} `;
      } else if (this.isObject(elem)) {
        result = result + `${this.pdfObjToString(elem)} `;
      }
    });

    if (result.length === 1) {
      return result + ']';
    }
    return result.substr(0, result.length - 1) + ']';
  }

  pdfArrayObjToString(array, ref) {
    let result = '' + ref.num + ' ' + ref.gen + ' obj\n';
    result = result + this.pdfArrayToString(array);
    return result + '\nendobj\n';
  }

  createAcroFormObj() {
    const acroform = {};
    acroform._map = {
      DA: '/Helv 0 Tf 0 g ',
      DR: {
        _map: {
          Helv: {
            num: 114,
            gen: 0
          },
          ZaDb: {
            num: 115,
            gen: 0
          }
        },
        objId: null
      },
      SigFlags: 3,
      Fields: []
    };

    acroform.objId = null;

    return acroform;
  }

  processAcroform(pdf, annot2Entry) {
    const rootObj = pdf.xref.fetch(pdf.xref.trailer.getRaw('Root'));
    let acroform = rootObj._map.AcroForm;
    let acroFormInRoot = false;
    let acroformId;
    if (acroform) {
      if (acroform.num) {
        acroformId = acroform.num;
        acroform = pdf.xref.fetch(acroform);
      } else {
        acroFormInRoot = true;
      }
      if (!acroform._map.Fields) {
        acroform._map.Fields = [];
      }
      if (acroFormInRoot) {
        rootObj._map.AcroForm = acroform;
      }
    } else {
      acroform = this.createAcroFormObj();
      acroformId = annot2Entry + 1;
      acroform.objId = acroformId + 'R';
      rootObj._map.AcroForm = { num: acroformId, gen: 0 };
    }
    acroform._map.Fields.push({ num: annot2Entry, gen: 0 });
    return { acroform, root: rootObj, inRoot: acroFormInRoot, acroformId };
  }

  processFirstPage(pdf, annot2Entry) {
    const pagesObj = pdf.catalog.catDict.get('Pages');
    let firstPageObj = pdf.xref.fetch(pagesObj.get('Kids')[0]);
    while (firstPageObj._map.Kids) {
      firstPageObj = pdf.xref.fetch(firstPageObj.get('Kids')[0]);
    }

    let annotsIndirect = false;
    let annotsObj;
    if (!firstPageObj._map.Annots) {
      firstPageObj._map.Annots = [];
      firstPageObj._map.Annots.push({ num: annot2Entry, gen: 0 });
    } else if (firstPageObj._map.Annots.num) {
      annotsIndirect = true;
      annotsObj = pdf.xref.fetch(firstPageObj._map.Annots);
      annotsObj.push({ num: annot2Entry, gen: 0 });
    } else {
      firstPageObj._map.Annots.push({ num: annot2Entry, gen: 0 });
    }

    return {
      firstPage: firstPageObj,
      annots: annotsObj,
      annotsIndirect,
      annotsId: firstPageObj._map.Annots.num,
      firstPageId: firstPageObj.objId.substring(0, firstPageObj.objId.length - 1)
    };
  }

  sigantureAppearenceObj(annot1Entry) {
    return (
      annot1Entry +
      ' 0 obj\n' +
      '<</Subtype/Form/Filter/FlateDecode/Type/XObject/Matrix' +
      ' [1 0 0 1 0 0]/FormType 1/Resources<</ProcSet [/PDF /Text /ImageB /ImageC /ImageI]' +
      '>>/BBox[0 0 0 0]/Length 8>>stream\nxœ' +
      String.fromCharCode(3) +
      String.fromCharCode(0) +
      String.fromCharCode(0) +
      String.fromCharCode(0) +
      String.fromCharCode(0) +
      String.fromCharCode(1) +
      '\nendstream\nendobj\n'
    );
  }

  signatureMainObj(annot2Entry, annot1Entry, sigEntry, firstPageId) {
    return (
      `${annot2Entry} 0 obj\n<</P ${firstPageId} 0 R/Subtype/Widget/T(Signature` +
      `  ${Date.now() * 10 + 1})/V ${sigEntry}` +
      ` 0 R/F 132/Type/Annot/FT/KSI/DR<<>>/Rect[0 0 0 0]/AP<</N ${annot1Entry} 0 R>>>>\nendobj\n`
    );
  }

  getSignatureStart(sigEntry) {
    return sigEntry + ' 0 obj\n<</Name([Get the verification tools from http://download.guardtime.com/])/Contents ';
  }

  getSignatureEnd(sigStart, sigEnd) {
    return (
      '/Filter/GT.KSI/ByteRange [0 ' +
      sigStart +
      ' ' +
      sigEnd +
      ' ##########]' +
      '                                                         /FT/DocTimeStamp>>\nendobj\n'
    );
  }

  async createAndAppendXref(xrefEntries, pdf, array) {
    const hasher = new DataHasher(HashAlgorithm.SHA2_256);
    hasher.update(array);
    const hash = await hasher.digest();
    const sha256Hex = HexCoder.encode(hash.value);
    const xrefStart = array.length;
    let xrefTable = '';
    if (pdf.xref.trailer && pdf.xref.trailer._map.Filter) {
      const XRefObj = this.createXrefObj(xrefStart, xrefEntries, pdf, sha256Hex);
      xrefTable = this.pdfObjToString(XRefObj) + '\nstartxref\n' + xrefStart + '\n%%EOF\n';
    } else {
      xrefTable = this.createXrefTableAppend(xrefEntries);
      xrefTable += this.createTrailer(pdf.xref.trailer, xrefStart, sha256Hex, xrefEntries.length, pdf.startXRef);
    }
    return this.insertIntoArray(array, array.length, xrefTable);
  }

  createXrefObj(xrefStart, xrefEntries, pdf, sha256Hex) {
    xrefEntries[xrefEntries.length] = { offset: xrefStart, gen: 0, free: false };
    const xrefStream = this.createXrefStream(xrefEntries, pdf.xref.trailer._map.W);
    const dataStream = pako.deflate(this.applyPredictor12(xrefStream.columns, xrefStream.stream));
    const obj = {
      _map: {
        DecodeParms: {
          _map: {
            Columns: xrefStream.columns,
            Predictor: 12
          }
        },
        Filter: { name: 'FlateDecode' },
        ID: ['0x' + sha256Hex.substring(0, 32), '0x' + sha256Hex.substring(32, 64)],
        Index: xrefStream.indices,
        Length: dataStream.length,
        Prev: pdf.startXRef,
        Size: xrefEntries.length - 1,
        Type: { name: 'XRef' },
        W: xrefStream.W,
        stream: dataStream
      },
      objId: xrefEntries.length - 1 + 'R'
    };

    const refRoot = pdf.xref.trailer.getRaw('Root');
    if (typeof refRoot !== 'undefined') {
      obj._map.Root = { num: refRoot.num, gen: refRoot.gen };
    }
    const refInfo = pdf.xref.trailer.getRaw('Info');
    if (typeof refInfo !== 'undefined') {
      obj._map.Info = { num: refInfo.num, gen: refInfo.gen };
    }
    return obj;
  }

  createXrefStream(xrefEntries, W) {
    xrefEntries = this.sortOnKeys(xrefEntries);
    let last = -2;
    let index = [];
    const xRefStream = [];
    let maxColumnWidth = 0;
    for (let i in xrefEntries) {
      i = parseInt(i);
      if (i === 0 || typeof xrefEntries[i].offset === 'undefined') {
        continue;
      }
      const flow = this.calcFlow(i, last, xrefEntries);
      if (flow !== '') {
        index = index.concat(
          flow
            .trim()
            .split(' ')
            .map(elem => {
              return parseInt(elem);
            })
        );
      }

      xRefStream.push(this.hexToBytes('01'));
      const valueBytes = this.hexToBytes(xrefEntries[i].offset.toString(16));
      if (valueBytes.length > maxColumnWidth) {
        maxColumnWidth = valueBytes.length;
      }
      xRefStream.push(valueBytes);
      if (W[2] > 0) {
        let W2 = [];
        for (let j = 0; j < W[2]; j++) {
          W2 = W2.concat(this.hexToBytes('00'));
        }
        xRefStream.push(W2);
      }
      last = i;
    }
    W[1] = maxColumnWidth;
    if (W[2] > 0) {
      for (let i = 1; i < xRefStream.length; i += 3) {
        let subArray = xRefStream[i];
        const diff = maxColumnWidth - subArray.length;
        if (diff) {
          for (let j = 0; j < diff; j++) {
            subArray = this.hexToBytes('00').concat(subArray);
          }
        }
        xRefStream[i] = subArray;
      }
    } else {
      for (let i = 1; i < xRefStream.length; i += 2) {
        let subArray = xRefStream[i];
        const diff = maxColumnWidth - subArray.length;
        if (diff) {
          for (let j = 0; j < diff; j++) {
            subArray = this.hexToBytes('00').concat(subArray);
          }
        }
        xRefStream[i] = subArray;
      }
    }
    return {
      stream: xRefStream.reduce((acc, val) => {
        return acc.concat(val);
      }, []),
      indices: index,
      W,
      columns: W.reduce((a, b) => a + b, 0)
    };
  }

  hexToBytes(value) {
    if (value.length % 2 === 1) {
      value = '0' + value;
    }
    const res = [];
    while (value.length >= 2) {
      res.push(parseInt(value.substring(0, 2), 16));
      value = value.substring(2, value.length);
    }
    return res;
  }

  insertElementsIntoArray(array, firstPage, acroform, annot1, annot2, signatureStart) {
    const acroformOffset = array.length;
    if (!acroform.inRoot) {
      array = this.insertIntoArray(array, acroformOffset, this.pdfObjToString(acroform.acroform));
    }
    const rootOffset = array.length;
    array = this.insertIntoArray(array, rootOffset, this.pdfObjToString(acroform.root));
    const firstPageOffset = array.length;
    array = this.insertIntoArray(array, firstPageOffset, this.pdfObjToString(firstPage.firstPage));
    const annotsOffset = array.length;
    if (firstPage.annotsIndirect) {
      array = this.insertIntoArray(
        array,
        annotsOffset,
        this.pdfArrayObjToString(firstPage.annots, firstPage.firstPage._map.Annots)
      );
    }
    const annot2Offset = array.length;
    array = this.insertIntoArray(array, annot2Offset, annot2);
    const sigOffset = array.length;
    array = this.insertIntoArray(array, sigOffset, signatureStart);
    const sigStart = array.length;
    array = this.insertBytesIntoArray(array, sigStart, new Uint8Array(2 * 8192 + 2));
    const sigEnd = array.length;
    array = this.insertIntoArray(array, sigEnd, this.getSignatureEnd(sigStart, sigEnd));
    const annot1Offset = array.length;
    array = this.insertIntoArray(array, annot1Offset, annot1);

    return {
      annot1Offset,
      annot2Offset,
      sigOffset,
      sigStart,
      sigEnd,
      acroformOffset,
      rootOffset,
      firstPageOffset,
      annotsOffset,
      array
    };
  }

  createXrefEntries(pdf, sigEntry, annot1Entry, annot2Entry, firstPage, acroform, data) {
    const xrefEntries = [];
    xrefEntries[0] = { offset: 0, gen: 65535, free: true };
    xrefEntries[pdf.xref.trailer.getRaw('Root').num] = { offset: data.rootOffset, gen: 0, free: false };
    xrefEntries[sigEntry] = { offset: data.sigOffset, gen: 0, free: false };
    xrefEntries[annot1Entry] = { offset: data.annot1Offset, gen: 0, free: false };
    xrefEntries[annot2Entry] = { offset: data.annot2Offset, gen: 0, free: false };
    xrefEntries[firstPage.firstPageId] = { offset: data.firstPageOffset, gen: 0, free: false };
    if (firstPage.annotsIndirect) {
      xrefEntries[firstPage.annotsId] = { offset: data.annotsOffset, gen: 0, free: false };
    }
    if (!acroform.inRoot) {
      xrefEntries[acroform.acroformId] = { offset: data.acroformOffset, gen: 0, free: false };
    }
    return xrefEntries;
  }

  // https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf 7.3
  /*
      According to the given specification:
      1) In TRAILER, ROOT is always indirect refrences
      2) In ROOT, ACROFORM is optional and can be indirect refrence or inlined
      3) In ROOT, PAGES is always indirect refrence
      4) In PAGE, ANNOTS is optional and can be indirect refrence or inlined
   */
  async appendSig(pdf) {
    let array = pdf.stream.bytes;
    let currentNextXref = pdf.xref.entries.length;
    const sigEntry = currentNextXref++;
    const annot1Entry = currentNextXref++;
    const annot2Entry = currentNextXref;
    const acroform = this.processAcroform(pdf, annot2Entry);
    const firstPage = this.processFirstPage(pdf, annot2Entry);
    const data = this.insertElementsIntoArray(
      array,
      firstPage,
      acroform,
      this.sigantureAppearenceObj(annot1Entry),
      this.signatureMainObj(annot2Entry, annot1Entry, sigEntry, firstPage.firstPageId),
      this.getSignatureStart(sigEntry)
    );
    const xrefEntries = this.createXrefEntries(pdf, sigEntry, annot1Entry, annot2Entry, firstPage, acroform, data);
    array = await this.createAndAppendXref(xrefEntries, pdf, data.array);

    const sizeAfterSigStart = KsiPdfSigner.find(array, '##########', data.sigEnd);
    this.updateArray(array, sizeAfterSigStart, this.pad10(array.length - data.sigEnd) + ']');

    return await this.signFile(array, data.sigStart, data.sigEnd);
  }

  async signFile(array, contentEnd, signatureEnd) {
    const hasher = new DataHasher(HashAlgorithm.getByName(this.ksiConfiguration.configuration.ksiHashAlgorithm));
    hasher.update(array.slice(0, contentEnd));
    hasher.update(array.slice(signatureEnd, array.length));

    const hash = await hasher.digest();
    const signature = await this.ksiService.sign(hash);
    const sigBytes = Utf8Converter.ToBytes('<' + HexCoder.encode(signature.encode()) + '>');

    array.set(sigBytes, contentEnd);
    array.fill(32, contentEnd + sigBytes.length, signatureEnd);

    return array;
  }

  toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    });
  }

  applyPredictor12(columns, bytes) {
    const rows = bytes.length / columns;

    const res = [];
    for (let i = 0; i < rows; i++) {
      res.push(2);
      for (let j = 0; j < columns; j++) {
        if (i === 0) {
          res.push(bytes[j + i * columns]);
        } else {
          res.push((bytes[j + i * columns] - bytes[j + (i - 1) * columns]) % 256);
        }
      }
    }
    return res;
  }

  revertPredictor12(columns, bytes) {
    columns = columns + 1;
    const rows = bytes.length / columns;

    const res = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        if (j === 0) {
          continue;
        }
        if (i === 0) {
          res.push(bytes[j + i * columns]);
        } else {
          res.push((bytes[j + i * columns] + res[j - 1 + (i - 1) * (columns - 1)]) % 256);
        }
      }
    }
    return res;
  }

  static isEncrypted(pdfArray) {
    const index = KsiPdfSigner.find(pdfArray, 'Encrypt');
    return index !== -1;
  }

  static isCorrupted(pdfArray) {
    let pdf;
    try {
      pdf = new PDFDocument({ evaluatorOptions: { isEvalSupported: false } }, pdfArray);
      pdf.parseStartXRef();
      pdf.parse();
      return false;
    } catch (e) {
      if (!(e instanceof XRefParseException)) {
        return true;
      }
    }

    try {
      pdf.parse(true);
      if (pdf.xref.trailer._map.Size === pdf.xref.entries.length) {
        return false;
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  async loadPdf(pdfArray) {
    let pdf;
    try {
      pdf = new PDFDocument({ evaluatorOptions: { isEvalSupported: false } }, pdfArray);
      pdf.parseStartXRef();
      pdf.parse();
      return pdf;
    } catch (e) {
      if (!(e instanceof XRefParseException)) {
        const message = await PDFViewerApplication.l10n.get(
          'ksi_error_parsing',
          null,
          'Error occurred while parsing the PDF.'
        );
        this.ksiErrorManager.addError({ message, type: 'ERROR', operation: 'SIGNING' });
        return;
      }
    }

    try {
      pdf.parse(true);
      return pdf;
    } catch (e) {
      const message = await PDFViewerApplication.l10n.get(
        'ksi_error_parsing',
        null,
        'Error occurred while parsing the PDF.'
      );
      this.ksiErrorManager.addError({ message, type: 'ERROR', operation: 'SIGNING' });
    }
  }

  async sign(pdfBytes) {
    const pdf = await this.loadPdf(pdfBytes);
    if (pdf) {
      try {
        return await this.appendSig(pdf);
      } catch (e) {
        const message = await PDFViewerApplication.l10n.get(
          'ksi_error_signing',
          null,
          'Error occurred while signing the PDF. '
        );
        this.ksiErrorManager.addError({ message: message + e, type: 'ERROR', operation: 'SIGNING' });
      }
    }
  }

  // Debug functions, should be ignored by test coverage
  /* istanbul ignore next */
  printBytesInHexChunks(bytes, chunk) {
    const hexString = this.toHexString(bytes);
    let i, j, temparray;
    for (i = 0, j = hexString.length; i < j; i += chunk) {
      temparray = hexString.slice(i, i + chunk);
      // eslint-disable-next-line no-console
      console.log(temparray);
    }
  }

  /* istanbul ignore next */
  printXrefStream(pdf) {
    const array = pdf.stream.bytes;
    const xrefStreamStart = KsiPdfSigner.find(array, 'stream', pdf.startXRef) + 7;
    const xrefStreamEnd = KsiPdfSigner.find(array, 'endstream', xrefStreamStart);
    const stream = array.slice(xrefStreamStart, xrefStreamEnd);
    // eslint-disable-next-line no-console
    console.log(new TextDecoder('utf-8').decode(stream));
    const decompressed = pako.inflate(stream);
    if (pdf.xref.trailer._map.DecodeParms) {
      const data = this.revertPredictor12(pdf.xref.trailer._map.DecodeParms._map.Columns, decompressed);
      this.printBytesInHexChunks(data, pdf.xref.trailer._map.DecodeParms._map.Columns);
    } else {
      const columns = pdf.xref.trailer._map.W.reduce((a, b) => a + b, 0);
      this.printBytesInHexChunks(decompressed, columns);
    }
  }

  /* istanbul ignore next */
  printObjectStream(objId, pdf) {
    const array = pdf.stream.bytes;
    const offsetStart = pdf.xref.entries[objId].offset;
    const objStreamStart = KsiPdfSigner.find(array, 'stream', offsetStart) + 7;
    const objStreamEnd = KsiPdfSigner.find(array, 'endstream', objStreamStart);
    const stream = array.slice(objStreamStart, objStreamEnd);
    const decompressed = pako.inflate(stream);
    // eslint-disable-next-line no-console
    console.log(new TextDecoder('utf-8').decode(decompressed));
  }

  /* istanbul ignore next */
  printObject(objId, pdf) {
    const array = pdf.stream.bytes;
    const offsetStart = pdf.xref.entries[objId].offset;
    // eslint-disable-next-line no-console
    console.log(offsetStart);
    const objStreamEnd = KsiPdfSigner.find(array, 'endobj', offsetStart);
    const stream = array.slice(offsetStart, objStreamEnd);
    // eslint-disable-next-line no-console
    console.log(new TextDecoder('utf-8').decode(stream));
  }
}
