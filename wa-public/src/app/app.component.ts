import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthorizationResult,
  AuthorizationState,
  OidcSecurityService,
} from 'angular-auth-oidc-client';

@Component({
  selector: 'wap-root',
  template: `
    <!--The content below is only a placeholder and can be replaced.-->
    <router-outlet></router-outlet>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated: boolean;
  userData: any;

  constructor(
    public oidcSecurityService: OidcSecurityService,
    private router: Router,
  ) {
    if (this.oidcSecurityService.moduleSetup) {
      this.onOidcModuleSetup();
    } else {
      this.oidcSecurityService.onModuleSetup.subscribe(() => {
        this.onOidcModuleSetup();
      });
    }

    this.oidcSecurityService.onAuthorizationResult.subscribe(
      (authorizationResult: AuthorizationResult) => {
        this.onAuthorizationResultComplete(authorizationResult);
      },
    );
  }

  ngOnInit() {
    this.oidcSecurityService.getIsAuthorized().subscribe(auth => {
      this.isAuthenticated = auth;
    });

    this.oidcSecurityService.getUserData().subscribe(userData => {
      this.userData = userData;
    });
  }

  ngOnDestroy(): void {}

  private onOidcModuleSetup() {
    if (window.location.toString().match('state')) {
      this.oidcSecurityService.authorizedCallbackWithCode(
        window.location.toString(),
      );
    } else {
      if ('/autologin' !== window.location.pathname) {
        this.write('redirect', window.location.pathname);
      }
      console.log('AppComponent:onModuleSetup');
      this.oidcSecurityService
        .getIsAuthorized()
        .subscribe((authorized: boolean) => {
          if (!authorized) {
            this.router.navigate(['/autologin']);
          }
        });
    }
  }

  private onAuthorizationResultComplete(
    authorizationResult: AuthorizationResult,
  ) {
    const path = this.read('redirect');
    console.log(
      'Auth result received AuthorizationState:' +
        authorizationResult.authorizationState +
        ' validationResult:' +
        authorizationResult.validationResult,
    );

    if (
      authorizationResult.authorizationState === AuthorizationState.authorized
    ) {
      this.router.navigate([path]);
    } else {
      this.router.navigate(['/unauthorized']);
    }
  }

  private read(key: string): any {
    const data = localStorage.getItem(key);
    if (data != null) {
      return JSON.parse(data);
    }

    return;
  }

  private write(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
