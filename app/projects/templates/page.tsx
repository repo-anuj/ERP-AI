'use client';

import React from 'react';
import { TemplateManager } from '@/components/projects/template-manager';

export default function ProjectTemplatesPage() {
  return (
    <div className="container mx-auto p-6">
      <TemplateManager showActions={true} />
    </div>
  );
}
