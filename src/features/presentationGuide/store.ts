import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { GUIDE_STEPS } from './steps'

interface GuideState {
  isOpen: boolean
  index: number
  /** 닫혔던 자리에서 이어본다 — 처음으로 되돌리는 것은 restart 뿐이다 */
  open: () => void
  close: () => void
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  restart: () => void
}

const clamp = (index: number) => Math.min(Math.max(index, 0), GUIDE_STEPS.length - 1)

/** localStorage 키. 스텝 구성이 바뀌면 STORAGE_VERSION 을 올려 옛 인덱스를 버린다. */
const STORAGE_KEY = 'erp-project/guide'
const STORAGE_VERSION = 1

/** 테스트(node 환경)에는 localStorage 가 없다 — erpStore 와 같은 대체 저장소를 쓴다 */
const memoryStorage = ((): StateStorage => {
  const values = new Map<string, string>()
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => {
      values.set(name, value)
    },
    removeItem: (name) => {
      values.delete(name)
    },
  }
})()

const stateStorage = (): StateStorage =>
  typeof localStorage === 'undefined' ? memoryStorage : localStorage

/**
 * 발표 가이드가 지금 몇 번째 스텝을 보여주고 있는지만 들고 있다.
 *
 * 실제 화면 이동 · 하이라이트는 GuideOverlay 가 이 인덱스를 보고 한다 — 스토어는
 * "지금 몇 번째냐" 만 알고 라우팅은 모른다.
 *
 * 인덱스만 저장한다. 리허설 중에 닫았다가 다시 열어도, 심지어 새로고침해도 보던
 * 자리부터 이어볼 수 있어야 한다 — 발표 직전에 몇 번을 열고 닫으며 연습하는 화면이다.
 */
export const useGuideStore = create<GuideState>()(
  persist(
    (set) => ({
      isOpen: false,
      index: 0,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      next: () => set((state) => ({ index: clamp(state.index + 1) })),
      prev: () => set((state) => ({ index: clamp(state.index - 1) })),
      goTo: (index) => set({ index: clamp(index) }),
      restart: () => set({ index: 0 }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(stateStorage),
      // isOpen 은 저장하지 않는다 — 다른 일로 새로고침했을 뿐인데 가이드가 저절로
      // 다시 뜨면 그게 더 당황스럽다. "발표 가이드" 버튼을 다시 눌러야 연다.
      partialize: (state) => ({ index: state.index }),
    },
  ),
)
