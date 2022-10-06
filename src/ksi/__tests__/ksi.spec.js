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
import { _switchView, KSI_SIDEBAR_TAB } from '../../override/switchview_override';
import { AppOptions } from 'pdfjs-dist/lib/web/app_options';
import { DefaultConfiguration } from '../ksi_default_configuration';
import { getKsiHtmlElements } from '../ksi_html_elements';
import { KSI } from '../ksi';
import { KSIConfiguration } from '../ksi_configuration';
import { KsiDownloadManager } from '../ksi_download_manager';
import { KSIErrorManager } from '../ksi_error_manager';
import { KsiNetworkEvents } from '../ksi_network_events';
import { KSISignatureViewer } from '../ksi_signature_viewer';
import { KSIWarning } from '../ksi_warning';
import { PDF_BYTES } from './test-util/common_test_data';
import { PDFSidebar } from 'pdfjs-dist/lib/web/pdf_sidebar';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';

jest.mock('../ksi_configuration');
jest.mock('../ksi_warning');
jest.mock('../ksi_error_manager');
jest.mock('../ksi_download_manager');
jest.mock('../ksi_network_events');
jest.mock('../ksi_signature_viewer');

window.__webpack_hash__ = '9023irkdfoij0923fjd0aiksd93i20q';

describe('KSI', () => {
  describe('constructor', () => {
    test('constructs a valid KSI object', () => {
      const applyKsiToApplicationSpy = jest.spyOn(KSI.prototype, 'applyKsiToApplication').mockImplementation();

      const ksi = new KSI();

      expect(ksi.isSidebarRenderNeeded).toEqual(true);
      expect(applyKsiToApplicationSpy).toHaveBeenCalled();
    });
  });

  describe('applyKsiToApplication', () => {
    test('overrides appOptions and PDFSidebar, adds pagesloaded eventListener', () => {
      const ksi = new KSI();

      ksi.overrideAppOptions = jest.fn();
      ksi.overridePDFSidebar = jest.fn();
      document.addEventListener = jest.fn();

      ksi.applyKsiToApplication();

      expect(ksi.overrideAppOptions).toHaveBeenCalled();
      expect(ksi.overridePDFSidebar).toHaveBeenCalled();
      expect(document.addEventListener).toHaveBeenCalledWith('pagesloaded', ksi.init);
    });
  });

  describe('overrideAppOptions', () => {
    test('overrides appOptions', () => {
      const ksi = new KSI();

      ksi.getLocale = jest.fn(() => 'en-US');

      ksi.overrideAppOptions();

      expect(AppOptions.get('cMapUrl')).toEqual('cmaps/');
      expect(AppOptions.get('workerSrc')).toEqual(`pdf.worker.${__webpack_hash__}.js`);
      expect(AppOptions.get('defaultUrl')).toEqual('');
      expect(AppOptions.get('disablePreferences')).toEqual(true);
      expect(AppOptions.get('locale')).toEqual('en-US');
      expect(AppOptions.get('printResolution')).toEqual(150);
      expect(AppOptions.get('sidebarViewOnLoad')).toEqual(KSI_SIDEBAR_TAB);
      expect(AppOptions.get('eventBusDispatchToDOM')).toEqual(true);
    });
  });

  describe('overridePDFSidebar', () => {
    test('overrides PDFSidebar', () => {
      const ksi = new KSI();

      const ksiSignaturesButton = jest.fn();
      const ksiSignaturesView = jest.fn();
      document.getElementById = jest.fn();
      when(document.getElementById)
        .calledWith('viewKsiSignatures')
        .mockReturnValue(ksiSignaturesButton);
      when(document.getElementById)
        .calledWith('ksiSignaturesView')
        .mockReturnValue(ksiSignaturesView);

      ksi.overridePDFSidebar();

      expect(PDFSidebar.prototype.ksiSignaturesButton).toEqual(ksiSignaturesButton);
      expect(PDFSidebar.prototype.ksiSignaturesView).toEqual(ksiSignaturesView);
      expect(PDFSidebar.prototype._switchView).toEqual(_switchView);
    });
  });

  describe('init', () => {
    test('removes eventListener, initiates KSI components, renders KSI sidebar, adds event listeners', async () => {
      const ksi = new KSI();

      document.removeEventListener = jest.fn();
      ksi.initiateKsiComponents = jest.fn();
      ksi.renderKsiSidebarContents = jest.fn();
      ksi.addEventListeners = jest.fn();

      await ksi.init();

      expect(document.removeEventListener).toHaveBeenCalledWith('pagesloaded', ksi.init);
      expect(ksi.initiateKsiComponents).toHaveBeenCalled();
      expect(ksi.renderKsiSidebarContents).toHaveBeenCalled();
      expect(ksi.addEventListeners).toHaveBeenCalled();
    });
  });

  describe('renderKsiSidebarContents', () => {
    test('renders KSI sidebar contents', async () => {
      const ksi = new KSI();

      const annotations = jest.fn();
      const page = { getAnnotations: jest.fn(() => annotations) };
      PDFViewerApplication.pdfViewer = { pdfDocument: { getPage: jest.fn() } };
      PDFViewerApplication.ksiSignatureViewer = { render: jest.fn() };
      when(PDFViewerApplication.pdfViewer.pdfDocument.getPage)
        .calledWith(1)
        .mockReturnValue(page);

      await ksi.renderKsiSidebarContents();

      expect(PDFViewerApplication.ksiSignatureViewer.render).toHaveBeenCalledWith(
        annotations,
        PDFViewerApplication.pdfViewer.pdfDocument
      );
    });
  });

  describe('initiateKsiComponents', () => {
    test('initiates KSI components', async () => {
      const ksi = new KSI();

      const ksiHtmlElements = getKsiHtmlElements();
      PDFViewerApplication.overlayManager = jest.fn();
      PDFViewerApplication.eventBus = jest.fn();
      DefaultConfiguration.loadConfig = jest.fn();

      await ksi.initiateKsiComponents();

      expect(DefaultConfiguration.loadConfig).toHaveBeenCalled();
      expect(KSIConfiguration).toHaveBeenCalledWith(
        ksiHtmlElements.ksiConfiguration,
        PDFViewerApplication.overlayManager
      );
      expect(KSIConfiguration.prototype.loadConfiguration).toHaveBeenCalled();
      expect(KSIConfiguration.prototype.loadCredentials).toHaveBeenCalled();
      expect(KSIErrorManager).toHaveBeenCalledWith(ksiHtmlElements.ksiErrorWrapper);
      expect(KSIWarning).toHaveBeenCalledWith(
        expect.any(KSIConfiguration),
        ksiHtmlElements.ksiWarning,
        PDFViewerApplication.overlayManager
      );
      expect(KsiDownloadManager).toHaveBeenCalledWith(
        ksiHtmlElements.ksiDownloadWrapper,
        PDFViewerApplication.eventBus
      );
      expect(KsiNetworkEvents).toHaveBeenCalledWith(ksiHtmlElements.ksiNetworkErrorWrapper);
      expect(KSISignatureViewer).toHaveBeenCalledWith(ksiHtmlElements.sidebar.ksiSignaturesView, ksi.openFile);
    });
  });

  describe('openFile', () => {
    test('opens File', () => {
      const ksi = new KSI();

      PDFViewerApplication.open = jest.fn();

      ksi.openFile(PDF_BYTES);

      expect(PDFViewerApplication.open).toHaveBeenCalledWith(PDF_BYTES, null);
    });
  });

  describe('addEventListeners', () => {
    test('adds event listeners', () => {
      const ksi = new KSI();

      PDFViewerApplication.eventBus = { on: jest.fn() };
      PDFViewerApplication.pdfSidebar = { ksiSignaturesButton: { addEventListener: jest.fn() } };

      ksi.addEventListeners();

      expect(PDFViewerApplication.pdfSidebar.ksiSignaturesButton.addEventListener).toHaveBeenCalledWith(
        'click',
        ksi.ksiSignaturesButtonClickHandler
      );
      expect(PDFViewerApplication.eventBus.on).toHaveBeenCalledWith('pagesloaded', ksi.pagesLoadedEventHandler);
      expect(PDFViewerApplication.eventBus.on).toHaveBeenCalledWith('fileinputchange', ksi.fileInputChangeEventHandler);
    });
  });

  describe('ksiSignaturesButtonClickHandler', () => {
    test('switches view to KSI sidebar tab', () => {
      const ksi = new KSI();

      PDFViewerApplication.pdfSidebar = { switchView: jest.fn() };

      ksi.ksiSignaturesButtonClickHandler();

      expect(PDFViewerApplication.pdfSidebar.switchView).toHaveBeenCalledWith(KSI_SIDEBAR_TAB);
    });
  });

  describe('fileInputChangeEventHandler', () => {
    test('sets isSidebarRenderNeeded to true, resets ksiSignatureVIew', async () => {
      const ksi = new KSI();

      ksi.isSidebarRenderNeeded = false;
      ksi.renderKsiSidebarContents = jest.fn();
      PDFViewerApplication.ksiSignatureViewer = { reset: jest.fn() };

      await ksi.fileInputChangeEventHandler();

      expect(ksi.isSidebarRenderNeeded).toEqual(true);
      expect(PDFViewerApplication.ksiSignatureViewer.reset).toHaveBeenCalled();
    });
  });

  describe('pagesLoadedEventHandler', () => {
    const ksi = new KSI();
    ksi.renderKsiSidebarContents = jest.fn();

    test('renders KSI sidebar contents if isSidebarRenderNeeded is true', async () => {
      ksi.isSidebarRenderNeeded = true;
      ksi.renderKsiSidebarContents = jest.fn();

      await ksi.pagesLoadedEventHandler();

      expect(ksi.renderKsiSidebarContents).toHaveBeenCalled();
    });

    test('does not render KSI sidebar contents if isSidebarRenderNeeded is false', async () => {
      ksi.isSidebarRenderNeeded = false;

      await ksi.pagesLoadedEventHandler();

      expect(ksi.renderKsiSidebarContents).not.toHaveBeenCalled();
    });
  });

  describe('getLocale', () => {
    const ksi = new KSI();
    ksi.getNavigator = jest.fn();

    test('returns navigator.language if navigator is defined', () => {
      when(ksi.getNavigator)
        .calledWith()
        .mockReturnValue({ language: 'et' });
      expect(ksi.getLocale()).toEqual('et');
    });

    test('returns en-US.language if navigator is not defined', () => {
      when(ksi.getNavigator)
        .calledWith()
        .mockReturnValue(undefined);
      expect(ksi.getLocale()).toEqual('en-US');
    });
  });

  describe('getNavigator', () => {
    test('returns navigator', () => {
      const ksi = new KSI();
      expect(ksi.getNavigator()).toEqual(navigator);
    });
  });
});
