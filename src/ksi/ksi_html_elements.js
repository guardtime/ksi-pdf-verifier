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
export function getKsiHtmlElements() {
  return {
    ksiConfiguration: {
      overlayName: 'ksiConfigurationOverlay',
      container: document.getElementById('ksiConfigurationOverlay'),
      verificationMethodsCollapsible: document.getElementById('verificationMethodsCollapsible'),
      configurationFieldsCollapsible: document.getElementById('configMethodsCollapsible'),
      checkboxWarning: document.getElementById('ksiConfigurationCheckboxWarning'),
      pubStringInputWarning: document.getElementById('ksiConfigurationPubStringInputWarning'),
      pubFileInputWarning: document.getElementById('ksiConfigurationPubFileInputWarning'),
      aggregatorInputWarning: document.getElementById('ksiConfigurationAggregatorInputWarning'),
      extenderInputWarning: document.getElementById('ksiConfigurationExtenderInputWarning'),
      keyInputWarning: document.getElementById('ksiConfigurationKeyInputWarning'),
      calendarInputWarning: document.getElementById('ksiConfigurationCalendarInputWarning'),
      fields: {
        ksiPubFile: document.getElementById('ksiPubFileField'),
        ksiPubString: document.getElementById('ksiPubStringField'),
        ksiAggregatorUrl: document.getElementById('ksiAggregatorUrlField'),
        ksiExtenderUrl: document.getElementById('ksiExtenderUrlField'),
        ksiLoginId: document.getElementById('ksiLoginIdField'),
        ksiLoginKey: document.getElementById('ksiLoginKeyField'),
        ksiHashAlgorithm: document.getElementById('ksiHashAlgorithmSelect'),
        userPublicationBasedVerification: document.getElementById('userPublicationBasedVerification'),
        publicationBasedVerification: document.getElementById('publicationBasedVerification'),
        calendarBasedVerification: document.getElementById('calendarBasedVerification'),
        keyBasedVerification: document.getElementById('keyBasedVerification'),
        verificationDefault: document.getElementById('verificationDefault')
      }
    },
    ksiErrorWrapper: {
      container: document.getElementById('ksiErrorWrapper'),
      errorMessage: document.getElementById('ksiErrorMessage'),
      closeButton: document.getElementById('ksiErrorClose'),
      errorMoreInfo: document.getElementById('ksiErrorMoreInfo'),
      moreInfoButton: document.getElementById('ksiErrorShowMore'),
      lessInfoButton: document.getElementById('ksiErrorShowLess')
    },
    ksiWarning: {
      overlayName: 'ksiWarningOverlay',
      container: document.getElementById('ksiWarningOverlay'),
      fields: {
        verificationMethodWarning: document.getElementById('ksiWarningVerificationMethod'),
        pubStringWarning: document.getElementById('ksiWarningPubString'),
        pubFileWarning: document.getElementById('ksiWarningPubFile'),
        keyWarning: document.getElementById('ksiWarningKey'),
        calendarWarning: document.getElementById('ksiWarningCalendar')
      }
    },
    ksiDownloadWrapper: {
      container: document.getElementById('ksiDownloadWrapper'),
      button: document.getElementById('downloadDocument'),
      label: document.getElementById('downloadMessage')
    },
    ksiNetworkErrorWrapper: {
      container: document.getElementById('ksiNetworkErrorWrapper')
    },
    sidebar: {
      ksiSignaturesView: document.getElementById('ksiSignaturesView')
    }
  };
}
