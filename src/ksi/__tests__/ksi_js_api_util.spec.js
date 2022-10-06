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
import { getKsiSignature, getTlvInputStream } from '../ksipdftool/ksi_js_api_util';
import { ANNOTATION } from './test-util/annotation_test_data';

describe('getTlvInputStream', () => {
  test('returns tlvInputStream', () => {
    const stream = getTlvInputStream(ANNOTATION);

    expect(stream.getPosition()).toEqual(0);
    expect(stream.getLength()).toEqual(2034);
    expect(stream.data).toEqual(Uint8Array.from(ANNOTATION.signature));
  });
});

describe('getKsiSignature', () => {
  test('returns ksiSignature', () => {
    const signature = getKsiSignature(getTlvInputStream(ANNOTATION));

    // prettier-ignore
    const expectedValue = Uint8Array.from(
      [111, 2, 30, 239, 32, 148, 136, 55, 226, 202, 0, 7, 237, 125, 14, 214,
        128, 53, 179, 96, 61, 51, 162, 180, 236, 63, 73, 193, 35, 242, 183, 31]
    );

    expect(signature.getInputHash().value).toEqual(expectedValue);
  });
});
