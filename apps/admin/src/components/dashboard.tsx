'use client';

import { useEffect, useState } from 'react';
import { useAdmin, type Identity } from '@nestjs-cms/admin';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';

export default function Dashboard() {
  const { api, config, notify } = useAdmin();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    const auth = config.auth?.(api);
    const request = auth ? auth.getIdentity() : api<Identity>('/auth/me');
    request
      .then((user) => {
        if (active) setIdentity(user);
      })
      .catch((cause: unknown) => {
        if (active) {
          setFailed(true);
          notify(
            cause instanceof Error
              ? cause.message
              : 'Could not load your dashboard.',
            'error',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [api, config, notify]);

  const resources = config.sections.filter(
    (section) =>
      section.type !== 'custom' &&
      identity &&
      (config.canAccess
        ? config.canAccess(identity, section.readPermission)
        : !section.readPermission ||
          identity.permissions.includes(section.readPermission)),
  );

  const hasResources = resources.length > 0;
  useEffect(() => {
    if (identity && !hasResources) notify('Your role does not include access to any resources.', 'info');
  }, [identity, hasResources, notify]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      {failed ? null : !identity ? (
        <CircularProgress aria-label="Loading dashboard" />
      ) : (
        <>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Welcome back, {identity.displayName}. Manage your content and team
            from {config.title ?? 'your workspace'}.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            }}
          >
            {resources.map((section) => (
              <Paper key={section.key} variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" component="h2">
                  {section.label}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {section.description}
                </Typography>
                <Button
                  component="a"
                  href={`#/${section.key}`}
                  variant="outlined"
                >
                  Open {section.label}
                </Button>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
