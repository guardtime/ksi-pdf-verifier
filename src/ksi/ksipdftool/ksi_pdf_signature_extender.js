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
import { HexCoder, Utf8Converter } from '@guardtime/common';

export class KsiPdfSignatureExtender {
  constructor(ksiService) {
    this.ksiService = ksiService;
  }

  async extend(signature) {
    const extendedSignature = await this.createExtendedSignature(signature);
    if (extendedSignature) {
      return KsiPdfSignatureExtender.convertSignatureToUtf8(extendedSignature);
    }
    return null;
  }

  async createExtendedSignature(signature) {
    const pubFile = await this.ksiService.getPublicationsFile();
    const pubRecord = pubFile.getNearestPublicationRecord(signature.getAggregationTime());
    if (pubRecord) {
      const calendarHashChain = await this.ksiService.extend(
        signature.getAggregationTime(),
        pubRecord.getPublicationTime()
      );
      return signature.extend(calendarHashChain, pubRecord);
    }
    return null;
  }

  static convertSignatureToUtf8(signature) {
    return Utf8Converter.ToBytes('<' + HexCoder.encode(signature.encode()) + '>');
  }
}
