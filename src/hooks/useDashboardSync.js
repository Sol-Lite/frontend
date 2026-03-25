import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import useWidgetStore from '@/store/useWidgetStore'
import { dashboardApi } from '@/api/dashboard'
import { toApiPayload } from '@/store/widgetApi'

/**
 * 로그인 상태에 따라 서버에서 대시보드 레이아웃을 불러와 store에 반영.
 * AppShell에서 한 번 호출.
 *
 * - 로그인 시:  GET /api/dashboards/me → loadFromServer()
 * - 로그아웃 시: store를 INITIAL 레이아웃으로 초기화
 */
export function useDashboardLoad() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoaded = useWidgetStore((s) => s.isLoaded)
  const loadFromServer = useWidgetStore((s) => s.loadFromServer)
  const resetLayout = useWidgetStore((s) => s.resetLayout)

  // 로그아웃 시 레이아웃 초기화 → 재로그인 시 서버에서 새로 불러올 수 있도록
  useEffect(() => {
    if (!isAuthenticated) resetLayout()
  }, [isAuthenticated, resetLayout])

  const { data } = useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: dashboardApi.getMyDashboard,
    enabled: isAuthenticated && !isLoaded,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (data) loadFromServer(data)
  }, [data, loadFromServer])
}

/**
 * 대시보드 레이아웃을 서버에 저장하는 mutation.
 * 편집 모드 저장 버튼에서 호출.
 *
 * @returns useMutation result (mutate, isPending, isError 등)
 */
export function useDashboardSave() {
  const pages = useWidgetStore((s) => s.pages)
  return useMutation({
    mutationFn: () => dashboardApi.saveMyDashboard(toApiPayload(pages)),
  })
}
