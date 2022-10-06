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
import {
  ARRAY_INSERT_RESULT,
  ARRAY_INSERT_RESULT_2,
  PDF_DIRECT,
  PDF_INDIRECT,
  PDF_INDIRECT_LAYERED,
  PDF_NO,
  PDF_NOROOT_NOINFO,
  PDF_XREF_STREAM
} from './test-util/array_insert_data';
import { DataHasher } from '@guardtime/common';
import { KsiPdfSigner } from '../ksipdftool/ksi_pdf_signer';
import { PDFDocument } from 'pdfjs-dist/lib/core/document';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';
import { XRefParseException } from 'pdfjs-dist/lib/core/core_utils';

const SIG_ENTRY = 100;
const ANNOT1_ENTRY = 101;
const ANNOT2_ENTRY = 102;
const FIRST_PAGE_OBJ = {
  firstPageId: 30,
  annotsIndirect: false,
  firstPage: {
    objId: '9R',
    _map: {}
  }
};

const FIRST_PAGE_SEPARATE_OBJ = {
  firstPageId: 30,
  annotsIndirect: true,
  annotsId: 40,
  firstPage: {
    objId: '9R',
    _map: {
      Annots: { num: 100, gen: 0 }
    }
  },
  annots: [
    { num: 1, gen: 0 },
    { num: 2, gen: 0 }
  ]
};

const ACROFORM_SEPARATE_OBJ = {
  acroformId: 50,
  inRoot: false,
  acroform: {
    objId: '10R',
    _map: {}
  },
  root: {
    objId: '11R',
    _map: {}
  }
};

const ACROFORM_INROOT_OBJ = {
  inRoot: true
};

const DATA = {
  rootOffset: 400,
  sigOffset: 500,
  annot1Offset: 600,
  annot2Offset: 450,
  firstPageOffset: 200,
  annotsOffset: 210,
  acroformOffset: 410
};

describe('KSI PDF SIGNER', () => {
  let pdfSigner;

  beforeEach(() => {
    pdfSigner = new KsiPdfSigner();
  });

  describe('create and append xref and trailer', () => {
    test('SortOnKeys', () => {
      const dict = {
        3: {},
        10: {},
        1: {}
      };

      const res = {
        1: {},
        3: {},
        10: {}
      };

      expect(pdfSigner.sortOnKeys(dict)).toEqual(res);
    });

    test('createXrefEntries', () => {
      const generatedXREF = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_SEPARATE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );
      const generatedXREF2 = pdfSigner.createXrefEntries(
        PDF_DIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_OBJ,
        ACROFORM_INROOT_OBJ,
        DATA
      );

      const res1 = [];
      res1[0] = { offset: 0, gen: 65535, free: true };
      res1[PDF_INDIRECT.xref.trailer.getRaw('Root').num] = { offset: DATA.rootOffset, gen: 0, free: false };
      res1[SIG_ENTRY] = { offset: DATA.sigOffset, gen: 0, free: false };
      res1[ANNOT1_ENTRY] = { offset: DATA.annot1Offset, gen: 0, free: false };
      res1[ANNOT2_ENTRY] = { offset: DATA.annot2Offset, gen: 0, free: false };
      res1[FIRST_PAGE_OBJ.firstPageId] = { offset: DATA.firstPageOffset, gen: 0, free: false };
      res1[FIRST_PAGE_OBJ.annotsId] = { offset: DATA.annotsOffset, gen: 0, free: false };
      res1[ACROFORM_SEPARATE_OBJ.acroformId] = { offset: DATA.acroformOffset, gen: 0, free: false };

      const res2 = [];
      res2[0] = { offset: 0, gen: 65535, free: true };
      res2[PDF_DIRECT.xref.trailer.getRaw('Root').num] = { offset: DATA.rootOffset, gen: 0, free: false };
      res2[SIG_ENTRY] = { offset: DATA.sigOffset, gen: 0, free: false };
      res2[ANNOT1_ENTRY] = { offset: DATA.annot1Offset, gen: 0, free: false };
      res2[ANNOT2_ENTRY] = { offset: DATA.annot2Offset, gen: 0, free: false };
      res2[FIRST_PAGE_OBJ.firstPageId] = { offset: DATA.firstPageOffset, gen: 0, free: false };

      expect(generatedXREF).toEqual(expect.arrayContaining(res1));
      expect(generatedXREF2).toEqual(expect.arrayContaining(res2));
    });

    test('CreateTrailer', () => {
      expect(pdfSigner.createTrailer(PDF_INDIRECT.xref.trailer, 0, 'sffsa23f23f2f2ff22d2', 19)).toEqual(
        'trailer <<\n' +
          '  /Size 19\n' +
          '  /Root 1 0 R\n' +
          '  /Info 2 0 R\n' +
          '  /ID [<sffsa23f23f2f2ff22d2><>]\n' +
          '>>\n' +
          'startxref\n' +
          '0\n' +
          '%%EOF\n'
      );

      expect(pdfSigner.createTrailer(PDF_INDIRECT.xref.trailer, 0, 'sffsa23f23f2f2ff22d2', 19, 120314)).toEqual(
        'trailer <<\n' +
          '  /Size 19\n' +
          '  /Root 1 0 R\n' +
          '  /Info 2 0 R\n' +
          '  /ID [<sffsa23f23f2f2ff22d2><>]\n' +
          '  /Prev 120314\n' +
          '>>\n' +
          'startxref\n' +
          '0\n' +
          '%%EOF\n'
      );

      expect(pdfSigner.createTrailer(PDF_NOROOT_NOINFO.xref.trailer, 0, 'sffsa23f23f2f2ff22d2', 19, 120314)).toEqual(
        'trailer <<\n' +
          '  /Size 19\n' +
          '  /ID [<sffsa23f23f2f2ff22d2><>]\n' +
          '  /Prev 120314\n' +
          '>>\n' +
          'startxref\n' +
          '0\n' +
          '%%EOF\n'
      );
    });

    test('calcFlow', () => {
      const xref = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );

      expect(pdfSigner.calcFlow(100, 102, xref)).toEqual('100 3\n');

      expect(pdfSigner.calcFlow(102, 101, xref)).toEqual('');
    });

    test('createXrefTableAppend', () => {
      const xref = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );

      expect(pdfSigner.createXrefTableAppend(xref)).toEqual(
        'xref\n' +
          '0 2\n' +
          '0000000000 65535 f \n' +
          '0000000400 00000 n \n' +
          '30 1\n' +
          '0000000200 00000 n \n' +
          '50 1\n' +
          '0000000410 00000 n \n' +
          '100 3\n' +
          '0000000500 00000 n \n' +
          '0000000600 00000 n \n' +
          '0000000450 00000 n \n'
      );
    });

    test('createAndAppendXref', async () => {
      const xref = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );

      const array = new Uint8Array([10, 10, 10, 10, 10]);

      expect(await pdfSigner.createAndAppendXref(xref, PDF_INDIRECT, array)).toEqual(
        new Uint8Array([
          10,
          10,
          10,
          10,
          10,
          120,
          114,
          101,
          102,
          10,
          48,
          32,
          50,
          10,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          32,
          54,
          53,
          53,
          51,
          53,
          32,
          102,
          32,
          10,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          52,
          48,
          48,
          32,
          48,
          48,
          48,
          48,
          48,
          32,
          110,
          32,
          10,
          51,
          48,
          32,
          49,
          10,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          50,
          48,
          48,
          32,
          48,
          48,
          48,
          48,
          48,
          32,
          110,
          32,
          10,
          53,
          48,
          32,
          49,
          10,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          52,
          49,
          48,
          32,
          48,
          48,
          48,
          48,
          48,
          32,
          110,
          32,
          10,
          49,
          48,
          48,
          32,
          51,
          10,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          53,
          48,
          48,
          32,
          48,
          48,
          48,
          48,
          48,
          32,
          110,
          32,
          10,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          54,
          48,
          48,
          32,
          48,
          48,
          48,
          48,
          48,
          32,
          110,
          32,
          10,
          48,
          48,
          48,
          48,
          48,
          48,
          48,
          52,
          53,
          48,
          32,
          48,
          48,
          48,
          48,
          48,
          32,
          110,
          32,
          10,
          116,
          114,
          97,
          105,
          108,
          101,
          114,
          32,
          60,
          60,
          10,
          32,
          32,
          47,
          83,
          105,
          122,
          101,
          32,
          49,
          48,
          51,
          10,
          32,
          32,
          47,
          82,
          111,
          111,
          116,
          32,
          49,
          32,
          48,
          32,
          82,
          10,
          32,
          32,
          47,
          73,
          110,
          102,
          111,
          32,
          50,
          32,
          48,
          32,
          82,
          10,
          32,
          32,
          47,
          73,
          68,
          32,
          91,
          60,
          55,
          67,
          51,
          55,
          48,
          68,
          57,
          53,
          51,
          54,
          68,
          55,
          68,
          48,
          68,
          54,
          65,
          48,
          70,
          55,
          67,
          68,
          55,
          70,
          57,
          56,
          50,
          54,
          54,
          57,
          50,
          65,
          62,
          60,
          67,
          68,
          57,
          51,
          69,
          52,
          70,
          66,
          48,
          53,
          66,
          65,
          52,
          54,
          70,
          55,
          66,
          54,
          51,
          48,
          66,
          56,
          55,
          57,
          55,
          52,
          48,
          51,
          52,
          51,
          68,
          51,
          62,
          93,
          10,
          62,
          62,
          10,
          115,
          116,
          97,
          114,
          116,
          120,
          114,
          101,
          102,
          10,
          53,
          10,
          37,
          37,
          69,
          79,
          70,
          10
        ])
      );
    });

    test('createXrefStream', () => {
      const generatedXREF = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_SEPARATE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );

      const result = pdfSigner.createXrefStream(generatedXREF, [1, 1, 0]);

      expect(result).toEqual({
        W: [1, 2, 0],
        columns: 3,
        indices: [1, 1, 30, 1, 40, 1, 50, 1, 100, 3],
        stream: [1, 1, 144, 1, 0, 200, 1, 0, 210, 1, 1, 154, 1, 1, 244, 1, 2, 88, 1, 1, 194]
      });
    });

    test('createXrefStream2', () => {
      const generatedXREF = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_SEPARATE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );

      const result = pdfSigner.createXrefStream(generatedXREF, [1, 1, 2]);

      expect(result).toEqual({
        W: [1, 2, 2],
        columns: 5,
        indices: [1, 1, 30, 1, 40, 1, 50, 1, 100, 3],
        stream: [
          1,
          1,
          144,
          0,
          0,
          1,
          0,
          200,
          0,
          0,
          1,
          0,
          210,
          0,
          0,
          1,
          1,
          154,
          0,
          0,
          1,
          1,
          244,
          0,
          0,
          1,
          2,
          88,
          0,
          0,
          1,
          1,
          194,
          0,
          0
        ]
      });
    });

    test('createXrefObj', () => {
      const generatedXREF = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_SEPARATE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );

      const result = pdfSigner.createXrefObj(100, generatedXREF, PDF_DIRECT, 'dsafsadfsfdsdfsadfsadfsdfsdafsadfwe2r');

      expect(result).toEqual({
        _map: {
          DecodeParms: {
            _map: {
              Columns: 3,
              Predictor: 12
            }
          },
          Filter: {
            name: 'FlateDecode'
          },
          ID: ['0xdsafsadfsfdsdfsadfsadfsdfsdafsad', '0xfwe2r'],
          Index: [1, 1, 30, 1, 40, 1, 50, 1, 100, 4],
          Info: {
            gen: 0,
            num: 2
          },
          Length: 35,
          Prev: undefined,
          Root: {
            gen: 0,
            num: 1
          },
          Size: 103,
          Type: {
            name: 'XRef'
          },
          W: [1, 2, 0],
          stream: new Uint8Array([
            120,
            156,
            99,
            98,
            100,
            156,
            192,
            196,
            240,
            223,
            130,
            137,
            129,
            129,
            139,
            137,
            129,
            241,
            4,
            144,
            142,
            2,
            210,
            41,
            64,
            177,
            44,
            32,
            94,
            4,
            0,
            82,
            35,
            6,
            118
          ])
        },
        objId: '103R'
      });
    });

    test('createAndAppendXrefStream', async () => {
      const xref = pdfSigner.createXrefEntries(
        PDF_INDIRECT,
        SIG_ENTRY,
        ANNOT1_ENTRY,
        ANNOT2_ENTRY,
        FIRST_PAGE_OBJ,
        ACROFORM_SEPARATE_OBJ,
        DATA
      );

      const array = new Uint8Array([10, 10, 10, 10, 10]);

      expect(await pdfSigner.createAndAppendXref(xref, PDF_XREF_STREAM, array)).toEqual(
        new Uint8Array([
          10,
          10,
          10,
          10,
          10,
          49,
          48,
          51,
          32,
          48,
          32,
          111,
          98,
          106,
          10,
          60,
          60,
          47,
          68,
          101,
          99,
          111,
          100,
          101,
          80,
          97,
          114,
          109,
          115,
          32,
          60,
          60,
          47,
          67,
          111,
          108,
          117,
          109,
          110,
          115,
          32,
          51,
          47,
          80,
          114,
          101,
          100,
          105,
          99,
          116,
          111,
          114,
          32,
          49,
          50,
          62,
          62,
          47,
          70,
          105,
          108,
          116,
          101,
          114,
          32,
          47,
          70,
          108,
          97,
          116,
          101,
          68,
          101,
          99,
          111,
          100,
          101,
          47,
          73,
          68,
          91,
          60,
          55,
          67,
          51,
          55,
          48,
          68,
          57,
          53,
          51,
          54,
          68,
          55,
          68,
          48,
          68,
          54,
          65,
          48,
          70,
          55,
          67,
          68,
          55,
          70,
          57,
          56,
          50,
          54,
          54,
          57,
          50,
          65,
          62,
          32,
          60,
          67,
          68,
          57,
          51,
          69,
          52,
          70,
          66,
          48,
          53,
          66,
          65,
          52,
          54,
          70,
          55,
          66,
          54,
          51,
          48,
          66,
          56,
          55,
          57,
          55,
          52,
          48,
          51,
          52,
          51,
          68,
          51,
          62,
          93,
          47,
          73,
          110,
          100,
          101,
          120,
          91,
          49,
          32,
          49,
          32,
          51,
          48,
          32,
          49,
          32,
          53,
          48,
          32,
          49,
          32,
          49,
          48,
          48,
          32,
          52,
          93,
          47,
          76,
          101,
          110,
          103,
          116,
          104,
          32,
          51,
          50,
          47,
          83,
          105,
          122,
          101,
          32,
          49,
          48,
          51,
          47,
          84,
          121,
          112,
          101,
          32,
          47,
          88,
          82,
          101,
          102,
          47,
          87,
          91,
          49,
          32,
          50,
          32,
          48,
          93,
          47,
          82,
          111,
          111,
          116,
          32,
          49,
          32,
          48,
          32,
          82,
          47,
          73,
          110,
          102,
          111,
          32,
          50,
          32,
          48,
          32,
          82,
          62,
          62,
          115,
          116,
          114,
          101,
          97,
          109,
          10,
          120,
          156,
          99,
          98,
          100,
          156,
          192,
          196,
          240,
          223,
          130,
          137,
          129,
          241,
          18,
          19,
          3,
          67,
          20,
          144,
          78,
          1,
          242,
          179,
          128,
          216,
          25,
          0,
          74,
          52,
          6,
          21,
          10,
          101,
          110,
          100,
          115,
          116,
          114,
          101,
          97,
          109,
          10,
          101,
          110,
          100,
          111,
          98,
          106,
          10,
          115,
          116,
          97,
          114,
          116,
          120,
          114,
          101,
          102,
          10,
          53,
          10,
          37,
          37,
          69,
          79,
          70,
          10
        ])
      );
    });
  });

  describe('helperFunctions', () => {
    test('isString', () => {
      expect(pdfSigner.isString('egwew')).toBe(true);
      expect(pdfSigner.isString(2)).toBe(false);
    });

    test('isNumber', () => {
      expect(pdfSigner.isNumber(5)).toBe(true);
      expect(pdfSigner.isNumber('sssfef')).toBe(false);
    });

    test('isArray', () => {
      expect(pdfSigner.isArray([])).toBe(true);
      expect(pdfSigner.isArray([1, 2, 3])).toBe(true);
      expect(pdfSigner.isArray('fefs')).toBe(false);
    });

    test('isObject', () => {
      expect(pdfSigner.isObject({})).toBe(true);
      expect(pdfSigner.isObject('fwawf')).toBe(false);
    });

    test('isUndefined', () => {
      expect(pdfSigner.isUndefined(undefined)).toBe(true);
      expect(pdfSigner.isUndefined('sfsdfs')).toBe(false);
      expect(pdfSigner.isUndefined('undefined')).toBe(false);
    });

    test('isNull', () => {
      expect(pdfSigner.isNull(null)).toBe(true);
      expect(pdfSigner.isNull([])).toBe(false);
    });

    test('Pad 10', () => {
      expect(pdfSigner.pad10(45)).toEqual('0000000045');
      expect(pdfSigner.pad10(5)).toEqual('0000000005');
    });

    test('Pad 5', () => {
      expect(pdfSigner.pad5(345)).toEqual('00345');
      expect(pdfSigner.pad5(34)).toEqual('00034');
    });

    test('stringToUint8Array', () => {
      expect(KsiPdfSigner.stringToUint8Array('aaa')).toEqual(new Uint8Array([97, 97, 97]));
    });

    test('find', () => {
      const array = KsiPdfSigner.stringToUint8Array('The quick brown fox jumps over the lazy dog');

      expect(KsiPdfSigner.find(array, 'fox', 0)).toEqual(16);
      expect(KsiPdfSigner.find(array, 'tree', 0)).toEqual(-1);
    });

    test('applyPredictor12', () => {
      const result = pdfSigner.applyPredictor12(4, [10, 10, 10, 10, 11, 11, 11, 11]);
      expect(result).toEqual([2, 10, 10, 10, 10, 2, 1, 1, 1, 1]);
    });

    test('revertPredictor12', () => {
      const result = pdfSigner.revertPredictor12(4, [2, 10, 10, 10, 10, 2, 1, 1, 1, 1]);
      expect(result).toEqual([10, 10, 10, 10, 11, 11, 11, 11]);
    });
  });

  describe('Signature creation functions', () => {
    test('Signature main object', () => {
      Date.now = jest.fn();
      Date.now.mockReturnValue(19231231412515);

      expect(pdfSigner.signatureMainObj(ANNOT2_ENTRY, ANNOT1_ENTRY, SIG_ENTRY, FIRST_PAGE_OBJ.firstPageId)).toEqual(
        `${ANNOT2_ENTRY} 0 obj\n<</P ${FIRST_PAGE_OBJ.firstPageId} 0 R/Subtype/Widget/T(Signature` +
          `  ${Date.now() * 10 + 1})/V ${SIG_ENTRY}` +
          ` 0 R/F 132/Type/Annot/FT/KSI/DR<<>>/Rect[0 0 0 0]/AP<</N ${ANNOT1_ENTRY} 0 R>>>>\nendobj\n`
      );
    });

    test('Signature appearence object', () => {
      expect(pdfSigner.sigantureAppearenceObj(ANNOT1_ENTRY)).toEqual(
        ANNOT1_ENTRY +
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
    });

    test('Signature start', () => {
      expect(pdfSigner.getSignatureStart(SIG_ENTRY)).toEqual(
        SIG_ENTRY + ' 0 obj\n<</Name([Get the verification tools from http://download.guardtime.com/])/Contents '
      );
    });

    test('Signatue end', () => {
      expect(pdfSigner.getSignatureEnd(100, 200)).toEqual(
        '/Filter/GT.KSI/ByteRange [0 100 200 ##########]' +
          '                                                         /FT/DocTimeStamp>>\nendobj\n'
      );
    });
  });

  describe('PDF obj toString', () => {
    test('pdfObjToString 1', () => {
      expect(
        pdfSigner.pdfObjToString({
          _map: {
            DA: '/Helv 0 Tf 0 g ',
            DR: {
              _map: {
                Helv: { gen: 0, num: 114 },
                ZaDb: { gen: 0, num: 115 }
              },
              objId: null
            },
            Fields: []
          },
          objId: null
        })
      ).toEqual('<</DA(/Helv 0 Tf 0 g )/DR <</Helv 114 0 R/ZaDb 115 0 R>>/Fields[]>>');
    });

    test('pdfObjToString 2', () => {
      expect(
        pdfSigner.pdfObjToString({
          _map: {
            DA: '/Helv 0 Tf 0 g ',
            DR: {
              _map: {
                Helv: { gen: 0, num: 114 },
                ZaDb: { gen: 0, num: 115 }
              },
              objId: null
            },
            Fields: []
          },
          objId: '9R'
        })
      ).toEqual('9 0 obj\n<</DA(/Helv 0 Tf 0 g )/DR <</Helv 114 0 R/ZaDb 115 0 R>>/Fields[]>>\nendobj\n');
    });

    test('pdfObjToString 3', () => {
      expect(
        pdfSigner.pdfObjToString({
          _map: {
            Value: '0x5678343'
          },
          objId: '9R'
        })
      ).toEqual('9 0 obj\n<</Value<5678343>>>\nendobj\n');
    });

    test('pdfObjToString 4', () => {
      expect(
        pdfSigner.pdfObjToString({
          _map: {
            Type: {
              name: 'Catalogue'
            }
          },
          objId: '9R'
        })
      ).toEqual('9 0 obj\n<</Type /Catalogue>>\nendobj\n');
    });

    test('pdfObjToString 5', () => {
      expect(
        pdfSigner.pdfObjToString({
          _map: {
            Type: {
              name: 'Catalogue'
            },
            stream: new Uint8Array([
              120,
              156,
              99,
              98,
              148,
              100,
              98,
              88,
              207,
              196,
              192,
              197,
              196,
              224,
              206,
              196,
              192,
              6,
              70,
              223,
              153,
              24,
              60,
              0,
              24,
              239,
              2,
              118
            ])
          },
          objId: '9R'
        })
      ).toEqual(
        '9 0 obj\n<</Type /Catalogue>>stream\n' +
          pdfSigner.bin2string([
            120,
            156,
            99,
            98,
            148,
            100,
            98,
            88,
            207,
            196,
            192,
            197,
            196,
            224,
            206,
            196,
            192,
            6,
            70,
            223,
            153,
            24,
            60,
            0,
            24,
            239,
            2,
            118
          ]) +
          '\nendstream\nendobj'
      );
    });

    test('pdfArrayObjToString', () => {
      expect(
        pdfSigner.pdfArrayObjToString(
          [
            { num: 5, gen: 0 },
            { num: 6, gen: 0 }
          ],
          { num: 10, gen: 0 }
        )
      ).toEqual('10 0 obj\n[5 0 R 6 0 R]\nendobj\n');
    });

    test('pdfArrayToString', () => {
      expect(
        pdfSigner.pdfArrayToString([
          'test',
          95,
          {
            num: 1,
            gen: 0
          },
          '0x567890'
        ])
      ).toEqual('[/(test) 95 1 0 R <567890>]');
    });
  });

  describe('Array modifiers', () => {
    test('updateArray', () => {
      expect(pdfSigner.updateArray(new Uint8Array([10, 10, 10, 10, 10, 10, 10]), 2, 'aaa')).toEqual(
        new Uint8Array([10, 10, 97, 97, 97, 10, 10])
      );
    });

    test('insertIntoArray', () => {
      expect(pdfSigner.insertIntoArray(new Uint8Array([10, 10, 10, 10, 10, 10, 10]), 7, 'aaa')).toEqual(
        new Uint8Array([10, 10, 10, 10, 10, 10, 10, 97, 97, 97])
      );
    });

    test('insertBytesIntoArray', () => {
      expect(
        pdfSigner.insertBytesIntoArray(new Uint8Array([10, 10, 10, 10, 10, 10, 10]), 7, new Uint8Array([97, 97, 97]))
      ).toEqual(new Uint8Array([10, 10, 10, 10, 10, 10, 10, 97, 97, 97]));
    });

    test('insertElementsIntoArray', () => {
      expect(
        pdfSigner.insertElementsIntoArray(
          new Uint8Array([10, 101, 0]),
          FIRST_PAGE_OBJ,
          ACROFORM_SEPARATE_OBJ,
          'aa',
          'aaa',
          'aaa'
        )
      ).toEqual({
        acroformOffset: 3,
        annot1Offset: 16588,
        annot2Offset: 65,
        annotsOffset: 65,
        array: ARRAY_INSERT_RESULT,
        firstPageOffset: 45,
        rootOffset: 24,
        sigEnd: 16457,
        sigOffset: 68,
        sigStart: 71
      });

      expect(
        pdfSigner.insertElementsIntoArray(
          new Uint8Array([10, 101, 0]),
          FIRST_PAGE_SEPARATE_OBJ,
          ACROFORM_SEPARATE_OBJ,
          'aa',
          'aaa',
          'aaa'
        )
      ).toEqual({
        acroformOffset: 3,
        annot1Offset: 16635,
        annot2Offset: 111,
        annotsOffset: 80,
        array: ARRAY_INSERT_RESULT_2,
        firstPageOffset: 45,
        rootOffset: 24,
        sigEnd: 16503,
        sigOffset: 114,
        sigStart: 117
      });
    });
  });

  describe('processAcroform', () => {
    test('Acroform directly in root', () => {
      expect(pdfSigner.processAcroform(PDF_DIRECT, ANNOT2_ENTRY)).toEqual({
        acroform: {
          _map: {
            Fields: [
              {
                gen: 0,
                num: 102
              }
            ]
          }
        },
        acroformId: undefined,
        inRoot: true,
        root: {
          _map: {
            AcroForm: {
              _map: {
                Fields: [
                  {
                    gen: 0,
                    num: 102
                  }
                ]
              }
            },
            Pages: { num: 3, gen: 0 },
            Type: {
              name: 'Catalog'
            }
          },
          get: expect.anything(),
          objId: '1R'
        }
      });
    });

    test('Acroform indirectly in root', () => {
      expect(pdfSigner.processAcroform(PDF_INDIRECT, ANNOT2_ENTRY)).toEqual({
        acroform: {
          _map: {
            Fields: [
              {
                gen: 0,
                num: 102
              },
              {
                gen: 0,
                num: 102
              }
            ]
          }
        },
        acroformId: 6,
        inRoot: false,
        root: {
          _map: {
            AcroForm: {
              gen: 0,
              num: 6
            },
            Pages: { num: 3, gen: 0 },
            Type: {
              name: 'Catalog'
            }
          },
          get: expect.anything(),
          objId: '1R'
        }
      });
    });

    test('No Acroform in PDF', () => {
      expect(pdfSigner.processAcroform(PDF_NO, ANNOT2_ENTRY)).toEqual({
        acroform: {
          _map: {
            DA: '/Helv 0 Tf 0 g ',
            DR: {
              _map: {
                Helv: {
                  gen: 0,
                  num: 114
                },
                ZaDb: {
                  gen: 0,
                  num: 115
                }
              },
              objId: null
            },
            SigFlags: 3,
            Fields: [{ gen: 0, num: 102 }]
          },
          objId: '103R'
        },
        acroformId: 103,
        inRoot: false,
        root: {
          _map: {
            AcroForm: {
              gen: 0,
              num: 103
            },
            Pages: { num: 3, gen: 0 },
            Type: {
              name: 'Catalog'
            }
          },
          get: expect.anything(),
          objId: '1R'
        }
      });
    });

    test('Create ACROFORM obj', () => {
      expect(pdfSigner.createAcroFormObj()).toEqual({
        _map: {
          DA: '/Helv 0 Tf 0 g ',
          DR: {
            _map: {
              Helv: { gen: 0, num: 114 },
              ZaDb: { gen: 0, num: 115 }
            },
            objId: null
          },
          SigFlags: 3,
          Fields: []
        },
        objId: null
      });
    });
  });

  describe('processFirstPage', () => {
    test('Annots directly in first page', () => {
      expect(pdfSigner.processFirstPage(PDF_DIRECT, ANNOT2_ENTRY)).toEqual({
        annotsIndirect: false,
        firstPage: {
          _map: {
            Annots: [
              {
                gen: 0,
                num: 102
              }
            ]
          },
          objId: '4R'
        },
        firstPageId: '4'
      });
    });

    test('Annots indirectly in first page', () => {
      expect(pdfSigner.processFirstPage(PDF_INDIRECT, ANNOT2_ENTRY)).toEqual({
        annots: [
          {
            gen: 0,
            num: 102
          },
          {
            gen: 0,
            num: 102
          }
        ],
        annotsId: 5,
        annotsIndirect: true,
        firstPage: {
          _map: {
            Annots: {
              gen: 0,
              num: 5
            }
          },
          objId: '4R'
        },
        firstPageId: '4'
      });
    });

    test('FIrst page within layers of kids', () => {
      expect(pdfSigner.processFirstPage(PDF_INDIRECT_LAYERED, ANNOT2_ENTRY)).toEqual({
        annots: [
          {
            gen: 0,
            num: 102
          }
        ],
        annotsId: 5,
        annotsIndirect: true,
        firstPage: {
          _map: {
            Annots: {
              gen: 0,
              num: 5
            }
          },
          objId: '4R'
        },
        firstPageId: '4'
      });
    });

    test('No annots in first page', () => {
      expect(pdfSigner.processFirstPage(PDF_NO, ANNOT2_ENTRY)).toEqual({
        annotsIndirect: false,
        firstPage: {
          _map: {
            Annots: [
              {
                gen: 0,
                num: 102
              }
            ]
          },
          objId: '4R'
        },
        firstPageId: '4'
      });
    });
  });

  describe('signing Main Flow', () => {
    test('sign', async () => {
      const pdf = jest.fn();
      const pdfWithSignature = jest.fn();
      const pdfBytes = jest.fn();

      pdfSigner.loadPdf = jest.fn();
      pdfSigner.appendSig = jest.fn();
      pdfSigner.ksiErrorManager = { addError: jest.fn() };

      when(pdfSigner.loadPdf)
        .calledWith(pdfBytes)
        .mockReturnValue(pdf);
      when(pdfSigner.appendSig)
        .calledWith(pdf)
        .mockReturnValue(pdfWithSignature);

      expect(await pdfSigner.sign(pdfBytes)).toEqual(pdfWithSignature);
      expect(pdfSigner.ksiErrorManager.addError).not.toHaveBeenCalled();
    });

    test('sign adds error if signing fails', async () => {
      const pdf = jest.fn();
      const pdfBytes = jest.fn();
      const message = 'Error occurred while signing the PDF. ';

      pdfSigner.loadPdf = jest.fn();
      pdfSigner.appendSig = jest.fn();
      pdfSigner.ksiErrorManager = { addError: jest.fn() };
      PDFViewerApplication.l10n = { get: jest.fn() };

      when(pdfSigner.loadPdf)
        .calledWith(pdfBytes)
        .mockReturnValue(pdf);
      when(pdfSigner.appendSig)
        .calledWith(pdf)
        .mockRejectedValue(new Error());
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_signing', null, message)
        .mockReturnValue(message);

      await pdfSigner.sign(pdfBytes);
      expect(pdfSigner.ksiErrorManager.addError).toHaveBeenCalledWith({
        message: message + 'Error',
        operation: 'SIGNING',
        type: 'ERROR'
      });
    });

    test('loadPdf', async () => {
      PDFDocument.prototype.parseStartXRef = jest.fn();
      PDFDocument.prototype.parse = jest.fn();
      pdfSigner.ksiErrorManager = { addError: jest.fn() };

      await pdfSigner.loadPdf(new Uint8Array([10, 10, 10]));

      expect(PDFDocument.prototype.parseStartXRef).toHaveBeenCalled();
      expect(PDFDocument.prototype.parse).toHaveBeenCalled();
      expect(pdfSigner.ksiErrorManager.addError).not.toHaveBeenCalled();
    });

    test('loadPdf adds error if loading fails', async () => {
      const message = 'Error occurred while parsing the PDF.';

      PDFDocument.prototype.parseStartXRef = jest.fn();
      PDFDocument.prototype.parse = jest.fn();
      pdfSigner.ksiErrorManager = { addError: jest.fn() };
      PDFViewerApplication.l10n = { get: jest.fn() };
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_parsing', null, message)
        .mockReturnValue(message);

      await pdfSigner.loadPdf('random data');

      expect(PDFDocument.prototype.parseStartXRef).not.toHaveBeenCalled();
      expect(PDFDocument.prototype.parse).not.toHaveBeenCalled();
      expect(pdfSigner.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        operation: 'SIGNING',
        type: 'ERROR'
      });
    });

    test('loadPdf go into recovery mode', async () => {
      let hasFailed = false;
      PDFDocument.prototype.parseStartXRef = jest.fn();
      PDFDocument.prototype.parse = jest.fn(() => {
        if (!hasFailed) {
          hasFailed = true;
          throw new XRefParseException();
        }
      });
      pdfSigner.ksiErrorManager = { addError: jest.fn() };

      await pdfSigner.loadPdf(new Uint8Array([10, 10, 10]));

      expect(PDFDocument.prototype.parseStartXRef).toHaveBeenCalled();
      expect(PDFDocument.prototype.parse).toHaveBeenCalled();
      expect(PDFDocument.prototype.parse).toHaveBeenCalledWith(true);
      expect(pdfSigner.ksiErrorManager.addError).not.toHaveBeenCalled();
    });

    test('loadPdf fail in recovery mode', async () => {
      const message = 'Error occurred while parsing the PDF.';
      PDFDocument.prototype.parseStartXRef = jest.fn();
      PDFDocument.prototype.parse = jest.fn(() => {
        throw new XRefParseException();
      });

      pdfSigner.ksiErrorManager = { addError: jest.fn() };
      PDFViewerApplication.l10n = { get: jest.fn() };
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_parsing', null, message)
        .mockReturnValue(message);

      await pdfSigner.loadPdf(new Uint8Array([10, 10, 10]));

      expect(PDFDocument.prototype.parseStartXRef).toHaveBeenCalled();
      expect(PDFDocument.prototype.parse).toHaveBeenCalled();
      expect(PDFDocument.prototype.parse).toHaveBeenCalledWith(true);
      expect(pdfSigner.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        operation: 'SIGNING',
        type: 'ERROR'
      });
    });

    test('appendSignature', async () => {
      pdfSigner.signFile = jest.fn();
      pdfSigner.signFile.mockReturnValue(new Uint8Array([10, 10, 10, 10]));

      expect(await pdfSigner.appendSig(PDF_INDIRECT, {})).toEqual(new Uint8Array([10, 10, 10, 10]));
    });

    test('signFile', async () => {
      pdfSigner.ksiConfiguration = { configuration: { ksiHashAlgorithm: 'SHA-256' } };
      DataHasher.prototype.digest = jest.fn();
      DataHasher.prototype.digest.mockReturnValue('sfgfda');
      pdfSigner.ksiService = {
        sign: () => {
          return {
            encode: () => {
              return new Uint8Array([97, 97, 97]);
            }
          };
        }
      };

      expect(
        await pdfSigner.signFile(
          new Uint8Array([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 100, 100, 100, 100, 100, 100, 100, 100]),
          2,
          15
        )
      ).toEqual(new Uint8Array([10, 10, 60, 54, 49, 54, 49, 54, 49, 62, 32, 32, 32, 32, 32, 100, 100, 100, 100]));
    });
  });

  describe('isCorrupted', () => {
    test('isCorrupted true', () => {
      PDFDocument.prototype.parseStartXRef = jest.fn();
      let callCount = 0;
      PDFDocument.prototype.parse = jest.fn(() => {
        if (callCount === 0) {
          callCount++;
          throw new XRefParseException();
        }
        return {
          xref: {
            trailer: {
              _map: {
                Size: 5
              }
            },
            entries: {
              length: 10
            }
          }
        };
      });

      expect(KsiPdfSigner.isCorrupted(new Uint8Array([10, 10, 10]))).toEqual(true);
    });

    test('isCorrupted2 true', () => {
      PDFDocument.prototype.parseStartXRef = jest.fn();
      PDFDocument.prototype.parseStartXRef = jest.fn();
      let callCount = 0;
      PDFDocument.prototype.parse = jest.fn(() => {
        if (callCount === 0) {
          callCount++;
          throw new Error();
        }
        return {
          xref: {
            trailer: {
              _map: {
                Size: 5
              }
            },
            entries: {
              length: 10
            }
          }
        };
      });

      expect(KsiPdfSigner.isCorrupted(new Uint8Array([10, 10, 10]))).toEqual(true);
    });

    test('isCorrupted false', () => {
      PDFDocument.prototype.parseStartXRef = jest.fn();
      PDFDocument.prototype.parse = jest.fn();

      expect(KsiPdfSigner.isCorrupted(new Uint8Array([10, 10, 10]))).toEqual(false);
    });

    test('isCorrupted2 false', () => {
      PDFDocument.prototype.parseStartXRef = jest.fn();
      PDFDocument.prototype.parse = jest.fn();
      when(PDFDocument.prototype.parse)
        .calledWith(false)
        .mockImplementation(() => {
          throw new XRefParseException();
        });
      when(PDFDocument.prototype.parse)
        .calledWith(true)
        .mockReturnValue({
          xref: {
            trailer: {
              _map: {
                Size: 5
              }
            },
            entries: {
              length: 5
            }
          }
        });

      expect(KsiPdfSigner.isCorrupted(new Uint8Array([10, 10, 10]))).toEqual(false);
    });
  });
});
