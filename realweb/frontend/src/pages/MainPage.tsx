import React from 'react';
import Dashboard from './Dashboard';
import Tasks from './Tasks';
import Config from './Config';
import { Separator } from '../components/ui/separator';

export default function MainPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden gap-6">
      {/* Search and Hero Section */}
      <section id="dashboard-section" className="shrink-0">
        <Dashboard />
      </section>

      <Separator className="shrink-0" />

      {/* Tasks and Config Section */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden pb-2">
        <section id="config-section" className="h-full min-h-0 flex flex-col overflow-hidden">
          <Config />
        </section>

        <section id="tasks-section" className="h-full min-h-0 flex flex-col overflow-hidden">
          <Tasks />
        </section>
      </div>
    </div>
  );
}
