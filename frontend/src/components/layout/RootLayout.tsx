import { Outlet } from 'react-router-dom';
import { SpotifyPlayerProvider } from '@/contexts/SpotifyPlayerContext';

export default function RootLayout() {
  return (
    <SpotifyPlayerProvider>
      <Outlet />
    </SpotifyPlayerProvider>
  );
}