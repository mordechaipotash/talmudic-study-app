import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavigationState {
  currentPath: string[]
  expandedNodes: string[]
  sessionId: string
  
  addToPath: (ref: string) => void
  goBack: () => void
  goHome: () => void
  toggleNode: (ref: string) => void
  setSessionId: (id: string) => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      currentPath: [],
      expandedNodes: [],
      sessionId: '',
      
      addToPath: (ref) => set((state) => ({
        currentPath: [...state.currentPath, ref],
      })),
      
      goBack: () => set((state) => ({
        currentPath: state.currentPath.slice(0, -1),
      })),
      
      goHome: () => set(() => ({
        currentPath: [],
      })),
      
      toggleNode: (ref) => set((state) => ({
        expandedNodes: state.expandedNodes.includes(ref)
          ? state.expandedNodes.filter(r => r !== ref)
          : [...state.expandedNodes, ref],
      })),
      
      setSessionId: (id) => set(() => ({
        sessionId: id,
      })),
    }),
    {
      name: 'navigation-storage',
    }
  )
)