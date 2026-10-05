 
/**
 * Utility functions untuk handling API errors secara konsisten
 */

export interface ApiError {
  status?: number;
  message: string;
  originalError?: any;
}

/**
 * Parse error response dengan safe handling untuk berbagai format response
 */
export const parseApiError = async (error: any): Promise<ApiError> => {
  const status = error?.status || error?.response?.status;
  let message = "Terjadi kesalahan yang tidak diketahui";
  let responseData: any = error?.response?.data || error?.data || null;

  try {
    // Coba ambil response text/json jika belum ada
    if (!responseData && error?.json && typeof error.json === "function") {
      try {
        responseData = await error.json();
      } catch {
        // Jika gagal parse JSON, coba ambil sebagai text
        if (error?.text && typeof error.text === "function") {
          const textResponse = await error.text();
          console.warn("Response bukan JSON, received text:", textResponse);
        }
      }
    }

    // Prioritas message dari details -> error -> message
    const detailMessages = Array.isArray(responseData?.details)
      ? responseData.details
          .map((item: any) => {
            const path = Array.isArray(item?.path) ? item.path.join(".") : item?.path;
            const msgs = Array.isArray(item?.messages) ? item.messages.join(", ") : item?.messages || item?.message;
            if (!msgs) return null;
            return path ? `${path}: ${msgs}` : msgs;
          })
          .filter(Boolean)
          .join(" | ")
      : null;

    if (detailMessages) {
      message = detailMessages;
    } else if (responseData?.error) {
      message = responseData.error;
    } else if (responseData?.message) {
      message = responseData.message;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.error?.message) {
      message = error.error.message;
    }

    // Set message berdasarkan status code jika message generik
    if (!responseData || message === "Terjadi kesalahan yang tidak diketahui") {
      message = getErrorMessageByStatus(status);
    }
  } catch (parseError) {
    console.warn("Error saat parsing API error:", parseError);
    message = getErrorMessageByStatus(status);
  }

  return {
    status,
    message,
    originalError: error,
  };
};

/**
 * Get user-friendly error message berdasarkan HTTP status code
 */
export const getErrorMessageByStatus = (status?: number): string => {
  if (!status) return "Koneksi bermasalah, silakan periksa internet Anda";

  switch (status) {
    case 500:
      return "Server bermasalah, silakan coba lagi atau hubungi administrator";
    case 502:
      return "Server tidak dapat diakses, silakan coba lagi";
    case 503:
      return "Server sedang dalam pemeliharaan, silakan coba lagi nanti";
    case 504:
      return "Permintaan timeout, silakan coba lagi";
    default:
      if (status >= 500) {
        return "Server bermasalah, silakan coba lagi atau hubungi administrator";
      } else if (status >= 400) {
        return "Permintaan bermasalah, silakan periksa data yang dimasukkan";
      }
      return "Terjadi kesalahan yang tidak diketahui";
  }
};

/**
 * Check apakah error adalah network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error?.status && (error?.name === "NetworkError" || error?.message?.includes("fetch") || error?.message?.includes("Network"));
};

/**
 * Check apakah perlu retry berdasarkan error
 */
export const shouldRetry = (error: ApiError, retryCount: number = 0): boolean => {
  const maxRetries = 2;
  if (retryCount >= maxRetries) return false;

  // Retry untuk network errors dan server errors (5xx)
  return isNetworkError(error.originalError) || (error.status !== undefined && error.status >= 500);
};
