import SaveReassurance from "./SaveReassurance";
import SignOutButton from "./SignOutButton";

/**
 * Shared top-right utility strip — renders SAVED + SIGN OUT pills as a
 * single fixed flex row so they never clash coordinates. Placed by
 * both (client) and (admin) layouts. Pages must leave enough right-
 * padding on their own headers to clear this strip (~pr-56 or more).
 */
export default function TopRightPills() {
  return (
    <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
      <SaveReassurance />
      <SignOutButton />
    </div>
  );
}
