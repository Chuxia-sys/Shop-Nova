import { create } from "zustand";

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isCartOpen: boolean;
  isSidebarOpen: boolean;
  activeModal: string | null;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toggleMobileMenu: () => void;
  toggleSearch: () => void;
  toggleCart: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isCartOpen: false,
  isSidebarOpen: false,
  activeModal: null,

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setCartOpen: (open) => set({ isCartOpen: open }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  toggleMobileMenu: () => set({ isMobileMenuOpen: !get().isMobileMenuOpen }),
  toggleSearch: () => set({ isSearchOpen: !get().isSearchOpen }),
  toggleCart: () => set({ isCartOpen: !get().isCartOpen }),
  toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
}));
