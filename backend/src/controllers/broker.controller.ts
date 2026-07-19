import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ============================================================
// Helper: Get broker's userId and their managed profile IDs
// ============================================================
async function getBrokerContext(userId: number) {
  const brokerProfile = await prisma.brokerProfile.findUnique({
    where: { userId },
  });
  if (!brokerProfile) return null;

  // Profiles registered by clients of this broker user
  const profiles = await prisma.profile.findMany({
    where: {
      userId,          // Profiles owned by this broker's user account
      deletedAt: null,
    },
    select: { id: true },
  });
  const profileIds = profiles.map((p) => p.id);
  return { brokerProfile, profileIds };
}

// ============================================================
// GET /api/v1/broker/dashboard
// Returns broker-specific dashboard stats
// ============================================================
export const getBrokerDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const ctx = await getBrokerContext(req.user.id);
    if (!ctx) { res.status(404).json({ success: false, error: { message: 'Broker profile not found.', code: 'NOT_FOUND' } }); return; }

    const { profileIds } = ctx;

    const [
      totalProfiles,
      verifiedProfiles,
      pendingProfiles,
      totalInterestsSent,
      pendingInterests,
      acceptedInterests,
      totalConversations,
      totalAppointments,
      upcomingAppointments,
      recentProfiles,
    ] = await prisma.$transaction([
      prisma.profile.count({ where: { userId: req.user.id, deletedAt: null } }),
      prisma.profile.count({ where: { userId: req.user.id, deletedAt: null, status: 'active' } }),
      prisma.profile.count({ where: { userId: req.user.id, deletedAt: null, status: 'pending_moderation' } }),
      prisma.interest.count({ where: { senderProfile: { userId: req.user.id } } }),
      prisma.interest.count({ where: { senderProfile: { userId: req.user.id }, status: 'pending' } }),
      prisma.interest.count({ where: { senderProfile: { userId: req.user.id }, status: 'accepted' } }),
      prisma.conversation.count({
        where: {
          participants: {
            some: { userId: req.user.id },
          },
        },
      }),
      prisma.appointment.count({ where: { brokerUserId: req.user.id } }),
      prisma.appointment.count({
        where: {
          brokerUserId: req.user.id,
          status: 'upcoming',
          scheduledAt: { gte: new Date() },
        },
      }),
      prisma.profile.findMany({
        where: { userId: req.user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          religion: { select: { nameEn: true } },
          currentCountry: { select: { nameEn: true } },
          photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
        },
      }),
    ]);

    // Recent interests involving broker's profiles
    const recentInterests = await prisma.interest.findMany({
      where: {
        OR: [
          { senderProfile: { userId: req.user.id } },
          { receiverProfile: { userId: req.user.id } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        senderProfile: { select: { id: true, name: true } },
        receiverProfile: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProfiles,
          verifiedProfiles,
          pendingProfiles,
          totalInterestsSent,
          pendingInterests,
          acceptedInterests,
          totalConversations,
          totalAppointments,
          upcomingAppointments,
        },
        recentProfiles,
        recentInterests,
        brokerProfile: ctx.brokerProfile,
      },
    });
  } catch (error) {
    console.error('[Broker] Dashboard error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to load dashboard.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/broker/clients
// Returns profiles managed by this broker with search/filter/pagination
// ============================================================
export const getBrokerClients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const { page = 1, limit = 20, search, status, gender } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.id, deletedAt: null };
    if (status) where.status = status;
    if (gender) where.gender = gender;
    if (search) {
      const kw = String(search);
      where.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        { cityOrState: { contains: kw, mode: 'insensitive' } },
      ];
    }

    const [profiles, total] = await prisma.$transaction([
      prisma.profile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          religion: { select: { nameEn: true } },
          caste: { select: { nameEn: true } },
          currentCountry: { select: { nameEn: true } },
          occupationDetail: { select: { nameEn: true } },
          educationDetail: { select: { nameEn: true } },
          photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        profiles,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          hasNextPage: skip + Number(limit) < total,
        },
      },
    });
  } catch (error) {
    console.error('[Broker] Get clients error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch clients.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/broker/matches
// Returns interests/matches involving this broker's profiles
// ============================================================
export const getBrokerMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      OR: [
        { senderProfile: { userId: req.user.id } },
        { receiverProfile: { userId: req.user.id } },
      ],
    };
    if (status) where.status = status;

    const [interests, total] = await prisma.$transaction([
      prisma.interest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          senderProfile: {
            select: {
              id: true, name: true, dateOfBirth: true, cityOrState: true, heightCm: true,
              photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
              religion: { select: { nameEn: true } },
            },
          },
          receiverProfile: {
            select: {
              id: true, name: true, dateOfBirth: true, cityOrState: true, heightCm: true,
              photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
              religion: { select: { nameEn: true } },
            },
          },
        },
      }),
      prisma.interest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        interests,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (error) {
    console.error('[Broker] Get matches error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch matches.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/broker/interests
// Returns interests specifically involving broker's profiles (all directions)
// ============================================================
export const getBrokerInterests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const { page = 1, limit = 20, direction, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    if (direction === 'sent') {
      where = { senderProfile: { userId: req.user.id } };
    } else if (direction === 'received') {
      where = { receiverProfile: { userId: req.user.id } };
    } else {
      where = {
        OR: [
          { senderProfile: { userId: req.user.id } },
          { receiverProfile: { userId: req.user.id } },
        ],
      };
    }
    if (status) where.status = status;

    const [interests, total] = await prisma.$transaction([
      prisma.interest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          senderProfile: {
            select: {
              id: true, name: true, dateOfBirth: true,
              photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
            },
          },
          receiverProfile: {
            select: {
              id: true, name: true, dateOfBirth: true,
              photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
            },
          },
        },
      }),
      prisma.interest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        interests,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (error) {
    console.error('[Broker] Get interests error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch interests.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/broker/analytics
// Returns analytics for broker's profiles
// ============================================================
export const getBrokerAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const [
      totalProfiles,
      totalInterestsSent,
      acceptedInterests,
      totalViews,
      monthlyViews,
    ] = await prisma.$transaction([
      prisma.profile.count({ where: { userId: req.user.id, deletedAt: null } }),
      prisma.interest.count({ where: { senderProfile: { userId: req.user.id } } }),
      prisma.interest.count({ where: { senderProfile: { userId: req.user.id }, status: 'accepted' } }),
      prisma.recentView.count({ where: { viewedProfile: { userId: req.user.id } } }),
      // Views per month (last 12 months)
      prisma.recentView.findMany({
        where: {
          viewedProfile: { userId: req.user.id },
          viewedAt: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        },
        select: { viewedAt: true },
      }),
    ]);

    const successRate = totalInterestsSent > 0 ? Math.round((acceptedInterests / totalInterestsSent) * 100) : 0;

    // Build monthly chart data (12 buckets)
    const monthlyData: number[] = Array(12).fill(0);
    monthlyViews.forEach((v) => {
      const month = new Date(v.viewedAt).getMonth();
      monthlyData[month]++;
    });

    // Top performing profiles (most viewed)
    const topProfiles = await prisma.profile.findMany({
      where: { userId: req.user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
        _count: { select: { recentViews: true, interestsReceived: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: { totalProfiles, totalInterestsSent, acceptedInterests, totalViews, successRate },
        monthlyData,
        topProfiles,
      },
    });
  } catch (error) {
    console.error('[Broker] Analytics error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to load analytics.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/broker/appointments
// ============================================================
export const getAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { brokerUserId: req.user.id };
    if (status && status !== 'all') where.status = status;

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { scheduledAt: 'asc' },
        include: {
          clientProfile: {
            select: {
              id: true, name: true,
              photos: { where: { isMain: true }, take: 1, select: { photoUrl: true } },
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (error) {
    console.error('[Broker] Get appointments error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch appointments.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/broker/appointments
// ============================================================
export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const { title, clientProfileId, scheduledAt, type, notes } = req.body;

    if (!title || !scheduledAt) {
      res.status(400).json({ success: false, error: { message: 'Title and scheduled date are required.', code: 'VALIDATION_ERROR' } });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        title,
        brokerUserId: req.user.id,
        clientProfileId: clientProfileId ? Number(clientProfileId) : null,
        scheduledAt: new Date(scheduledAt),
        type: type || 'video_call',
        notes: notes || null,
        status: 'upcoming',
      },
      include: {
        clientProfile: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Appointment created.', data: appointment });
  } catch (error) {
    console.error('[Broker] Create appointment error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create appointment.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// PUT /api/v1/broker/appointments/:id
// ============================================================
export const updateAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  const apptId = parseInt(req.params.id);
  try {
    const existing = await prisma.appointment.findFirst({ where: { id: apptId, brokerUserId: req.user.id } });
    if (!existing) { res.status(404).json({ success: false, error: { message: 'Appointment not found.', code: 'NOT_FOUND' } }); return; }

    const { title, scheduledAt, type, notes, status } = req.body;
    const appointment = await prisma.appointment.update({
      where: { id: apptId },
      data: {
        ...(title && { title }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(type && { type }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });

    res.status(200).json({ success: true, message: 'Appointment updated.', data: appointment });
  } catch (error) {
    console.error('[Broker] Update appointment error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update appointment.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// DELETE /api/v1/broker/appointments/:id
// ============================================================
export const deleteAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  const apptId = parseInt(req.params.id);
  try {
    const existing = await prisma.appointment.findFirst({ where: { id: apptId, brokerUserId: req.user.id } });
    if (!existing) { res.status(404).json({ success: false, error: { message: 'Appointment not found.', code: 'NOT_FOUND' } }); return; }

    await prisma.appointment.delete({ where: { id: apptId } });
    res.status(200).json({ success: true, message: 'Appointment deleted.' });
  } catch (error) {
    console.error('[Broker] Delete appointment error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to delete appointment.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// GET /api/v1/broker/me
// Returns broker's own profile info
// ============================================================
export const getBrokerProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const brokerProfile = await prisma.brokerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, email: true, username: true, phoneNumber: true, createdAt: true } },
      },
    });

    if (!brokerProfile) {
      res.status(404).json({ success: false, error: { message: 'Broker profile not found.', code: 'NOT_FOUND' } });
      return;
    }

    res.status(200).json({ success: true, data: brokerProfile });
  } catch (error) {
    console.error('[Broker] Get profile error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch broker profile.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// PUT /api/v1/broker/me
// Update broker's own profile
// ============================================================
export const updateBrokerProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } }); return; }

  try {
    const { agencyName, whatsappNumber, country, state, officeAddress, websiteUrl, yearsOfExperience } = req.body;

    const brokerProfile = await prisma.brokerProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(agencyName !== undefined && { agencyName }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(country !== undefined && { country }),
        ...(state !== undefined && { state }),
        ...(officeAddress !== undefined && { officeAddress }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
      },
    });

    res.status(200).json({ success: true, message: 'Profile updated.', data: brokerProfile });
  } catch (error) {
    console.error('[Broker] Update profile error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update broker profile.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};
