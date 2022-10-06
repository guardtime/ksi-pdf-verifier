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
} from './ksi_warning_util';
import { DefaultConfiguration } from './ksi_default_configuration';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

class KSIConfiguration {
  constructor(
    {
      overlayName,
      fields,
      container,
      verificationMethodsCollapsible,
      configurationFieldsCollapsible,
      checkboxWarning,
      pubStringInputWarning,
      pubFileInputWarning,
      aggregatorInputWarning,
      extenderInputWarning,
      keyInputWarning,
      calendarInputWarning
    },
    overlayManager
  ) {
    this.overlayName = overlayName;
    this.fields = fields;
    this.container = container;
    this.verificationMethodsCollapsible = verificationMethodsCollapsible;
    this.configurationFieldsCollapsible = configurationFieldsCollapsible;
    this.checkboxWarning = checkboxWarning;
    this.pubStringInputWarning = pubStringInputWarning;
    this.pubFileInputWarning = pubFileInputWarning;
    this.aggregatorInputWarning = aggregatorInputWarning;
    this.extenderInputWarning = extenderInputWarning;
    this.keyInputWarning = keyInputWarning;
    this.calendarInputWarning = calendarInputWarning;
    this.overlayManager = overlayManager;

    this.configuration = {};

    this.setBrowserPasswordStorageUsability();
    this.overlayManager.register(this.overlayName, this.container, this.close.bind(this));
    this.open = this.open.bind(this);
    this.disableFeatures();
  }

  initHashAlgorithmDropdown() {
    const hashAlgorithms = DefaultConfiguration.DEFAULT_CONFIGURATION['SUPPORTED_HASH_ALGORITHMS'];
    const dropdown = this.fields.ksiHashAlgorithm;
    dropdown.innerHTML = '';
    let selectedIndex = 0;
    for (let i = 0; i < hashAlgorithms.length; i++) {
      const algorithm = hashAlgorithms[i];
      const el = document.createElement('option');
      el.textContent = algorithm;
      el.value = algorithm;
      if (algorithm === this.configuration.ksiHashAlgorithm) {
        selectedIndex = i;
      }
      dropdown.appendChild(el);
    }
    dropdown.selectedIndex = selectedIndex;
  }

  async open(isConfigMethodsCollapsibleOpen = false) {
    this.loadConfiguration();
    this.toggleVerification();
    await this.loadCredentials();
    this.initHashAlgorithmDropdown();
    this.disableFeatures();
    this.overlayManager.open(this.overlayName);
    if (typeof isConfigMethodsCollapsibleOpen === 'boolean' && isConfigMethodsCollapsibleOpen) {
      this.toggleCollapsible(this.configurationFieldsCollapsible);
    }
  }

  disableFeatures() {
    if (!DefaultConfiguration.DEFAULT_CONFIGURATION.CAN_SIGN) {
      this.fields.ksiAggregatorUrl.closest('.row').setAttribute('hidden', true);
    }
    if (!DefaultConfiguration.DEFAULT_CONFIGURATION.CAN_EXTEND) {
      this.fields.ksiExtenderUrl.closest('.row').setAttribute('hidden', true);
    }
    if (
      !DefaultConfiguration.DEFAULT_CONFIGURATION.CAN_SIGN ||
      !DefaultConfiguration.DEFAULT_CONFIGURATION.CAN_EXTEND
    ) {
      this.fields.ksiHashAlgorithm.closest('.row').setAttribute('hidden', true);
    }
  }

  resetConfiguration() {
    this.clearLocalStorageIfPossible();
    this.loadConfiguration();
    this.clearCredentials();
    this.initHashAlgorithmDropdown();
  }

  clearVerification() {
    try {
      localStorage.removeItem('userPublicationBasedVerification');
      localStorage.removeItem('publicationBasedVerification');
      localStorage.removeItem('calendarBasedVerification');
      localStorage.removeItem('keyBasedVerification');
    } catch (e) {}
  }

  clearLocalStorageIfPossible() {
    try {
      localStorage.removeItem('ksiPubFile');
      localStorage.removeItem('ksiPubString');
      localStorage.removeItem('ksiAggregatorUrl');
      localStorage.removeItem('ksiExtenderUrl');
      localStorage.removeItem('ksiHashAlgorithm');
      this.clearVerification();
    } catch (e) {}
  }

  toggleVerification() {
    const verificationElement = document.getElementById('verificationMethodsContent');
    if (!this.fields.verificationDefault.checked) {
      verificationElement.style.height = 'auto';
    } else {
      this.configuration.verificationDefault = this.fields.verificationDefault.checked = 'true';
      verificationElement.style.height = null;
      this.clearVerification();
      this.loadVerification();
    }
  }

  toggleCollapsible(element) {
    element.classList.toggle('active');
    Array.from(element.children).forEach(child => {
      this.toggleArrowIcon(child);
    });
    this.toggleHeight(element);
  }

  toggleArrowIcon(item) {
    if (item.classList.contains('arrow-down')) {
      item.classList.remove('arrow-down');
      item.classList.add('arrow-right');
    } else if (item.classList.contains('arrow-right')) {
      item.classList.remove('arrow-right');
      item.classList.add('arrow-down');
    }
  }

  toggleHeight(element) {
    const content = element.nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }

  setBrowserPasswordStorageUsability() {
    const { credentials } = navigator;
    // eslint-disable-next-line no-undef
    if (credentials && credentials.preventSilentAccess && typeof PasswordCredential !== 'undefined') {
      this.useBrowserPasswordStorage = true;
    } else {
      this.disableBrowserPasswordManager();
      this.useBrowserPasswordStorage = false;
    }
  }

  disableBrowserPasswordManager() {
    const { ksiLoginId, ksiLoginKey } = this.fields;
    ksiLoginId.setAttribute('readonly', 'true');
    ksiLoginId.onfocus = function(e) {
      e.target.removeAttribute('readonly');
    };

    ksiLoginKey.setAttribute('readonly', 'true');
    ksiLoginKey.onfocus = function(e) {
      e.target.removeAttribute('readonly');
    };
  }

  loadVerification() {
    this.configuration.userPublicationBasedVerificationValue = this.fields.userPublicationBasedVerification.checked =
      this.getFromLocalStorage('userPublicationBasedVerification') === 'true';
    this.configuration.publicationBasedVerificationValue = this.fields.publicationBasedVerification.checked =
      this.defaultToTrue('publicationBasedVerification') === 'true';
    this.configuration.calendarBasedVerificationValue = this.fields.calendarBasedVerification.checked =
      this.getFromLocalStorage('calendarBasedVerification') === 'true';
    this.configuration.keyBasedVerificationValue = this.fields.keyBasedVerification.checked =
      this.defaultToTrue('keyBasedVerification') === 'true';
  }

  loadConfiguration() {
    this.configuration.ksiPubFileValue = this.fields.ksiPubFile.value = this.defaultToAppOptions(
      'ksiPubFile',
      'PUBLICATION_FILE_URL'
    );
    this.configuration.ksiPubStringValue = this.fields.ksiPubString.value = this.defaultToAppOptions(
      'ksiPubString',
      'PUBLICATION_STRING'
    );
    this.configuration.ksiExtenderUrlValue = this.fields.ksiExtenderUrl.value = this.defaultToAppOptions(
      'ksiExtenderUrl',
      'EXTENDER_URL'
    );
    this.configuration.ksiAggregatorUrlValue = this.fields.ksiAggregatorUrl.value = this.defaultToAppOptions(
      'ksiAggregatorUrl',
      'AGGREGATOR_URL'
    );
    this.configuration.ksiHashAlgorithm = this.defaultToAppOptions('ksiHashAlgorithm', 'HASH_ALGORITHM');
    this.configuration.verificationDefault = this.fields.verificationDefault.checked =
      this.defaultToTrue('verificationDefault') === 'true';
    this.loadVerification();
  }

  async loadCredentials() {
    const { ksiLoginId, ksiLoginKey } = this.fields;
    if (this.useBrowserPasswordStorage) {
      const credentials = await navigator.credentials.get({ password: true });
      if (credentials) {
        this.configuration.ksiLoginIdValue = ksiLoginId.value = credentials.id;
        this.configuration.ksiLoginKeyValue = ksiLoginKey.value = credentials.password;
        return;
      }
    }
    this.configuration.ksiLoginIdValue = ksiLoginId.value;
    this.configuration.ksiLoginKeyValue = ksiLoginKey.value;
  }

  clearCredentials() {
    const { ksiLoginId, ksiLoginKey } = this.fields;
    this.configuration.ksiLoginIdValue = ksiLoginId.value = '';
    this.configuration.ksiLoginKeyValue = ksiLoginKey.value = '';
  }

  getFromLocalStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  defaultToTrue(key) {
    const value = this.getFromLocalStorage(key);
    if (value === 'undefined' || value === '' || value === null) {
      return 'true';
    }
    return value;
  }

  defaultToAppOptions(key, optionName) {
    const value = this.getFromLocalStorage(key);
    return value === null ? DefaultConfiguration.DEFAULT_CONFIGURATION[optionName] : value;
  }

  close() {
    this.hideWarnings();
    this.overlayManager.close(this.overlayName);
  }

  async save() {
    this.isSaveAllowed = true;
    this.trimWhitespaces();
    this.toggleWarnings();
    if (this.isSaveAllowed) {
      this.saveConfiguration();
      await PDFViewerApplication.ksiSignatureViewer.reInitializeServiceAndPolicyAndReRender();
      this.close();
    }
  }

  trimWhitespaces() {
    this.fields.ksiExtenderUrl.value = this.fields.ksiExtenderUrl.value.trim();
    this.fields.ksiAggregatorUrl.value = this.fields.ksiAggregatorUrl.value.trim();
    this.fields.ksiPubFile.value = this.fields.ksiPubFile.value.trim();
  }

  toggleWarnings() {
    this.toggleWarning(isAtLeastOneValidationMethodChecked, this.checkboxWarning, this.getCheckBoxWarningInputs());
    this.toggleWarning(isPubStringInputValid, this.pubStringInputWarning, this.getPubStringWarningInputs());
    this.toggleWarning(isPubFileInputValid, this.pubFileInputWarning, this.getPubFileWarningInputs());
    this.toggleWarning(isAggregatorInputValid, this.aggregatorInputWarning, this.getAggregatorUrlWarningInputs());
    this.toggleWarning(isExtenderInputValid, this.extenderInputWarning, this.getExtenderUrlWarningInputs());
    this.toggleWarning(isKeyInputValid, this.keyInputWarning, this.getKeyWarningInputs());
    this.toggleWarning(isCalendarInputValid, this.calendarInputWarning, this.getCalendarWarningInputs());
  }

  toggleWarning(validationFunction, warning, inputs) {
    if (!validationFunction(inputs)) {
      showWarning(warning);
      this.isSaveAllowed = false;
    } else {
      hideWarning(warning);
    }
  }

  getCheckBoxWarningInputs() {
    return {
      userPublicationBasedVerificationValue: this.fields.userPublicationBasedVerification.checked,
      publicationBasedVerificationValue: this.fields.publicationBasedVerification.checked,
      calendarBasedVerificationValue: this.fields.calendarBasedVerification.checked,
      keyBasedVerificationValue: this.fields.keyBasedVerification.checked
    };
  }

  getPubStringWarningInputs() {
    return {
      userPublicationBasedVerificationValue: this.fields.userPublicationBasedVerification.checked,
      ksiPubStringValue: this.fields.ksiPubString.value
    };
  }

  getPubFileWarningInputs() {
    return {
      publicationBasedVerificationValue: this.fields.publicationBasedVerification.checked,
      ksiPubFileValue: this.fields.ksiPubFile.value
    };
  }

  getAggregatorUrlWarningInputs() {
    return {
      ksiAggregatorUrlValue: this.fields.ksiAggregatorUrl.value,
      ksiLoginIdValue: this.fields.ksiLoginId.value,
      ksiLoginKeyValue: this.fields.ksiLoginKey.value
    };
  }

  getExtenderUrlWarningInputs() {
    return {
      ksiExtenderUrlValue: this.fields.ksiExtenderUrl.value,
      ksiLoginIdValue: this.fields.ksiLoginId.value,
      ksiLoginKeyValue: this.fields.ksiLoginKey.value
    };
  }

  getKeyWarningInputs() {
    return {
      keyBasedVerificationValue: this.fields.keyBasedVerification.checked,
      ksiPubFileValue: this.fields.ksiPubFile.value
    };
  }

  getCalendarWarningInputs() {
    return {
      calendarBasedVerificationValue: this.fields.calendarBasedVerification.checked,
      ksiExtenderUrlValue: this.fields.ksiExtenderUrl.value,
      ksiLoginIdValue: this.fields.ksiLoginId.value,
      ksiLoginKeyValue: this.fields.ksiLoginKey.value
    };
  }

  saveConfiguration() {
    this.saveConfigurationToLocalStorageIfPossible();
    this.saveConfigurationToMemory();
    this.saveCredentials();
  }

  saveConfigurationToMemory() {
    this.configuration.ksiPubFileValue = this.fields.ksiPubFile.value;
    this.configuration.ksiPubStringValue = this.fields.ksiPubString.value;
    this.configuration.ksiAggregatorUrlValue = this.fields.ksiAggregatorUrl.value;
    this.configuration.ksiExtenderUrlValue = this.fields.ksiExtenderUrl.value;
    this.configuration.ksiHashAlgorithm = this.fields.ksiHashAlgorithm.options[
      this.fields.ksiHashAlgorithm.selectedIndex
    ].value;
    this.configuration.userPublicationBasedVerificationValue = this.fields.userPublicationBasedVerification.checked;
    this.configuration.publicationBasedVerificationValue = this.fields.publicationBasedVerification.checked;
    this.configuration.calendarBasedVerificationValue = this.fields.calendarBasedVerification.checked;
    this.configuration.keyBasedVerificationValue = this.fields.keyBasedVerification.checked;
  }

  saveConfigurationToLocalStorageIfPossible() {
    try {
      localStorage.setItem('ksiPubFile', this.fields.ksiPubFile.value);
      localStorage.setItem('ksiPubString', this.fields.ksiPubString.value);
      localStorage.setItem('ksiAggregatorUrl', this.fields.ksiAggregatorUrl.value);
      localStorage.setItem('ksiExtenderUrl', this.fields.ksiExtenderUrl.value);
      localStorage.setItem(
        'ksiHashAlgorithm',
        this.fields.ksiHashAlgorithm.options[this.fields.ksiHashAlgorithm.selectedIndex].value
      );
      localStorage.setItem('userPublicationBasedVerification', this.fields.userPublicationBasedVerification.checked);
      localStorage.setItem('publicationBasedVerification', this.fields.publicationBasedVerification.checked);
      localStorage.setItem('calendarBasedVerification', this.fields.calendarBasedVerification.checked);
      localStorage.setItem('keyBasedVerification', this.fields.keyBasedVerification.checked);
      localStorage.setItem('verificationDefault', this.fields.verificationDefault.checked);
    } catch (e) {}
  }

  saveCredentials() {
    const { ksiLoginId, ksiLoginKey } = this.fields;
    const id = (this.configuration.ksiLoginIdValue = ksiLoginId.value);
    const password = (this.configuration.ksiLoginKeyValue = ksiLoginKey.value);
    if (this.useBrowserPasswordStorage && id && password) {
      // eslint-disable-next-line no-undef
      const cred = new PasswordCredential({ id, password });
      navigator.credentials.store(cred);
    }
  }

  hideWarnings() {
    hideWarning(this.checkboxWarning);
    hideWarning(this.pubStringInputWarning);
    hideWarning(this.pubFileInputWarning);
    hideWarning(this.aggregatorInputWarning);
    hideWarning(this.extenderInputWarning);
    hideWarning(this.keyInputWarning);
    hideWarning(this.calendarInputWarning);
  }
}

export { KSIConfiguration };
