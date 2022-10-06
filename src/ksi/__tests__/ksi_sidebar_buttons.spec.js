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
  INVALID_URL,
  INVALID_VERIFICATION_RESULT,
  KSI_AGGREGATOR_URL,
  KSI_EXTENDER_URL,
  KSI_LOGIN_ID,
  KSI_LOGIN_KEY,
  PDF_BYTES,
  VERIFICATION_RESULT
} from './test-util/common_test_data';
import { isAggregatorConfValid, isExtenderConfValid } from '../ksi_warning_util';
import { ANNOTATION } from './test-util/annotation_test_data';
import { DefaultConfiguration } from '../ksi_default_configuration';
import { KsiPdfSigner } from '../ksipdftool/ksi_pdf_signer';
import { KsiSidebarButtons } from '../ksi_sidebar_buttons';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';

jest.mock('../ksi_warning_util', () => {
  return {
    isAggregatorConfValid: jest.fn(),
    isExtenderConfValid: jest.fn()
  };
});

PDFViewerApplication.l10n = {
  get: jest.fn()
};

describe('KsiSidebarButtons', () => {
  const SIDEBAR_CONTAINER = { appendChild: jest.fn() };
  const CONFIG_BUTTON_ID = 'ksiSidebarConfigButton';
  const EXTEND_BUTTON_ID = 'ksiSidebarExtendButton';
  const SIGN_BUTTON_ID = 'ksiSidebarSignButton';
  const CONFIG_BUTTON_LABEL = 'KSI Configuration';

  describe('constructor', () => {
    test('constructor', () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      expect(ksiSidebarButtons.container).toEqual(SIDEBAR_CONTAINER);
    });
  });
  describe('disabling features', () => {
    const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);
    KsiPdfSigner.isEncrypted = jest.fn();
    KsiPdfSigner.isCorrupted = jest.fn();
    ksiSidebarButtons.createConfigButton = jest.fn();
    ksiSidebarButtons.createExtendButton = jest.fn();
    ksiSidebarButtons.createSignButton = jest.fn();

    test('no extend button when extending is disabled in configuration', async () => {
      jest.spyOn(DefaultConfiguration, 'DEFAULT_CONFIGURATION', 'get').mockReturnValue({
        CAN_SIGN: true,
        CAN_EXTEND: false
      });

      await ksiSidebarButtons.createButtons();

      expect(ksiSidebarButtons.createConfigButton).toHaveBeenCalled();
      expect(ksiSidebarButtons.createSignButton).toHaveBeenCalled();
      expect(ksiSidebarButtons.createExtendButton).not.toHaveBeenCalled();
    });

    test('no sign button when signing disabled in configuration', async () => {
      jest.spyOn(DefaultConfiguration, 'DEFAULT_CONFIGURATION', 'get').mockReturnValue({
        CAN_SIGN: false,
        CAN_EXTEND: true
      });

      await ksiSidebarButtons.createButtons();

      expect(ksiSidebarButtons.createConfigButton).toHaveBeenCalled();
      expect(ksiSidebarButtons.createExtendButton).toHaveBeenCalled();
      expect(ksiSidebarButtons.createSignButton).not.toHaveBeenCalled();
    });

    test('no config button when READ_ONLY configured', async () => {
      jest.spyOn(DefaultConfiguration, 'DEFAULT_CONFIGURATION', 'get').mockReturnValue({
        CAN_SIGN: false,
        CAN_EXTEND: true,
        READ_ONLY: true
      });

      await ksiSidebarButtons.createButtons();

      expect(ksiSidebarButtons.createConfigButton).not.toHaveBeenCalled();
      expect(ksiSidebarButtons.createExtendButton).toHaveBeenCalled();
      expect(ksiSidebarButtons.createSignButton).not.toHaveBeenCalled();
    });
  });

  describe('createButtons', () => {
    test('creates config, extend and sign buttons; adds them to sidebar', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const buttonsDiv = document.createElement('div');

      buttonsDiv.classList.add('ksiSignatures-footer');

      KsiPdfSigner.isEncrypted = jest.fn();
      KsiPdfSigner.isCorrupted = jest.fn();
      ksiSidebarButtons.createConfigButton = jest.fn();
      ksiSidebarButtons.createExtendButton = jest.fn();
      ksiSidebarButtons.createSignButton = jest.fn();

      when(KsiPdfSigner.isEncrypted)
        .calledWith(PDF_BYTES)
        .mockReturnValue(true);

      when(KsiPdfSigner.isCorrupted)
        .calledWith(PDF_BYTES)
        .mockReturnValue(false);

      await ksiSidebarButtons.createButtons([ANNOTATION], VERIFICATION_RESULT, PDF_BYTES, buttonsDiv);

      expect(ksiSidebarButtons.createConfigButton).toHaveBeenCalledWith(buttonsDiv);
      expect(ksiSidebarButtons.createExtendButton).toHaveBeenCalledWith(
        buttonsDiv,
        [ANNOTATION],
        VERIFICATION_RESULT,
        true,
        false
      );
      expect(ksiSidebarButtons.createSignButton).toHaveBeenCalledWith(buttonsDiv, true, false);
    });

    test('creates config, extend and sign buttons; adds them to sidebar, disabled', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const buttonsDiv = document.createElement('div');

      buttonsDiv.classList.add('ksiSignatures-footer');

      KsiPdfSigner.isEncrypted = jest.fn();
      KsiPdfSigner.isCorrupted = jest.fn();
      ksiSidebarButtons.createConfigButton = jest.fn();
      ksiSidebarButtons.createExtendButton = jest.fn();
      ksiSidebarButtons.createSignButton = jest.fn();

      when(KsiPdfSigner.isEncrypted)
        .calledWith(PDF_BYTES)
        .mockReturnValue(true);

      when(KsiPdfSigner.isCorrupted)
        .calledWith(PDF_BYTES)
        .mockReturnValue(true);

      await ksiSidebarButtons.createButtons([ANNOTATION], VERIFICATION_RESULT, PDF_BYTES, buttonsDiv);

      expect(ksiSidebarButtons.createConfigButton).toHaveBeenCalledWith(buttonsDiv);
      expect(ksiSidebarButtons.createExtendButton).toHaveBeenCalledWith(
        buttonsDiv,
        [ANNOTATION],
        VERIFICATION_RESULT,
        true,
        true
      );
      expect(ksiSidebarButtons.createSignButton).toHaveBeenCalledWith(buttonsDiv, true, true);
    });
  });

  describe('createConfigButton', () => {
    test('creates a configuration button and appends it to buttonsDiv', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      PDFViewerApplication.ksiConfiguration = {
        open: jest.fn()
      };

      const buttonsDiv = { appendChild: jest.fn() };
      const configButton = jest.fn();

      ksiSidebarButtons.createButton = jest.fn();

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_configuration_label', null, CONFIG_BUTTON_LABEL)
        .mockResolvedValue(CONFIG_BUTTON_LABEL);
      when(ksiSidebarButtons.createButton)
        .calledWith(
          CONFIG_BUTTON_ID,
          CONFIG_BUTTON_LABEL,
          CONFIG_BUTTON_LABEL,
          PDFViewerApplication.ksiConfiguration.open,
          false
        )
        .mockReturnValue(configButton);

      await ksiSidebarButtons.createConfigButton(buttonsDiv);

      expect(buttonsDiv.appendChild).toHaveBeenCalledWith(configButton);
    });
  });

  describe('createExtendButton', () => {
    test('creates an extend button and appends it to buttonsDiv', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      PDFViewerApplication.ksiSignatureViewer = {
        extend: jest.fn()
      };

      const buttonsDiv = { appendChild: jest.fn() };
      const extendButtonLabel = 'Extend latest signature';
      const extendButton = jest.fn();

      ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled = jest.fn();
      ksiSidebarButtons.createButton = jest.fn();

      when(ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled)
        .calledWith([ANNOTATION], false)
        .mockResolvedValue({ title: extendButtonLabel, innerHTML: extendButtonLabel, disabled: false });
      when(ksiSidebarButtons.createButton)
        .calledWith(
          EXTEND_BUTTON_ID,
          extendButtonLabel,
          extendButtonLabel,
          PDFViewerApplication.ksiSignatureViewer.extend,
          false
        )
        .mockReturnValue(extendButton);

      await ksiSidebarButtons.createExtendButton(buttonsDiv, [ANNOTATION], false);

      expect(buttonsDiv.appendChild).toHaveBeenCalledWith(extendButton);
    });
  });

  describe('createSignButton', () => {
    test('creates a sign button and appends it to buttonsDiv', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      PDFViewerApplication.ksiSignatureViewer = {
        sign: jest.fn()
      };

      const buttonsDiv = { appendChild: jest.fn() };
      const signButtonLabel = 'Sign file';
      const signButton = jest.fn();

      ksiSidebarButtons.getSignButtonTitleAndHTMLAndDisabled = jest.fn();
      ksiSidebarButtons.createButton = jest.fn();

      when(ksiSidebarButtons.getSignButtonTitleAndHTMLAndDisabled)
        .calledWith(false)
        .mockResolvedValue({ title: signButtonLabel, innerHTML: signButtonLabel, disabled: false });
      when(ksiSidebarButtons.createButton)
        .calledWith(
          SIGN_BUTTON_ID,
          signButtonLabel,
          signButtonLabel,
          PDFViewerApplication.ksiSignatureViewer.sign,
          false
        )
        .mockReturnValue(signButton);

      await ksiSidebarButtons.createSignButton(buttonsDiv, false);

      expect(buttonsDiv.appendChild).toHaveBeenCalledWith(signButton);
    });
  });

  describe('getExtendButtonTitleAndHTMLAndDisabled', () => {
    const extendButtonLabel = 'Extend latest signature';

    test('returns properties for enabled button', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isExtenderConfValid)
        .calledWith({
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend', null, extendButtonLabel)
        .mockResolvedValue(extendButtonLabel);

      expect(
        await ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled([ANNOTATION], VERIFICATION_RESULT, false)
      ).toEqual({
        disabled: false,
        innerHTML: extendButtonLabel,
        title: extendButtonLabel
      });
    });

    test('returns properties for disabled button (invalid extender config)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const extenderConfInvalid =
        'Extender configuration is invalid: missing valid Extender URL or Login ID / Login Key';

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiExtenderUrlValue: INVALID_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isExtenderConfValid)
        .calledWith({
          ksiExtenderUrlValue: INVALID_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(false);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend', null, extendButtonLabel)
        .mockResolvedValue(extendButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend_disabled_extender_conf', null, extenderConfInvalid)
        .mockResolvedValue(extenderConfInvalid);

      expect(
        await ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled([ANNOTATION], VERIFICATION_RESULT, false)
      ).toEqual({
        disabled: true,
        innerHTML: extendButtonLabel,
        title: extenderConfInvalid
      });
    });

    test('returns properties for disabled button (no signatures)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const signaturesMissing = 'Extending is disabled because document does not contain any KSI signatures';

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isExtenderConfValid)
        .calledWith({
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend', null, extendButtonLabel)
        .mockResolvedValue(extendButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend_disabled_signatures_missing', null, signaturesMissing)
        .mockResolvedValue(signaturesMissing);

      expect(await ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled([], null, false)).toEqual({
        disabled: true,
        innerHTML: extendButtonLabel,
        title: signaturesMissing
      });
    });

    test('returns properties for disabled button (encrypted PDF)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const encryptedDocument = 'Extending is disabled because encrypted documents are not supported';

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isExtenderConfValid)
        .calledWith({
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend', null, extendButtonLabel)
        .mockResolvedValue(extendButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend_disabled_encrypted_document', null, encryptedDocument)
        .mockResolvedValue(encryptedDocument);

      expect(
        await ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled([ANNOTATION], VERIFICATION_RESULT, true)
      ).toEqual({
        disabled: true,
        innerHTML: extendButtonLabel,
        title: encryptedDocument
      });
    });

    test('returns properties for disabled button (corrupted PDF)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const encryptedDocument = 'Extending is disabled because corrupted documents are not supported';

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isExtenderConfValid)
        .calledWith({
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend', null, extendButtonLabel)
        .mockResolvedValue(extendButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend_disabled_corrupted_document', null, encryptedDocument)
        .mockResolvedValue(encryptedDocument);

      expect(
        await ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled([ANNOTATION], VERIFICATION_RESULT, false, true)
      ).toEqual({
        disabled: true,
        innerHTML: extendButtonLabel,
        title: encryptedDocument
      });
    });

    test('returns properties for disabled button (last signature verification invalid or incomplete)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);
      const invalidVerification = 'Extending is disabled because signature is invalid or incomplete';
      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };
      when(isExtenderConfValid)
        .calledWith({
          ksiExtenderUrlValue: KSI_EXTENDER_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend', null, extendButtonLabel)
        .mockResolvedValue(extendButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_extend_disabled_invalid_verification', null, invalidVerification)
        .mockResolvedValue(invalidVerification);

      expect(
        await ksiSidebarButtons.getExtendButtonTitleAndHTMLAndDisabled([ANNOTATION], INVALID_VERIFICATION_RESULT, false)
      ).toEqual({
        disabled: true,
        innerHTML: extendButtonLabel,
        title: invalidVerification
      });
    });
  });

  describe('getSignButtonTitleAndHTMLAndDisabled', () => {
    const signButtonLabel = 'Sign file';

    test('returns properties for enabled button', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isAggregatorConfValid)
        .calledWith({
          ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_sign', null, signButtonLabel)
        .mockResolvedValue(signButtonLabel);

      expect(await ksiSidebarButtons.getSignButtonTitleAndHTMLAndDisabled(false)).toEqual({
        disabled: false,
        innerHTML: signButtonLabel,
        title: signButtonLabel
      });
    });

    test('returns properties for disabled button (invalid aggregator config)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const aggregatorConfInvalid =
        'Aggregator configuration is invalid: missing valid Aggregator URL or Login ID / Login Key';

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiAggregatorUrlValue: INVALID_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isAggregatorConfValid)
        .calledWith({
          ksiAggregatorUrlValue: INVALID_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(false);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_sign', null, signButtonLabel)
        .mockResolvedValue(signButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_sign_disabled_aggregator_conf', null, aggregatorConfInvalid)
        .mockResolvedValue(aggregatorConfInvalid);

      expect(await ksiSidebarButtons.getSignButtonTitleAndHTMLAndDisabled(false)).toEqual({
        disabled: true,
        innerHTML: signButtonLabel,
        title: aggregatorConfInvalid
      });
    });

    test('returns properties for disabled button (encrypted document)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const encryptedDocument = 'Signing is disabled because encrypted documents are not supported';

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isAggregatorConfValid)
        .calledWith({
          ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_sign', null, signButtonLabel)
        .mockResolvedValue(signButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_sign_disabled_encrypted_document', null, encryptedDocument)
        .mockResolvedValue(encryptedDocument);

      expect(await ksiSidebarButtons.getSignButtonTitleAndHTMLAndDisabled(true)).toEqual({
        disabled: true,
        innerHTML: signButtonLabel,
        title: encryptedDocument
      });
    });

    test('returns properties for disabled button (corrupted document)', async () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const encryptedDocument = 'Signing is disabled because corrupted documents are not supported';

      PDFViewerApplication.ksiConfiguration = {
        configuration: {
          ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        }
      };

      when(isAggregatorConfValid)
        .calledWith({
          ksiAggregatorUrlValue: KSI_AGGREGATOR_URL,
          ksiLoginIdValue: KSI_LOGIN_ID,
          ksiLoginKeyValue: KSI_LOGIN_KEY
        })
        .mockReturnValue(true);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_sign', null, signButtonLabel)
        .mockResolvedValue(signButtonLabel);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_sidebar_sign_disabled_corrupted_document', null, encryptedDocument)
        .mockResolvedValue(encryptedDocument);

      expect(await ksiSidebarButtons.getSignButtonTitleAndHTMLAndDisabled(false, true)).toEqual({
        disabled: true,
        innerHTML: signButtonLabel,
        title: encryptedDocument
      });
    });
  });

  describe('createButton', () => {
    test('returns a button', () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      PDFViewerApplication.ksiConfiguration = {
        open: jest.fn()
      };

      const actualButton = ksiSidebarButtons.createButton(
        CONFIG_BUTTON_ID,
        CONFIG_BUTTON_LABEL,
        CONFIG_BUTTON_LABEL,
        PDFViewerApplication.ksiConfiguration.open,
        false
      );

      const expectedButton =
        '<button id="ksiSidebarConfigButton" title="KSI Configuration" class="ksiButton ksiButton--neutral">KSI Configuration</button>';
      expect(actualButton.outerHTML).toEqual(expectedButton);
    });
  });

  describe('toggleExtendButtonDisabled', () => {
    test('calls toggleButtonDisabledIfExists', () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      ksiSidebarButtons.toggleButtonDisabledIfExists = jest.fn();

      ksiSidebarButtons.toggleExtendButtonDisabled(true);

      expect(ksiSidebarButtons.toggleButtonDisabledIfExists).toHaveBeenCalledWith(EXTEND_BUTTON_ID, true);
    });
  });

  describe('toggleSignButtonDisabled', () => {
    test('calls toggleButtonDisabledIfExists', () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      ksiSidebarButtons.toggleButtonDisabledIfExists = jest.fn();

      ksiSidebarButtons.toggleSignButtonDisabled(false);

      expect(ksiSidebarButtons.toggleButtonDisabledIfExists).toHaveBeenCalledWith(SIGN_BUTTON_ID, false);
    });
  });

  describe('toggleButtonDisabledIfExists', () => {
    test('sets disabled to false if button exists', () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      const signButton = document.createElement('div');
      signButton.id = SIGN_BUTTON_ID;
      signButton.disabled = true;
      document.body.appendChild(signButton);

      ksiSidebarButtons.toggleButtonDisabledIfExists(SIGN_BUTTON_ID, false);

      expect(document.getElementById(SIGN_BUTTON_ID).disabled).toEqual(false);
    });

    test('does nothing if button does not exist', () => {
      const ksiSidebarButtons = new KsiSidebarButtons(SIDEBAR_CONTAINER);

      ksiSidebarButtons.toggleButtonDisabledIfExists(SIGN_BUTTON_ID, true);
    });
  });
});
