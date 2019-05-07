/**
 * BackgroundTokenSyncer
 *  sync with backend to exchange the new refresh_token
 */

const ONE_MINUTE = 60;

export class BackgroundTokenSyncer {
  private interval: number;
  private accessTokenExp: number;
  private refreshTokenExp: number;
  private getNewTokenSet: () => Promise<{
    accessToken?: string;
    redirectUrl?: string;
    accessTokenExp?: number;
    refreshTokenExp?: number;
  }>;
  // if we can't extend expiration time, notify user
  private reLoginNotify: ({loginUrl}: {loginUrl: string}) => void;
  private reloginNotifyCalled: boolean = false;
  private appPrefix: string;
  private requestOnFly: boolean = false;
  private accessTokenCantExtend: boolean = false;

  constructor({
    interval,
    accessTokenExp,
    refreshTokenExp,
    getNewTokenSet,
    reLoginNotify = () => {},
    appPrefix
  }: {
    interval?: number,
    accessTokenExp: number,
    refreshTokenExp: number,
    getNewTokenSet: () => Promise<{
      accessToken?: string;
      redirectUrl?: string;
      accessTokenExp?: number;
      refreshTokenExp?: number;
    }>,
    reLoginNotify: ({loginUrl}: {loginUrl: string}) => void,
    appPrefix?: string
  }) {
    this.interval = interval || 1000;

    if (!accessTokenExp) {
      console.warn("no refresh token exp");
    } else if (typeof accessTokenExp !== 'number') {
      console.warn(`invalid accessTokenExp. Got ${accessTokenExp}`);
    }

    this.getNewTokenSet = getNewTokenSet;
    this.accessTokenExp = accessTokenExp;
    this.refreshTokenExp = refreshTokenExp;
    this.reLoginNotify = reLoginNotify;
    this.appPrefix = appPrefix || '/';
  }

  private ifSkipExchanging = () => {
    return this.requestOnFly || this.accessTokenCantExtend;
  }

  private refreshTokenSet = async () => {
    this.requestOnFly = true;
    return this.getNewTokenSet();
  }

  public run = async () => {
    if (!this.accessTokenExp || typeof this.accessTokenExp !== 'number') {
      console.warn("accessToken not valid to run");
      return;
    }

    if (!this.refreshTokenExp || typeof this.refreshTokenExp !== 'number') {
      console.warn("refreshTokenExp not valid to run");
      return;
    }

    const nowInSecond = Math.floor(new Date().getTime() / 1000);

    // if refreshToken expired
    if (nowInSecond >= this.refreshTokenExp) {
      // refresh
      window.location.reload();
    }

    // check if access token expired or close to expired
    // if so, exchange new token set
    const timeDiff = this.accessTokenExp - nowInSecond;
    if (timeDiff <= ONE_MINUTE && !this.ifSkipExchanging()) {
      try {
        const newTokenResponse = await this.refreshTokenSet();
        if (!newTokenResponse.accessTokenExp && !newTokenResponse.refreshTokenExp) {
          // if expire not set, log user out
          window.location.replace(`${this.appPrefix}oidc/logout`);
          return;
        }
  
        // successfully set token, check and update the access token
        // if expired time doesn't get extend, notify user with re-login button
        if (this.refreshTokenExp >= newTokenResponse.refreshTokenExp &&
          (this.refreshTokenExp - nowInSecond <= ONE_MINUTE) &&
          !this.reloginNotifyCalled
        ) {
          this.reLoginNotify({loginUrl: newTokenResponse.redirectUrl});
          this.reloginNotifyCalled = true;
        }

        // access token not extends, don't bother try again
        if (this.accessTokenExp >= newTokenResponse.accessTokenExp) {
          this.accessTokenCantExtend = true;
        }

        // successfully get longer exp token
        this.accessTokenExp = newTokenResponse.accessTokenExp;
        this.refreshTokenExp = newTokenResponse.refreshTokenExp;
        window.localStorage.setItem('canner.accessToken', newTokenResponse.accessToken);
  
        console.log(`use new refresh token with exp: ${this.refreshTokenExp} & access token with exp ${this.accessTokenExp}`);
      } catch (e) {
        console.log('refresh token request failed', e);
      } finally {
        this.requestOnFly = false;
      }
    }
    
    // schedule next
    setTimeout(() => {
      this.run().catch(console.error);
    }, this.interval);
  }
}
