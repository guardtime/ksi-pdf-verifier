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
import { DefaultConfiguration } from './ksi_default_configuration';
import { getAggregationTimeString } from './ksi_time_util';
import { KsiJsPdfTools } from './ksipdftool/ksi_js_pdf_tools';
import { KsiSidebarButtons } from './ksi_sidebar_buttons';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

export class KSISignatureViewer {
  constructor(container, open) {
    this.container = container;
    this.open = open;

    this.pdfBytes = null;

    this.pdfTools = new KsiJsPdfTools(PDFViewerApplication.ksiConfiguration, PDFViewerApplication.ksiErrorManager);
    this.ksiSidebarButtons = new KsiSidebarButtons(this.container);
    this.pdfDocument = null;
    this.signatureAnnotations = [];
    this.verifications = [];
    this.isWholeDocumentSigned = false;
    this.nonce = null;
  }

  reset() {
    let child = this.container.lastElementChild;
    while (child) {
      this.container.removeChild(child);
      child = this.container.lastElementChild;
    }
  }

  async render(annotations, pdfDocument) {
    const localNonce = (this.nonce = {});

    const iter = this.renderGenerator(annotations, pdfDocument);
    let resumeValue;

    for (;;) {
      const n = iter.next(resumeValue);
      if (n.done) {
        return;
      }

      resumeValue = await n.value;
      if (localNonce !== this.nonce) {
        return;
      }
    }
  }

  *renderGenerator(annotations, pdfDocument) {
    this.createSideBar();
    PDFViewerApplication.ksiWarning.openIfConfigurationIsInvalid();
    PDFViewerApplication.ksiErrorManager.clearErrorsAndHideKsiErrorWrapper();
    yield this.pdfTools.init();
    this.pdfBytes = yield pdfDocument.getData();
    this.signatureAnnotations = this.getKSISignatureAnnotations(annotations);
    this.pdfDocument = pdfDocument;
    this.isWholeDocumentSigned = false;

    yield this.validateSignaturesAndCreateDivs();
    yield this.ksiSidebarButtons.createButtons(
      this.signatureAnnotations,
      this.verifications[0],
      this.pdfBytes,
      this.footer
    );

    yield PDFViewerApplication.ksiErrorManager.showKsiErrorWrapperIfNeeded();
  }

  async validateSignaturesAndCreateDivs() {
    this.verifications = [];
    for (const [index, annotation] of this.signatureAnnotations
      .slice()
      .reverse()
      .entries()) {
      const signatureIndex = index + 1;
      const verificationResult = await this.validate(annotation, signatureIndex);
      this.verifications.push(verificationResult);
      await this.addWarningIfVerificationInconclusive(verificationResult, signatureIndex);
      const bytes = this.pdfBytes.subarray(0, annotation.byteRange[2] + annotation.byteRange[3]);
      this.validateIsWholeDocumentSigned(bytes);

      await this.appendSignatureDivsToContainer(
        bytes,
        this.pdfDocument,
        verificationResult,
        this.pdfBytes.length === bytes.length,
        signatureIndex
      );
    }
    await this.appendWholeDocumentIsNotSignedDivIfNeeded(this.pdfDocument);
  }

  async appendSignatureDivsToContainer(bytes, pdfDocument, verificationResult, isWholeDocumentSigned, signatureIndex) {
    await this.createSignatureDiv(bytes, pdfDocument, verificationResult, isWholeDocumentSigned, signatureIndex);
  }

  async addWarningIfVerificationInconclusive(verificationResult, signatureIndex) {
    if (verificationResult.status === 'INCONCLUSIVE') {
      PDFViewerApplication.ksiErrorManager.addError({
        message: await PDFViewerApplication.l10n.get(
          'ksi_error_inconclusive',
          null,
          'Verification result is inconclusive! Check KSI Configurations and try again.'
        ),
        type: 'WARNING',
        signatureIndex,
        aggregationTime: verificationResult.aggregationTime,
        operation: 'SIGNATURE'
      });
    }
  }

  async appendWholeDocumentIsNotSignedDivIfNeeded(pdfDocument) {
    if (!this.isWholeDocumentSigned) {
      PDFViewerApplication.ksiErrorManager.addError({
        message: await PDFViewerApplication.l10n.get(
          'ksi_error_document_not_signed',
          null,
          'Document is not signed! Last version of this document is not signed.'
        ),
        type: 'WARNING',
        operation: 'DOCUMENT'
      });
      await this.createSignatureDiv(null, pdfDocument, null, true, null);
    }
  }

  createSideBar() {
    const blocks = document.createElement('dvi');
    blocks.classList.add('ksiSignatures-blocks');
    this.footer = document.createElement('div');
    this.footer.classList.add('ksiSignatures-footer');
    this.signatureBlocks = blocks;

    this.container.appendChild(blocks);
    this.container.appendChild(this.footer);
  }

  createSignatureElements() {
    return {
      signatureDiv: document.createElement('div'),
      signerId: document.createElement('h5'),
      header: document.createElement('header'),
      h4: document.createElement('h4'),
      p: document.createElement('p'),
      footer: document.createElement('footer'),
      button: document.createElement('button'),
      squareButton: document.createElement('button')
    };
  }

  async setSignatureDivHeaderAndResultClass(signatureDiv, verifier, h4) {
    if (verifier.status === 'VERIFIED') {
      signatureDiv.classList.add('ksiSignature--valid');
      h4.textContent = 'Signature valid';
    } else if (verifier.status === 'INVALID') {
      signatureDiv.classList.add('ksiSignature--invalid');
      h4.textContent = 'Signature invalid';
    } else if (verifier.status === 'INCONCLUSIVE') {
      signatureDiv.classList.add('ksiSignature--inconclusive');
      h4.textContent = 'Validation inconclusive';
    }
  }

  setVerificationPolycyTag(signatureDiv, verifier) {
    switch (verifier.usedPolicy) {
      case 'PublicationsFileVerificationPolicy':
      case 'UserProvidedPublicationBasedVerificationPolicy':
        signatureDiv.classList.add('ksiSignature--pub');
        break;
      case 'CalendarBasedVerificationPolicy':
        signatureDiv.classList.add('ksiSignature--cal');
        break;
      case 'KeyBasedVerificationPolicy':
        signatureDiv.classList.add('ksiSignature--key');
        break;
    }
  }

  async createSignedSignatureDiv(sigElements, verifier) {
    await this.setSignatureDivHeaderAndResultClass(sigElements.signatureDiv, verifier, sigElements.h4);
    if (verifier.aggregationTime) {
      sigElements.p.textContent = getAggregationTimeString(verifier.aggregationTime);
    }

    if (verifier.signerId) {
      sigElements.signerId.textContent = verifier.signerId;
    }

    sigElements.button.textContent = 'Download this version';
    sigElements.button.addEventListener('click', function() {
      PDFViewerApplication.eventBus.dispatch('download', { source: self });
    });
    this.setVerificationPolycyTag(sigElements.signatureDiv, verifier);
  }

  async createUnsignedSignatureDiv(sigElements) {
    sigElements.signatureDiv.classList.add('ksiSignature--latest', 'ksiSignature--unsigned');
    sigElements.h4.textContent = 'Unsigned';
    sigElements.p.textContent = 'Latest Version';
    if (DefaultConfiguration.DEFAULT_CONFIGURATION.CAN_SIGN) {
      sigElements.button.classList.add('ksiButton--main');
      sigElements.button.textContent = 'Sign this version';
      sigElements.button.addEventListener('click', function() {
        PDFViewerApplication.ksiSignatureViewer.sign();
      });
    }
  }

  setElementHiearchy(sigElements) {
    sigElements.header.appendChild(sigElements.h4);
    sigElements.header.appendChild(sigElements.signerId);
    sigElements.header.appendChild(sigElements.p);

    sigElements.footer.appendChild(sigElements.button);
    // TODO: add later
    // sigElements.footer.appendChild(sigElements.squareButton);

    sigElements.signatureDiv.appendChild(sigElements.header);
    sigElements.signatureDiv.appendChild(sigElements.footer);

    this.signatureBlocks.appendChild(sigElements.signatureDiv);
  }

  async createSignatureDivContent(sigElements, verifier, fullDocument) {
    sigElements.button.classList.add('ksiButton');
    // TODO: add later
    // sigElements.squareButton.classList.add('ksiButton', 'ksiButton--square');
    sigElements.signatureDiv.classList.add('ksiSignature');

    if (verifier !== null) {
      await this.createSignedSignatureDiv(sigElements, verifier);
    } else {
      await this.createUnsignedSignatureDiv(sigElements);
    }

    this.setElementHiearchy(sigElements);

    if (fullDocument) {
      sigElements.signatureDiv.classList.add('active');
    }
  }

  async createSignatureDiv(bytes, pdfDocument, verifier, fullDocument, signatureIndex) {
    const sigElements = this.createSignatureElements();
    await this.createSignatureDivContent(sigElements, verifier, fullDocument);
    this.addSignatureDivEventListener(sigElements.signatureDiv, bytes);
  }

  addSignatureDivEventListener(signatureDiv, bytes) {
    signatureDiv.addEventListener('click', event => {
      if (!event.currentTarget.classList.contains('active')) {
        PDFViewerApplication.KSI.isSidebarRenderNeeded = false;
        PDFViewerApplication.pdfLoadingTask = null;
        this.open(bytes);
        for (const element of this.container.getElementsByClassName('ksiSignature active')) {
          element.classList.remove('active');
        }
        event.currentTarget.classList.add('active');
      }
    });
  }

  async reInitializeServiceAndPolicyAndReRender() {
    await this.pdfTools.init();
    this.reset();
    await this.render(this.signatureAnnotations, this.pdfDocument);
  }

  extend = async () => {
    this.ksiSidebarButtons.toggleExtendButtonDisabled(true);
    const res = await this.pdfTools.extend(this.signatureAnnotations[0], this.pdfBytes);
    if (res) {
      await this.updatePdfInViewer(res, '-extended');
      await this.showDownloadWrapper('EXTENDING');
    }
    this.ksiSidebarButtons.toggleExtendButtonDisabled(false);
  };

  sign = async () => {
    this.ksiSidebarButtons.toggleSignButtonDisabled(true);
    const res = await this.pdfTools.sign(this.pdfBytes);
    if (res) {
      await this.updatePdfInViewer(res, '-signed');
      await this.showDownloadWrapper('SIGNING');
    }
    this.ksiSidebarButtons.toggleSignButtonDisabled(false);
  };

  async validate(annotation, signatureIndex) {
    return await this.pdfTools.verify(annotation, signatureIndex, this.pdfBytes);
  }

  getKSISignatureAnnotations(annotations) {
    return annotations.filter(annotation => {
      return annotation.fieldType === 'KSI';
    });
  }

  async updatePdfInViewer(pdfBytes, extension) {
    PDFViewerApplication.KSI.isSidebarRenderNeeded = true;
    this.reset();
    await PDFViewerApplication.open(pdfBytes);
    PDFViewerApplication.setTitleUsingUrl(this.constructName(document.title, extension));
    PDFViewerApplication.appConfig.toolbar.download.removeAttribute('hidden');
    PDFViewerApplication.appConfig.secondaryToolbar.downloadButton.removeAttribute('hidden');
  }

  async showDownloadWrapper(operation) {
    await PDFViewerApplication.ksiDownloadManager.showWrapper(operation);
  }

  constructName(filename, extension) {
    const index = filename.indexOf('.pdf');
    return filename.substring(0, index) + extension + filename.substring(index, filename.length);
  }

  validateIsWholeDocumentSigned(bytes) {
    if (this.pdfBytes.length === bytes.length) {
      this.isWholeDocumentSigned = true;
    }
  }
}
