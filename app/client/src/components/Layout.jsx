import { NavLink, Outlet } from "react-router-dom";
import { useSpaces } from "../contexts/SpacesContext.jsx";

export default function Layout() {
  const { spaces } = useSpaces();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="brand">🍒 Cherry</h1>
        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            Tous les espaces
          </NavLink>
          <div className="nav-spaces">
            {spaces.map((space) => (
              <NavLink key={space.id} to={`/spaces/${space.id}`} className="nav-link">
                {space.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
