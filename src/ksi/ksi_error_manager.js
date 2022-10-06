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
import { getAggregationTimeString } from './ksi_time_util';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

class KSIErrorManager {
  constructor(config) {
    this.container = config.container;
    this.errorMessage = config.errorMessage;
    this.closeButton = config.closeButton;
    this.errorMoreInfo = config.errorMoreInfo;
    this.moreInfoButton = config.moreInfoButton;
    this.lessInfoButton = config.lessInfoButton;
    this.errors = [];

    this.errorMessage.addEventListener('click', () => {
      this.errorMessage.classList.toggle('expand');
      this.errorMoreInfo.style.height = this.errorMoreInfo.scrollHeight + 'px';
    });
  }

  addError(error) {
    this.errors.push(error);
  }

  clearErrorsAndHideKsiErrorWrapper() {
    this.clearErrors();
    this.hideKsiErrorWrapper();
  }

  clearErrors() {
    this.errors = [];
  }

  async showKsiErrorWrapperIfNeeded() {
    if (this.errors.length) {
      this.container.removeAttribute('hidden');
      this.errorMessage.textContent = await this.getErrorMessage();
      this.errorMoreInfo.value = await this.getErrorMoreInfo();
    }
  }

  hideKsiErrorWrapper() {
    this.container.setAttribute('hidden', 'true');
  }

  async getErrorMessage() {
    let message = await PDFViewerApplication.l10n.get(
      'ksi_error_manager_message_heading',
      null,
      'KSI Signature tools has encountered '
    );
    let errorCount = 0;
    let warningCount = 0;
    for (const error of this.errors) {
      if (error.type === 'ERROR') {
        errorCount += 1;
      } else if (error.type === 'WARNING') {
        warningCount += 1;
      }
    }
    if (errorCount === 1) {
      message += await PDFViewerApplication.l10n.get('ksi_error_manager_message_one_error', null, '1 error');
    } else if (errorCount > 1) {
      message +=
        errorCount + ' ' + (await PDFViewerApplication.l10n.get('ksi_error_manager_message_errors', null, 'errors'));
    }
    if (errorCount > 0 && warningCount > 0) {
      message += ' ' + (await PDFViewerApplication.l10n.get('ksi_error_manager_message_and', null, 'and '));
    }
    if (warningCount === 1) {
      message += await PDFViewerApplication.l10n.get('ksi_error_manager_message_one_warning', null, '1 warning');
    } else if (warningCount > 1) {
      message +=
        warningCount +
        ' ' +
        (await PDFViewerApplication.l10n.get('ksi_error_manager_message_warnings', null, 'warnings'));
    }
    message += '.';
    return message;
  }

  async getErrorMoreInfo() {
    let moreInfo = '';
    moreInfo += await this.getSignatureErrorMoreInfo();
    moreInfo += await this.getDocumentErrorMoreInfo();
    moreInfo += await this.getExtendingErrorMoreInfo();
    moreInfo += await this.getSigningErrorMoreInfo();
    return moreInfo.substring(0, moreInfo.length - 1);
  }

  async getSignatureErrorMoreInfo() {
    let moreInfo = '';
    const signatureErrors = this.getSignatureErrors();
    let signatureCounter = this.getSmallestSignatureIndex(signatureErrors) - 1;
    for (const error of signatureErrors) {
      if (error.signatureIndex > signatureCounter) {
        moreInfo +=
          (await PDFViewerApplication.l10n.get('ksi_error_manager_info_signature', null, 'Signature ')) +
          error.signatureIndex;
        if (error.aggregationTime) {
          moreInfo += ' (' + getAggregationTimeString(error.aggregationTime) + ')';
        }
        moreInfo += ':\n';
        signatureCounter++;
      }
      moreInfo += await this.getErrorOrWarningMessage(error);
    }
    return moreInfo;
  }

  async getDocumentErrorMoreInfo() {
    let moreInfo = '';
    const documentErrors = this.getDocumentErrors();
    if (documentErrors.length) {
      moreInfo += (await PDFViewerApplication.l10n.get('ksi_error_manager_info_document', null, 'Document:')) + '\n';
      for (const error of documentErrors) {
        moreInfo += await this.getErrorOrWarningMessage(error);
      }
    }
    return moreInfo;
  }

  async getExtendingErrorMoreInfo() {
    const moreInfo = await this.getErrorMessageAndCountMap(this.getExtendingErrors());
    if (moreInfo.length > 0) {
      return (
        (await PDFViewerApplication.l10n.get('ksi_error_manager_info_extending', null, 'Extending:')) + '\n' + moreInfo
      );
    }
    return '';
  }

  async getSigningErrorMoreInfo() {
    const moreInfo = await this.getErrorMessageAndCountMap(this.getSigningErrors());
    if (moreInfo.length > 0) {
      return (
        (await PDFViewerApplication.l10n.get('ksi_error_manager_info_signing', null, 'Signing:')) + '\n' + moreInfo
      );
    }
    return '';
  }

  countErrors(errors) {
    const counts = {};
    errors.forEach(error => {
      counts[error.message] = (counts[error.message] || 0) + 1;
    });
    return counts;
  }

  async getErrorMessageAndCountMap(errors) {
    let moreInfo = '';
    const countedErrors = this.countErrors(errors);
    for (const key in countedErrors) {
      const errorCount = countedErrors[key];
      moreInfo +=
        '    ' +
        (await PDFViewerApplication.l10n.get('ksi_error_manager_info_error', null, 'ERROR:')) +
        '    ' +
        (errorCount > 1 ? '(' + errorCount + ') ' : '') +
        key +
        '\n';
    }
    return moreInfo;
  }

  getDocumentErrors() {
    return this.errors.filter(error => {
      return error.operation === 'DOCUMENT';
    });
  }

  getSignatureErrors() {
    return this.errors.filter(error => {
      return error.operation === 'SIGNATURE';
    });
  }

  getExtendingErrors() {
    return this.errors.filter(error => {
      return error.operation === 'EXTENDING';
    });
  }

  getSigningErrors() {
    return this.errors.filter(error => {
      return error.operation === 'SIGNING';
    });
  }

  getSmallestSignatureIndex(signatureErrors) {
    let smallestIndex = Number.POSITIVE_INFINITY;
    for (const signatureError of signatureErrors) {
      smallestIndex = Math.min(smallestIndex, signatureError.signatureIndex);
    }
    return smallestIndex;
  }

  async getErrorOrWarningMessage(error) {
    if (error.type === 'ERROR') {
      return (
        '    ' +
        (await PDFViewerApplication.l10n.get('ksi_error_manager_info_error', null, 'ERROR:')) +
        '    ' +
        error.message +
        '\n'
      );
    } else if (error.type === 'WARNING') {
      return (
        '    ' +
        (await PDFViewerApplication.l10n.get('ksi_error_manager_info_warning', null, 'WARNING:')) +
        '  ' +
        error.message +
        '\n'
      );
    }
    return '';
  }
}

export { KSIErrorManager };
