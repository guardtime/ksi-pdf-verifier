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
import { KsiPdfSignatureExtender } from '../ksipdftool/ksi_pdf_signature_extender';
import { when } from 'jest-when';

describe('Ksi Pdf Signature extender', () => {
  let signatureExtender;

  beforeEach(() => {
    signatureExtender = new KsiPdfSignatureExtender(jest.fn());
  });

  describe('constructor', () => {
    test('constructor', () => {
      const ksiService = jest.fn();

      const signatureExtender = new KsiPdfSignatureExtender(ksiService);
      expect(signatureExtender.ksiService).toEqual(ksiService);
    });
  });

  describe('extend', () => {
    test('Extend success', async () => {
      const signature = jest.fn();
      const extendedSignature = {
        encode() {
          return new Uint8Array([10, 111, 123, 231]);
        }
      };
      signatureExtender.createExtendedSignature = jest.fn();
      when(signatureExtender.createExtendedSignature)
        .calledWith(signature)
        .mockReturnValue(extendedSignature);

      expect(await signatureExtender.extend(signature)).toEqual(
        new Uint8Array([60, 48, 65, 54, 70, 55, 66, 69, 55, 62])
      );
    });

    test('Extend false', async () => {
      const signature = jest.fn();
      signatureExtender.createExtendedSignature = jest.fn();
      when(signatureExtender.createExtendedSignature)
        .calledWith(signature)
        .mockReturnValue(undefined);

      expect(await signatureExtender.extend(signature)).toEqual(null);
    });
  });

  describe('createExtendedSignature', () => {
    test('createExtendedSignature', async () => {
      const extendFunc = jest.fn();
      const pubFileFunc = jest.fn();
      const ksiService = {
        extend: extendFunc,
        getPublicationsFile: pubFileFunc
      };

      const calendarHashChain = jest.fn();
      const getNearestPub = jest.fn();
      const pubFile = {
        getNearestPublicationRecord: getNearestPub
      };

      const aggregationTime = jest.fn();
      const publicationTime = jest.fn();
      const pubRecord = {
        getPublicationTime: () => {
          return publicationTime;
        }
      };

      const signature = {
        extend: jest.fn(),
        getAggregationTime() {
          return aggregationTime;
        }
      };

      when(extendFunc)
        .calledWith(aggregationTime, publicationTime)
        .mockReturnValue(calendarHashChain);
      pubFileFunc.mockReturnValue(pubFile);
      when(getNearestPub)
        .calledWith(aggregationTime)
        .mockReturnValue(pubRecord);

      signatureExtender.ksiService = ksiService;
      await signatureExtender.createExtendedSignature(signature);

      expect(signature.extend).toHaveBeenCalledWith(calendarHashChain, pubRecord);
    });

    test('createExtendedSignature, pubfile not yet available', async () => {
      const extendFunc = jest.fn();
      const pubFileFunc = jest.fn();
      const ksiService = {
        extend: extendFunc,
        getPublicationsFile: pubFileFunc
      };

      const getNearestPub = jest.fn();
      const pubFile = {
        getNearestPublicationRecord: getNearestPub
      };

      const aggregationTime = jest.fn();

      const signature = {
        extend: jest.fn(),
        getAggregationTime() {
          return aggregationTime;
        }
      };

      pubFileFunc.mockReturnValue(pubFile);
      when(getNearestPub)
        .calledWith(aggregationTime)
        .mockReturnValue(undefined);

      signatureExtender.ksiService = ksiService;
      await signatureExtender.createExtendedSignature(signature);

      expect(signature.extend).not.toHaveBeenCalled();
    });
  });

  describe('convertSignatureToUtf8', () => {
    test('convertSignatureToUtf8', () => {
      const signature = {
        encode() {
          return new Uint8Array([10, 111, 123, 231]);
        }
      };
      expect(KsiPdfSignatureExtender.convertSignatureToUtf8(signature)).toEqual(
        new Uint8Array([60, 48, 65, 54, 70, 55, 66, 69, 55, 62])
      );
    });
  });
});
