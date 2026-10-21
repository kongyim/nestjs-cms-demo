'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, type Identity } from '../src/lib/api';
import ResourceSection from '../src/components/resource-section';
import { sections } from '../src/sections';
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

export default function AdminPortal() {
  const [route, setRoute] = useState({
    section: 'pages',
    record: null as string | null,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const [section, record] = window.location.hash
        .replace(/^#\/?/, '')
        .split('/');
      setRoute({ section: section || 'pages', record: record || null });
      setMobileOpen(false);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const [user, setUser] = useState<Identity | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const expired = () => {
      setUser(null);
      setPassword('');
    };
    window.addEventListener('auth-expired', expired);
    api<Identity>('/auth/me')
      .then((identity) => {
        if (active) setUser(identity);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
      window.removeEventListener('auth-expired', expired);
    };
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      setUser(
        await api<Identity>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),
      );
      setPassword('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
    } catch {
      setError('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (checking)
    return (
      <main className="flex min-h-screen items-center justify-center">
        <CircularProgress aria-label="Checking your session" />
      </main>
    );
  if (!user)
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Paper variant="outlined" className="w-full max-w-md p-8">
          <Typography variant="overline" color="primary">
            CMS WORKSPACE
          </Typography>
          <Typography variant="h4" component="h1" className="mt-2 mb-2">
            Welcome back
          </Typography>
          <Typography color="text.secondary" className="mb-8">
            Sign in to manage your content and team.
          </Typography>
          <form onSubmit={login} className="flex flex-col gap-5">
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              required
              disabled={busy}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 254 } }}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              disabled={busy}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 128 } }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              variant="contained"
              size="large"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Paper>
      </main>
    );

  const available = sections.filter((section) =>
    user.permissions.includes(section.readPermission),
  );
  const section =
    available.find((entry) => entry.key === route.section) ?? available[0];
  async function refreshAccess() {
    try {
      setUser(await api<Identity>('/auth/me'));
    } catch {
      /* The API client handles expired sessions; other errors surface on the next request. */
    }
  }

  const navigation = (
    <div className="flex h-full flex-col p-4">
      <div className="px-3 pt-4 pb-8">
        <Typography variant="h6" color="primary">
          CMS Workspace
        </Typography>
        <Typography variant="caption" color="text.secondary">
          CONTENT MANAGEMENT
        </Typography>
      </div>
      <Typography variant="overline" color="text.secondary" className="px-3">
        Resources
      </Typography>
      <List component="nav" aria-label="Resources" className="flex-1">
        {available.map((entry) => (
          <ListItemButton
            key={entry.key}
            component="a"
            href={`#/${entry.key}`}
            selected={section?.key === entry.key}
            aria-current={section?.key === entry.key ? 'page' : undefined}
            className="mb-1 rounded-lg"
          >
            <ListItemText primary={entry.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <div className="flex items-center gap-3 px-2 py-5">
        <Avatar className="bg-blue-100 text-blue-800">
          {user.displayName.slice(0, 1)}
        </Avatar>
        <div className="min-w-0">
          <Typography variant="body2" className="truncate font-semibold">
            {user.displayName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            className="block truncate"
          >
            {user.email}
          </Typography>
        </div>
      </div>
      <Button variant="outlined" onClick={logout} disabled={busy}>
        Sign out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block">
        {navigation}
      </aside>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { className: 'w-64' } }}
      >
        {navigation}
      </Drawer>
      <div className="md:ml-64">
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-5 md:px-8">
          <Button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open resource navigation"
          >
            Menu
          </Button>
          <Typography variant="body2" color="text.secondary">
            Workspace / {section?.label ?? 'Overview'}
          </Typography>
        </header>
        <main className="mx-auto max-w-7xl p-5 md:p-8">
          {error && (
            <Alert severity="error" className="mb-6">
              {error}
            </Alert>
          )}
          {section ? (
            <ResourceSection
              key={`${user.id}:${section.key}`}
              section={section}
              recordId={section.key === route.section ? route.record : null}
              canWrite={user.permissions.includes(section.writePermission)}
              onAccessChange={refreshAccess}
            />
          ) : (
            <Alert severity="info">
              Your role does not include access to any sections.
            </Alert>
          )}
        </main>
      </div>
    </div>
  );
}
