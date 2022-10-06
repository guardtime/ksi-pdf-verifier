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
import { KsiNetworkEvents } from '../ksi_network_events';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

PDFViewerApplication.ksiSignatureViewer = {
  ksiSidebarButtons: {
    toggleExtendButtonDisabled: jest.fn(),
    toggleSignButtonDisabled: jest.fn()
  }
};
describe('Ksi NetworkEvents', () => {
  describe('constructor', () => {
    test('constructor show message', () => {
      const div = document.createElement('div');
      div.setAttribute('hidden', true);
      Object.defineProperty(window.navigator, 'onLine', { get: () => false, configurable: true });
      // eslint-disable-next-line no-new
      new KsiNetworkEvents({ container: div });
      expect(div.getAttribute('hidden')).toEqual(null);
    });

    test('constructor hide message', () => {
      const div = document.createElement('div');
      div.setAttribute('hidden', true);
      Object.defineProperty(window.navigator, 'onLine', { get: () => true, configurable: true });
      // eslint-disable-next-line no-new
      new KsiNetworkEvents({ container: div });
      expect(div.getAttribute('hidden')).toEqual('true');
    });
  });

  describe('showWrapper', () => {
    test('showWrapper', () => {
      const div = document.createElement('div');
      div.setAttribute('hidden', true);
      const networkEvents = new KsiNetworkEvents({ container: div });
      networkEvents.showWrapper();
      expect(div.getAttribute('hidden')).toEqual(null);
    });
  });

  describe('hideWrapper', () => {
    test('hideWrapper', () => {
      const div = document.createElement('div');
      const networkEvents = new KsiNetworkEvents({ container: div });
      networkEvents.hideWrapper();
      expect(div.getAttribute('hidden')).toEqual('true');
    });
  });

  describe('bindEvents', () => {
    test('bindEvents', () => {
      const map = {};
      window.addEventListener = jest.fn((event, cb) => {
        map[event] = cb;
      });

      const div = document.createElement('div');
      const ksiNetworkEvents = new KsiNetworkEvents({ container: div });
      ksiNetworkEvents.hideWrapper = jest.fn();
      ksiNetworkEvents.showWrapper = jest.fn();

      map.online({});
      expect(ksiNetworkEvents.hideWrapper).toHaveBeenCalled();
      map.offline({});
      expect(ksiNetworkEvents.showWrapper).toHaveBeenCalled();
    });
  });
});
