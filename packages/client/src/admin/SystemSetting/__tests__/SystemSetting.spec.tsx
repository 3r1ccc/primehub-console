import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen, waitFor } from 'test/test-utils';

import { SystemSetting } from '..';
import { GetSystemSetting } from '../systemSettings.graphql';

jest.mock('moment', () => () => ({
  format: () => '2021/12/31 20:59',
}));

function setup() {
  const mockRequests = [
    {
      request: {
        query: GetSystemSetting,
        variables: {},
      },
      result: {
        data: {
          system: {
            license: {
              licenseStatus: 'unexpired',
              startedAt: '2021-06-30T00:00:00Z',
              expiredAt: '2021-12-31T12:59:00Z',
              licensedTo: 'InfuseAI',
              maxNode: 1000,
              maxModelDeploy: 1000,
              maxGroup: 9999,
              usage: {
                maxGroup: 68,
                maxNode: 5,
                maxModelDeploy: 109,
                __typename: 'Usage',
              },
              __typename: 'License',
            },
            org: {
              name: 'InfuseAI',
              logo: {
                contentType: null,
                name: null,
                size: 0,
                url: 'https://i.imgur.com/CDz3JAY.png',
                __typename: 'CannerImage',
              },
              __typename: 'Org',
            },
            defaultUserVolumeCapacity: 20,
            timezone: {
              name: 'Asia/Taipei',
              offset: 8,
              __typename: 'Timezone',
            },
            smtp: {
              host: 'smtp.sendgrid.net',
              port: 465,
              fromDisplayName: 'InfuseAI',
              from: 'demo@infuseai.io',
              replyToDisplayName: null,
              replyTo: null,
              envelopeFrom: null,
              enableSSL: true,
              enableStartTLS: false,
              enableAuth: true,
              username: 'apikey',
              password: '**********',
              __typename: 'Smtp',
            },
            __typename: 'System',
          },
        },
      },
    },
  ];

  return {
    mockRequests,
  };
}

describe('SystemSetting', () => {
  it('should render system setting with failure status', async () => {
    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter>
        <MockedProvider>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('[License Block] should render system setting with fetched data', async () => {
    const { mockRequests } = setup();

    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('license-status')).toHaveTextContent(
      'Activated'
    );
    expect(await screen.findByTestId('license-expiredAt')).toHaveTextContent(
      '2021/12/31 20:59'
    );
    expect(await screen.findByTestId('license-to')).toHaveTextContent(
      'InfuseAI'
    );
    expect(await screen.findByTestId('license-maxNode')).toHaveTextContent(
      '5/1000'
    );
    expect(await screen.findByTestId('license-maxDeploy')).toHaveTextContent(
      '109/1000'
    );
    expect(await screen.findByTestId('license-maxGroup')).toHaveTextContent(
      '68/9999'
    );
  });

  it('[Settings] should render system setting with fetched data', async () => {
    const { mockRequests } = setup();

    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('settings-systemName')).toHaveValue(
      'InfuseAI'
    );
    expect(await screen.findByTestId('settings-capacity')).toHaveValue('20 GB');
    expect(await screen.findByTestId('timezone-select')).toBeInTheDocument();
  });

  it('[SMTP] should render system setting with fetched data', async () => {
    const { mockRequests } = setup();

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('smtp-host')).toHaveValue(
      'smtp.sendgrid.net'
    );
    expect(await screen.findByTestId('smtp-port')).toHaveValue('465');
    expect(await screen.findByTestId('smtp-from-display-name')).toHaveValue(
      'InfuseAI'
    );
    expect(await screen.findByTestId('smtp-from')).toHaveValue(
      'demo@infuseai.io'
    );
    expect(await screen.findByTestId('smtp-reply-display-name')).toHaveValue(
      ''
    );
    expect(await screen.findByTestId('smtp-reply')).toHaveValue('');
    expect(await screen.findByTestId('smtp-envelop-from')).toHaveValue('');
    expect(await screen.findByTestId('smtp-enable-ssl')).toBeChecked();
    expect(await screen.findByTestId('smtp-enable-startTLS')).not.toBeChecked();
    expect(await screen.findByTestId('smtp-enable-auth')).toBeChecked();
    expect(await screen.findByTestId('smtp-username')).toHaveValue('apikey');
  });

  it('should render system setting with change system name', async () => {
    const { mockRequests } = setup();

    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    const newSystemName = 'InfuseAI XII';
    const systemNameInput = await screen.findByTestId('settings-systemName');

    userEvent.clear(systemNameInput);
    userEvent.type(systemNameInput, newSystemName);

    expect(systemNameInput).toHaveValue(newSystemName);
  });

  it('should render system setting with visible add image button', async () => {
    const { mockRequests } = setup();

    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    const removeLogoBtn = await screen.findByTestId('remove-logo');
    userEvent.click(removeLogoBtn);
    expect(screen.getByTestId('add-logo')).toBeInTheDocument();
  });

  it('should render system setting with update logo modal', async () => {
    const { mockRequests } = setup();

    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    const removeLogoBtn = await screen.findByTestId('remove-logo');
    userEvent.click(removeLogoBtn);

    const addLogoBtn = screen.getByTestId('add-logo');
    userEvent.click(addLogoBtn);

    expect(await screen.findByText('Choose Image')).toBeInTheDocument();
    expect(screen.getByTestId('settings-logo-url')).toHaveValue(
      'https://i.imgur.com/CDz3JAY.png'
    );
  });

  it('should render system setting with invalid email message', async () => {
    const { mockRequests } = setup();

    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    const smtpFrom = await screen.findByTestId('smtp-from');
    userEvent.clear(smtpFrom);
    userEvent.type(smtpFrom, 'AAA');

    expect(await screen.findByText('Invalid Email')).toBeInTheDocument();
  });

  it('should not render system setting license status when license is CE', async () => {
    const { mockRequests } = setup();

    // @ts-ignore
    global.__ENV__ = 'ce';

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <SystemSetting />
        </MockedProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('License Status')).toBeNull();
    });
  });
});
