import React, { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import AssistantPanel from '../components/AssistantPanel'
import FullscreenToggle from '../components/FullscreenToggle'
import type { UserRole } from '../utils/roleCopy'

interface AppShellProps {
  children: React.ReactNode
  role?: UserRole
}

/**
 * Main app shell with responsive CSS Grid layout
 * Desktop ≥ 1024px: [Sidebar | Main | Assistant] = 280px | 1fr | 360px
 * Compact ≤ 1023px: single column Main only, full width
 */
export default function AppShell({ children, role }: AppShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false)

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 lg:px-6 xl:px-8 py-4 h-16">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-xl text-slate-900">PlanRight Pro</div>
              <div className="text-sm text-slate-500">Exempt Development Assessment — Sheds • Patios • Carports</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {role && <Badge kind="info">Role: {role}</Badge>}
            
            {/* Compact mode buttons */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Steps button */}
              <button
                onClick={() => setIsSidebarDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-600 text-white text-sm hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                Steps
              </button>
              
              {/* Assistant button */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                Assistant
              </button>
              
              {/* Fullscreen toggle */}
              <FullscreenToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with responsive layout */}
      <main className="pt-20 px-4 lg:px-6 xl:px-8 py-6">
        {/* Desktop layout: Sidebar | Main | Assistant */}
        <div className="hidden lg:grid grid-cols-[280px_minmax(0,1fr)_360px] gap-6 max-w-screen-xl mx-auto">
          {children}
          
          {/* Desktop Assistant Panel */}
          <aside className="sticky top-[80px] w-[360px] max-w-[360px] min-w-0">
            <AssistantPanel role={role || 'User'} />
          </aside>
        </div>

        {/* Compact layout: single column */}
        <div className="lg:hidden block max-w-none w-full">
          {children}
        </div>
      </main>

      {/* Sidebar Drawer (compact) */}
      {isSidebarDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsSidebarDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl z-50 lg:hidden">
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Steps</h3>
                <button
                  onClick={() => setIsSidebarDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Drawer Content - This will be populated by the wizard */}
              <div className="flex-1 min-h-0 p-4">
                {/* Placeholder for stepper content */}
                <div className="text-sm text-slate-500">Stepper content will be rendered here</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assistant Drawer (compact) */}
      {isMobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-x-0 bottom-0 h-[60vh] rounded-t-2xl bg-white shadow-2xl z-50 lg:hidden">
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">AI Assistant</h3>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Drawer Content */}
              <div className="flex-1 min-h-0">
                <AssistantPanel role={role || 'User'} className="h-full max-h-none rounded-none border-none shadow-none" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Prevent body scroll when drawers are open */}
      {(isMobileDrawerOpen || isSidebarDrawerOpen) && (
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              overflow: hidden;
            }
          `
        }} />
      )}
    </div>
  )
}
