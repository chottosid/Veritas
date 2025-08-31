import websocketServer from "../websocket.js";

// Create notification utility function
export const createNotification = async (
  Notification,
  {
    recipientId,
    recipientType,
    title,
    message,
    type,
    caseId = null,
    complaintId = null,
    firId = null,
    metadata = null,
  }
) => {
  try {
    const notification = new Notification({
      recipientId,
      recipientType,
      title,
      message,
      type,
      caseId,
      complaintId,
      firId,
      metadata,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

// Enhanced notification system for all parties
export class NotificationService {
  static async createNotification(
    Notification,
    {
      recipientId,
      recipientType,
      title,
      message,
      type,
      caseId = null,
      complaintId = null,
      firId = null,
      metadata = null,
      priority = "normal", // 'low', 'normal', 'high', 'urgent'
      expiresAt = null, // Optional expiration date
    }
  ) {
    try {
      const notification = new Notification({
        recipientId,
        recipientType,
        title,
        message,
        type,
        caseId,
        complaintId,
        firId,
        metadata,
        priority,
        expiresAt,
        isRead: false,
        createdAt: new Date(),
      });

      await notification.save();

      // Send real-time notification via WebSocket
      websocketServer.sendToUser(recipientId, {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        caseId: notification.caseId,
        complaintId: notification.complaintId,
        firId: notification.firId,
        metadata: notification.metadata,
        priority: notification.priority,
        createdAt: notification.createdAt,
        recipientType: notification.recipientType,
      });

      return notification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      return null;
    }
  }

  // Notify multiple recipients
  static async createMultipleNotifications(Notification, notifications) {
    try {
      const createdNotifications = [];

      for (const notificationData of notifications) {
        const notification = await this.createNotification(
          Notification,
          notificationData
        );
        if (notification) {
          createdNotifications.push(notification);
        }
      }

      return createdNotifications;
    } catch (error) {
      console.error("Failed to create multiple notifications:", error);
      return [];
    }
  }

  // Case-related notifications
  static async notifyCaseCreation(
    Notification,
    {
      caseId,
      caseNumber,
      firId,
      complaintId,
      complainantId,
      assignedJudgeId,
      investigatingOfficerIds,
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    // Notify complainant
    if (
      complainantId &&
      !excludeRecipients.includes(complainantId.toString())
    ) {
      notifications.push({
        recipientId: complainantId,
        recipientType: "CITIZEN",
        title: "Case Created",
        message: `Your case ${caseNumber} has been created and is now under judicial review`,
        type: "CASE_CREATED",
        caseId,
        firId,
        complaintId,
        metadata: { caseNumber, status: "PENDING" },
        priority: "high",
      });
    }

    // Notify investigating officers
    if (investigatingOfficerIds && investigatingOfficerIds.length > 0) {
      investigatingOfficerIds.forEach((officerId) => {
        if (!excludeRecipients.includes(officerId.toString())) {
          notifications.push({
            recipientId: officerId,
            recipientType: "POLICE",
            title: "Case Assigned",
            message: `You have been assigned to investigate case ${caseNumber}`,
            type: "CASE_ASSIGNED",
            caseId,
            firId,
            complaintId,
            metadata: { caseNumber, role: "investigating_officer" },
            priority: "high",
          });
        }
      });
    }

    // Notify assigned judge
    if (
      assignedJudgeId &&
      !excludeRecipients.includes(assignedJudgeId.toString())
    ) {
      notifications.push({
        recipientId: assignedJudgeId,
        recipientType: "JUDGE",
        title: "New Case Assigned",
        message: `Case ${caseNumber} has been assigned to you for judicial proceedings`,
        type: "CASE_ASSIGNED",
        caseId,
        firId,
        complaintId,
        metadata: { caseNumber, role: "assigned_judge" },
        priority: "high",
      });
    }

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // FIR-related notifications
  static async notifyFIRRegistration(
    Notification,
    {
      firId,
      firNumber,
      complaintId,
      complainantId,
      registeredBy,
      assignedJudgeId,
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    // Notify complainant
    if (
      complainantId &&
      !excludeRecipients.includes(complainantId.toString())
    ) {
      notifications.push({
        recipientId: complainantId,
        recipientType: "CITIZEN",
        title: "FIR Registered",
        message: `Your FIR ${firNumber} has been successfully registered and is under review`,
        type: "FIR_REGISTERED",
        firId,
        complaintId,
        metadata: { firNumber, status: "PENDING" },
        priority: "high",
      });
    }

    // Notify assigned judge
    if (
      assignedJudgeId &&
      !excludeRecipients.includes(assignedJudgeId.toString())
    ) {
      notifications.push({
        recipientId: assignedJudgeId,
        recipientType: "JUDGE",
        title: "New FIR Submitted",
        message: `FIR ${firNumber} has been submitted for your review and approval`,
        type: "FIR_SUBMITTED",
        firId,
        complaintId,
        metadata: { firNumber, status: "PENDING" },
        priority: "normal",
      });
    }

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // Complaint-related notifications
  static async notifyComplaintSubmission(
    Notification,
    {
      complaintId,
      title,
      complainantId,
      assignedOfficerId,
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    // Notify complainant
    if (
      complainantId &&
      !excludeRecipients.includes(complainantId.toString())
    ) {
      notifications.push({
        recipientId: complainantId,
        recipientType: "CITIZEN",
        title: "Complaint Submitted",
        message: `Your complaint "${title}" has been submitted and is under investigation`,
        type: "COMPLAINT_SUBMITTED",
        complaintId,
        metadata: { title, status: "PENDING" },
        priority: "normal",
      });
    }

    // Notify assigned police officer
    if (
      assignedOfficerId &&
      !excludeRecipients.includes(assignedOfficerId.toString())
    ) {
      notifications.push({
        recipientId: assignedOfficerId,
        recipientType: "POLICE",
        title: "New Complaint Assigned",
        message: `Complaint "${title}" has been assigned to you for investigation`,
        type: "COMPLAINT_ASSIGNED",
        complaintId,
        metadata: { title, status: "ASSIGNED" },
        priority: "high",
      });
    }

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // Hearing-related notifications
  static async notifyHearingScheduled(
    Notification,
    {
      caseId,
      caseNumber,
      hearingDate,
      hearingTime,
      courtroom,
      participants, // Array of { userId, role, recipientType }
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    participants.forEach((participant) => {
      if (!excludeRecipients.includes(participant.userId.toString())) {
        notifications.push({
          recipientId: participant.userId,
          recipientType: participant.recipientType,
          title: "Hearing Scheduled",
          message: `Hearing for case ${caseNumber} scheduled on ${hearingDate} at ${hearingTime} in ${courtroom}`,
          type: "HEARING_SCHEDULED",
          caseId,
          metadata: {
            caseNumber,
            hearingDate,
            hearingTime,
            courtroom,
            role: participant.role,
          },
          priority: "urgent",
          expiresAt: new Date(hearingDate),
        });
      }
    });

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // Lawyer request notifications
  static async notifyLawyerRequest(
    Notification,
    {
      requestId,
      caseId,
      caseNumber,
      complainantId,
      lawyerId,
      requestType, // 'ACCEPTED', 'REJECTED', 'PENDING'
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    // Notify complainant
    if (
      complainantId &&
      !excludeRecipients.includes(complainantId.toString())
    ) {
      const statusMessage =
        requestType === "ACCEPTED"
          ? "accepted your lawyer request"
          : requestType === "REJECTED"
          ? "rejected your lawyer request"
          : "is reviewing your lawyer request";

      notifications.push({
        recipientId: complainantId,
        recipientType: "CITIZEN",
        title: `Lawyer Request ${requestType}`,
        message: `Your lawyer request for case ${caseNumber} has been ${statusMessage}`,
        type: `LAWYER_REQUEST_${requestType}`,
        caseId,
        metadata: { caseNumber, requestType, requestId },
        priority: "normal",
      });
    }

    // Notify lawyer
    if (lawyerId && !excludeRecipients.includes(lawyerId.toString())) {
      notifications.push({
        recipientId: lawyerId,
        recipientType: "LAWYER",
        title: `Case ${requestType}`,
        message: `Case ${caseNumber} has been ${requestType.toLowerCase()} for your representation`,
        type: `CASE_${requestType}`,
        caseId,
        metadata: { caseNumber, requestType, requestId },
        priority: "high",
      });
    }

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // Evidence and document notifications
  static async notifyEvidenceSubmission(
    Notification,
    {
      caseId,
      caseNumber,
      submittedBy,
      submittedByRole,
      evidenceType, // 'DOCUMENT', 'EVIDENCE', 'WITNESS_STATEMENT'
      title,
      participants,
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    participants.forEach((participant) => {
      if (!excludeRecipients.includes(participant.userId.toString())) {
        notifications.push({
          recipientId: participant.userId,
          recipientType: participant.recipientType,
          title: "New Evidence Submitted",
          message: `New ${evidenceType.toLowerCase()} "${title}" has been submitted in case ${caseNumber}`,
          type: "EVIDENCE_SUBMITTED",
          caseId,
          metadata: {
            caseNumber,
            evidenceType,
            title,
            submittedBy,
            submittedByRole,
            role: participant.role,
          },
          priority: "normal",
        });
      }
    });

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // Status change notifications
  static async notifyStatusChange(
    Notification,
    {
      caseId,
      caseNumber,
      oldStatus,
      newStatus,
      changedBy,
      changedByRole,
      participants,
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    participants.forEach((participant) => {
      if (!excludeRecipients.includes(participant.userId.toString())) {
        notifications.push({
          recipientId: participant.userId,
          recipientType: participant.recipientType,
          title: "Case Status Updated",
          message: `Case ${caseNumber} status changed from ${oldStatus} to ${newStatus}`,
          type: "STATUS_CHANGED",
          caseId,
          metadata: {
            caseNumber,
            oldStatus,
            newStatus,
            changedBy,
            changedByRole,
            role: participant.role,
          },
          priority: "normal",
        });
      }
    });

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // Order and judgment notifications
  static async notifyOrderPassed(
    Notification,
    {
      caseId,
      caseNumber,
      orderType, // 'ORDER', 'JUDGMENT', 'SUMMON'
      orderTitle,
      participants,
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    participants.forEach((participant) => {
      if (!excludeRecipients.includes(participant.userId.toString())) {
        notifications.push({
          recipientId: participant.userId,
          recipientType: participant.recipientType,
          title: `${orderType} Passed`,
          message: `New ${orderType.toLowerCase()} "${orderTitle}" has been passed in case ${caseNumber}`,
          type: `${orderType.toUpperCase()}_PASSED`,
          caseId,
          metadata: {
            caseNumber,
            orderType,
            orderTitle,
            role: participant.role,
          },
          priority: "high",
        });
      }
    });

    return await this.createMultipleNotifications(Notification, notifications);
  }

  // System-wide notifications
  static async notifySystemUpdate(
    Notification,
    {
      title,
      message,
      type,
      recipientType = null, // If null, send to all
      metadata = null,
      priority = "normal",
    }
  ) {
    if (recipientType) {
      // Send to specific role
      websocketServer.sendToRole(recipientType, {
        title,
        message,
        type,
        metadata,
        priority,
        isSystem: true,
        createdAt: new Date(),
      });
    } else {
      // Broadcast to all
      websocketServer.broadcastToAll({
        title,
        message,
        type,
        metadata,
        priority,
        isSystem: true,
        createdAt: new Date(),
      });
    }

    // Also store in database for offline users
    if (recipientType) {
      // Get all users of this type and create notifications
      // This would require additional database queries
      console.log(
        `System notification sent to all ${recipientType}s: ${title}`
      );
    } else {
      console.log(`System notification broadcast to all users: ${title}`);
    }
  }

  // FIR rejection notifications
  static async notifyFIRRejection(
    Notification,
    { firId, reason, recipientId, recipientType }
  ) {
    return await this.createNotification(Notification, {
      recipientId,
      recipientType,
      title: "FIR Rejected",
      message: `Your FIR has been rejected by the judge. Reason: ${reason}`,
      type: "FIR_REJECTED",
      firId,
      metadata: { reason },
      priority: "high",
    });
  }

  // Case closure notifications
  static async notifyCaseClosed(
    Notification,
    {
      caseId,
      verdict,
      firId,
      complaintId,
      assignedJudgeId,
      excludeRecipients = [],
    }
  ) {
    const notifications = [];

    // Get case details to find all parties
    try {
      const { Case } = await import("../models/index.js");
      const caseData = await Case.findById(caseId)
        .populate({
          path: "firId",
          populate: {
            path: "complaintId",
            populate: "complainantId",
          },
        })
        .populate("assignedJudgeId")
        .populate("accusedLawyerId")
        .populate("prosecutorLawyerId")
        .populate("investigatingOfficerIds");

      if (caseData) {
        // Notify complainant
        if (
          caseData.firId?.complaintId?.complainantId &&
          !excludeRecipients.includes(
            caseData.firId.complaintId.complainantId.toString()
          )
        ) {
          notifications.push({
            recipientId: caseData.firId.complaintId.complainantId,
            recipientType: "CITIZEN",
            title: "Case Closed",
            message: `Case ${caseData.caseNumber} has been closed with verdict: ${verdict}`,
            type: "CASE_CLOSED",
            caseId,
            firId,
            complaintId,
            metadata: { caseNumber: caseData.caseNumber, verdict },
            priority: "high",
          });
        }

        // Notify investigating officers
        if (
          caseData.investigatingOfficerIds &&
          caseData.investigatingOfficerIds.length > 0
        ) {
          caseData.investigatingOfficerIds.forEach((officerId) => {
            if (!excludeRecipients.includes(officerId.toString())) {
              notifications.push({
                recipientId: officerId,
                recipientType: "POLICE",
                title: "Case Closed",
                message: `Case ${caseData.caseNumber} has been closed with verdict: ${verdict}`,
                type: "CASE_CLOSED",
                caseId,
                firId,
                complaintId,
                metadata: { caseNumber: caseData.caseNumber, verdict },
                priority: "high",
              });
            }
          });
        }

        // Notify lawyers if any
        if (
          caseData.accusedLawyerId &&
          !excludeRecipients.includes(caseData.accusedLawyerId.toString())
        ) {
          notifications.push({
            recipientId: caseData.accusedLawyerId,
            recipientType: "LAWYER",
            title: "Case Closed",
            message: `Case ${caseData.caseNumber} has been closed with verdict: ${verdict}`,
            type: "CASE_CLOSED",
            caseId,
            firId,
            complaintId,
            metadata: { caseNumber: caseData.caseNumber, verdict },
            priority: "high",
          });
        }

        if (
          caseData.prosecutorLawyerId &&
          !excludeRecipients.includes(caseData.prosecutorLawyerId.toString())
        ) {
          notifications.push({
            recipientId: caseData.prosecutorLawyerId,
            recipientType: "LAWYER",
            title: "Case Closed",
            message: `Case ${caseData.caseNumber} has been closed with verdict: ${verdict}`,
            type: "CASE_CLOSED",
            caseId,
            firId,
            complaintId,
            metadata: { caseNumber: caseData.caseNumber, verdict },
            priority: "high",
          });
        }
      }
    } catch (error) {
      console.error("Error getting case details for notification:", error);
    }

    return await this.createMultipleNotifications(Notification, notifications);
  }
}

export default NotificationService;

// Enhanced notification system for case workflow
export const notifyCaseParties = async (
  Notification,
  {
    caseId,
    firId,
    complaintId,
    title,
    message,
    type,
    metadata = null,
    excludeRecipients = [], // Array of recipient IDs to exclude
  }
) => {
  try {
    // Get case details to find all parties
    const { Case, FIR, Complaint } = await import("../models/index.js");

    const caseData = await Case.findById(caseId)
      .populate({
        path: "firId",
        populate: {
          path: "complaintId",
          populate: "complainantId",
        },
      })
      .populate("assignedJudgeId")
      .populate("accusedLawyerId")
      .populate("prosecutorLawyerId")
      .populate("investigatingOfficerIds");

    if (!caseData) {
      console.error("Case not found for notification");
      return;
    }

    const notifications = [];
    const recipients = new Set();

    // Add complainant
    if (caseData.firId?.complaintId?.complainantId) {
      const complainantId =
        caseData.firId.complaintId.complainantId._id.toString();
      if (!excludeRecipients.includes(complainantId)) {
        recipients.add(complainantId);
        notifications.push({
          recipientId: complainantId,
          recipientType: "CITIZEN",
          title,
          message,
          type,
          caseId,
          complaintId,
          firId,
          metadata,
        });
      }
    }

    // Add accused persons (from FIR)
    if (caseData.firId?.accused) {
      for (const accused of caseData.firId.accused) {
        // Note: In a real system, accused would have their own accounts
        // For now, we'll notify the complainant about accused-related updates
        // This can be enhanced when accused user accounts are implemented
      }
    }

    // Add investigating officers
    if (caseData.investigatingOfficerIds) {
      for (const officer of caseData.investigatingOfficerIds) {
        const officerId = officer._id.toString();
        if (!excludeRecipients.includes(officerId)) {
          recipients.add(officerId);
          notifications.push({
            recipientId: officerId,
            recipientType: "POLICE",
            title,
            message,
            type,
            caseId,
            complaintId,
            firId,
            metadata,
          });
        }
      }
    }

    // Add assigned judge
    if (caseData.assignedJudgeId) {
      const judgeId = caseData.assignedJudgeId._id.toString();
      if (!excludeRecipients.includes(judgeId)) {
        recipients.add(judgeId);
        notifications.push({
          recipientId: judgeId,
          recipientType: "JUDGE",
          title,
          message,
          type,
          caseId,
          complaintId,
          firId,
          metadata,
        });
      }
    }

    // Add accused lawyer
    if (caseData.accusedLawyerId) {
      const lawyerId = caseData.accusedLawyerId._id.toString();
      if (!excludeRecipients.includes(lawyerId)) {
        recipients.add(lawyerId);
        notifications.push({
          recipientId: lawyerId,
          recipientType: "LAWYER",
          title,
          message,
          type,
          caseId,
          complaintId,
          firId,
          metadata,
        });
      }
    }

    // Add prosecutor lawyer
    if (caseData.prosecutorLawyerId) {
      const lawyerId = caseData.prosecutorLawyerId._id.toString();
      if (!excludeRecipients.includes(lawyerId)) {
        recipients.add(lawyerId);
        notifications.push({
          recipientId: lawyerId,
          recipientType: "LAWYER",
          title,
          message,
          type,
          caseId,
          complaintId,
          firId,
          metadata,
        });
      }
    }

    // Create all notifications
    const createdNotifications = [];
    for (const notificationData of notifications) {
      const notification = await createNotification(
        Notification,
        notificationData
      );
      if (notification) {
        createdNotifications.push(notification);
      }
    }

    console.log(
      `Created ${createdNotifications.length} notifications for case ${caseId}`
    );
    return createdNotifications;
  } catch (error) {
    console.error("Failed to notify case parties:", error);
    return [];
  }
};
