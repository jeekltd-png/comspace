/**
 * Discovery Controller
 *
 * Platform-wide public directory for finding businesses by location,
 * service type, and category across all tenants.
 *
 * This is the cross-tenant "find near me" layer.
 */
import { RequestHandler } from 'express';
import HealthcareProvider from '../models/healthcare-provider.model';
import WorshipProvider from '../models/worship-provider.model';
import Store from '../models/store.model';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Check if a business is currently open based on its hours array.
 */
function isOpenNow(hours: Array<{ day: number; isOpen: boolean; openTime: string; closeTime: string }>): boolean {
  if (!hours || hours.length === 0) return false;
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todayHours = hours.find(h => h.day === currentDay);
  if (!todayHours || !todayHours.isOpen) return false;
  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
}

// ── Public Discovery ─────────────────────────────────────────

/**
 * GET /api/discover
 *
 * Query params:
 *   lat, lng        — user coordinates (required for distance sorting)
 *   radius          — max distance in meters (default 10000 = 10 km)
 *   type            — space preset / category filter (e.g. "healthcare", "salon", "food-store")
 *   subType         — sub-category (e.g. "dental", "clinic")
 *   service         — service tag search term
 *   search          — free-text search (name, tags)
 *   openNow         — "true" to filter to currently open
 *   page, limit     — pagination
 */
export const discover: RequestHandler = async (req, res, next) => {
  try {
    const {
      lat, lng, radius = 10000,
      type, subType,
      service, search,
      openNow,
      page = 1, limit = 20,
    } = req.query;

    const limitNum = Math.min(Number(limit) || 20, 50);
    const skip = (Number(page) - 1) * limitNum;
    const results: any[] = [];
    let total = 0;

    const hasCoords = lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng));

    // ─── Healthcare Providers ──────────────────────────────────
    if (!type || type === 'healthcare') {
      const hFilter: any = { isActive: true, isDiscoverable: true };
      if (subType) hFilter.subType = subType;
      if (service) {
        hFilter.$or = [
          { serviceTags: { $regex: service, $options: 'i' } },
          { specialties: { $regex: service, $options: 'i' } },
        ];
      }
      if (search) {
        const searchOr = [
          { name: { $regex: search, $options: 'i' } },
          { specialties: { $regex: search, $options: 'i' } },
          { serviceTags: { $regex: search, $options: 'i' } },
        ];
        hFilter.$or = hFilter.$or ? [...hFilter.$or, ...searchOr] : searchOr;
      }

      if (hasCoords) {
        // Use $geoNear aggregation for distance calculation
        const pipeline: any[] = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
              distanceField: 'distance',
              maxDistance: Number(radius),
              spherical: true,
              query: hFilter,
            },
          },
          { $sort: { distance: 1, rating: -1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $addFields: {
              _source: 'healthcare',
              _distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] },
            },
          },
        ];

        const [items, countResult] = await Promise.all([
          HealthcareProvider.aggregate(pipeline),
          HealthcareProvider.aggregate([
            {
              $geoNear: {
                near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
                distanceField: 'distance',
                maxDistance: Number(radius),
                spherical: true,
                query: hFilter,
              },
            },
            { $count: 'total' },
          ]),
        ]);

        results.push(...items);
        total += countResult[0]?.total || 0;
      } else {
        // No coordinates — simple find
        const [items, count] = await Promise.all([
          HealthcareProvider.find(hFilter)
            .sort('-rating name')
            .skip(skip)
            .limit(limitNum)
            .lean()
            .then(docs => docs.map(d => ({ ...d, _source: 'healthcare' }))),
          HealthcareProvider.countDocuments(hFilter),
        ]);
        results.push(...items);
        total += count;
      }
    }

    // ─── Worship Providers ─────────────────────────────────────
    if (!type || type === 'worship') {
      const wFilter: any = { isActive: true, isDiscoverable: true };
      if (subType) wFilter.subType = subType;
      if (service) {
        wFilter.$or = [
          { serviceTags: { $regex: service, $options: 'i' } },
          { ministries: { $regex: service, $options: 'i' } },
        ];
      }
      if (search) {
        const searchOr = [
          { name: { $regex: search, $options: 'i' } },
          { denomination: { $regex: search, $options: 'i' } },
          { ministries: { $regex: search, $options: 'i' } },
          { serviceTags: { $regex: search, $options: 'i' } },
        ];
        wFilter.$or = wFilter.$or ? [...wFilter.$or, ...searchOr] : searchOr;
      }

      if (hasCoords) {
        const pipeline: any[] = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
              distanceField: 'distance',
              maxDistance: Number(radius),
              spherical: true,
              query: wFilter,
            },
          },
          { $sort: { distance: 1, rating: -1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $addFields: {
              _source: 'worship',
              _distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] },
            },
          },
        ];

        const [items, countResult] = await Promise.all([
          WorshipProvider.aggregate(pipeline),
          WorshipProvider.aggregate([
            {
              $geoNear: {
                near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
                distanceField: 'distance',
                maxDistance: Number(radius),
                spherical: true,
                query: wFilter,
              },
            },
            { $count: 'total' },
          ]),
        ]);

        results.push(...items);
        total += countResult[0]?.total || 0;
      } else {
        const [items, count] = await Promise.all([
          WorshipProvider.find(wFilter)
            .sort('-rating name')
            .skip(skip)
            .limit(limitNum)
            .lean()
            .then(docs => docs.map(d => ({ ...d, _source: 'worship' }))),
          WorshipProvider.countDocuments(wFilter),
        ]);
        results.push(...items);
        total += count;
      }
    }

    // ─── Stores (all other verticals) ──────────────────────────
    if (!type || (type !== 'healthcare' && type !== 'worship')) {
      const sFilter: any = { isActive: true, isDiscoverable: true };
      if (type) sFilter.spacePreset = type;
      if (service) {
        sFilter.serviceTags = { $regex: service, $options: 'i' };
      }
      if (search) {
        sFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { serviceTags: { $regex: search, $options: 'i' } },
        ];
      }

      if (hasCoords) {
        const pipeline: any[] = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
              distanceField: 'distance',
              maxDistance: Number(radius),
              spherical: true,
              query: sFilter,
            },
          },
          { $sort: { distance: 1, rating: -1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $addFields: {
              _source: 'store',
              _distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] },
            },
          },
        ];

        const [items, countResult] = await Promise.all([
          Store.aggregate(pipeline),
          Store.aggregate([
            {
              $geoNear: {
                near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
                distanceField: 'distance',
                maxDistance: Number(radius),
                spherical: true,
                query: sFilter,
              },
            },
            { $count: 'total' },
          ]),
        ]);

        results.push(...items);
        total += countResult[0]?.total || 0;
      } else {
        const [items, count] = await Promise.all([
          Store.find(sFilter)
            .sort('-rating name')
            .skip(skip)
            .limit(limitNum)
            .lean()
            .then(docs => docs.map(d => ({ ...d, _source: 'store' }))),
          Store.countDocuments(sFilter),
        ]);
        results.push(...items);
        total += count;
      }
    }

    // ─── Optional: filter open now ─────────────────────────────
    let filtered = results;
    if (openNow === 'true') {
      filtered = results.filter(r => isOpenNow(r.hours));
    }

    // Sort combined results by distance if available
    if (hasCoords) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    res.status(200).json({
      success: true,
      data: {
        results: filtered,
        pagination: {
          page: Number(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/discover/categories
 *
 * Returns available discovery categories (space presets + healthcare sub-types).
 */
export const getDiscoverCategories: RequestHandler = async (_req, res, next) => {
  try {
    const [storePresets, healthSubTypes, worshipSubTypes] = await Promise.all([
      Store.distinct('spacePreset', { isActive: true, isDiscoverable: true }),
      HealthcareProvider.distinct('subType', { isActive: true, isDiscoverable: true }),
      WorshipProvider.distinct('subType', { isActive: true, isDiscoverable: true }),
    ]);

    const categories = [
      ...storePresets.filter(Boolean).map((p: string) => ({ type: p, source: 'store' })),
      ...healthSubTypes.filter(Boolean).map((s: string) => ({ type: 'healthcare', subType: s, source: 'healthcare' })),
      ...worshipSubTypes.filter(Boolean).map((s: string) => ({ type: 'worship', subType: s, source: 'worship' })),
    ];

    res.status(200).json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
};
