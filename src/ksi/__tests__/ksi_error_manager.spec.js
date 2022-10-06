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
import { AGGREGATION_TIME, AGGREGATION_TIME_STRING } from './test-util/common_test_data';
import { getAggregationTimeString } from '../ksi_time_util';
import { KSIErrorManager } from '../ksi_error_manager';
import { PDFViewerApplication } from 'pdfjs-dist/lib/web/app';
import { when } from 'jest-when';

jest.mock('../ksi_time_util', () => {
  return {
    getAggregationTimeString: jest.fn()
  };
});

const ERROR = {
  message: 'This is a sample error message',
  type: 'ERROR',
  signatureIndex: 1,
  aggregationTime: AGGREGATION_TIME,
  operation: 'SIGNATURE'
};

const ERROR_UNKNOWN_TYPE = {
  message: 'This is a unknown error message. This should never happen!',
  type: 'UNKNOWN',
  signatureIndex: 1,
  aggregationTime: AGGREGATION_TIME,
  operation: 'UNKNOWN'
};

const ERROR_SECOND_SIGNATURE = {
  message: 'This is another sample error message',
  type: 'ERROR',
  signatureIndex: 2,
  aggregationTime: AGGREGATION_TIME,
  operation: 'SIGNATURE'
};

const ERROR_THIRD_SIGNATURE_NO_AGGR_TIME = {
  message: 'This is yet another sample error message',
  type: 'ERROR',
  signatureIndex: 3,
  aggregationTime: undefined,
  operation: 'SIGNATURE'
};

const ERROR_FIFTH_SIGNATURE_NO_AGGR_TIME = {
  message: 'This is yet another sample error message',
  type: 'ERROR',
  signatureIndex: 5,
  aggregationTime: undefined,
  operation: 'SIGNATURE'
};

const ERROR_DOCUMENT = {
  message: 'This is a document error message',
  type: 'ERROR',
  signatureIndex: undefined,
  aggregationTime: undefined,
  operation: 'DOCUMENT'
};

const ERROR_EXTEND = {
  message: 'This is a extending error message',
  type: 'ERROR',
  operation: 'EXTENDING'
};

const ERROR_SIGN = {
  message: 'This is a signing error message',
  type: 'ERROR',
  operation: 'SIGNING'
};

const WARNING = {
  message: 'This is a sample warning message',
  type: 'WARNING',
  signatureIndex: 1,
  aggregationTime: AGGREGATION_TIME,
  operation: 'SIGNATURE'
};

const WARNING_DOCUMENT = {
  message: 'This is a document warning message',
  type: 'WARNING',
  signatureIndex: undefined,
  aggregationTime: undefined,
  operation: 'DOCUMENT'
};

PDFViewerApplication.l10n = {
  get: jest.fn()
};

describe('KSIErrorManager', () => {
  const ksiErrorManagerConfig = {
    container: { removeAttribute: jest.fn(), setAttribute: jest.fn() },
    errorMessage: document.createElement('div'),
    closeButton: jest.fn(),
    errorMoreInfo: { removeAttribute: jest.fn(), setAttribute: jest.fn(), style: { height: 0 }, scrollHeight: 40 },
    moreInfoButton: { removeAttribute: jest.fn(), setAttribute: jest.fn() },
    lessInfoButton: { removeAttribute: jest.fn(), setAttribute: jest.fn() }
  };

  describe('constructor', () => {
    test('constructs a valid KSIErrorManager object', () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      expect(ksiErrorManager.container).toEqual(ksiErrorManagerConfig.container);
      expect(ksiErrorManager.errorMessage).toEqual(ksiErrorManagerConfig.errorMessage);
      expect(ksiErrorManager.closeButton).toEqual(ksiErrorManagerConfig.closeButton);
      expect(ksiErrorManager.errorMoreInfo).toEqual(ksiErrorManagerConfig.errorMoreInfo);
      expect(ksiErrorManager.moreInfoButton).toEqual(ksiErrorManagerConfig.moreInfoButton);
      expect(ksiErrorManager.lessInfoButton).toEqual(ksiErrorManagerConfig.lessInfoButton);
      expect(ksiErrorManager.errors).toEqual([]);
    });
  });

  describe('addError', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('pushes error to ksiErrorManager.errors array', () => {
      ksiErrorManager.addError(ERROR);

      expect(ksiErrorManager.errors).toEqual([ERROR]);
    });
  });

  describe('clearErrorsAndHideKsiErrorWrapper', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('clears errors and hides KSIErrorWrapper', () => {
      ksiErrorManager.clearErrors = jest.fn();
      ksiErrorManager.hideKsiErrorWrapper = jest.fn();

      ksiErrorManager.clearErrorsAndHideKsiErrorWrapper();

      expect(ksiErrorManager.clearErrors).toHaveBeenCalled();
      expect(ksiErrorManager.hideKsiErrorWrapper).toHaveBeenCalled();
    });
  });

  describe('clearErrors', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('clears ksiErrorManager.errors array', () => {
      ksiErrorManager.errors.push(ERROR);

      ksiErrorManager.clearErrors();

      expect(ksiErrorManager.errors).toEqual([]);
    });
  });

  describe('showKsiErrorWrapperIfNeeded', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('does nothing if there are no errors', async () => {
      ksiErrorManager.closeMoreInfo = jest.fn();
      ksiErrorManager.getErrorMessage = jest.fn();
      ksiErrorManager.getErrorMoreInfo = jest.fn();

      await ksiErrorManager.showKsiErrorWrapperIfNeeded();

      expect(ksiErrorManager.container.removeAttribute).not.toHaveBeenCalled();
      expect(ksiErrorManager.closeMoreInfo).not.toHaveBeenCalled();
      expect(ksiErrorManager.errorMessage.textContent).toEqual('');
      expect(ksiErrorManager.errorMoreInfo.value).toBeUndefined();
    });

    test('shows KSIErrorWrapper if ksiErrorManager.errors array contains errors', async () => {
      ksiErrorManager.errors.push(ERROR);
      ksiErrorManager.getErrorMessage = jest.fn(() => {
        return 'errorMessage';
      });
      ksiErrorManager.getErrorMoreInfo = jest.fn(() => {
        return 'errorMoreInfo';
      });

      await ksiErrorManager.showKsiErrorWrapperIfNeeded();

      expect(ksiErrorManager.container.removeAttribute).toHaveBeenCalledWith('hidden');
      expect(ksiErrorManager.errorMessage.textContent).toEqual('errorMessage');
      expect(ksiErrorManager.errorMoreInfo.value).toEqual('errorMoreInfo');
    });
  });

  describe('hideKsiErrorWrapper', () => {
    test('makes more info invisible', () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      ksiErrorManager.hideKsiErrorWrapper();

      expect(ksiErrorManager.container.setAttribute).toHaveBeenCalledWith('hidden', 'true');
    });
  });

  describe('getErrorMessage', () => {
    test('returns message with 1 error', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const heading = 'KSI Signature tools has encountered ';
      const oneError = '1 error';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_heading', null, heading)
        .mockResolvedValue(heading);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_one_error', null, oneError)
        .mockResolvedValue(oneError);

      ksiErrorManager.errors.push(ERROR, ERROR_UNKNOWN_TYPE);

      expect(await ksiErrorManager.getErrorMessage()).toEqual(heading + oneError + '.');
    });

    test('returns message with 1 warning', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const heading = 'KSI Signature tools has encountered ';
      const oneWarning = '1 warning';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_heading', null, heading)
        .mockResolvedValue(heading);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_one_warning', null, oneWarning)
        .mockResolvedValue(oneWarning);

      ksiErrorManager.errors.push(WARNING);

      expect(await ksiErrorManager.getErrorMessage()).toEqual(heading + oneWarning + '.');
    });

    test('returns message with 1 error and 1 warning', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const heading = 'KSI Signature tools has encountered ';
      const oneError = '1 error';
      const and = 'and ';
      const oneWarning = '1 warning';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_heading', null, heading)
        .mockResolvedValue(heading);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_one_error', null, oneError)
        .mockResolvedValue(oneError);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_and', null, and)
        .mockResolvedValue(and);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_one_warning', null, oneWarning)
        .mockResolvedValue(oneWarning);

      ksiErrorManager.errors.push(ERROR, WARNING);

      expect(await ksiErrorManager.getErrorMessage()).toEqual(heading + oneError + ' ' + and + oneWarning + '.');
    });

    test('returns message with 2 errors and 2 warnings', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const heading = 'KSI Signature tools has encountered ';
      const errors = 'errors';
      const and = 'and ';
      const warnings = 'warnings';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_heading', null, heading)
        .mockResolvedValue(heading);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_errors', null, errors)
        .mockResolvedValue(errors);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_and', null, and)
        .mockResolvedValue(and);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_message_warnings', null, warnings)
        .mockResolvedValue(warnings);

      ksiErrorManager.errors.push(ERROR, ERROR, WARNING, WARNING);

      expect(await ksiErrorManager.getErrorMessage()).toEqual(
        heading + '2 ' + errors + ' ' + and + '2 ' + warnings + '.'
      );
    });
  });

  describe('getErrorMoreInfo', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('returns additional information about the error', async () => {
      ksiErrorManager.getSignatureErrorMoreInfo = jest.fn(() => {
        return 'Signature error additional info\n';
      });
      ksiErrorManager.getDocumentErrorMoreInfo = jest.fn(() => {
        return 'Document error additional info\n';
      });

      expect(await ksiErrorManager.getErrorMoreInfo()).toEqual(
        'Signature error additional info\nDocument error additional info'
      );
    });
  });

  describe('getSignatureErrorMoreInfo', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('returns additional information about signature errors and warnings', async () => {
      const signature = 'Signature ';
      const signatureErrors = [
        ERROR,
        ERROR_UNKNOWN_TYPE,
        WARNING,
        ERROR_SECOND_SIGNATURE,
        ERROR_THIRD_SIGNATURE_NO_AGGR_TIME
      ];
      const firstMessage = '    ERROR:    This is a sample error message\n';
      const secondMessage = '    WARNING:  This is a sample warning message\n';
      const thirdMessage = '    ERROR:    This is another sample error message\n';
      const fourthMessage = '    ERROR:    This is yet another sample error message\n';

      ksiErrorManager.getSmallestSignatureIndex = jest.fn();
      ksiErrorManager.getErrorOrWarningMessage = jest.fn();

      ksiErrorManager.getSignatureErrors = jest.fn(() => {
        return signatureErrors;
      });
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_signature', null, signature)
        .mockResolvedValue(signature);
      when(getAggregationTimeString)
        .calledWith(AGGREGATION_TIME)
        .mockReturnValue(AGGREGATION_TIME_STRING);
      when(ksiErrorManager.getSmallestSignatureIndex)
        .calledWith(signatureErrors)
        .mockReturnValue(1);
      when(ksiErrorManager.getErrorOrWarningMessage)
        .calledWith(ERROR)
        .mockReturnValue(firstMessage);
      when(ksiErrorManager.getErrorOrWarningMessage)
        .calledWith(WARNING)
        .mockReturnValue(secondMessage);
      when(ksiErrorManager.getErrorOrWarningMessage)
        .calledWith(ERROR_SECOND_SIGNATURE)
        .mockReturnValue(thirdMessage);
      when(ksiErrorManager.getErrorOrWarningMessage)
        .calledWith(ERROR_THIRD_SIGNATURE_NO_AGGR_TIME)
        .mockReturnValue(fourthMessage);
      when(ksiErrorManager.getErrorOrWarningMessage)
        .calledWith(ERROR_UNKNOWN_TYPE)
        .mockReturnValue('');

      const expected =
        'Signature 1 (' +
        AGGREGATION_TIME_STRING +
        '):\n' +
        firstMessage +
        secondMessage +
        'Signature 2 (' +
        AGGREGATION_TIME_STRING +
        '):\n' +
        thirdMessage +
        'Signature 3:\n' +
        fourthMessage;
      expect(await ksiErrorManager.getSignatureErrorMoreInfo()).toEqual(expected);
    });
  });

  describe('getDocumentErrorMoreInfo', () => {
    test('returns additional information about document errors and warnings', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const document = 'Document:';
      const firstMessage = '    ERROR:    This is a document error message\n';
      const secondMessage = '    WARNING:  This is a document warning message\n';

      ksiErrorManager.getErrorOrWarningMessage = jest.fn();

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_document', null, document)
        .mockResolvedValue(document);

      ksiErrorManager.getDocumentErrors = jest.fn(() => {
        return [ERROR_DOCUMENT, WARNING_DOCUMENT];
      });
      when(ksiErrorManager.getErrorOrWarningMessage)
        .calledWith(ERROR_DOCUMENT)
        .mockReturnValue(firstMessage);
      when(ksiErrorManager.getErrorOrWarningMessage)
        .calledWith(WARNING_DOCUMENT)
        .mockReturnValue(secondMessage);

      const expected = 'Document:\n' + firstMessage + secondMessage;
      expect(await ksiErrorManager.getDocumentErrorMoreInfo()).toEqual(expected);
    });

    test('returns an empty string if document has no errors or warnings', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      ksiErrorManager.getDocumentErrors = jest.fn(() => {
        return [];
      });

      expect(await ksiErrorManager.getDocumentErrorMoreInfo()).toEqual('');
    });
  });

  describe('getExtendingErrorMoreInfo', () => {
    test('returns additional information about extending errors and warnings(MULTIPLE)', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const extending = 'Extending:';
      const error = 'ERROR:';

      ksiErrorManager.getExtendingErrors = jest.fn(() => {
        return [ERROR_EXTEND, ERROR_EXTEND];
      });
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_extending', null, extending)
        .mockResolvedValue(extending);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_error', null, error)
        .mockResolvedValue(error);

      const expected = 'Extending:\n    ERROR:    (2) This is a extending error message\n';
      expect(await ksiErrorManager.getExtendingErrorMoreInfo()).toEqual(expected);
    });

    test('returns additional information about extending errors and warnings(SINGLE)', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const error = 'ERROR:';

      ksiErrorManager.getExtendingErrors = jest.fn(() => {
        return [ERROR_EXTEND];
      });
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_error', null, error)
        .mockResolvedValue(error);

      const expected = 'Extending:\n    ERROR:    This is a extending error message\n';
      expect(await ksiErrorManager.getExtendingErrorMoreInfo()).toEqual(expected);
    });

    test('returns an empty string if extending has no errors or warnings', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      ksiErrorManager.getExtendingErrors = jest.fn(() => {
        return [];
      });

      expect(await ksiErrorManager.getExtendingErrorMoreInfo()).toEqual('');
    });
  });

  describe('getSigningErrorMoreInfo', () => {
    test('returns additional information about signing errors and warnings (MULTIPLE)', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const signing = 'Signing:';
      const error = 'ERROR:';

      ksiErrorManager.getSigningErrors = jest.fn(() => {
        return [ERROR_SIGN, ERROR_SIGN];
      });
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_signing', null, signing)
        .mockResolvedValue(signing);
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_error', null, error)
        .mockResolvedValue(error);

      const expected = 'Signing:\n    ERROR:    (2) This is a signing error message\n';
      expect(await ksiErrorManager.getSigningErrorMoreInfo()).toEqual(expected);
    });

    test('returns additional information about signing errors and warnings (SINGLE)', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      const error = 'ERROR:';

      ksiErrorManager.getSigningErrors = jest.fn(() => {
        return [ERROR_SIGN];
      });
      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_error', null, error)
        .mockResolvedValue(error);

      const expected = 'Signing:\n    ERROR:    This is a signing error message\n';
      expect(await ksiErrorManager.getSigningErrorMoreInfo()).toEqual(expected);
    });

    test('returns an empty string if signing has no errors or warnings', async () => {
      const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

      ksiErrorManager.getSigningErrors = jest.fn(() => {
        return [];
      });

      expect(await ksiErrorManager.getSigningErrorMoreInfo()).toEqual('');
    });
  });

  describe('getDocumentErrors', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('filters document errors from ksiErrorManager.errors array', () => {
      ksiErrorManager.errors.push(ERROR, WARNING, ERROR_SECOND_SIGNATURE, ERROR_DOCUMENT);

      expect(ksiErrorManager.getDocumentErrors()).toEqual([ERROR_DOCUMENT]);
    });
  });

  describe('getSignatureErrors', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('filters signature errors from ksiErrorManager.errors array', () => {
      ksiErrorManager.errors.push(ERROR, WARNING, ERROR_SECOND_SIGNATURE, ERROR_DOCUMENT);

      expect(ksiErrorManager.getSignatureErrors()).toEqual([ERROR, WARNING, ERROR_SECOND_SIGNATURE]);
    });
  });

  describe('getExtendingErrors', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('filters document errors from ksiErrorManager.errors array', () => {
      ksiErrorManager.errors.push(ERROR, WARNING, ERROR_SECOND_SIGNATURE, ERROR_EXTEND, ERROR_DOCUMENT);

      expect(ksiErrorManager.getExtendingErrors()).toEqual([ERROR_EXTEND]);
    });
  });

  describe('getSigningErrors', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('filters document errors from ksiErrorManager.errors array', () => {
      ksiErrorManager.errors.push(ERROR, WARNING, ERROR_SECOND_SIGNATURE, ERROR_SIGN, ERROR_DOCUMENT);

      expect(ksiErrorManager.getSigningErrors()).toEqual([ERROR_SIGN]);
    });
  });

  describe('getSmallestSignatureIndex', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('returns smallest index', () => {
      ksiErrorManager.errors.push(ERROR, WARNING, ERROR_SECOND_SIGNATURE, ERROR_SIGN, ERROR_DOCUMENT);

      const smallestIndexOne = [ERROR, WARNING, ERROR_SECOND_SIGNATURE];
      expect(ksiErrorManager.getSmallestSignatureIndex(smallestIndexOne)).toEqual(1);

      const smallestIndexTwo = [ERROR_SECOND_SIGNATURE];
      expect(ksiErrorManager.getSmallestSignatureIndex(smallestIndexTwo)).toEqual(2);

      const smallestIndexThree = [ERROR_FIFTH_SIGNATURE_NO_AGGR_TIME, ERROR_THIRD_SIGNATURE_NO_AGGR_TIME];
      expect(ksiErrorManager.getSmallestSignatureIndex(smallestIndexThree)).toEqual(3);
    });
  });

  describe('getErrorOrWarningMessage', () => {
    const ksiErrorManager = new KSIErrorManager(ksiErrorManagerConfig);

    test('returns error message if error.type === ERROR', async () => {
      const error = 'ERROR:';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_error', null, error)
        .mockResolvedValue(error);

      expect(await ksiErrorManager.getErrorOrWarningMessage(ERROR)).toEqual(
        '    ERROR:    This is a sample error message\n'
      );
    });

    test('returns warning message if error.type === WARNING', async () => {
      const warning = 'WARNING:';

      when(PDFViewerApplication.l10n.get)
        .calledWith('ksi_error_manager_info_warning', null, warning)
        .mockResolvedValue(warning);

      expect(await ksiErrorManager.getErrorOrWarningMessage(WARNING)).toEqual(
        '    WARNING:  This is a sample warning message\n'
      );
    });

    test('returns empty message if error.type !== ERROR nor WARNING', async () => {
      expect(await ksiErrorManager.getErrorOrWarningMessage(ERROR_UNKNOWN_TYPE)).toEqual('');
    });
  });
});
