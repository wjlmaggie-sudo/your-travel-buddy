import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Compass, Luggage } from "lucide-react";

export function MobileNavigation() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav aria-label="App navigation" className="mobile-navigation">
      <Link to="/on-trip" search={{}} aria-current={pathname === "/on-trip" ? "page" : undefined}>
        <CalendarDays aria-hidden="true" />
        <span>Today</span>
      </Link>
      <Link to="/" aria-current={pathname === "/" ? "page" : undefined}>
        <Compass aria-hidden="true" />
        <span>Plan & explore</span>
      </Link>
      <Link to="/trips" aria-current={pathname.startsWith("/trips") ? "page" : undefined}>
        <Luggage aria-hidden="true" />
        <span>My trips</span>
      </Link>
    </nav>
  );
}
