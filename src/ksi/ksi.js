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
import { _switchView, KSI_SIDEBAR_TAB } from '../override/switchview_override';
import { AppOptions } from 'pdfjs-dist/lib/web/app_options';
import { DefaultConfiguration } from './ksi_default_configuration';
import { getKsiHtmlElements } from './ksi_html_elements';
import { KSIConfiguration } from './ksi_configuration';
import { KsiDownloadManager } from './ksi_download_manager';
import { KSIErrorManager } from './ksi_error_manager';
import { KsiNetworkEvents } from './ksi_network_events';
import { KSISignatureViewer } from './ksi_signature_viewer';
import { KSIWarning } from './ksi_warning';
import { PDFSidebar } from 'pdfjs-dist/lib/web/pdf_sidebar';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

class KSI {
  constructor() {
    this.isSidebarRenderNeeded = true;
    this.applyKsiToApplication();
  }

  applyKsiToApplication() {
    this.overrideAppOptions();
    this.overridePDFSidebar();
    document.addEventListener('pagesloaded', this.init);
  }

  overrideAppOptions() {
    AppOptions.set('cMapUrl', 'cmaps/');
    AppOptions.set('workerSrc', `pdf.worker.${__webpack_hash__}.js`);
    AppOptions.set('defaultUrl', '');
    AppOptions.set('disablePreferences', true);
    AppOptions.set('locale', this.getLocale());
    AppOptions.set('printResolution', 150);
    AppOptions.set('sidebarViewOnLoad', KSI_SIDEBAR_TAB);
    AppOptions.set('eventBusDispatchToDOM', true);
  }

  overridePDFSidebar() {
    PDFSidebar.prototype.ksiSignaturesButton = document.getElementById('viewKsiSignatures');
    PDFSidebar.prototype.ksiSignaturesView = document.getElementById('ksiSignaturesView');
    PDFSidebar.prototype._switchView = _switchView;
  }

  init = async () => {
    document.removeEventListener('pagesloaded', this.init);
    await this.initiateKsiComponents();
    await this.renderKsiSidebarContents();
    this.addEventListeners();
  };

  async renderKsiSidebarContents() {
    const page = await PDFViewerApplication.pdfViewer.pdfDocument.getPage(1);
    const annotations = await page.getAnnotations();
    await PDFViewerApplication.ksiSignatureViewer.render(annotations, PDFViewerApplication.pdfViewer.pdfDocument);
  }

  async initiateKsiComponents() {
    const ksiHtmlElements = getKsiHtmlElements();

    await DefaultConfiguration.loadConfig();

    PDFViewerApplication.ksiConfiguration = new KSIConfiguration(
      ksiHtmlElements.ksiConfiguration,
      PDFViewerApplication.overlayManager
    );

    PDFViewerApplication.ksiConfiguration.loadConfiguration();
    await PDFViewerApplication.ksiConfiguration.loadCredentials();

    PDFViewerApplication.ksiErrorManager = new KSIErrorManager(ksiHtmlElements.ksiErrorWrapper);

    PDFViewerApplication.ksiWarning = new KSIWarning(
      PDFViewerApplication.ksiConfiguration,
      ksiHtmlElements.ksiWarning,
      PDFViewerApplication.overlayManager
    );

    PDFViewerApplication.ksiDownloadManager = new KsiDownloadManager(
      ksiHtmlElements.ksiDownloadWrapper,
      PDFViewerApplication.eventBus
    );

    PDFViewerApplication.ksiNetworkEvents = new KsiNetworkEvents(ksiHtmlElements.ksiNetworkErrorWrapper);

    PDFViewerApplication.ksiSignatureViewer = new KSISignatureViewer(
      ksiHtmlElements.sidebar.ksiSignaturesView,
      this.openFile
    );
  }

  openFile = bytes => {
    PDFViewerApplication.open(bytes, null);
  };

  addEventListeners() {
    PDFViewerApplication.pdfSidebar.ksiSignaturesButton.addEventListener('click', this.ksiSignaturesButtonClickHandler);
    PDFViewerApplication.eventBus.on('pagesloaded', this.pagesLoadedEventHandler);
    PDFViewerApplication.eventBus.on('fileinputchange', this.fileInputChangeEventHandler);
  }

  ksiSignaturesButtonClickHandler = () => {
    PDFViewerApplication.pdfSidebar.switchView(KSI_SIDEBAR_TAB);
  };

  fileInputChangeEventHandler = () => {
    this.isSidebarRenderNeeded = true;
    PDFViewerApplication.ksiSignatureViewer.reset();
  };

  pagesLoadedEventHandler = async () => {
    if (this.isSidebarRenderNeeded) {
      await this.renderKsiSidebarContents();
    }
  };

  getLocale() {
    const navigator = this.getNavigator();
    return typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  }

  getNavigator() {
    return navigator;
  }
}

export { KSI };
