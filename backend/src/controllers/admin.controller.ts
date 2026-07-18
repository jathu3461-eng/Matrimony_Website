import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ============================================================
// GET /api/v1/admin/moderation/queue
// Returns profiles awaiting photo/doc verification
// ============================================================
export const getModerationQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [profiles, total] = await prisma.$transaction([
      prisma.profile.findMany({
        where: {
          deletedAt: null,
          photos: { some: { status: 'pending' } },
        },
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, email: true, username: true } },
          photos: { where: { status: 'pending' } },
          religion: true,
          currentCountry: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.profile.count({
        where: { deletedAt: null, photos: { some: { status: 'pending' } } },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: { profiles, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('[Admin] Moderation queue error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch queue.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/admin/moderation/approve/:photoId
// ============================================================
export const approvePhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const photoId = parseInt(req.params.photoId);
  try {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: { status: 'approved' },
    });
    res.status(200).json({ success: true, message: 'Photo approved.', data: photo });
  } catch (error) {
    console.error('[Admin] Approve photo error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to approve photo.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/admin/moderation/reject/:photoId
// ============================================================
export const rejectPhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const photoId = parseInt(req.params.photoId);
  try {
    await prisma.photo.delete({ where: { id: photoId } });
    res.status(200).json({ success: true, message: 'Photo rejected and removed.' });
  } catch (error) {
    console.error('[Admin] Reject photo error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to reject photo.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/admin/moderation/suspend/:profileId
// Soft-suspend profile (sets deletedAt) with a reason
// ============================================================
export const suspendProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profileId = parseInt(req.params.profileId);
  const { reason } = req.body;

  try {
    await prisma.profile.update({
      where: { id: profileId },
      data: { deletedAt: new Date() },
    });

    // Log the moderation action in reports table
    if (req.user) {
      await prisma.report.create({
        data: {
          reporterUserId: req.user.id,
          reportedProfileId: profileId,
          reason: reason || 'Suspended by moderator',
          status: 'actioned',
        },
      });
    }

    res.status(200).json({ success: true, message: 'Profile suspended successfully.' });
  } catch (error) {
    console.error('[Admin] Suspend profile error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to suspend profile.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/admin/reports
// Returns all user-submitted reports
// ============================================================
export const getReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [reports, total] = await prisma.$transaction([
      prisma.report.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          reporter: { select: { id: true, email: true, username: true } },
          reportedProfile: {
            include: {
              user: { select: { id: true, email: true } },
              religion: true,
              currentCountry: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: { reports, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('[Admin] Get reports error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch reports.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/admin/dashboard/stats
// Platform overview statistics for admin dashboard
// ============================================================
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalProfiles,
      totalFavorites,
      totalPayments,
      activeMembers,
      pendingPhotos,
      openReports,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.profile.count({ where: { deletedAt: null } }),
      prisma.favorite.count(),
      prisma.payment.count({ where: { status: 'succeeded' } }),
      prisma.userMembership.count({ where: { status: 'active', endsAt: { gte: new Date() } } }),
      prisma.photo.count({ where: { status: 'pending' } }),
      prisma.report.count({ where: { status: 'pending' } }),
    ]);

    // Revenue in CAD
    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'succeeded' },
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProfiles,
        totalFavorites,
        totalPayments,
        activeMembers,
        pendingPhotos,
        openReports,
        totalRevenue: Number(revenueResult._sum.amount ?? 0),
      },
    });
  } catch (error) {
    console.error('[Admin] Dashboard stats error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stats.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/admin/settings
// Retrieve all global platform settings
// ============================================================
export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('[Admin] Get settings error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch settings.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// PUT /api/v1/admin/settings/:key
// Update a single setting value
// ============================================================
export const updateSetting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { key } = req.params;
  const { value } = req.body;

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    res.status(200).json({ success: true, message: 'Setting updated.', data: setting });
  } catch (error) {
    console.error('[Admin] Update setting error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update setting.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/admin/users
// ============================================================
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const whereClause: any = { deletedAt: null };

    if (role && typeof role === 'string') {
      // Map URL role param → DB accountType enum value
      const accountTypeMap: Record<string, string> = {
        user:      'individual',
        broker:    'broker',
        admin:     'admin',
        moderator: 'moderator',
      };
      const mappedType = accountTypeMap[role];
      if (mappedType) {
        whereClause.accountType = mappedType;
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        roles: { include: { role: true } },
        profiles: {
          where: { deletedAt: null },
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.profiles[0]?.name || u.username,
      email: u.email,
      role: u.roles[0]?.role?.name || u.accountType || 'user',
      status: u.isSuspended ? 'suspended' : 'active',
      joined: u.createdAt.toISOString().split('T')[0],
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('[Admin] Get users error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch users.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// PUT /api/v1/admin/users/:id/status
// ============================================================
export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.', code: 'NOT_FOUND' } });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: !user.isSuspended },
    });

    res.status(200).json({
      success: true,
      message: `User status updated.`,
      data: {
        id: updatedUser.id,
        status: updatedUser.isSuspended ? 'suspended' : 'active'
      }
    });
  } catch (error) {
    console.error('[Admin] Toggle user status error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update user status.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/admin/brokers
// Get all brokers with their agency details
// ============================================================
export const getBrokers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, verified } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (verified !== undefined) {
      whereClause.isVerified = verified === 'true';
    }

    const [brokers, total] = await prisma.$transaction([
      prisma.brokerProfile.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              createdAt: true,
              isSuspended: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.brokerProfile.count({ where: whereClause }),
    ]);

    const formattedBrokers = brokers.map(broker => ({
      id: broker.id,
      userId: broker.userId,
      agencyName: broker.agencyName,
      licenseNumber: broker.licenseNumber,
      isVerified: broker.isVerified,
      verificationStatus: broker.verificationStatus,
      whatsappNumber: broker.whatsappNumber,
      country: broker.country,
      state: broker.state,
      district: broker.district,
      officeAddress: broker.officeAddress,
      yearsOfExperience: broker.yearsOfExperience,
      numberOfActiveClients: broker.numberOfActiveClients,
      registrationNumber: broker.registrationNumber,
      governmentIdUrl: broker.governmentIdUrl,
      websiteUrl: broker.websiteUrl,
      maxProfileQuota: broker.maxProfileQuota,
      userEmail: broker.user.email,
      userName: broker.user.username,
      userStatus: broker.user.isSuspended ? 'suspended' : 'active',
      joined: broker.user.createdAt.toISOString().split('T')[0],
    }));

    res.status(200).json({
      success: true,
      data: {
        brokers: formattedBrokers,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[Admin] Get brokers error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch brokers.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// PUT /api/v1/admin/brokers/:id/status
// Update a broker's verification status
// ============================================================
export const updateBrokerStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const brokerId = parseInt(req.params.id);
  const { status } = req.body; // pending, approved, rejected, blocked

  if (!['pending', 'approved', 'rejected', 'blocked'].includes(status)) {
    res.status(400).json({ success: false, error: { message: 'Invalid status provided.' } });
    return;
  }

  try {
    const broker = await prisma.brokerProfile.findUnique({ 
      where: { id: brokerId },
      include: { user: { select: { email: true, username: true } } }
    });
    if (!broker) {
      res.status(404).json({ success: false, error: { message: 'Broker not found.', code: 'NOT_FOUND' } });
      return;
    }

    const updatedBroker = await prisma.brokerProfile.update({
      where: { id: brokerId },
      data: { 
        verificationStatus: status as any,
        isVerified: status === 'approved', // Automatically set isVerified if approved
      },
    });

    // Simulate email notification based on status change
    const brokerEmail = (broker as any).user?.email;
    const brokerName = (broker as any).user?.username;
    if (status === 'approved') {
      console.log(`\n============================`);
      console.log(`[EMAIL SENT] To: ${brokerEmail}`);
      console.log(`[EMAIL SENT] Subject: 🎉 Broker Account Approved — Mukurtham`);
      console.log(`[EMAIL SENT] Body: Congratulations ${brokerName}! Your broker account has been approved. You can now log in to your Broker Dashboard at /broker-login.`);
      console.log(`============================\n`);
    } else if (status === 'rejected') {
      console.log(`\n============================`);
      console.log(`[EMAIL SENT] To: ${brokerEmail}`);
      console.log(`[EMAIL SENT] Subject: Broker Application Update — Mukurtham`);
      console.log(`[EMAIL SENT] Body: Dear ${brokerName}, unfortunately your broker registration was not approved. Please contact support for further information.`);
      console.log(`============================\n`);
    }

    res.status(200).json({
      success: true,
      message: `Broker status updated to ${status}.`,
      data: {
        id: updatedBroker.id,
        verificationStatus: updatedBroker.verificationStatus,
        isVerified: updatedBroker.isVerified,
      }
    });
  } catch (error) {
    console.error('[Admin] Update broker status error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update broker status.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};


// ============================================================
// GET /api/v1/admin/payments
// Get payment transactions for analytics
// ============================================================
export const getPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status = 'succeeded' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where: {
          ...(status && { status: String(status) as any }),
        },
        skip,
        take: Number(limit),
        include: {
          membership: true,
          user: { select: { id: true, email: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({
        where: {
          ...(status && { status: String(status) as any }),
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[Admin] Get payments error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch payments.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// GET /api/v1/admin/profiles
// Get all matrimony profiles on the platform
// ============================================================
export const getProfiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = { deletedAt: null };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const [profiles, total] = await prisma.$transaction([
      prisma.profile.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, email: true } },
          religion: true,
          caste: true,
          currentCountry: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.profile.count({ where: whereClause }),
    ]);

    const formatted = profiles.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender === 'M' ? 'Male' : 'Female',
      caste: p.caste?.nameEn || 'Unknown',
      country: p.currentCountry?.nameEn || 'Unknown',
      status: p.status === 'active' ? 'verified' : 'pending',
    }));

    res.status(200).json({
      success: true,
      data: {
        profiles: formatted,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[Admin] Get profiles error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch profiles.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// PUT /api/v1/admin/profiles/:id/verify
// Verify a profile, making it active on the platform
// ============================================================
export const verifyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profileId = parseInt(req.params.id);
  try {
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        status: 'active',
        approvedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile verified successfully.',
      data: profile,
    });
  } catch (error) {
    console.error('[Admin] Verify profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to verify profile.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

