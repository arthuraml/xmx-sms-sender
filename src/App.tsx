import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

import LandingPage from '@/pages/landing'
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import DashboardPage from '@/pages/dashboard/index'
import SendSmsPage from '@/pages/sms/send'
import BulkSmsPage from '@/pages/sms/bulk'
import CampaignsPage from '@/pages/campaigns/index'
import NewCampaignPage from '@/pages/campaigns/new'
import CampaignDetailPage from '@/pages/campaigns/detail'
import ContactsPage from '@/pages/contacts/index'
import ImportContactsPage from '@/pages/contacts/import'
import LogsPage from '@/pages/logs/index'
import FlowsPage from '@/pages/flows/index'
import FlowEditorPage from '@/pages/flows/editor'
import SettingsPage from '@/pages/settings/index'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sms/send" element={<SendSmsPage />} />
        <Route path="/sms/bulk" element={<BulkSmsPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/new" element={<NewCampaignPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/import" element={<ImportContactsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/flows" element={<FlowsPage />} />
        <Route path="/flows/editor" element={<FlowEditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
