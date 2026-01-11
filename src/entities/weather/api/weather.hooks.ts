import { useMemo } from 'react'
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { KmaClient } from '@/entities/weather/api/weather.client'
import {
  type GetUltraSrtNcstParams,
  type GetUltraSrtFcstParams,
  type GetVilageFcstParams,
  type GetFcstVersionParams,
  type UltraSrtNcstItem,
  type UltraSrtFcstItem,
  type VilageFcstItem,
  type FcstVersionItem,
  type UltraSrtNcstBody,
  type UltraSrtFcstBody,
  type VilageFcstBody,
  type FcstVersionBody,
} from '@/entities/weather/types/types'

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error>,
  'queryKey' | 'queryFn'
>

function getServiceKeyFromEnv(): { key: string } {
  // 우선순위: VITE_OPEN_API_KEY → VITE_KMA_SERVICE_KEY
  const encoded = (import.meta as any).env?.VITE_OPEN_API_KEY as
    | string
    | undefined
  const decoded = (import.meta as any).env?.VITE_KMA_SERVICE_KEY as
    | string
    | undefined
  if (encoded) return { key: encoded }
  if (decoded) return { key: decoded }
  return { key: '' }
}

export function useKmaClient(): KmaClient {
  return useMemo(() => {
    const { key } = getServiceKeyFromEnv()
    return new KmaClient({
      serviceKey: key,
      defaultDataType: 'JSON',
    })
  }, [])
}

// 초단기실황
export function useUltraSrtNcstQuery<
  TData = UltraSrtNcstItem[] | UltraSrtNcstBody,
>(
  params: GetUltraSrtNcstParams,
  options?: QueryOpts<TData>,
  raw?: boolean,
): UseQueryResult<TData, Error> {
  const client = useKmaClient()
  return useQuery<TData, Error>({
    queryKey: ['kma', 'getUltraSrtNcst', params],
    queryFn: async () => {
      const p = { ...params, dataType: 'JSON' } as const
      if (raw) {
        return (await client.getUltraSrtNcst(p, { raw: true })) as TData
      }
      return (await client.getUltraSrtNcst(p)) as TData
    },
    ...options,
  })
}

// 초단기예보
export function useUltraSrtFcstQuery<
  TData = UltraSrtFcstItem[] | UltraSrtFcstBody,
>(
  params: GetUltraSrtFcstParams,
  options?: QueryOpts<TData>,
  raw?: boolean,
): UseQueryResult<TData, Error> {
  const client = useKmaClient()
  return useQuery<TData, Error>({
    queryKey: ['kma', 'getUltraSrtFcst', params],
    queryFn: async () => {
      const p = { ...params, dataType: 'JSON' } as const
      if (raw) {
        return (await client.getUltraSrtFcst(p, { raw: true })) as TData
      }
      return (await client.getUltraSrtFcst(p)) as TData
    },
    ...options,
  })
}

// 단기예보
export function useVilageFcstQuery<TData = VilageFcstItem[] | VilageFcstBody>(
  params: GetVilageFcstParams,
  options?: QueryOpts<TData>,
  raw?: boolean,
): UseQueryResult<TData, Error> {
  const client = useKmaClient()
  return useQuery<TData, Error>({
    queryKey: ['kma', 'getVilageFcst', params],
    queryFn: async () => {
      const p = { ...params, dataType: 'JSON' } as const
      if (raw) {
        return (await client.getVilageFcst(p, { raw: true })) as TData
      }
      return (await client.getVilageFcst(p)) as TData
    },
    ...options,
  })
}

// 예보버전
export function useFcstVersionQuery<
  TData = FcstVersionItem[] | FcstVersionBody,
>(
  params: GetFcstVersionParams,
  options?: QueryOpts<TData>,
  raw?: boolean,
): UseQueryResult<TData, Error> {
  const client = useKmaClient()
  return useQuery<TData, Error>({
    queryKey: ['kma', 'getFcstVersion', params],
    queryFn: async () => {
      const p = { ...params, dataType: 'JSON' } as const
      if (raw) {
        return (await client.getFcstVersion(p, { raw: true })) as TData
      }
      return (await client.getFcstVersion(p)) as TData
    },
    ...options,
  })
}
