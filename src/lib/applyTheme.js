import { userApi } from '@/api/user'
import useUIStore from '@/store/useUIStore'

export async function applyThemeFromServer() {
  try {
    const profile = await userApi.getProfile()
    if (profile?.theme) useUIStore.getState().setTheme(profile.theme.toLowerCase())
  } catch {}
}
