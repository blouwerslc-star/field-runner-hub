import type { ComponentType } from 'react'
import { template as applicantWelcome } from './applicant-welcome'
import { template as notification } from './notification'
import { template as profileCompletionReminder } from './profile-completion-reminder'
import { template as welcomeRunner } from './welcome-runner'
import { template as welcomeInvestor } from './welcome-investor'
import { template as weeklyDigest } from './weekly-digest'
import { template as reEngagement } from './re-engagement'
import { template as newTaskAvailable } from './new-task-available'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  applicant_welcome: applicantWelcome,
  notification: notification,
  profile_completion_reminder: profileCompletionReminder,
  welcome_runner: welcomeRunner,
  welcome_investor: welcomeInvestor,
  weekly_digest: weeklyDigest,
  re_engagement: reEngagement,
  new_task_available: newTaskAvailable,
}
