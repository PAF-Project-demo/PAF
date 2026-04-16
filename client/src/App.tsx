import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import ApprovalRequests from "./pages/Tables/ApprovalRequests";
import SignedInUsers from "./pages/Tables/SignedInUsers";
import AuditLog from "./pages/Tables/AuditLog";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import {
  RedirectAuthenticatedUser,
  RequireAuth,
  RequireAdmin,
  RequireStaff,
} from "./components/auth/AuthRouteGuards";
import OAuthStatusHandler from "./components/auth/OAuthStatusHandler";
import TicketDashboardPage from "./pages/Tickets/TicketDashboardPage";
import TicketCreatePage from "./pages/Tickets/TicketCreatePage";
import TicketListPage from "./pages/Tickets/TicketListPage";
import TicketDetailsPage from "./pages/Tickets/TicketDetailsPage";
import TicketReportsPage from "./pages/Tickets/TicketReportsPage";

// Facilities & Assets Pages
import ResourceListPage from "./pages/Facilities/ResourceListPage";
import ResourceDetailPage from "./pages/Facilities/ResourceDetailPage";
import ResourceFormPage from "./pages/Facilities/ResourceFormPage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <OAuthStatusHandler />
        <Routes>
          <Route element={<RequireAuth />}>
            {/* Dashboard Layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<TicketDashboardPage />} />
              <Route path="/dashboard/create-ticket" element={<TicketCreatePage />} />
              <Route path="/dashboard/ticket-queue" element={<TicketListPage />} />
              <Route path="/tickets/:id" element={<TicketDetailsPage />} />
              <Route element={<RequireStaff />}>
                <Route path="/reports" element={<TicketReportsPage />} />
              </Route>

              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Facilities & Assets Catalogue */}
              <Route path="/resources" element={<ResourceListPage />} />
              <Route path="/resources/:id" element={<ResourceDetailPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/resources/new" element={<ResourceFormPage />} />
                <Route path="/resources/:id/edit" element={<ResourceFormPage />} />
              </Route>

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Role Management */}
              <Route path="/role-requests" element={<BasicTables />} />
              <Route element={<RequireAdmin />}>
                <Route
                  path="/approval-requests"
                  element={<ApprovalRequests />}
                />
                <Route path="/signed-in-users" element={<SignedInUsers />} />
                <Route path="/audit-log" element={<AuditLog />} />
              </Route>

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          <Route element={<RedirectAuthenticatedUser />}>
            {/* Auth Layout */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
