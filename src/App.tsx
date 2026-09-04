import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Home } from "./features/home/Home";
import { Profile } from "./features/profile/Profile";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:id" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
