import { create } from 'zustand'

interface Lead {
  id: string
  name: string
  email: string
  company: string
  status: 'New' | 'Emailed' | 'Replied'
  created_at: string
}

interface AppState {
  user: any | null
  leads: Lead[]
  setUser: (user: any) => void
  setLeads: (leads: Lead[]) => void
  addLead: (lead: Lead) => void
  updateLeadStatus: (id: string, status: Lead['status']) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  leads: [],
  setUser: (user) => set({ user }),
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLeadStatus: (id, status) => set((state) => ({
    leads: state.leads.map((l) => l.id === id ? { ...l, status } : l)
  })),
}))
