import { create } from 'zustand'

interface Lead {
  id: string
  name: string
  email: string
  company: string
  status: 'New' | 'Emailed' | 'Replied'
  campaign_id?: string
  created_at: string
}

interface AppState {
  user: any | null
  leads: Lead[]
  selectedLead: Lead | null
  setUser: (user: any) => void
  setLeads: (leads: Lead[]) => void
  setSelectedLead: (lead: Lead | null) => void
  addLead: (lead: Lead) => void
  updateLeadStatus: (id: string, status: Lead['status']) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  leads: [],
  selectedLead: null,
  setUser: (user) => set({ user }),
  setLeads: (leads) => set({ leads }),
  setSelectedLead: (selectedLead) => set({ selectedLead }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLeadStatus: (id, status) => set((state) => ({
    leads: state.leads.map((l) => l.id === id ? { ...l, status } : l)
  })),
}))
