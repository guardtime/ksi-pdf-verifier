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

export class KsiDownloadManager {
  constructor(config, eventbus) {
    this.container = config.container;
    this.button = config.button;
    this.label = config.label;
    this.eventBus = eventbus;
    this.open = 2;
    this.bindEvent(this.eventBus);
  }

  async showWrapper(operationType) {
    this.open = 2;
    let text = '';
    if (operationType === 'SIGNING') {
      text = await PDFViewerApplication.l10n.get('document_signed', null, 'Signed');
    }
    if (operationType === 'EXTENDING') {
      text = await PDFViewerApplication.l10n.get('document_extended', null, 'Extended');
    }

    text +=
      ' ' +
      (await PDFViewerApplication.l10n.get('document_ready_to_download', null, 'document is ready to be downloaded!'));

    this.label.innerHTML = text;
    this.container.removeAttribute('hidden');
  }

  hideWrapper() {
    this.container.setAttribute('hidden', true);
  }

  bindEvent(eventbus) {
    const self = this;
    this.button.addEventListener('click', function() {
      self.hideWrapper();
      eventbus.dispatch('download', { source: self });
    });

    eventbus.on('documentloaded', () => {
      self.open--;
      if (!self.open) {
        self.hideWrapper();
      }
    });
  }
}
