import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Explore</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/adventures" className="text-sm text-gray-600 hover:text-gray-900">
                  Adventures
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/flights" className="text-sm text-gray-600 hover:text-gray-900">
                  Flights
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Plan</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/itinerary" className="text-sm text-gray-600 hover:text-gray-900">
                  AI Trip Planner
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Community</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/adventures" className="text-sm text-gray-600 hover:text-gray-900">
                  Share an Adventure
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <span className="text-sm text-gray-600">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
