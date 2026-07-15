import { ApiResponse } from '../types/common.types';

export const formatSuccess = <T>(data: T, warnings?: ApiResponse['warnings']): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (warnings && warnings.length > 0) {
    response.warnings = warnings;
  }
  return response;
};

export const formatError = (message: string, errorCode?: string): ApiResponse => {
  const response: ApiResponse = {
    success: false,
    message,
  };
  if (errorCode) {
    response.error = errorCode;
  }
  return response;
};
