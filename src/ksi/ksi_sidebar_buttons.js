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
import { isAggregatorConfValid, isExtenderConfValid } from './ksi_warning_util';
import { DefaultConfiguration } from './ksi_default_configuration';
import { KsiPdfSigner } from './ksipdftool/ksi_pdf_signer';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';

const CONFIG_BUTTON_ID = 'ksiSidebarConfigButton';
const EXTEND_BUTTON_ID = 'ksiSidebarExtendButton';
const SIGN_BUTTON_ID = 'ksiSidebarSignButton';

export class KsiSidebarButtons {
  constructor(container) {
    // XXX: how this variable is used
    this.container = container;
  }

  async createButtons(signatureAnnotations, verification, pdfBytes, containerDiv) {
    // XXX: needs to be pulled up
    const isEncrypted = KsiPdfSigner.isEncrypted(pdfBytes);
    const isCorrupted = KsiPdfSigner.isCorrupted(pdfBytes);

    if (!DefaultConfiguration.DEFAULT_CONFIGURATION.READ_ONLY) {
      await this.createConfigButton(containerDiv);
    }
    if (DefaultConfiguration.DEFAULT_CONFIGURATION.CAN_EXTEND) {
      await this.createExtendButton(containerDiv, signatureAnnotations, verification, isEncrypted, isCorrupted);
    }
    if (DefaultConfiguration.DEFAULT_CONFIGURATION.CAN_SIGN) {
      await this.createSignButton(containerDiv, isEncrypted, isCorrupted);
    }
  }

  async createConfigButton(buttonsDiv) {
    const title = await PDFViewerApplication.l10n.get('ksi_configuration_label', null, 'KSI Configuration');
    const configButton = this.createButton(
      CONFIG_BUTTON_ID,
      title,
      title,
      // XXX: needs to be pulled up
      PDFViewerApplication.ksiConfiguration.open,
      false
    );
    buttonsDiv.appendChild(configButton);
  }

  async createExtendButton(buttonsDiv, signatureAnnotations, verification, isEncrypted, isCorrupted) {
    const { title, innerHTML, disabled } = await this.getExtendButtonTitleAndHTMLAndDisabled(
      signatureAnnotations,
      verification,
      isEncrypted,
      isCorrupted
    );
    const extendButtonDiv = this.createButton(
      EXTEND_BUTTON_ID,
      title,
      innerHTML,
      // XXX: needs to be pulled up
      PDFViewerApplication.ksiSignatureViewer.extend,
      disabled
    );
    buttonsDiv.appendChild(extendButtonDiv);
  }

  async createSignButton(buttonsDiv, isEncrypted, isCorrupted) {
    const { title, innerHTML, disabled } = await this.getSignButtonTitleAndHTMLAndDisabled(isEncrypted, isCorrupted);
    const signButtonDiv = this.createButton(
      SIGN_BUTTON_ID,
      title,
      innerHTML,
      // XXX: needs to be pulled up
      PDFViewerApplication.ksiSignatureViewer.sign,
      disabled
    );
    buttonsDiv.appendChild(signButtonDiv);
  }

  // XXX: it's about validation of context not button titles
  async getExtendButtonTitleAndHTMLAndDisabled(signatureAnnotations, verification, isEncrypted, isCorrupted) {
    const {
      ksiExtenderUrlValue,
      ksiLoginIdValue,
      ksiLoginKeyValue
    } = PDFViewerApplication.ksiConfiguration.configuration;
    let title = await PDFViewerApplication.l10n.get('ksi_sidebar_extend', null, 'Extend latest signature');
    const innerHTML = title;
    let disabled = false;
    if (isCorrupted) {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_extend_disabled_corrupted_document',
        null,
        'Extending is disabled because corrupted documents are not supported'
      );
      disabled = true;
    } else if (!isExtenderConfValid({ ksiExtenderUrlValue, ksiLoginIdValue, ksiLoginKeyValue })) {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_extend_disabled_extender_conf',
        null,
        'Extender configuration is invalid: missing valid Extender URL or Login ID / Login Key'
      );
      disabled = true;
    } else if (!signatureAnnotations.length) {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_extend_disabled_signatures_missing',
        null,
        'Extending is disabled because document does not contain any KSI signatures'
      );
      disabled = true;
    } else if (isEncrypted) {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_extend_disabled_encrypted_document',
        null,
        'Extending is disabled because encrypted documents are not supported'
      );
      disabled = true;
    } else if (verification.status !== 'VERIFIED') {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_extend_disabled_invalid_verification',
        null,
        'Extending is disabled because signature is invalid or incomplete'
      );
      disabled = true;
    }
    return { title, innerHTML, disabled };
  }

  async getSignButtonTitleAndHTMLAndDisabled(isEncrypted, isCorrupted) {
    const {
      ksiAggregatorUrlValue,
      ksiLoginIdValue,
      ksiLoginKeyValue
    } = PDFViewerApplication.ksiConfiguration.configuration;
    let title = await PDFViewerApplication.l10n.get('ksi_sidebar_sign', null, 'Sign file');
    const innerHTML = title;
    let disabled = false;
    if (isCorrupted) {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_sign_disabled_corrupted_document',
        null,
        'Signing is disabled because corrupted documents are not supported'
      );
      disabled = true;
    } else if (!isAggregatorConfValid({ ksiAggregatorUrlValue, ksiLoginIdValue, ksiLoginKeyValue })) {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_sign_disabled_aggregator_conf',
        null,
        'Aggregator configuration is invalid: missing valid Aggregator URL or Login ID / Login Key'
      );
      disabled = true;
    } else if (isEncrypted) {
      title = await PDFViewerApplication.l10n.get(
        'ksi_sidebar_sign_disabled_encrypted_document',
        null,
        'Signing is disabled because encrypted documents are not supported'
      );
      disabled = true;
    }
    return { title, innerHTML, disabled };
  }

  createButton(id, title, innerHTML, onClickHandler, disabled) {
    const button = document.createElement('button');
    button.id = id;
    button.title = title;
    button.innerHTML = innerHTML;
    button.onclick = onClickHandler;
    button.disabled = disabled;
    button.classList.add('ksiButton', 'ksiButton--neutral');
    return button;
  }

  toggleExtendButtonDisabled(disabled) {
    this.toggleButtonDisabledIfExists(EXTEND_BUTTON_ID, disabled);
  }

  toggleSignButtonDisabled(disabled) {
    this.toggleButtonDisabledIfExists(SIGN_BUTTON_ID, disabled);
  }

  toggleButtonDisabledIfExists(id, disabled) {
    const button = document.getElementById(id);
    if (button) {
      button.disabled = disabled;
    }
  }
}
