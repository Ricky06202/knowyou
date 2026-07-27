import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ChatScreen from "./screens/ChatScreen";
import ProfileScreen from "./screens/ProfileScreen";
import HomeScreen from "./screens/HomeScreen";
import GalleryScreen from "./screens/GalleryScreen";
import ExploreScreen from "./screens/ExploreScreen";
import BottomNav from "./components/BottomNav";
import DetailModal from "./components/DetailModal";
import { apiFetch } from "./api";

function AppContent() {
  const { user, token, loading } = useAuth();
  const [screen, setScreen] = useState("login");
  const [tab, setTab] = useState("home");
  const [tabParams, setTabParams] = useState({});
  const [detailItem, setDetailItem] = useState(null);

  const navigate = (target, params = {}) => {
    if (["home", "explore", "chat", "gallery", "profile"].includes(target)) {
      setTab(target);
      setTabParams(params);
    }
  };

  const handleUpdateItem = async (id, updates) => {
    try {
      await apiFetch(`/library/${id}`, { method: "PATCH", token, body: updates });
      if (tab === "gallery") {
        setTabParams({ ...tabParams, _refresh: Date.now() });
      }
    } catch {}
  };

  const handleDeleteItem = async (id) => {
    try {
      await apiFetch(`/library/${id}`, { method: "DELETE", token });
      if (tab === "gallery") {
        setTabParams({ ...tabParams, _refresh: Date.now() });
      }
    } catch {}
  };

  const handleAddItem = async (item) => {
    try {
      await apiFetch("/library", { method: "POST", token, body: item });
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl font-black mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            K
          </div>
          <div className="text-gray-500 text-sm">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (screen === "register") {
      return <RegisterScreen onSwitch={() => setScreen("login")} />;
    }
    return <LoginScreen onSwitch={() => setScreen("register")} />;
  }

  const renderTab = () => {
    switch (tab) {
      case "home":
        return <HomeScreen onNavigate={navigate} onDetail={(item) => setDetailItem(item)} />;
      case "explore":
        return <ExploreScreen params={tabParams} onDetail={(item) => setDetailItem(item)} />;
      case "chat":
        return <ChatScreen onAdd={handleAddItem} onDetail={(item) => setDetailItem(item)} />;
      case "gallery":
        return <GalleryScreen params={tabParams} onDetail={(item) => setDetailItem(item)} />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        {renderTab()}
      </div>
      <BottomNav active={tab} onNavigate={navigate} />
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="h-full">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
