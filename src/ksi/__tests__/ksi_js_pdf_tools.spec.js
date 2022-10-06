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
  KSI_AGGREGATOR_URL,
  KSI_EXTENDER_URL,
  KSI_LOGIN_ID,
  KSI_LOGIN_KEY,
  KSI_PUB_FILE,
  PDF_BYTES
} from './test-util/common_test_data';
import { ANNOTATION } from './test-util/annotation_test_data';
import { getKsiSignature } from '../ksipdftool/ksi_js_api_util';
import { KsiJsPdfTools } from '../ksipdftool/ksi_js_pdf_tools';
import { KsiPdfSignatureExtender } from '../ksipdftool/ksi_pdf_signature_extender';
import { KsiPdfSignatureVerifier } from '../ksipdftool/ksi_pdf_signature_verifier';
import { KsiPdfSigner } from '../ksipdftool/ksi_pdf_signer';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';

jest.mock('../ksipdftool/ksi_js_api_util', () => {
  return {
    getTlvInputStream: jest.fn(),
    getKsiSignature: jest.fn()
  };
});

const PUBLICATIONS_FILE = jest.fn();

describe('Ksi JS PDF tools', () => {
  PDFViewerApplication.l10n = {
    get: jest.fn()
  };
  let pdfTools;
  const getSignatureFromAnnotation = KsiJsPdfTools.getSignatureFromAnnotation;
  const updateSignatureInFile = KsiJsPdfTools.updateSignatureInFile;
  beforeEach(() => {
    const userPubString = jest.fn();

    const errorManager = {
      addError: jest.fn(),
      showKsiErrorWrapperIfNeeded: jest.fn()
    };
    const ksiConf = {
      configuration: {
        userPublicationString: userPubString
      }
    };
    pdfTools = new KsiJsPdfTools(ksiConf, errorManager);
  });

  describe('constructor', () => {
    test('constructor', () => {
      const errorManager = jest.fn();
      const ksiConf = jest.fn();

      const pdfTools = new KsiJsPdfTools(ksiConf, errorManager);
      expect(pdfTools.ksiErrorManager).toEqual(errorManager);
      expect(pdfTools.ksiConfiguration).toEqual(ksiConf);
    });
  });

  describe('init', () => {
    test('init', () => {
      pdfTools.initServiceAndPolicy = jest.fn();
      pdfTools.downloadPublicationsFile = jest.fn();

      pdfTools.init();

      expect(pdfTools.initServiceAndPolicy).toHaveBeenCalled();
      expect(pdfTools.downloadPublicationsFile).toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    test('creates verifier, gets signature from annotation, verifies signature and returns result', async () => {
      const annotation = {
        byteRange: jest.fn(),
        validByteRange: true
      };
      const signature = jest.fn();
      const pdfBytes = jest.fn();
      const sigIndex = 1;
      pdfTools.policy = jest.fn();
      pdfTools.ksiService = jest.fn();
      pdfTools.publicationsFile = jest.fn();

      KsiJsPdfTools.getSignatureFromAnnotation = jest.fn();
      when(KsiJsPdfTools.getSignatureFromAnnotation)
        .calledWith(annotation)
        .mockReturnValue(signature);

      KsiPdfSignatureVerifier.prototype.verify = jest.fn();
      const result = {
        status: 'VERIFIED',
        signerId: 'GT :: GT :: GT :: anon',
        aggregationTime: ['2019-04-05', '12:46:39.000Z'],
        usedPolicy: 'KeyBasedVerificationPolicy'
      };
      when(KsiPdfSignatureVerifier.prototype.verify)
        .calledWith(signature, pdfBytes, annotation)
        .mockReturnValue(result);

      expect(await pdfTools.verify(annotation, sigIndex, pdfBytes)).toEqual(result);
      expect(KsiJsPdfTools.getSignatureFromAnnotation).toHaveBeenCalledWith(annotation);
      expect(KsiPdfSignatureVerifier.prototype.verify).toHaveBeenCalledWith(signature, pdfBytes, annotation);
      expect(pdfTools.ksiErrorManager.addError).not.toHaveBeenCalled();
    });

    test('creates verifier, gets signature from annotation, gets error from verification returns result', async () => {
      const annotation = {
        byteRange: jest.fn(),
        validByteRange: true
      };
      const signature = jest.fn();
      const pdfBytes = jest.fn();
      const signatureIndex = 1;
      const aggregationTime = jest.fn();
      const message = 'Verification failed. ';
      const result = {
        error: 'Error',
        aggregationTime
      };
      pdfTools.policy = jest.fn();
      pdfTools.ksiService = jest.fn();
      pdfTools.publicationsFile = jest.fn();
      KsiJsPdfTools.getSignatureFromAnnotation = jest.fn();
      when(KsiJsPdfTools.getSignatureFromAnnotation)
        .calledWith(annotation)
        .mockReturnValue(signature);
      KsiPdfSignatureVerifier.prototype.verify = jest.fn();
      when(KsiPdfSignatureVerifier.prototype.verify)
        .calledWith(signature, pdfBytes, annotation)
        .mockReturnValue(result);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_verification_failed', null, message)
        .mockResolvedValue(message);

      expect(await pdfTools.verify(annotation, signatureIndex, pdfBytes)).toEqual(result);
      expect(KsiJsPdfTools.getSignatureFromAnnotation).toHaveBeenCalledWith(annotation);
      expect(KsiPdfSignatureVerifier.prototype.verify).toHaveBeenCalledWith(signature, pdfBytes, annotation);
      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message: message + result.error,
        type: 'WARNING',
        signatureIndex,
        aggregationTime,
        operation: 'SIGNATURE'
      });
    });

    test('verify, invalid byteRange', async () => {
      const annotation = {
        byteRange: jest.fn(),
        validByteRange: false
      };
      const signature = jest.fn();
      const pdfBytes = jest.fn();
      const signatureIndex = 1;
      const aggregationTime = jest.fn();
      const message = 'Signature is invalid! Invalid signature byte range.';

      KsiJsPdfTools.getSignatureFromAnnotation = jest.fn();
      when(KsiJsPdfTools.getSignatureFromAnnotation)
        .calledWith(annotation)
        .mockReturnValue(signature);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_invalid_byte_range', null, message)
        .mockResolvedValue(message);
      KsiPdfSignatureVerifier.getInvalidByteRangeResult = jest.fn(() => {
        return {
          aggregationTime
        };
      });

      await pdfTools.verify(annotation, signatureIndex, pdfBytes);
      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        type: 'ERROR',
        signatureIndex,
        aggregationTime,
        operation: 'SIGNATURE'
      });
      expect(pdfTools.ksiErrorManager.showKsiErrorWrapperIfNeeded).toHaveBeenCalled();
      expect(KsiJsPdfTools.getSignatureFromAnnotation).toHaveBeenCalledWith(annotation);
      expect(KsiPdfSignatureVerifier.getInvalidByteRangeResult).toHaveBeenCalledWith(signature);
    });

    test('verify, broken signature', async () => {
      const annotation = {
        byteRange: jest.fn(),
        validByteRange: false
      };
      const pdfBytes = jest.fn();
      const signatureIndex = 1;
      const message = 'Broken signature. It might have been modified.';

      KsiPdfSignatureVerifier.getBrokenSignature = jest.fn();
      KsiJsPdfTools.getSignatureFromAnnotation = jest.fn(() => {
        throw new Error();
      });
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_broken_signature', null, message)
        .mockResolvedValue(message);

      await pdfTools.verify(annotation, signatureIndex, pdfBytes);
      expect(KsiPdfSignatureVerifier.getBrokenSignature).toHaveBeenCalled();
      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        type: 'ERROR',
        signatureIndex,
        operation: 'SIGNATURE'
      });
    });
  });

  describe('invalidByteRangeResult', () => {
    test('invalidByteRangeResult', async () => {
      const signature = jest.fn();
      const signatureIndex = 1;
      const aggregationTime = jest.fn();
      const message = 'Signature is invalid! Invalid signature byte range.';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_invalid_byte_range', null, message)
        .mockResolvedValue(message);
      KsiPdfSignatureVerifier.getInvalidByteRangeResult = jest.fn(() => {
        return {
          aggregationTime
        };
      });

      expect(await pdfTools.invalidByteRangeResult(signature, signatureIndex)).toEqual({
        aggregationTime
      });
      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        type: 'ERROR',
        signatureIndex,
        aggregationTime,
        operation: 'SIGNATURE'
      });
    });
  });

  describe('verifySignature', () => {
    test('verifySignature', async () => {
      const annotation = {
        byteRange: jest.fn(),
        validByteRange: true
      };
      const signature = jest.fn();
      const pdfBytes = jest.fn();
      const sigIndex = 1;
      pdfTools.policy = jest.fn();
      pdfTools.ksiService = jest.fn();
      pdfTools.publicationsFile = jest.fn();

      KsiPdfSignatureVerifier.prototype.verify = jest.fn();
      const result = {
        status: 'VERIFIED',
        signerId: 'GT :: GT :: GT :: anon',
        aggregationTime: ['2019-04-05', '12:46:39.000Z'],
        usedPolicy: 'KeyBasedVerificationPolicy'
      };
      when(KsiPdfSignatureVerifier.prototype.verify)
        .calledWith(signature, pdfBytes, annotation)
        .mockReturnValue(result);

      expect(await pdfTools.verifySignature(signature, annotation, sigIndex, pdfBytes)).toEqual(result);
      expect(KsiPdfSignatureVerifier.prototype.verify).toHaveBeenCalledWith(signature, pdfBytes, annotation);
      expect(pdfTools.ksiErrorManager.addError).not.toHaveBeenCalled();
    });
  });

  describe('extend', () => {
    test('Extend success', async () => {
      const sigBytes = Uint8Array.from([1, 2, 3, 4]);
      const signature = jest.fn();

      KsiJsPdfTools.getSignatureFromAnnotation = jest.fn();
      when(KsiJsPdfTools.getSignatureFromAnnotation)
        .calledWith(ANNOTATION)
        .mockReturnValue(signature);
      KsiPdfSignatureExtender.prototype.extend = jest.fn();
      when(KsiPdfSignatureExtender.prototype.extend)
        .calledWith(signature)
        .mockReturnValue(sigBytes);
      KsiJsPdfTools.updateSignatureInFile = jest.fn();
      when(KsiJsPdfTools.updateSignatureInFile)
        .calledWith(sigBytes, ANNOTATION, new Uint8Array(PDF_BYTES))
        .mockReturnValue(sigBytes);

      await pdfTools.extend(ANNOTATION, PDF_BYTES);

      expect(pdfTools.ksiErrorManager.addError).not.toHaveBeenCalled();
    });

    test('Extend fails URL error', async () => {
      const signature = jest.fn();
      const message = 'Error occurred while extending signature. ';

      KsiPdfSignatureExtender.prototype.extend = jest.fn();
      KsiPdfSignatureExtender.prototype.extend.mockImplementation(() => {
        throw new Error();
      });
      pdfTools.updateSignatureInFile = jest.fn();
      pdfTools.getSignatureFromAnnotation = jest.fn();
      when(pdfTools.getSignatureFromAnnotation)
        .calledWith(ANNOTATION)
        .mockReturnValue(signature);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_extending', null, message)
        .mockResolvedValue(message);

      await pdfTools.extend(ANNOTATION, PDF_BYTES);

      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message: message + 'Error',
        type: 'ERROR',
        operation: 'EXTENDING'
      });
      expect(pdfTools.updateSignatureInFile).not.toHaveBeenCalled();
    });

    test('Extend fails signature too long', async () => {
      const sigBytes = new Uint8Array(20000);
      const signature = jest.fn();
      const message = "The extended signature is too long and can't be inserted into the document.";

      pdfTools.updateSignatureInFile = jest.fn();
      KsiJsPdfTools.getSignatureFromAnnotation = jest.fn();
      when(KsiJsPdfTools.getSignatureFromAnnotation)
        .calledWith(ANNOTATION)
        .mockReturnValue(signature);
      KsiPdfSignatureExtender.prototype.extend = jest.fn();
      when(KsiPdfSignatureExtender.prototype.extend)
        .calledWith(signature)
        .mockReturnValue(sigBytes);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_extended_signature_too_long', null, message)
        .mockResolvedValue(message);

      await pdfTools.extend(ANNOTATION, PDF_BYTES);

      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        type: 'ERROR',
        operation: 'EXTENDING'
      });
      expect(pdfTools.updateSignatureInFile).not.toHaveBeenCalled();
    });

    test('Extend returns null on invalid byte range', async () => {
      const annotation = {
        validByteRange: false
      };
      expect(await pdfTools.extend(annotation, PDF_BYTES)).toBeNull();
      expect(pdfTools.ksiErrorManager.showKsiErrorWrapperIfNeeded).toHaveBeenCalled();
    });

    test('Extend fails publication not yet available', async () => {
      const signature = jest.fn();
      const message = 'Publication not yet available.';

      pdfTools.updateSignatureInFile = jest.fn();
      KsiJsPdfTools.getSignatureFromAnnotation = jest.fn();
      when(KsiJsPdfTools.getSignatureFromAnnotation)
        .calledWith(ANNOTATION)
        .mockReturnValue(signature);
      KsiPdfSignatureExtender.prototype.extend = jest.fn();
      when(KsiPdfSignatureExtender.prototype.extend)
        .calledWith(signature)
        .mockReturnValue(undefined);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_pub_not_available', null, message)
        .mockResolvedValue(message);

      await pdfTools.extend(ANNOTATION, PDF_BYTES);

      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        type: 'ERROR',
        operation: 'EXTENDING'
      });
      expect(pdfTools.updateSignatureInFile).not.toHaveBeenCalled();
    });
  });

  describe('sign', () => {
    test('sign signing fails', async () => {
      const pdf = jest.fn();
      const ksiService = jest.fn();
      const message = 'Error occurred while signing the PDF. ';

      pdfTools.ksiService = ksiService;
      KsiPdfSigner.prototype.loadPdf = jest.fn();
      KsiPdfSigner.prototype.appendSig = jest.fn();
      when(KsiPdfSigner.prototype.loadPdf)
        .calledWith(PDF_BYTES)
        .mockReturnValue(pdf);
      when(KsiPdfSigner.prototype.appendSig)
        .calledWith(pdf)
        .mockImplementation(() => {
          throw new Error();
        });
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_signing', null, message)
        .mockResolvedValue(message);

      await pdfTools.sign(PDF_BYTES);

      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({
        message: message + 'Error',
        type: 'ERROR',
        operation: 'SIGNING'
      });
    });

    test('signs pdf', async () => {
      const res = [10, 10, 10];

      KsiPdfSigner.prototype.sign = jest.fn();
      when(KsiPdfSigner.prototype.sign)
        .calledWith(PDF_BYTES)
        .mockReturnValue(res);

      pdfTools.ksiErrorManager = {
        addError: jest.fn(),
        addErrorIbj: jest.fn(),
        showKsiErrorWrapperIfNeeded: jest.fn()
      };
      expect(await pdfTools.sign(PDF_BYTES)).toEqual(res);
    });
  });

  describe('initServiceAndPolicy', () => {
    test('initializes KSI service and policy', async () => {
      pdfTools.createPolicy = jest.fn();
      pdfTools.ksiConfiguration = {
        configuration: {
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY,
          ksiPubFileValue: KSI_PUB_FILE
        }
      };
      const textEncoder = { encode: jest.fn() };
      window.TextEncoder = jest.fn(() => {
        return textEncoder;
      });
      const encodedKey = 'encodedKey';
      when(textEncoder.encode)
        .calledWith(KSI_LOGIN_KEY)
        .mockReturnValue(encodedKey);

      pdfTools.initServiceAndPolicy();

      expect(pdfTools.ksiService).toEqual({
        extendingService: {
          extendingServiceCredentials: {
            hmacAlgorithm: {
              deprecatedSince: null,
              id: 1,
              length: 32,
              lookupNames: ['sha256', 'default', 'sha2256', 'sha2'],
              name: 'SHA-256',
              obsoleteSince: null,
              status: 0
            },
            loginId: 'username',
            loginKey: new Uint8Array([112, 97, 115, 115, 119, 111, 114, 100])
          },
          extendingServiceProtocol: {
            url: 'https://valid-ksi-extender-url.com'
          },
          requests: {}
        },
        publicationsFileService: {
          publicationsFileFactory: {
            signatueSubjectToVerify: 'E=publications@guardtime.com',
            trustedCertificates:
              '-----BEGIN CERTIFICATE-----\nMIIFejCCA2KgAwIBAgIQdlP+sEyg1XHyFLOOLH8XQTANBgkqhkiG9w0BAQwFADBX\nMQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEtMCsGA1UE\nAxMkR2xvYmFsU2lnbiBEb2N1bWVudCBTaWduaW5nIFJvb3QgUjQ1MB4XDTIwMDMx\nODAwMDAwMFoXDTQ1MDMxODAwMDAwMFowVzELMAkGA1UEBhMCQkUxGTAXBgNVBAoT\nEEdsb2JhbFNpZ24gbnYtc2ExLTArBgNVBAMTJEdsb2JhbFNpZ24gRG9jdW1lbnQg\nU2lnbmluZyBSb290IFI0NTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIB\nAKPQGKqmJaBoxSoYFVYt/dBLfaEecm4xsZ0STDc8LAzKutUukiBLkultAJxEbzgX\n7xlg8skghJR6OwgNa0hl/NAeJPXU3NpHUphO342nitTllKh8siw4i+XSLZwAGTM3\nirhsZWIblOjjm6R1ay2AGh0b5i+n7HHq6wQPsanAk1JhIC29UptoWDRLa0tbPm1y\n1jjYlUGTTnn9T9W1/MiApVkIN+iyet62eQxB4PFg1i7y5KFN2BOrz45kW3zc5jEp\nHg2Qtjjo0PY6TTDHePklFWfhz3/3k5B/3kD6aYt9oENfRfnCS5d/UWEuC2LOYNoN\nX3bMlJwd2IXs70V+vuoq0D8UjWkgfgxW/epp9KlEweatJ/9Ycah9LzufHn/ZcgXo\nkSSAGtQheY4uWvr5j7AQKDCNquDyk9s9cVGrs553LgaAN4oLTg+YejcboM1JpUEQ\nhMOfUG0vKI4u88+2x1SBbiychxEN7eP1hIsr/hSQu0ooVDRMZ/viKnN2JpFfx9o/\nNp/aJy8nDcDHOf7b4/k2aYKAvfXB8aAz7od2H4gJft3oQbS+DxCkBuXt4Qh7JfdH\nB7wqJQ8xOpGoqhMzkK8Op2DWgn1nTTQW4We7eeuCMEa0APhZuw78sxCRRSPY8TFC\nBLFgZ6hjg7KsP5/3GBiETFGFZpoqHNLbKbmbG0Ma6jPtAgMBAAGjQjBAMA4GA1Ud\nDwEB/wQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQHQVdLz+EcFlPV\nveuDbMyLKSGEvzANBgkqhkiG9w0BAQwFAAOCAgEAJJwyIaZykDsC3f64SqaO8Dew\nW/8uP7Enbtl+nvSPX36/u4OFcMSKj0ZdxgpRKQLIxqBD/cICE/I6IZLdRpXDdLg8\nVyIBhGhns1Beem4spPSj9QsM+VoNR4VFGk+bTNGokfOJqj5JqvWEsRe0S+ZeaRT9\nRBsK/yDOCP70ZXKtxSJc3PKljMXcHWzb95anN2oaMLxrWTDjDUjxuGS5F5XG5J+D\nprLujbvhniXMwFaoAQeRa6Qu6hPr2/FJb+U7OpYn/kRQ4Qw0qxgQwaZwieJSyB2/\nYtY0guX+x5gAYRCAdyd8rF1yQrgiD3Ig9wpH0FUGVU/vZG2z/DrgoVZPZ8lFVMQT\nIfurtfoxGlsGaU463x4gvCB/sCt0MtaodrM6PgseIETeh6b3UgsLjxT4MQOq6hHJ\n2ZVGwIS72OsrLwpQxDgjf2+zv8Mnt/VMhwFzSQflwIyt7MeBQo/bXWsO2yHystfX\nkieXNu3GS19zR7kMuA3cSUtFsr8xjuFVhCfpWBoxwg4m01/Ri70gXXHfl2Hd35XJ\n4Msv20ScC3QKfRuKtE+MKJZM6CnLilxY8bg9bsLd2myyB6mr6NHR0niwPtPFaY13\n54Rk+LFW8fsZ0Yhmbz0bZcglRTwfdDseHDjr8aMsUsG/6CH0Lo4yg58V6vQNo5RH\nRn7JhIJYRobXTF+4bZk=\n-----END CERTIFICATE-----\n'
          },
          publicationsFileServiceProtocol: {
            url: 'https://verify.guardtime.com/ksi-publications.bin'
          }
        },
        signingService: {
          requests: {},
          signingServiceCredentials: {
            hmacAlgorithm: {
              deprecatedSince: null,
              id: 1,
              length: 32,
              lookupNames: ['sha256', 'default', 'sha2256', 'sha2'],
              name: 'SHA-256',
              obsoleteSince: null,
              status: 0
            },
            loginId: 'username',
            loginKey: new Uint8Array([112, 97, 115, 115, 119, 111, 114, 100])
          },
          signingServiceProtocol: {
            url: 'https://valid-ksi-signer-url.com'
          }
        }
      });
      expect(pdfTools.createPolicy).toHaveBeenCalled();
    });
  });

  describe('createPolicy', () => {
    test('creates KeyBasedVerificationPolicy', () => {
      pdfTools.ksiConfiguration = { configuration: { keyBasedVerificationValue: true } };

      pdfTools.createPolicy();

      expect(pdfTools.policy.firstRule.getRuleName()).toEqual('KeyBasedVerificationPolicy');
    });

    test('creates CalendarBasedVerificationPolicy', () => {
      pdfTools.ksiConfiguration = { configuration: { calendarBasedVerificationValue: true } };

      pdfTools.createPolicy();

      expect(pdfTools.policy.firstRule.getRuleName()).toEqual('CalendarBasedVerificationPolicy');
    });

    test('creates PublicationsFileVerificationPolicy', () => {
      pdfTools.ksiConfiguration = { configuration: { publicationBasedVerificationValue: true } };

      pdfTools.createPolicy();
      expect(pdfTools.policy.firstRule.getNextRule(0).getRuleName()).toEqual('PublicationsFileVerificationPolicy');
    });

    test('creates UserProvidedPublicationBasedVerificationPolicy', () => {
      pdfTools.ksiConfiguration = { configuration: { userPublicationBasedVerificationValue: true } };

      pdfTools.createPolicy();

      expect(pdfTools.policy.firstRule.getNextRule(0).getRuleName()).toEqual(
        'UserProvidedPublicationBasedVerificationPolicy'
      );
    });

    test('creates a policy with no rule', () => {
      pdfTools.ksiConfiguration = { configuration: {} };

      pdfTools.createPolicy();

      expect(pdfTools.policy.firstRule).toBeNull();
    });

    test('creates a policy with a full fallback cycle', () => {
      pdfTools.ksiConfiguration = {
        configuration: {
          userPublicationBasedVerificationValue: true,
          publicationBasedVerificationValue: true,
          calendarBasedVerificationValue: true,
          keyBasedVerificationValue: true
        }
      };

      pdfTools.createPolicy();

      const resultCodeNA = 2;
      const firstRule = pdfTools.policy.firstRule.getNextRule(0);
      const secondRule = firstRule.getNextRule(resultCodeNA);
      const thirdRule = secondRule.getNextRule(resultCodeNA);
      const fourthRule = thirdRule.getNextRule(resultCodeNA);
      expect(firstRule.getRuleName()).toEqual('UserProvidedPublicationBasedVerificationPolicy');
      expect(secondRule.getRuleName()).toEqual('PublicationsFileVerificationPolicy');
      expect(thirdRule.getRuleName()).toEqual('KeyBasedVerificationPolicy');
      expect(fourthRule.getRuleName()).toEqual('CalendarBasedVerificationPolicy');
    });
  });

  describe('downloadPublicationsFile', () => {
    test('downloadPublicationsFile', async () => {
      pdfTools.ksiService = {
        getPublicationsFile: jest.fn(() => {
          return Promise.resolve(PUBLICATIONS_FILE);
        })
      };

      await pdfTools.downloadPublicationsFile(true);

      expect(pdfTools.ksiService.getPublicationsFile).toHaveBeenCalled();
      expect(pdfTools.publicationsFile).toEqual(PUBLICATIONS_FILE);
    });

    test('dont downloadPublicationsFile', async () => {
      pdfTools.ksiService = {
        getPublicationsFile: jest.fn(() => {
          return Promise.resolve(PUBLICATIONS_FILE);
        })
      };
      pdfTools.publicationsFile = jest.fn();

      await pdfTools.downloadPublicationsFile(false);

      expect(pdfTools.ksiService.getPublicationsFile).not.toHaveBeenCalled();
    });

    test('cannot downloadPublicationsFile', async () => {
      const ksiService = {
        getPublicationsFile: jest.fn(() => {
          throw new Error();
        })
      };
      const message = 'Cannot download publication file. Check Publication File URL in KSI Configuration.';

      pdfTools.ksiService = ksiService;
      pdfTools.publicationsFile = null;
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_publication_download', null, message)
        .mockResolvedValue(message);

      await pdfTools.downloadPublicationsFile(false);

      expect(pdfTools.ksiErrorManager.addError).toHaveBeenCalledWith({ message, type: 'ERROR', operation: 'DOCUMENT' });
    });
  });

  describe('getSignatureFromAnnotation', () => {
    test('getSignatureFromAnnotation', () => {
      const signature = jest.fn();
      getKsiSignature.mockReturnValue(signature);

      expect(getSignatureFromAnnotation(ANNOTATION)).toEqual(signature);
    });
  });

  describe('updateSignatureInFile', () => {
    test('UpdateSignatureInFile', () => {
      const pdf = new Uint8Array([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
      const res = new Uint8Array([10, 10, 10, 11, 11, 11, 32, 32, 10, 10]);
      const annotation = {
        byteRange: [0, 3, 8, 9]
      };
      const signature = new Uint8Array([11, 11, 11]);

      expect(updateSignatureInFile(signature, annotation, pdf)).toEqual(res);
    });
  });
});
