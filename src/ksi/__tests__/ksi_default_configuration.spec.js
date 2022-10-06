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
/* eslint-disable no-undef */
import { DefaultConfiguration } from '../ksi_default_configuration';

describe('DEFAULT_CONFIGURATION', () => {
  test('contains default configuration', async () => {
    const mockSuccessResponse = `{
      "AGGREGATOR_URL": "",
      "EXTENDER_URL": "",
      "PUBLICATION_FILE_URL": "",
      "PUBLICATION_STRING": "",
      "HASH_ALGORITHM": "SHA-256",
      "CAN_SIGN": true,
      "CAN_EXTEND": true,
      "READ_ONLY": false}`;
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: () => {
        return mockJsonPromise;
      }
    });

    global.fetch = jest.fn().mockImplementation(() => {
      return mockFetchPromise;
    });
    await DefaultConfiguration.loadConfig();
    expect(DefaultConfiguration.DEFAULT_CONFIGURATION).toEqual({
      AGGREGATOR_URL: '',
      EXTENDER_URL: '',
      PUBLICATION_FILE_URL: '',
      PUBLICATION_STRING: '',
      HASH_ALGORITHM: 'SHA-256',
      CAN_SIGN: true,
      CAN_EXTEND: true,
      READ_ONLY: false
    });

    global.fetch.mockClear();
    delete global.fetch;
  });

  test('READ_ONLY overrides CAN_SIGN, CAN_EXTEND config', async () => {
    const mockSuccessResponse = `{
      "AGGREGATOR_URL": "",
      "EXTENDER_URL": "",
      "PUBLICATION_FILE_URL": "",
      "PUBLICATION_STRING": "",
      "HASH_ALGORITHM": "SHA-256",
      "CAN_SIGN": true,
      "CAN_EXTEND": true,
      "READ_ONLY": true}`;
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: () => {
        return mockJsonPromise;
      }
    });

    global.fetch = jest.fn().mockImplementation(() => {
      return mockFetchPromise;
    });
    await DefaultConfiguration.loadConfig();
    expect(DefaultConfiguration.DEFAULT_CONFIGURATION).toEqual({
      AGGREGATOR_URL: '',
      EXTENDER_URL: '',
      PUBLICATION_FILE_URL: '',
      PUBLICATION_STRING: '',
      HASH_ALGORITHM: 'SHA-256',
      CAN_SIGN: false,
      CAN_EXTEND: false,
      READ_ONLY: true
    });

    global.fetch.mockClear();
    delete global.fetch;
  });
});
