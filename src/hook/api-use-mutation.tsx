/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type SnackbarProps } from "@mui/material";

import network_cache from "./api-cache";
import { Api } from "@Hooks/api-generated";
import { auth_signal } from "@Signal/use-signal/auth-init-signal";
import { set_loading_to } from "@Signal/use-signal/loading-method-signal";
import { loading_progress_signal } from "@Signal/use-signal/loading-progress-init-signal";
import { close_dialog } from "@Signal/use-signal/dialog-method-signal";
import { show_alert_snackbar } from "@Signal/use-signal/snackbar_signal";

/**
 * Generate dynamic loading label berdasarkan method name
 * Contoh: 'create' -> 'Menambahkan...', 'update' -> 'Memperbarui...', 'delete' -> 'Menghapus...'
 */
function generateLoadingLabel(methodName: string): string {
  const method = methodName.toLowerCase();

  const labelMap: Record<string, string> = {
    create: "Menambahkan data...",
    post: "Menambahkan data...",
    add: "Menambahkan data...",
    insert: "Menambahkan data...",

    update: "Memperbarui data...",
    put: "Memperbarui data...",
    patch: "Memperbarui data...",
    edit: "Memperbarui data...",

    delete: "Menghapus data...",
    remove: "Menghapus data...",

    upload: "Mengunggah file...",
    download: "Mengunduh file...",
    export: "Mengekspor data...",
    import: "Mengimpor data...",

    fetch: "Mengambil data...",
    get: "Mengambil data...",
    list: "Mengambil data...",

    submit: "Mengirim data...",
    save: "Menyimpan data...",
    sync: "Menyinkronkan data...",
  };

  // Cek exact match
  if (labelMap[method]) {
    return labelMap[method];
  }

  // Cek partial match (method contains key)
  for (const [key, label] of Object.entries(labelMap)) {
    if (method.includes(key)) {
      return label;
    }
  }

  // Default fallback
  return "Memproses...";
}

export type UseMutationOptions<
  Tags extends keyof Api<any>,
  Method extends keyof Api<any>[Tags],
  Data extends Api<any>[Tags][Method] extends (...Others: any) => any
    ? // @ts-ignore
      AsyncReturnType<Api<any>[Tags][Method]>
    : Api<any>[Tags][Method],
> = {
  call_back?: () => void;
  will_exec_after_success?: (Response: Data, Others?: Array<any>) => void;
  will_exec_after_error?: (Error: any, Others?: Array<any>) => void;
  should_disable_loading?: boolean;
  should_disable_success_message?: boolean;
  should_disable_error_message?: boolean;
  should_disable_autoclose_drawer?: boolean;
  should_disable_autoclose_stack?: boolean;
  message_type?: "swal" | "snackbar" | "toast";
  error_message_type?: "swal" | "snackbar" | "toast";
  success_message_text?: string;
  snackbar_props?: SnackbarProps;
  async_loading_progress?: {
    label: string;
  };
  /**
   * Custom loading label - jika tidak diberikan, akan generate otomatis
   * Contoh: 'Menyimpan data...', 'Mengupload file...', 'Menghapus...'
   */
  loading_label?: string;
};

export type UseMutationProps<
  Tags extends keyof Api<any>,
  Method extends keyof Api<any>[Tags],
  Data extends Api<any>[Tags][Method] extends (...Others: any) => any
    ? // @ts-ignore
      AsyncReturnType<Api<any>[Tags][Method]>
    : Api<any>[Tags][Method],
> = {
  api_tag: Tags;
  api_method: Method;
  options?: UseMutationOptions<Tags, Method, Data>;
};

export default function use_mutation<
  Tags extends keyof Api<any>,
  Method extends keyof Api<any>[Tags],
  Data extends Api<any>[Tags][Method] extends (...args: any) => any
    ? // @ts-ignore
      AsyncReturnType<Api<any>[Tags][Method]>
    : Api<any>[Tags][Method],
>({ api_tag, api_method, options }: UseMutationProps<Tags, Method, Data>) {
  if (!options) options = {};

  if (!options.error_message_type) options.error_message_type = "toast";

  async function created_mutation(Params: Api<any>[Tags][Method] extends (...args: any) => any ? Parameters<Api<any>[Tags][Method]> : Api<any>[Tags][Method], Others?: Array<any>): Promise<Data | undefined> {
    const call_api_endpoint = new Api({
      baseApiParams: {
        headers: {
          authorization: `Bearer ${auth_signal.value.selectedToken || ""}`,
        },
      },
    })[api_tag][api_method];

    if (typeof call_api_endpoint !== "function") return;
    if (!options?.should_disable_loading) set_loading_to(true);

    // Set loading label - prioritas: custom label > async_loading_progress > generate otomatis
    const defaultLabel = generateLoadingLabel(api_method as string);
    const loadingLabel = options?.loading_label || options?.async_loading_progress?.label || defaultLabel;
    loading_progress_signal.value = loadingLabel;

    try {
      const response_server = await call_api_endpoint(...(Params as Array<any>));
      if (!options?.should_disable_autoclose_stack) close_dialog();
      if (options?.call_back) {
        network_cache.clear();
        setTimeout(() => {
          options?.call_back?.();
        }, 10);
      }

      options?.will_exec_after_success?.(response_server, Others);
      if (!options?.should_disable_success_message) {
        show_alert_snackbar({
          message: options?.success_message_text ?? response_server?.data?.message ?? "Berhasil",
          severity: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
      }
      return response_server;
    } catch (error: any) {
      // catch (error: any) {
      //   // console.log(error.error.error)
      //   // console.log(error.status);
      //   options?.will_exec_after_error?.(error, Others);
      //   const statusCode = error.status;
      //   const backend_message = error?.error?.message;
      //   let error_message = (() => {
      //     if (error?.error?.message)
      //       if (backend_message)
      //         // return console.log(error.error.error.message);
      //         return backend_message;
      //     return "Error";
      //   })();
      //   if (statusCode === 500) error_message = "Internal Server Error";
      //   if (!options?.should_disable_error_message) {
      //     try {
      //       show_alert_snackbar({
      //         severity: "error",
      //         message: error_message,
      //         anchorOrigin: { vertical: "bottom", horizontal: "center" },
      //       });

      //       // If we have an array of errors, show each one separately
      //     } catch {
      //       // If parsing fails, show the original error message
      //       if (options?.error_message_type === "snackbar")
      //         show_alert_snackbar({
      //           severity: "error",
      //           message: error_message,
      //           anchorOrigin: { vertical: "bottom", horizontal: "center" },
      //         });
      //     }
      //   }

      //   return error;
      // } finally {
      //   set_loading_to(false);
      //   loading_progress_signal.value = null;
      // }

      options?.will_exec_after_error?.(error, Others);

      let errorBody: any = null;

      // Response body belum terparse (data/error masih null) — coba baca langsung
      if (typeof error?.json === "function") {
        try {
          errorBody = await error.clone().json();
        } catch {
          errorBody = null;
        }
      }

      const statusCode = error?.status ?? errorBody?.statusCode;
      const backend_message = errorBody?.message || error?.error?.message || error?.message;

      let error_message = backend_message || "Error";
      if (statusCode === 500) error_message = "Internal Server Error";

      if (!options?.should_disable_error_message) {
        show_alert_snackbar({
          severity: "error",
          message: error_message,
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
      }

      return error;
    } finally {
      set_loading_to(false);
      loading_progress_signal.value = null;
    }
  }

  return created_mutation;
}
