import { getAccessToken, getRedirectUrl, signOut } from '@/lib/auth';
import { addApplication, createTracker } from '@/lib/sheets';
import { getSpreadsheetId, setSpreadsheetId, sheetUrl } from '@/lib/storage';
import type { Application } from '@/lib/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const statusEl = $('status');
const setupBtn = $<HTMLButtonElement>('setup');
const openBtn = $<HTMLButtonElement>('open');
const sampleBtn = $<HTMLButtonElement>('sample');
const signoutBtn = $<HTMLButtonElement>('signout');

$('redirect').textContent = getRedirectUrl();

function say(text: string, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

async function run(button: HTMLButtonElement, work: () => Promise<void>) {
  button.disabled = true;
  try {
    await work();
  } catch (err) {
    say(err instanceof Error ? err.message : String(err), true);
  } finally {
    button.disabled = false;
  }
}

async function render() {
  const id = await getSpreadsheetId();
  setupBtn.hidden = !!id;
  openBtn.hidden = !id;
  sampleBtn.hidden = !id;
  signoutBtn.hidden = false;
  say(id ? 'Your tracker sheet is ready.' : 'Sign in with Google to create your tracker sheet.');
}

setupBtn.addEventListener('click', () =>
  run(setupBtn, async () => {
    say('Creating your sheet…');
    const token = await getAccessToken(true);
    const id = await createTracker(token);
    await setSpreadsheetId(id);
    await render();
    await browser.tabs.create({ url: sheetUrl(id) });
  }),
);

openBtn.addEventListener('click', async () => {
  const id = await getSpreadsheetId();
  if (id) await browser.tabs.create({ url: sheetUrl(id) });
});

sampleBtn.addEventListener('click', () =>
  run(sampleBtn, async () => {
    const id = await getSpreadsheetId();
    if (!id) return;
    const today = new Date().toISOString().slice(0, 10);
    const sample: Application = {
      id: crypto.randomUUID().slice(0, 8),
      company: 'Acme (sample)',
      role: 'Backend Engineer',
      location: 'Mumbai',
      jobUrl: 'https://example.com/jobs/123',
      sourceSite: 'example.com',
      appliedVia: 'Company page',
      appliedDate: today,
      stage: 'Applied',
      contactName: '',
      contact: '',
      recipientType: 'N/A',
      referralAsked: 'No',
      lastFollowUp: '',
      lastActivity: today,
      threadId: '',
      resumeVersion: 'v1',
      notes: 'Sample row from Phase 0',
    };
    const token = await getAccessToken(true);
    const row = await addApplication(token, id, sample);
    say(`Added a sample row (row ${row}).`);
  }),
);

signoutBtn.addEventListener('click', () =>
  run(signoutBtn, async () => {
    await signOut();
    say('Signed out. Your sheet is untouched.');
  }),
);

render().catch((err) => say(String(err), true));
