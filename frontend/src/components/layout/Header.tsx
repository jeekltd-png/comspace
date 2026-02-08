'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { FiShoppingCart, FiUser, FiMenu, FiSearch, FiX, FiPackage, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import ThemeToggle from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { items } = useAppSelector(state => state.cart);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Track scroll for glass effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchRef.current) searchRef.current.focus();
  }, [isSearchOpen]);

  // Close mobile menu on route change
  useEffect(() => { setIsMenuOpen(false); }, []);

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileOpen(false);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl shadow-glass border-b border-gray-200/50 dark:border-gray-800/50'
            : 'bg-white dark:bg-surface-950 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" aria-label="ComSpace Home">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-shadow">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">ComSpace</span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full group">
                <label htmlFor="desktop-search" className="sr-only">Search products</label>
                <input
                  id="desktop-search"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input-field pl-11 py-2.5 rounded-2xl bg-gray-100/80 dark:bg-surface-800/80 border-gray-200/50 dark:border-gray-700/50 group-hover:border-brand-300 dark:group-hover:border-brand-600"
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              <Link href="/products" className="btn-ghost text-sm">
                Products
              </Link>
              <ThemeToggle />

              {/* Search toggle for mobile */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden btn-ghost p-2"
                aria-label="Toggle search"
              >
                <FiSearch className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="btn-ghost p-2 relative"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <FiShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scale-in shadow-brand">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="btn-ghost p-2 flex items-center gap-2"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white text-sm font-bold">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-card p-2 animate-slide-down" role="menu">
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" role="menuitem" onClick={() => setIsProfileOpen(false)}>
                        <FiUser className="w-4 h-4 text-gray-400" />
                        Profile
                      </Link>
                      <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" role="menuitem" onClick={() => setIsProfileOpen(false)}>
                        <FiPackage className="w-4 h-4 text-gray-400" />
                        Orders
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'merchant' || user?.role?.startsWith?.('admin')) && (
                        <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" role="menuitem" onClick={() => setIsProfileOpen(false)}>
                          <FiSettings className="w-4 h-4 text-gray-400" />
                          Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          role="menuitem"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="btn-ghost text-sm">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary text-sm py-2 px-4">
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile right actions */}
            <div className="flex md:hidden items-center gap-1">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="btn-ghost p-2" aria-label="Search">
                <FiSearch className="w-5 h-5" />
              </button>
              <Link href="/cart" className="btn-ghost p-2 relative" aria-label={`Cart (${cartCount})`}>
                <FiShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                className="btn-ghost p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search overlay */}
        {isSearchOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 p-4 animate-slide-down bg-white dark:bg-surface-950">
            <form onSubmit={handleSearch}>
              <label htmlFor="mobile-search" className="sr-only">Search products</label>
              <div className="relative">
                <input
                  id="mobile-search"
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input-field pl-11"
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {isMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 dark:border-gray-800 p-4 space-y-1 animate-slide-down bg-white dark:bg-surface-950" aria-label="Mobile navigation">
            <Link href="/products" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium">
              Products
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <FiUser className="w-4 h-4" /> Profile
                </Link>
                <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <FiPackage className="w-4 h-4" /> Orders
                </Link>
                {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'merchant' || user?.role?.startsWith?.('admin')) && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <FiSettings className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-gray-500">Theme</span>
                    <ThemeToggle />
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <FiLogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 space-y-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-gray-500">Theme</span>
                  <ThemeToggle />
                </div>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-center btn-ghost w-full">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block text-center btn-primary w-full">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
