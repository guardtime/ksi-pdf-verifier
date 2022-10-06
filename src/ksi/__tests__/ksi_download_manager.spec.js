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
import { EventBus } from 'pdfjs-dist/lib/web/ui_utils';
import { KsiDownloadManager } from '../ksi_download_manager';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';

const container = document.createElement('div');
container.setAttribute('hidden', true);
const config = {
  container,
  label: document.createElement('label'),
  button: document.createElement('button')
};

const eventbus = {
  dispatch: jest.fn(),
  on: jest.fn()
};

PDFViewerApplication.l10n = {
  get: jest.fn()
};

when(PDFViewerApplication.l10n.get)
  .calledWith('document_signed', null, 'Signed')
  .mockResolvedValue('Signed');

when(PDFViewerApplication.l10n.get)
  .calledWith('document_extended', null, 'Extended')
  .mockResolvedValue('Extended');

when(PDFViewerApplication.l10n.get)
  .calledWith('document_ready_to_download', null, 'document is ready to be downloaded!')
  .mockResolvedValue('document is ready to be downloaded!');

describe('KsiDownloadManager', () => {
  describe('showWrapper', () => {
    const ksiDownloadManager = new KsiDownloadManager(config, eventbus);
    test('download signed file', async () => {
      when(PDFViewerApplication.l10n.get)
        .calledWith('document_signed', null, 'Signed')
        .mockResolvedValue('Signed');

      when(PDFViewerApplication.l10n.get)
        .calledWith('document_ready_to_download', null, 'document is ready to be downloaded!')
        .mockResolvedValue('document is ready to be downloaded!');

      await ksiDownloadManager.showWrapper('SIGNING');

      expect(config.label.innerHTML).toEqual('Signed document is ready to be downloaded!');
      expect(config.container.hasAttribute('hidden')).toEqual(false);
    });

    test('download extended file', async () => {
      when(PDFViewerApplication.l10n.get)
        .calledWith('document_extended', null, 'Extended')
        .mockResolvedValue('Extended');

      when(PDFViewerApplication.l10n.get)
        .calledWith('document_ready_to_download', null, 'document is ready to be downloaded!')
        .mockResolvedValue('document is ready to be downloaded!');

      await ksiDownloadManager.showWrapper('EXTENDING');
      expect(config.label.innerHTML).toEqual('Extended document is ready to be downloaded!');
      expect(config.container.hasAttribute('hidden')).toEqual(false);
    });
  });

  describe('hideWrapper', () => {
    const eventBus = new EventBus();
    const ksiDownloadManager = new KsiDownloadManager(config, eventBus);
    test('hideWrapper', () => {
      config.container.removeAttribute('hidden');
      ksiDownloadManager.hideWrapper();

      expect(config.container.hasAttribute('hidden')).toEqual(true);
    });

    test('hideWrapper on 2nd document loaded event', () => {
      when(PDFViewerApplication.l10n.get)
        .calledWith('document_ready_to_download', null, 'document is ready to be downloaded!')
        .mockResolvedValue('document is ready to be downloaded!');

      ksiDownloadManager.showWrapper('');

      eventBus.dispatch('documentloaded');
      eventBus.dispatch('documentloaded');

      expect(config.container.hasAttribute('hidden')).toEqual(true);
    });
  });

  describe('bindEvent', () => {
    const ksiDownloadManager = new KsiDownloadManager(config, eventbus);
    test('bindEvent', () => {
      ksiDownloadManager.bindEvent(eventbus);
      config.button.click();
      expect(eventbus.dispatch).toHaveBeenCalled();
      expect(eventbus.on).toHaveBeenCalled();
    });
  });
});
