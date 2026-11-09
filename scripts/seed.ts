import { ensureDemoData, DEMO_PASSWORD, DEMO_USER_EMAIL, DEMO_INVITE_TOKEN } from "../src/lib/seed";
import { adminEmail } from "../src/lib/session";

ensureDemoData();
console.log(`Seeded.
  Admin:     ${adminEmail()}
  Demo user: ${DEMO_USER_EMAIL}
  Password:  ${DEMO_PASSWORD}
  Demo invite link: /en/read/${DEMO_INVITE_TOKEN}`);
