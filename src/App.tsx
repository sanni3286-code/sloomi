import { useEffect, useState } from 'react';
import { useSettingsStore } from './store/settingsStore';
import { usePlansStore } from './store/plansStore';
import { usePreferencesStore } from './store/preferencesStore';
import { useSessionStore } from './store/sessionStore';
import { useAuthStore } from './store/authStore';
import { useTodosStore } from './store/todosStore';
import { NavBar, type NavTab } from './components/layout/NavBar';
import { Onboarding } from './components/onboarding/Onboarding';
import { TodayPage } from './pages/TodayPage';
import { TasksPage } from './pages/TasksPage';
import { PlansPage } from './pages/PlansPage';
import { SettingsPage } from './pages/SettingsPage';
import { TimerView } from './components/session/TimerView';

function useAppliedTheme() {
  const theme = useSettingsStore((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}

export default function App() {
  const [tab, setTab] = useState<NavTab>('today');
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const onboardingCompleted = useSettingsStore((s) => s.settings.onboardingCompleted);
  const initSettings = useSettingsStore((s) => s.init);
  const initPlans = usePlansStore((s) => s.init);
  const initPreferences = usePreferencesStore((s) => s.init);
  const initSession = useSessionStore((s) => s.init);
  const sessionHydrated = useSessionStore((s) => s.hydrated);
  const session = useSessionStore((s) => s.session);
  const initAuth = useAuthStore((s) => s.init);
  const initTodos = useTodosStore((s) => s.init);

  useEffect(() => {
    void initSettings();
    void initPlans().then(() => initAuth());
    void initPreferences();
    void initSession();
    void initTodos();
  }, [initSettings, initPlans, initPreferences, initSession, initAuth, initTodos]);

  useAppliedTheme();

  if (!settingsHydrated || !sessionHydrated) {
    return <div className="flex-1 flex items-center justify-center" />;
  }

  if (!onboardingCompleted) {
    return <Onboarding />;
  }

  const sessionActive = session && (session.status === 'running' || session.status === 'paused' || session.status === 'completed');

  return (
    <>
      <main className="flex flex-1 flex-col">
        {sessionActive ? (
          <TimerView />
        ) : (
          <>
            {tab === 'today' && <TodayPage onPlanTasks={() => setTab('tasks')} />}
            {tab === 'tasks' && <TasksPage />}
            {tab === 'plans' && <PlansPage />}
            {tab === 'settings' && <SettingsPage />}
          </>
        )}
      </main>
      {!sessionActive && <NavBar active={tab} onChange={setTab} />}
    </>
  );
}
