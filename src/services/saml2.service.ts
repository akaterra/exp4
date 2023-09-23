import * as saml2 from 'saml2-js';
import { existsSync, readFileSync } from "fs";
import {logError} from '../logger';

export class Saml2Service {
  public metadata;

  private serviceProvider;
  private identityProvider;
  private serviceProviderOptions;

  constructor(
    publicDomain?: string,
    paths?: {
      crt?: string;
      pem?: string;
      metadata?: string;
    },
    urls?: {
      login?: string;
      logout?: string;
    },
    extra?: {
      entityId?: string;
    },
  ) {
    if (!publicDomain) {
      publicDomain = process.env.PUBLIC_DOMAIN ?? 'http://localhost:7000';
    }

    const crtPath = paths?.crt ?? process.env.SAML2_CRT_PATH ?? `${process.cwd()}/saml2/certificate.crt`;
    const crt = readFileSync(crtPath).toString();
    const pemPath = paths?.pem ?? process.env.SAML2_PEM_PATH ?? `${process.cwd()}/saml2/certificate.pem`;
    const pem = readFileSync(pemPath).toString();
    const metadataPath = paths?.metadata ?? process.env.SAML2_METADATA_PATH ?? `${process.cwd()}/saml2/metadata.xml`;
    this.metadata = readFileSync(metadataPath).toString();

    this.serviceProviderOptions = {
      entity_id: extra?.entityId ?? process.env.SAML2_ENTITY_ID ?? `${publicDomain}/auth/methods/saml2/metadata.xml`,
      certificate: crt,
      private_key: pem,
      assert_endpoint: `${publicDomain}/auth/methods/saml2/acs`,
      force_authn: true,
      auth_context: { comparison: "exact", class_refs: ["urn:oasis:names:tc:SAML:1.0:am:password"] },
      nameid_format: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
      sign_get_request: false,
      allow_unencrypted_assertion: true
    }
    const idPOptions = {
      sso_login_url: process.env.SAML2_LOGIN_URL ?? `${publicDomain}/auth/methods/saml2/login`,
      sso_logout_url: process.env.SAML2_LOGOUT_URL ?? `${publicDomain}/auth/methods/saml2/logout`,
      certificates: [ crt, pem ],
    };

    this.serviceProvider = new saml2.ServiceProvider(this.serviceProviderOptions);
    this.identityProvider = new saml2.IdentityProvider(idPOptions);
  }

  // async fetchUsers(): Promise<Array<{ email: string, firstName: string, id: string, lastName: string, phoneNumber: string }>> {
  //   const systemUsers = await this.fetchPaginated(1, 'systemusers');
  //   const systemUsersGroupMembers = await this.fetchPaginated(2, `applications/${process.env.JUMPCLOUD_APP_ID}/users`);
  //   const users = {};

  //   for (const systemUserGroupMember of systemUsersGroupMembers) {
  //     const systemUser = systemUsers.find((systemUser) => systemUser.id === systemUserGroupMember.id);

  //     if (systemUser) {
  //       if (!users[systemUserGroupMember.id] && systemUser.state === 'ACTIVATED') {
  //         users[systemUserGroupMember.id] = {
  //           email: systemUser.email,
  //           firstName: systemUser.firstname ? systemUser.firstname.trim() : null,
  //           id: systemUser.email,
  //           lastName: systemUser.lastname ? systemUser.lastname.trim() : null,
  //           phoneNumber: systemUser.phoneNumbers[0]?.number ?? null,
  //         };
  //       }
  //     }
  //   }

  //   return Object.values(users);
  // }

  async getLoginUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.serviceProvider.create_login_request_url(this.identityProvider, this.serviceProviderOptions, (err, loginUrl, requestId) => {
        if (err) {
          reject(err);
        } else {
          resolve(loginUrl);
        }
      })
    });
  }

  getMetadata() {
    return this.serviceProvider.create_metadata();
  }

  async assert(data: Record<string, unknown>): Promise<{ email: string, id: string, samlSessionId: string }> {
    return new Promise((resolve, reject) => {
      this.serviceProvider.post_assert(this.identityProvider, { request_body: data }, (err, samlResponse) => {
        if (err) {
          logError(err, 'Saml2Service.assert');

          reject(err);
        } else {
          resolve({ email: samlResponse.user.name_id, id: samlResponse.user.name_id, samlSessionId: samlResponse.user.session_index });
        }
      });
    });
  }

  // private async fetchPaginated(version, path) {
  //   if (!process.env.JUMPCLOUD_APIKEY) {
  //     return [];
  //   }

  //   let offset = 0;
  //   let result = [];

  //   while (true) {
  //     const dat: any = await axios.get(
  //       version === 1
  //         ? `https://console.jumpcloud.com/api/${path}?limit=100&skip=${offset}`
  //         : `https://console.jumpcloud.com/api/v2/${path}?limit=100&skip=${offset}`,
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'x-api-key': process.env.JUMPCLOUD_APIKEY,
  //         },
  //       },
  //     ).catch((err) => {
  //       console.error(err);

  //       throw createErrorWithCode(
  //         'Backend returned malformed response',
  //         `JumpcloudService:internalError`,
  //         500,
  //       );
  //     });

  //     const data = version === 1 ? dat.data.results : dat.data;

  //     if (!data?.length) {
  //       break;
  //     }

  //     result.push(...data);
  //     offset += 100;
  //   }

  //   return result;
  // }
}
