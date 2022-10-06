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
import { isWebUri } from 'valid-url';

export function isAtLeastOneValidationMethodChecked(inputs) {
  const {
    userPublicationBasedVerificationValue,
    publicationBasedVerificationValue,
    calendarBasedVerificationValue,
    keyBasedVerificationValue
  } = inputs;
  return (
    userPublicationBasedVerificationValue ||
    publicationBasedVerificationValue ||
    calendarBasedVerificationValue ||
    keyBasedVerificationValue
  );
}

export function isPubStringInputValid(inputs) {
  const { userPublicationBasedVerificationValue, ksiPubStringValue } = inputs;
  return userPublicationBasedVerificationValue ? !!ksiPubStringValue : true;
}

export function isPubFileInputValid(inputs) {
  const { publicationBasedVerificationValue, ksiPubFileValue } = inputs;
  return publicationBasedVerificationValue ? !!isWebUri(ksiPubFileValue) : true;
}

export function isAggregatorInputValid(inputs) {
  const { ksiAggregatorUrlValue } = inputs;
  return ksiAggregatorUrlValue ? isAggregatorConfValid(inputs) : true;
}

export function isAggregatorConfValid(inputs) {
  const { ksiAggregatorUrlValue, ksiLoginIdValue, ksiLoginKeyValue } = inputs;
  return !!(isWebUri(ksiAggregatorUrlValue) && ksiLoginIdValue && ksiLoginKeyValue);
}

export function isExtenderInputValid(inputs) {
  const { ksiExtenderUrlValue } = inputs;
  return ksiExtenderUrlValue ? isExtenderConfValid(inputs) : true;
}

export function isExtenderConfValid(inputs) {
  const { ksiExtenderUrlValue, ksiLoginIdValue, ksiLoginKeyValue } = inputs;
  return !!(isWebUri(ksiExtenderUrlValue) && ksiLoginIdValue && ksiLoginKeyValue);
}

export function isKeyInputValid(inputs) {
  const { keyBasedVerificationValue, ksiPubFileValue } = inputs;
  return keyBasedVerificationValue ? !!isWebUri(ksiPubFileValue) : true;
}

export function isCalendarInputValid(inputs) {
  const { calendarBasedVerificationValue, ksiExtenderUrlValue, ksiLoginIdValue, ksiLoginKeyValue } = inputs;
  if (calendarBasedVerificationValue) {
    return !!(isWebUri(ksiExtenderUrlValue) && ksiLoginIdValue && ksiLoginKeyValue);
  }
  return true;
}

export function hideWarning(warning) {
  warning.classList.add('hidden');
}

export function showWarning(warning) {
  warning.classList.remove('hidden');
}
