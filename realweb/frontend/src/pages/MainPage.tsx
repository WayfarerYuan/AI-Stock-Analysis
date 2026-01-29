import Dashboard from './Dashboard';
import Tasks from './Tasks';
import Config from './Config';
import { Separator } from '../components/ui/separator';

export default function MainPage() {
  return (
    <div className="h-full space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Search and Hero Section */}
      <section id="dashboard-section" className="shrink-0">
        <Dashboard />
      </section>

      <Separator className="shrink-0" />

      {/* Tasks and Config Section - Stack on mobile, side by side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <section id="config-section">
          <Config />
        </section>

        <section id="tasks-section">
          <Tasks />
        </section>
      </div>
    </div>
  );
}
