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
export const INVALID_URL = 'httpzyx://invalid.url';
export const KSI_AGGREGATOR_URL = 'https://valid-ksi-signer-url.com';
export const KSI_HASH_ALGORITHM = 'SHA-256';
export const KSI_EXTENDER_URL = 'https://valid-ksi-extender-url.com';
export const KSI_LOGIN_ID = 'username';
export const KSI_LOGIN_KEY = 'password';
export const KSI_PUB_FILE = 'https://verify.guardtime.com/ksi-publications.bin';
export const KSI_PUB_STRING = 'AAAAAA-C2BOBY-AAJM5Q-24JPVF-VKAHON-MJGKSM-53LPPH-AERQCG-IAMVMM-FTM45R-B37RV7-SB5KAX';
export const AGGREGATION_TIME = ['2019-04-05', '12:32:39.000Z'];
export const AGGREGATION_TIME_STRING = '2019-04-05 12:32:39 UTC';
export const PDF_BYTES = Uint8Array.from([37, 80, 68, 70, 45, 49, 46, 55, 13, 10, 37]);
export const VERIFICATION_RESULT = {
  status: 'VERIFIED',
  usedPolicy: 'KeyBasedVerificationPolicy',
  signerId: 'GT :: GT :: GT :: anon',
  aggregationTime: ['2019-04-05', '12:46:39.000Z']
};
export const INVALID_VERIFICATION_RESULT = {
  status: 'INVALID',
  signerId: 'GT :: GT :: GT :: anon',
  aggregationTime: ['2019-04-05', '12:36:49.000Z']
};
