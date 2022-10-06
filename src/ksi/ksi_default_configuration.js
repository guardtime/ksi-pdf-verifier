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
export class DefaultConfiguration {
  static get DEFAULT_CONFIGURATION() {
    return {
      AGGREGATOR_URL,
      EXTENDER_URL,
      PUBLICATION_FILE_URL,
      PUBLICATION_STRING,
      HASH_ALGORITHM,
      CAN_SIGN,
      CAN_EXTEND,
      READ_ONLY,
      SUPPORTED_HASH_ALGORITHMS
    };
  }

  static async loadConfig() {
    try {
      const response = await fetch('./static/default_configuration.json');
      const config = JSON.parse(await response.text());

      AGGREGATOR_URL = config.AGGREGATOR_URL;
      EXTENDER_URL = config.EXTENDER_URL;
      PUBLICATION_FILE_URL = config.PUBLICATION_FILE_URL;
      PUBLICATION_STRING = config.PUBLICATION_STRING;
      HASH_ALGORITHM = config.HASH_ALGORITHM;
      CAN_SIGN = config.CAN_SIGN;
      CAN_EXTEND = config.CAN_EXTEND;
      READ_ONLY = config.READ_ONLY;
      if (READ_ONLY) {
        CAN_SIGN = false;
        CAN_EXTEND = false;
      }
      SUPPORTED_HASH_ALGORITHMS = config.SUPPORTED_HASH_ALGORITHMS;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
}

let AGGREGATOR_URL = '';
let EXTENDER_URL = '';
let PUBLICATION_FILE_URL = '';
let PUBLICATION_STRING = '';
let HASH_ALGORITHM = 'SHA-256';
let CAN_SIGN = true;
let CAN_EXTEND = true;
let READ_ONLY = false;
let SUPPORTED_HASH_ALGORITHMS = [];
