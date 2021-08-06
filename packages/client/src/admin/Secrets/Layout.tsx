import * as React from 'react';
import Breadcrumbs from 'components/share/breadcrumb';

export function SecretLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #eee',
          padding: '16px 24px',
        }}
      >
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <Breadcrumbs
            pathList={[
              {
                key: 'secret',
                matcher: /\/secret/,
                title: 'Secret',
                link: 'admin/secret',
                tips: 'Secrets are credentials of authorizations to certain images anddatasets. Admin can find and manage secrets here.',
                tipsLink:
                  'https://docs.primehub.io/docs/guide_manual/admin-secret',
              },
            ]}
          />
        </div>
      </div>

      {children}
    </>
  );
}
