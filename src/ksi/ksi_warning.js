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
} from './ksi_warning_util';

class KSIWarning {
  constructor(ksiConfiguration, { overlayName, container, fields }, overlayManager) {
    this.ksiConfiguration = ksiConfiguration;
    this.overlayName = overlayName;
    this.container = container;
    this.overlayManager = overlayManager;
    this.verificationMethodWarning = fields.verificationMethodWarning;
    this.pubStringWarning = fields.pubStringWarning;
    this.pubFileWarning = fields.pubFileWarning;
    this.keyWarning = fields.keyWarning;
    this.calendarWarning = fields.calendarWarning;

    this.overlayManager.register(this.overlayName, this.container, this.close.bind(this));
  }

  openConfiguration() {
    this.close();
    this.ksiConfiguration.open(true);
  }

  openIfConfigurationIsInvalid() {
    this.showWarningOverlay = false;
    this.toggleWarnings();
    if (this.showWarningOverlay) {
      this.overlayManager.open(this.overlayName);
    }
  }

  close() {
    this.overlayManager.close(this.overlayName);
  }

  toggleWarnings() {
    const { configuration } = this.ksiConfiguration;
    this.toggleWarning(isAtLeastOneValidationMethodChecked, this.verificationMethodWarning, configuration);
    this.toggleWarning(isPubStringInputValid, this.pubStringWarning, configuration);
    this.toggleWarning(isPubFileInputValid, this.pubFileWarning, configuration);
    this.toggleWarning(isKeyInputValid, this.keyWarning, configuration);
    this.toggleWarning(isCalendarInputValid, this.calendarWarning, configuration);
  }

  toggleWarning(validationFunction, warning, inputs) {
    if (!validationFunction(inputs)) {
      showWarning(warning);
      this.showWarningOverlay = true;
    } else {
      hideWarning(warning);
    }
  }
}

export { KSIWarning };
