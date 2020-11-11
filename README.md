# reshuffle-jira-connector

[Code](https://github.com/reshufflehq/reshuffle-jira-connector) |  [npm](https://www.npmjs.com/package/reshuffle-jira-connector) | [Code sample](https://github.com/reshufflehq/reshuffle/tree/master/examples/jira)

`npm install reshuffle-jira-connector`

This connector uses [Node Jira Client](https://github.com/jira-node/node-jira-client) package.

### Reshuffle Jira Connector

This connector provides a connector for [Atlassian Jira](https://www.atlassian.com/software/jira).

Create an API token from your Atlassian account:

1. Log in to https://id.atlassian.com/manage/api-tokens.
2. Click Create API token.
3. From the dialog that appears, enter a memorable and concise Label for your token and click Create.
4. Click Copy to clipboard, then paste the token to your script, or elsewhere to save

#### Configuration Options:

There are several ways to instantiate this connector (see options below).
The recommended way to connect to Jira is to provide those options:
```typescript
const connector = new JiraConnector(app, {
  host: '<yourhostname.atlassian.net>',
  protocol: 'https',
  username: '<your user email address>',
  password: '<your api token>',
  baseURL: '<your runtime base url for events only>',
})
``` 

Full list of options to connect to Jira
```typescript
interface JiraConnectorConfigOptions extends JiraApiOptions {
  baseURL?: string
  webhookPath?: string // Default to '/reshuffle-jira-connector/webhook'
  webhookName?: string // Default to 'reshuffle-runtime-jira'
}

interface JiraApiOptions {
  protocol?: string
  host: string
  port?: string
  username?: string
  password?: string
  apiVersion?: string
  base?: string
  intermediatePath?: string
  strictSSL?: boolean
  request?: any
  timeout?: number
  webhookVersion?: string
  greenhopperVersion?: string
  bearer?: string
  oauth?: OAuth
}
```

#### Connector events

##### listening to Jira events

To listen to events happening in Jira, pass the Jira event type as options

```typescript
interface JiraConnectorEventOptions {
  jiraEvent: JiraEvent
  
}

// List extracted from https://developer.atlassian.com/server/jira/platform/webhooks/#configuring-a-webhook
type JiraEvent =
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
```

#### Connector actions

All actions are provided via the sdk.
// See full list of actions with documentation in [Node Jira Client code](https://github.com/jira-node/node-jira-client/blob/master/src/jira.js)

Few examples:

- Get details for project 'DEMO'
```typescript
const jiraProject = await connector.sdk().getProject('DEMO')
```

- Get list of issues for a board
```typescript
const board1Issues = await connector.sdk().getIssuesForBoard(1)
console.log(board1Issues[0].fields)
```

- Get current user details:
```typescript
const user = await connector.sdk().getCurrentUser()
```

##### sdk

Full access to the Node Jira Client SDK

```typescript
const sdk = await connector.sdk()
```
