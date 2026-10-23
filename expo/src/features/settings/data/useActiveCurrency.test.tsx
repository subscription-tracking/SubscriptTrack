import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useUserTimeZoneState } from './useActiveCurrency';

const mockReadJson = jest.fn();
const mockFetchProfile = jest.fn();
const mockUser = { id: 'test-user' };
const queryClients: QueryClient[] = [];

jest.mock('../../../core/storage/secureJsonStore', () => ({ readJson: (...args: unknown[]) => mockReadJson(...args) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('./profileRepository', () => ({
  fetchProfile: (...args: unknown[]) => mockFetchProfile(...args),
  profileTimeZoneCacheKey: (userId: string) => `profile.timezone.${userId}`,
  saveActiveCurrency: jest.fn(),
  saveUserTimeZone: jest.fn(),
}));

function TimeZoneLabel() {
  const { timeZone, ready } = useUserTimeZoneState();
  return <Text>{`${timeZone}|${ready ? 'ready' : 'waiting'}`}</Text>;
}

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  queryClients.push(queryClient);
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <TimeZoneLabel />
      </QueryClientProvider>,
    ),
  };
}

describe('useUserTimeZoneState', () => {
  afterEach(() => {
    queryClients.splice(0).forEach((queryClient) => queryClient.clear());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser.id = 'test-user';
    mockReadJson.mockResolvedValue(null);
  });

  it('çevrimdışıyken yalnız oturum sahibinin güvenli IANA kopyasını kullanır', async () => {
    mockFetchProfile.mockRejectedValue(new Error('offline'));
    mockReadJson.mockResolvedValue('America/Los_Angeles');

    renderWithQueryClient();

    await waitFor(() => expect(screen.getByText('America/Los_Angeles|ready')).toBeTruthy());
    expect(mockReadJson).toHaveBeenCalledWith('profile.timezone.test-user');
  });

  it('çevrimiçi profil tercihi güvenli önbellekten üstündür', async () => {
    mockFetchProfile.mockResolvedValue({ timezone: 'Europe/Istanbul' });
    mockReadJson.mockResolvedValue('America/Los_Angeles');

    renderWithQueryClient();

    await waitFor(() => expect(screen.getByText('Europe/Istanbul|ready')).toBeTruthy());
  });

  it('profil ve güvenli kopya yüklenene kadar bildirim planı için hazır sayılmaz', async () => {
    mockFetchProfile.mockReturnValue(new Promise(() => undefined));
    mockReadJson.mockReturnValue(new Promise(() => undefined));

    renderWithQueryClient();

    await waitFor(() => expect(screen.getByText(`${Intl.DateTimeFormat().resolvedOptions().timeZone}|waiting`)).toBeTruthy());
  });
});
