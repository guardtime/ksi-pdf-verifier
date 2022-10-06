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
import { ANNOTATION } from './test-util/annotation_test_data';
import { KsiPdfSignatureVerifier } from '../ksipdftool/ksi_pdf_signature_verifier';
import { KsiSignature } from '@guardtime/ksi-js-api/lib/common/signature/KsiSignature';
import { PDF_BYTES } from './test-util/common_test_data';
import { TlvInputStream } from '@guardtime/ksi-js-api/lib/common/parser/TlvInputStream';

const SIGNER_IDENTITY = 'GT :: Telia :: Random Company :: Server 7';
const AGGREGATION_TIME = ['2019-04-05', '12:32:39.000Z'];
describe('Ksi Pdf Signature Verifier', () => {
  let signatureVerifier;
  let tempFunc;
  beforeEach(() => {
    signatureVerifier = new KsiPdfSignatureVerifier(jest.fn(), jest.fn(), jest.fn(), jest.fn());
  });

  describe('constructor', () => {
    test('constructor', () => {
      const policy = jest.fn();
      const ksiService = jest.fn();
      const publicationFile = jest.fn();
      const userPublicationString = jest.fn();
      const signatureVerifier = new KsiPdfSignatureVerifier(policy, ksiService, publicationFile, userPublicationString);

      expect(signatureVerifier.policy).toEqual(policy);
      expect(signatureVerifier.ksiService).toEqual(ksiService);
      expect(signatureVerifier.publicationsFile).toEqual(publicationFile);
      expect(signatureVerifier.userPublicationString).toEqual(userPublicationString);
    });
  });

  describe('verify', () => {
    test('Verify with publications file', async () => {
      const policy = {
        verify: jest.fn()
      };
      const ksiService = jest.fn();
      const publicationFile = jest.fn();
      const context = {
        setDocumentHash: jest.fn(),
        setExtendingAllowed: jest.fn(),
        setKsiService: jest.fn(),
        setPublicationsFile: jest.fn(),
        setUserPublication: jest.fn()
      };

      signatureVerifier = new KsiPdfSignatureVerifier(policy, ksiService, publicationFile, undefined);
      signatureVerifier.processVerificationResult = jest.fn();
      tempFunc = KsiPdfSignatureVerifier.getVerificationContext;
      KsiPdfSignatureVerifier.getVerificationContext = jest.fn();
      KsiPdfSignatureVerifier.getVerificationContext.mockReturnValue(context);

      const stream = new TlvInputStream(ANNOTATION.signature);
      const signature = new KsiSignature(stream.readTag());

      await signatureVerifier.verify(signature, PDF_BYTES, ANNOTATION);

      expect(context.setPublicationsFile).toHaveBeenCalled();
      expect(context.setUserPublication).not.toHaveBeenCalled();
    });

    test('Verify with userPublications', async () => {
      const policy = {
        verify: jest.fn()
      };
      const ksiService = jest.fn();
      const userPublications = jest.fn();
      const context = {
        setDocumentHash: jest.fn(),
        setExtendingAllowed: jest.fn(),
        setKsiService: jest.fn(),
        setPublicationsFile: jest.fn(),
        setUserPublication: jest.fn()
      };

      signatureVerifier = new KsiPdfSignatureVerifier(policy, ksiService, undefined, userPublications);
      signatureVerifier.processVerificationResult = jest.fn();
      KsiPdfSignatureVerifier.getVerificationContext = jest.fn();
      KsiPdfSignatureVerifier.getVerificationContext.mockReturnValue(context);

      const stream = new TlvInputStream(ANNOTATION.signature);
      const signature = new KsiSignature(stream.readTag());

      await signatureVerifier.verify(signature, PDF_BYTES, ANNOTATION);

      expect(context.setPublicationsFile).not.toHaveBeenCalled();
      expect(context.setUserPublication).toHaveBeenCalled();
    });

    test('Verify invalid byteRange', async () => {
      const annotation = {
        validByteRange: false
      };
      const policy = {
        verify: jest.fn()
      };
      const ksiService = jest.fn();
      const userPublications = jest.fn();

      signatureVerifier = new KsiPdfSignatureVerifier(policy, ksiService, undefined, userPublications);
      signatureVerifier.processVerificationResult = jest.fn();

      const stream = new TlvInputStream(ANNOTATION.signature);
      const signature = new KsiSignature(stream.readTag());

      await signatureVerifier.verify(signature, PDF_BYTES, annotation);

      expect(signatureVerifier.processVerificationResult).toHaveBeenCalledWith({ resultCode: 1 }, signature);
    });
  });

  describe('getDataHasher', () => {
    test('returns dataHasher object which can be used to get a hash from inputData', async () => {
      const stream = new TlvInputStream(ANNOTATION.signature);
      const signature = new KsiSignature(stream.readTag());

      const hasher = KsiPdfSignatureVerifier.getDataHasher(signature);

      // prettier-ignore
      const inputData = Uint8Array.from(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2]
      );

      // prettier-ignore
      const outputData =
        [155, 9, 26, 130, 112, 15, 216, 196, 251, 55, 63, 216, 111, 232, 163, 77, 176, 62, 170, 105, 9, 134,
          128, 47, 137, 166, 54, 159, 16, 151, 70, 104];

      hasher.update(inputData);
      const result = await hasher.digest();
      expect(result.value).toEqual(Uint8Array.from(outputData));
    });
  });

  describe('getVerificationContext', () => {
    test('returns verificationContext object', () => {
      const stream = new TlvInputStream(ANNOTATION.signature);
      const signature = new KsiSignature(stream.readTag());

      KsiPdfSignatureVerifier.getVerificationContext = tempFunc;
      const verificationContext = KsiPdfSignatureVerifier.getVerificationContext(signature);

      expect(verificationContext.getSignature().getInputHash().value).toEqual(signature.getInputHash().value);
    });
  });

  describe('processVerificationResult', () => {
    test('signature verified', () => {
      const identity = [
        {
          clientId: {
            value: 'GT'
          }
        },
        {
          clientId: {
            value: 'Telia'
          }
        },
        {
          clientId: {
            value: 'Random Company'
          }
        },
        {
          clientId: {
            value: 'Server 7'
          }
        }
      ];
      const signature = {
        getAggregationTime: jest.fn(() => {
          return 1554467559;
        }),
        getIdentity: jest.fn(() => {
          return identity;
        })
      };

      const verificationResult = {
        resultCode: 0,
        childResults: [
          {
            getResultCode() {
              return 0;
            },
            getRuleName() {
              return 'PublicationsFileVerificationPolicy';
            }
          }
        ]
      };

      const res = {
        status: 'VERIFIED',
        signerId: 'GT :: Telia :: Random Company :: Server 7',
        aggregationTime: ['2019-04-05', '12:32:39.000Z'],
        usedPolicy: 'PublicationsFileVerificationPolicy'
      };

      expect(signatureVerifier.processVerificationResult(verificationResult, signature)).toEqual(res);
    });

    test('signature invalid', () => {
      const identity = [
        {
          clientId: {
            value: 'GT'
          }
        },
        {
          clientId: {
            value: 'Telia'
          }
        },
        {
          clientId: {
            value: 'Random Company'
          }
        },
        {
          clientId: {
            value: 'Server 7'
          }
        }
      ];
      const signature = {
        getAggregationTime: jest.fn(() => {
          return 1554467559;
        }),
        getIdentity: jest.fn(() => {
          return identity;
        })
      };

      const verificationResult = {
        resultCode: 1,
        childResults: [
          {
            getResultCode() {
              return 1;
            },
            getRuleName() {
              return 'PublicationsFileVerificationPolicy';
            }
          }
        ]
      };

      const res = {
        status: 'INVALID',
        signerId: 'GT :: Telia :: Random Company :: Server 7',
        aggregationTime: ['2019-04-05', '12:32:39.000Z']
      };

      expect(signatureVerifier.processVerificationResult(verificationResult, signature)).toEqual(res);
    });

    test('signature inconclusive', () => {
      const identity = [
        {
          clientId: {
            value: 'GT'
          }
        },
        {
          clientId: {
            value: 'Telia'
          }
        },
        {
          clientId: {
            value: 'Random Company'
          }
        },
        {
          clientId: {
            value: 'Server 7'
          }
        }
      ];
      const signature = {
        getAggregationTime: jest.fn(() => {
          return 1554467559;
        }),
        getIdentity: jest.fn(() => {
          return identity;
        })
      };

      const verificationResult = {
        verificationError: {
          code: 'GEN-02'
        }
      };

      const res = {
        status: 'INCONCLUSIVE',
        error: 'GEN-02: undefined',
        signerId: 'GT :: Telia :: Random Company :: Server 7',
        aggregationTime: ['2019-04-05', '12:32:39.000Z']
      };

      expect(signatureVerifier.processVerificationResult(verificationResult, signature)).toEqual(res);
    });
  });

  describe('getSignerId', () => {
    test('returns signer id', () => {
      const identity = [
        {
          clientId: {
            value: 'GT'
          }
        },
        {
          clientId: {
            value: 'Telia'
          }
        },
        {
          clientId: {
            value: 'Random Company'
          }
        },
        {
          clientId: {
            value: 'Server 7'
          }
        }
      ];

      expect(KsiPdfSignatureVerifier.getSignerId(identity)).toEqual(SIGNER_IDENTITY);
    });
  });

  describe('getAggregationTime', () => {
    test('returns aggregation time in human readable format', () => {
      const signature = {
        getAggregationTime: jest.fn(() => {
          return 1554467559;
        })
      };

      expect(KsiPdfSignatureVerifier.getAggregationTime(signature)).toEqual(AGGREGATION_TIME);
    });
  });

  describe('getInvalidByteRangeResult', () => {
    test('getInvalidByteRangeResult', () => {
      const signature = {
        getIdentity: () => {
          return [
            { clientId: { value: 'GT' } },
            { clientId: { value: 'GT' } },
            { clientId: { value: 'GT' } },
            { clientId: { value: 'Anon' } }
          ];
        },
        getAggregationTime: () => {
          return 123455678;
        }
      };

      expect(KsiPdfSignatureVerifier.getInvalidByteRangeResult(signature)).toEqual({
        status: 'INVALID',
        signerId: 'GT :: GT :: GT :: Anon',
        aggregationTime: ['1973-11-29', '21:14:38.000Z']
      });
    });
  });
});
