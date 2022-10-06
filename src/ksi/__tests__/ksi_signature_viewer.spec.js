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
import { DefaultConfiguration } from '../ksi_default_configuration';
import { getAggregationTimeString } from '../ksi_time_util';
import { KsiJsPdfTools } from '../ksipdftool/ksi_js_pdf_tools';
import { KsiSidebarButtons } from '../ksi_sidebar_buttons';
import { KSISignatureViewer } from '../ksi_signature_viewer';
import { PDF_BYTES } from './test-util/common_test_data';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';

jest.mock('../ksipdftool/ksi_js_api_util', () => {
  return {
    getTlvInputStream: jest.fn(),
    getKsiSignature: jest.fn()
  };
});

jest.mock('../ksi_time_util', () => {
  return {
    getAggregationTimeString: jest.fn()
  };
});

const BYTES = Uint8Array.from([1, 2, 3, 4]);
const PDF_DOCUMENT = jest.fn();
const VERIFIER = jest.fn();

PDFViewerApplication.ksiErrorManager = {
  addError: jest.fn(),
  clearErrorsAndHideKsiErrorWrapper: jest.fn(),
  showKsiErrorWrapperIfNeeded: jest.fn()
};

PDFViewerApplication.ksiDownloadManager = {
  showWrapper: jest.fn()
};

PDFViewerApplication.l10n = {
  get: jest.fn()
};

describe('KSISignatureViewer', () => {
  const container = { appendChild: jest.fn() };
  const open = jest.fn();

  describe('constructor', () => {
    test('constructs a valid KSISignatureViewer object', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      expect(ksiSignatureViewer.container).toEqual(container);
      expect(ksiSignatureViewer.open).toEqual(open);
      expect(ksiSignatureViewer.isWholeDocumentSigned).toEqual(false);
      expect(ksiSignatureViewer.pdfBytes).toBeNull();
      expect(ksiSignatureViewer.pdfDocument).toBeNull();
      expect(ksiSignatureViewer.pdfTools).toEqual(expect.any(KsiJsPdfTools));
      expect(ksiSignatureViewer.signatureAnnotations).toEqual([]);
      expect(ksiSignatureViewer.ksiSidebarButtons).toEqual(expect.any(KsiSidebarButtons));
    });
  });

  describe('reInitializeServiceAndPolicyAndReRender', () => {
    test('re-initializes service/policy, downloads pubFile, clears container and re-renders contents', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      ksiSignatureViewer.pdfTools.init = jest.fn();
      ksiSignatureViewer.reset = jest.fn();
      ksiSignatureViewer.render = jest.fn();

      await ksiSignatureViewer.reInitializeServiceAndPolicyAndReRender();

      expect(ksiSignatureViewer.pdfTools.init).toHaveBeenCalled();
      expect(ksiSignatureViewer.reset).toHaveBeenCalled();
      expect(ksiSignatureViewer.render).toHaveBeenCalledWith(
        ksiSignatureViewer.signatureAnnotations,
        ksiSignatureViewer.pdfDocument
      );
    });
  });

  describe('reset', () => {
    test('clears contents of container div', () => {
      const container = document.createElement('div');
      const containerChildOne = document.createElement('div');
      const containerChildTwo = document.createElement('div');
      const containerChildTwoChildOne = document.createElement('div');
      const containerChildTwoChildTwo = document.createElement('div');
      container.appendChild(containerChildOne);
      container.appendChild(containerChildTwo);
      containerChildTwo.appendChild(containerChildTwoChildOne);
      containerChildTwo.appendChild(containerChildTwoChildTwo);

      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      ksiSignatureViewer.reset();

      expect(ksiSignatureViewer.container.hasChildNodes()).toEqual(false);
    });
  });

  describe('render', () => {
    test('opens warning if needed, resets error manager, validates signature and creates content', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const annotations = jest.fn();
      const pdfDocument = {
        getData: jest.fn(() => {
          return Promise.resolve(PDF_BYTES);
        })
      };
      PDFViewerApplication.ksiWarning = { openIfConfigurationIsInvalid: jest.fn() };
      ksiSignatureViewer.ksiSidebarButtons.createButtons = jest.fn();
      ksiSignatureViewer.getKSISignatureAnnotations = jest.fn();
      when(ksiSignatureViewer.getKSISignatureAnnotations)
        .calledWith(annotations)
        .mockReturnValue([ANNOTATION]);
      when(ksiSignatureViewer.ksiSidebarButtons.createButtons)
        .calledWith([ANNOTATION])
        .mockResolvedValue();
      ksiSignatureViewer.validateSignaturesAndCreateDivs = jest.fn(() => {
        return Promise.resolve();
      });

      ksiSignatureViewer.pdfTools.init = jest.fn();

      await ksiSignatureViewer.render(annotations, pdfDocument);

      expect(PDFViewerApplication.ksiWarning.openIfConfigurationIsInvalid).toHaveBeenCalled();
      expect(PDFViewerApplication.ksiErrorManager.clearErrorsAndHideKsiErrorWrapper).toHaveBeenCalled();
      expect(ksiSignatureViewer.pdfBytes).toEqual(PDF_BYTES);
      expect(ksiSignatureViewer.pdfDocument).toEqual(pdfDocument);
      expect(ksiSignatureViewer.signatureAnnotations).toEqual([ANNOTATION]);
      expect(ksiSignatureViewer.isWholeDocumentSigned).toEqual(false);
      expect(ksiSignatureViewer.validateSignaturesAndCreateDivs).toHaveBeenCalled();
      expect(PDFViewerApplication.ksiErrorManager.showKsiErrorWrapperIfNeeded).toHaveBeenCalled();
    });

    test('render called multiple times but first one will be cancelled', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const annotations = jest.fn();
      let callCount = 0;
      const pdfDocument = {
        getData: jest.fn(() => {
          callCount++;
          if (callCount === 1) {
            return new Promise((resolve, reject) => {
              setTimeout(() => resolve(PDF_BYTES), 2000);
            });
          }
          return Promise.resolve(PDF_BYTES);
        })
      };
      PDFViewerApplication.ksiWarning = { openIfConfigurationIsInvalid: jest.fn() };
      ksiSignatureViewer.ksiSidebarButtons.createButtons = jest.fn();
      ksiSignatureViewer.getKSISignatureAnnotations = jest.fn();
      when(ksiSignatureViewer.getKSISignatureAnnotations)
        .calledWith(annotations)
        .mockReturnValue([ANNOTATION]);
      when(ksiSignatureViewer.ksiSidebarButtons.createButtons)
        .calledWith([ANNOTATION])
        .mockResolvedValue();
      ksiSignatureViewer.validateSignaturesAndCreateDivs = jest.fn(() => {
        return Promise.resolve();
      });

      ksiSignatureViewer.pdfTools.init = jest.fn();

      ksiSignatureViewer.render(annotations, pdfDocument);
      await ksiSignatureViewer.render(annotations, pdfDocument);

      expect(PDFViewerApplication.ksiWarning.openIfConfigurationIsInvalid).toHaveBeenCalled();
      expect(PDFViewerApplication.ksiErrorManager.clearErrorsAndHideKsiErrorWrapper).toHaveBeenCalled();
      expect(ksiSignatureViewer.pdfBytes).toEqual(PDF_BYTES);
      expect(ksiSignatureViewer.pdfDocument).toEqual(pdfDocument);
      expect(ksiSignatureViewer.signatureAnnotations).toEqual([ANNOTATION]);
      expect(ksiSignatureViewer.isWholeDocumentSigned).toEqual(false);
      expect(ksiSignatureViewer.validateSignaturesAndCreateDivs).toHaveBeenCalled();
      expect(PDFViewerApplication.ksiErrorManager.showKsiErrorWrapperIfNeeded).toHaveBeenCalled();
    });
  });

  describe('getKSISignatureAnnotations', () => {
    test('return annotations with fieldType KSI', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const annotations = [{ fieldType: 'KSI' }, { fieldType: 'KSI' }, { fieldType: 'NON-KSI' }];

      expect(ksiSignatureViewer.getKSISignatureAnnotations(annotations)).toEqual([
        { fieldType: 'KSI' },
        { fieldType: 'KSI' }
      ]);
    });
  });

  describe('validateSignaturesAndCreateDivs', () => {
    test('validates signatures, creates divs and appends them to DOM', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const bytes = PDF_BYTES.subarray(0, ANNOTATION.byteRange[2] + ANNOTATION.byteRange[3]);
      const verificationResult = jest.fn();
      const signatureIndex = 1;

      ksiSignatureViewer.signatureAnnotations = [ANNOTATION];
      ksiSignatureViewer.pdfBytes = PDF_BYTES;
      ksiSignatureViewer.pdfDocument = PDF_DOCUMENT;
      ksiSignatureViewer.getVerificationResult = jest.fn();
      ksiSignatureViewer.addWarningIfVerificationInconclusive = jest.fn();
      ksiSignatureViewer.validateIsWholeDocumentSigned = jest.fn();
      ksiSignatureViewer.appendSignatureDivsToContainer = jest.fn();
      ksiSignatureViewer.appendWholeDocumentIsNotSignedDivIfNeeded = jest.fn();
      ksiSignatureViewer.validate = jest.fn();
      when(ksiSignatureViewer.validate)
        .calledWith(ANNOTATION, 1)
        .mockReturnValue(verificationResult);

      await ksiSignatureViewer.validateSignaturesAndCreateDivs();

      expect(ksiSignatureViewer.validateIsWholeDocumentSigned).toHaveBeenCalledWith(bytes);
      expect(ksiSignatureViewer.appendSignatureDivsToContainer).toHaveBeenCalledWith(
        bytes,
        ksiSignatureViewer.pdfDocument,
        verificationResult,
        true,
        signatureIndex
      );
      expect(ksiSignatureViewer.appendWholeDocumentIsNotSignedDivIfNeeded).toHaveBeenCalledWith(
        ksiSignatureViewer.pdfDocument
      );
      expect(ksiSignatureViewer.addWarningIfVerificationInconclusive).toHaveBeenCalled();
    });
  });

  describe('validateIsWholeDocumentSigned', () => {
    test('sets ksiSignatureViewer.isWholeDocumentSigned to true if pdfBytes.length === bytes.length', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      ksiSignatureViewer.pdfBytes = Uint8Array.from([1, 2, 3, 4]);

      ksiSignatureViewer.validateIsWholeDocumentSigned(BYTES);

      expect(ksiSignatureViewer.isWholeDocumentSigned).toEqual(true);
    });

    test('does nothing if pdfBytes.length !== bytes.length', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      ksiSignatureViewer.pdfBytes = Uint8Array.from([1, 2, 3, 4, 5, 6, 7]);

      ksiSignatureViewer.validateIsWholeDocumentSigned(BYTES);

      expect(ksiSignatureViewer.isWholeDocumentSigned).toEqual(false);
    });
  });

  describe('appendWholeDocumentIsNotSignedDivIfNeeded', () => {
    test('appends whole document is not signed if ksiSignatureViewer.isWholeDocumentSigned is false', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      ksiSignatureViewer.signatureBlocks = document.createElement('div');
      ksiSignatureViewer.signatureBlocks.appendChild = jest.fn();

      const message = 'Document is not signed! Last version of this document is not signed.';
      const sigDiv = document.createElement('div');
      sigDiv.classList.add('ksiSignature', 'ksiSignature--latest', 'ksiSignature--unsigned', 'active');
      const header = document.createElement('header');
      const h4 = document.createElement('h4');
      const signerId = document.createElement('h5');
      h4.textContent = 'Unsigned';
      const p = document.createElement('p');
      p.textContent = 'Latest Version';
      header.appendChild(h4);
      header.appendChild(signerId);
      header.appendChild(p);
      sigDiv.appendChild(header);
      const footer = document.createElement('footer');
      const button = document.createElement('button');
      button.classList.add('ksiButton', 'ksiButton--main');
      button.textContent = 'Sign this version';
      footer.appendChild(button);
      sigDiv.appendChild(footer);

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_document_not_signed', null, message)
        .mockResolvedValue(message);

      await ksiSignatureViewer.appendWholeDocumentIsNotSignedDivIfNeeded(PDF_DOCUMENT);

      expect(PDFViewerApplication.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        type: 'WARNING',
        operation: 'DOCUMENT'
      });
      expect(ksiSignatureViewer.signatureBlocks.appendChild).toHaveBeenCalledWith(sigDiv);
    });

    test('does nothing if ksiSignatureViewer.isWholeDocumentSigned is true', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      ksiSignatureViewer.signatureBlocks = document.createElement('div');
      ksiSignatureViewer.signatureBlocks.appendChild = jest.fn();
      ksiSignatureViewer.isWholeDocumentSigned = true;

      await ksiSignatureViewer.appendWholeDocumentIsNotSignedDivIfNeeded(PDF_DOCUMENT);

      expect(PDFViewerApplication.l10n.get).not.toHaveBeenCalled();
      expect(PDFViewerApplication.ksiErrorManager.addError).not.toHaveBeenCalled();
      expect(ksiSignatureViewer.signatureBlocks.appendChild).not.toHaveBeenCalled();
    });
  });

  describe('addSignatureDivEventListener', () => {
    test('adds signature div event listener', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const signatureDiv = { addEventListener: jest.fn() };

      ksiSignatureViewer.addSignatureDivEventListener(signatureDiv, PDF_DOCUMENT);

      expect(signatureDiv.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('test the event listener', () => {
      PDFViewerApplication.KSI = { isSidebarRenderNeeded: null };
      const cont = document.createElement('div');
      const testElem = document.createElement('div');
      testElem.classList.add('ksiSignature', 'active');
      cont.appendChild(testElem);
      const ksiSignatureViewer = new KSISignatureViewer(cont, open);

      const signatureDiv = document.createElement('div');

      ksiSignatureViewer.addSignatureDivEventListener(signatureDiv, BYTES);
      signatureDiv.click();

      expect(ksiSignatureViewer.open).toHaveBeenCalledWith(BYTES);
      expect(testElem.classList.contains('active')).toEqual(false);
      expect(signatureDiv.classList.contains('active')).toEqual(true);
    });
  });

  describe('addWarningIfVerificationInconclusive', () => {
    test('adds warning message if verificationResult.status === INCONCLUSIVE', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const message = 'Verification result is inconclusive! Check KSI Configurations and try again.';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_inconclusive', null, message)
        .mockResolvedValue(message);

      const result = {
        status: 'INCONCLUSIVE',
        signerId: 'GT::GT::GT::Anon',
        aggregationTime: '123'
      };

      await ksiSignatureViewer.addWarningIfVerificationInconclusive(result, 1);
      expect(PDFViewerApplication.ksiErrorManager.addError).toHaveBeenCalledWith({
        message,
        type: 'WARNING',
        signatureIndex: 1,
        aggregationTime: '123',
        operation: 'SIGNATURE'
      });
    });

    test('does not add warning message if verificationResult.status !== INCONCLUSIVE', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const result = {
        status: 'INVALID',
        signerId: 'GT::GT::GT::Anon',
        aggregationTime: '123'
      };

      ksiSignatureViewer.addWarningIfVerificationInconclusive(result, 1);
      expect(PDFViewerApplication.ksiErrorManager.addError).not.toHaveBeenCalled();
    });
  });

  describe('constructName', () => {
    test('returns extended file name', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      expect(ksiSignatureViewer.constructName('test.pdf', '-extended')).toEqual('test-extended.pdf');
    });

    test('returns signed file name', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      expect(ksiSignatureViewer.constructName('test.pdf', '-signed')).toEqual('test-signed.pdf');
    });
  });

  describe('updatePdfInViewer', () => {
    test('opens pdf, sets title, enables download buttons', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);

      const pdf = new Uint8Array([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
      const extension = '-extended';
      const extendedTitle = 'signed-extended.pdf';

      document.title = 'signed.pdf';
      ksiSignatureViewer.constructName = jest.fn();
      PDFViewerApplication.open = jest.fn();
      PDFViewerApplication.setTitleUsingUrl = jest.fn();
      PDFViewerApplication.appConfig = {
        toolbar: {
          download: {
            removeAttribute: jest.fn()
          }
        },
        secondaryToolbar: {
          downloadButton: {
            removeAttribute: jest.fn()
          }
        }
      };

      when(ksiSignatureViewer.constructName)
        .calledWith(document.title, extension)
        .mockReturnValue(extendedTitle);

      await ksiSignatureViewer.updatePdfInViewer(pdf, extension);

      expect(PDFViewerApplication.open).toHaveBeenCalledWith(pdf);
      expect(PDFViewerApplication.setTitleUsingUrl).toHaveBeenCalledWith(extendedTitle);
      expect(PDFViewerApplication.appConfig.toolbar.download.removeAttribute).toHaveBeenCalledWith('hidden');
      expect(PDFViewerApplication.appConfig.secondaryToolbar.downloadButton.removeAttribute).toHaveBeenCalledWith(
        'hidden'
      );
    });
  });

  describe('extend', () => {
    const ksiSignatureViewer = new KSISignatureViewer(container, open);

    ksiSignatureViewer.signatureAnnotations = [ANNOTATION];
    ksiSignatureViewer.pdfBytes = PDF_BYTES;
    ksiSignatureViewer.ksiSidebarButtons.toggleExtendButtonDisabled = jest.fn();
    ksiSignatureViewer.pdfTools.extend = jest.fn();
    ksiSignatureViewer.updatePdfInViewer = jest.fn();
    ksiSignatureViewer.showDownloadWrapper = jest.fn();

    test('disables button, extends signature, updates pdf in viewer, shows download bar, enables button', async () => {
      const extendedPdfBytes = Uint8Array.from([37, 80, 68, 70, 45, 49, 46, 11, 22, 33]);

      when(ksiSignatureViewer.pdfTools.extend)
        .calledWith(ANNOTATION, PDF_BYTES)
        .mockReturnValue(extendedPdfBytes);

      await ksiSignatureViewer.extend();

      expect(ksiSignatureViewer.ksiSidebarButtons.toggleExtendButtonDisabled).toHaveBeenCalledWith(true);
      expect(ksiSignatureViewer.ksiSidebarButtons.toggleExtendButtonDisabled).toHaveBeenCalledWith(false);
      expect(ksiSignatureViewer.updatePdfInViewer).toHaveBeenCalledWith(extendedPdfBytes, '-extended');
      expect(ksiSignatureViewer.showDownloadWrapper).toHaveBeenCalledWith('EXTENDING');
    });

    test('disables button, fails extending, enables button', async () => {
      when(ksiSignatureViewer.pdfTools.extend)
        .calledWith(ANNOTATION, PDF_BYTES)
        .mockReturnValue(null);

      await ksiSignatureViewer.extend();

      expect(ksiSignatureViewer.ksiSidebarButtons.toggleExtendButtonDisabled).toHaveBeenCalledWith(true);
      expect(ksiSignatureViewer.ksiSidebarButtons.toggleExtendButtonDisabled).toHaveBeenCalledWith(false);
      expect(ksiSignatureViewer.updatePdfInViewer).not.toHaveBeenCalled();
      expect(ksiSignatureViewer.showDownloadWrapper).not.toHaveBeenCalled();
    });
  });

  describe('sign', () => {
    const ksiSignatureViewer = new KSISignatureViewer(container, open);
    ksiSignatureViewer.pdfBytes = PDF_BYTES;
    ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled = jest.fn();
    ksiSignatureViewer.pdfTools.sign = jest.fn();
    ksiSignatureViewer.updatePdfInViewer = jest.fn();
    ksiSignatureViewer.showDownloadWrapper = jest.fn();

    test('disables button, signs document, updates pdf in viewer, shows download bar, enables button', async () => {
      const signedPdfBytes = Uint8Array.from([37, 80, 68, 70, 45, 49, 46, 55, 13, 10, 37, 88, 99, 44]);

      when(ksiSignatureViewer.pdfTools.sign)
        .calledWith(PDF_BYTES)
        .mockReturnValue(signedPdfBytes);

      await ksiSignatureViewer.sign();

      expect(ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled).toHaveBeenCalledWith(true);
      expect(ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled).toHaveBeenCalledWith(false);
      expect(ksiSignatureViewer.updatePdfInViewer).toHaveBeenCalledWith(signedPdfBytes, '-signed');
      expect(ksiSignatureViewer.showDownloadWrapper).toHaveBeenCalledWith('SIGNING');
    });

    test('disables button, fails signing, enables button', async () => {
      when(ksiSignatureViewer.pdfTools.sign)
        .calledWith(PDF_BYTES)
        .mockReturnValue(null);

      await ksiSignatureViewer.sign();

      expect(ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled).toHaveBeenCalledWith(true);
      expect(ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled).toHaveBeenCalledWith(false);
      expect(ksiSignatureViewer.updatePdfInViewer).not.toHaveBeenCalled();
      expect(ksiSignatureViewer.showDownloadWrapper).not.toHaveBeenCalled();
    });
  });

  describe('showDownloadWrapper', () => {
    const ksiSignatureViewer = new KSISignatureViewer(container, open);
    test('showDownloadWrapper', async () => {
      PDFViewerApplication.ksiDownloadManager.showWrapper = jest.fn();

      await ksiSignatureViewer.showDownloadWrapper('SIGNING');
      expect(PDFViewerApplication.ksiDownloadManager.showWrapper).toHaveBeenCalledWith('SIGNING');
    });
  });

  describe('validate', () => {
    const ksiSignatureViewer = new KSISignatureViewer(container, open);
    ksiSignatureViewer.pdfBytes = PDF_BYTES;
    ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled = jest.fn();
    ksiSignatureViewer.pdfTools.verify = jest.fn();
    ksiSignatureViewer.updatePdfInViewer = jest.fn();
    ksiSignatureViewer.showDownloadWrapper = jest.fn();

    test('validate', async () => {
      const annotation = jest.fn();
      const signature = jest.fn();
      await ksiSignatureViewer.validate(annotation, signature);
      expect(ksiSignatureViewer.pdfTools.verify).toHaveBeenCalledWith(annotation, signature, PDF_BYTES);
    });
  });

  describe('createSignatureDiv', () => {
    test('createSignatureDiv 1', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      ksiSignatureViewer.signatureBlocks = document.createElement('div');
      ksiSignatureViewer.signatureBlocks.appendChild = jest.fn();

      ksiSignatureViewer.addSignatureDivEventListener = jest.fn();
      ksiSignatureViewer.createSignatureDivContent = jest.fn();
      ksiSignatureViewer.createSignatureElements = jest.fn();

      const sigElems = {
        signatureDiv: jest.fn()
      };

      ksiSignatureViewer.createSignatureElements.mockReturnValue(sigElems);

      await ksiSignatureViewer.createSignatureDiv(BYTES, PDF_DOCUMENT, VERIFIER, true, 1);

      expect(ksiSignatureViewer.createSignatureElements).toHaveBeenCalled();
      expect(ksiSignatureViewer.createSignatureDivContent).toHaveBeenCalledWith(sigElems, VERIFIER, true);
      expect(ksiSignatureViewer.addSignatureDivEventListener).toHaveBeenCalledWith(sigElems.signatureDiv, BYTES);
    });

    test('createSignatureDiv 2', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      ksiSignatureViewer.signatureBlocks = document.createElement('div');
      ksiSignatureViewer.signatureBlocks.appendChild = jest.fn();

      ksiSignatureViewer.addSignatureDivEventListener = jest.fn();
      ksiSignatureViewer.createSignatureDivContent = jest.fn();
      ksiSignatureViewer.createSignatureElements = jest.fn();
      ksiSignatureViewer.openVersion = jest.fn();

      const sigElems = {
        signatureDiv: jest.fn()
      };
      const pdfDoc = jest.fn();

      ksiSignatureViewer.createSignatureElements.mockReturnValue(sigElems);
      when(ksiSignatureViewer.openVersion)
        .calledWith(BYTES)
        .mockReturnValue(pdfDoc);

      await ksiSignatureViewer.createSignatureDiv(BYTES, PDF_DOCUMENT, VERIFIER, false, 1);

      expect(ksiSignatureViewer.createSignatureElements).toHaveBeenCalled();
      expect(ksiSignatureViewer.createSignatureDivContent).toHaveBeenCalledWith(sigElems, VERIFIER, false);
      expect(ksiSignatureViewer.addSignatureDivEventListener).toHaveBeenCalledWith(sigElems.signatureDiv, BYTES);
    });
  });

  describe('createSignatureElements', () => {
    test('createSignatureElements', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const elems = {
        signatureDiv: document.createElement('div'),
        signerId: document.createElement('h5'),
        header: document.createElement('header'),
        h4: document.createElement('h4'),
        p: document.createElement('p'),
        footer: document.createElement('footer'),
        button: document.createElement('button'),
        squareButton: document.createElement('button')
      };

      expect(ksiSignatureViewer.createSignatureElements()).toEqual(elems);
    });
  });

  describe('createSignatureDivContent', () => {
    test('createSignatureDivContent, fullDocument = true, verifier !== null', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const elems = {
        button: {
          classList: {
            add: jest.fn()
          }
        },
        squareButton: {
          classList: {
            add: jest.fn()
          }
        },
        signatureDiv: {
          classList: {
            add: jest.fn()
          }
        }
      };

      const verifier = jest.fn();

      ksiSignatureViewer.createSignedSignatureDiv = jest.fn();
      ksiSignatureViewer.setElementHiearchy = jest.fn();

      await ksiSignatureViewer.createSignatureDivContent(elems, verifier, true);

      expect(elems.button.classList.add).toHaveBeenCalledWith('ksiButton');
      expect(elems.signatureDiv.classList.add).toHaveBeenCalledWith('ksiSignature');
      expect(ksiSignatureViewer.createSignedSignatureDiv).toHaveBeenCalledWith(elems, verifier);
      expect(ksiSignatureViewer.setElementHiearchy).toHaveBeenCalledWith(elems);
      expect(elems.signatureDiv.classList.add).toHaveBeenCalledWith('active');
    });

    test('createSignatureDivContent, fullDocument = false, verifier === null', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const elems = {
        button: {
          classList: {
            add: jest.fn()
          }
        },
        squareButton: {
          classList: {
            add: jest.fn()
          }
        },
        signatureDiv: {
          classList: {
            add: jest.fn()
          }
        }
      };

      ksiSignatureViewer.createUnsignedSignatureDiv = jest.fn();
      ksiSignatureViewer.setElementHiearchy = jest.fn();

      await ksiSignatureViewer.createSignatureDivContent(elems, null, false);

      expect(elems.button.classList.add).toHaveBeenCalledWith('ksiButton');
      expect(elems.signatureDiv.classList.add).toHaveBeenCalledWith('ksiSignature');
      expect(ksiSignatureViewer.createUnsignedSignatureDiv).toHaveBeenCalledWith(elems);
      expect(ksiSignatureViewer.setElementHiearchy).toHaveBeenCalledWith(elems);
      expect(elems.signatureDiv.classList.add).not.toHaveBeenCalledWith('active');
    });
  });

  describe('createSignedSignatureDiv', () => {
    test('createSignedSignatureDiv, verifier.aggregationTime exists', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      PDFViewerApplication.eventBus = { dispatch: jest.fn() };

      const elems = {
        button: document.createElement('button'),
        p: document.createElement('p'),
        signatureDiv: '',
        h4: ''
      };
      const verifier = {
        aggregationTime: jest.fn()
      };
      const aggregationTime = 'test';

      ksiSignatureViewer.setSignatureDivHeaderAndResultClass = jest.fn();
      ksiSignatureViewer.setVerificationPolycyTag = jest.fn();
      when(getAggregationTimeString)
        .calledWith(verifier.aggregationTime)
        .mockReturnValue(aggregationTime);

      await ksiSignatureViewer.createSignedSignatureDiv(elems, verifier);

      expect(ksiSignatureViewer.setSignatureDivHeaderAndResultClass).toHaveBeenCalledWith(
        elems.signatureDiv,
        verifier,
        elems.h4
      );
      expect(elems.p.textContent).toEqual(aggregationTime);
      expect(elems.button.textContent).toEqual('Download this version');
      elems.button.click();
      expect(ksiSignatureViewer.setVerificationPolycyTag).toHaveBeenCalledWith(elems.signatureDiv, verifier);
      expect(PDFViewerApplication.eventBus.dispatch).toHaveBeenCalledWith('download', { source: self });
    });

    test('createSignedSignatureDiv, verifier.aggregationTime does not exists', async () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      PDFViewerApplication.eventBus = { dispatch: jest.fn() };

      const elems = {
        button: document.createElement('button'),
        p: document.createElement('p'),
        signatureDiv: '',
        h4: ''
      };

      const verifier = jest.fn();

      ksiSignatureViewer.setSignatureDivHeaderAndResultClass = jest.fn();
      ksiSignatureViewer.setVerificationPolycyTag = jest.fn();

      await ksiSignatureViewer.createSignedSignatureDiv(elems, verifier);

      expect(ksiSignatureViewer.setSignatureDivHeaderAndResultClass).toHaveBeenCalledWith(
        elems.signatureDiv,
        verifier,
        elems.h4
      );
      expect(elems.p.textContent).toEqual('');
      expect(elems.button.textContent).toEqual('Download this version');
      elems.button.click();
      expect(ksiSignatureViewer.setVerificationPolycyTag).toHaveBeenCalledWith(elems.signatureDiv, verifier);
      expect(PDFViewerApplication.eventBus.dispatch).toHaveBeenCalledWith('download', { source: self });
    });
  });

  describe('createUnsignedSignatureDiv', () => {
    const ksiSignatureViewer = new KSISignatureViewer(container, open);
    PDFViewerApplication.ksiSignatureViewer = ksiSignatureViewer;
    ksiSignatureViewer.sign = jest.fn();

    test('createUnsignedSignatureDiv', async () => {
      const elems = {
        signatureDiv: document.createElement('div'),
        h4: document.createElement('h4'),
        p: document.createElement('p'),
        button: document.createElement('button')
      };

      await ksiSignatureViewer.createUnsignedSignatureDiv(elems);
      elems.button.click();

      expect(elems.signatureDiv.classList.contains('ksiSignature--latest')).toEqual(true);
      expect(elems.signatureDiv.classList.contains('ksiSignature--unsigned')).toEqual(true);
      expect(elems.h4.textContent).toEqual('Unsigned');
      expect(elems.p.textContent).toEqual('Latest Version');
      expect(elems.button.classList.contains('ksiButton--main')).toEqual(true);
      expect(elems.button.textContent).toEqual('Sign this version');
      expect(ksiSignatureViewer.sign).toHaveBeenCalled();
    });

    test('no signing button when signing disabled in default config', async () => {
      const elems = {
        signatureDiv: document.createElement('div'),
        h4: document.createElement('h4'),
        p: document.createElement('p'),
        button: document.createElement('button')
      };
      jest.spyOn(DefaultConfiguration, 'DEFAULT_CONFIGURATION', 'get').mockReturnValue({
        CAN_SIGN: false
      });

      await ksiSignatureViewer.createUnsignedSignatureDiv(elems);
      elems.button.click();

      expect(elems.signatureDiv.classList.contains('ksiSignature--latest')).toEqual(true);
      expect(elems.signatureDiv.classList.contains('ksiSignature--unsigned')).toEqual(true);
      expect(elems.h4.textContent).toEqual('Unsigned');
      expect(elems.p.textContent).toEqual('Latest Version');
      expect(elems.button.classList.contains('ksiButton--main')).toEqual(false);
      expect(elems.button.textContent).toEqual('');
      expect(ksiSignatureViewer.sign).not.toHaveBeenCalled();
    });
  });

  describe('setElementHiearchy', () => {
    test('setElementHiearchy', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      ksiSignatureViewer.createSideBar();
      const elems = {
        signatureDiv: document.createElement('div'),
        signerId: document.createElement('h5'),
        header: document.createElement('header'),
        h4: document.createElement('h4'),
        p: document.createElement('p'),
        footer: document.createElement('footer'),
        button: document.createElement('button'),
        squareButton: document.createElement('button')
      };

      ksiSignatureViewer.setElementHiearchy(elems);

      expect(elems.header.contains(elems.h4)).toEqual(true);
      expect(elems.header.contains(elems.p)).toEqual(true);
      expect(elems.footer.contains(elems.button)).toEqual(true);
      expect(elems.signatureDiv.contains(elems.header)).toEqual(true);
      expect(elems.signatureDiv.contains(elems.footer)).toEqual(true);
      expect(ksiSignatureViewer.signatureBlocks.contains(elems.signatureDiv)).toEqual(true);
    });
  });

  describe('setVerificationPolycyTag', () => {
    test('setVerificationPolycyTag PublicationsFileVerificationPolicy', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const sigDiv = document.createElement('div');
      const verifier = {
        usedPolicy: 'PublicationsFileVerificationPolicy'
      };

      ksiSignatureViewer.setVerificationPolycyTag(sigDiv, verifier);
      expect(sigDiv.classList.contains('ksiSignature--pub')).toEqual(true);
    });

    test('setVerificationPolycyTag UserProvidedPublicationBasedVerificationPolicy', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const sigDiv = document.createElement('div');
      const verifier = {
        usedPolicy: 'UserProvidedPublicationBasedVerificationPolicy'
      };

      ksiSignatureViewer.setVerificationPolycyTag(sigDiv, verifier);
      expect(sigDiv.classList.contains('ksiSignature--pub')).toEqual(true);
    });

    test('setVerificationPolycyTag CalendarBasedVerificationPolicy', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const sigDiv = document.createElement('div');
      const verifier = {
        usedPolicy: 'CalendarBasedVerificationPolicy'
      };

      ksiSignatureViewer.setVerificationPolycyTag(sigDiv, verifier);
      expect(sigDiv.classList.contains('ksiSignature--cal')).toEqual(true);
    });

    test('setVerificationPolycyTag KeyBasedVerificationPolicy', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const sigDiv = document.createElement('div');
      const verifier = {
        usedPolicy: 'KeyBasedVerificationPolicy'
      };

      ksiSignatureViewer.setVerificationPolycyTag(sigDiv, verifier);
      expect(sigDiv.classList.contains('ksiSignature--key')).toEqual(true);
    });
  });

  describe('setSignatureDivHeaderAndResultClass', () => {
    test('setSignatureDivHeaderAndResultClass verified', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const signatureDiv = document.createElement('div');
      const h4 = document.createElement('h4');
      const verifier = {
        status: 'VERIFIED'
      };

      ksiSignatureViewer.setSignatureDivHeaderAndResultClass(signatureDiv, verifier, h4);

      expect(signatureDiv.classList.contains('ksiSignature--valid')).toEqual(true);
      expect(h4.textContent).toEqual('Signature valid');
    });

    test('setSignatureDivHeaderAndResultClass invalid', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const signatureDiv = document.createElement('div');
      const h4 = document.createElement('h4');
      const verifier = {
        status: 'INVALID'
      };

      ksiSignatureViewer.setSignatureDivHeaderAndResultClass(signatureDiv, verifier, h4);

      expect(signatureDiv.classList.contains('ksiSignature--invalid')).toEqual(true);
      expect(h4.textContent).toEqual('Signature invalid');
    });

    test('setSignatureDivHeaderAndResultClass inconclusive', () => {
      const ksiSignatureViewer = new KSISignatureViewer(container, open);
      const signatureDiv = document.createElement('div');
      const h4 = document.createElement('h4');
      const verifier = {
        status: 'INCONCLUSIVE'
      };

      ksiSignatureViewer.setSignatureDivHeaderAndResultClass(signatureDiv, verifier, h4);

      expect(signatureDiv.classList.contains('ksiSignature--inconclusive')).toEqual(true);
      expect(h4.textContent).toEqual('Validation inconclusive');
    });
  });

  describe('createSideBar', () => {
    test.skip('createSideBar', () => {
      const cont = document.createElement('div');
      const ksiSignatureViewer = new KSISignatureViewer(cont, open);
      const blocks = document.createElement('dvi');
      blocks.classList.add('ksiSignatures-blocks');
      const footer = document.createElement('div');
      footer.classList.add('ksiSignatures-footer');
      const button = document.createElement('button');
      button.classList.add('ksiButton', 'ksiButton--neutral');
      button.innerText = 'KSI Configuration';

      footer.appendChild(button);
      PDFViewerApplication.ksiConfiguration = {
        open: jest.fn()
      };

      ksiSignatureViewer.createSideBar();

      expect(ksiSignatureViewer.signatureBlocks).toEqual(blocks);
      expect(ksiSignatureViewer.container.outerHTML).toEqual(
        '<div><dvi class="ksiSignatures-blocks"></dvi><div class="ksiSignatures-footer"></div></div>'
      );
      ksiSignatureViewer.container.getElementsByClassName('ksiButton ksiButton--neutral')[0].click();
      expect(PDFViewerApplication.ksiConfiguration.open).toHaveBeenCalled();
    });
  });
});
