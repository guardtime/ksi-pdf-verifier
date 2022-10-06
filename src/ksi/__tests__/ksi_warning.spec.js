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
  isAtLeastOneValidationMethodChecked,
  isCalendarInputValid,
  isKeyInputValid,
  isPubFileInputValid,
  isPubStringInputValid,
  showWarning
} from '../ksi_warning_util';
import { KSI_PUB_STRING } from './test-util/common_test_data';
import { KSIWarning } from '../ksi_warning';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

jest.mock('../ksi_warning_util', () => {
  return {
    hideWarning: jest.fn(),
    showWarning: jest.fn()
  };
});

describe('KSIWarning', () => {
  const ksiWarningConfig = {
    overlayName: 'ksiWarningOverlay',
    container: jest.fn(),
    fields: {
      verificationMethodWarning: jest.fn(),
      pubStringWarning: jest.fn(),
      pubFileWarning: jest.fn(),
      keyWarning: jest.fn(),
      calendarWarning: jest.fn()
    }
  };

  const ksiConf = {
    open: jest.fn()
  };

  const overlayManager = jest.fn();
  overlayManager.register = jest.fn();
  PDFViewerApplication.ksiConfiguration = { open: jest.fn(), configuration: jest.fn() };

  describe('constructor', () => {
    test('constructs a valid KSIWarning object', () => {
      const ksiWarning = new KSIWarning(ksiConf, ksiWarningConfig, overlayManager);

      expect(ksiWarning.overlayName).toEqual(ksiWarningConfig.overlayName);
      expect(ksiWarning.container).toEqual(ksiWarningConfig.container);
      expect(ksiWarning.overlayManager).toEqual(overlayManager);
      expect(ksiWarning.verificationMethodWarning).toEqual(ksiWarningConfig.fields.verificationMethodWarning);
      expect(ksiWarning.pubStringWarning).toEqual(ksiWarningConfig.fields.pubStringWarning);
      expect(ksiWarning.pubFileWarning).toEqual(ksiWarningConfig.fields.pubFileWarning);
      expect(ksiWarning.keyWarning).toEqual(ksiWarningConfig.fields.keyWarning);
      expect(ksiWarning.calendarWarning).toEqual(ksiWarningConfig.fields.calendarWarning);
      expect(ksiWarning.overlayManager.register).toHaveBeenCalledWith(
        ksiWarningConfig.overlayName,
        ksiWarningConfig.container,
        expect.any(Function)
      );
    });
  });

  describe('openConfiguration', () => {
    const ksiWarning = new KSIWarning(ksiConf, ksiWarningConfig, overlayManager);

    test('closes Warning overlay and opens Configuration overlay', () => {
      ksiWarning.close = jest.fn();

      ksiWarning.openConfiguration();

      expect(ksiWarning.close).toHaveBeenCalled();
      expect(ksiConf.open).toHaveBeenCalled();
    });
  });

  describe('openIfConfigurationIsInvalid', () => {
    const ksiWarning = new KSIWarning(ksiConf, ksiWarningConfig, overlayManager);

    test('opens Warning overlay if configuration is invalid', () => {
      ksiWarning.toggleWarnings = jest.fn(() => {
        return (ksiWarning.showWarningOverlay = true);
      });
      ksiWarning.overlayManager.open = jest.fn();

      ksiWarning.openIfConfigurationIsInvalid();

      expect(ksiWarning.toggleWarnings).toHaveBeenCalled();
      expect(ksiWarning.overlayManager.open).toHaveBeenCalledWith(ksiWarning.overlayName);
    });

    test('does not open Warning overlay if configuration is valid', () => {
      ksiWarning.toggleWarnings = jest.fn();
      ksiWarning.overlayManager.open = jest.fn();

      ksiWarning.openIfConfigurationIsInvalid();

      expect(ksiWarning.toggleWarnings).toHaveBeenCalled();
      expect(ksiWarning.overlayManager.open).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    const ksiWarning = new KSIWarning(ksiConf, ksiWarningConfig, overlayManager);

    test('closes Warning overlay', () => {
      ksiWarning.overlayManager.close = jest.fn();

      ksiWarning.close();

      expect(ksiWarning.overlayManager.close).toHaveBeenCalledWith(ksiWarning.overlayName);
    });
  });

  describe('toggleWarnings', () => {
    const ksiWarning = new KSIWarning(ksiConf, ksiWarningConfig, overlayManager);

    test('toggles warnings', () => {
      const { configuration } = PDFViewerApplication.ksiConfiguration;
      ksiWarning.ksiConfiguration = PDFViewerApplication.ksiConfiguration;
      ksiWarning.toggleWarning = jest.fn();

      ksiWarning.toggleWarnings();

      expect(ksiWarning.toggleWarning).toHaveBeenCalledTimes(5);
      expect(ksiWarning.toggleWarning).toHaveBeenCalledWith(
        isAtLeastOneValidationMethodChecked,
        ksiWarning.verificationMethodWarning,
        configuration
      );
      expect(ksiWarning.toggleWarning).toHaveBeenCalledWith(
        isPubStringInputValid,
        ksiWarning.pubStringWarning,
        configuration
      );
      expect(ksiWarning.toggleWarning).toHaveBeenCalledWith(
        isPubFileInputValid,
        ksiWarning.pubFileWarning,
        configuration
      );
      expect(ksiWarning.toggleWarning).toHaveBeenCalledWith(isKeyInputValid, ksiWarning.keyWarning, configuration);
      expect(ksiWarning.toggleWarning).toHaveBeenCalledWith(
        isCalendarInputValid,
        ksiWarning.calendarWarning,
        configuration
      );
    });
  });

  describe('toggleWarning', () => {
    const ksiWarning = new KSIWarning(ksiConf, ksiWarningConfig, overlayManager);

    test('shows Warning overlay and toggles warning visible if validation function fails', () => {
      ksiWarning.showWarningOverlay = undefined;
      const warning = document.createElement('div');
      warning.classList.add('hidden');
      const validationFunction = jest.fn(() => {
        return false;
      });
      const inputs = { userPublicationBasedVerificationValue: true, ksiPubStringValue: KSI_PUB_STRING };

      ksiWarning.toggleWarning(validationFunction, warning, inputs);

      expect(validationFunction).toHaveBeenCalledWith(inputs);
      expect(showWarning).toHaveBeenCalledWith(warning);
      expect(ksiWarning.showWarningOverlay).toEqual(true);
      expect(hideWarning).not.toHaveBeenCalled();
    });

    test('hides warning if validation function succeeds', () => {
      ksiWarning.showWarningOverlay = false;
      const warning = document.createElement('div');
      warning.classList.add('hidden');
      const validationFunction = jest.fn(() => {
        return true;
      });
      const inputs = { userPublicationBasedVerificationValue: false, ksiPubStringValue: KSI_PUB_STRING };

      ksiWarning.toggleWarning(validationFunction, warning, inputs);

      expect(validationFunction).toHaveBeenCalledWith(inputs);
      expect(hideWarning).toHaveBeenCalledWith(warning);
      expect(ksiWarning.showWarningOverlay).toEqual(false);
      expect(showWarning).not.toHaveBeenCalled();
    });
  });
});
