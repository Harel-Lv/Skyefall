import { Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage";
import RoomPage from "./components/RoomPage";

export default function App() {
  return (
    <div className="min-h-dvh">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/r/:roomCode" element={<RoomPage />} />
      </Routes>
    </div>
  );
}
