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
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

export class KsiNetworkEvents {
  constructor(config) {
    this.container = config.container;
    if (!window.navigator.onLine) {
      this.disableButtons();
      this.showWrapper();
    }
    this.bindEvent();
  }

  showWrapper() {
    this.container.removeAttribute('hidden');
  }

  hideWrapper() {
    this.container.setAttribute('hidden', true);
  }

  bindEvent() {
    window.addEventListener('online', e => {
      this.enableButtons();
      this.hideWrapper();
    });

    window.addEventListener('offline', e => {
      this.disableButtons();
      this.showWrapper();
    });
  }

  disableButtons() {
    PDFViewerApplication.ksiSignatureViewer.ksiSidebarButtons.toggleExtendButtonDisabled(true);
    PDFViewerApplication.ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled(true);
  }

  enableButtons() {
    PDFViewerApplication.ksiSignatureViewer.ksiSidebarButtons.toggleExtendButtonDisabled(false);
    PDFViewerApplication.ksiSignatureViewer.ksiSidebarButtons.toggleSignButtonDisabled(false);
  }
}
