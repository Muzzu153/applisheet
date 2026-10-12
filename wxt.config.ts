import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: ({ browser }) => ({
    name: 'Job Application Tracker',
    description: 'Log job applications to your own Google Sheet and keep track of their status.',
    // Phase 0 needs only sign-in + storage. Later phases add activeTab, scripting, alarms.
    permissions: ['identity', 'storage'],
    host_permissions: ['https://sheets.googleapis.com/*'],
    // Firefox needs a fixed add-on ID so the OAuth redirect URL stays stable.
    ...(browser === 'firefox' && {
      browser_specific_settings: { gecko: { id: 'job-tracker@example.com' } },
    }),
  }),
});
