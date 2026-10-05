/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface LoginDto {
  /** @example "admin@lemigas.esdm.go.id" */
  email: string;
  /** @example "password123" */
  password: string;
}

export interface AksesItemDto {
  /** @example "eyJhbGciOiJI..." */
  token: string;
  /** @example "Operator" */
  akses: string;
}

export interface LoginUserDto {
  /** @example "012ace5b-e8fe-4411-8d05-deb79e2979ae" */
  id_pegawai: string;
  /** @example "Ahmad Fauzi" */
  nama: string;
  /** @example "https://example.com/photo.jpg" */
  foto: string;
  akses: AksesItemDto[];
}

export interface StandartResponse {
  /** @example 200 */
  status: number;
  /** @example "ok" */
  message: string;
}

export interface UnitKerjaRingkasDto {
  id: string;
  kode_unit: string;
  nama_unit: string;
  tipe_unit: string;
  parent_unit_id?: object | null;
  kepala_unit_nama?: object | null;
}

export interface PegawaiItemDto {
  id: string;
  nip_nik: string;
  nama: string;
  tipe_pegawai: string;
  jabatan?: object | null;
  email?: object | null;
  telepon?: object | null;
  /** @format date-time */
  tanggal_mulai: string;
  status_aktif: string;
  bidang_keahlian?: object | null;
  kontrak_mulai?: object | null;
  kontrak_selesai?: object | null;
  gaji_bulanan?: object | null;
  unit_kerja?: UnitKerjaRingkasDto | null;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface SkRiwayatItemDto {
  id: string;
  nomor_sk: string;
  /** @format date-time */
  tanggal_sk: string;
  /** @format date-time */
  tanggal_efektif: string;
  tanggal_selesai?: object | null;
  jabatan?: object | null;
  file_sk?: object | null;
  status_aktif: string;
  unit_kerja?: UnitKerjaRingkasDto;
}

export interface PegawaiDetailDto {
  id: string;
  nip_nik: string;
  nama: string;
  tipe_pegawai: string;
  jabatan?: object | null;
  email?: object | null;
  telepon?: object | null;
  /** @format date-time */
  tanggal_mulai: string;
  status_aktif: string;
  bidang_keahlian?: object | null;
  kontrak_mulai?: object | null;
  kontrak_selesai?: object | null;
  gaji_bulanan?: object | null;
  unit_kerja?: UnitKerjaRingkasDto | null;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
  riwayat_sk: SkRiwayatItemDto[];
}

export interface StandartResponseCreate {
  /** @example 201 */
  status: number;
  /** @example "created" */
  message: string;
}

export interface CreatePegawaiDto {
  /** @example "197001011990031001" */
  nip_nik: string;
  /** @example "Budi Santoso" */
  nama: string;
  /** @example "TA" */
  tipe_pegawai: "PNS" | "ASN" | "OUTSOURCING" | "TA";
  /** @example "Analis Migas" */
  jabatan?: string;
  /** @example "budi@lemigas.esdm.go.id" */
  email?: string;
  /** @example "081234567890" */
  telepon?: string;
  /** @example "2024-01-01" */
  tanggal_mulai: string;
  /** @default "AKTIF" */
  status_aktif?: "AKTIF" | "NONAKTIF";
  /** @example "Geofisika" */
  bidang_keahlian?: string;
  /** @example "2024-01-01" */
  kontrak_mulai?: string;
  /** @example "2026-12-31" */
  kontrak_selesai?: string;
  /**
   * Gaji/honorarium bulanan dalam Rupiah (integer)
   * @example 15000000
   */
  gaji_bulanan?: number;
  /** Unit kerja aktif */
  id_unit_kerja?: string;
}

export interface UpdatePegawaiDto {
  /** @example "Budi Santoso" */
  nama?: string;
  tipe_pegawai?: "PNS" | "ASN" | "OUTSOURCING" | "TA";
  /** @example "Analis Migas" */
  jabatan?: string;
  /** @example "budi@lemigas.esdm.go.id" */
  email?: string;
  /** @example "081234567890" */
  telepon?: string;
  status_aktif?: "AKTIF" | "NONAKTIF";
  /** @example "Geofisika" */
  bidang_keahlian?: string;
  /** @example "2024-01-01" */
  kontrak_mulai?: string;
  /** @example "2026-12-31" */
  kontrak_selesai?: string;
  /** @example 15000000 */
  gaji_bulanan?: number;
  id_unit_kerja?: string;
}

export interface UnitKerjaItemDto {
  id: string;
  kode_unit: string;
  nama_unit: string;
  tipe_unit: string;
  parent_unit_id?: object | null;
  id_kepala_unit?: object | null;
  kepala_unit_nama?: object | null;
  deskripsi?: object | null;
  status_aktif: string;
  jumlah_pegawai_aktif?: number;
  jumlah_sub_unit?: number;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface UnitKerjaTreeNodeDto {
  id: string;
  kode_unit: string;
  nama_unit: string;
  tipe_unit: string;
  kepala_unit_nama?: object | null;
  status_aktif: string;
  children?: UnitKerjaTreeNodeDto[];
}

export interface CreateUnitKerjaDto {
  /** @example "KOOR-01" */
  kode_unit: string;
  /** @example "Koordinator Sumber Daya Manusia" */
  nama_unit: string;
  /** @example "KOORDINATOR" */
  tipe_unit: "KOORDINATOR" | "SUB_KOORDINATOR";
  /** Parent unit (wajib untuk SUB_KOORDINATOR) */
  id_parent_unit?: string;
  /** ID pegawai kepala unit */
  id_kepala_unit?: string;
  /** @example "Bertanggung jawab atas SDM" */
  deskripsi?: string;
}

export interface UpdateUnitKerjaDto {
  nama_unit?: string;
  tipe_unit?: "KOORDINATOR" | "SUB_KOORDINATOR";
  id_parent_unit?: string;
  id_kepala_unit?: string;
  deskripsi?: string;
  status_aktif?: "AKTIF" | "NONAKTIF";
}

export interface ProyekItemDto {
  id: string;
  kode_proyek: string;
  nama_proyek: string;
  tahun_fiscal: number;
  sumber_pendanaan?: object | null;
  jumlah_ro?: number;
  total_plafon_ro?: number;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface CreateProyekDto {
  /** @example "PRJ-2026-001" */
  kode_proyek: string;
  /** @example "Pengembangan Infrastruktur Migas" */
  nama_proyek: string;
  /** @example 2026 */
  tahun_fiscal: number;
  /** @example "APBN 2026" */
  sumber_pendanaan?: string;
}

export interface UpdateProyekDto {
  nama_proyek?: string;
  /** @example 2026 */
  tahun_fiscal?: number;
  sumber_pendanaan?: string;
}

export interface RoItemDto {
  id: string;
  kode_ro: string;
  nama_ro: string;
  tahun_fiscal: number;
  total_plafon: number;
  total_terpakai?: number;
  sisa_saldo?: number;
  id_proyek?: object | null;
  nama_proyek?: object | null;
  id_unit_koordinator?: object | null;
  nama_unit_koordinator?: object | null;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface CreateRoDto {
  /** @example "RO-2026-001" */
  kode_ro: string;
  /** @example "RO Infrastruktur 2026" */
  nama_ro: string;
  /** ID proyek sumber RO */
  id_proyek: string;
  /** ID unit koordinator pemilik RO */
  id_unit_koordinator: string;
  /** @example 2026 */
  tahun_fiscal: number;
  /**
   * Total plafon Rupiah (integer)
   * @example 500000000
   */
  total_plafon: number;
}

export interface UpdateRoDto {
  nama_ro?: string;
  total_plafon?: number;
}

export interface DanaOperasionalItemDto {
  id: string;
  tahun_fiscal: number;
  total_plafon: number;
  total_terpakai?: number;
  sisa_saldo?: number;
  id_unit_koordinator?: object | null;
  nama_unit_koordinator?: object | null;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface CreateDanaOperasionalDto {
  /** ID unit koordinator pemilik dana operasional */
  id_unit_koordinator: string;
  /** @example 2026 */
  tahun_fiscal: number;
  /**
   * Total plafon dana operasional Rupiah (integer)
   * @example 200000000
   */
  total_plafon: number;
}

export interface UpdateDanaOperasionalDto {
  /**
   * Total plafon baru Rupiah (integer)
   * @example 250000000
   */
  total_plafon?: number;
}

export interface SkItemDto {
  id: string;
  nomor_sk: string;
  /** @format date-time */
  tanggal_sk: string;
  /** @format date-time */
  tanggal_efektif: string;
  tanggal_selesai?: object | null;
  jabatan?: object | null;
  file_sk?: object | null;
  status_aktif: string;
  id_pegawai?: object | null;
  nama_pegawai?: object | null;
  nip_nik?: object | null;
  id_unit_kerja?: object | null;
  nama_unit_kerja?: object | null;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface CreateSkDto {
  /** @example "SK/001/LEMIGAS/2026" */
  nomor_sk: string;
  /** @example "2026-01-01" */
  tanggal_sk: string;
  /** @example "2026-02-01" */
  tanggal_efektif: string;
  /** @example "2026-12-31" */
  tanggal_selesai?: string;
  /** ID pegawai pemegang SK */
  id_pegawai: string;
  /** ID unit kerja tujuan */
  id_unit_kerja: string;
  /** @example "Analis Migas Ahli Muda" */
  jabatan?: string;
  /** File PDF SK (akan diupload via endpoint upload) */
  file_sk?: string;
}

export interface UpdateSkDto {
  nomor_sk?: string;
  tanggal_sk?: string;
  tanggal_efektif?: string;
  tanggal_selesai?: string;
  id_unit_kerja?: string;
  jabatan?: string;
  file_sk?: string;
}

export interface ActivateSkDto {
  /** Aktifkan (true) atau nonaktifkan (false) SK */
  status: boolean;
}

export interface AlokasiItemDto {
  id: string;
  periode_bulan: number;
  periode_tahun: number;
  sumber_dana: string;
  /** @example 9000000 */
  jumlah: number;
  status: string;
  keterangan?: object | null;
  id_pegawai?: object | null;
  nama_pegawai?: object | null;
  nip_nik?: object | null;
  tipe_pegawai?: object | null;
  gaji_bulanan?: object | null;
  id_unit_kerja?: object | null;
  nama_unit_kerja?: object | null;
  id_ro?: object | null;
  nama_ro?: object | null;
  id_dana_operasional?: object | null;
  nama_dibuat_oleh?: object | null;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface CreateAlokasiDto {
  /** ID pegawai TA */
  id_pegawai: string;
  /**
   * @min 1
   * @max 12
   * @example 1
   */
  periode_bulan: number;
  /** @example 2026 */
  periode_tahun: number;
  /** @example "RO" */
  sumber_dana: "RO" | "OPERASIONAL";
  /** Wajib jika sumber_dana = RO */
  id_ro?: string;
  /** Wajib jika sumber_dana = OPERASIONAL */
  id_dana_operasional?: string;
  /**
   * Jumlah alokasi Rupiah (integer)
   * @example 9000000
   */
  jumlah: number;
  /** @example "Alokasi gaji TA bulan Januari" */
  keterangan?: string;
}

export interface UpdateAlokasiDto {
  sumber_dana?: "RO" | "OPERASIONAL";
  id_ro?: string;
  id_dana_operasional?: string;
  /** @example 9000000 */
  jumlah?: number;
  keterangan?: string;
}

export interface UserItemDto {
  id: string;
  email: string;
  nama: string;
  role: string;
  nama_role?: object | null;
  id_unit_kerja?: object | null;
  nama_unit_kerja?: object | null;
  status: string;
  /** @format date-time */
  created_at?: string;
  /** @format date-time */
  updated_at?: string;
}

export interface CreateUserDto {
  /** @example "koordinator.sdm@lemigas.esdm.go.id" */
  email: string;
  /** @example "Koordinator SDM" */
  nama: string;
  /**
   * @minLength 6
   * @example "password123"
   */
  password: string;
  /** @example "KOORDINATOR" */
  role: "SUPERADMIN" | "KOORDINATOR" | "KARYAWAN";
  /** Unit kerja (koordinator unit aktif) */
  id_unit_kerja?: string;
  /** @default "AKTIF" */
  status?: "AKTIF" | "NONAKTIF";
}

export interface UpdateUserDto {
  nama?: string;
  /** @minLength 6 */
  password?: string;
  role?: "SUPERADMIN" | "KOORDINATOR" | "KARYAWAN";
  id_unit_kerja?: string;
  status?: "AKTIF" | "NONAKTIF";
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title HRIS LEMIGAS API
 * @version 1.0
 * @contact
 *
 * Dokumentasi API HRIS LEMIGAS - Pengelolaan pegawai, unit kerja dinamis (koordinator/sub-koordinator), SK, RO, dana operasional, dan alokasi gaji TA
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  app = {
    /**
     * No description
     *
     * @tags App
     * @name AppControllerGetHello
     * @request GET:/
     */
    appControllerGetHello: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/`,
        method: "GET",
        ...params,
      }),
  };
  health = {
    /**
     * No description
     *
     * @tags Health
     * @name HealthCheck
     * @summary api health check
     * @request GET:/api/health
     */
    healthCheck: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/health`,
        method: "GET",
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags Auth
     * @name LoginUser
     * @summary Login user dan dapatkan JWT token
     * @request POST:/api/auth/login
     */
    loginUser: (data: LoginDto, params: RequestParams = {}) =>
      this.request<LoginUserDto, any>({
        path: `/api/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name GetCurrentUser
     * @summary Dapatkan data user dari token JWT
     * @request GET:/api/auth/me
     * @secure
     */
    getCurrentUser: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/me`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  masterPegawai = {
    /**
     * No description
     *
     * @tags Master - Pegawai
     * @name PegawaiGetControllerGetData
     * @summary Get daftar pegawai (Superadmin, Koordinator)
     * @request GET:/api/pegawai
     * @secure
     */
    pegawaiGetControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        tipe_pegawai?: "PNS" | "ASN" | "OUTSOURCING" | "TA";
        status_aktif?: "AKTIF" | "NONAKTIF";
        /** Filter id unit kerja */
        id_unit_kerja?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: PegawaiItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/pegawai`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Pegawai
     * @name PegawaiPostControllerCreate
     * @summary Tambah pegawai (Superadmin)
     * @request POST:/api/pegawai
     * @secure
     */
    pegawaiPostControllerCreate: (
      data: CreatePegawaiDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponseCreate & {
          data?: PegawaiItemDto;
        },
        void
      >({
        path: `/api/pegawai`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Pegawai
     * @name PegawaiGetControllerGetDetail
     * @summary Get detail pegawai (Superadmin, Koordinator)
     * @request GET:/api/pegawai/{id}
     * @secure
     */
    pegawaiGetControllerGetDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        StandartResponse & {
          data?: PegawaiDetailDto;
        },
        void
      >({
        path: `/api/pegawai/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Pegawai
     * @name PegawaiPutControllerUpdate
     * @summary Update pegawai (Superadmin)
     * @request PUT:/api/pegawai/{id}
     * @secure
     */
    pegawaiPutControllerUpdate: (
      id: string,
      data: UpdatePegawaiDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: PegawaiItemDto;
        },
        void
      >({
        path: `/api/pegawai/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Pegawai
     * @name PegawaiDeleteControllerRemove
     * @summary Nonaktifkan pegawai (Superadmin)
     * @request DELETE:/api/pegawai/{id}
     * @secure
     */
    pegawaiDeleteControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/pegawai/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  masterUnitKerja = {
    /**
     * No description
     *
     * @tags Master - Unit Kerja
     * @name UnitKerjaGetControllerGetData
     * @summary Get daftar unit kerja (Superadmin, Koordinator)
     * @request GET:/api/unit-kerja
     * @secure
     */
    unitKerjaGetControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        tipe_unit?: "KOORDINATOR" | "SUB_KOORDINATOR";
        /** Filter parent unit */
        id_parent_unit?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: UnitKerjaItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/unit-kerja`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Unit Kerja
     * @name UnitKerjaPostControllerCreate
     * @summary Tambah unit kerja (Superadmin)
     * @request POST:/api/unit-kerja
     * @secure
     */
    unitKerjaPostControllerCreate: (
      data: CreateUnitKerjaDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponseCreate & {
          data?: UnitKerjaItemDto;
        },
        void
      >({
        path: `/api/unit-kerja`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Unit Kerja
     * @name UnitKerjaGetControllerGetTree
     * @summary Get struktur organisasi (tree) (Superadmin, Koordinator)
     * @request GET:/api/unit-kerja/tree
     * @secure
     */
    unitKerjaGetControllerGetTree: (params: RequestParams = {}) =>
      this.request<
        StandartResponse & {
          data?: UnitKerjaTreeNodeDto;
        },
        void
      >({
        path: `/api/unit-kerja/tree`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Unit Kerja
     * @name UnitKerjaPutControllerUpdate
     * @summary Update unit kerja (Superadmin)
     * @request PUT:/api/unit-kerja/{id}
     * @secure
     */
    unitKerjaPutControllerUpdate: (
      id: string,
      data: UpdateUnitKerjaDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: UnitKerjaItemDto;
        },
        void
      >({
        path: `/api/unit-kerja/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Unit Kerja
     * @name UnitKerjaDeleteControllerRemove
     * @summary Nonaktifkan unit kerja (Superadmin)
     * @request DELETE:/api/unit-kerja/{id}
     * @secure
     */
    unitKerjaDeleteControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/unit-kerja/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  masterProyek = {
    /**
     * No description
     *
     * @tags Master - Proyek
     * @name ProyekControllerGetData
     * @summary Get daftar proyek (Superadmin, Koordinator)
     * @request GET:/api/proyek
     * @secure
     */
    proyekControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        /** @example 2026 */
        tahun_fiscal?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: ProyekItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/proyek`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Proyek
     * @name ProyekControllerCreate
     * @summary Tambah proyek (Superadmin)
     * @request POST:/api/proyek
     * @secure
     */
    proyekControllerCreate: (
      data: CreateProyekDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponseCreate & {
          data?: ProyekItemDto;
        },
        void
      >({
        path: `/api/proyek`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Proyek
     * @name ProyekControllerGetDetail
     * @summary Get detail proyek (Superadmin, Koordinator)
     * @request GET:/api/proyek/{id}
     * @secure
     */
    proyekControllerGetDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        StandartResponse & {
          data?: ProyekItemDto;
        },
        void
      >({
        path: `/api/proyek/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Proyek
     * @name ProyekControllerUpdate
     * @summary Update proyek (Superadmin)
     * @request PUT:/api/proyek/{id}
     * @secure
     */
    proyekControllerUpdate: (
      id: string,
      data: UpdateProyekDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: ProyekItemDto;
        },
        void
      >({
        path: `/api/proyek/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Proyek
     * @name ProyekControllerRemove
     * @summary Hapus proyek (Superadmin)
     * @request DELETE:/api/proyek/{id}
     * @secure
     */
    proyekControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/proyek/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  masterRo = {
    /**
     * No description
     *
     * @tags Master - RO
     * @name RoControllerGetData
     * @summary Get daftar RO (Superadmin, Koordinator)
     * @request GET:/api/ro
     * @secure
     */
    roControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        /** Filter proyek */
        id_proyek?: string;
        /** Filter unit koordinator */
        id_unit_koordinator?: string;
        /** @example 2026 */
        tahun_fiscal?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: RoItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/ro`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - RO
     * @name RoControllerCreate
     * @summary Tambah RO (Superadmin)
     * @request POST:/api/ro
     * @secure
     */
    roControllerCreate: (data: CreateRoDto, params: RequestParams = {}) =>
      this.request<
        StandartResponseCreate & {
          data?: RoItemDto;
        },
        void
      >({
        path: `/api/ro`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - RO
     * @name RoControllerGetDetail
     * @summary Get detail RO (Superadmin, Koordinator)
     * @request GET:/api/ro/{id}
     * @secure
     */
    roControllerGetDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        StandartResponse & {
          data?: RoItemDto;
        },
        void
      >({
        path: `/api/ro/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - RO
     * @name RoControllerUpdate
     * @summary Update RO (Superadmin)
     * @request PUT:/api/ro/{id}
     * @secure
     */
    roControllerUpdate: (
      id: string,
      data: UpdateRoDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: RoItemDto;
        },
        void
      >({
        path: `/api/ro/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - RO
     * @name RoControllerRemove
     * @summary Hapus RO (Superadmin)
     * @request DELETE:/api/ro/{id}
     * @secure
     */
    roControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/ro/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  masterDanaOperasional = {
    /**
     * No description
     *
     * @tags Master - Dana Operasional
     * @name DanaOperasionalControllerGetData
     * @summary Get daftar dana operasional (Superadmin, Koordinator)
     * @request GET:/api/dana-operasional
     * @secure
     */
    danaOperasionalControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        /** Filter unit koordinator */
        id_unit_koordinator?: string;
        /** @example 2026 */
        tahun_fiscal?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: DanaOperasionalItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/dana-operasional`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Dana Operasional
     * @name DanaOperasionalControllerCreate
     * @summary Tambah dana operasional (Superadmin)
     * @request POST:/api/dana-operasional
     * @secure
     */
    danaOperasionalControllerCreate: (
      data: CreateDanaOperasionalDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponseCreate & {
          data?: DanaOperasionalItemDto;
        },
        void
      >({
        path: `/api/dana-operasional`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Dana Operasional
     * @name DanaOperasionalControllerGetDetail
     * @summary Get detail dana operasional (Superadmin, Koordinator)
     * @request GET:/api/dana-operasional/{id}
     * @secure
     */
    danaOperasionalControllerGetDetail: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: DanaOperasionalItemDto;
        },
        void
      >({
        path: `/api/dana-operasional/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Dana Operasional
     * @name DanaOperasionalControllerUpdate
     * @summary Update dana operasional (Superadmin)
     * @request PUT:/api/dana-operasional/{id}
     * @secure
     */
    danaOperasionalControllerUpdate: (
      id: string,
      data: UpdateDanaOperasionalDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: DanaOperasionalItemDto;
        },
        void
      >({
        path: `/api/dana-operasional/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Master - Dana Operasional
     * @name DanaOperasionalControllerRemove
     * @summary Hapus dana operasional (Superadmin)
     * @request DELETE:/api/dana-operasional/{id}
     * @secure
     */
    danaOperasionalControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/dana-operasional/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  sk = {
    /**
     * No description
     *
     * @tags SK
     * @name SkGetControllerGetData
     * @summary Get daftar SK (Superadmin, Koordinator)
     * @request GET:/api/sk
     * @secure
     */
    skGetControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        /** Filter pegawai */
        id_pegawai?: string;
        /** Filter unit kerja */
        id_unit_kerja?: string;
        /** Hanya SK aktif */
        status_aktif?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: SkItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/sk`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SK
     * @name SkPostControllerCreate
     * @summary Tambah SK (Superadmin)
     * @request POST:/api/sk
     * @secure
     */
    skPostControllerCreate: (data: CreateSkDto, params: RequestParams = {}) =>
      this.request<
        StandartResponseCreate & {
          data?: SkItemDto;
        },
        void
      >({
        path: `/api/sk`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SK
     * @name SkGetControllerGetRiwayat
     * @summary Get riwayat SK pegawai (Superadmin, Koordinator)
     * @request GET:/api/sk/pegawai/{pegawaiId}
     * @secure
     */
    skGetControllerGetRiwayat: (
      pegawaiId: string,
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        /** Filter pegawai */
        id_pegawai?: string;
        /** Filter unit kerja */
        id_unit_kerja?: string;
        /** Hanya SK aktif */
        status_aktif?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: SkItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/sk/pegawai/${pegawaiId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SK
     * @name SkPutControllerUpdate
     * @summary Update SK (Superadmin)
     * @request PUT:/api/sk/{id}
     * @secure
     */
    skPutControllerUpdate: (
      id: string,
      data: UpdateSkDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: SkItemDto;
        },
        void
      >({
        path: `/api/sk/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SK
     * @name SkDeleteControllerRemove
     * @summary Hapus SK (Superadmin)
     * @request DELETE:/api/sk/{id}
     * @secure
     */
    skDeleteControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/sk/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SK
     * @name SkPutControllerActivate
     * @summary Aktifkan/nonaktifkan SK (Superadmin)
     * @request PUT:/api/sk/{id}/activate
     * @secure
     */
    skPutControllerActivate: (
      id: string,
      data: ActivateSkDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: SkItemDto;
        },
        void
      >({
        path: `/api/sk/${id}/activate`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  alokasiGajiTa = {
    /**
     * No description
     *
     * @tags Alokasi Gaji TA
     * @name AlokasiGetControllerGetData
     * @summary Get daftar alokasi gaji TA (Superadmin, Koordinator)
     * @request GET:/api/alokasi-gaji
     * @secure
     */
    alokasiGetControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        /** Filter pegawai */
        id_pegawai?: string;
        /** Filter unit kerja (termasuk anak unit) */
        id_unit_kerja?: string;
        /**
         * @min 1
         * @max 12
         * @example 1
         */
        periode_bulan?: number;
        /** @example 2026 */
        periode_tahun?: number;
        sumber_dana?: "RO" | "OPERASIONAL";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: AlokasiItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/alokasi-gaji`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Alokasi Gaji TA
     * @name AlokasiPostControllerCreate
     * @summary Buat alokasi gaji TA (Superadmin, Koordinator)
     * @request POST:/api/alokasi-gaji
     * @secure
     */
    alokasiPostControllerCreate: (
      data: CreateAlokasiDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponseCreate & {
          data?: AlokasiItemDto;
        },
        void
      >({
        path: `/api/alokasi-gaji`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Alokasi Gaji TA
     * @name AlokasiPutControllerUpdate
     * @summary Update alokasi gaji TA (Superadmin, Koordinator)
     * @request PUT:/api/alokasi-gaji/{id}
     * @secure
     */
    alokasiPutControllerUpdate: (
      id: string,
      data: UpdateAlokasiDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: AlokasiItemDto;
        },
        void
      >({
        path: `/api/alokasi-gaji/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Alokasi Gaji TA
     * @name AlokasiDeleteControllerCancel
     * @summary Batalkan alokasi gaji TA (Superadmin, Koordinator)
     * @request DELETE:/api/alokasi-gaji/{id}
     * @secure
     */
    alokasiDeleteControllerCancel: (id: string, params: RequestParams = {}) =>
      this.request<
        StandartResponse & {
          data?: AlokasiItemDto;
        },
        void
      >({
        path: `/api/alokasi-gaji/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Alokasi Gaji TA
     * @name AlokasiRekapControllerGetRekap
     * @summary Rekap alokasi gaji TA bulanan (Superadmin, Koordinator)
     * @request GET:/api/alokasi-gaji/rekap
     * @secure
     */
    alokasiRekapControllerGetRekap: (
      query?: {
        /**
         * @min 1
         * @max 12
         * @example 1
         */
        periode_bulan?: number;
        /** @example 2026 */
        periode_tahun?: number;
        /** Filter unit (termasuk anak unit) */
        id_unit_kerja?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/alokasi-gaji/rekap`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Alokasi Gaji TA
     * @name AlokasiRekapControllerExportRekap
     * @summary Export rekap alokasi gaji TA ke Excel (Superadmin, Koordinator)
     * @request GET:/api/alokasi-gaji/rekap/export
     * @secure
     */
    alokasiRekapControllerExportRekap: (
      query?: {
        /**
         * @min 1
         * @max 12
         * @example 1
         */
        periode_bulan?: number;
        /** @example 2026 */
        periode_tahun?: number;
        /** Filter unit (termasuk anak unit) */
        id_unit_kerja?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/alokasi-gaji/rekap/export`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),
  };
  dashboard = {
    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardControllerGetSuperadminDashboard
     * @summary Dashboard superadmin (Superadmin)
     * @request GET:/api/dashboard/superadmin
     * @secure
     */
    dashboardControllerGetSuperadminDashboard: (
      query?: {
        /** @example 2026 */
        tahun?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/dashboard/superadmin`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardControllerGetKoordinatorUnitDashboard
     * @summary Dashboard koordinator untuk unit miliknya (Superadmin, Koordinator)
     * @request GET:/api/dashboard/koordinator-unit
     * @secure
     */
    dashboardControllerGetKoordinatorUnitDashboard: (
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/dashboard/koordinator-unit`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags Users
     * @name UsersGetControllerGetData
     * @summary Get daftar user (Superadmin)
     * @request GET:/api/users
     * @secure
     */
    usersGetControllerGetData: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
        role?: "SUPERADMIN" | "KOORDINATOR" | "KARYAWAN";
        status?: "AKTIF" | "NONAKTIF";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: UserItemDto[];
          pagination?: {
            /** @example 10 */
            limit?: number;
            /** @example 1 */
            page?: number;
            /** @example 1 */
            total_pages?: number;
            /** @example 1 */
            total_datas?: number;
          };
        },
        void
      >({
        path: `/api/users`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersPostControllerCreate
     * @summary Buat user baru (Superadmin)
     * @request POST:/api/users
     * @secure
     */
    usersPostControllerCreate: (
      data: CreateUserDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponseCreate & {
          data?: UserItemDto;
        },
        void
      >({
        path: `/api/users`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersPutControllerUpdate
     * @summary Update user (Superadmin)
     * @request PUT:/api/users/{id}
     * @secure
     */
    usersPutControllerUpdate: (
      id: string,
      data: UpdateUserDto,
      params: RequestParams = {},
    ) =>
      this.request<
        StandartResponse & {
          data?: UserItemDto;
        },
        void
      >({
        path: `/api/users/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  myProfile = {
    /**
     * No description
     *
     * @tags My Profile
     * @name MyProfileControllerGetProfile
     * @summary Profil saya (karyawan, koordinator, superadmin) (Superadmin, Koordinator, Karyawan)
     * @request GET:/api/my/profile
     * @secure
     */
    myProfileControllerGetProfile: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/my/profile`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags My Profile
     * @name MyProfileControllerGetMySk
     * @summary Riwayat SK saya (Superadmin, Koordinator, Karyawan)
     * @request GET:/api/my/sk
     * @secure
     */
    myProfileControllerGetMySk: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/my/sk`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags My Profile
     * @name MyProfileControllerGetMyAlokasi
     * @summary Riwayat alokasi gaji saya (Superadmin, Koordinator, Karyawan)
     * @request GET:/api/my/alokasi
     * @secure
     */
    myProfileControllerGetMyAlokasi: (
      query?: {
        /** Pencarian / filter bebas */
        query?: string;
        /** @default 10 */
        limit?: number;
        /** @default 1 */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/my/alokasi`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),
  };
}
