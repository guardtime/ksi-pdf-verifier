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
import { DataHasher } from '@guardtime/common';
import { VerificationContext } from '@guardtime/ksi-js-api/lib/common/signature/verification/VerificationContext';

export class KsiPdfSignatureVerifier {
  constructor(policy, ksiService, publicationsFile, userPublicationString) {
    this.policy = policy;
    this.ksiService = ksiService;
    this.publicationsFile = publicationsFile;
    this.userPublicationString = userPublicationString;
  }

  async verify(signature, pdfBytes, annotation) {
    let verificationResult;
    if (annotation.validByteRange) {
      const hasher = KsiPdfSignatureVerifier.getDataHasher(signature);
      hasher.update(pdfBytes.slice(annotation.byteRange[0], annotation.byteRange[1]));
      hasher.update(pdfBytes.slice(annotation.byteRange[2], annotation.byteRange[2] + annotation.byteRange[3]));

      const hash = await hasher.digest();

      const context = KsiPdfSignatureVerifier.getVerificationContext(signature);
      context.setDocumentHash(hash);
      context.setExtendingAllowed(false);
      context.setKsiService(this.ksiService);
      if (this.publicationsFile) {
        context.setPublicationsFile(this.publicationsFile);
      }
      if (this.userPublicationString) {
        context.setUserPublication(this.userPublicationString);
      }

      verificationResult = await this.policy.verify(context);
    } else {
      verificationResult = { resultCode: 1 };
    }

    return this.processVerificationResult(verificationResult, signature);
  }

  static getDataHasher(signature) {
    return new DataHasher(signature.getInputHash().hashAlgorithm);
  }

  static getVerificationContext(signature) {
    return new VerificationContext(signature);
  }

  processVerificationResult(verificationResult, signature) {
    const result = {};
    if (verificationResult.resultCode === 0) {
      result['status'] = 'VERIFIED';
    } else if (
      verificationResult.verificationError &&
      (verificationResult.verificationError.code === 'GEN-02' || verificationResult.verificationError.code === 'INT-07')
    ) {
      result['status'] = 'INCONCLUSIVE';
      result['error'] = verificationResult.verificationError.code + ': ' + verificationResult.verificationError.message;
    } else if (verificationResult.verificationError) {
      result['status'] = 'INVALID';
      result['error'] = verificationResult.verificationError.code + ': ' + verificationResult.verificationError.message;
    } else if (verificationResult.resultCode === 1) {
      result['status'] = 'INVALID';
    }

    if (verificationResult.childResults && verificationResult.childResults.length) {
      const usedPolicy = verificationResult.childResults[verificationResult.childResults.length - 1];
      if (usedPolicy.getResultCode() === 0) {
        result['usedPolicy'] = usedPolicy.getRuleName();
      }
    }

    result['signerId'] = KsiPdfSignatureVerifier.getSignerId(signature.getIdentity());
    result['aggregationTime'] = KsiPdfSignatureVerifier.getAggregationTime(signature);

    return result;
  }

  static getInvalidByteRangeResult(signature) {
    return {
      status: 'INVALID',
      signerId: KsiPdfSignatureVerifier.getSignerId(signature.getIdentity()),
      aggregationTime: KsiPdfSignatureVerifier.getAggregationTime(signature)
    };
  }

  static getBrokenSignature() {
    return { status: 'INVALID' };
  }

  static getSignerId(identity) {
    const signerID = [];
    for (const signer of identity) {
      signerID.push(signer.clientId.value);
    }
    return signerID
      .join(' :: ')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static getAggregationTime(signature) {
    return new Date(signature.getAggregationTime() * 1000).toISOString().split('T');
  }
}
