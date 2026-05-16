import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";

export type NotificationType = "announcement" | "payment" | "grade" | "certificate" | "info";

export async function createNotification({
  userId,
  type = "info",
  title,
  message,
  link
}: {
  userId: number;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const [notif] = await db.insert(notificationsTable).values({
      userId,
      type,
      title,
      message,
      link
    }).returning();
    
    logger.info(`Notification created for userId=${userId}: ${title}`);
    return notif;
  } catch (error) {
    logger.error(`Failed to create notification for userId=${userId}:`, error);
  }
}

export const notificationTriggers = {
  assignmentGraded: (userId: number, assignmentTitle: string, score: number, total: number) => {
    return createNotification({
      userId,
      type: "grade",
      title: "Assignment Graded! 📝",
      message: `Your submission for "${assignmentTitle}" has been graded. You scored ${score}/${total}.`,
      link: "/dashboard/assignments"
    });
  },
  
  quizCompleted: (userId: number, quizTitle: string, score: number, passed: boolean) => {
    return createNotification({
      userId,
      type: "grade",
      title: passed ? "Quiz Passed! 🏆" : "Quiz Attempted",
      message: `You scored ${score} in "${quizTitle}". ${passed ? "Congratulations on passing!" : "Keep practicing to improve your score."}`,
      link: "/dashboard/quizzes"
    });
  },
  
  paymentVerified: (userId: number, courseTitle: string) => {
    return createNotification({
      userId,
      type: "payment",
      title: "Payment Verified! ✅",
      message: `Your enrollment for "${courseTitle}" has been confirmed. Happy learning!`,
      link: "/dashboard/courses"
    });
  },
  
  certificateIssued: (userId: number, courseTitle: string) => {
    return createNotification({
      userId,
      type: "certificate",
      title: "Certificate Issued! 🎓",
      message: `Congratulations! You've successfully completed "${courseTitle}" and your certificate is now available.`,
      link: "/dashboard/certificates"
    });
  },

  identityVerified: (userId: number, approved: boolean, reason?: string) => {
    return createNotification({
      userId,
      type: "info",
      title: approved ? "Identity Verified ✅" : "Identity Verification Update",
      message: approved 
        ? "Your identity document has been verified. You can now access all student features."
        : `Your identity verification was not approved. ${reason || "Please check your document and try again."}`,
      link: approved ? undefined : "/dashboard/verify-identity"
    });
  },

  forumReply: (userId: number, postTitle: string) => {
    return createNotification({
      userId,
      type: "info",
      title: "New Forum Reply 💬",
      message: `Someone replied to your post "${postTitle}".`,
      link: "/dashboard/forum"
    });
  },

  newMessage: (userId: number, senderName: string) => {
    return createNotification({
      userId,
      type: "info",
      title: "New Message 📧",
      message: `You have a new message from ${senderName}.`,
      link: "/dashboard/messages"
    });
  }
};
