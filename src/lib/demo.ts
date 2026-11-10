/**
 * One-click demo sign-in. On by default while developing so the app can be
 * explored straight after `npm run dev`; in production it must be switched on
 * explicitly with DEMO_LOGIN=true.
 */
export function demoEnabled() {
  const flag = process.env.DEMO_LOGIN;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}
