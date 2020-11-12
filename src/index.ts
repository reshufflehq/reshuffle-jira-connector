import { Request, Response } from 'express'
import { Reshuffle, BaseHttpConnector, EventConfiguration } from 'reshuffle-base-connector'
import JiraClient from 'jira-client'

const DEFAULT_WEBHOOK_PATH = '/reshuffle-jira-connector/webhook'
const DEFAULT_WEBHOOK_NAME = 'reshuffle-runtime-jira'

// https://developer.atlassian.com/server/jira/platform/webhooks/#configuring-a-webhook
export type JiraEvent =
  | 'jira:issue_created'
  | 'jira:issue_updated'
  | 'jira:issue_deleted'
  | 'jira:worklog_updated'
  | 'issuelink_created'
  | 'issuelink_deleted'
  | 'worklog_created'
  | 'worklog_updated'
  | 'worklog_deleted'
  | 'comment_created'
  | 'comment_updated'
  | 'comment_deleted'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'jira:version_released'
  | 'jira:version_unreleased'
  | 'jira:version_created'
  | 'jira:version_moved'
  | 'jira:version_updated'
  | 'jira:version_deleted'
  | 'jira:version_merged'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'option_voting_changed'
  | 'option_watching_changed'
  | 'option_unassigned_issues_changed'
  | 'option_subtasks_changed'
  | 'option_attachments_changed'
  | 'option_issuelinks_changed'
  | 'option_timetracking_changed'
  | 'sprint_created'
  | 'sprint_deleted'
  | 'sprint_updated'
  | 'sprint_started'
  | 'sprint_closed'
  | 'board_created'
  | 'board_updated'
  | 'board_deleted'
  | 'board_configuration_changed'

type JiraWebhookEvents = [{ name: string; url: string; events: JiraEvent[] }]

function validateBaseURL(url?: string): string {
  if (typeof url !== 'string') {
    throw new Error(`Invalid url: ${url}`)
  }
  const match = url.match(/^(https:\/\/[\w-]+(\.[\w-]+)*(:\d{1,5})?)\/?$/)
  if (!match) {
    throw new Error(`Invalid url: ${url}`)
  }
  return match[1]
}

export interface JiraConnectorConfigOptions extends JiraClient.JiraApiOptions {
  baseURL?: string
  webhookPath?: string
  webhookName?: string
}

export interface JiraConnectorEventOptions {
  jiraEvent: JiraEvent
}

export default class JiraConnector extends BaseHttpConnector<
  JiraClient.JiraApiOptions,
  JiraConnectorEventOptions
> {
  private _sdk: JiraClient
  private webhook?: JiraClient.JsonResponse

  constructor(app: Reshuffle, options: JiraClient.JiraApiOptions, id?: string) {
    super(app, options, id)
    this._sdk = new JiraClient(options)
  }

  async onStart(): Promise<void> {
    const logger = this.app.getLogger()
    const events = Object.values(this.eventConfigurations)
    if (events.length) {
      const url = validateBaseURL(this.configOptions.baseURL)

      const jiraEvents = events.reduce<JiraEvent[]>(
        (acc, { options }) =>
          acc.indexOf(options.jiraEvent) > -1 ? acc : [...acc, options.jiraEvent],
        [],
      )

      const webhookOptions = {
        url: url + (this.configOptions.webhookPath || DEFAULT_WEBHOOK_PATH),
        name: this.configOptions.webhookname || DEFAULT_WEBHOOK_NAME,
        events: jiraEvents,
      }

      // Check existing webhook with same url, same name, triggered on same jira events
      const webhooks = (await this._sdk.listWebhooks()) as JiraWebhookEvents

      const existingWebhook = webhooks.find(({ name, url, events }) => {
        if (url === webhookOptions.url && name === webhookOptions.name) {
          const eventsNotRegistered = jiraEvents.filter((ev) => !events.includes(ev))
          return eventsNotRegistered.length === 0
        }

        return false
      })

      this.webhook = existingWebhook
        ? existingWebhook
        : await this._sdk.registerWebhook(webhookOptions)

      if (this.webhook.enabled) {
        logger.info(
          `Reshuffle Jira - webhook registered successfully (name: ${this.webhook.name}, url: ${this.webhook.url})`,
        )
      } else {
        logger.error(
          `Reshuffle Jira - webhook registration failure (name: ${this.webhook.name}, url: ${this.webhook.url})`,
        )
      }
    }
  }

  on(options: JiraConnectorEventOptions, handler: any, eventId: string): EventConfiguration {
    const path = this.configOptions.webhookPath || DEFAULT_WEBHOOK_PATH

    if (!eventId) {
      eventId = `Jira${path}/${options.jiraEvent}/${this.id}`
    }
    const event = new EventConfiguration(eventId, this, options)
    this.eventConfigurations[event.id] = event

    this.app.when(event, handler)
    this.app.registerHTTPDelegate(path, this)

    return event
  }

  sdk(): JiraClient {
    return this._sdk
  }

  async handle(req: Request, res: Response): Promise<boolean> {
    const jiraEvent = req.body.webhookEvent
    const eventsUsingJiraEvent = Object.values(this.eventConfigurations).filter(
      ({ options }) => options.jiraEvent === jiraEvent,
    )

    for (const event of eventsUsingJiraEvent) {
      await this.app.handleEvent(event.id, {
        ...event,
        ...req.body,
      })
    }

    return true
  }
}

export { JiraConnector }
