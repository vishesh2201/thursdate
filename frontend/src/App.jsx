import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Splash from "./pages/onboarding/Splash";
import Gateway from "./pages/onboarding/Gateway";
import UserInfo from "./pages/onboarding/UserInfo";
import Referral from "./pages/onboarding/Referral";
import SocialPresence from "./pages/onboarding/SocialPresence";
import ApplicationStatus from "./pages/onboarding/ApplicationStatus";
import Privacy from "./pages/onboarding/Privacy";
import Different from "./pages/onboarding/Different";
import Permissions from "./pages/onboarding/Permissions";
import WaitlistStatus from "./pages/onboarding/WaitlistStatus";
import Login from "./pages/onboarding/Login";
import Signup from "./pages/onboarding/Signup";
import Home from "./pages/onboarding/Home";
import SettingsTab from "./pages/tabs/SettingsTab";
import EditProfileTab from "./pages/edits/EditProfileTab";
import EditProfilePicture from "./pages/edits/EditProfilePicture";
import EditLifestyleImages from "./pages/edits/EditLifestyleImages";
import UserIntent from "./pages/onboarding/UserIntent";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminWaitlist from "./pages/admin/AdminWaitlist";
import AdminUsers from "./pages/admin/AdminUsers";
import AgePreference from "./pages/settings/AgePreferencePage";
import GenderPreference from "./pages/settings/GenderPreferencePage";
import DirectRequests from "./pages/settings/DirectRequestsPage";
import PersonalImage from "./pages/settings/PersonalImagePage";
import AccountPrivacy from "./pages/settings/AccountPrivacyPage";
import BlockedAccounts from "./pages/settings/BlockedAccountsPage";
import Membership from "./pages/settings/MembershipPage";
import DevicePermissions from "./pages/settings/DevicePermissionsPage";

import "@ncdai/react-wheel-picker/style.css";
import Verification from "./pages/onboarding/Verification";
import FaceVerification from "./pages/onboarding/FaceVerification";
import NotificationPermission from "./pages/onboarding/NotificationPermission";
import LocationPermission from "./pages/onboarding/LocationPermission";
import SubmissionProgress from "./pages/onboarding/SubmissionProgress";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/gateway" element={<Gateway />} />
        <Route path="/user-info" element={<UserInfo />} />
        <Route path="/social-presence" element={<SocialPresence />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/application-status" element={<ApplicationStatus />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/different" element={<Different />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/face-verification" element={<FaceVerification />} />
        <Route path="/notification-permission" element={<NotificationPermission />} />
        <Route path="/location-permission" element={<LocationPermission />} />
        <Route path="/submitting-profile" element={<SubmissionProgress />} />
        <Route path="/waitlist-status" element={<WaitlistStatus />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/settings" element={<SettingsTab />} />
        <Route path="/edit-profile" element={<EditProfileTab />} />
        <Route path="/edit-profile-picture" element={<EditProfilePicture />} />
        <Route path="/edit-lifestyle-images" element={<EditLifestyleImages />} />
        <Route path="/user-intent" element={<UserIntent />} />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/waitlist" element={<AdminWaitlist />} />
        <Route path="/admin/users" element={<AdminUsers />} />

        {/* Settings Routes */}
        <Route path="/settings/age-preference" element={<AgePreference />} />
        <Route path="/settings/gender-preference" element={<GenderPreference />} />
        <Route path="/settings/direct-requests" element={<DirectRequests />} />
        <Route path="/settings/personal-image" element={<PersonalImage />} />
        <Route path="/settings/account-privacy" element={<AccountPrivacy />} />
        <Route path="/settings/blocked-accounts" element={<BlockedAccounts />} />
        <Route path="/settings/membership" element={<Membership />} />
        <Route path="/settings/device-permissions" element={<DevicePermissions />} />

      </Routes>
    </Router>
  );
}
