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
  KSI_AGGREGATOR_URL,
  KSI_EXTENDER_URL,
  KSI_HASH_ALGORITHM,
  KSI_LOGIN_ID,
  KSI_LOGIN_KEY,
  KSI_PUB_FILE,
  KSI_PUB_STRING
} from './test-util/common_test_data';
import { DefaultConfiguration } from '../ksi_default_configuration';
import { KSIConfiguration } from '../ksi_configuration';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';

jest.mock('../ksi_warning_util', () => {
  return {
    hideWarning: jest.fn(),
    showWarning: jest.fn()
  };
});

describe('KSIConfiguration', () => {
  const ksiConfigurationConfig = {
    overlayName: 'ksiConfigurationOverlay',
    container: jest.fn(),
    verificationMethodsCollapsible: jest.fn(),
    configurationFieldsCollapsible: jest.fn(),
    checkboxWarning: jest.fn(),
    pubStringInputWarning: jest.fn(),
    pubFileInputWarning: jest.fn(),
    keyInputWarning: jest.fn(),
    calendarInputWarning: jest.fn(),
    fields: {
      ksiPubFile: jest.fn(),
      ksiPubString: jest.fn(),
      ksiExtenderUrl: jest.fn(),
      ksiAggregatorUrl: jest.fn(),
      ksiHashAlgorithm: document.createElement('select'),
      ksiLoginId: document.createElement('div'),
      ksiLoginKey: document.createElement('div'),
      userPublicationBasedVerification: jest.fn(),
      publicationBasedVerification: jest.fn(),
      calendarBasedVerification: jest.fn(),
      keyBasedVerification: jest.fn(),
      verificationDefault: jest.fn()
    }
  };
  const overlayManager = jest.fn();
  overlayManager.register = jest.fn();

  describe('constructor', () => {
    test('constructs a valid KSIConfiguration object', () => {
      const setBrowserPasswordStorageUsabilitySpy = jest
        .spyOn(KSIConfiguration.prototype, 'setBrowserPasswordStorageUsability')
        .mockImplementation();
      const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

      expect(ksiConfiguration.overlayName).toEqual(ksiConfigurationConfig.overlayName);
      expect(ksiConfiguration.fields).toEqual(ksiConfigurationConfig.fields);
      expect(ksiConfiguration.container).toEqual(ksiConfigurationConfig.container);
      expect(ksiConfiguration.verificationMethodsCollapsible).toEqual(
        ksiConfigurationConfig.verificationMethodsCollapsible
      );
      expect(ksiConfiguration.checkboxWarning).toEqual(ksiConfigurationConfig.checkboxWarning);
      expect(ksiConfiguration.pubStringInputWarning).toEqual(ksiConfigurationConfig.pubStringInputWarning);
      expect(ksiConfiguration.pubFileInputWarning).toEqual(ksiConfigurationConfig.pubFileInputWarning);
      expect(ksiConfiguration.keyInputWarning).toEqual(ksiConfigurationConfig.keyInputWarning);
      expect(ksiConfiguration.calendarInputWarning).toEqual(ksiConfigurationConfig.calendarInputWarning);
      expect(ksiConfiguration.configuration).toEqual({});

      expect(setBrowserPasswordStorageUsabilitySpy).toHaveBeenCalled();
      expect(ksiConfiguration.overlayManager.register).toHaveBeenCalledWith(
        ksiConfigurationConfig.overlayName,
        ksiConfigurationConfig.container,
        expect.any(Function)
      );
    });
  });

  describe('open', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    ksiConfiguration.fields.ksiHashAlgorithm = document.createElement('select');

    test('loads conf/credentials, opens KSIConfiguration overlay', async () => {
      ksiConfiguration.loadConfiguration = jest.fn();
      ksiConfiguration.loadCredentials = jest.fn();
      ksiConfiguration.toggleVerification = jest.fn();
      ksiConfiguration.initHashAlgorithmDropdown = jest.fn();
      ksiConfiguration.overlayManager.open = jest.fn();

      await ksiConfiguration.open();

      expect(ksiConfiguration.loadConfiguration).toHaveBeenCalled();
      expect(ksiConfiguration.toggleVerification).toHaveBeenCalled();
      expect(ksiConfiguration.loadCredentials).toHaveBeenCalled();
      expect(ksiConfiguration.initHashAlgorithmDropdown).toHaveBeenCalled();
      expect(ksiConfiguration.overlayManager.open).toHaveBeenCalled();
    });

    test('loads conf/credentials, opens KSIConfiguration overlay with conf collapsible open', async () => {
      ksiConfiguration.loadConfiguration = jest.fn();
      ksiConfiguration.loadCredentials = jest.fn();
      ksiConfiguration.toggleVerification = jest.fn();
      ksiConfiguration.initHashAlgorithmDropdown = jest.fn();
      ksiConfiguration.toggleCollapsible = jest.fn();
      ksiConfiguration.disableFeatures = jest.fn();

      await ksiConfiguration.open(true);

      expect(ksiConfiguration.disableFeatures).toHaveBeenCalled();
      expect(ksiConfiguration.loadConfiguration).toHaveBeenCalled();
      expect(ksiConfiguration.loadCredentials).toHaveBeenCalled();
      expect(ksiConfiguration.initHashAlgorithmDropdown).toHaveBeenCalled();
      expect(ksiConfiguration.overlayManager.open).toHaveBeenCalled();
      expect(ksiConfiguration.toggleCollapsible).toHaveBeenCalled();
    });
  });

  describe('resetConfiguration', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    ksiConfiguration.fields.ksiHashAlgorithm = document.createElement('select');

    test('clears localStorage, loads a clean configuration, clears credentials, inits hash algorithm dropdown', () => {
      ksiConfiguration.clearLocalStorageIfPossible = jest.fn();
      ksiConfiguration.loadConfiguration = jest.fn();
      ksiConfiguration.clearCredentials = jest.fn();
      ksiConfiguration.initHashAlgorithmDropdown = jest.fn();

      ksiConfiguration.resetConfiguration();

      expect(ksiConfiguration.clearLocalStorageIfPossible).toHaveBeenCalled();
      expect(ksiConfiguration.loadConfiguration).toHaveBeenCalled();
      expect(ksiConfiguration.clearCredentials).toHaveBeenCalled();
      expect(ksiConfiguration.initHashAlgorithmDropdown).toHaveBeenCalled();
    });
  });

  describe('clearLocalStorageIfPossible', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('clears localStorage if localStorage is present', () => {
      window._localStorage = { removeItem: jest.fn() };

      ksiConfiguration.clearLocalStorageIfPossible();

      expect(localStorage.removeItem).toHaveBeenCalledTimes(9);
      expect(localStorage.removeItem).toHaveBeenCalledWith('ksiPubFile');
      expect(localStorage.removeItem).toHaveBeenCalledWith('ksiPubString');
      expect(localStorage.removeItem).toHaveBeenCalledWith('ksiExtenderUrl');
      expect(localStorage.removeItem).toHaveBeenCalledWith('ksiAggregatorUrl');
      expect(localStorage.removeItem).toHaveBeenCalledWith('ksiHashAlgorithm');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userPublicationBasedVerification');
      expect(localStorage.removeItem).toHaveBeenCalledWith('publicationBasedVerification');
      expect(localStorage.removeItem).toHaveBeenCalledWith('calendarBasedVerification');
      expect(localStorage.removeItem).toHaveBeenCalledWith('keyBasedVerification');
    });

    test('does nothing if localStorage is missing', () => {
      window._localStorage = null;
      ksiConfiguration.clearLocalStorageIfPossible();
    });
  });

  describe('toggleCollapsible', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('toggles collapsible', () => {
      ksiConfiguration.toggleArrowIcon = jest.fn();
      ksiConfiguration.toggleHeight = jest.fn();
      const element = document.createElement('div');
      element.classList.add('active');
      const child = document.createElement('div');
      element.appendChild(child);

      ksiConfiguration.toggleCollapsible(element);

      expect(element.classList.contains('active')).toEqual(false);
      expect(ksiConfiguration.toggleArrowIcon).toHaveBeenCalledWith(child);
      expect(ksiConfiguration.toggleHeight).toHaveBeenCalledWith(element);
    });
  });

  describe('toggleArrowIcon', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('removes arrow-down and adds arrow-right if classList contains arrow-down', () => {
      const element = document.createElement('div');
      element.classList.add('arrow-down');

      ksiConfiguration.toggleArrowIcon(element);

      expect(element.classList.contains('arrow-down')).toEqual(false);
      expect(element.classList.contains('arrow-right')).toEqual(true);
    });

    test('adds arrow-down and removes arrow-right if classList contains arrow-right', () => {
      const element = document.createElement('div');
      element.classList.add('arrow-right');

      ksiConfiguration.toggleArrowIcon(element);

      expect(element.classList.contains('arrow-down')).toEqual(true);
      expect(element.classList.contains('arrow-right')).toEqual(false);
    });
  });

  describe('toggleHeight', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('sets maxHeight to null if maxHeight is defined', () => {
      const content = document.createElement('div');
      content.style.maxHeight = '50px';
      const element = { nextElementSibling: content };

      ksiConfiguration.toggleHeight(element);

      expect(content.style.maxHeight).toEqual('');
    });

    test('sets maxHeight to content.scrollHeight if maxHeight is not defined', () => {
      const content = document.createElement('div');
      const element = { nextElementSibling: content };
      jest.spyOn(content, 'scrollHeight', 'get').mockImplementation(() => {
        return 100;
      });

      ksiConfiguration.toggleHeight(element);

      expect(content.style.maxHeight).toEqual('100px');
    });
  });

  describe('setBrowserPasswordStorageUsability', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('sets useBrowserPasswordStorage to true if browser is suitable', () => {
      ksiConfiguration.disableBrowserPasswordManager = jest.fn();
      navigator.credentials = { preventSilentAccess: true };
      window.PasswordCredential = {};
      ksiConfiguration.setBrowserPasswordStorageUsability();

      expect(ksiConfiguration.useBrowserPasswordStorage).toEqual(true);
      expect(ksiConfiguration.disableBrowserPasswordManager).not.toHaveBeenCalled();
    });

    test('sets useBrowserPasswordStorage to false if PasswordCredential is missing', () => {
      ksiConfiguration.disableBrowserPasswordManager = jest.fn();
      navigator.credentials = { preventSilentAccess: true };
      window.PasswordCredential = undefined;

      ksiConfiguration.setBrowserPasswordStorageUsability();

      expect(ksiConfiguration.useBrowserPasswordStorage).toEqual(false);
      expect(ksiConfiguration.disableBrowserPasswordManager).toHaveBeenCalled();
    });

    test('sets useBrowserPasswordStorage to false if credentials.preventSilentAccess is false', () => {
      ksiConfiguration.disableBrowserPasswordManager = jest.fn();
      navigator.credentials = { preventSilentAccess: false };
      window.PasswordCredential = {};

      ksiConfiguration.setBrowserPasswordStorageUsability();

      expect(ksiConfiguration.useBrowserPasswordStorage).toEqual(false);
      expect(ksiConfiguration.disableBrowserPasswordManager).toHaveBeenCalled();
    });

    test('sets useBrowserPasswordStorage to false if credentials is missing', () => {
      ksiConfiguration.disableBrowserPasswordManager = jest.fn();
      window.PasswordCredential = {};

      ksiConfiguration.setBrowserPasswordStorageUsability();

      expect(ksiConfiguration.useBrowserPasswordStorage).toEqual(false);
      expect(ksiConfiguration.disableBrowserPasswordManager).toHaveBeenCalled();
    });
  });

  describe('disableBrowserPasswordManager', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('sets readonly and onfocus for ksiLoginId and ksiLoginKey elements', () => {
      ksiConfiguration.disableBrowserPasswordManager();

      expect(ksiConfiguration.fields.ksiLoginId.getAttribute('readonly')).toEqual('true');
      expect(ksiConfiguration.fields.ksiLoginId.onfocus).toEqual(expect.any(Function));
      expect(ksiConfiguration.fields.ksiLoginKey.getAttribute('readonly')).toEqual('true');
      expect(ksiConfiguration.fields.ksiLoginKey.onfocus).toEqual(expect.any(Function));
    });
  });

  describe('loadConfiguration', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('populates fields and configuration object with data from localStorage and browser credentials', () => {
      ksiConfiguration.loadCredentials = jest.fn();
      ksiConfiguration.getFromLocalStorage = jest.fn();
      ksiConfiguration.defaultToAppOptions = jest.fn();
      ksiConfiguration.defaultToTrue = jest.fn();
      when(ksiConfiguration.defaultToAppOptions)
        .calledWith('ksiPubFile', 'PUBLICATION_FILE_URL')
        .mockReturnValue(KSI_PUB_FILE);
      when(ksiConfiguration.defaultToAppOptions)
        .calledWith('ksiPubString', 'PUBLICATION_STRING')
        .mockReturnValue(KSI_PUB_STRING);
      when(ksiConfiguration.defaultToAppOptions)
        .calledWith('ksiExtenderUrl', 'EXTENDER_URL')
        .mockReturnValue(KSI_EXTENDER_URL);
      when(ksiConfiguration.defaultToAppOptions)
        .calledWith('ksiAggregatorUrl', 'AGGREGATOR_URL')
        .mockReturnValue(KSI_AGGREGATOR_URL);
      when(ksiConfiguration.defaultToAppOptions)
        .calledWith('ksiHashAlgorithm', 'HASH_ALGORITHM')
        .mockReturnValue(KSI_HASH_ALGORITHM);
      when(ksiConfiguration.getFromLocalStorage)
        .calledWith('userPublicationBasedVerification')
        .mockReturnValue('true');
      when(ksiConfiguration.defaultToTrue)
        .calledWith('publicationBasedVerification')
        .mockReturnValue('true');
      when(ksiConfiguration.getFromLocalStorage)
        .calledWith('calendarBasedVerification')
        .mockReturnValue('true');
      when(ksiConfiguration.defaultToTrue)
        .calledWith('keyBasedVerification')
        .mockReturnValue('true');

      ksiConfiguration.loadConfiguration();

      const {
        ksiPubFile,
        ksiPubString,
        ksiAggregatorUrl,
        ksiExtenderUrl,
        userPublicationBasedVerification,
        publicationBasedVerification,
        calendarBasedVerification,
        keyBasedVerification
      } = ksiConfiguration.fields;

      const {
        ksiPubFileValue,
        ksiPubStringValue,
        ksiExtenderUrlValue,
        ksiAggregatorUrlValue,
        ksiHashAlgorithm,
        userPublicationBasedVerificationValue,
        publicationBasedVerificationValue,
        calendarBasedVerificationValue,
        keyBasedVerificationValue
      } = ksiConfiguration.configuration;

      expect(ksiPubFileValue).toEqual(KSI_PUB_FILE);
      expect(ksiPubFile.value).toEqual(KSI_PUB_FILE);
      expect(ksiPubStringValue).toEqual(KSI_PUB_STRING);
      expect(ksiPubString.value).toEqual(KSI_PUB_STRING);
      expect(ksiAggregatorUrlValue).toEqual(KSI_AGGREGATOR_URL);
      expect(ksiAggregatorUrl.value).toEqual(KSI_AGGREGATOR_URL);
      expect(ksiExtenderUrlValue).toEqual(KSI_EXTENDER_URL);
      expect(ksiExtenderUrl.value).toEqual(KSI_EXTENDER_URL);
      expect(ksiHashAlgorithm).toEqual(KSI_HASH_ALGORITHM);
      expect(userPublicationBasedVerificationValue).toEqual(true);
      expect(userPublicationBasedVerification.checked).toEqual(true);
      expect(publicationBasedVerificationValue).toEqual(true);
      expect(publicationBasedVerification.checked).toEqual(true);
      expect(calendarBasedVerificationValue).toEqual(true);
      expect(calendarBasedVerification.checked).toEqual(true);
      expect(keyBasedVerificationValue).toEqual(true);
      expect(keyBasedVerification.checked).toEqual(true);
    });
  });

  describe('loadCredentials', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('loads credentials from browser credential storage', async () => {
      ksiConfiguration.useBrowserPasswordStorage = true;
      navigator.credentials = { get: jest.fn() };
      when(navigator.credentials.get)
        .calledWith({ password: true })
        .mockReturnValue({ id: KSI_LOGIN_ID, password: KSI_LOGIN_KEY });

      await ksiConfiguration.loadCredentials();

      const { ksiLoginId, ksiLoginKey } = ksiConfiguration.fields;
      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual(KSI_LOGIN_ID);
      expect(ksiLoginId.value).toEqual(KSI_LOGIN_ID);
      expect(ksiLoginKeyValue).toEqual(KSI_LOGIN_KEY);
      expect(ksiLoginKey.value).toEqual(KSI_LOGIN_KEY);
    });

    test('loads credentials from auto completed fields if no credentials in browser storage', async () => {
      ksiConfiguration.useBrowserPasswordStorage = true;
      navigator.credentials = { get: jest.fn() };
      when(navigator.credentials.get)
        .calledWith({ password: true })
        .mockReturnValue(null);
      ksiConfiguration.fields.ksiLoginId.value = KSI_LOGIN_ID;
      ksiConfiguration.fields.ksiLoginKey.value = KSI_LOGIN_KEY;

      await ksiConfiguration.loadCredentials();

      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual(KSI_LOGIN_ID);
      expect(ksiLoginKeyValue).toEqual(KSI_LOGIN_KEY);
    });

    test('loads credentials from auto completed fields if browser storage is not usable', () => {
      ksiConfiguration.useBrowserPasswordStorage = false;
      ksiConfiguration.fields.ksiLoginId.value = KSI_LOGIN_ID;
      ksiConfiguration.fields.ksiLoginKey.value = KSI_LOGIN_KEY;

      ksiConfiguration.loadCredentials();

      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual(KSI_LOGIN_ID);
      expect(ksiLoginKeyValue).toEqual(KSI_LOGIN_KEY);
    });

    test('dont load credentials', () => {
      ksiConfiguration.useBrowserPasswordStorage = false;
      ksiConfiguration.fields.ksiLoginId.value = '';
      ksiConfiguration.fields.ksiLoginKey.value = '';

      ksiConfiguration.loadCredentials(false);

      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual('');
      expect(ksiLoginKeyValue).toEqual('');
    });
  });

  describe('clearCredentials', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('clear credentials from conf and field', () => {
      ksiConfiguration.configuration.ksiLoginValue = 'test';
      ksiConfiguration.configuration.ksiLoginKeyValue = 'test';
      ksiConfiguration.fields.ksiLoginId.value = 'test';
      ksiConfiguration.fields.ksiLoginKey.value = 'test';

      ksiConfiguration.clearCredentials();
      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual('');
      expect(ksiLoginKeyValue).toEqual('');

      expect(ksiConfiguration.fields.ksiLoginId.value).toEqual('');
      expect(ksiConfiguration.fields.ksiLoginKey.value).toEqual('');
    });
  });

  describe('getFromLocalStorage', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    const ksiPubFile = 'ksiPubFile';

    test('returns value from localStorage if localStorage is present', () => {
      window._localStorage = { getItem: jest.fn() };

      when(localStorage.getItem)
        .calledWith(ksiPubFile)
        .mockReturnValue(KSI_PUB_FILE);
      expect(ksiConfiguration.getFromLocalStorage(ksiPubFile)).toEqual(KSI_PUB_FILE);
    });

    test('returns null if localStorage is missing', () => {
      window._localStorage = null;
      expect(ksiConfiguration.getFromLocalStorage(ksiPubFile)).toBeNull();
    });
  });

  describe('defaultToTrue', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    const ksiPubFile = 'ksiPubFile';
    ksiConfiguration.getFromLocalStorage = jest.fn();

    test('returns value from localStorage', () => {
      when(ksiConfiguration.getFromLocalStorage)
        .calledWith(ksiPubFile)
        .mockReturnValue(KSI_PUB_FILE);

      expect(ksiConfiguration.defaultToTrue(ksiPubFile)).toEqual(KSI_PUB_FILE);
    });

    test("returns 'true' if value is null", () => {
      when(ksiConfiguration.getFromLocalStorage)
        .calledWith(ksiPubFile)
        .mockReturnValue(null);

      expect(ksiConfiguration.defaultToTrue(ksiPubFile)).toEqual('true');
    });

    test("returns 'true' if value is 'undefined'", () => {
      when(ksiConfiguration.getFromLocalStorage)
        .calledWith(ksiPubFile)
        .mockReturnValue('undefined');

      expect(ksiConfiguration.defaultToTrue(ksiPubFile)).toEqual('true');
    });

    test("returns 'true' if value is an empty string", () => {
      when(ksiConfiguration.getFromLocalStorage)
        .calledWith(ksiPubFile)
        .mockReturnValue('');

      expect(ksiConfiguration.defaultToTrue(ksiPubFile)).toEqual('true');
    });
  });

  describe('defaultToAppOptions', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    const ksiPubFile = 'ksiPubFile';
    ksiConfiguration.getFromLocalStorage = jest.fn();

    test('returns value from localStorage if present in localStorage', () => {
      when(ksiConfiguration.getFromLocalStorage)
        .calledWith(ksiPubFile)
        .mockReturnValue(KSI_PUB_FILE);

      expect(ksiConfiguration.defaultToAppOptions(ksiPubFile, 'PUBLICATION_FILE_URL')).toEqual(KSI_PUB_FILE);
    });

    test('returns default value if value does not exist in localStorage', () => {
      Object.defineProperty(DefaultConfiguration, 'DEFAULT_CONFIGURATION', {
        get: jest.fn(() => {
          return {
            PUBLICATION_FILE_URL: KSI_PUB_FILE
          };
        })
      });

      when(ksiConfiguration.getFromLocalStorage)
        .calledWith(ksiPubFile)
        .mockReturnValue(null);

      expect(ksiConfiguration.defaultToAppOptions(ksiPubFile, 'PUBLICATION_FILE_URL')).toEqual(KSI_PUB_FILE);
    });
  });

  describe('close', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('hides warnings, closes overlay', () => {
      ksiConfiguration.toggleWarnings = jest.fn(() => {
        return (ksiConfiguration.isSaveAllowed = true);
      });
      ksiConfiguration.hideWarnings = jest.fn();
      ksiConfiguration.overlayManager.close = jest.fn();

      ksiConfiguration.close();

      expect(ksiConfiguration.hideWarnings).toHaveBeenCalled();
      expect(ksiConfiguration.overlayManager.close).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    PDFViewerApplication.ksiSignatureViewer = {
      reInitializeServiceAndPolicyAndReRender: jest.fn(),
      toggleButtons: jest.fn()
    };

    test('saves configuration is input validation succeeds', async () => {
      ksiConfiguration.toggleWarnings = jest.fn(() => {
        return (ksiConfiguration.isSaveAllowed = true);
      });
      ksiConfiguration.saveConfiguration = jest.fn();
      ksiConfiguration.close = jest.fn();

      await ksiConfiguration.save();

      expect(ksiConfiguration.toggleWarnings).toHaveBeenCalled();
      expect(ksiConfiguration.saveConfiguration).toHaveBeenCalled();
      expect(PDFViewerApplication.ksiSignatureViewer.reInitializeServiceAndPolicyAndReRender).toHaveBeenCalled();
      expect(ksiConfiguration.close).toHaveBeenCalled();
    });

    test('does not save configuration if input validation fails', async () => {
      ksiConfiguration.toggleWarnings = jest.fn(() => {
        return (ksiConfiguration.isSaveAllowed = false);
      });
      ksiConfiguration.saveConfiguration = jest.fn();
      ksiConfiguration.close = jest.fn();

      await ksiConfiguration.save();

      expect(ksiConfiguration.toggleWarnings).toHaveBeenCalled();
      expect(ksiConfiguration.saveConfiguration).not.toHaveBeenCalled();
      expect(PDFViewerApplication.ksiSignatureViewer.reInitializeServiceAndPolicyAndReRender).not.toHaveBeenCalled();
      expect(ksiConfiguration.close).not.toHaveBeenCalled();
    });
  });

  describe('toggleWarnings', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('toggles warnings', () => {
      const {
        ksiPubFile,
        ksiPubString,
        ksiExtenderUrl,
        userPublicationBasedVerification,
        publicationBasedVerification,
        calendarBasedVerification,
        keyBasedVerification,
        ksiLoginId,
        ksiLoginKey
      } = ksiConfiguration.fields;
      userPublicationBasedVerification.checked = true;
      publicationBasedVerification.checked = true;
      calendarBasedVerification.checked = true;
      keyBasedVerification.checked = true;
      ksiPubFile.value = KSI_PUB_FILE;
      ksiPubString.value = KSI_PUB_STRING;
      ksiExtenderUrl.value = KSI_EXTENDER_URL;
      ksiLoginId.value = KSI_LOGIN_ID;
      ksiLoginKey.value = KSI_LOGIN_KEY;
      ksiConfiguration.toggleWarning = jest.fn();

      ksiConfiguration.toggleWarnings();

      const validationMethodsWarningInputs = {
        calendarBasedVerificationValue: true,
        keyBasedVerificationValue: true,
        publicationBasedVerificationValue: true,
        userPublicationBasedVerificationValue: true
      };
      const pubStringWarningInputs = {
        ksiPubStringValue: KSI_PUB_STRING,
        userPublicationBasedVerificationValue: true
      };
      const pubFileWarningInputs = {
        ksiPubFileValue: KSI_PUB_FILE,
        publicationBasedVerificationValue: true
      };
      const aggregatorWarningInputs = {
        ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
        ksiLoginIdValue: KSI_LOGIN_ID,
        ksiLoginKeyValue: KSI_LOGIN_KEY
      };
      const extenderWarningInputs = {
        ksiExtenderUrlValue: KSI_EXTENDER_URL,
        ksiLoginIdValue: KSI_LOGIN_ID,
        ksiLoginKeyValue: KSI_LOGIN_KEY
      };
      const keyWarningInputs = {
        keyBasedVerificationValue: true,
        ksiPubFileValue: KSI_PUB_FILE
      };
      const calendarWarningInputs = {
        calendarBasedVerificationValue: true,
        ksiExtenderUrlValue: KSI_EXTENDER_URL,
        ksiLoginIdValue: KSI_LOGIN_ID,
        ksiLoginKeyValue: KSI_LOGIN_KEY
      };

      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledTimes(7);
      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledWith(
        isAtLeastOneValidationMethodChecked,
        ksiConfiguration.checkboxWarning,
        validationMethodsWarningInputs
      );
      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledWith(
        isPubStringInputValid,
        ksiConfiguration.pubStringInputWarning,
        pubStringWarningInputs
      );
      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledWith(
        isPubFileInputValid,
        ksiConfiguration.pubFileInputWarning,
        pubFileWarningInputs
      );
      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledWith(
        isAggregatorInputValid,
        ksiConfiguration.aggregatorInputWarning,
        aggregatorWarningInputs
      );
      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledWith(
        isExtenderInputValid,
        ksiConfiguration.extenderInputWarning,
        extenderWarningInputs
      );
      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledWith(
        isKeyInputValid,
        ksiConfiguration.keyInputWarning,
        keyWarningInputs
      );
      expect(ksiConfiguration.toggleWarning).toHaveBeenCalledWith(
        isCalendarInputValid,
        ksiConfiguration.calendarInputWarning,
        calendarWarningInputs
      );
    });
  });

  describe('toggleWarning', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('sets isSaveAllowed to false and toggles warning visible if validation function fails', () => {
      ksiConfiguration.isSaveAllowed = undefined;
      const warning = document.createElement('div');
      warning.classList.add('hidden');
      const validationFunction = jest.fn(() => {
        return false;
      });
      const inputs = { userPublicationBasedVerificationValue: true, ksiPubStringValue: KSI_PUB_STRING };

      ksiConfiguration.toggleWarning(validationFunction, warning, inputs);

      expect(validationFunction).toHaveBeenCalledWith(inputs);
      expect(showWarning).toHaveBeenCalledWith(warning);
      expect(ksiConfiguration.isSaveAllowed).toEqual(false);
      expect(hideWarning).not.toHaveBeenCalled();
    });

    test('toggles warning invisible if validation function succeeds', () => {
      ksiConfiguration.isSaveAllowed = true;
      const warning = document.createElement('div');
      warning.classList.add('hidden');
      const validationFunction = jest.fn(() => {
        return true;
      });
      const inputs = { userPublicationBasedVerificationValue: false, ksiPubStringValue: KSI_PUB_STRING };

      ksiConfiguration.toggleWarning(validationFunction, warning, inputs);

      expect(validationFunction).toHaveBeenCalledWith(inputs);
      expect(hideWarning).toHaveBeenCalledWith(warning);
      expect(ksiConfiguration.isSaveAllowed).toEqual(true);
      expect(showWarning).not.toHaveBeenCalled();
    });
  });

  describe('saveConfiguration', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('saves field inputs to localStorage and ksiConfiguration.configuration, saves credentials', () => {
      ksiConfiguration.saveConfigurationToLocalStorageIfPossible = jest.fn();
      ksiConfiguration.saveConfigurationToMemory = jest.fn();
      ksiConfiguration.saveCredentials = jest.fn();

      ksiConfiguration.saveConfiguration();

      expect(ksiConfiguration.saveConfigurationToLocalStorageIfPossible).toHaveBeenCalled();
      expect(ksiConfiguration.saveConfigurationToMemory).toHaveBeenCalled();
      expect(ksiConfiguration.saveCredentials).toHaveBeenCalled();
    });
  });

  describe('saveConfigurationToMemory', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('saves configuration to ksiConfiguration.configuration', () => {
      ksiConfiguration.fields = {
        ksiPubFile: { value: KSI_PUB_FILE },
        ksiPubString: { value: KSI_PUB_STRING },
        ksiAggregatorUrl: { value: KSI_AGGREGATOR_URL },
        ksiExtenderUrl: { value: KSI_EXTENDER_URL },
        ksiLoginId: { value: KSI_LOGIN_ID },
        ksiLoginKey: { value: KSI_LOGIN_KEY },
        ksiHashAlgorithm: {
          selectedIndex: 0,
          options: [{ value: KSI_HASH_ALGORITHM }]
        },
        userPublicationBasedVerification: { checked: true },
        publicationBasedVerification: { checked: false },
        calendarBasedVerification: { checked: true },
        keyBasedVerification: { checked: false }
      };

      ksiConfiguration.saveConfigurationToMemory();

      expect(ksiConfiguration.configuration.ksiPubFileValue).toEqual(KSI_PUB_FILE);
      expect(ksiConfiguration.configuration.ksiPubStringValue).toEqual(KSI_PUB_STRING);
      expect(ksiConfiguration.configuration.ksiAggregatorUrlValue).toEqual(KSI_AGGREGATOR_URL);
      expect(ksiConfiguration.configuration.ksiExtenderUrlValue).toEqual(KSI_EXTENDER_URL);
      expect(ksiConfiguration.configuration.ksiHashAlgorithm).toEqual(KSI_HASH_ALGORITHM);
      expect(ksiConfiguration.configuration.userPublicationBasedVerificationValue).toEqual(true);
      expect(ksiConfiguration.configuration.publicationBasedVerificationValue).toEqual(false);
      expect(ksiConfiguration.configuration.calendarBasedVerificationValue).toEqual(true);
      expect(ksiConfiguration.configuration.keyBasedVerificationValue).toEqual(false);
    });
  });

  describe('saveConfigurationToLocalStorageIfPossible', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    ksiConfiguration.fields = {
      ksiPubFile: { value: KSI_PUB_FILE },
      ksiPubString: { value: KSI_PUB_STRING },
      ksiAggregatorUrl: { value: KSI_AGGREGATOR_URL },
      ksiExtenderUrl: { value: KSI_EXTENDER_URL },
      ksiLoginId: { value: KSI_LOGIN_ID },
      ksiLoginKey: { value: KSI_LOGIN_KEY },
      ksiHashAlgorithm: {
        selectedIndex: 0,
        options: [{ value: KSI_HASH_ALGORITHM }]
      },
      userPublicationBasedVerification: { checked: true },
      publicationBasedVerification: { checked: false },
      calendarBasedVerification: { checked: true },
      keyBasedVerification: { checked: false }
    };

    test('saves configuration to ksiConfiguration.configuration', () => {
      window._localStorage = { setItem: jest.fn() };

      ksiConfiguration.saveConfigurationToLocalStorageIfPossible();

      expect(localStorage.setItem).toHaveBeenCalledTimes(9);
      expect(localStorage.setItem).toHaveBeenCalledWith('ksiPubFile', KSI_PUB_FILE);
      expect(localStorage.setItem).toHaveBeenCalledWith('ksiPubString', KSI_PUB_STRING);
      expect(localStorage.setItem).toHaveBeenCalledWith('ksiAggregatorUrl', KSI_AGGREGATOR_URL);
      expect(localStorage.setItem).toHaveBeenCalledWith('ksiExtenderUrl', KSI_EXTENDER_URL);
      expect(localStorage.setItem).toHaveBeenCalledWith('ksiHashAlgorithm', KSI_HASH_ALGORITHM);
      expect(localStorage.setItem).toHaveBeenCalledWith('userPublicationBasedVerification', true);
      expect(localStorage.setItem).toHaveBeenCalledWith('publicationBasedVerification', false);
      expect(localStorage.setItem).toHaveBeenCalledWith('calendarBasedVerification', true);
      expect(localStorage.setItem).toHaveBeenCalledWith('keyBasedVerification', false);
    });

    test('does nothing if localStorage is null', () => {
      window._localStorage = null;
      ksiConfiguration.saveConfigurationToLocalStorageIfPossible();
    });
  });

  describe('saveCredentials', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('saves credentials if browser storage usable and id/password present', () => {
      ksiConfiguration.useBrowserPasswordStorage = true;
      ksiConfiguration.fields = {
        ksiLoginId: { value: KSI_LOGIN_ID },
        ksiLoginKey: { value: KSI_LOGIN_KEY }
      };
      const cred = jest.fn();
      window.PasswordCredential = jest.fn(() => {
        return cred;
      });
      navigator.credentials = { store: jest.fn() };

      ksiConfiguration.saveCredentials();

      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual(KSI_LOGIN_ID);
      expect(ksiLoginKeyValue).toEqual(KSI_LOGIN_KEY);
      expect(window.PasswordCredential).toHaveBeenCalledWith({ id: KSI_LOGIN_ID, password: KSI_LOGIN_KEY });
      expect(navigator.credentials.store).toHaveBeenCalledWith(cred);
    });

    test('does not save credentials if browser storage usable and ksiLoginId.value missing', () => {
      ksiConfiguration.useBrowserPasswordStorage = true;
      ksiConfiguration.fields = {
        ksiLoginId: { value: '' },
        ksiLoginKey: { value: KSI_LOGIN_KEY }
      };
      window.PasswordCredential = jest.fn();
      navigator.credentials = { store: jest.fn() };

      ksiConfiguration.saveCredentials();

      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual('');
      expect(ksiLoginKeyValue).toEqual(KSI_LOGIN_KEY);
      expect(window.PasswordCredential).not.toHaveBeenCalledWith();
      expect(navigator.credentials.store).not.toHaveBeenCalled();
    });

    test('does not save credentials if browser storage usable and ksiLoginKey.value missing', () => {
      ksiConfiguration.useBrowserPasswordStorage = true;
      ksiConfiguration.fields = {
        ksiLoginId: { value: KSI_LOGIN_ID },
        ksiLoginKey: { value: '' }
      };
      window.PasswordCredential = jest.fn();
      navigator.credentials = { store: jest.fn() };

      ksiConfiguration.saveCredentials();

      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual(KSI_LOGIN_ID);
      expect(ksiLoginKeyValue).toEqual('');
      expect(window.PasswordCredential).not.toHaveBeenCalledWith();
      expect(navigator.credentials.store).not.toHaveBeenCalled();
    });

    test('does not save credentials if browser storage not usable', () => {
      ksiConfiguration.useBrowserPasswordStorage = false;
      ksiConfiguration.fields = {
        ksiLoginId: { value: KSI_LOGIN_ID },
        ksiLoginKey: { value: KSI_LOGIN_KEY }
      };
      window.PasswordCredential = jest.fn();
      navigator.credentials = { store: jest.fn() };

      ksiConfiguration.saveCredentials();

      const { ksiLoginIdValue, ksiLoginKeyValue } = ksiConfiguration.configuration;
      expect(ksiLoginIdValue).toEqual(KSI_LOGIN_ID);
      expect(ksiLoginKeyValue).toEqual(KSI_LOGIN_KEY);
      expect(window.PasswordCredential).not.toHaveBeenCalledWith();
      expect(navigator.credentials.store).not.toHaveBeenCalled();
    });
  });

  describe('hideWarnings', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('hides warnings', () => {
      ksiConfiguration.hideWarnings();

      expect(hideWarning).toHaveBeenCalledTimes(7);
      expect(hideWarning).toHaveBeenCalledWith(ksiConfiguration.checkboxWarning);
      expect(hideWarning).toHaveBeenCalledWith(ksiConfiguration.pubStringInputWarning);
      expect(hideWarning).toHaveBeenCalledWith(ksiConfiguration.pubFileInputWarning);
      expect(hideWarning).toHaveBeenCalledWith(ksiConfiguration.aggregatorInputWarning);
      expect(hideWarning).toHaveBeenCalledWith(ksiConfiguration.extenderInputWarning);
      expect(hideWarning).toHaveBeenCalledWith(ksiConfiguration.keyInputWarning);
      expect(hideWarning).toHaveBeenCalledWith(ksiConfiguration.calendarInputWarning);
    });
  });

  describe('initHashAlgorithmDropdown', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);

    test('inits hash algorithm dropdown', () => {
      Object.defineProperty(DefaultConfiguration, 'DEFAULT_CONFIGURATION', {
        get: jest.fn(() => {
          return {
            SUPPORTED_HASH_ALGORITHMS: ['SHA-256', 'SHA-384', 'SHA-512']
          };
        })
      });

      ksiConfiguration.fields.ksiHashAlgorithm = document.createElement('select');
      ksiConfiguration.configuration.ksiHashAlgorithm = 'SHA-384';
      ksiConfiguration.initHashAlgorithmDropdown();

      expect(ksiConfiguration.fields.ksiHashAlgorithm.outerHTML).toEqual(
        '<select>' +
          '<option value="SHA-256">SHA-256</option>' +
          '<option value="SHA-384">SHA-384</option>' +
          '<option value="SHA-512">SHA-512</option>' +
          '</select>'
      );

      expect(ksiConfiguration.fields.ksiHashAlgorithm.selectedIndex).toEqual(1);
    });
  });

  describe('trimWhitespace', () => {
    const ksiConfiguration = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
    test('trimWhitespace', () => {
      ksiConfiguration.fields.ksiExtenderUrl.value = 'test        ';
      ksiConfiguration.fields.ksiAggregatorUrl.value = '     test        ';
      ksiConfiguration.fields.ksiPubFile.value = 'test';

      ksiConfiguration.trimWhitespaces();

      expect(ksiConfiguration.fields.ksiExtenderUrl.value).toEqual('test');
      expect(ksiConfiguration.fields.ksiAggregatorUrl.value).toEqual('test');
      expect(ksiConfiguration.fields.ksiPubFile.value).toEqual('test');
    });
  });

  describe('disableFeatures', () => {
    test('hides aggregator and hash algorithm rows when signing disabled', () => {
      jest.spyOn(DefaultConfiguration, 'DEFAULT_CONFIGURATION', 'get').mockReturnValue({
        CAN_SIGN: false,
        CAN_EXTEND: true
      });
      document.body.innerHTML = `<div class="row"><div><input id="ksiAggregatorUrlField"></div> </div>
          <div class="row"><div><select id="ksiHashAlgorithmSelect"></select></div></div>`;
      ksiConfigurationConfig.fields.ksiAggregatorUrl = document.getElementById('ksiAggregatorUrlField');
      ksiConfigurationConfig.fields.ksiHashAlgorithm = document.getElementById('ksiHashAlgorithmSelect');

      const config = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
      config.disableFeatures();

      expect(ksiConfigurationConfig.fields.ksiAggregatorUrl.parentNode.parentNode.getAttribute('hidden')).toBe('true');
      expect(ksiConfigurationConfig.fields.ksiHashAlgorithm.parentNode.parentNode.getAttribute('hidden')).toBe('true');
    });

    test('hides extend row when no extension disabled', () => {
      jest.spyOn(DefaultConfiguration, 'DEFAULT_CONFIGURATION', 'get').mockReturnValue({ CAN_EXTEND: false });
      document.body.innerHTML = `<div class="row"><div><input id="ksiExtenderUrlField"></div></div>`;
      ksiConfigurationConfig.fields.ksiExtenderUrl = document.getElementById('ksiExtenderUrlField');

      const config = new KSIConfiguration(ksiConfigurationConfig, overlayManager);
      config.disableFeatures();

      expect(ksiConfigurationConfig.fields.ksiExtenderUrl.parentNode.parentNode.getAttribute('hidden')).toBe('true');
    });
  });
});
