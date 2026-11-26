export type BusinessSummary = {
  id: string;
  name: string;
  email: string;
};

export type SessionGrant = { id: string; expiresAt: Date };

export type DeviceGrant = { id: string };

export type RequestContext = {
  deviceId?: string;
  ip?: string;
  userAgent?: string;
};

export type LoginOutput =
  | { business: BusinessSummary; session: SessionGrant }
  | { verificationRequired: true; challengeId: string };

export type VerifyDeviceOutput = {
  business: BusinessSummary;
  session: SessionGrant;
  device: DeviceGrant;
};
