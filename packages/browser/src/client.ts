import { BaseClient, ReportDialogOptions, Scope } from '@sentry/core';
import { Event, EventHint } from '@sentry/types';
import { getGlobalObject, logger } from '@sentry/utils';

import { BrowserBackend, BrowserOptions } from './backend';
import { injectReportDialog } from './helpers';
import { Breadcrumbs } from './integrations';

/**
 * The Sentry Browser SDK Client.
 *
 * @see BrowserOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class BrowserClient extends BaseClient<BrowserBackend, BrowserOptions> {
  /**
   * Creates a new Browser SDK instance.
   *
   * @param options Configuration options for this SDK.
   */
  public constructor(options: BrowserOptions = {}) {
    super(BrowserBackend, options);
  }

  /**
   * Show a report dialog to the user to send feedback to a specific event.
   *
   * @param options Set individual options for the dialog
   */
  public showReportDialog(options: ReportDialogOptions = {}): void {
    // doesn't work without a document (React Native)
    const document = getGlobalObject<Window>().document;
    if (!document) {
      return;
    }

    if (!this._isEnabled()) {
      logger.error('Trying to call showReportDialog with Sentry Client disabled');
      return;
    }

    injectReportDialog({
      ...options,
      dsn: options.dsn || this.getDsn()?.toString(),
    });
  }

  /**
   * @inheritDoc
   */
  protected _prepareEvent(event: Event, scope?: Scope, hint?: EventHint): PromiseLike<Event | null> {
    event.platform = event.platform || 'javascript';
    return super._prepareEvent(event, scope, hint);
  }

  /**
   * @inheritDoc
   */
  protected _sendEvent(event: Event): void {
    const integration = this.getIntegration(Breadcrumbs);
    if (integration) {
      integration.addSentryBreadcrumb(event);
    }
    super._sendEvent(event);
  }
}
