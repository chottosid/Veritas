import mongoose from "mongoose";
const { Schema } = mongoose;

// Citizen Schema
const citizenSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    nid: { type: String, unique: true, sparse: true, required: true },
    password: { type: String, required: true }, // Added password field
  },
  {
    timestamps: true,
  }
);

// Police Schema
const policeSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    pid: { type: String, required: true, unique: true, required: true },
    rank: { type: String, required: true },
    station: { type: String, required: true },
    isOC: { type: Boolean, default: false }, // Officer in Charge
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Judge Schema
const judgeSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    courtName: { type: String, required: true },
    rank: { type: String, required: true },
    jid: { type: String, required: true, unique: true, sparse: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Lawyer Schema
const lawyerSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    firmName: { type: String },
    bid: { type: String, required: true, unique: true, sparse: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Accused Schema
const accusedSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    nid: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    occupation: { type: String },
    relationshipToComplainant: { type: String },
    addedBy: {
      type: String,
      enum: ["CITIZEN", "POLICE", "JUDGE"],
      required: true,
    },
    addedById: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Complaint Schema
const complaintSchema = new Schema(
  {
    complainantId: {
      type: Schema.Types.ObjectId,
      ref: "Citizen",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    area: { type: String, required: true },
    assignedOfficerIds: [{ type: Schema.Types.ObjectId, ref: "Police" }],
    status: {
      type: String,
      enum: ["PENDING", "UNDER_INVESTIGATION", "FIR_REGISTERED", "CLOSED"],
      default: "PENDING",
    },
    accused: { type: [accusedSchema], default: [] }, // Array of accused persons
    attachments: [
      {
        fileName: String,
        ipfsHash: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ], // Multiple attachments support
  },
  {
    timestamps: true,
  }
);

// FIR Schema
const firSchema = new Schema(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    firNumber: { type: String, required: true, unique: true },
    sections: [{ type: String }], // Legal sections
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: "Police",
      required: true,
    },
    submittedToJudge: { type: Schema.Types.ObjectId, ref: "Judge" },
    status: {
      type: String,
      enum: ["PENDING", "CASE_CREATED"],
      default: "PENDING",
    },
    accused: [accusedSchema], // Accused details in FIR (can be updated by police)
    attachments: [
      {
        fileName: String,
        ipfsHash: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Lawyer Request Schema
const lawyerRequestSchema = new Schema(
  {
    citizenId: { type: Schema.Types.ObjectId, ref: "Citizen", required: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case" },
    requestedLawyerId: { type: Schema.Types.ObjectId, ref: "Lawyer" },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
    message: { type: String },
  },
  {
    timestamps: true,
  }
);

// Case Schema
const caseSchema = new Schema(
  {
    firId: { type: Schema.Types.ObjectId, ref: "FIR", required: true },
    caseNumber: { type: String, required: true, unique: true },
    assignedJudgeId: { type: Schema.Types.ObjectId, ref: "Judge" },
    accusedLawyerId: { type: Schema.Types.ObjectId, ref: "Lawyer" },
    prosecutorLawyerId: { type: Schema.Types.ObjectId, ref: "Lawyer" },
    status: {
      type: String,
      enum: ["PENDING", "ONGOING", "CLOSED"],
      default: "PENDING",
    },
    hearingDates: [{ type: Date }],
    verdict: { type: String },
    investigatingOfficerIds: [{ type: Schema.Types.ObjectId, ref: "Police" }],
    ipfsHash: { type: String }, // IPFS hash for case documents
  },
  {
    timestamps: true,
  }
);

// Case Proceeding Schema
const caseProceedingSchema = new Schema(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "Case",
      index: true,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "HEARING_SCHEDULED",
        "EVIDENCE_SUBMITTED",
        "DOCUMENT_FILED",
        "STATUS_CHANGED",
        "SUMMON_ISSUED",
        "ORDER_PASSED",
        "JUDGMENT",
        "CASE_CREATED",
      ],
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["JUDGE", "POLICE", "LAWYER", "CITIZEN", "SYSTEM"],
      required: true,
    },
    createdById: { type: Schema.Types.ObjectId, required: true },
    description: { type: String },
    at: { type: Date, default: Date.now },
    attachments: [
      {
        fileName: String,
        ipfsHash: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

// OTP Schema for 2FA
const otpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    type: {
      type: String,
      enum: ["REGISTRATION", "LOGIN", "PASSWORD_RESET"],
      required: true,
    },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
  },
  {
    timestamps: true,
  }
);

// Notification Schema
const notificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, required: true },
    recipientType: {
      type: String,
      enum: ["CITIZEN", "POLICE", "JUDGE", "LAWYER"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case" },
    complaintId: { type: Schema.Types.ObjectId, ref: "Complaint" },
    firId: { type: Schema.Types.ObjectId, ref: "FIR" },
    type: {
      type: String,
      enum: [
        "CASE_CREATED",
        "CASE_ASSIGNED",
        "HEARING_SCHEDULED",
        "EVIDENCE_SUBMITTED",
        "DOCUMENT_FILED",
        "LAWYER_REQUEST_ACCEPTED",
        "LAWYER_REQUEST_REJECTED",
        "LAWYER_REQUEST_PENDING",
        "CASE_CLOSED",
        "COMPLAINT_SUBMITTED",
        "COMPLAINT_ASSIGNED",
        "FIR_REGISTERED",
        "FIR_SUBMITTED",
        "FIR_REJECTED",
        "STATUS_CHANGED",
        "ORDER_PASSED",
        "JUDGMENT_PASSED",
        "SUMMON_ISSUED",
        "SYSTEM_UPDATE",
      ],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    expiresAt: { type: Date, default: null }, // Optional expiration date
    metadata: { type: Schema.Types.Mixed }, // Additional data like hearing date, etc.
  },
  {
    timestamps: true,
  }
);

// Blockchain Transaction Schema
const blockchainTransactionSchema = new Schema(
  {
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "COMPLAINT_FILED",
        "FIR_REGISTERED",
        "CASE_CREATED",
        "CASE_UPDATED",
        "EVIDENCE_SUBMITTED",
        "CASE_STATUS_CHANGED",
        "JUDGMENT_PASSED",
      ],
      required: true,
    },
    caseId: { type: Schema.Types.ObjectId, ref: "Case" },
    complaintId: { type: Schema.Types.ObjectId, ref: "Complaint" },
    firId: { type: Schema.Types.ObjectId, ref: "FIR" },
    evidenceId: { type: Schema.Types.ObjectId },
    blockNumber: { type: Number },
    gasUsed: { type: String },
    gasPrice: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "FAILED"],
      default: "PENDING",
    },
    metadata: Schema.Types.Mixed, // Additional transaction data
    confirmedAt: { type: Date },
    error: { type: String }, // Error message if transaction failed
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientType: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for expired notifications

blockchainTransactionSchema.index({ eventType: 1, createdAt: -1 });
blockchainTransactionSchema.index({ caseId: 1 });
blockchainTransactionSchema.index({ status: 1 });

// Create Models
const Citizen = mongoose.model("Citizen", citizenSchema);
const Police = mongoose.model("Police", policeSchema);
const Judge = mongoose.model("Judge", judgeSchema);
const Lawyer = mongoose.model("Lawyer", lawyerSchema);
const Complaint = mongoose.model("Complaint", complaintSchema);
const FIR = mongoose.model("FIR", firSchema);
const LawyerRequest = mongoose.model("LawyerRequest", lawyerRequestSchema);
const Case = mongoose.model("Case", caseSchema);
const CaseProceeding = mongoose.model("CaseProceeding", caseProceedingSchema);
const OTP = mongoose.model("OTP", otpSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const BlockchainTransaction = mongoose.model(
  "BlockchainTransaction",
  blockchainTransactionSchema
);

export {
  Citizen,
  Police,
  Judge,
  Lawyer,
  Complaint,
  FIR,
  LawyerRequest,
  Case,
  CaseProceeding,
  OTP,
  Notification,
  BlockchainTransaction,
};
