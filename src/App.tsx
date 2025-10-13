/**
 * Enhanced App shell: header + responsive layout (Stepper | Wizard | AI Chat).
 */
import AppShell from './layout/AppShell'
import PlanRightWizard from './features/wizard/PlanRightWizard'
import { usePlanRightStore } from './store'

export default function App() {
  const { role, setRole } = usePlanRightStore()
  return (
    <AppShell role={role}>
      <PlanRightWizard role={role} onChangeRole={setRole} />
    </AppShell>
  )
}

