export {
  default as apiClient,
  BASE_URL,
  SOCKET_URL,
  ApiError,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiRequest,
  toResult,
  friendlyMessage,
  getErrorMessage,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
} from "./client";
export type { ApiEnvelope, ApiResult } from "./client";
export { authService } from "./services/authService";
