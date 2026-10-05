import { signal } from "@Signal/signal";
import Cookies from "js-cookie";
import { AksesItemDto, LoginUserDto } from "@Hooks/api-generated";
import network_cache from "@Hooks/api-cache";
import { jwtDecode } from "jwt-decode";
import { EJenisActor } from "@Utils/enum";

const AUTH_COOKIE_SELECTED_TOKEN = "selectedToken";
const AUTH_COOKIE_AKSES_LIST = "aksesList";
const AUTH_STORAGE_SELECTED_TOKEN = "selectedToken";
const AUTH_STORAGE_AKSES_LIST = "aksesList";

const AUTH_COOKIE_OPTIONS = {
  expires: 7,
  path: "/",
  sameSite: "lax" as const,
  secure: typeof window !== "undefined" ? window.location.protocol === "https:" : false,
};

export type DecodedJwtPayload = {
  exp?: number;
  akses?: string;
  id_pegawai?: string;
  nama?: string;
  foto?: string;
  pekerjaan?: string | string[];
  id_institusi?: string;
  tipe_lembaga?: string | number;
  kd_lembaga?: string[];
  kd_sub_lembaga?: string[];
  ketua?: boolean;
  expired?: string;
} & Record<string, unknown>;

export type AuthSignalType = {
  selectedToken?: string;
  loginResponse?: LoginUserDto;
  selectedAuthorization?: AksesItemDto;
  data?: DecodedJwtPayload;
};

const normalize_role = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const enum_role_map = Object.values(EJenisActor).reduce<Record<string, string>>((acc, role) => {
  acc[normalize_role(role)] = role;
  return acc;
}, {});

const decode_jwt = (token: string): DecodedJwtPayload | undefined => {
  try {
    return jwtDecode<DecodedJwtPayload>(token);
  } catch {
    return undefined;
  }
};

const find_selected_authorization = (loginResponse: LoginUserDto, selectedToken: string): AksesItemDto | undefined => {
  return loginResponse.akses?.find((auth) => auth.token === selectedToken);
};

const get_cookie_item = (key: string): string | undefined => Cookies.get(key);

const get_storage_item = (key: string): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const set_cookie_item = (key: string, value: string) => {
  Cookies.set(key, value, AUTH_COOKIE_OPTIONS);
};

const set_storage_item = (key: string, value: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write errors (e.g. private mode quota)
  }
};

const get_persisted_item = (cookieKey: string, storageKey: string): string | undefined => {
  return get_cookie_item(cookieKey) ?? get_storage_item(storageKey);
};

const set_persisted_item = (cookieKey: string, storageKey: string, value: string) => {
  set_cookie_item(cookieKey, value);
  set_storage_item(storageKey, value);
};

const remove_cookie_item = (key: string) => {
  Cookies.remove(key);
  Cookies.remove(key, { path: "/" });
};

const remove_storage_item = (key: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage remove errors
  }
};

const remove_persisted_item = (cookieKey: string, storageKey: string) => {
  remove_cookie_item(cookieKey);
  remove_storage_item(storageKey);
};

const parse_akses_list = (raw: string | null): AksesItemDto[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AksesItemDto[];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.akses === "string" && typeof item?.token === "string") : [];
  } catch {
    return [];
  }
};

const find_akses_by_token = (aksesList: AksesItemDto[], selectedToken: string): AksesItemDto | undefined => {
  return aksesList.find((aksesItem) => aksesItem.token === selectedToken);
};

const resolve_selected_token_for_akses = (aksesList: AksesItemDto[], preferredToken?: string): string | undefined => {
  if (preferredToken && find_akses_by_token(aksesList, preferredToken)) {
    return preferredToken;
  }

  return aksesList[0]?.token;
};

const build_login_response_from_akses = (aksesList: AksesItemDto[], selectedToken: string): LoginUserDto => {
  const decodedData = decode_jwt(selectedToken);

  return {
    id_pegawai: typeof decodedData?.id_pegawai === "string" ? decodedData.id_pegawai : "",
    nama: typeof decodedData?.nama === "string" ? decodedData.nama : "Guest",
    foto: typeof decodedData?.foto === "string" ? decodedData.foto : "",
    akses: aksesList,
  };
};

const build_auth_state = (selectedToken: string, loginResponse: LoginUserDto): AuthSignalType | undefined => {
  const selectedAuthorization = find_selected_authorization(loginResponse, selectedToken);
  if (!selectedAuthorization) {
    return undefined;
  }

  const decodedData = decode_jwt(selectedToken);
  if (!decodedData) {
    return undefined;
  }

  return {
    selectedToken,
    loginResponse,
    selectedAuthorization,
    data: decodedData,
  };
};

const is_token_expired = (payload?: DecodedJwtPayload): boolean => {
  if (!payload?.exp) {
    return false;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

function auth_signal_initial_value(): AuthSignalType {
  const selectedToken = get_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN);
  const storedAkses = parse_akses_list(get_persisted_item(AUTH_COOKIE_AKSES_LIST, AUTH_STORAGE_AKSES_LIST) ?? null);
  const resolvedToken = resolve_selected_token_for_akses(storedAkses, selectedToken ?? undefined);

  if (!resolvedToken || storedAkses.length === 0) {
    return {};
  }

  try {
    const parsedLoginResponse = build_login_response_from_akses(storedAkses, resolvedToken);
    const authState = build_auth_state(resolvedToken, parsedLoginResponse);

    if (!authState || is_token_expired(authState.data as DecodedJwtPayload)) {
      remove_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN);
      remove_persisted_item(AUTH_COOKIE_AKSES_LIST, AUTH_STORAGE_AKSES_LIST);
      return {};
    }

    if (selectedToken !== resolvedToken) {
      set_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN, resolvedToken);
    }

    return authState;
  } catch {
    return {};
  }
}

export const auth_signal = signal<AuthSignalType>(auth_signal_initial_value());

const get_login_response_from_state_or_storage = (): LoginUserDto | undefined => {
  if (auth_signal.value.loginResponse) {
    return auth_signal.value.loginResponse;
  }

  const aksesList = parse_akses_list(get_persisted_item(AUTH_COOKIE_AKSES_LIST, AUTH_STORAGE_AKSES_LIST) ?? null);
  const selectedToken = get_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN);
  const resolvedToken = resolve_selected_token_for_akses(aksesList, selectedToken ?? undefined);

  if (!resolvedToken || aksesList.length === 0) {
    return undefined;
  }

  try {
    return build_login_response_from_akses(aksesList, resolvedToken);
  } catch {
    return undefined;
  }
};

// Set login response dan simpan akses ke cookie
export const set_login_response = (response: LoginUserDto) => {
  const aksesList = response.akses ?? [];
  const selectedTokenFromCookie = get_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN) || auth_signal.value.selectedToken;
  const nextToken = resolve_selected_token_for_akses(aksesList, selectedTokenFromCookie ?? undefined);

  const nextAuthState = nextToken ? build_auth_state(nextToken, response) : undefined;

  auth_signal.value = {
    ...(nextAuthState ?? {}),
    loginResponse: response,
  };

  set_persisted_item(AUTH_COOKIE_AKSES_LIST, AUTH_STORAGE_AKSES_LIST, JSON.stringify(aksesList));

  if (nextAuthState?.selectedToken) {
    set_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN, nextAuthState.selectedToken);
  } else {
    remove_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN);
  }
};

// Set selected authorization token dan simpan ke cookie
export const set_selected_token = (selectedToken: string) => {
  try {
    const loginResponse = get_login_response_from_state_or_storage();
    if (!loginResponse) {
      throw new Error("Missing login response");
    }

    const nextAuthState = build_auth_state(selectedToken, loginResponse);
    if (!nextAuthState) {
      throw new Error("Selected token is not available in login response or invalid");
    }

    if (is_token_expired(nextAuthState.data as DecodedJwtPayload)) {
      throw new Error("JWT token is expired");
    }

    auth_signal.value = {
      ...auth_signal.value,
      selectedToken: nextAuthState.selectedToken,
      selectedAuthorization: nextAuthState.selectedAuthorization,
      data: nextAuthState.data,
      loginResponse,
    };

    set_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN, selectedToken);
  } catch (error) {
    console.error("Error setting selected token:", error);
    throw new Error(`Failed to set selected token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// Clear auth data
export const clear_auth = () => {
  auth_signal.value = {};
  network_cache.clear();
  remove_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN);
  remove_persisted_item(AUTH_COOKIE_AKSES_LIST, AUTH_STORAGE_AKSES_LIST);
};

// untuk cek role berdasarkan akses di JWT data
export const they_are = (roles: string | string[]) => {
  const expectedRolesRaw = Array.isArray(roles) ? roles : [roles];
  const expectedRoles = expectedRolesRaw.map((role) => normalize_role(role));
  const jwtData = auth_signal.value.data as DecodedJwtPayload | undefined;
  const currentAkses = (typeof jwtData?.akses === "string" ? jwtData.akses : undefined) || auth_signal.value.selectedAuthorization?.akses;

  if (!currentAkses) {
    return false;
  }

  const normalized = normalize_role(currentAkses);
  // Cari key yang paling spesifik (terpanjang) agar "adminlembaga" tidak
  // salah cocok dengan "admin" yang merupakan substring-nya.
  const mappedKey = Object.keys(enum_role_map)
    .filter((key) => normalized.includes(key))
    .sort((a, b) => b.length - a.length)[0];
  const normalizedCurrent = mappedKey ? normalize_role(enum_role_map[mappedKey]) : normalized;

  return expectedRoles.includes(normalizedCurrent);
};

// untuk cek akses user berdasarkan label akses dari API login
export const has_akses = (akses: string | string[]) => {
  const expectedAksesRaw = Array.isArray(akses) ? akses : [akses];
  const expectedAkses = expectedAksesRaw.map((item) => normalize_role(item));

  const currentAkses = auth_signal.value.loginResponse?.akses ?? [];
  const normalizedCurrentAkses = currentAkses.map((item) => normalize_role(item.akses));

  return normalizedCurrentAkses.some((item) => expectedAkses.includes(item));
};

// Force refresh auth state from cookies (for immediate validation)
export const refresh_auth_from_cookies = () => {
  const selectedToken = get_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN);
  const aksesList = parse_akses_list(get_persisted_item(AUTH_COOKIE_AKSES_LIST, AUTH_STORAGE_AKSES_LIST) ?? null);
  const resolvedToken = resolve_selected_token_for_akses(aksesList, selectedToken ?? undefined);

  if (!resolvedToken || aksesList.length === 0) {
    clear_auth();
    return false;
  }

  try {
    const parsedLoginResponse = build_login_response_from_akses(aksesList, resolvedToken);
    const authState = build_auth_state(resolvedToken, parsedLoginResponse);
    if (!authState || is_token_expired(authState.data as DecodedJwtPayload)) {
      clear_auth();
      return false;
    }

    auth_signal.value = authState;
    set_persisted_item(AUTH_COOKIE_SELECTED_TOKEN, AUTH_STORAGE_SELECTED_TOKEN, resolvedToken);
    set_persisted_item(AUTH_COOKIE_AKSES_LIST, AUTH_STORAGE_AKSES_LIST, JSON.stringify(aksesList));

    return true;
  } catch {
    clear_auth();
    return false;
  }
};

// Helper function to check if user is authenticated
export const is_authenticated = () => {
  const selectedToken = auth_signal.value.selectedToken;

  if (!selectedToken) {
    return false;
  }

  const decodedPayload = decode_jwt(selectedToken);
  return !is_token_expired(decodedPayload);
};

// Helper function to check if user has specific pekerjaan
export const has_pekerjaan = (pekerjaanList: string | string[]): boolean => {
  const expectedPekerjaan = Array.isArray(pekerjaanList) ? pekerjaanList : [pekerjaanList];
  const normalizedExpected = expectedPekerjaan.map((p) => p.toUpperCase());

  const jwtData = auth_signal.value.data as DecodedJwtPayload | undefined;
  const currentPekerjaan = Array.isArray(jwtData?.pekerjaan) ? jwtData.pekerjaan : typeof jwtData?.pekerjaan === "string" ? [jwtData.pekerjaan] : [];
  const normalizedCurrent = currentPekerjaan.map((p) => p.toUpperCase());

  return normalizedCurrent.some((p) => normalizedExpected.includes(p));
};

// ─── Template / Mock Auth ─────────────────────────────────────────────────────
// Gunakan ini di template untuk simulasi login tanpa backend nyata.
// Hapus atau ganti dengan implementasi API yang sesungguhnya saat production.

/**
 * Buat dummy JWT token yang bisa di-decode oleh jwtDecode.
 * Token ini TIDAK ter-verify secara kriptografis — hanya untuk keperluan
 * template/demo frontend saja.
 */
const make_dummy_jwt = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  return `${header}.${body}.dummy_signature`;
};

/**
 * Set auth state dengan data dummy — untuk keperluan template/demo.
 * Tidak membutuhkan backend atau JWT asli.
 *
 * @param nama   Nama yang ditampilkan di navbar
 * @param akses  Role label (contoh: "Admin", "User")
 */
export const set_mock_auth = (nama: string = "Demo User", akses: string = "Admin") => {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 jam
  const token = make_dummy_jwt({ nama, akses, exp, id_pegawai: "mock-001" });

  auth_signal.value = {
    selectedToken: token,
    selectedAuthorization: { token, akses },
    loginResponse: {
      id_pegawai: "mock-001",
      nama,
      foto: "",
      akses: [{ token, akses }],
    },
    data: { nama, akses, exp, id_pegawai: "mock-001" },
  };
};
