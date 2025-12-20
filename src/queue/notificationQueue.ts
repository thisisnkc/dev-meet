/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../lib/prisma";

type JobOptions = {
  delay?: number;
  attempts?: number;
  removeOnComplete?: boolean;
};

class PrismaQueue {
  constructor(private queueName: string) {}

  async add(jobName: string, data: any, options?: JobOptions) {
    const runAt = new Date(Date.now() + (options?.delay || 0));

    // Merge options into data to access them in worker
    const jobData = { ...data, _options: options };

    return await prisma.job.create({
      data: {
        type: jobName,
        data: jobData,
        runAt,
        maxAttempts: options?.attempts || 3,
      },
    });
  }

  process(
    jobName: string,
    handler: (job: any, done: (err?: any) => void) => Promise<void>
  ) {
    console.log(`[Queue] Starting worker for ${this.queueName}:${jobName}`);

    const poll = async () => {
      try {
        // Find a pending job that is due
        const job = await prisma.job.findFirst({
          where: {
            type: jobName,
            status: "pending",
            runAt: { lte: new Date() },
          },
          orderBy: { runAt: "asc" },
        });

        if (job) {
          // Attempt to lock the job
          // We rely on optimistic locking via status check in update
          try {
            const lockedJob = await prisma.job.update({
              where: { id: job.id, status: "pending" },
              data: {
                status: "processing",
                attempts: { increment: 1 },
              },
            });

            // Prepare job object wrapper for handler
            const jobWrapper = {
              id: lockedJob.id,
              data: lockedJob.data as any,
            };

            // Custom done callback
            const done = async (err?: any) => {
              try {
                if (err) {
                  console.error(`[Queue] Job ${lockedJob.id} failed:`, err);
                  if (lockedJob.attempts < lockedJob.maxAttempts) {
                    // Retry with backoff (e.g., 1 minute)
                    await prisma.job.update({
                      where: { id: lockedJob.id },
                      data: {
                        status: "pending",
                        runAt: new Date(Date.now() + 60 * 1000),
                      },
                    });
                  } else {
                    await prisma.job.update({
                      where: { id: lockedJob.id },
                      data: { status: "failed", error: String(err) },
                    });
                  }
                } else {
                  // Success
                  const opts = (lockedJob.data as any)?._options;
                  if (opts?.removeOnComplete) {
                    await prisma.job.delete({ where: { id: lockedJob.id } });
                  } else {
                    await prisma.job.update({
                      where: { id: lockedJob.id },
                      data: { status: "completed" },
                    });
                  }
                }
              } catch (updateErr) {
                console.error(`[Queue] Error updating job status:`, updateErr);
              }
            };

            // Run handler
            try {
              await handler(jobWrapper, done);
            } catch (handlerErr) {
              await done(handlerErr);
            }

            // Poll again immediately if we found work
            setImmediate(poll);
            return;
          } catch {
            // Failed to lock (another worker took it?), continue polling
          }
        }
      } catch (err) {
        console.error("[Queue] Polling error:", err);
      }

      // Wait before polling again if no work or error
      setTimeout(poll, 5000);
    };

    poll();
  }
}

export const notificationQueue = new PrismaQueue("meeting-notifications");
