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
import {
  hideWarning,
  isAggregatorInputValid,
  isAtLeastOneValidationMethodChecked,
  isCalendarInputValid,
  isExtenderInputValid,
  isKeyInputValid,
  isPubFileInputValid,
  isPubStringInputValid,
  showWarning
} from '../ksi_warning_util';
import {
  INVALID_URL,
  KSI_AGGREGATOR_URL,
  KSI_EXTENDER_URL,
  KSI_LOGIN_ID,
  KSI_LOGIN_KEY,
  KSI_PUB_FILE,
  KSI_PUB_STRING
} from './test-util/common_test_data';

describe('isAtLeastOneValidationMethodChecked', () => {
  test('returns true if userPublicationBasedVerification is checked', () => {
    const inputs = {
      userPublicationBasedVerificationValue: true,
      publicationBasedVerificationValue: false,
      calendarBasedVerificationValue: false,
      keyBasedVerificationValue: false
    };
    expect(isAtLeastOneValidationMethodChecked(inputs)).toEqual(true);
  });

  test('returns true if publicationBasedVerification is checked', () => {
    const inputs = {
      userPublicationBasedVerificationValue: false,
      publicationBasedVerificationValue: true,
      calendarBasedVerificationValue: false,
      keyBasedVerificationValue: false
    };
    expect(isAtLeastOneValidationMethodChecked(inputs)).toEqual(true);
  });

  test('returns true if calendarBasedVerification is checked', () => {
    const inputs = {
      userPublicationBasedVerificationValue: false,
      publicationBasedVerificationValue: false,
      calendarBasedVerificationValue: true,
      keyBasedVerificationValue: false
    };
    expect(isAtLeastOneValidationMethodChecked(inputs)).toEqual(true);
  });

  test('returns true if keyBasedVerification is checked', () => {
    const inputs = {
      userPublicationBasedVerificationValue: false,
      publicationBasedVerificationValue: false,
      calendarBasedVerificationValue: false,
      keyBasedVerificationValue: true
    };
    expect(isAtLeastOneValidationMethodChecked(inputs)).toEqual(true);
  });

  test('returns false if no validation methods are checked', () => {
    const inputs = {
      userPublicationBasedVerificationValue: false,
      publicationBasedVerificationValue: false,
      calendarBasedVerificationValue: false,
      keyBasedVerificationValue: false
    };
    expect(isAtLeastOneValidationMethodChecked(inputs)).toEqual(false);
  });
});

describe('isPubStringInputValid', () => {
  test('returns true if userPublicationBasedVerification is not checked and ksiPubString exists', () => {
    const inputs = { userPublicationBasedVerificationValue: false, ksiPubStringValue: KSI_PUB_STRING };
    expect(isPubStringInputValid(inputs)).toEqual(true);
  });

  test('returns true if userPublicationBasedVerification is not checked and ksiPubString does not exist', () => {
    const inputs = { userPublicationBasedVerificationValue: false, ksiPubStringValue: '' };
    expect(isPubStringInputValid(inputs)).toEqual(true);
  });

  test('returns true if userPublicationBasedVerification is checked and ksiPubString exists', () => {
    const inputs = { userPublicationBasedVerificationValue: true, ksiPubStringValue: KSI_PUB_STRING };
    expect(isPubStringInputValid(inputs)).toEqual(true);
  });

  test('returns false if userPublicationBasedVerification is checked and ksiPubString does not exist', () => {
    const inputs = { userPublicationBasedVerificationValue: true, ksiPubStringValue: '' };
    expect(isPubStringInputValid(inputs)).toEqual(false);
  });
});

describe('isPubFileInputValid', () => {
  test('returns true if publicationBasedVerification is not checked and ksiPubFile is valid', () => {
    const inputs = { publicationBasedVerificationValue: false, ksiPubFileValue: KSI_PUB_FILE };
    expect(isPubFileInputValid(inputs)).toEqual(true);
  });

  test('returns true if publicationBasedVerification is not checked and ksiPubFile is not valid', () => {
    const inputs = { publicationBasedVerificationValue: false, ksiPubFileValue: INVALID_URL };
    expect(isPubFileInputValid(inputs)).toEqual(true);
  });

  test('returns true if publicationBasedVerification is checked and ksiPubFile is valid', () => {
    const inputs = { publicationBasedVerificationValue: true, ksiPubFileValue: KSI_PUB_FILE };
    expect(isPubFileInputValid(inputs)).toEqual(true);
  });

  test('returns false if publicationBasedVerification is checked and ksiPubFile is not valid', () => {
    const inputs = { publicationBasedVerificationValue: true, ksiPubFileValue: INVALID_URL };
    expect(isPubFileInputValid(inputs)).toEqual(false);
  });
});

describe('isAggregatorInputValid', () => {
  test('returns true if aggregatorUrl is valid', () => {
    const inputs = {
      ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
      ksiLoginIdValue: KSI_LOGIN_ID,
      ksiLoginKeyValue: KSI_LOGIN_KEY
    };
    expect(isAggregatorInputValid(inputs)).toEqual(true);
  });

  test('returns false if aggregatorUrl is invalid', () => {
    const inputs = {
      ksiAggregatorUrlValue: INVALID_URL,
      ksiLoginIdValue: KSI_LOGIN_ID,
      ksiLoginKeyValue: KSI_LOGIN_KEY
    };
    expect(isAggregatorInputValid(inputs)).toEqual(false);
  });

  test('returns true aggregatorUrl is empty', () => {
    const inputs = { ksiAggregatorUrlValue: '', ksiLoginIdValue: KSI_LOGIN_ID, ksiLoginKeyValue: KSI_LOGIN_KEY };
    expect(isAggregatorInputValid(inputs)).toEqual(true);
  });
});

describe('isExtenderInputValid', () => {
  test('returns true if extenderUrl is valid', () => {
    const inputs = {
      ksiExtenderUrlValue: KSI_EXTENDER_URL,
      ksiLoginIdValue: KSI_LOGIN_ID,
      ksiLoginKeyValue: KSI_LOGIN_KEY
    };
    expect(isExtenderInputValid(inputs)).toEqual(true);
  });

  test('returns false if rxtenderUrl is invalid', () => {
    const inputs = { ksiExtenderUrlValue: INVALID_URL, ksiLoginIdValue: KSI_LOGIN_ID, ksiLoginKeyValue: KSI_LOGIN_KEY };
    expect(isExtenderInputValid(inputs)).toEqual(false);
  });

  test('returns true extenderUrl is empty', () => {
    const inputs = { ksiExtenderUrlValue: '', ksiLoginIdValue: KSI_LOGIN_ID, ksiLoginKeyValue: KSI_LOGIN_KEY };
    expect(isExtenderInputValid(inputs)).toEqual(true);
  });
});

describe('isKeyInputValid', () => {
  test('returns true if keyBasedVerification is not checked and ksiPubFile is valid', () => {
    const inputs = { keyBasedVerificationValue: false, ksiPubFileValue: KSI_PUB_FILE };
    expect(isKeyInputValid(inputs)).toEqual(true);
  });

  test('returns true if keyBasedVerification is not checked and ksiPubFile is not valid', () => {
    const inputs = { keyBasedVerificationValue: false, ksiPubFileValue: INVALID_URL };
    expect(isKeyInputValid(inputs)).toEqual(true);
  });

  test('returns true if keyBasedVerification is checked and ksiPubFile is valid', () => {
    const inputs = { keyBasedVerificationValue: true, ksiPubFileValue: KSI_PUB_FILE };
    expect(isKeyInputValid(inputs)).toEqual(true);
  });

  test('returns false if keyBasedVerification is checked and ksiPubFile is not valid', () => {
    const inputs = { keyBasedVerificationValue: true, ksiPubFileValue: INVALID_URL };
    expect(isKeyInputValid(inputs)).toEqual(false);
  });
});

describe('isCalendarInputValid', () => {
  test('returns true if calendarBasedVerification is unchecked', () => {
    const inputs = {
      calendarBasedVerificationValue: false,
      ksiExtenderUrlValue: KSI_EXTENDER_URL,
      ksiLoginIdValue: KSI_LOGIN_ID,
      ksiLoginKeyValue: KSI_LOGIN_KEY
    };
    expect(isCalendarInputValid(inputs)).toEqual(true);
  });

  test('returns true if calendarBasedVerification is checked and all inputs are valid', () => {
    const inputs = {
      calendarBasedVerificationValue: true,
      ksiExtenderUrlValue: KSI_EXTENDER_URL,
      ksiLoginIdValue: KSI_LOGIN_ID,
      ksiLoginKeyValue: KSI_LOGIN_KEY
    };
    expect(isCalendarInputValid(inputs)).toEqual(true);
  });

  test('returns false if calendarBasedVerification is checked and extenderUrl is invalid', () => {
    const inputs = {
      calendarBasedVerificationValue: true,
      ksiExtenderUrlValue: INVALID_URL,
      ksiLoginIdValue: KSI_LOGIN_ID,
      ksiLoginKeyValue: KSI_LOGIN_KEY
    };
    expect(isCalendarInputValid(inputs)).toEqual(false);
  });

  test('returns false if calendarBasedVerification is checked and ksiLoginId does not exist', () => {
    const inputs = {
      calendarBasedVerificationValue: true,
      ksiExtenderUrlValue: KSI_EXTENDER_URL,
      ksiLoginIdValue: '',
      ksiLoginKeyValue: KSI_LOGIN_KEY
    };
    expect(isCalendarInputValid(inputs)).toEqual(false);
  });

  test('returns false if calendarBasedVerification is checked and ksiLoginKey does not exist', () => {
    const inputs = {
      calendarBasedVerificationValue: true,
      ksiExtenderUrlValue: KSI_EXTENDER_URL,
      ksiLoginIdValue: KSI_LOGIN_ID,
      ksiLoginKeyValue: ''
    };
    expect(isCalendarInputValid(inputs)).toEqual(false);
  });
});

describe('hideWarning', () => {
  test('hides warning', () => {
    const warning = document.createElement('div');
    hideWarning(warning);
    expect(warning.classList.contains('hidden')).toEqual(true);
  });
});

describe('showWarning', () => {
  test('shows warning', () => {
    const warning = document.createElement('div');
    warning.classList.add('hidden');
    showWarning(warning);
    expect(warning.classList.contains('hidden')).toEqual(false);
  });
});
