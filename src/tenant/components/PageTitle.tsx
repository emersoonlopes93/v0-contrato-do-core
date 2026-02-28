'use client';

import React from 'react';

type PageTitleProps = {
  title: string;
  description?: string;
};

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

