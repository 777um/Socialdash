import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { scriptsRouter } from "./scripts";
import { templatesRouter } from "./templates-router";
import { webhooksRouter } from "./webhooks-router";
import { analyticsRouter } from "./analytics-router";
import { alertsRouter } from "./alerts-router";
import { terminalRouter } from "./terminal-router";
import { notificationsRouter } from "./notifications-router";
import { executionStatusRouter } from "./execution-status-router";
import { kpiRouter } from "./kpi-router";
import { trendAnalysisRouter } from "./trend-analysis-router";
import { alertsCustomizableRouter } from "./alerts-customizable-router";
import { jobsRouter } from "./jobs-router";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  scripts: scriptsRouter,
  templates: templatesRouter,
  webhooks: webhooksRouter,
  analytics: analyticsRouter,
  alerts: alertsRouter,
  terminal: terminalRouter,
  notifications: notificationsRouter,
  executionStatus: executionStatusRouter,
  kpi: kpiRouter,
  trendAnalysis: trendAnalysisRouter,
  alertsCustomizable: alertsCustomizableRouter,
  jobs: jobsRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
