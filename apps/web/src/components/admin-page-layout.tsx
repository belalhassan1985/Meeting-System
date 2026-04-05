'use client'

import { ReactNode } from 'react'

interface AdminPageLayoutProps {
  title: string
  description?: string
  children: ReactNode
  headerAction?: ReactNode
}

export function AdminPageLayout({ title, description, children, headerAction }: AdminPageLayoutProps) {
  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        {headerAction && (
          <div className="w-full sm:w-auto">
            {headerAction}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  )
}
