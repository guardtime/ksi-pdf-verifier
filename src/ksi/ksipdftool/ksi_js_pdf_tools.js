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
  CalendarBasedVerificationPolicy,
  ExtendingService,
  KeyBasedVerificationPolicy,
  KsiService,
  PublicationsFileFactory,
  PublicationsFileService,
  PublicationsFileVerificationPolicy,
  ServiceCredentials,
  SigningService,
  UserProvidedPublicationBasedVerificationPolicy,
  VerificationPolicy
} from '@guardtime/ksi-js-api/lib/common/main';
import {
  ExtendingServiceProtocol,
  PublicationsFileServiceProtocol,
  SigningServiceProtocol
} from '@guardtime/ksi-js-api/lib/web/main';
import { getKsiSignature, getTlvInputStream } from './ksi_js_api_util';
import { InternalVerificationPolicy } from '@guardtime/ksi-js-api/lib/common/signature/verification/policy/InternalVerificationPolicy';
import { KsiPdfSignatureExtender } from './ksi_pdf_signature_extender';
import { KsiPdfSignatureVerifier } from './ksi_pdf_signature_verifier';
import { KsiPdfSigner } from './ksi_pdf_signer';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { Utf8Converter } from '@guardtime/common';

export class KsiJsPdfTools {
  constructor(ksiConfiguration, ksiErrorManager) {
    this.ksiConfiguration = ksiConfiguration;
    this.ksiErrorManager = ksiErrorManager;
  }

  async init() {
    this.initServiceAndPolicy();
    await this.downloadPublicationsFile(true);
  }

  async verify(annotation, signatureIndex, pdfBytes) {
    let result;
    let signature;

    try {
      signature = KsiJsPdfTools.getSignatureFromAnnotation(annotation);
    } catch (e) {
      result = KsiPdfSignatureVerifier.getBrokenSignature();
      const message = await PDFViewerApplication.l10n.get(
        'ksi_error_broken_signature',
        null,
        'Broken signature. It might have been modified.'
      );
      this.ksiErrorManager.addError({ message, type: 'ERROR', signatureIndex, operation: 'SIGNATURE' });
    }

    if (signature) {
      if (annotation.validByteRange) {
        result = this.verifySignature(signature, annotation, signatureIndex, pdfBytes);
      } else {
        result = this.invalidByteRangeResult(signature, signatureIndex);
      }
    }

    await this.ksiErrorManager.showKsiErrorWrapperIfNeeded();
    return result;
  }

  async verifySignature(signature, annotation, signatureIndex, pdfBytes) {
    const signatureVerifier = new KsiPdfSignatureVerifier(
      this.policy,
      this.ksiService,
      this.publicationsFile,
      this.ksiConfiguration.configuration.userPublicationString
    );
    const result = await signatureVerifier.verify(signature, pdfBytes, annotation);
    if (result.error) {
      const message = await PDFViewerApplication.l10n.get(
        'ksi_error_verification_failed',
        null,
        'Verification failed. '
      );
      this.ksiErrorManager.addError({
        message: message + result.error,
        type: 'WARNING',
        signatureIndex,
        aggregationTime: result.aggregationTime,
        operation: 'SIGNATURE'
      });
    }
    return result;
  }

  async invalidByteRangeResult(signature, signatureIndex) {
    const result = KsiPdfSignatureVerifier.getInvalidByteRangeResult(signature);
    const message = await PDFViewerApplication.l10n.get(
      'ksi_error_invalid_byte_range',
      null,
      'Signature is invalid! Invalid signature byte range.'
    );
    this.ksiErrorManager.addError({
      message,
      type: 'ERROR',
      signatureIndex,
      aggregationTime: result.aggregationTime,
      operation: 'SIGNATURE'
    });
    return result;
  }

  async extend(annotation, pdfBytes) {
    if (annotation.validByteRange) {
      const signatureExtender = new KsiPdfSignatureExtender(this.ksiService);
      const signature = await KsiJsPdfTools.getSignatureFromAnnotation(annotation);
      try {
        const extendedSignature = await signatureExtender.extend(signature);
        if (extendedSignature) {
          if (!(annotation.byteRange[2] - annotation.byteRange[1] < extendedSignature.length)) {
            return KsiJsPdfTools.updateSignatureInFile(extendedSignature, annotation, pdfBytes);
          }
          const message = await PDFViewerApplication.l10n.get(
            'ksi_error_extended_signature_too_long',
            null,
            "The extended signature is too long and can't be inserted into the document."
          );
          this.ksiErrorManager.addError({ message, type: 'ERROR', operation: 'EXTENDING' });
        } else {
          const message = await PDFViewerApplication.l10n.get(
            'ksi_error_pub_not_available',
            null,
            'Publication not yet available.'
          );
          this.ksiErrorManager.addError({ message, type: 'ERROR', operation: 'EXTENDING' });
        }
      } catch (e) {
        const message = await PDFViewerApplication.l10n.get(
          'ksi_error_extending',
          null,
          'Error occurred while extending signature. '
        );
        this.ksiErrorManager.addError({ message: message + e, type: 'ERROR', operation: 'EXTENDING' });
      }
    }
    await this.ksiErrorManager.showKsiErrorWrapperIfNeeded();
    return null;
  }

  async sign(pdfBytes) {
    const pdfSigner = new KsiPdfSigner(this.ksiService, this.ksiErrorManager, this.ksiConfiguration);
    const res = await pdfSigner.sign(pdfBytes);
    await this.ksiErrorManager.showKsiErrorWrapperIfNeeded();
    return res;
  }

  initServiceAndPolicy() {
    const {
      ksiAggregatorUrlValue,
      ksiExtenderUrlValue,
      ksiLoginIdValue,
      ksiLoginKeyValue,
      ksiPubFileValue
    } = this.ksiConfiguration.configuration;

    this.ksiService = new KsiService(
      new SigningService(
        new SigningServiceProtocol(ksiAggregatorUrlValue),
        new ServiceCredentials(ksiLoginIdValue, Utf8Converter.ToBytes(ksiLoginKeyValue))
      ),
      new ExtendingService(
        new ExtendingServiceProtocol(ksiExtenderUrlValue),
        new ServiceCredentials(ksiLoginIdValue, Utf8Converter.ToBytes(ksiLoginKeyValue))
      ),
      new PublicationsFileService(new PublicationsFileServiceProtocol(ksiPubFileValue), new PublicationsFileFactory())
    );
    this.createPolicy();
  }

  createPolicy() {
    let policy = null;
    const {
      keyBasedVerificationValue,
      calendarBasedVerificationValue,
      publicationBasedVerificationValue,
      userPublicationBasedVerificationValue
    } = this.ksiConfiguration.configuration;
    if (calendarBasedVerificationValue) {
      policy = new CalendarBasedVerificationPolicy();
    }
    if (keyBasedVerificationValue) {
      policy = new KeyBasedVerificationPolicy(
        !publicationBasedVerificationValue && !userPublicationBasedVerificationValue
      ).onNa(policy);
    }
    if (publicationBasedVerificationValue) {
      policy = new PublicationsFileVerificationPolicy().onNa(policy);
    }
    if (userPublicationBasedVerificationValue) {
      policy = new UserProvidedPublicationBasedVerificationPolicy().onNa(policy);
    }

    if (publicationBasedVerificationValue || userPublicationBasedVerificationValue) {
      policy = new InternalVerificationPolicy().onSuccess(policy);
    }

    this.policy = new VerificationPolicy(policy);
  }

  async downloadPublicationsFile(forceDownload) {
    if (forceDownload || this.publicationsFile === null) {
      try {
        this.publicationsFile = await this.ksiService.getPublicationsFile();
      } catch (e) {
        const message = await PDFViewerApplication.l10n.get(
          'ksi_error_publication_download',
          null,
          'Cannot download publication file. Check Publication File URL in KSI Configuration.'
        );
        this.ksiErrorManager.addError({ message, type: 'ERROR', operation: 'DOCUMENT' });
      }
    }
  }

  static getSignatureFromAnnotation(annotation) {
    const stream = getTlvInputStream(annotation);
    return getKsiSignature(stream);
  }

  static updateSignatureInFile(signatureBytes, annotation, pdfBytes) {
    pdfBytes.set(signatureBytes, annotation.byteRange[1]);
    pdfBytes.fill(32, annotation.byteRange[1] + signatureBytes.length, annotation.byteRange[2]);

    return pdfBytes;
  }
}
