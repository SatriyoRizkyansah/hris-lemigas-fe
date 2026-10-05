/**
 * Custom hook untuk menghitung jumlah notifikasi penerimaan yang pending
 * Berdasarkan role user, akan menampilkan notifikasi yang relevan
 */

import { useMemo } from "react";
import use_query from "./api-use-query";
import { EOrderDirection, EMutasiLokasiConsumableOrderField, EMutasiLokasiFixedAsetOrderField, EPengadaanMandiriOrderField, EPengajuanPengadaanOrderField, EJenisActor } from "./api-generated.ts";
import { useSignalValue } from "../library/@signal-private/hooks/hooks";
import { auth_signal } from "../library/@signal-private/use-signal/auth-init-signal";

export interface NotificationItem {
  id: string;
  type: "mutasi-fixed" | "mutasi-consumable" | "pengadaan" | "pengadaan-mandiri";
  title: string;
  description: string;
  timestamp: string;
  link: string;
}

interface AuthStateShape {
  selectedAuthorization?: {
    jenis_actor?: string;
  };
  data?: {
    jenis_actor?: string;
  };
  selectedToken?: string;
}

export function useNotificationCount() {
  const authState = useSignalValue(auth_signal) as AuthStateShape;
  const currentRole = (authState?.selectedAuthorization?.jenis_actor || authState?.data?.jenis_actor) as EJenisActor | undefined;

  const canReadNotifications = Boolean(authState?.selectedToken && currentRole);
  const canAccessPengadaan = currentRole === EJenisActor.UNIVERSITAS || currentRole === EJenisActor.YAYASAN;

  // Fetch data mutasi fixed asset
  const mutasiFixedQuery = use_query({
    api_tag: "mutasiLokasiFixedAset",
    api_method: "mutasiLokasiFixedAsetPaginate",
    api_query: [
      {
        limit: 10,
        orderBy: EMutasiLokasiFixedAsetOrderField.DibuatPada,
        orderDirection: EOrderDirection.Desc,
      },
    ],
    should_running_if: canReadNotifications,
    options: { should_disable_error_message: true },
  });

  // Fetch data mutasi consumable (yang belum diterima)
  const mutasiConsumableQuery = use_query({
    api_tag: "mutasiLokasiConsumable",
    api_method: "mutasiLokasiConsumablePaginate",
    api_query: [
      {
        limit: 10,
        orderBy: EMutasiLokasiConsumableOrderField.DibuatPada,
        orderDirection: EOrderDirection.Desc,
      },
    ],
    should_running_if: canReadNotifications,
    options: { should_disable_error_message: true },
  });

  // Fetch data pengadaan yang belum diterima
  const pengadaanQuery = use_query({
    api_tag: "pengajuanPengadaan",
    api_method: "pengajuanPengadaanPaginate",
    api_query: [
      {
        limit: 10,
        status_terima: false,
        orderBy: EPengajuanPengadaanOrderField.DibuatPada,
        orderDirection: EOrderDirection.Desc,
      },
    ],
    should_running_if: canReadNotifications && canAccessPengadaan,
    options: { should_disable_error_message: true },
  });

  // Fetch data pengadaan mandiri yang belum diterima
  const pengadaanMandiriQuery = use_query({
    api_tag: "pengadaanMandiri",
    api_method: "pengadaanMandiriPaginate",
    api_query: [
      {
        limit: 10,
        status_terima: false,
        orderBy: EPengadaanMandiriOrderField.DibuatPada,
        orderDirection: EOrderDirection.Desc,
      },
    ],
    should_running_if: canReadNotifications,
    options: { should_disable_error_message: true },
  });

  // Hitung total notifications dan buat list
  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    // Mutasi Fixed Asset
    const mutasiFixedItems = mutasiFixedQuery.response?.data || [];
    mutasiFixedItems.forEach((item: any) => {
      items.push({
        id: `mutasi-fixed-${item.id}`,
        type: "mutasi-fixed",
        title: "Mutasi Aset Tetap",
        description: `${item.jumlah_item} item menunggu konfirmasi penerimaan`,
        timestamp: item.dibuat_pada || "",
        link: "/transaksi/penerimaan",
      });
    });

    // Mutasi Consumable (filter yang belum diterima)
    const mutasiConsumableItems = (mutasiConsumableQuery.response?.data || []).filter((item: any) => item.jumlah_barang_diterima === null);
    mutasiConsumableItems.forEach((item: any) => {
      items.push({
        id: `mutasi-consumable-${item.id}`,
        type: "mutasi-consumable",
        title: "Mutasi Consumable",
        description: `${item.variasi_aset?.nama || "Item"} menunggu konfirmasi`,
        timestamp: item.dibuat_pada || "",
        link: "/transaksi/penerimaan",
      });
    });

    // Pengadaan
    if (canAccessPengadaan) {
      const pengadaanItems = (pengadaanQuery.response?.data || []).filter((item: any) => !item.status_terima);
      pengadaanItems.forEach((item: any) => {
        items.push({
          id: `pengadaan-${item.id}`,
          type: "pengadaan",
          title: "Pengadaan Baru",
          description: `${item.actor_pengada?.nama || "Pengadaan"} menunggu penerimaan`,
          timestamp: item.dibuat_pada || "",
          link: `/transaksi/pengadaan/detail/${item.id}`,
        });
      });
    }

    // Pengadaan Mandiri
    const pengadaanMandiriItems = (pengadaanMandiriQuery.response?.data || []).filter((item: any) => !item.status_terima);
    pengadaanMandiriItems.forEach((item: any) => {
      items.push({
        id: `pengadaan-mandiri-${item.id}`,
        type: "pengadaan-mandiri",
        title: "Pengadaan Mandiri",
        description: `${item.actor_pengada?.nama || "Pengadaan Mandiri"} menunggu penerimaan`,
        timestamp: item.dibuat_pada || "",
        link: `/transaksi/pengadaan-mandiri/detail/${item.id}`,
      });
    });

    // Sort by timestamp (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [mutasiFixedQuery.response?.data, mutasiConsumableQuery.response?.data, pengadaanQuery.response?.data, pengadaanMandiriQuery.response?.data, canAccessPengadaan]);

  const isLoading = mutasiFixedQuery.is_loading || mutasiConsumableQuery.is_loading || (canAccessPengadaan && pengadaanQuery.is_loading) || pengadaanMandiriQuery.is_loading;

  return {
    notifications,
    count: notifications.length,
    isLoading,
    refresh: () => {
      if (!canReadNotifications) return;
      mutasiFixedQuery.call_back?.();
      mutasiConsumableQuery.call_back?.();
      if (canAccessPengadaan) {
        pengadaanQuery.call_back?.();
      }
      pengadaanMandiriQuery.call_back?.();
    },
  };
}
